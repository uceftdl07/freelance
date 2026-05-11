import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const APPLICATION_STATUSES = [
  "PENDING",
  "REVIEW",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

const createApplicationSchema = z.object({
  jobId: z.string().trim().min(1, "jobId est requis."),
  coverLetter: z.string().trim().max(5000).optional().nullable(),
  cvUrl: z.string().trim().max(2000).optional().nullable(),
});

const updateApplicationSchema = z.object({
  coverLetter: z.string().trim().max(5000).optional().nullable(),
  cvUrl: z.string().trim().max(2000).optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

function parseStoredTags(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * POST /api/applications
 * Candidate applies to a job offer.
 */
export async function createApplication(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.user!.userId;

    const validation = createApplicationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { jobId, coverLetter, cvUrl } = validation.data;

    const job = await prisma.jobOffer.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ success: false, message: "Offre non trouvée." });
      return;
    }
    if (job.status !== "ACTIVE") {
      res.status(400).json({ success: false, message: "Cette offre n'est plus active." });
      return;
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId } },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        message: "Vous avez déjà postulé à cette offre.",
      });
      return;
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId,
        coverLetter: coverLetter || null,
        cvUrl: cvUrl || null,
        status: "PENDING",
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            tags: true,
            recruiterId: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Candidature envoyée avec succès.",
      data: {
        ...application,
        job: { ...application.job, tags: parseStoredTags(application.job.tags) },
      },
    });
  } catch (error) {
    console.error("[Applications] Create error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de la candidature.",
    });
  }
}

/**
 * GET /api/applications/mine
 * Candidate lists their own applications.
 */
export async function getMyApplications(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.user!.userId;

    const applications = await prisma.application.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            tags: true,
            tjm: true,
            contractType: true,
            status: true,
          },
        },
      },
    });

    const data = applications.map((a) => ({
      ...a,
      job: { ...a.job, tags: parseStoredTags(a.job.tags) },
    }));

    res.json({
      success: true,
      data: { applications: data, total: data.length },
    });
  } catch (error) {
    console.error("[Applications] GetMine error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos candidatures.",
    });
  }
}

/**
 * GET /api/applications/job/:jobId
 * Recruiter lists applications received for one of their jobs.
 */
export async function getApplicationsForJob(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const jobId = req.params.jobId as string;

    const job = await prisma.jobOffer.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ success: false, message: "Offre non trouvée." });
      return;
    }
    if (job.recruiterId !== userId) {
      res.status(403).json({
        success: false,
        message: "Vous ne pouvez consulter que les candidatures de vos offres.",
      });
      return;
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            profileCandidat: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                title: true,
                avatarUrl: true,
                skills: true,
                tjm: true,
                location: true,
                yearsOfExperience: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: { applications, total: applications.length },
    });
  } catch (error) {
    console.error("[Applications] GetForJob error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des candidatures.",
    });
  }
}

/**
 * PATCH /api/applications/:id
 * Candidate updates their own pending application (cover letter / CV).
 */
export async function updateApplication(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Candidature non trouvée." });
      return;
    }
    if (existing.candidateId !== candidateId) {
      res.status(403).json({
        success: false,
        message: "Vous ne pouvez modifier que vos propres candidatures.",
      });
      return;
    }
    if (existing.status !== "PENDING") {
      res.status(400).json({
        success: false,
        message: "Cette candidature ne peut plus être modifiée.",
      });
      return;
    }

    const validation = updateApplicationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { coverLetter, cvUrl } = validation.data;
    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(coverLetter !== undefined && { coverLetter: coverLetter || null }),
        ...(cvUrl !== undefined && { cvUrl: cvUrl || null }),
      },
    });

    res.json({
      success: true,
      message: "Candidature mise à jour.",
      data: updated,
    });
  } catch (error) {
    console.error("[Applications] Update error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la candidature.",
    });
  }
}

/**
 * DELETE /api/applications/:id
 * Candidate withdraws their application.
 */
export async function deleteApplication(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Candidature non trouvée." });
      return;
    }
    if (existing.candidateId !== candidateId) {
      res.status(403).json({
        success: false,
        message: "Vous ne pouvez retirer que vos propres candidatures.",
      });
      return;
    }

    await prisma.application.delete({ where: { id } });

    res.json({ success: true, message: "Candidature retirée." });
  } catch (error) {
    console.error("[Applications] Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du retrait de la candidature.",
    });
  }
}

/**
 * PATCH /api/applications/:id/status
 * Recruiter updates the status of an application on one of their jobs.
 */
export async function updateApplicationStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const validation = updateStatusSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Statut invalide.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const existing = await prisma.application.findUnique({
      where: { id },
      include: { job: { select: { recruiterId: true } } },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: "Candidature non trouvée." });
      return;
    }
    if (existing.job.recruiterId !== userId) {
      res.status(403).json({
        success: false,
        message: "Vous ne pouvez modifier que les candidatures de vos offres.",
      });
      return;
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: validation.data.status },
    });

    res.json({
      success: true,
      message: "Statut mis à jour.",
      data: updated,
    });
  } catch (error) {
    console.error("[Applications] UpdateStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut.",
    });
  }
}

