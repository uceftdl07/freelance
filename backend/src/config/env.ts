import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../.env");
const productionEnvPath = path.resolve(__dirname, "../../.env.production");

// Load environment variables from .env and .env.production as fallback.
// In production, actual environment variables (e.g. on Render) take precedence.
dotenv.config({ path: envPath });
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: productionEnvPath });
}

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  DIRECT_URL: process.env.DIRECT_URL || "",

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "fallback-dev-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Server
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

  // Helpers
  get isDev() {
    return this.NODE_ENV === "development";
  },
  get isProd() {
    return this.NODE_ENV === "production";
  },
} as const;
