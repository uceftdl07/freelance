import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "Destinataire requis."),
  subject: z.string().min(2, "Sujet trop court.").max(200),
  content: z.string().min(5, "Message trop court.").max(5000),
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

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      res.status(404).json({ success: false, message: "Destinataire non trouvé." });
      return;
    }

    // Create message
    const message = await prisma.message.create({
      data: { senderId, receiverId, subject, content },
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
    const messages = await prisma.message.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, email: true, role: true, profileRecruteur: { select: { firstName: true, lastName: true, company: true } }, profileCandidat: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("[MSG] GetMyMessages error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Save Candidate ───────────────────────────

export async function saveCandidate(req: Request, res: Response): Promise<void> {
  try {
    const recruiterId = req.user!.userId;
    const { candidateId } = req.body;

    if (!candidateId) {
      res.status(400).json({ success: false, message: "ID candidat requis." });
      return;
    }

    // Upsert to avoid duplicate errors
    await prisma.savedCandidate.upsert({
      where: { recruiterId_candidateId: { recruiterId, candidateId } },
      update: {},
      create: { recruiterId, candidateId },
    });

    // Find candidate name for notification
    const candidate = await prisma.profileCandidat.findFirst({ where: { userId: candidateId } });

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
          userId: candidateId,
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
