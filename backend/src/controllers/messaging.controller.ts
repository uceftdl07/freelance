import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "Destinataire requis."),
  subject: z.string().min(2, "Sujet trop court.").max(200),
  content: z.string().min(5, "Message trop court.").max(5000),
});

const saveCandidateSchema = z.object({
  candidateId: z.string().min(1, "ID candidat requis."),
  candidateType: z.enum(["USER", "PROFILE"]).optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Send Message ─────────────────────────────

export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const senderId = req.user!.userId;
    const validation = sendMessageSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { receiverId, subject, content } = validation.data;

    if (receiverId === senderId) {
      res.status(400).json({ success: false, message: "Vous ne pouvez pas vous envoyer un message à vous-même." });
      return;
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      res.status(404).json({ success: false, message: "Destinataire non trouvé." });
      return;
    }

    // Create message
    const message = await prisma.message.create({
      data: { senderId, receiverId, subject: subject.trim(), content: content.trim() },
    });

    // Create notification for receiver
    const senderProfile = await prisma.user.findUnique({
      where: { id: senderId },
      include: { profileRecruteur: true, profileCandidat: true },
    });
    const senderName = senderProfile?.profileRecruteur
      ? `${senderProfile.profileRecruteur.firstName} ${senderProfile.profileRecruteur.lastName}`
      : senderProfile?.profileCandidat
        ? `${senderProfile.profileCandidat.firstName} ${senderProfile.profileCandidat.lastName}`
        : "Un utilisateur";

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "MESSAGE_RECEIVED",
        title: "Nouveau message",
        message: `${senderName} vous a envoyé un message : "${subject}"`,
        metadata: JSON.stringify({ senderId, messageId: message.id }),
      },
    });

    res.status(201).json({ success: true, message: "Message envoyé.", data: { id: message.id } });
  } catch (error) {
    console.error("[MSG] SendMessage error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi." });
  }
}

// ─── Get My Messages ──────────────────────────

export async function getMyMessages(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const queryValidation = paginationSchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(400).json({ success: false, message: "Paramètres de pagination invalides." });
      return;
    }

    const { page, limit } = queryValidation.data;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, email: true, role: true, profileRecruteur: { select: { firstName: true, lastName: true, company: true } }, profileCandidat: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      prisma.message.count({ where: { receiverId: userId } }),
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    console.error("[MSG] GetMyMessages error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Save Candidate ───────────────────────────

export async function saveCandidate(req: Request, res: Response): Promise<void> {
  try {
    const recruiterId = req.user!.userId;
    const validation = saveCandidateSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { candidateId, candidateType } = validation.data;

    // Accept either userId or profileId to tolerate frontend payloads.
    let candidateUserId: string | null = null;
    let candidateProfile: { userId: string } | null = null;

    if (candidateType === "PROFILE") {
      candidateProfile = await prisma.profileCandidat.findUnique({ where: { id: candidateId }, select: { userId: true } });
      candidateUserId = candidateProfile?.userId ?? null;
    } else if (candidateType === "USER") {
      const candidateUser = await prisma.user.findUnique({ where: { id: candidateId }, select: { id: true, role: true } });
      if (candidateUser?.role === "CANDIDAT") {
        candidateUserId = candidateUser.id;
      }
    } else {
      const candidateUser = await prisma.user.findUnique({ where: { id: candidateId }, select: { id: true, role: true } });
      if (candidateUser?.role === "CANDIDAT") {
        candidateUserId = candidateUser.id;
      } else {
        candidateProfile = await prisma.profileCandidat.findUnique({ where: { id: candidateId }, select: { userId: true } });
        candidateUserId = candidateProfile?.userId ?? null;
      }
    }

    if (!candidateUserId) {
      res.status(404).json({ success: false, message: "Candidat non trouvé." });
      return;
    }

    if (candidateUserId === recruiterId) {
      res.status(400).json({ success: false, message: "Vous ne pouvez pas sauvegarder votre propre profil." });
      return;
    }

    // Upsert to avoid duplicate errors
    await prisma.savedCandidate.upsert({
      where: { recruiterId_candidateId: { recruiterId, candidateId: candidateUserId } },
      update: {},
      create: { recruiterId, candidateId: candidateUserId },
    });

    // Find candidate name for notification
    const candidate = await prisma.profileCandidat.findFirst({ where: { userId: candidateUserId } });

    // Notify the candidate
    const recruiter = await prisma.user.findUnique({
      where: { id: recruiterId },
      include: { profileRecruteur: true },
    });
    const recruiterName = recruiter?.profileRecruteur
      ? `${recruiter.profileRecruteur.firstName} ${recruiter.profileRecruteur.lastName} (${recruiter.profileRecruteur.company})`
      : "Un recruteur";

    if (candidate) {
      await prisma.notification.create({
        data: {
          userId: candidateUserId,
          type: "PROFILE_SAVED",
          title: "Profil sauvegardé",
          message: `${recruiterName} a sauvegardé votre profil.`,
          metadata: JSON.stringify({ recruiterId }),
        },
      });
    }

    res.json({ success: true, message: "Candidat sauvegardé." });
  } catch (error) {
    console.error("[MSG] SaveCandidate error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Remove Saved Candidate ───────────────────

export async function removeSavedCandidate(req: Request, res: Response): Promise<void> {
  try {
    const recruiterId = req.user!.userId;
    const candidateId = req.params.candidateId as string;

    if (!candidateId) {
      res.status(400).json({ success: false, message: "ID candidat requis." });
      return;
    }

    await prisma.savedCandidate.deleteMany({
      where: { recruiterId, candidateId },
    });

    res.json({ success: true, message: "Candidat retire des sauvegardes." });
  } catch (error) {
    console.error("[MSG] RemoveSavedCandidate error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Get Saved Candidates ─────────────────────

export async function getSavedCandidates(req: Request, res: Response): Promise<void> {
  try {
    const recruiterId = req.user!.userId;

    const saved = await prisma.savedCandidate.findMany({
      where: { recruiterId },
      orderBy: { createdAt: "desc" },
    });

    const candidateIds = saved.map((entry) => entry.candidateId);
    const profiles = candidateIds.length
      ? await prisma.profileCandidat.findMany({
          where: { userId: { in: candidateIds } },
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            title: true,
            location: true,
            tjm: true,
          },
        })
      : [];

    const profilesByUserId = new Map(profiles.map((p) => [p.userId, p]));

    const candidates = saved.map((entry) => {
      const profile = profilesByUserId.get(entry.candidateId);
      return {
        candidateId: entry.candidateId,
        savedAt: entry.createdAt,
        profile: profile
          ? {
              id: profile.id,
              userId: profile.userId,
              name: `${profile.firstName} ${profile.lastName}`.trim(),
              title: profile.title,
              location: profile.location,
              tjm: profile.tjm,
            }
          : null,
      };
    });

    res.json({ success: true, data: { candidates, total: candidates.length } });
  } catch (error) {
    console.error("[MSG] GetSavedCandidates error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Get Notifications ────────────────────────

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const unreadCount = await prisma.notification.count({ where: { userId, read: false } });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    console.error("[NOTIF] Error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Mark Notifications Read ──────────────────

export async function markNotificationsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    res.json({ success: true, message: "Notifications marquées comme lues." });
  } catch (error) {
    console.error("[NOTIF] MarkRead error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}
