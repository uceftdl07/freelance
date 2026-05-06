import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

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

    const {
      title,
      description,
      location,
      remote = false,
      contractType = "FREELANCE",
      tjm,
      salaryMin,
      salaryMax,
      tags = [],
      status = "ACTIVE",
    } = req.body;

    // Validation
    if (!title || !description || !location) {
      res.status(400).json({
        success: false,
        message: "Titre, description et localisation sont requis.",
      });
      return;
    }

    const company = req.body.company || recruiterProfile?.company || "Entreprise";

    const jobOffer = await prisma.jobOffer.create({
      data: {
        recruiterId: userId,
        title,
        company,
        description,
        location,
        remote: Boolean(remote),
        contractType,
        tjm: tjm ? parseInt(tjm, 10) : null,
        salaryMin: salaryMin ? parseInt(salaryMin, 10) : null,
        salaryMax: salaryMax ? parseInt(salaryMax, 10) : null,
        tags: JSON.stringify(tags),
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
        tags: JSON.parse(jobOffer.tags),
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
      tags: JSON.parse(job.tags),
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
      tags: JSON.parse(job.tags),
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

    const { title, description, location, remote, contractType, tjm, salaryMin, salaryMax, tags, status } = req.body;

    const updated = await prisma.jobOffer.update({
      where: { id: jobId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(remote !== undefined && { remote: Boolean(remote) }),
        ...(contractType !== undefined && { contractType }),
        ...(tjm !== undefined && { tjm: tjm ? parseInt(tjm, 10) : null }),
        ...(salaryMin !== undefined && { salaryMin: salaryMin ? parseInt(salaryMin, 10) : null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax ? parseInt(salaryMax, 10) : null }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(status !== undefined && { status }),
      },
    });

    res.json({
      success: true,
      message: "Offre mise à jour.",
      data: { ...updated, tags: JSON.parse(updated.tags) },
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
