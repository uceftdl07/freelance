import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

/**
 * Helper: skills are stored as JSON string in SQLite
 */
function parseSkills(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

/**
 * POST /api/profiles
 * Create or update a candidate profile in SQLite via Prisma
 */
export async function createPublicProfile(req: Request, res: Response): Promise<void> {
  try {
    const {
      firstName, lastName, email, phone, title, bio,
      skills, yearsOfExperience, availability,
      portfolioUrl, tjm, location, linkedIn,
    } = req.body;

    if (!firstName || !lastName) {
      res.status(400).json({ success: false, message: "Prénom et nom requis." });
      return;
    }

    // Find or create user
    const userEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@freelanceit.demo`;
    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          password: "demo-profile",
          role: "CANDIDAT",
        },
      });
    }

    // Build skills JSON string
    const skillsJson = JSON.stringify(Array.isArray(skills) ? skills : []);
    const yoe = typeof yearsOfExperience === "number" ? yearsOfExperience : (yearsOfExperience ? parseInt(yearsOfExperience) : null);
    const tjmVal = typeof tjm === "number" ? tjm : (tjm ? parseInt(tjm) : null);
    const avail = availability || "DISPONIBLE";

    // Upsert profile
    const profile = await prisma.profileCandidat.upsert({
      where: { userId: user.id },
      update: {
        firstName, lastName, title, bio,
        skills: skillsJson,
        yearsOfExperience: yoe,
        availability: avail,
        portfolioUrl, tjm: tjmVal,
        location, phone, linkedIn,
      },
      create: {
        userId: user.id,
        firstName, lastName, title, bio,
        skills: skillsJson,
        yearsOfExperience: yoe,
        availability: avail,
        portfolioUrl, tjm: tjmVal,
        location, phone, linkedIn,
      },
    });

    // Return with parsed skills array
    res.status(201).json({
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
    const profiles = await prisma.profileCandidat.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

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
