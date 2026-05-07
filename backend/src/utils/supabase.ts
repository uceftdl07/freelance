import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn(
    "[Supabase] SUPABASE_URL or SUPABASE_ANON_KEY is missing — storage uploads will fail."
  );
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Service role client bypasses RLS — use only for server-side storage operations
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);
