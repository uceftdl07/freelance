import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const BADGE_TYPES = [
  "MISSION_REUSSIE",
  "LIVRAISON_RAPIDE",
  "LONG_TERME",
  "EXPERT_TECHNIQUE",
  "BON_COMMUNICANT",
] as const;

const createReviewSchema = z.object({
  toUserId: z.string().min(1),
  applicationId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  badges: z.array(z.enum(BADGE_TYPES)).max(3).optional().default([]),
});

function parseBadges(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function computeReputationScore(reviews: { rating: number }[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 20); // convert 1-5 → 0-100
}

function computeBadgeCounts(reviews: { badges: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of reviews) {
    for (const b of parseBadges(r.badges)) {
      counts[b] = (counts[b] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * POST /api/reviews
 * Submit a review for another user (recruiter→candidate or candidate→recruiter).
 */
export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const fromUserId = req.user!.userId;
    const fromRole = req.user!.role;

    const validation = createReviewSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { toUserId, applicationId, rating, comment, badges } = validation.data;

    if (fromUserId === toUserId) {
      res.status(400).json({ success: false, message: "Vous ne pouvez pas vous évaluer vous-même." });
      return;
    }

    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) {
      res.status(404).json({ success: false, message: "Utilisateur introuvable." });
      return;
    }

    // Determine review type based on roles
    const type =
      fromRole === "RECRUTEUR" ? "RECRUTEUR_TO_CANDIDAT" : "CANDIDAT_TO_RECRUTEUR";

    // If applicationId provided, verify both parties are part of it
    if (applicationId) {
      const app = await prisma.application.findUnique({ where: { id: applicationId } });
      if (!app) {
        res.status(404).json({ success: false, message: "Candidature introuvable." });
        return;
      }

      const isCandidate = app.candidateId === fromUserId || app.candidateId === toUserId;
      const job = await prisma.jobOffer.findUnique({ where: { id: app.jobId } });
      const isRecruiter = job?.recruiterId === fromUserId || job?.recruiterId === toUserId;

      if (!isCandidate || !isRecruiter) {
        res.status(403).json({ success: false, message: "Vous n'êtes pas lié à cette candidature." });
        return;
      }

      // Only allow review if application was accepted
      if (app.status !== "ACCEPTED") {
        res.status(400).json({
          success: false,
          message: "Vous ne pouvez laisser un avis que pour une candidature acceptée.",
        });
        return;
      }
    }

    const review = await prisma.review.create({
      data: {
        fromUserId,
        toUserId,
        applicationId: applicationId ?? null,
        rating,
        comment: comment ?? null,
        type,
        badges: JSON.stringify(badges),
      },
      include: {
        from: {
          select: {
            id: true,
            role: true,
            profileCandidat: { select: { firstName: true, lastName: true, avatarUrl: true } },
            profileRecruteur: { select: { firstName: true, lastName: true, company: true, avatarUrl: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Avis soumis avec succès.",
      data: { ...review, badges: parseBadges(review.badges) },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      res.status(409).json({
        success: false,
        message: "Vous avez déjà soumis un avis pour cette candidature.",
      });
      return;
    }
    console.error("[Reviews] Create error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la soumission de l'avis." });
  }
}

/**
 * GET /api/reviews/user/:userId
 * Get all reviews received by a user + reputation score + badges.
 */
export async function getUserReviews(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;

    const reviews = await prisma.review.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        from: {
          select: {
            id: true,
            role: true,
            profileCandidat: { select: { firstName: true, lastName: true, avatarUrl: true } },
            profileRecruteur: { select: { firstName: true, lastName: true, company: true, avatarUrl: true } },
          },
        },
      },
    });

    const parsed = reviews.map((r) => ({ ...r, badges: parseBadges(r.badges) }));
    const score = computeReputationScore(reviews);
    const badgeCounts = computeBadgeCounts(reviews);

    res.json({
      success: true,
      data: {
        reviews: parsed,
        total: reviews.length,
        score,
        badgeCounts,
      },
    });
  } catch (error) {
    console.error("[Reviews] GetUser error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération des avis." });
  }
}

/**
 * GET /api/reviews/can-review/:applicationId
 * Check if the current user can leave a review for this application.
 */
export async function canReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const applicationId = req.params.applicationId as string;

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { select: { recruiterId: true } } },
    });

    if (!app) {
      res.status(404).json({ success: false, message: "Candidature introuvable." });
      return;
    }

    const recruiterId = (app as typeof app & { job: { recruiterId: string } }).job.recruiterId;
    const isParty = app.candidateId === userId || recruiterId === userId;
    if (!isParty) {
      res.json({ success: true, data: { canReview: false } });
      return;
    }

    if (app.status !== "ACCEPTED") {
      res.json({ success: true, data: { canReview: false, reason: "application_not_accepted" } });
      return;
    }

    const existing = await prisma.review.findFirst({
      where: { fromUserId: userId, applicationId: applicationId },
    });

    res.json({
      success: true,
      data: {
        canReview: !existing,
        alreadyReviewed: !!existing,
        targetUserId: app.candidateId === userId ? recruiterId : app.candidateId,
      },
    });
  } catch (error) {
    console.error("[Reviews] CanReview error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}
