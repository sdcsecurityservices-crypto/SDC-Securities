import {
  identity,
  json,
  sameOrigin,
  databaseError,
} from "@/lib/foundation/http";
import { seal } from "@/lib/employees/crypto";
import { openGateway } from "@/lib/cctv/gateway";
import { z } from "zod";
export const dynamic = "force-dynamic";
const uuid = z.string().uuid();
type C = { params: Promise<{ action: string }> };
const consent = z.object({
  site_id: uuid,
  title: z.string().min(3).max(200),
  authorized_cameras: z.array(z.string().min(1).max(100)).min(1).max(100),
  permitted_roles: z
    .array(
      z.enum([
        "admin",
        "operations_manager",
        "senior_manager",
        "site_lead",
        "client_user",
      ]),
    )
    .min(1),
  purpose: z.string().min(5).max(1000),
  starts_on: z.string().date(),
  ends_on: z.string().date(),
  hour_from: z.number().int().min(0).max(23),
  hour_to: z.number().int().min(1).max(24),
  signed_document_id: uuid,
  allow_recording: z.boolean().default(false),
});
const camera = z.object({
  site_id: uuid,
  consent_id: uuid,
  title: z.string().min(2).max(100),
  location: z.string().min(2).max(500),
  stream_type: z.enum(["mock", "rtsp", "onvif", "hls", "vendor"]),
  source: z.string().max(4000).optional(),
  post_ids: z.array(uuid).max(100),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  field_of_view: z.string().max(1000).default(""),
  status: z.enum(["online", "offline", "maintenance"]),
});
export async function GET(req: Request, { params }: C) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url),
      t = uuid.parse(u.searchParams.get("tenant")),
      { action } = await params;
    if (action === "posts") {
      const { data, error } = await a.db.rpc("camera_post_context", {
        p_tenant: t,
        p_site: uuid.parse(u.searchParams.get("site")),
      });
      return error ? databaseError(error) : json({ rows: data });
    }
    if (!["consents", "cameras", "access_log"].includes(action))
      return json({ error: "Unknown camera view" }, 404);
    const offset = Math.max(
      0,
      Math.min(100000, Number(u.searchParams.get("offset")) || 0),
    );
    let q = a.db
      .from("cctv_" + action)
      .select(
        action === "cameras"
          ? "id,tenant_id,site_id,consent_id,title,location,stream_type,post_ids,latitude,longitude,field_of_view,status,row_version,created_at"
          : "*",
        { count: "exact" },
      )
      .eq("tenant_id", t)
      .order(action === "access_log" ? "started_at" : "created_at", {
        ascending: false,
      })
      .range(offset, offset + 49);
    if (u.searchParams.get("site"))
      q = q.eq("site_id", uuid.parse(u.searchParams.get("site")));
    if (action !== "access_log") q = q.is("deleted_at", null);
    const { data, error, count } = await q;
    return error ? databaseError(error) : json({ rows: data, total: count });
  } catch {
    return json({ error: "Camera records unavailable" }, 400);
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
      { action } = await params;
    if (action === "view") {
      const { data: s, error } = await a.db.rpc("cctv_view", {
        p_tenant: t,
        p_camera: uuid.parse(b.camera_id),
        p_reason: z
          .string()
          .max(500)
          .parse(b.reason || ""),
        p_session: b.session_id ? uuid.parse(b.session_id) : null,
        p_close: !!b.close,
      });
      if (error) return databaseError(error);
      if (b.close) return json({ closed: true });
      try {
        const gateway = await openGateway(t, s);
        return json({
          session_id: s.session_id,
          title: s.title,
          viewer: s.viewer,
          expires_at: s.expires_at,
          site_id: s.site_id,
          ...gateway,
        });
      } catch (e) {
        await a.db.rpc("cctv_view", {
          p_tenant: t,
          p_camera: b.camera_id,
          p_reason: "",
          p_session: s.session_id,
          p_close: true,
        });
        return json({ error: (e as Error).message }, 503);
      }
    }
    if (action === "revoke") {
      const { data, error } = await a.db
        .from("cctv_consents")
        .update({
          revoked_at: new Date().toISOString(),
          row_version: z.number().int().nonnegative().parse(b.row_version) + 1,
        })
        .eq("tenant_id", t)
        .eq("id", uuid.parse(b.id))
        .eq("row_version", b.row_version)
        .select("id")
        .maybeSingle();
      return error
        ? databaseError(error)
        : data
          ? json({ revoked: true })
          : json({ error: "Consent changed or access denied" }, 409);
    }
    if (!["consents", "cameras"].includes(action))
      return json({ error: "Unknown camera action" }, 404);
    const id = b.id ? uuid.parse(b.id) : crypto.randomUUID();
    let values: Record<string, unknown>;
    if (action === "consents") values = consent.parse(b.data);
    else {
      const p = camera.parse(b.data);
      const { source, ...rest } = p;
      values = rest;
      if (source)
        values.encrypted_source = seal({ url: source }, `${t}:camera:${id}`);
      else if (!b.id && p.stream_type !== "mock")
        return json({ error: "Enter the camera source address" }, 400);
    }
    if (b.id) {
      const v = z.number().int().nonnegative().parse(b.row_version);
      const { data, error } = await a.db
        .from("cctv_" + action)
        .update({ ...values, row_version: v + 1 })
        .eq("tenant_id", t)
        .eq("id", id)
        .eq("row_version", v)
        .select("id")
        .maybeSingle();
      return error
        ? databaseError(error)
        : data
          ? json({ record: data })
          : json({ error: "Record changed or access denied" }, 409);
    }
    const { data, error } = await a.db
      .from("cctv_" + action)
      .insert({ ...values, id, tenant_id: t })
      .select("id")
      .single();
    return error ? databaseError(error) : json({ record: data }, 201);
  } catch (e) {
    return json(
      {
        error:
          e instanceof z.ZodError
            ? e.issues.map((x) => x.message).join(" · ")
            : "Camera request failed",
      },
      400,
    );
  }
}
