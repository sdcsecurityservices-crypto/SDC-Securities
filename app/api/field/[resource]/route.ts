import {
  identity,
  json,
  sameOrigin,
  databaseError,
} from "@/lib/foundation/http";
import { fieldSchemas, type FieldResource } from "@/lib/field/resources";
import { z } from "zod";
export const dynamic = "force-dynamic";
type C = { params: Promise<{ resource: string }> };
const uuid = z.string().uuid();
export async function GET(req: Request, { params }: C) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url),
      { resource } = await params,
      t = uuid.parse(u.searchParams.get("tenant"));
    if (resource === "context" || resource === "people") {
      const { data, error } = await a.db.rpc(
        resource === "context" ? "field_context" : "field_people",
        {
          p_tenant: t,
          ...(resource === "people"
            ? {
                p_site: uuid.parse(u.searchParams.get("site")),
                p_query: u.searchParams.get("q") || "",
              }
            : {}),
        },
      );
      return error
        ? databaseError(error)
        : json(resource === "context" ? data : { rows: data });
    }
    if (resource === "score") {
      const { data, error } = await a.db.rpc("site_security_score", {
        p_tenant: t,
        p_site: uuid.parse(u.searchParams.get("site")),
      });
      return error ? databaseError(error) : json(data);
    }
    if (
      !(resource in fieldSchemas) &&
      !["events", "evidence", "scans"].includes(resource)
    )
      return json({ error: "Unknown view" }, 404);
    const offset = Math.min(
      100000,
      Math.max(0, Number(u.searchParams.get("offset")) || 0),
    );
    let q = a.db
      .from(resource === "scans" ? "patrol_scans" : "field_" + resource)
      .select("*", { count: "exact" })
      .eq("tenant_id", t)
      .order(resource === "scans" ? "scanned_at" : "created_at", {
        ascending: false,
      })
      .order("id")
      .range(offset, offset + 49);
    if (resource in fieldSchemas) q = q.is("deleted_at", null);
    for (const [p, col] of [
      ["site", "site_id"],
      ["entity", "entity_id"],
      ["patrol", "patrol_id"],
    ])
      if (u.searchParams.get(p))
        q = q.eq(col, uuid.parse(u.searchParams.get(p)));
    if (u.searchParams.get("kind") && ["events", "evidence"].includes(resource))
      q = q.eq("entity_type", u.searchParams.get("kind"));
    if (u.searchParams.get("q") && resource in fieldSchemas)
      q = q.ilike(
        "title",
        "%" +
          u.searchParams
            .get("q")!
            .replace(/[%_\\]/g, "")
            .slice(0, 80) +
          "%",
      );
    const { data, error, count } = await q;
    return error
      ? databaseError(error)
      : json({
          rows: data,
          total: count,
          nextOffset: offset + 50 < (count || 0) ? offset + 50 : null,
        });
  } catch {
    return json({ error: "Invalid field-operation request" }, 400);
  }
}
export async function POST(req: Request, { params }: C) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const a = await identity();
    if (a.error) return a.error;
    const raw = await req.text();
    if (raw.length > 30000) return json({ error: "Request too large" }, 413);
    const b = JSON.parse(raw),
      { resource } = await params,
      t = uuid.parse(b.tenant_id);
    if (resource === "transition") {
      const { data, error } = await a.db.rpc("field_transition", {
        p_tenant: t,
        p_kind: z
          .enum([
            "findings",
            "incidents",
            "sos",
            "handovers",
            "gate_passes",
            "audits",
          ])
          .parse(b.kind),
        p_id: uuid.parse(b.id),
        p_version: z.number().int().nonnegative().parse(b.row_version),
        p_status: z.string().max(30).parse(b.status),
        p_comment: z.string().min(3).max(4000).parse(b.comment),
        p_signoff: z
          .string()
          .max(150)
          .parse(b.signoff || ""),
        p_ip:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unavailable",
      });
      return error ? databaseError(error) : json({ record: data });
    }
    if (resource === "scan") {
      const { error } = await a.db.rpc("patrol_scan", {
        p_tenant: t,
        p_patrol: uuid.parse(b.patrol_id),
        p_token: uuid.parse(b.token),
        p_lat: z.number().min(-90).max(90).parse(b.latitude),
        p_lon: z.number().min(-180).max(180).parse(b.longitude),
        p_accuracy: z.number().min(0).max(100).parse(b.accuracy),
      });
      return error ? databaseError(error) : json({ scanned: true });
    }
    if (!(resource in fieldSchemas))
      return json({ error: "Unknown resource" }, 404);
    const values = fieldSchemas[resource as FieldResource].parse(b.data);
    if (b.id) {
      const id = uuid.parse(b.id),
        v = z.number().int().nonnegative().parse(b.row_version);
      const { data, error } = await a.db
        .from("field_" + resource)
        .update({ ...values, row_version: v + 1 })
        .eq("tenant_id", t)
        .eq("id", id)
        .eq("row_version", v)
        .select()
        .maybeSingle();
      return error
        ? databaseError(error)
        : data
          ? json({ record: data })
          : json({ error: "Record changed or unavailable" }, 409);
    }
    const { data, error } = await a.db
      .from("field_" + resource)
      .insert({ ...values, tenant_id: t })
      .select()
      .single();
    return error ? databaseError(error) : json({ record: data }, 201);
  } catch (e) {
    return json(
      {
        error:
          e instanceof z.ZodError
            ? e.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join(" · ")
            : "Record could not be saved",
      },
      400,
    );
  }
}
