import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isPreparedStatementPoolError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("prepared statement") &&
    (message.includes("does not exist") || message.includes("already exists"))
  );
}

async function withPreparedStatementRetry<T>(query: () => Promise<T>): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (!isPreparedStatementPoolError(error)) {
      throw error;
    }

    console.warn("[PROFILES] Retrying query after prepared-statement error");
    await prisma.$disconnect();
    return query();
  }
}

/**
 * Helper: skills are stored as JSON string in SQLite
 */
function parseSkills(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function serializeSkills(raw: unknown): string {
  if (Array.isArray(raw)) {
    return JSON.stringify(raw.filter((s): s is string => typeof s === "string"));
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.filter((s): s is string => typeof s === "string"));
      }
    } catch {
      return JSON.stringify(raw.split(",").map((s) => s.trim()).filter(Boolean));
    }
  }
  return "[]";
}

/**
 * POST /api/profiles
 * Create or update a candidate profile in SQLite via Prisma
 */
export async function createPublicProfile(req: Request, res: Response): Promise<void> {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ success: false, message: "Accès non autorisé." });
      return;
    }
    if (authUser.role !== "CANDIDAT") {
      res.status(403).json({ success: false, message: "Seuls les candidats peuvent publier un profil candidat." });
      return;
    }

    const {
      firstName, lastName, phone, title, bio,
      skills, yearsOfExperience, availability,
      portfolioUrl, tjm, location, linkedIn,
    } = req.body;

    if (!firstName || !lastName) {
      res.status(400).json({ success: false, message: "Prénom et nom requis." });
      return;
    }

    // Build skills JSON string
    const skillsJson = serializeSkills(skills);
    const yoe = typeof yearsOfExperience === "number" ? yearsOfExperience : (yearsOfExperience ? parseInt(yearsOfExperience) : null);
    const tjmVal = typeof tjm === "number" ? tjm : (tjm ? parseInt(tjm) : null);
    const avail = availability || "DISPONIBLE";

    // Upsert profile
    const profile = await withPreparedStatementRetry(() => prisma.profileCandidat.upsert({
      where: { userId: authUser.userId },
      update: {
        firstName, lastName, title, bio,
        skills: skillsJson,
        yearsOfExperience: yoe,
        availability: avail,
        portfolioUrl, tjm: tjmVal,
        location, phone, linkedIn,
      },
      create: {
        userId: authUser.userId,
        firstName, lastName, title, bio,
        skills: skillsJson,
        yearsOfExperience: yoe,
        availability: avail,
        portfolioUrl, tjm: tjmVal,
        location, phone, linkedIn,
      },
    }));

    // Return with parsed skills array
    res.json({
      success: true,
      message: "Profil publié avec succès !",
      data: { ...profile, skills: parseSkills(profile.skills) },
    });
  } catch (error) {
    console.error("[PROFILES] CreatePublicProfile error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la sauvegarde." });
  }
}

/**
 * GET /api/profiles
 * List candidates from SQLite with filtering
 */
export async function listPublicProfiles(req: Request, res: Response): Promise<void> {
  try {
    const { skills, availability, location, search, minExperience, maxExperience } = req.query;

    // Build Prisma where clause
    const where: any = {};

    // Experience range
    if (minExperience) {
      where.yearsOfExperience = { ...where.yearsOfExperience, gte: parseInt(minExperience as string) };
    }
    if (maxExperience && parseInt(maxExperience as string) < 20) {
      where.yearsOfExperience = { ...where.yearsOfExperience, lte: parseInt(maxExperience as string) };
    }

    // Availability filter
    if (availability && typeof availability === "string") {
      const availList = availability.split(",").map((a) => a.trim()).filter(Boolean);
      if (availList.length > 0) {
        where.availability = { in: availList };
      }
    }

    // Location filter (contains, case-insensitive)
    if (location && typeof location === "string") {
      where.location = { contains: location };
    }

    // Text search (name, title)
    if (search && typeof search === "string") {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { title: { contains: search } },
      ];
    }

    // Fetch from DB
    const profiles = await withPreparedStatementRetry(() => prisma.profileCandidat.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 50,
    }));

    // Parse skills JSON and apply skills filter (post-query for SQLite)
    let results = profiles.map((p) => ({
      ...p,
      skills: parseSkills(p.skills),
    }));

    // Skills filter (SQLite doesn't support array contains, so filter in JS)
    if (skills && typeof skills === "string") {
      const skillList = skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (skillList.length > 0) {
        results = results.filter((c) =>
          skillList.some((s) => c.skills.map((cs) => cs.toLowerCase()).includes(s))
        );
      }
    }

    res.json({
      success: true,
      data: {
        candidates: results,
        pagination: { page: 1, limit: 50, total: results.length, totalPages: 1 },
      },
    });
  } catch (error) {
    console.error("[PROFILES] ListPublicProfiles error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la recherche." });
  }
}