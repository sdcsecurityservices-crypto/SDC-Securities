import { createClient } from "@supabase/supabase-js";

// Server-only careers configuration. Applications go to the live SDC
// workspace unless CAREERS_TENANT_ID points somewhere else (e.g. the demo
// workspace while testing).
export const careersTenant = () => process.env.CAREERS_TENANT_ID || "13e57e2c-de02-46c9-89a3-e33376cda21b";

/** Anonymous client: the publishable key, no session. Never the secret key. */
export function anonDb() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Browser upload settings. The publishable key is designed to be public. */
export function uploadConfig() {
  return process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY
    ? { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_PUBLISHABLE_KEY }
    : null;
}

/** Turnstile is on only when both keys are configured. */
export function turnstileSiteKey() {
  const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    secret = process.env.TURNSTILE_SECRET_KEY;
  return site && secret ? site : null;
}

export type Opening = {
  id: string;
  role: string;
  title_en: string;
  title_kn: string;
  title_hi: string;
  area: string;
  shift: string;
  gender_requirement: "any" | "female" | "male";
  openings: number;
};

export async function openPositions(): Promise<Opening[]> {
  const db = anonDb();
  if (!db) return [];
  try {
    const { data, error } = await db.rpc("careers_open_positions", { p_tenant: careersTenant() });
    if (error) {
      console.error("Open positions unavailable", { code: error.code });
      return [];
    }
    return Array.isArray(data) ? (data as Opening[]) : [];
  } catch {
    return [];
  }
}
