import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const contractTypes = ["FREELANCE", "CDI", "CDD", "STAGE"] as const;
const statuses = ["ACTIVE", "CLOSED", "DRAFT"] as const;

const requiredQuizSchema = z.array(z.object({
  skill: z.string(),
  minScore: z.number().int().min(0).max(100),
})).optional();

const createJobOfferSchema = z.object({
  title: z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères."),
  description: z.string().trim().min(10, "La description doit contenir au moins 10 caractères."),
  location: z.string().trim().optional().nullable(),
  company: z.string().trim().optional(),
  remote: z.boolean().optional(),
  contractType: z.enum(contractTypes).optional(),
  tjm: z.union([z.number().int().nonnegative(), z.string().trim()]).optional().nullable(),
  salaryMin: z.union([z.number().int().nonnegative(), z.string().trim()]).optional().nullable(),
  salaryMax: z.union([z.number().int().nonnegative(), z.string().trim()]).optional().nullable(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  requiredQuizzes: requiredQuizSchema,
  status: z.enum(statuses).optional(),
});

const updateJobOfferSchema = createJobOfferSchema.partial();

function parseOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean);
      }
    } catch {
      return value.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseStoredTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type RequiredQuiz = { skill: string; minScore: number };

function parseRequiredQuizzes(value: string): RequiredQuiz[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatJobWithQuizzes(job: any) {
  return {
    ...job,
    tags: parseStoredTags(job.tags ?? "[]"),
    requiredQuizzes: parseRequiredQuizzes(job.requiredQuizzes ?? "[]"),
  };
}

/**
 * Background: notify candidates whose skills overlap with the job's tags.
 * Errors are swallowed so they never break the recruiter request.
 */
async function notifyMatchingCandidates(
  jobId: string,
  jobTitle: string,
  company: string,
  tags: string[]
): Promise<void> {
  try {
    if (tags.length === 0) return;
    const tagsLower = tags.map((t) => t.toLowerCase());
    const candidates = await prisma.profileCandidat.findMany({
      where: { status: "PUBLISHED" },
      select: { userId: true, skills: true },
    });
    for (const c of candidates) {
      let skills: string[] = [];
      try {
        const parsed = JSON.parse(c.skills);
        if (Array.isArray(parsed)) skills = parsed.map((s) => String(s).toLowerCase());
      } catch { /* skip */ }
      if (skills.length === 0) continue;
      if (!skills.some((s) => tagsLower.includes(s))) continue;
      await prisma.notification.create({
        data: {
          userId: c.userId,
          type: "JOB_MATCH",
          title: "🚀 Nouvelle offre qui matche votre profil",
          message: `${jobTitle} — ${company}`,
          metadata: JSON.stringify({ jobId }),
        },
      });
    }
  } catch (err) {
    console.error("[Jobs] notifyMatchingCandidates error:", err);
  }
}

/**
 * POST /api/jobs
 * Create a new job offer (recruiter only).
 */
export async function createJobOffer(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    // Get recruiter profile to retrieve company name
    const recruiterProfile = await prisma.profileRecruteur.findUnique({
      where: { userId },
    });

    const validation = createJobOfferSchema.safeParse(req.body);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const firstError =
        Object.values(fieldErrors).flat().find((m) => typeof m === "string") ||
        "Données invalides.";
      res.status(400).json({
        success: false,
        message: firstError as string,
        errors: fieldErrors,
      });
      return;
    }

    const {
      title,
      description,
      location,
      company: inputCompany,
      remote = false,
      contractType = "FREELANCE",
      tjm,
      salaryMin,
      salaryMax,
      tags = [],
      requiredQuizzes = [],
      status = "ACTIVE",
    } = validation.data;

    const company = inputCompany || recruiterProfile?.company || "Entreprise";

    const createData = {
      recruiterId: userId,
      title,
      company,
      description,
      location: (location && location.trim()) || "Non précisé",
      remote: Boolean(remote),
      contractType,
      tjm: parseOptionalInt(tjm),
      salaryMin: parseOptionalInt(salaryMin),
      salaryMax: parseOptionalInt(salaryMax),
      tags: JSON.stringify(normalizeTags(tags)),
      requiredQuizzes: JSON.stringify(requiredQuizzes || []),
      status,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobOffer = await prisma.jobOffer.create({
      data: createData as any,
      include: {
        recruiter: {
          select: { email: true },
        },
      },
    });

    // Fire-and-forget: notify matching candidates if the offer is ACTIVE.
    if (jobOffer.status === "ACTIVE") {
      void notifyMatchingCandidates(jobOffer.id, jobOffer.title, jobOffer.company, parseStoredTags(jobOffer.tags));
    }

    res.status(201).json({
      success: true,
      message: "Offre créée avec succès.",
      data: formatJobWithQuizzes(jobOffer as Parameters<typeof formatJobWithQuizzes>[0]),
    });
  } catch (error) {
    console.error("[Jobs] Create error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur lors de la création de l'offre.";
    res.status(500).json({
      success: false,
      message: `Erreur serveur: ${message}`,
    });
  }
}

/**
 * GET /api/jobs
 * Get all active job offers with optional filtering.
 * Query params: search, location, contractType, remote, tags
 */
export async function getJobOffers(req: Request, res: Response): Promise<void> {
  try {
    const { search, location, contractType, remote, tags, limit } = req.query;

    // Build where clause
    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    if (location && typeof location === "string") {
      where.location = { contains: location };
    }

    if (contractType && typeof contractType === "string") {
      where.contractType = contractType;
    }

    if (remote === "true") {
      where.remote = true;
    }

    const jobOffers = await prisma.jobOffer.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      include: {
        recruiter: {
          select: {
            email: true,
            profileRecruteur: {
              select: { id: true, company: true, firstName: true, lastName: true, verificationStatus: true },
            },
          },
        },
      },
    });

    // Post-process: apply text search and tags filter in JS (SQLite limitation)
    let results = jobOffers.map((job) => formatJobWithQuizzes(job as Parameters<typeof formatJobWithQuizzes>[0]));

    // Filter by search keyword
    if (search && typeof search === "string") {
      const q = search.toLowerCase();
      results = results.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.description.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.tags.some((tag: string) => tag.toLowerCase().includes(q))
      );
    }

    // Filter by tags
    if (tags && typeof tags === "string") {
      const filterTags = tags.split(",").map((t) => t.trim().toLowerCase());
      results = results.filter((job) =>
        filterTags.some((ft) =>
          job.tags.some((jt: string) => jt.toLowerCase().includes(ft))
        )
      );
    }

    const limitNum = limit ? Math.min(parseInt(String(limit), 10) || 50, 100) : undefined;
    const paginated = limitNum ? results.slice(0, limitNum) : results;

    res.json({
      success: true,
      data: {
        jobs: paginated,
        total: results.length,
      },
    });
  } catch (error) {
    console.error("[Jobs] Get error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des offres.",
    });
  }
}

