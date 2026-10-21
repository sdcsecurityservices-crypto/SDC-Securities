import { z } from "zod";
import { json, clientIp } from "@/lib/foundation/http";
import { cappedJson } from "@/lib/foundation/body";
import { applicationSchema, filesSchema, normalisePhone } from "@/lib/careers/options";
import { anonDb, careersTenant } from "@/lib/careers/server";
import { SITE_URL } from "@/lib/site";
export const dynamic = "force-dynamic";

// Public application endpoint. Layers, in order:
//  1. same-site origin check;
//  2. per-IP rate limit, kept in memory. Railway runs one instance, so this
//     is effective; it resets on deploy and is not shared between replicas.
//     The database adds its own limits (3 per phone per day, 200 per hour);
//  3. Cloudflare Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY and
//     TURNSTILE_SECRET_KEY are set; otherwise a honeypot field and a minimum
//     time to fill the form;
//  4. zod validation, then the careers_submit_application database function
//     (publishable key, no service-role key), which validates again.

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const MIN_FILL_MS = 10_000;
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000)
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return recent.length > MAX_PER_WINDOW;
}

let warned = false;
const body = z.object({
  application: z.unknown(),
  files: z.unknown(),
  turnstile_token: z.string().max(4096).optional().default(""),
  website: z.string().max(200).optional().default(""),
  started_at: z.number().int().positive(),
});

function allowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set<string>([new URL(req.url).origin]);
  if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
  // The public address fronts this app through a proxy, so the browser's
  // origin is the public one even though the request lands here.
  allowed.add(new URL(SITE_URL).origin);
  allowed.add(new URL(SITE_URL).origin.replace("://", "://www."));
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) {
    allowed.add("https://" + host);
    if (process.env.NODE_ENV !== "production") allowed.add("http://" + host);
  }
  return allowed.has(origin);
}

async function verifyTurnstile(token: string, ip: string) {
  if (!token) return false;
  try {
    const form = new FormData();
    form.set("secret", process.env.TURNSTILE_SECRET_KEY!);
    form.set("response", token);
    if (ip !== "unavailable") form.set("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(8000),
    });
    const d = (await r.json()) as { success?: boolean };
    return d.success === true;
  } catch {
    return false;
  }
}

const fail = (code: string, status: number) => json({ code }, status);

export async function POST(req: Request) {
  try {
    if (!allowedOrigin(req)) return fail("invalid", 403);
    const ip = clientIp(req);
    if (limited(ip)) return fail("rate", 429);
    const raw = await cappedJson(req, 20_000);
    if (raw === null) return fail("invalid", 413);
    const b = body.parse(raw);

    const turnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
    if (turnstile) {
      if (!(await verifyTurnstile(b.turnstile_token, ip))) return fail("captcha", 400);
    } else {
      if (!warned) {
        console.warn("Careers form: Turnstile keys are not configured; using honeypot, fill-time and rate limits only.");
        warned = true;
      }
      if (b.website.trim() !== "" || Date.now() - b.started_at < MIN_FILL_MS) return fail("captcha", 400);
    }

    const parsed = applicationSchema.safeParse(b.application);
    const files = filesSchema.safeParse(b.files);
    if (!parsed.success || !files.success) return fail("invalid", 400);
    const a = parsed.data;
    if (files.data.some((f) => !f.path.startsWith(`pending/${a.id}/`))) return fail("file", 400);

    const db = anonDb();
    if (!db) return fail("server", 503);
    const payload = {
      ...a,
      opening_id: a.opening_id || null,
      whatsapp_phone: a.whatsapp_same ? "" : normalisePhone(a.whatsapp_phone) || "",
      service_years: a.ex_serviceman ? (a.service_years ?? null) : null,
    };
    const { data, error } = await db.rpc("careers_submit_application", {
      p_tenant: careersTenant(),
      p_payload: payload,
      p_files: files.data,
      p_gate: process.env.CAREERS_GATE_TOKEN || "",
    });
    if (error) {
      if (error.code === "P0001" && /throttl/i.test(error.hint || "")) {
        return fail(/hour/i.test(error.message) ? "rate" : "throttled", 429);
      }
      if (error.code === "23505") return fail("duplicate", 409);
      if (error.code === "22023") {
        if (/file/i.test(error.message)) return fail("file", 400);
        if (/opening/i.test(error.message)) return fail("closed", 409);
        return fail("invalid", 400);
      }
      console.error("Careers submission failed", { code: error.code });
      return fail("server", 503);
    }
    return json({ reference: (data as { reference: string }).reference }, 201);
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError) return fail("invalid", 400);
    console.error("Careers submission failed", { name: (e as Error)?.name });
    return fail("server", 503);
  }
}
