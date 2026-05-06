import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";

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

// ─── Get My Profile ───────────────────────────

export async function getMyProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const user = await prisma.user.findUnique({
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

    const user = await prisma.user.findUnique({
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
