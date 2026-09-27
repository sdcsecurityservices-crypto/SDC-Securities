import {
  identity,
  json,
  sameOrigin,
  databaseError,
  failure,
} from "@/lib/foundation/http";
import { seal } from "@/lib/employees/crypto";
import { openGateway } from "@/lib/cctv/gateway";
import { z } from "zod";
import { cappedText } from "@/lib/foundation/body";
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
// Camera sources normally sit on the client's private network, so private
// addresses are allowed; loopback and cloud metadata endpoints are not.
function validSource(v: string) {
  try {
    const u = new URL(v);
    if (!["rtsp:", "rtsps:", "http:", "https:"].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return !(
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "::1" ||
      /^127\./.test(host) ||
      /^0\./.test(host) ||
      host === "169.254.169.254" ||
      host === "metadata.google.internal" ||
      host === "fd00:ec2::254"
    );
  } catch {
    return false;
  }
}
const camera = z.object({
  site_id: uuid,
  consent_id: uuid,
  title: z.string().min(2).max(100),
  location: z.string().min(2).max(500),
  stream_type: z.enum(["mock", "rtsp", "onvif", "hls", "vendor"]),
  source: z
    .string()
    .max(4000)
    .refine(validSource, "Use an rtsp://, rtsps://, http:// or https:// camera address.")
    .optional(),
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
  } catch (e) {
    return failure(e, "Camera records unavailable");
  }
}
export async function POST(req: Request, { params }: C) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const a = await identity();
    if (a.error) return a.error;
    const raw = await cappedText(req, 15000);
    if (raw === null) return json({ error: "Request too large" }, 413);
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
        console.error("CCTV gateway failed", { name: (e as Error)?.name });
        return json(
          { error: "The camera gateway is unavailable right now. Try again shortly or contact the control room." },
          503,
        );
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
      else if (p.stream_type !== "mock") {
        // A camera switched from mock to a live type must be given a source.
        let needsSource = !b.id;
        if (b.id) {
          const { data: existing } = await a.db
            .from("cctv_cameras")
            .select("stream_type")
            .eq("tenant_id", t)
            .eq("id", id)
            .maybeSingle();
          needsSource = !existing || existing.stream_type === "mock";
        }
        if (needsSource) return json({ error: "Enter the camera source address" }, 400);
      }
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
    if (!(e instanceof z.ZodError)) return failure(e, "Camera request failed");
    return json({ error: e.issues.map((x) => x.message).join(" · ") }, 400);
  }
}
