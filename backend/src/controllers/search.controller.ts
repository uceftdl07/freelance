import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function parseSkills(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Search Candidates ────────────────────────

export async function searchCandidates(req: Request, res: Response): Promise<void> {
  try {
    const {
      skills,
      minExperience,
      maxExperience,
      availability,
      location,
      minTjm,
      maxTjm,
      search,
      quizSkill,
      quizMinScore,
      page = "1",
      limit = "12",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic where clause
    const where: Prisma.ProfileCandidatWhereInput = {};

    // Skills filter (AND — candidate must have ALL requested skills)
    if (skills && typeof skills === "string") {
      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        // skills is stored as a JSON string, use AND contains for each skill
        where.AND = skillList.map((skill) => ({
          skills: { contains: skill, mode: "insensitive" as const },
        }));
      }
    }

    // Experience range
    if (minExperience) {
      where.yearsOfExperience = {
        ...(where.yearsOfExperience as Prisma.IntNullableFilter || {}),
        gte: parseInt(minExperience as string, 10),
      };
    }
    if (maxExperience) {
      where.yearsOfExperience = {
        ...(where.yearsOfExperience as Prisma.IntNullableFilter || {}),
        lte: parseInt(maxExperience as string, 10),
      };
    }

    // Availability filter (OR — any of the selected)
    if (availability && typeof availability === "string") {
      const availList = availability.split(",").map((a) => a.trim()).filter(Boolean);
      if (availList.length > 0) {
        where.availability = { in: availList as any };
      }
    }

    // Location filter (contains, case-insensitive)
    if (location && typeof location === "string") {
      where.location = { contains: location, mode: "insensitive" };
    }

    // TJM range
    if (minTjm) {
      where.tjm = {
        ...(where.tjm as Prisma.IntNullableFilter || {}),
        gte: parseInt(minTjm as string, 10),
      };
    }
    if (maxTjm) {
      where.tjm = {
        ...(where.tjm as Prisma.IntNullableFilter || {}),
        lte: parseInt(maxTjm as string, 10),
      };
    }

    // Text search (name, title, bio)
    if (search && typeof search === "string") {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
      ];
    }

    // Quiz filter: find candidateIds who passed the quiz with minScore
    let quizFilterIds: string[] | null = null;
    if (quizSkill && typeof quizSkill === "string") {
      const minScore = quizMinScore ? parseInt(quizMinScore as string, 10) : 0;
      const quiz = await prisma.quiz.findUnique({ where: { skill: quizSkill }, select: { id: true } });
      if (quiz) {
        const attempts = await prisma.quizAttempt.findMany({
          where: { quizId: quiz.id, score: { gte: minScore } },
          select: { candidateId: true },
          distinct: ["candidateId"],
        });
        quizFilterIds = attempts.map((a) => a.candidateId);
      } else {
        quizFilterIds = [];
      }
    }

    if (quizFilterIds !== null) {
      where.userId = { in: quizFilterIds };
    }

    // Execute query with count
    const [candidates, total] = await Promise.all([
      prisma.profileCandidat.findMany({
        where,
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          title: true,
          bio: true,
          skills: true,
          yearsOfExperience: true,
          availability: true,
          tjm: true,
          location: true,
          avatarUrl: true,
          linkedIn: true,
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.profileCandidat.count({ where }),
    ]);

    const normalizedCandidates = candidates.map((candidate) => ({
      ...candidate,
      skills: parseSkills(candidate.skills),
    }));

    res.json({
      success: true,
      data: {
        candidates: normalizedCandidates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("[SEARCH] SearchCandidates error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche.",
    });
  }
}

// ─── Get Candidate Detail ─────────────────────

export async function getCandidateDetail(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const candidate = await prisma.profileCandidat.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        title: true,
        bio: true,
        skills: true,
        yearsOfExperience: true,
        availability: true,
        portfolioUrl: true,
        tjm: true,
        location: true,
        phone: true,
        linkedIn: true,
        avatarUrl: true,
        createdAt: true,
        experiences: {
          select: {
            id: true, title: true, company: true, location: true,
            description: true, startDate: true, endDate: true, currentlyWorking: true,
          },
          orderBy: { startDate: "desc" },
        },
        educations: {
          select: {
            id: true, title: true, school: true, field: true,
            description: true, startDate: true, endDate: true,
          },
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!candidate) {
      res.status(404).json({ success: false, message: "Candidat non trouvé." });
      return;
    }

    res.json({
      success: true,
      data: {
        ...candidate,
        skills: parseSkills(candidate.skills),
      },
    });
  } catch (error) {
    console.error("[SEARCH] GetCandidateDetail error:", error);
    res.status(500).json({ success: false, message: "Erreur interne." });
  }
}
