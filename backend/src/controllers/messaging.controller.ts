import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message requis.").max(5000, "Message trop long."),
});

const sendFirstMessageSchema = z.object({
  receiverId: z.string().min(1, "Destinataire requis."),
  content: z.string().min(1, "Message requis.").max(5000, "Message trop long."),
});

const saveCandidateSchema = z.object({
  candidateId: z.string().min(1, "ID candidat requis."),
  candidateType: z.enum(["USER", "PROFILE"]).optional(),
});

// Helpers
const userProfileSelect = {
  id: true,
  role: true,
  profileCandidat: {
    select: { firstName: true, lastName: true, avatarUrl: true, title: true }
  },
  profileRecruteur: {
    select: { firstName: true, lastName: true, avatarUrl: true, company: true }
  }
};

function getDisplayName(user: any) {
  if (user.role === "CANDIDAT" && user.profileCandidat) {
    return {
      name: `${user.profileCandidat.firstName} ${user.profileCandidat.lastName}`,
      avatar: user.profileCandidat.avatarUrl,
      subtitle: user.profileCandidat.title
    };
  } else if (user.role === "RECRUTEUR" && user.profileRecruteur) {
    return {
      name: `${user.profileRecruteur.firstName} ${user.profileRecruteur.lastName}`,
      avatar: user.profileRecruteur.avatarUrl,
      subtitle: user.profileRecruteur.company
    };
  }
  return { name: "Utilisateur inconnu", avatar: null, subtitle: null };
}

// ─── Conversations & Messages ──────────────────────────

export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const conversations = await prisma.conversation.findMany({
      where: userRole === "RECRUTEUR" ? { recruiterId: userId } : { candidateId: userId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        recruiter: { select: userProfileSelect },
        candidate: { select: userProfileSelect },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                read: false,
              }
            }
          }
        }
      }
    });

    const formatted = conversations.map(conv => {
      const partner = userRole === "RECRUTEUR" ? conv.candidate : conv.recruiter;
      const partnerProfile = getDisplayName(partner);
      
      return {
        id: conv.id,
        partnerId: partner.id,
        partnerName: partnerProfile.name,
        partnerAvatar: partnerProfile.avatar,
        partnerSubtitle: partnerProfile.subtitle,
        lastMessage: conv.messages[0]?.content || null,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv._count.messages,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("[MSG] getConversations error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const conversationId = req.params.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || (conversation.recruiterId !== userId && conversation.candidateId !== userId)) {
      res.status(403).json({ success: false, message: "Accès refusé." });
      return;
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false
      },
      data: { read: true }
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });

    const formatted = messages.map(m => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      read: m.read,
      isFromMe: m.senderId === userId
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("[MSG] getMessages error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
}

export async function sendMessageToConversation(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const conversationId = req.params.id;
    const validation = sendMessageSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { content } = validation.data;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || (conversation.recruiterId !== userId && conversation.candidateId !== userId)) {
      res.status(403).json({ success: false, message: "Accès refusé." });
      return;
    }

    const receiverId = conversation.recruiterId === userId ? conversation.candidateId : conversation.recruiterId;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim()
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Fire and forget notification
    createMessageNotification(userId, receiverId, content).catch(console.error);

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("[MSG] sendMessageToConversation error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
}

export async function sendMessageToUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const validation = sendFirstMessageSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { receiverId, content } = validation.data;

    if (userId === receiverId) {
      res.status(400).json({ success: false, message: "Vous ne pouvez pas vous envoyer un message." });
      return;
    }

    const recruiterId = userRole === "RECRUTEUR" ? userId : receiverId;
    const candidateId = userRole === "CANDIDAT" ? userId : receiverId;

    let conversation = await prisma.conversation.findUnique({
      where: {
        recruiterId_candidateId: {
          recruiterId,
          candidateId
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          recruiterId,
          candidateId,
          lastMessageAt: new Date()
        }
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: content.trim()
      }
    });

    createMessageNotification(userId, receiverId, content).catch(console.error);

    res.status(201).json({ success: true, data: { conversationId: conversation.id, message } });
  } catch (error) {
    console.error("[MSG] sendMessageToUser error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
}

async function createMessageNotification(senderId: string, receiverId: string, content: string) {
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: userProfileSelect
  });
  
  const senderInfo = getDisplayName(sender);
  const snippet = content.length > 50 ? content.substring(0, 47) + "..." : content;

  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "MESSAGE_RECEIVED",
      title: "Nouveau message",
      message: `${senderInfo.name} vous a envoyé : "${snippet}"`,
      metadata: JSON.stringify({ senderId }),
    },
  });
}

// ─── Bonus & Notifications (Existing logic adapted) ──

export async function saveCandidate(req: Request, res: Response): Promise<void> {
  try {
    const recruiterId = req.user!.userId;
    const validation = saveCandidateSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { candidateId, candidateType } = validation.data;
    let candidateUserId: string | null = null;

    if (candidateType === "PROFILE") {
      const candidateProfile = await prisma.profileCandidat.findUnique({ where: { id: candidateId }, select: { userId: true } });
      candidateUserId = candidateProfile?.userId ?? null;
    } else {
      const candidateUser = await prisma.user.findUnique({ where: { id: candidateId }, select: { id: true, role: true } });
      if (candidateUser?.role === "CANDIDAT") {
        candidateUserId = candidateUser.id;
      } else {
        const candidateProfile = await prisma.profileCandidat.findUnique({ where: { id: candidateId }, select: { userId: true } });
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

    await prisma.savedCandidate.upsert({
      where: { recruiterId_candidateId: { recruiterId, candidateId: candidateUserId } },
      update: {},
      create: { recruiterId, candidateId: candidateUserId },
    });

    res.json({ success: true, message: "Candidat sauvegardé." });
  } catch (error) {
    console.error("[MSG] SaveCandidate error:", error);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

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
