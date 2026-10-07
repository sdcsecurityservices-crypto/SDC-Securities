import { createClient } from "@supabase/supabase-js";
// Server-only client for account invitations. The secret key bypasses row level
// security, so it is used for nothing except sending invitation emails.
export function invitesConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
export function adminAuth() {
  if (!invitesConfigured()) throw Error("Invitations are not configured.");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ).auth.admin;
}
