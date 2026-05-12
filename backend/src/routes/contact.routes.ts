import { Router, Request, Response } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";

const router = Router();

const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(5000),
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Trop de messages. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

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

router.post("/", contactLimiter, async (req: Request, res: Response) => {
  const validation = contactSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Données invalides.",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }
  const transport = getTransport();
  if (!transport) {
    res.status(503).json({ success: false, message: "Service email indisponible." });
    return;
  }
  const { firstName, lastName, email, message } = validation.data;
  const to = process.env.CONTACT_TO || process.env.SMTP_USER!;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;

  try {
    await transport.sendMail({
      from,
      to,
      replyTo: email,
      subject: `[Contact] ${firstName} ${lastName}`,
      html: `
        <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f1f5f9">
          <h2 style="color:#0a1628">Nouveau message de contact</h2>
          <table style="width:100%;background:#fff;border-radius:12px;padding:16px;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#666;font-size:13px">Nom</td><td style="padding:6px 0;font-weight:700">${firstName} ${lastName}</td></tr>
            <tr><td style="padding:6px 0;color:#666;font-size:13px">Email</td><td style="padding:6px 0"><a href="mailto:${email}">${email}</a></td></tr>
          </table>
          <div style="background:#fff;border-radius:12px;padding:16px;margin-top:12px;white-space:pre-wrap;color:#333;font-size:14px;line-height:1.6">${message.replace(/</g, "&lt;")}</div>
        </div>`,
    });
    res.json({ success: true, message: "Message envoyé." });
  } catch (err) {
    console.error("[CONTACT] sendMail error:", err);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi." });
  }
});

export default router;
