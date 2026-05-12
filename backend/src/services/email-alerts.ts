import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import cron from "node-cron";

const prisma = new PrismaClient();

function parseSkills(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map((s) => String(s)) : [];
  } catch {
    return [];
  }
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM = process.env.SMTP_FROM || "FreelanceIT <noreply@freelanceit.app>";
const FRONTEND = process.env.FRONTEND_URL || "https://freelanceit.app";

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  tjm: number | null;
  tags: string | null;
  createdAt: Date;
};

function renderEmail(firstName: string, jobs: JobRow[]): string {
  const items = jobs
    .map(
      (j) => `
      <tr>
        <td style="padding:14px;border-bottom:1px solid #eee">
          <a href="${FRONTEND}/offres/${j.id}" style="color:#0a1628;font-weight:700;text-decoration:none;font-size:15px">${j.title}</a>
          <div style="color:#666;font-size:13px;margin-top:4px">${j.company} · ${j.location}${j.tjm ? ` · ${j.tjm}€/jour` : ""}</div>
        </td>
      </tr>`
    )
    .join("");
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f1f5f9">
    <h2 style="color:#0a1628">Bonjour ${firstName},</h2>
    <p style="color:#333;font-size:14px">Voici ${jobs.length} nouvelle${jobs.length > 1 ? "s" : ""} offre${jobs.length > 1 ? "s" : ""} qui correspond${jobs.length > 1 ? "ent" : ""} à votre profil :</p>
    <table style="width:100%;background:#fff;border-radius:12px;border-collapse:collapse;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05)">${items}</table>
    <p style="text-align:center;margin-top:24px">
      <a href="${FRONTEND}/offres" style="background:#00b8d9;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block">Voir toutes les offres</a>
    </p>
    <p style="color:#999;font-size:11px;text-align:center;margin-top:32px">
      Vous recevez cet email parce que vous êtes inscrit sur FreelanceIT. <br/>
      <a href="${FRONTEND}/dashboard/candidat/parametres" style="color:#999">Gérer mes préférences</a>
    </p>
  </div>`;
}

export async function sendJobAlerts(): Promise<{ sent: number; skipped: number }> {
  const transport = getTransport();
  if (!transport) {
    console.warn("[ALERTS] SMTP not configured — skipping email run");
    return { sent: 0, skipped: 0 };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newJobs = await prisma.jobOffer.findMany({
    where: { status: "ACTIVE", createdAt: { gte: since } },
  });
  if (newJobs.length === 0) return { sent: 0, skipped: 0 };

  const candidates = await prisma.profileCandidat.findMany({
    where: { status: "PUBLISHED" },
    select: { firstName: true, skills: true, user: { select: { email: true } } },
  });

  let sent = 0;
  let skipped = 0;
  for (const c of candidates) {
    const skills = parseSkills(c.skills).map((s) => s.toLowerCase());
    if (skills.length === 0) {
      skipped++;
      continue;
    }
    const matches = newJobs.filter((j) => {
      const tags = parseSkills(j.tags).map((s) => s.toLowerCase());
      return tags.some((t) => skills.includes(t));
    });
    if (matches.length === 0) {
      skipped++;
      continue;
    }
    try {
      await transport.sendMail({
        from: FROM,
        to: c.user.email,
        subject: `🚀 ${matches.length} nouvelle${matches.length > 1 ? "s" : ""} offre${matches.length > 1 ? "s" : ""} pour vous`,
        html: renderEmail(c.firstName, matches.slice(0, 10)),
      });
      sent++;
    } catch (err) {
      console.error("[ALERTS] sendMail error for", c.user.email, err);
      skipped++;
    }
  }
  console.log(`[ALERTS] Done: sent=${sent} skipped=${skipped}`);
  return { sent, skipped };
}

export function scheduleJobAlerts(): void {
  if (!getTransport()) {
    console.log("[ALERTS] SMTP not configured — cron not scheduled");
    return;
  }
  // Every day at 09:00 server time
  cron.schedule("0 9 * * *", () => {
    sendJobAlerts().catch((err) => console.error("[ALERTS] Cron error:", err));
  });
  console.log("[ALERTS] Daily job-alert cron scheduled (09:00)");
}
