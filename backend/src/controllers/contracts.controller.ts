import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import { supabaseAdmin } from "../utils/supabase";
import { initiateSignature, verifyWebhookSignature } from "../services/docuseal.service";
import { env } from "../config/env";

const prisma = new PrismaClient();

// ─── Multer — PDF upload (memory) ─────────────────────────────────

export const contractUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers PDF sont acceptés pour les contrats."));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).single("contract");

// ─── Supabase Storage ─────────────────────────────────────────────

const CONTRACT_BUCKET = "contracts";

async function uploadPdfToSupabase(buffer: Buffer, originalName: string): Promise<string> {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalName) || ".pdf";
  const fileName = `contrat-${uniqueSuffix}${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(CONTRACT_BUCKET)
    .upload(fileName, buffer, { contentType: "application/pdf", upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabaseAdmin.storage.from(CONTRACT_BUCKET).getPublicUrl(data.path);
  return publicUrl;
}

// ─── contractSelect ───────────────────────────────────────────────

const contractSelect = {
  id: true,
  title: true,
  tjm: true,
  startDate: true,
  duration: true,
  status: true,
  pdfUrl: true,
  signingUrl: true,
  signatureRequestId: true,
  recruiterSignedAt: true,
  candidateSignedAt: true,
  createdAt: true,
  applicationId: true,
  recruiter: {
    select: {
      id: true, email: true,
      profileRecruteur: { select: { firstName: true, lastName: true, company: true } },
    },
  },
  candidate: {
    select: {
      id: true, email: true,
      profileCandidat: { select: { firstName: true, lastName: true } },
    },
  },
  application: {
    select: { id: true, job: { select: { id: true, title: true } } },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────

async function notify(userId: string, type: string, title: string, message: string, metadata?: string) {
  await prisma.notification.create({
    data: { userId, type, title, message, metadata: metadata ?? null },
  }).catch(() => {});
}

async function createMissionFromContract(contract: { id: string; title: string; recruiterId: string; candidateId: string; tjm: number | null; startDate: Date | null }) {
  await prisma.mission.create({
    data: {
      contractId: contract.id,
      title: contract.title,
      recruiterId: contract.recruiterId,
      candidateId: contract.candidateId,
      tjm: contract.tjm ?? null,
      startDate: contract.startDate ?? null,
      status: "ACTIVE",
    },
  }).catch(() => {});
}

// ─── POST /contracts — recruiter uploads PDF + sends to candidate ──

export async function createContract(req: Request, res: Response): Promise<void> {
  try {
    const recruiterId = req.user!.userId;
    const { applicationId, title, tjm, startDate, duration } = req.body;

    if (!applicationId || !title) {
      res.status(400).json({ success: false, message: "applicationId et title sont requis." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: "Un fichier PDF de contrat est requis." });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: { include: { profileCandidat: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (!application) { res.status(404).json({ success: false, message: "Candidature introuvable." }); return; }
    if ((application.job as { recruiterId: string }).recruiterId !== recruiterId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }
    if (application.status !== "ACCEPTED") { res.status(400).json({ success: false, message: "La candidature doit être acceptée." }); return; }

    const existing = await prisma.contract.findUnique({ where: { applicationId } });
    if (existing) { res.status(409).json({ success: false, message: "Un contrat existe déjà pour cette candidature." }); return; }

    // Upload PDF to Supabase
    const pdfUrl = await uploadPdfToSupabase(req.file.buffer, req.file.originalname);

    // Initiate DocuSeal signature if API key is configured
    let signatureRequestId: string | null = null;
    let signerToken: string | null = null;
    let signingUrl: string | null = null;

    if (env.DOCUSEAL_API_KEY) {
      const candidateProfile = application.candidate.profileCandidat;
      const signer = {
        firstName: candidateProfile?.firstName || "Signataire",
        lastName: candidateProfile?.lastName || "",
        email: application.candidate.email,
      };

      try {
        const result = await initiateSignature(title, req.file.buffer, signer);
        signatureRequestId = result.submissionId;
        signerToken = result.signerToken;
        signingUrl = result.signingUrl;
      } catch (err) {
        console.error("[Contracts] DocuSeal initiate error (continuing without signing):", err);
      }
    }

    const contract = await prisma.contract.create({
      data: {
        applicationId,
        recruiterId,
        candidateId: application.candidateId,
        title,
        tjm: tjm ? Number(tjm) : null,
        startDate: startDate ? new Date(startDate) : null,
        duration: duration || null,
        status: "PENDING",
        pdfUrl,
        signatureRequestId,
        signerToken,
        signingUrl,
      },
      select: contractSelect,
    });

    await notify(
      application.candidateId,
      "CONTRACT_RECEIVED",
      "Contrat à signer",
      `Vous avez reçu un contrat PDF pour la mission "${title}". Connectez-vous pour le signer.`,
      JSON.stringify({ contractId: contract.id })
    );

    res.json({ success: true, data: { contract } });
  } catch (error) {
    console.error("[Contracts] createContract error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la création du contrat." });
  }
}

// ─── GET /contracts/mine ──────────────────────────────────────────

export async function getMyContracts(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const role = req.user!.role;

  const where = role === "RECRUTEUR" ? { recruiterId: userId } : { candidateId: userId };

  const contracts = await prisma.contract.findMany({
    where,
    select: contractSelect,
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: { contracts } });
}

// ─── GET /contracts/:id ───────────────────────────────────────────

export async function getContract(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const contract = await prisma.contract.findUnique({ where: { id }, select: contractSelect });

  if (!contract) { res.status(404).json({ success: false, message: "Contrat introuvable." }); return; }
  if (contract.recruiter.id !== userId && contract.candidate.id !== userId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }

  res.json({ success: true, data: { contract } });
}

// ─── PATCH /contracts/:id/cancel — recruiter cancels ─────────────

export async function cancelContract(req: Request, res: Response): Promise<void> {
  const recruiterId = req.user!.userId;
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id as string } });

  if (!contract) { res.status(404).json({ success: false, message: "Contrat introuvable." }); return; }
  if (contract.recruiterId !== recruiterId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }
  if (contract.status === "SIGNED") { res.status(400).json({ success: false, message: "Un contrat signé ne peut pas être annulé." }); return; }

  const updated = await prisma.contract.update({
    where: { id: contract.id },
    data: { status: "CANCELLED" },
    select: contractSelect,
  });

  await notify(contract.candidateId, "CONTRACT_CANCELLED", "Contrat annulé", `Le recruteur a annulé le contrat "${contract.title}".`, JSON.stringify({ contractId: contract.id }));

  res.json({ success: true, data: { contract: updated } });
}

// ─── POST /contracts/webhook — DocuSeal webhook ───────────────────

export async function docuSealWebhook(req: Request, res: Response): Promise<void> {
  try {
    const headerSecret = (req.headers["x-docuseal-secret"] as string) || "";
    if (!verifyWebhookSignature(headerSecret, env.DOCUSEAL_WEBHOOK_SECRET)) {
      res.status(401).json({ success: false, message: "Signature invalide." });
      return;
    }

    const { event_type, data } = req.body as {
      event_type: string;
      data: { submission_id?: number; slug?: string; status?: string };
    };

    if (event_type === "form.completed" && data?.submission_id) {
      const submissionId = String(data.submission_id);

      const contract = await prisma.contract.findFirst({
        where: { signatureRequestId: submissionId },
      });

      if (contract && contract.status === "PENDING") {
        await prisma.contract.update({
          where: { id: contract.id },
          data: { status: "SIGNED", candidateSignedAt: new Date() },
        });

        await createMissionFromContract(contract);

        await notify(
          contract.recruiterId,
          "CONTRACT_SIGNED",
          "Contrat signé",
          `Le candidat a signé le contrat "${contract.title}".`,
          JSON.stringify({ contractId: contract.id })
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[Contracts] DocuSeal webhook error:", error);
    res.status(500).json({ success: false });
  }
}
