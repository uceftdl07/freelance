import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// ─── Stats ────────────────────────────────────────────────────────

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const [users, jobs, applications, posts, reviews] = await Promise.all([
      prisma.user.count(),
      prisma.jobOffer.count(),
      prisma.application.count(),
      prisma.communityPost.count(),
      prisma.review.count(),
    ]);

    const [candidats, recruteurs, pendingPosts, activeJobs] = await Promise.all([
      prisma.user.count({ where: { role: "CANDIDAT" } }),
      prisma.user.count({ where: { role: "RECRUTEUR" } }),
      prisma.communityPost.count({ where: { status: "PENDING" } }),
      prisma.jobOffer.count({ where: { status: "ACTIVE" } }),
    ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, role: true, createdAt: true, isVerified: true },
    });

    res.json({
      success: true,
      data: {
        totals: { users, jobs, applications, posts, reviews },
        breakdown: { candidats, recruteurs, pendingPosts, activeJobs },
        recentUsers,
      },
    });
  } catch (error) {
    console.error("[Admin] Stats error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Users ────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const search = (req.query.search as string) || "";
    const role = (req.query.role as string) || "";

    const where = {
      ...(search ? { email: { contains: search, mode: "insensitive" as const } } : {}),
      ...(role ? { role } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          createdAt: true,
          profileCandidat: { select: { firstName: true, lastName: true } },
          profileRecruteur: { select: { firstName: true, lastName: true, company: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: { users, total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[Admin] ListUsers error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

const updateUserSchema = z.object({
  role: z.enum(["CANDIDAT", "RECRUTEUR", "ADMIN"]).optional(),
  isVerified: z.boolean().optional(),
});

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.userId;

    if (id === adminId) {
      res.status(400).json({ success: false, message: "Vous ne pouvez pas modifier votre propre compte." });
      return;
    }

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides." });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: validation.data,
      select: { id: true, email: true, role: true, isVerified: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("[Admin] UpdateUser error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.userId;

    if (id === adminId) {
      res.status(400).json({ success: false, message: "Vous ne pouvez pas supprimer votre propre compte." });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: "Utilisateur supprimé." });
  } catch (error) {
    console.error("[Admin] DeleteUser error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Community Moderation ─────────────────────────────────────────

export async function listPendingPosts(req: Request, res: Response): Promise<void> {
  try {
    const status = (req.query.status as string) || "PENDING";

    const posts = await prisma.communityPost.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            profileCandidat: { select: { firstName: true, lastName: true } },
            profileRecruteur: { select: { firstName: true, lastName: true, company: true } },
          },
        },
      },
    });

    res.json({ success: true, data: { posts, total: posts.length } });
  } catch (error) {
    console.error("[Admin] ListPosts error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

const moderatePostSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectReason: z.string().max(500).optional(),
});

export async function moderatePost(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const validation = moderatePostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: "Action invalide." });
      return;
    }

    const { action, rejectReason } = validation.data;
    const status = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const post = await prisma.communityPost.update({
      where: { id },
      data: { status, rejectReason: rejectReason ?? null },
    });

    res.json({ success: true, message: `Post ${status === "APPROVED" ? "approuvé" : "rejeté"}.`, data: post });
  } catch (error) {
    console.error("[Admin] ModeratePost error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Content Blocks ───────────────────────────────────────────────

const blockSchema = z.object({
  page: z.enum(["HOME", "OFFRES", "COMMUNAUTE", "GLOBAL"]),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(5000),
  type: z.enum(["BANNER", "ALERT", "INFO", "PROMO"]).default("BANNER"),
  isVisible: z.boolean().default(true),
  order: z.number().int().default(0),
});

export async function listBlocks(req: Request, res: Response): Promise<void> {
  try {
    const blocks = await prisma.contentBlock.findMany({ orderBy: [{ page: "asc" }, { order: "asc" }] });
    res.json({ success: true, data: { blocks } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

export async function createBlock(req: Request, res: Response): Promise<void> {
  try {
    const validation = blockSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }
    const block = await prisma.contentBlock.create({ data: validation.data });
    res.status(201).json({ success: true, data: block });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

export async function updateBlock(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const validation = blockSchema.partial().safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides." });
      return;
    }
    const block = await prisma.contentBlock.update({ where: { id }, data: validation.data });
    res.json({ success: true, data: block });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

export async function deleteBlock(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    await prisma.contentBlock.delete({ where: { id } });
    res.json({ success: true, message: "Bloc supprimé." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Public: get visible blocks for a page ────────────────────────

export async function getPublicBlocks(req: Request, res: Response): Promise<void> {
  try {
    const page = req.params.page as string;
    const blocks = await prisma.contentBlock.findMany({
      where: { isVisible: true, page: { in: [page.toUpperCase(), "GLOBAL"] } },
      orderBy: { order: "asc" },
    });
    res.json({ success: true, data: { blocks } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur." });
  }
}
