import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const contractTypes = ["FREELANCE", "CDI", "CDD", "STAGE"] as const;
const statuses = ["ACTIVE", "CLOSED", "DRAFT"] as const;

const createJobOfferSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().min(10),
  location: z.string().trim().min(2),
  company: z.string().trim().optional(),
  remote: z.boolean().optional(),
  contractType: z.enum(contractTypes).optional(),
  tjm: z.union([z.number().int().nonnegative(), z.string().trim()]).optional().nullable(),
  salaryMin: z.union([z.number().int().nonnegative(), z.string().trim()]).optional().nullable(),
  salaryMax: z.union([z.number().int().nonnegative(), z.string().trim()]).optional().nullable(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
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
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
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
      status = "ACTIVE",
    } = validation.data;

    const company = inputCompany || recruiterProfile?.company || "Entreprise";

    const jobOffer = await prisma.jobOffer.create({
      data: {
        recruiterId: userId,
        title,
        company,
        description,
        location,
        remote: Boolean(remote),
        contractType,
        tjm: parseOptionalInt(tjm),
        salaryMin: parseOptionalInt(salaryMin),
        salaryMax: parseOptionalInt(salaryMax),
        tags: JSON.stringify(normalizeTags(tags)),
        status,
      },
      include: {
        recruiter: {
          select: { email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Offre créée avec succès.",
      data: {
        ...jobOffer,
        tags: parseStoredTags(jobOffer.tags),
      },
    });
  } catch (error) {
    console.error("[Jobs] Create error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'offre.",
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
    const { search, location, contractType, remote, tags } = req.query;

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
              select: { company: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Post-process: apply text search and tags filter in JS (SQLite limitation)
    let results = jobOffers.map((job) => ({
      ...job,
      tags: parseStoredTags(job.tags),
    }));

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

    res.json({
      success: true,
      data: {
        jobs: results,
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

    const results = jobOffers.map((job) => ({
      ...job,
      tags: parseStoredTags(job.tags),
    }));

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

    const { title, description, location, remote, contractType, tjm, salaryMin, salaryMax, tags, status } = validation.data;

    const updated = await prisma.jobOffer.update({
      where: { id: jobId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(remote !== undefined && { remote: Boolean(remote) }),
        ...(contractType !== undefined && { contractType }),
        ...(tjm !== undefined && { tjm: parseOptionalInt(tjm) }),
        ...(salaryMin !== undefined && { salaryMin: parseOptionalInt(salaryMin) }),
        ...(salaryMax !== undefined && { salaryMax: parseOptionalInt(salaryMax) }),
        ...(tags !== undefined && { tags: JSON.stringify(normalizeTags(tags)) }),
        ...(status !== undefined && { status }),
      },
    });

    res.json({
      success: true,
      message: "Offre mise à jour.",
      data: { ...updated, tags: parseStoredTags(updated.tags) },
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
