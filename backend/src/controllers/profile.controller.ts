import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

function isPreparedStatementPoolError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('prepared statement') &&
    (message.includes('does not exist') || message.includes('already exists'))
  );
}

async function withRetry<T>(query: () => Promise<T>, label = "query"): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (!isPreparedStatementPoolError(error)) throw error;
    console.warn(`[PROFILE] Retrying ${label} after prepared-statement error`);
    await prisma.$disconnect();
    return query();
  }
}


// ─── Validation Schemas ───────────────────────

const updateCandidatSchema = z.object({
  firstName: z.string().min(2).trim().optional(),
  lastName: z.string().min(2).trim().optional(),
  title: z.string().trim().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  availability: z
    .enum(["DISPONIBLE", "EN_MISSION", "BIENTOT_DISPONIBLE"])
    .optional(),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  tjm: z.number().int().min(0).optional(),
  location: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  linkedIn: z.string().url().optional().or(z.literal("")),
});

const updateRecruteurSchema = z.object({
  firstName: z.string().min(2).trim().optional(),
  lastName: z.string().min(2).trim().optional(),
  company: z.string().trim().optional(),
  position: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

const candidateSettingsSchema = z.object({
  notifications: z.object({
    newMissions: z.boolean(),
    recruiterMessages: z.boolean(),
  }),
  visibility: z.enum(["PUBLIC", "PRIVATE", "RECRUITERS_ONLY"]),
  appearance: z.object({
    language: z.string().min(2).max(5),
    darkMode: z.boolean(),
  }),
});

let settingsTableReady = false;

async function ensureSettingsTable(): Promise<void> {
  if (settingsTableReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  settingsTableReady = true;
}

// ─── Get My Profile ───────────────────────────

export async function getMyProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const user = await withRetry(() => prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profileCandidat:
          role === "CANDIDAT"
            ? {
                select: {
                  id: true,
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
                },
              }
            : false,
        profileRecruteur:
          role === "RECRUTEUR"
            ? {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  company: true,
                  position: true,
                  phone: true,
                  website: true,
                  avatarUrl: true,
                },
              }
            : false,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé.",
      });
      return;
    }

    const profile =
      role === "CANDIDAT" ? user.profileCandidat : user.profileRecruteur;

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        profile,
      },
    });
  } catch (error) {
    console.error("[PROFILE] GetMyProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// ─── Update My Profile ────────────────────────

export async function updateMyProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role === "CANDIDAT") {
      const validation = updateCandidatSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Données invalides.",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const data: Record<string, unknown> = { ...validation.data };
      if (data.skills && Array.isArray(data.skills)) {
        data.skills = JSON.stringify(data.skills);
      }

      const updatedProfile = await prisma.profileCandidat.update({
        where: { userId },
        data: data as any,
      });

      res.json({
        success: true,
        message: "Profil mis à jour.",
        data: updatedProfile,
      });
    } else {
      const validation = updateRecruteurSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Données invalides.",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      const updatedProfile = await prisma.profileRecruteur.update({
        where: { userId },
        data: validation.data,
      });

      res.json({
        success: true,
        message: "Profil mis à jour.",
        data: updatedProfile,
      });
    }
  } catch (error) {
    console.error("[PROFILE] UpdateMyProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// ─── Get Public Profile ───────────────────────

export async function getPublicProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;

    const queryPublicUser = () => prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        createdAt: true,
        profileCandidat: {
          select: {
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
            linkedIn: true,
            avatarUrl: true,
          },
        },
        profileRecruteur: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
            position: true,
            website: true,
            avatarUrl: true,
          },
        },
      },
    });

    let user;
    try {
      user = await queryPublicUser();
    } catch (error) {
      if (!isPreparedStatementPoolError(error)) {
        throw error;
      }

      // Retry once after reconnect to handle transient pooler prepared-statement mismatch.
      console.warn("[PROFILE] Retrying public profile query after prepared-statement error");
      await prisma.$disconnect();
      user = await queryPublicUser();
    }

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Profil non trouvé.",
      });
      return;
    }

    const profile =
      user.role === "CANDIDAT"
        ? (user as any).profileCandidat
        : (user as any).profileRecruteur;

    res.json({
      success: true,
      data: {
        id: user.id,
        role: user.role,
        createdAt: user.createdAt,
        profile,
      },
    });
  } catch (error) {
    console.error("[PROFILE] GetPublicProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// ─── Candidate Settings (Server Persistence) ───

export async function getMySettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role !== "CANDIDAT") {
      res.status(403).json({ success: false, message: "Réservé aux candidats." });
      return;
    }

    await ensureSettingsTable();

    const rows = await prisma.$queryRawUnsafe<Array<{ data: unknown }>>(
      `SELECT data FROM user_settings WHERE user_id = $1 LIMIT 1;`,
      userId
    );

    res.json({
      success: true,
      data: {
        settings: rows[0]?.data || null,
      },
    });
  } catch (error) {
    console.error("[PROFILE] GetMySettings error:", error);
    res.status(500).json({ success: false, message: "Erreur interne du serveur." });
  }
}

export async function updateMySettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role !== "CANDIDAT") {
      res.status(403).json({ success: false, message: "Réservé aux candidats." });
      return;
    }

    const validation = candidateSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    await ensureSettingsTable();

    await prisma.$executeRawUnsafe(
      `
        INSERT INTO user_settings (user_id, data, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
      `,
      userId,
      JSON.stringify(validation.data)
    );

    res.json({ success: true, message: "Paramètres enregistrés.", data: { settings: validation.data } });
  } catch (error) {
    console.error("[PROFILE] UpdateMySettings error:", error);
    res.status(500).json({ success: false, message: "Erreur interne du serveur." });
  }
}

