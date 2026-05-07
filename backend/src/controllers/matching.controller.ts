import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: parse JSON-encoded string[] fields from DB
function parseJsonArray(val: string | string[]): string[] {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

// ─── Matching Algorithm ───────────────────────

interface MatchScore {
  candidateId: string;
  userId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  skills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  yearsOfExperience: number | null;
  availability: string;
  tjm: number | null;
  location: string | null;
  score: number; // 0-100
}

function calculateMatchScore(
  candidateSkills: string[],
  requiredSkills: string[],
  candidateExp: number | null,
  candidateAvailability: string
): number {
  if (requiredSkills.length === 0) return 0;

  // Skill match (70% weight)
  const normalizedCandidate = candidateSkills.map((s) => s.toLowerCase());
  const normalizedRequired = requiredSkills.map((s) => s.toLowerCase());
  const matchedCount = normalizedRequired.filter((s) => normalizedCandidate.includes(s)).length;
  const skillScore = (matchedCount / normalizedRequired.length) * 100;

  // Experience bonus (15% weight) — more XP = higher score, capped at 10 years
  const expScore = Math.min(((candidateExp || 0) / 10) * 100, 100);

  // Availability bonus (15% weight)
  const availScore = candidateAvailability === "DISPONIBLE" ? 100
    : candidateAvailability === "BIENTOT_DISPONIBLE" ? 60 : 20;

  return Math.round(skillScore * 0.7 + expScore * 0.15 + availScore * 0.15);
}

// ─── Match Candidates for a Job Offer ─────────

export async function matchCandidatesForJob(req: Request, res: Response): Promise<void> {
  try {
    const jobId = req.params.jobId as string;

    // Get the job offer
    const job = await prisma.jobOffer.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ success: false, message: "Offre non trouvée." });
      return;
    }

    // Get all candidates
    const candidates = await prisma.profileCandidat.findMany({
      select: {
        id: true, userId: true, firstName: true, lastName: true,
        title: true, skills: true, yearsOfExperience: true,
        availability: true, tjm: true, location: true,
      },
    });

    // Calculate scores
    const jobTags = parseJsonArray(job.tags);
    const scored: MatchScore[] = candidates.map((c) => {
      const candidateSkills = parseJsonArray(c.skills);
      const normalizedCandidate = candidateSkills.map((s) => s.toLowerCase());
      const matched = jobTags.filter((t) => normalizedCandidate.includes(t.toLowerCase()));
      const missing = jobTags.filter((t) => !normalizedCandidate.includes(t.toLowerCase()));

      return {
        ...c,
        skills: candidateSkills,
        candidateId: c.id,
        matchedSkills: matched,
        missingSkills: missing,
        score: calculateMatchScore(candidateSkills, jobTags, c.yearsOfExperience, c.availability),
      };
    });

    // Sort by score descending, filter out 0-scores
    const results = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: {
        job: { id: job.id, title: job.title, company: job.company, tags: jobTags },
        matches: results,
        totalCandidates: candidates.length,
        matchedCandidates: results.length,
      },
    });
  } catch (error) {
    console.error("[MATCHING] Error:", error);
    res.status(500).json({ success: false, message: "Erreur lors du matching." });
  }
}

// ─── Quick Match (skills array input) ─────────

export async function quickMatch(req: Request, res: Response): Promise<void> {
  try {
    const { skills } = req.body;
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      res.status(400).json({ success: false, message: "Compétences requises." });
      return;
    }

    const candidates = await prisma.profileCandidat.findMany({
      select: {
        id: true, userId: true, firstName: true, lastName: true,
        title: true, skills: true, yearsOfExperience: true,
        availability: true, tjm: true, location: true,
      },
    });

    const scored = candidates.map((c) => {
      const candidateSkills = parseJsonArray(c.skills);
      const matched = skills.filter((s: string) => candidateSkills.map((cs: string) => cs.toLowerCase()).includes(s.toLowerCase()));
      const missing = skills.filter((s: string) => !candidateSkills.map((cs: string) => cs.toLowerCase()).includes(s.toLowerCase()));

      return {
        ...c, skills: candidateSkills, candidateId: c.id, matchedSkills: matched, missingSkills: missing,
        score: calculateMatchScore(candidateSkills, skills, c.yearsOfExperience, c.availability),
      };
    });

    const results = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    res.json({ success: true, data: { matches: results } });
  } catch (error) {
    console.error("[MATCHING] QuickMatch error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}
