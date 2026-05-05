import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import cvRoutes from "./routes/cv.routes";
import searchRoutes from "./routes/search.routes";
import bonusRoutes from "./routes/bonus.routes";
import profilesRoutes from "./routes/profiles.routes";
import jobsRoutes from "./routes/jobs.routes";

// ─── Create Express App ───────────────────────

const app = express();

// ─── Middleware ────────────────────────────────

// CORS — dynamic whitelist for cloud deployment
const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "https://www.freelanceit.ma",
  "https://freelanceit.ma",
];

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow configured origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any Vercel preview/production domain
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      // Allow Render preview/production apps if front-end is deployed there
      if (/\.render\.com$/.test(origin)) return callback(null, true);
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
