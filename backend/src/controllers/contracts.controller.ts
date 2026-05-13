import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const contractSelect = {
  id: true,
  title: true,
  tjm: true,
  startDate: true,
  duration: true,
  clauses: true,
  status: true,
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

async function notify(userId: string, type: string, title: string, message: string, metadata?: string) {
  await prisma.notification.create({
    data: { userId, type, title, message, metadata: metadata ?? null },
  }).catch(() => {});
}

// POST /contracts — recruiter creates & sends a contract
export async function createContract(req: Request, res: Response): Promise<void> {
  const recruiterId = req.user!.userId;
  const { applicationId, title, tjm, startDate, duration, clauses } = req.body;

  if (!applicationId || !title) {
    res.status(400).json({ success: false, message: "applicationId et title sont requis." });
    return;
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) { res.status(404).json({ success: false, message: "Candidature introuvable." }); return; }
  if ((application.job as { recruiterId: string }).recruiterId !== recruiterId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }
  if (application.status !== "ACCEPTED") { res.status(400).json({ success: false, message: "La candidature doit être acceptée." }); return; }

  const existing = await prisma.contract.findUnique({ where: { applicationId } });
  if (existing) { res.status(409).json({ success: false, message: "Un contrat existe déjà pour cette candidature." }); return; }

  const contract = await prisma.contract.create({
    data: {
      applicationId,
      recruiterId,
      candidateId: application.candidateId,
      title,
      tjm: tjm ? Number(tjm) : null,
      startDate: startDate ? new Date(startDate) : null,
      duration: duration || null,
      clauses: clauses || null,
      status: "PENDING",
    },
    select: contractSelect,
  });

  await notify(application.candidateId, "CONTRACT_RECEIVED", "Contrat à signer", `Vous avez reçu un contrat pour la mission "${title}".`, JSON.stringify({ contractId: contract.id }));

  res.json({ success: true, data: { contract } });
}

// GET /contracts/mine — both parties
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

// GET /contracts/:id
export async function getContract(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const contract = await prisma.contract.findUnique({ where: { id }, select: contractSelect });

  if (!contract) { res.status(404).json({ success: false, message: "Contrat introuvable." }); return; }
  if (contract.recruiter.id !== userId && contract.candidate.id !== userId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }

  res.json({ success: true, data: { contract } });
}

// PATCH /contracts/:id/sign — candidate signs
export async function signContract(req: Request, res: Response): Promise<void> {
  const candidateId = req.user!.userId;
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id as string } });

  if (!contract) { res.status(404).json({ success: false, message: "Contrat introuvable." }); return; }
  if (contract.candidateId !== candidateId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }
  if (contract.status !== "PENDING") { res.status(400).json({ success: false, message: "Ce contrat ne peut plus être signé." }); return; }

  const updated = await prisma.contract.update({
    where: { id: contract.id },
    data: { status: "SIGNED", candidateSignedAt: new Date() },
    select: contractSelect,
  });

  // Auto-create mission when contract is signed
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

  await notify(contract.recruiterId, "CONTRACT_SIGNED", "Contrat signé", `Le candidat a signé le contrat "${contract.title}".`, JSON.stringify({ contractId: contract.id }));

  res.json({ success: true, data: { contract: updated } });
}

// PATCH /contracts/:id/refuse — candidate refuses
export async function refuseContract(req: Request, res: Response): Promise<void> {
  const candidateId = req.user!.userId;
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id as string } });

  if (!contract) { res.status(404).json({ success: false, message: "Contrat introuvable." }); return; }
  if (contract.candidateId !== candidateId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }
  if (contract.status !== "PENDING") { res.status(400).json({ success: false, message: "Ce contrat ne peut plus être refusé." }); return; }

  const updated = await prisma.contract.update({
    where: { id: contract.id },
    data: { status: "REFUSED" },
    select: contractSelect,
  });

  await notify(contract.recruiterId, "CONTRACT_REFUSED", "Contrat refusé", `Le candidat a refusé le contrat "${contract.title}".`, JSON.stringify({ contractId: contract.id }));

  res.json({ success: true, data: { contract: updated } });
}

// PATCH /contracts/:id/cancel — recruiter cancels
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
