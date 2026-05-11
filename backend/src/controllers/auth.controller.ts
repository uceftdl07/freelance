import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { signToken } from "../utils/jwt";
import { sendVerificationEmail } from "../utils/email";
import { env } from "../config/env";

const prisma = new PrismaClient();

// ─── Prepared-statement pool retry (Supabase/pgBouncer) ───────────────────────
function isPreparedStatementPoolError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const fullError = JSON.stringify(error);

  // Check message for prepared statement errors
  const hasPreparedStatementKeywords = message.includes("prepared statement") &&
    (message.includes("does not exist") || message.includes("already exists"));

  // Also check for PostgresError code 42P05 (DUPLICATE_PREPARED_STATEMENT)
  const hasPostgresErrorCode = fullError.includes("42P05") ||
    fullError.includes("already exists");

  return hasPreparedStatementKeywords || hasPostgresErrorCode;
}

async function withRetry<T>(query: () => Promise<T>, label = "query", retryCount = 0): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (!isPreparedStatementPoolError(error)) throw error;
    if (retryCount >= 2) throw error; // Max 2 retries to avoid infinite loops

    console.warn(`[AUTH] Retrying ${label} after prepared-statement error (attempt ${retryCount + 1}/2)`);
    await prisma.$disconnect();

    // Wait 2 seconds for pgBouncer to properly clean up the pool and reset prepared statements
    console.log(`[AUTH] Waiting 2s before retry...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    return withRetry(query, label, retryCount + 1);
  }
}

const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  "postmessage" // redirect_uri for popup-based auth code flow
);

type LinkedInUserInfo = {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

async function fetchLinkedInUserInfo(code: string): Promise<LinkedInUserInfo> {
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET || !env.LINKEDIN_REDIRECT_URI) {
    throw new Error("LinkedIn OAuth is not configured");
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.LINKEDIN_CLIENT_ID,
    client_secret: env.LINKEDIN_CLIENT_SECRET,
    redirect_uri: env.LINKEDIN_REDIRECT_URI,
  });

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`LinkedIn token exchange failed: ${tokenRes.status} ${text}`);
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("LinkedIn did not return an access token");
  }

  const userInfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  if (!userInfoRes.ok) {
    const text = await userInfoRes.text();
    throw new Error(`LinkedIn user info request failed: ${userInfoRes.status} ${text}`);
  }

  return (await userInfoRes.json()) as LinkedInUserInfo;
}

// ─── Validation Schemas ───────────────────────

const registerSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide.")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre."
    ),
  role: z.enum(["CANDIDAT", "RECRUTEUR"], {
    errorMap: () => ({ message: "Le rôle doit être CANDIDAT ou RECRUTEUR." }),
  }),
  firstName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères.")
    .trim(),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .trim(),
  // Recruteur-specific fields
  company: z.string().optional(),
});

const loginSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide.")
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Le mot de passe est requis."),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
  newPassword: z
    .string()
    .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères.")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre."
    ),
});

// ─── Register ─────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password, role, firstName, lastName, company } =
      validation.data;

    // Check if user already exists
    const existingUser = await withRetry(
      () => prisma.user.findUnique({ where: { email } }),
      "findExistingUser"
    );

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Un compte avec cette adresse email existe déjà.",
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user — sequential ops instead of transaction to avoid pgBouncer issues
    const newUser = await withRetry(
      () =>
        prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            role,
            isVerified: false,
            verificationToken,
          },
        }),
      "createUser"
    );

    // Create role-specific profile — cleanup user on failure
    try {
      if (role === "CANDIDAT") {
        await withRetry(
          () =>
            prisma.profileCandidat.create({
              data: {
                userId: newUser.id,
                firstName,
                lastName,
                skills: "[]",
              },
            }),
          "createProfileCandidat"
        );
      } else {
        await withRetry(
          () =>
            prisma.profileRecruteur.create({
              data: {
                userId: newUser.id,
                firstName,
                lastName,
                company: company || "",
              },
            }),
          "createProfileRecruteur"
        );
      }
    } catch (profileErr) {
      // Rollback: delete the user so the email can be re-used
      console.error("[AUTH] Profile creation failed, rolling back user:", profileErr);
      await prisma.user.delete({ where: { id: newUser.id } }).catch(() => {});
      throw profileErr;
    }

    res.status(201).json({
      success: true,
      message: "Inscription réussie ! Vérifiez votre email pour activer votre compte.",
    });

    // Send verification email asynchronously so SMTP issues never block signup.
    void sendVerificationEmail(newUser.email, verificationToken).catch((emailErr) => {
      console.error("[AUTH] Failed to send verification email:", emailErr);
    });
  } catch (error) {
    console.error("[AUTH] Register error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// ─── Verify Email ─────────────────────────────

export async function verifyEmail(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Token de vérification manquant.",
      });
      return;
    }

    // Find user by verification token
    const user = await withRetry(
      () => prisma.user.findFirst({ where: { verificationToken: token } }),
      "findUserByToken"
    );

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Token invalide ou expiré.",
      });
      return;
    }

    if (user.isVerified) {
      res.json({
        success: true,
        message: "Votre email est déjà vérifié.",
      });
      return;
    }

    // Mark as verified and clear token
    await withRetry(
      () => prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, verificationToken: null },
      }),
      "verifyUser"
    );

    res.json({
      success: true,
      message: "Email vérifié avec succès ! Vous pouvez maintenant vous connecter.",
    });
  } catch (error) {
    console.error("[AUTH] VerifyEmail error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// ─── Login ────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await withRetry(
      () => prisma.user.findUnique({ where: { email } }),
      "findUserByEmail"
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect.",
      });
      return;
    }

    // Check if user registered via Google (no password set)
    if (!user.password && user.googleId) {
      res.status(401).json({
        success: false,
        message: "Ce compte utilise la connexion Google. Cliquez sur 'Continuer avec Google'.",
      });
      return;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect.",
      });
      return;
    }

    // Check email verification
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: "Veuillez vérifier votre email avant de vous connecter.",
        code: "EMAIL_NOT_VERIFIED",
      });
      return;
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: "Connexion réussie.",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// ─── Google Login ─────────────────────────────

export async function googleLogin(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { code, role } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        message: "Code d'autorisation Google manquant.",
      });
      return;
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      res.status(500).json({
        success: false,
        message: "Google OAuth n'est pas configuré sur ce serveur.",
      });
      return;
    }

    // Exchange authorization code for tokens
    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
      res.status(401).json({
        success: false,
        message: "Impossible d'obtenir les informations Google.",
      });
      return;
    }

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(401).json({
        success: false,
        message: "Token Google invalide.",
      });
      return;
    }

    const { sub: googleId, email, given_name, family_name } = payload;
    const userEmail = email!.toLowerCase().trim();

    // Check if user already exists (by Google ID or email)
    let user = await withRetry(
      () => prisma.user.findFirst({
        where: { OR: [{ googleId: googleId }, { email: userEmail }] },
      }),
      "findGoogleUser"
    );

    if (user) {
      // Link Google ID if not already linked
      if (!user.googleId) {
        user = await withRetry(
          () => prisma.user.update({
            where: { id: user!.id },
            data: { googleId: googleId, isVerified: true },
          }),
          "linkGoogleId"
        );
      }
    } else {
      // Create new user — sequential ops instead of transaction
      const userRole = role === "RECRUTEUR" ? "RECRUTEUR" : "CANDIDAT";

      const newUser = await withRetry(
        () =>
          prisma.user.create({
            data: {
              email: userEmail,
              password: "",
              role: userRole,
              isVerified: true,
              googleId: googleId,
            },
          }),
        "createGoogleUser"
      );

      try {
        if (userRole === "CANDIDAT") {
          await withRetry(
            () =>
              prisma.profileCandidat.create({
                data: {
                  userId: newUser.id,
                  firstName: given_name || "Utilisateur",
                  lastName: family_name || "Google",
                  skills: "[]",
                },
              }),
            "createGoogleProfileCandidat"
          );
        } else {
          await withRetry(
            () =>
              prisma.profileRecruteur.create({
                data: {
                  userId: newUser.id,
                  firstName: given_name || "Utilisateur",
                  lastName: family_name || "Google",
                  company: "",
                },
              }),
            "createGoogleProfileRecruteur"
          );
        }
      } catch (profileErr) {
        console.error("[AUTH] Google profile creation failed, rolling back user:", profileErr);
        await prisma.user.delete({ where: { id: newUser.id } }).catch(() => {});
        throw profileErr;
      }

      user = newUser;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: "Connexion Google réussie.",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("[AUTH] Google login error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion Google.",
    });
  }
}

// ─── LinkedIn Login ───────────────────────────

export async function linkedInLogin(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { code, role } = req.body as { code?: string; role?: string };

    if (!code) {
      res.status(400).json({
        success: false,
        message: "Code LinkedIn manquant.",
      });
      return;
    }

    const userInfo = await fetchLinkedInUserInfo(code);
    const email = userInfo.email?.toLowerCase().trim();

    if (!email) {
      res.status(401).json({
        success: false,
        message: "Impossible de recuperer l'email LinkedIn.",
      });
      return;
    }

    const firstName = userInfo.given_name || userInfo.name || "Utilisateur";
    const lastName = userInfo.family_name || "LinkedIn";

    let user = await withRetry(
      () => prisma.user.findUnique({ where: { email } }),
      "findLinkedInUserByEmail"
    );

    if (!user) {
      const userRole = role === "RECRUTEUR" ? "RECRUTEUR" : "CANDIDAT";

      const newUser = await withRetry(
        () =>
          prisma.user.create({
            data: {
              email,
              password: "",
              role: userRole,
              isVerified: true,
            },
          }),
        "createLinkedInUser"
      );

      try {
        if (userRole === "CANDIDAT") {
          await withRetry(
            () =>
              prisma.profileCandidat.create({
                data: {
                  userId: newUser.id,
                  firstName,
                  lastName,
                  skills: "[]",
                },
              }),
            "createLinkedInProfileCandidat"
          );
        } else {
          await withRetry(
            () =>
              prisma.profileRecruteur.create({
                data: {
                  userId: newUser.id,
                  firstName,
                  lastName,
                  company: "",
                },
              }),
            "createLinkedInProfileRecruteur"
          );
        }
      } catch (profileErr) {
        console.error("[AUTH] LinkedIn profile creation failed, rolling back user:", profileErr);
        await prisma.user.delete({ where: { id: newUser.id } }).catch(() => {});
        throw profileErr;
      }

      user = newUser;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: "Connexion LinkedIn reussie.",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("[AUTH] LinkedIn login error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion LinkedIn.",
    });
  }
}

// ─── Resend Verification ──────────────────────

export async function resendVerification(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email requis.",
      });
      return;
    }

    const user = await withRetry(
      () => prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } }),
      "findUserForResend"
    );

    if (!user) {
      // Don't reveal if user exists
      res.json({
        success: true,
        message: "Si un compte existe avec cet email, un lien de vérification a été envoyé.",
      });
      return;
    }

    if (user.isVerified) {
      res.json({
        success: true,
        message: "Votre email est déjà vérifié. Vous pouvez vous connecter.",
      });
      return;
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await withRetry(
      () => prisma.user.update({ where: { id: user.id }, data: { verificationToken } }),
      "updateVerificationToken"
    );

    res.json({
      success: true,
      message: "Un nouveau lien de vérification a été envoyé à votre adresse email.",
    });

    // Send asynchronously to avoid blocking the API on SMTP/network issues.
    void sendVerificationEmail(user.email, verificationToken).catch((emailErr) => {
      console.error("[AUTH] Failed to resend verification email:", emailErr);
    });
  } catch (error) {
    console.error("[AUTH] Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}

// ─── Change Password ───────────────────────────

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Données invalides.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await withRetry(
      () => prisma.user.findUnique({ where: { id: userId } }),
      "findUserForPasswordChange"
    );
    if (!user) {
      res.status(404).json({ success: false, message: "Utilisateur introuvable." });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        success: false,
        message: "Ce compte utilise une connexion sociale. Utilisez 'mot de passe oublié'.",
      });
      return;
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(401).json({ success: false, message: "Mot de passe actuel incorrect." });
      return;
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit être différent de l'ancien.",
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await withRetry(
      () => prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } }),
      "updatePassword"
    );

    res.json({ success: true, message: "Mot de passe modifié avec succès." });
  } catch (error) {
    console.error("[AUTH] ChangePassword error:", error);
    res.status(500).json({ success: false, message: "Erreur interne du serveur." });
  }
}

