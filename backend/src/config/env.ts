import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load the first available env file from common local/project locations
const envCandidates = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../../.env.local"),
  path.resolve(__dirname, "../../../.env.production"),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  DIRECT_URL: process.env.DIRECT_URL || "",

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "fallback-dev-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Server
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  TRUST_PROXY: process.env.TRUST_PROXY || "1",

  // API Security
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "200", 10),

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

  // Email / SMTP
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || '"FreelanceIT" <noreply@freelanceit.fr>',

  // Helpers
  get isDev() {
    return this.NODE_ENV === "development";
  },
  get isProd() {
    return this.NODE_ENV === "production";
  },
  get isSmtpConfigured() {
    return Boolean(this.SMTP_HOST && this.SMTP_USER && this.SMTP_PASS);
  },
} as const;

// In production, fail fast for critical secrets.
if (env.isProd) {
  const missing: string[] = [];
  if (!env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!env.JWT_SECRET || env.JWT_SECRET === "fallback-dev-secret") missing.push("JWT_SECRET");
  if (!env.FRONTEND_URL) missing.push("FRONTEND_URL");

  if (missing.length > 0) {
    throw new Error(`[ENV] Missing required env vars in production: ${missing.join(", ")}`);
  }
}

