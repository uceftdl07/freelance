import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

const prisma = new PrismaClient();

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
    const profile = await prisma.profileCandidat.upsert({
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
    });

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
 * GET /api/profiles/:id
 * Public read-only profile by profile.id. Only PUBLISHED profiles are exposed.
 */
export async function getPublicProfile(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const profile = await prisma.profileCandidat.findUnique({
      where: { id },
      include: {
        experiences: { orderBy: { startDate: "desc" } },
        educations: { orderBy: { startDate: "desc" } },
      },
    });
    if (!profile) {
      res.status(404).json({ success: false, message: "Profil non trouvé." });
      return;
    }
    res.json({
      success: true,
      data: { ...profile, skills: parseSkills(profile.skills), phone: null, email: null },
    });
  } catch (error) {
    console.error("[PROFILES] GetPublic error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

/**
 * GET /api/recruiter-profiles/:id
 * Public read-only recruiter company profile by profileRecruteur.id
 */
export async function getPublicRecruiterProfile(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const profile = await prisma.profileRecruteur.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            jobOffers: {
              where: { status: "ACTIVE" },
              select: { id: true, title: true, location: true, remote: true, contractType: true, createdAt: true, tags: true },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
      },
    });
    if (!profile) {
      res.status(404).json({ success: false, message: "Profil non trouvé." });
      return;
    }
    res.json({
      success: true,
      data: {
        id: profile.id,
        company: profile.company,
        firstName: profile.firstName,
        lastName: profile.lastName,
        position: profile.position,
        website: profile.website,
        avatarUrl: profile.avatarUrl,
        description: profile.description,
        sector: profile.sector,
        verificationStatus: profile.verificationStatus,
        activeOffers: profile.user.jobOffers,
      },
    });
  } catch (error) {
    console.error("[PROFILES] GetPublicRecruiter error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
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

// ─── LinkedIn Import ──────────────────────────────────────────────────────────

/**
 * @route   POST /api/profiles/linkedin-import
 * @desc    Exchange LinkedIn OAuth code for profile data (name, email, headline, photo)
 * @access  Private (JWT required)
 */
export async function linkedInImportProfile(req: Request, res: Response): Promise<void> {
  try {
    const { code, redirectUri } = req.body as { code?: string; redirectUri?: string };

    if (!code) {
      res.status(400).json({ success: false, message: "Code LinkedIn manquant." });
      return;
    }

    if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
      res.status(500).json({ success: false, message: "LinkedIn OAuth non configuré." });
      return;
    }

    const resolvedRedirectUri =
      redirectUri ||
      env.LINKEDIN_REDIRECT_URI ||
      "http://localhost:3000/linkedin/callback";

    // Exchange code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: env.LINKEDIN_CLIENT_ID,
        client_secret: env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: resolvedRedirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("[LINKEDIN IMPORT] Token exchange failed:", text);
      res.status(401).json({ success: false, message: "Échec d'échange du code LinkedIn." });
      return;
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokenJson.access_token;

    if (!accessToken) {
      res.status(401).json({ success: false, message: "LinkedIn n'a pas retourné de token." });
      return;
    }

    // Get OpenID user info (always available with openid+profile+email scope)
    const userInfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      res.status(401).json({ success: false, message: "Impossible de récupérer les infos LinkedIn." });
      return;
    }

    const userInfo = (await userInfoRes.json()) as {
      sub?: string;
      email?: string;
      given_name?: string;
      family_name?: string;
      name?: string;
      picture?: string;
      locale?: { language?: string; country?: string };
    };

    // Try to get headline & vanityName from LinkedIn REST API (r_liteprofile scope)
    let headline = "";
    let vanityName = "";

    try {
      const meRes = await fetch(
        "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,headline,vanityName)",
        { headers: { Authorization: `Bearer ${accessToken}`, "LinkedIn-Version": "202401" } }
      );
      if (meRes.ok) {
        const me = (await meRes.json()) as {
          headline?: string;
          vanityName?: string;
        };
        headline = me.headline || "";
        vanityName = me.vanityName || "";
      }
    } catch {
      // r_liteprofile may not be approved — graceful fallback
    }

    const profileData = {
      firstName: userInfo.given_name || (userInfo.name?.split(" ")[0] ?? ""),
      lastName:
        userInfo.family_name ||
        (userInfo.name?.split(" ").slice(1).join(" ") ?? ""),
      email: userInfo.email || "",
      avatarUrl: userInfo.picture || "",
      title: headline,
      linkedIn: vanityName
        ? `https://www.linkedin.com/in/${vanityName}`
        : "",
    };

    res.json({ success: true, data: profileData });
  } catch (error) {
    console.error("[LINKEDIN IMPORT] Error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'import LinkedIn." });
  }
}
