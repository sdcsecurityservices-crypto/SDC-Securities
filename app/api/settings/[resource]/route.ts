import {
  identity,
  json,
  sameOrigin,
  databaseError,
} from "@/lib/foundation/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
type C = { params: Promise<{ resource: string }> };
const uuid = z.string().uuid();
export async function GET(req: Request, { params }: C) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url),
      t = uuid.parse(u.searchParams.get("tenant")),
      { resource } = await params;
    if (resource === "members") {
      const { data, error } = await a.db.rpc("workspace_members", {
        p_tenant: t,
      });
      return error ? databaseError(error) : json({ rows: data });
    }
    if (!["business", "policy", "preferences"].includes(resource))
      return json({ error: "Unknown settings" }, 404);
    const { data, error } = await a.db
      .from(
        {
          business: "business_settings",
          policy: "roster_policy",
          preferences: "notification_preferences",
        }[resource]!,
      )
      .select("*")
      .eq("tenant_id", t)
      .limit(1)
      .maybeSingle();
    return error ? databaseError(error) : json({ record: data });
  } catch {
    return json({ error: "Settings unavailable" }, 400);
  }
}
export async function POST(req: Request, { params }: C) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const a = await identity();
    if (a.error) return a.error;
    const raw = await req.text();
    if (raw.length > 15000) return json({ error: "Request too large" }, 413);
    const b = JSON.parse(raw),
      t = uuid.parse(b.tenant_id),
      { resource } = await params;
    if (resource === "members") {
      const p = z
        .object({
          email: z.string().email(),
          name: z.string().min(2).max(150),
          role: z.enum([
            "admin",
            "operations_manager",
            "senior_manager",
            "site_lead",
            "employee",
            "hr_payroll",
            "trainer",
            "client_user",
          ]),
          active: z.boolean(),
          sites: z.array(uuid).max(300),
          clients: z.array(uuid).max(100),
        })
        .parse(b.data);
      const { data, error } = await a.db.rpc("workspace_grant", {
        p_tenant: t,
        p_email: p.email,
        p_name: p.name,
        p_role: p.role,
        p_active: p.active,
        p_sites: p.sites,
        p_clients: p.clients,
      });
      return error ? databaseError(error) : json({ id: data });
    }
    let values: Record<string, unknown>, table: string;
    if (resource === "business") {
      table = "business_settings";
      values = z
        .object({
          legal_name: z.string().max(200),
          gstin: z.string().max(15),
          billing_address: z.string().max(2000),
          sac_code: z.string().max(12),
          bank_instructions: z.string().max(1500),
          retention_days: z.number().int().min(365).max(3650),
          external_notifications_enabled: z.boolean(),
        })
        .parse(b.data);
    } else if (resource === "policy") {
      table = "roster_policy";
      values = z
        .object({
          minimum_rest_hours: z.number().int().min(0).max(24),
          maximum_weekly_hours: z.number().int().min(8).max(84),
          no_show_minutes: z.number().int().min(0).max(180),
        })
        .parse(b.data);
    } else if (resource === "preferences") {
      table = "notification_preferences";
      const { data: m } = await a.db
        .from("memberships")
        .select("id")
        .eq("tenant_id", t)
        .eq("user_id", a.user.id)
        .eq("active", true)
        .single();
      if (!m) return json({ error: "Access denied" }, 403);
      values = {
        ...z
          .object({
            language: z.enum(["English", "Kannada", "Hindi"]),
            email: z.boolean(),
            sms: z.boolean(),
            whatsapp: z.boolean(),
          })
          .parse(b.data),
        membership_id: m.id,
      };
    } else return json({ error: "Unknown settings" }, 404);
    const { error } = await a.db
      .from(table)
      .upsert({ ...values, tenant_id: t });
    return error ? databaseError(error) : json({ saved: true });
  } catch (e) {
    return json(
      {
        error:
          e instanceof z.ZodError
            ? e.issues.map((x) => x.message).join(" · ")
            : "Settings could not be saved",
      },
      400,
    );
  }
}
