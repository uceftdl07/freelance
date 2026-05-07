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
const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  "postmessage" // redirect_uri for popup-based auth code flow
);

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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

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

    // Create user + profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user (must verify email before login)
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          isVerified: false,
          verificationToken,
        },
      });

      // Create role-specific profile
      if (role === "CANDIDAT") {
        await tx.profileCandidat.create({
          data: {
            userId: newUser.id,
            firstName,
            lastName,
            skills: "[]",
          },
        });
      } else {
        await tx.profileRecruteur.create({
          data: {
            userId: newUser.id,
            firstName,
            lastName,
            company: company || "",
          },
        });
      }

      return newUser;
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailErr) {
      console.error("[AUTH] Failed to send verification email:", emailErr);
    }

    res.status(201).json({
      success: true,
      message: "Inscription réussie ! Vérifiez votre email pour activer votre compte.",
    });
  } catch (error) {
    console.error("[AUTH] Register error:", error);
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
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

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
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

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
    const user = await prisma.user.findUnique({
      where: { email },
    });

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
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleId },
          { email: userEmail },
        ],
      },
    });

    if (user) {
      // Link Google ID if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleId,
            isVerified: true, // Google-verified email
          },
        });
      }
    } else {
      // Create new user — Google users are auto-verified
      const userRole = role === "RECRUTEUR" ? "RECRUTEUR" : "CANDIDAT";

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: userEmail,
            password: "", // No password for Google-only users
            role: userRole,
            isVerified: true, // Google users are auto-verified
            googleId: googleId,
          },
        });

        // Create profile
        if (userRole === "CANDIDAT") {
          await tx.profileCandidat.create({
            data: {
              userId: newUser.id,
              firstName: given_name || "Utilisateur",
              lastName: family_name || "Google",
              skills: "[]",
            },
          });
        } else {
          await tx.profileRecruteur.create({
            data: {
              userId: newUser.id,
              firstName: given_name || "Utilisateur",
              lastName: family_name || "Google",
              company: "",
            },
          });
        }

        return newUser;
      });
    }

    // Generate JWT
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
    console.error("[AUTH] Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion Google.",
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

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

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
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    // Send email
    await sendVerificationEmail(user.email, verificationToken);

    res.json({
      success: true,
      message: "Un nouveau lien de vérification a été envoyé à votre adresse email.",
    });
  } catch (error) {
    console.error("[AUTH] Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
    });
  }
}
