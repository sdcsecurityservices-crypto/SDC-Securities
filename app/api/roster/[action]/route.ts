import {
  identity,
  json,
  sameOrigin,
  databaseError,
} from "@/lib/foundation/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
type C = { params: Promise<{ action: string }> };
const uuid = z.string().uuid(),
  day = z.string().date();
export async function GET(req: Request, { params }: C) {
  try {
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db } = auth,
      u = new URL(req.url),
      { action } = await params,
      t = uuid.parse(u.searchParams.get("tenant"));
    if (action === "notifications") {
      const { data, error } = await db
        .from("workforce_notifications")
        .select("*")
        .eq("tenant_id", t)
        .order("created_at", { ascending: false })
        .limit(50);
      return error ? databaseError(error) : json({ rows: data });
    }
    if (action === "forecast") {
      const { data, error } = await db.rpc("roster_forecast", {
        p_tenant: t,
        p_site: uuid.parse(u.searchParams.get("site")),
        p_from: day.parse(u.searchParams.get("from")),
      });
      return error ? databaseError(error) : json({ rows: data });
    }
    if (action === "history") {
      const { data, error } = await db
        .from("roster_publications")
        .select("id,site_id,week_start,revision,published_at")
        .eq("tenant_id", t)
        .eq("site_id", uuid.parse(u.searchParams.get("site")))
        .order("published_at", { ascending: false })
        .limit(30);
      return error ? databaseError(error) : json({ rows: data });
    }
    const args =
      action === "board"
        ? {
            p_tenant: t,
            p_site: u.searchParams.get("site")
              ? uuid.parse(u.searchParams.get("site"))
              : null,
            p_from: day.parse(u.searchParams.get("from")),
            p_days: Math.min(
              31,
              Math.max(1, Number(u.searchParams.get("days")) || 7),
            ),
          }
        : action === "candidates"
          ? {
              p_tenant: t,
              p_post: uuid.parse(u.searchParams.get("post")),
              p_shift: uuid.parse(u.searchParams.get("shift")),
              p_date: day.parse(u.searchParams.get("date")),
              p_query: u.searchParams.get("q") || "",
              p_offset: Math.max(0, Number(u.searchParams.get("offset")) || 0),
            }
          : null;
    if (!args) return json({ error: "Unknown roster view" }, 404);
    const { data, error } = await db.rpc("roster_" + action, args);
    return error ? databaseError(error) : json({ rows: data });
  } catch {
    return json({ error: "Invalid roster filters" }, 400);
  }
}
export async function POST(req: Request, { params }: C) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const auth = await identity();
    if (auth.error) return auth.error;
    const { action } = await params,
      raw = await req.text();
    if (raw.length > 5000) return json({ error: "Request too large" }, 413);
    const b = JSON.parse(raw),
      t = uuid.parse(b.tenant_id);
    let args: Record<string, unknown>;
    if (action === "assign")
      args = {
        p_tenant: t,
        p_employee: uuid.parse(b.employee_id),
        p_post: uuid.parse(b.post_id),
        p_shift: uuid.parse(b.shift_id),
        p_date: day.parse(b.work_date),
        p_slot: z.number().int().min(1).max(100).parse(b.slot),
        p_reason: z.string().min(3).max(500).parse(b.reason),
        p_id: b.id ? uuid.parse(b.id) : null,
        p_version: b.id
          ? z.number().int().nonnegative().parse(b.row_version)
          : null,
        p_override: z
          .string()
          .max(500)
          .parse(b.override_reason || ""),
      };
    else if (action === "remove")
      args = {
        p_tenant: t,
        p_id: uuid.parse(b.id),
        p_version: z.number().int().nonnegative().parse(b.row_version),
        p_reason: z.string().min(3).max(500).parse(b.reason),
      };
    else if (action === "publish")
      args = {
        p_tenant: t,
        p_site: uuid.parse(b.site_id),
        p_week: day.parse(b.week),
      };
    else if (action === "copy")
      args = {
        p_tenant: t,
        p_site: uuid.parse(b.site_id),
        p_from: day.parse(b.from),
        p_to: day.parse(b.to),
      };
    else if (action === "acknowledge" || action === "notification_read")
      args = { p_tenant: t, p_id: uuid.parse(b.id) };
    else return json({ error: "Unknown roster action" }, 404);
    const { data, error } = await auth.db.rpc(
      action === "notification_read" ? action : "roster_" + action,
      args,
    );
    return error ? databaseError(error) : json({ record: data });
  } catch {
    return json({ error: "Invalid roster request" }, 400);
  }
}