// ─── Draft Profile Operations ──────────────

const draftSchema = z.object({
  form: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    title: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    yearsOfExperience: z.number().optional(),
    availability: z.string().optional(),
    tjm: z.number().optional(),
    location: z.string().optional(),
    linkedIn: z.string().optional(),
    portfolioUrl: z.string().optional(),
  }).optional(),
  experiences: z.array(z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    period: z.string(),
    desc: z.string(),
  })).optional(),
  educations: z.array(z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    period: z.string(),
    desc: z.string(),
  })).optional(),
  step: z.number().optional(),
  done: z.array(z.number()).optional(),
});

export async function saveDraft(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const validation = draftSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const profile = await withRetry(() => prisma.profileCandidat.upsert({
      where: { userId },
      update: {
        draftData: JSON.stringify(validation.data),
        updatedAt: new Date(),
      },
      create: {
        userId,
        firstName: validation.data.form?.firstName || "Non spécifié",
        lastName: validation.data.form?.lastName || "Non spécifié",
        draftData: JSON.stringify(validation.data),
      },
    }), "saveDraft");

    res.json({
      success: true,
      message: "Brouillon sauvegardé.",
      data: profile,
    });
  } catch (error) {
    console.error("[PROFILE] SaveDraft error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

export async function loadDraft(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const profile = await withRetry(() => prisma.profileCandidat.findUnique({
      where: { userId },
      select: { draftData: true },
    }), "loadDraft");

    if (!profile || !profile.draftData) {
      res.json({
        success: true,
        data: null,
        message: "Aucun brouillon trouvé.",
      });
      return;
    }

    const draftData = JSON.parse(profile.draftData);

    res.json({
      success: true,
      data: draftData,
    });
  } catch (error) {
    console.error("[PROFILE] LoadDraft error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// ─── Publish Profile (Save from Draft) ─────

export async function publishProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const validation = updateCandidatSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    // Vérifier que firstName et lastName sont présents
    if (!validation.data.firstName || !validation.data.lastName) {
      res.status(400).json({
        success: false,
        message: "Le prénom et le nom sont obligatoires.",
      });
      return;
    }

    const data: Record<string, unknown> = { ...validation.data };
    if (data.skills && Array.isArray(data.skills)) {
      data.skills = JSON.stringify(data.skills);
    }
    data.status = "PUBLISHED";
    // Note: draftData is intentionally preserved so the completion bar
    // remains accurate on the dashboard after publishing.

    const updatedProfile = await withRetry(() => prisma.profileCandidat.upsert({
      where: { userId },
      update: data as any,
      create: {
        userId,
        firstName: validation.data.firstName!,
        lastName: validation.data.lastName!,
        ...(data as any),
      },
    }), "publishProfile");

    res.json({
      success: true,
      message: "Profil publié avec succès.",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("[PROFILE] PublishProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
}

// ─── Experience Operations ─────────────────────

const experienceSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  currentlyWorking: z.boolean().optional(),
});

export async function createExperience(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const validation = experienceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const profile = await prisma.profileCandidat.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Profil non trouvé.",
      });
      return;
    }

    const experience = await prisma.experience.create({
      data: {
        ...validation.data,
        profileId: profile.id,
      },
    });

    res.json({
      success: true,
      message: "Expérience créée.",
      data: experience,
    });
  } catch (error) {
    console.error("[PROFILE] CreateExperience error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

export async function updateExperience(req: Request, res: Response): Promise<void> {
  try {
    const expId = req.params.id;

    const validation = experienceSchema.partial().safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const experience = await prisma.experience.update({
      where: { id: expId },
      data: validation.data,
    });

    res.json({
      success: true,
      message: "Expérience mise à jour.",
      data: experience,
    });
  } catch (error) {
    console.error("[PROFILE] UpdateExperience error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

export async function deleteExperience(req: Request, res: Response): Promise<void> {
  try {
    const expId = req.params.id;

    await prisma.experience.delete({
      where: { id: expId },
    });

    res.json({
      success: true,
      message: "Expérience supprimée.",
    });
  } catch (error) {
    console.error("[PROFILE] DeleteExperience error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// ─── Education Operations ──────────────────────

const educationSchema = z.object({
  title: z.string().min(1),
  school: z.string().min(1),
  field: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function createEducation(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const validation = educationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const profile = await prisma.profileCandidat.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Profil non trouvé.",
      });
      return;
    }

    const education = await prisma.education.create({
      data: {
        ...validation.data,
        profileId: profile.id,
      },
    });

    res.json({
      success: true,
      message: "Formation créée.",
      data: education,
    });
  } catch (error) {
    console.error("[PROFILE] CreateEducation error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

export async function updateEducation(req: Request, res: Response): Promise<void> {
  try {
    const eduId = req.params.id;

    const validation = educationSchema.partial().safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const education = await prisma.education.update({
      where: { id: eduId },
      data: validation.data,
    });

    res.json({
      success: true,
      message: "Formation mise à jour.",
      data: education,
    });
  } catch (error) {
    console.error("[PROFILE] UpdateEducation error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

export async function deleteEducation(req: Request, res: Response): Promise<void> {
  try {
    const eduId = req.params.id;

    await prisma.education.delete({
      where: { id: eduId },
    });

    res.json({
      success: true,
      message: "Formation supprimée.",
    });
  } catch (error) {
    console.error("[PROFILE] DeleteEducation error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}
