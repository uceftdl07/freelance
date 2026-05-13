import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const missionSelect = {
  id: true, title: true, status: true, tjm: true, startDate: true, endDate: true, createdAt: true,
  contractId: true,
  recruiter: { select: { id: true, email: true, profileRecruteur: { select: { firstName: true, lastName: true, company: true } } } },
  candidate: { select: { id: true, email: true, profileCandidat: { select: { firstName: true, lastName: true } } } },
  timesheets: {
    select: { id: true, weekStart: true, daysWorked: true, description: true, status: true, rejectionNote: true, submittedAt: true, validatedAt: true },
    orderBy: { weekStart: "desc" as const },
  },
};

async function notify(userId: string, type: string, title: string, message: string, metadata?: string) {
  await prisma.notification.create({ data: { userId, type, title, message, metadata: metadata ?? null } }).catch(() => {});
}

// GET /missions/mine
export async function getMyMissions(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const where = role === "RECRUTEUR" ? { recruiterId: userId } : { candidateId: userId };

  const missions = await prisma.mission.findMany({ where, select: missionSelect, orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: { missions } });
}

// GET /missions/:id
export async function getMission(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const mission = await prisma.mission.findUnique({ where: { id: req.params.id as string }, select: missionSelect });

  if (!mission) { res.status(404).json({ success: false, message: "Mission introuvable." }); return; }
  if (mission.recruiter.id !== userId && mission.candidate.id !== userId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }

  res.json({ success: true, data: { mission } });
}

// PATCH /missions/:id/status — recruiter updates mission status
export async function updateMissionStatus(req: Request, res: Response): Promise<void> {
  const recruiterId = req.user!.userId;
  const { status } = req.body;
  const validStatuses = ["ACTIVE", "PAUSED", "COMPLETED"];

  if (!validStatuses.includes(status)) { res.status(400).json({ success: false, message: "Statut invalide." }); return; }

  const mission = await prisma.mission.findUnique({ where: { id: req.params.id as string } });
  if (!mission) { res.status(404).json({ success: false, message: "Mission introuvable." }); return; }
  if (mission.recruiterId !== recruiterId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }

  const updated = await prisma.mission.update({ where: { id: mission.id }, data: { status, endDate: status === "COMPLETED" ? new Date() : mission.endDate }, select: missionSelect });

  if (status === "COMPLETED") {
    await notify(mission.candidateId, "MISSION_COMPLETED", "Mission terminée", `La mission "${mission.title}" a été marquée comme terminée.`, JSON.stringify({ missionId: mission.id }));
  }

  res.json({ success: true, data: { mission: updated } });
}

// POST /timesheets — candidate creates or updates a timesheet entry
export async function upsertTimesheet(req: Request, res: Response): Promise<void> {
  const candidateId = req.user!.userId;
  const { missionId, weekStart, daysWorked, description } = req.body;

  if (!missionId || !weekStart || daysWorked === undefined) { res.status(400).json({ success: false, message: "missionId, weekStart et daysWorked sont requis." }); return; }

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) { res.status(404).json({ success: false, message: "Mission introuvable." }); return; }
  if (mission.candidateId !== candidateId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }
  if (mission.status !== "ACTIVE") { res.status(400).json({ success: false, message: "La mission n'est pas active." }); return; }

  const weekDate = new Date(weekStart);
  // Always use Monday of the given week
  const day = weekDate.getDay();
  const diff = weekDate.getDate() - day + (day === 0 ? -6 : 1);
  weekDate.setDate(diff);
  weekDate.setHours(0, 0, 0, 0);

  const existing = await prisma.timesheet.findUnique({ where: { missionId_weekStart: { missionId, weekStart: weekDate } } });

  if (existing && existing.status === "VALIDATED") { res.status(400).json({ success: false, message: "Ce timesheet est déjà validé." }); return; }

  const timesheet = await prisma.timesheet.upsert({
    where: { missionId_weekStart: { missionId, weekStart: weekDate } },
    create: { missionId, weekStart: weekDate, daysWorked: Number(daysWorked), description: description || null, status: "DRAFT" },
    update: { daysWorked: Number(daysWorked), description: description || null, status: "DRAFT", rejectionNote: null },
  });

  res.json({ success: true, data: { timesheet } });
}

