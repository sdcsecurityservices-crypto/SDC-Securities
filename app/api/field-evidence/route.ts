import {
  identity,
  json,
  sameOrigin,
  databaseError,
  failure,
} from "@/lib/foundation/http";
import { z } from "zod";
import { cappedForm } from "@/lib/foundation/body";
export const dynamic = "force-dynamic";
const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((x, i) => b[at + i] === x);
/** Check the file's first bytes, not just the browser-declared type. */
function signatureMatches(type: string, b: Uint8Array) {
  switch (type) {
    case "image/jpeg":
      return startsWith(b, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "application/pdf":
      return startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case "video/mp4":
      return startsWith(b, [0x66, 0x74, 0x79, 0x70], 4); // "ftyp"
    case "audio/webm":
      return startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]);
    case "audio/mpeg":
      return startsWith(b, [0x49, 0x44, 0x33]) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
    default:
      return false;
  }
}
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
  } catch (e) {
    return failure(e, "Evidence unavailable");
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const a = await identity();
    if (a.error) return a.error;
    const b = await cappedForm(req, 21000000);
    if (!b) return json({ error: "Maximum file size is 20 MB" }, 413);
    const tenant = z.string().uuid().parse(b.get("tenant")),
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
    if (!signatureMatches(file.type, bytes))
      return json({ error: "File signature does not match its type." }, 400);
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
  } catch (e) {
    return failure(e, "Evidence upload failed");
  }
}
