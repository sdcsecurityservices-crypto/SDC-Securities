import {
  identity,
  json,
  sameOrigin,
  databaseError,
} from "@/lib/foundation/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const a = await identity();
  if (a.error) return a.error;
  try {
    const u = new URL(req.url),
      id = z.string().uuid().parse(u.searchParams.get("id")),
      tenant = z.string().uuid().parse(u.searchParams.get("tenant"));
    const { data: f, error } = await a.db
      .from("field_evidence")
      .select("object_path,file_name")
      .eq("tenant_id", tenant)
      .eq("id", id)
      .single();
    if (error) return databaseError(error);
    const { error: auditError } = await a.db.rpc("operation_access_audit", {
      p_tenant: tenant,
      p_resource: "evidence",
      p_action: "download",
      p_site: null,
    });
    if (auditError) return databaseError(auditError);
    const { data, error: err } = await a.db.storage
      .from("sdc-field")
      .createSignedUrl(f.object_path, 60, { download: f.file_name });
    return err ? databaseError(err) : json({ url: data.signedUrl });
  } catch {
    return json({ error: "Evidence unavailable" }, 400);
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const a = await identity();
    if (a.error) return a.error;
    if (Number(req.headers.get("content-length")) > 21000000)
      return json({ error: "Maximum file size is 20 MB" }, 413);
    const b = await req.formData(),
      tenant = z.string().uuid().parse(b.get("tenant")),
      site = z.string().uuid().parse(b.get("site")),
      entity = z.string().uuid().parse(b.get("entity")),
      kind = z
        .enum([
          "surveys",
          "findings",
          "incidents",
          "sos",
          "handovers",
          "gate_passes",
          "audits",
          "checkpoints",
          "patrols",
        ])
        .parse(b.get("kind")),
      file = b.get("file");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 20000000 ||
      ![
        "image/jpeg",
        "image/png",
        "application/pdf",
        "video/mp4",
        "audio/webm",
        "audio/mpeg",
      ].includes(file.type)
    )
      return json(
        { error: "Choose a photo, PDF, MP4 or audio file up to 20 MB" },
        400,
      );
    const { data: parent } = await a.db
      .from("field_" + kind)
      .select("id")
      .eq("tenant_id", tenant)
      .eq("site_id", site)
      .eq("id", entity)
      .is("deleted_at", null)
      .maybeSingle();
    if (!parent) return json({ error: "Record unavailable" }, 404);
    const id = crypto.randomUUID(),
      path = `${tenant}/${site}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`,
      bytes = new Uint8Array(await file.arrayBuffer());
    const { error: up } = await a.db.storage
      .from("sdc-field")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (up) return databaseError(up);
    const { error } = await a.db.from("field_evidence").insert({
      id,
      tenant_id: tenant,
      site_id: site,
      entity_type: kind,
      entity_id: entity,
      file_name: file.name.slice(0, 150),
      mime_type: file.type,
      size_bytes: file.size,
      object_path: path,
    });
    return error ? databaseError(error) : json({ id }, 201);
  } catch {
    return json({ error: "Evidence upload failed" }, 400);
  }
}