// PATCH /timesheets/:id/submit — candidate submits for validation
export async function submitTimesheet(req: Request, res: Response): Promise<void> {
  const candidateId = req.user!.userId;
  const ts = await prisma.timesheet.findUnique({ where: { id: req.params.id as string }, include: { mission: true } });

  if (!ts) { res.status(404).json({ success: false, message: "Timesheet introuvable." }); return; }
  if (ts.mission.candidateId !== candidateId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }
  if (ts.status !== "DRAFT" && ts.status !== "REJECTED") { res.status(400).json({ success: false, message: "Ce timesheet ne peut pas être soumis." }); return; }

  const updated = await prisma.timesheet.update({ where: { id: ts.id }, data: { status: "SUBMITTED", submittedAt: new Date(), rejectionNote: null } });

  const weekLabel = new Date(ts.weekStart).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  await notify(ts.mission.recruiterId, "TIMESHEET_SUBMITTED", "Timesheet à valider", `Semaine du ${weekLabel} — ${ts.daysWorked}j à valider pour "${ts.mission.title}".`, JSON.stringify({ missionId: ts.missionId, timesheetId: ts.id }));

  res.json({ success: true, data: { timesheet: updated } });
}

// PATCH /timesheets/:id/validate — recruiter validates
export async function validateTimesheet(req: Request, res: Response): Promise<void> {
  const recruiterId = req.user!.userId;
  const ts = await prisma.timesheet.findUnique({ where: { id: req.params.id as string }, include: { mission: true } });

  if (!ts) { res.status(404).json({ success: false, message: "Timesheet introuvable." }); return; }
  if (ts.mission.recruiterId !== recruiterId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }
  if (ts.status !== "SUBMITTED") { res.status(400).json({ success: false, message: "Ce timesheet n'est pas soumis." }); return; }

  const updated = await prisma.timesheet.update({ where: { id: ts.id }, data: { status: "VALIDATED", validatedAt: new Date() } });

  const amount = ts.mission.tjm ? ts.daysWorked * ts.mission.tjm : null;
  const weekLabel = new Date(ts.weekStart).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  const msg = amount ? `Semaine du ${weekLabel} validée — ${ts.daysWorked}j × ${ts.mission.tjm} MAD = ${amount.toLocaleString()} MAD.` : `Semaine du ${weekLabel} validée — ${ts.daysWorked} jour(s).`;
  await notify(ts.mission.candidateId, "TIMESHEET_VALIDATED", "Timesheet validé ✓", msg, JSON.stringify({ missionId: ts.missionId, timesheetId: ts.id }));

  res.json({ success: true, data: { timesheet: updated } });
}

// PATCH /timesheets/:id/reject — recruiter rejects
export async function rejectTimesheet(req: Request, res: Response): Promise<void> {
  const recruiterId = req.user!.userId;
  const { note } = req.body;
  const ts = await prisma.timesheet.findUnique({ where: { id: req.params.id as string }, include: { mission: true } });

  if (!ts) { res.status(404).json({ success: false, message: "Timesheet introuvable." }); return; }
  if (ts.mission.recruiterId !== recruiterId) { res.status(403).json({ success: false, message: "Accès refusé." }); return; }
  if (ts.status !== "SUBMITTED") { res.status(400).json({ success: false, message: "Ce timesheet n'est pas soumis." }); return; }

  const updated = await prisma.timesheet.update({ where: { id: ts.id }, data: { status: "REJECTED", rejectionNote: note || null } });

  await notify(ts.mission.candidateId, "TIMESHEET_REJECTED", "Timesheet rejeté", `Votre timesheet pour "${ts.mission.title}" a été rejeté.${note ? ` Note : ${note}` : ""}`, JSON.stringify({ missionId: ts.missionId, timesheetId: ts.id }));

  res.json({ success: true, data: { timesheet: updated } });
}
