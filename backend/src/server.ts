import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import cvRoutes from "./routes/cv.routes";
import searchRoutes from "./routes/search.routes";
import bonusRoutes from "./routes/bonus.routes";
import profilesRoutes from "./routes/profiles.routes";
import jobsRoutes from "./routes/jobs.routes";
import applicationsRoutes from "./routes/applications.routes";
import messagingRoutes from "./routes/messaging.routes";
import contactRoutes from "./routes/contact.routes";
import quizRoutes from "./routes/quiz.routes";
import statsRoutes from "./routes/stats.routes";
import reviewsRoutes from "./routes/reviews.routes";
import aiRoutes from "./routes/ai.routes";
import adminRoutes from "./routes/admin.routes";
import communityRoutes from "./routes/community.routes";
import { scheduleJobAlerts, sendJobAlerts } from "./services/email-alerts";
// ─── Create Express App ───────────────────────

const app = express();

app.set("trust proxy", env.TRUST_PROXY);

// ─── Middleware ────────────────────────────────

// CORS — dynamic whitelist for cloud deployment
const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;

  try {
    const parsed = new URL(origin);
    // Allow Vercel preview and production domains.
    if (parsed.hostname.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }

  return false;
}

const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de requêtes. Veuillez réessayer dans quelques minutes.",
  },
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      // Block everything else
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Apply a global API rate limiter, excluding health checks.
app.use("/api", (req, res, next) => {
  if (req.path === "/health") {
    next();
    return;
  }
  apiRateLimiter(req, res, next);
});

// ─── Routes ───────────────────────────────────

// Health check
app.get("/api/health", (_req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: "FreelanceIT API is running 🚀",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Auth routes (register, login)
app.use("/api/auth", authRoutes);

// Profile routes (me, public profile)
app.use("/api/profile", profileRoutes);

// CV routes (upload, parse, save)
app.use("/api/cv", cvRoutes);

// Search routes (candidates)
app.use("/api/search", searchRoutes);

// Bonus routes (matching, messaging, notifications)
app.use("/api", bonusRoutes);

// Public profiles route (wizard)
app.use("/api/profiles", profilesRoutes);

// Job offers routes (CRUD)
app.use("/api/jobs", jobsRoutes);

// Applications routes (candidate apply / recruiter manage)
app.use("/api/applications", applicationsRoutes);

// Messaging routes
app.use("/api/messaging", messagingRoutes);

// Public contact form
app.use("/api/contact", contactRoutes);

// Quiz / QCM routes
app.use("/api/quizzes", quizRoutes);

// Public stats (TJM, overview)
app.use("/api/stats", statsRoutes);

// Reviews / Réputation
app.use("/api/reviews", reviewsRoutes);

// IA — génération de profil, mission, analyse CV
app.use("/api/ai", aiRoutes);

// Admin — stats, users, modération, content blocks
app.use("/api/admin", adminRoutes);

// Community — posts partagés
app.use("/api/community", communityRoutes);

// Manual trigger for job-alerts cron (admin/debug — protect with header secret).
app.post("/api/admin/run-job-alerts", async (req: express.Request, res: express.Response) => {
  if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return;
  }
  const result = await sendJobAlerts();
  res.json({ success: true, data: result });
});

// ─── 404 Handler ──────────────────────────────

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée.",
  });
});

// ─── Global Error Handler ─────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[SERVER] Unhandled error:", err);
    res.status(500).json({
      success: false,
      message: env.isDev
        ? err.message
        : "Erreur interne du serveur.",
    });
  }
);

// ─── Start Server ─────────────────────────────

scheduleJobAlerts();

app.listen(env.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 FreelanceIT API Server                 ║
║                                              ║
║   Port:        ${String(env.PORT).padEnd(28)}║
║   Environment: ${env.NODE_ENV.padEnd(28)}║
║   Frontend:    ${env.FRONTEND_URL.padEnd(28)}║
║                                              ║
║   Routes:                                    ║
║   POST /api/auth/register                    ║
║   POST /api/auth/login                       ║
║   GET  /api/auth/verify-email                ║
║   POST /api/auth/google                      ║
║   POST /api/auth/resend-verification         ║
║   GET  /api/profile/me                       ║
║   PUT  /api/profile/me                       ║
║   GET  /api/jobs        (public)             ║
║   POST /api/jobs        (recruiter)          ║
║   GET  /api/health                           ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