/**
 * GET /api/jobs/mine
 * Get the authenticated recruiter's job offers.
 */
export async function getMyJobOffers(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const jobOffers = await prisma.jobOffer.findMany({
      where: { recruiterId: userId },
      orderBy: { createdAt: "desc" },
    });

    const results = jobOffers.map((job) => formatJobWithQuizzes(job as Parameters<typeof formatJobWithQuizzes>[0]));

    res.json({
      success: true,
      data: {
        jobs: results,
        total: results.length,
      },
    });
  } catch (error) {
    console.error("[Jobs] GetMine error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos offres.",
    });
  }
}

/**
 * GET /api/jobs/:id
 * Get a single active job offer (public).
 */
export async function getJobOfferById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const job = await prisma.jobOffer.findUnique({
      where: { id },
      include: {
        recruiter: {
          select: {
            email: true,
            profileRecruteur: {
              select: { company: true, firstName: true, lastName: true, website: true, avatarUrl: true, description: true, sector: true, verificationStatus: true },
            },
          },
        },
      },
    });
    if (!job) {
      res.status(404).json({ success: false, message: "Offre non trouvée." });
      return;
    }
    res.json({ success: true, data: formatJobWithQuizzes(job as Parameters<typeof formatJobWithQuizzes>[0]) });
  } catch (error) {
    console.error("[Jobs] GetById error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération de l'offre." });
  }
}

/**
 * PUT /api/jobs/:id
 * Update a job offer (owner only).
 */
export async function updateJobOffer(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const jobId = req.params.id as string;

    // Check ownership
    const existing = await prisma.jobOffer.findUnique({ where: { id: jobId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Offre non trouvée." });
      return;
    }
    if (existing.recruiterId !== userId) {
      res.status(403).json({ success: false, message: "Vous ne pouvez modifier que vos propres offres." });
      return;
    }

    const validation = updateJobOfferSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { title, description, location, remote, contractType, tjm, salaryMin, salaryMax, tags, requiredQuizzes, status } = validation.data;

    const updated = await prisma.jobOffer.update({
      where: { id: jobId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location: (location && location.trim()) || "Non précisé" }),
        ...(remote !== undefined && { remote: Boolean(remote) }),
        ...(contractType !== undefined && { contractType }),
        ...(tjm !== undefined && { tjm: parseOptionalInt(tjm) }),
        ...(salaryMin !== undefined && { salaryMin: parseOptionalInt(salaryMin) }),
        ...(salaryMax !== undefined && { salaryMax: parseOptionalInt(salaryMax) }),
        ...(tags !== undefined && { tags: JSON.stringify(normalizeTags(tags)) }),
        ...(requiredQuizzes !== undefined && { requiredQuizzes: JSON.stringify(requiredQuizzes || []) } as Record<string, unknown>),
        ...(status !== undefined && { status }),
      },
    });

    res.json({
      success: true,
      message: "Offre mise à jour.",
      data: formatJobWithQuizzes(updated as Parameters<typeof formatJobWithQuizzes>[0]),
    });
  } catch (error) {
    console.error("[Jobs] Update error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'offre.",
    });
  }
}

/**
 * DELETE /api/jobs/:id
 * Delete a job offer (owner only).
 */
export async function deleteJobOffer(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const jobId = req.params.id as string;

    const existing = await prisma.jobOffer.findUnique({ where: { id: jobId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Offre non trouvée." });
      return;
    }
    if (existing.recruiterId !== userId) {
      res.status(403).json({ success: false, message: "Vous ne pouvez supprimer que vos propres offres." });
      return;
    }

    await prisma.jobOffer.delete({ where: { id: jobId } });

    res.json({
      success: true,
      message: "Offre supprimée.",
    });
  } catch (error) {
    console.error("[Jobs] Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'offre.",
    });
  }
}
