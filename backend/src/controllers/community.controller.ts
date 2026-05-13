import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

function parseTags(v: string): string[] {
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
}

const createPostSchema = z.object({
  title: z.string().trim().min(5).max(200),
  content: z.string().trim().min(20).max(10000),
  type: z.enum(["ARTICLE", "DOCUMENT", "QUESTION"]).default("ARTICLE"),
  category: z.enum(["GENERAL", "RETOUR_XP", "CONSEIL", "OUTIL", "JURIDIQUE"]).default("GENERAL"),
  tags: z.array(z.string().max(30)).max(5).default([]),
  fileUrl: z.string().url().optional(),
});

/**
 * GET /api/community — list approved posts (public)
 */
export async function listPosts(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 12;
    const category = req.query.category as string | undefined;
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;

    const where = {
      status: "APPROVED",
      ...(category ? { category } : {}),
      ...(type ? { type } : {}),
      ...(search ? { OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { content: { contains: search, mode: "insensitive" as const } },
      ] } : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              role: true,
              profileCandidat: { select: { firstName: true, lastName: true, avatarUrl: true } },
              profileRecruteur: { select: { firstName: true, lastName: true, company: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    const data = posts.map((p) => ({ ...p, tags: parseTags(p.tags) }));

    res.json({ success: true, data: { posts: data, total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("[Community] List error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

/**
 * GET /api/community/:id — get single post
 */
export async function getPost(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            role: true,
            profileCandidat: { select: { firstName: true, lastName: true, avatarUrl: true } },
            profileRecruteur: { select: { firstName: true, lastName: true, company: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!post || post.status !== "APPROVED") {
      res.status(404).json({ success: false, message: "Post introuvable." });
      return;
    }

    await prisma.communityPost.update({ where: { id }, data: { views: { increment: 1 } } });

    res.json({ success: true, data: { ...post, tags: parseTags(post.tags) } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

/**
 * POST /api/community — create post (auth required, goes to PENDING)
 */
export async function createPost(req: Request, res: Response): Promise<void> {
  try {
    const authorId = req.user!.userId;
    const validation = createPostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { title, content, type, category, tags, fileUrl } = validation.data;

    const post = await prisma.communityPost.create({
      data: {
        authorId,
        title,
        content,
        type,
        category,
        tags: JSON.stringify(tags),
        fileUrl: fileUrl ?? null,
        status: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Post soumis. Il sera visible après validation par l'équipe.",
      data: { ...post, tags },
    });
  } catch (error) {
    console.error("[Community] Create error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la création du post." });
  }
}

/**
 * DELETE /api/community/:id — author can delete their own post
 */
export async function deletePost(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) { res.status(404).json({ success: false, message: "Post introuvable." }); return; }
    if (post.authorId !== userId) { res.status(403).json({ success: false, message: "Non autorisé." }); return; }

    await prisma.communityPost.delete({ where: { id } });
    res.json({ success: true, message: "Post supprimé." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

/**
 * GET /api/community/my-posts — authenticated user's own posts
 */
export async function getMyPosts(req: Request, res: Response): Promise<void> {
  try {
    const authorId = req.user!.userId;
    const posts = await prisma.communityPost.findMany({
      where: { authorId },
      orderBy: { createdAt: "desc" },
    });
    const data = posts.map((p) => ({ ...p, tags: parseTags(p.tags) }));
    res.json({ success: true, data: { posts: data } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur." });
  }
}
