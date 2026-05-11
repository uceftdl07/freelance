import nodemailer from "nodemailer";
import { env } from "../config/env";

let transporter: nodemailer.Transporter | null = null;

function isEmailConfigured(): boolean {
  if (env.isDev) return true;
  return env.isResendConfigured || env.isSmtpConfigured;
}

async function sendViaResendApi(to: string, subject: string, html: string): Promise<void> {
  if (!env.isResendConfigured) {
    throw new Error("RESEND_NOT_CONFIGURED");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.SMTP_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const payload = await res.text();
    throw new Error(`RESEND_API_ERROR: ${res.status} ${payload}`);
  }
}

/**
 * Initialize the email transporter.
 * In development: creates an Ethereal test account (no real emails sent).
 * In production: use real SMTP credentials from env vars.
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (env.isDev) {
    // Create a test account on Ethereal
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("[EMAIL] ✉️  Ethereal test account created:", testAccount.user);
  } else {
    if (!isEmailConfigured()) {
      throw new Error("SMTP_NOT_CONFIGURED");
    }

    // Production: configure with real SMTP
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
  }

  return transporter;
}

/**
 * Send a verification email with a styled HTML template.
 */
export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[EMAIL] SMTP not configured; verification email skipped.");
    return;
  }

  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  const subject = "Vérifiez votre email — FreelanceIT";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 520px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0a1628, #111d33); padding: 32px 40px; text-align: center;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #00b8d9, #00a3c4); border-radius: 10px; width: 44px; height: 44px; line-height: 44px; text-align: center;">
                    <span style="color: #ffffff; font-weight: 900; font-size: 16px;">FI</span>
                  </div>
                  <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 12px 0 0;">
                    Freelance<span style="color: #00b8d9;">IT</span>
                  </h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin: 0 0 12px;">
                    Vérifiez votre email ✉️
                  </h2>
                  <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 0 0 28px;">
                    Merci de vous être inscrit sur FreelanceIT ! Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${verifyUrl}" style="display: inline-block; background-color: #00b8d9; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,184,217,0.3);">
                          Confirmer mon email →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 28px 0 0;">
                    Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                    <a href="${verifyUrl}" style="color: #00b8d9; word-break: break-all;">${verifyUrl}</a>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                    © ${new Date().getFullYear()} FreelanceIT — La plateforme freelance IT #1 en France
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  if (env.isResendConfigured) {
    try {
      await sendViaResendApi(to, subject, html);
      console.log(`[EMAIL] Verification email sent via Resend API to ${to}`);
      return;
    } catch (resendErr) {
      console.error("[EMAIL] Resend API failed, falling back to SMTP:", resendErr);
    }
  }

  if (!env.isSmtpConfigured && !env.isDev) {
    console.warn("[EMAIL] No SMTP fallback configured; verification email skipped.");
    return;
  }

  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });

  // In dev, log the Ethereal preview URL
  if (env.isDev) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  📧 EMAIL DE VÉRIFICATION ENVOYÉ                       ║
║                                                        ║
║  To: ${to.padEnd(50)}║
║  Preview: ${String(previewUrl).padEnd(45)}║
╚══════════════════════════════════════════════════════════╝
    `);
  }
}
