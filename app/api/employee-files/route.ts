import {
  identity,
  json,
  databaseError,
  sameOrigin,
} from "@/lib/foundation/http";
import { tenantId } from "@/lib/foundation/validation";
import { hrRoles } from "@/lib/employees/validation";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db } = auth;
    const u = new URL(req.url),
      tenant = tenantId.safeParse(u.searchParams.get("tenant")),
      employee = tenantId.safeParse(u.searchParams.get("employee"));
    if (!tenant.success || !employee.success)
      return json({ error: "Invalid employee." }, 400);
    let q = db
      .from("employee_documents")
      .select("*")
      .eq("tenant_id", tenant.data)
      .eq("employee_id", employee.data)
      .is("deleted_at", null);
    const photo = u.searchParams.get("photo") === "true";
    if (photo)
      q = q
        .eq("category", "photo")
        .order("created_at", { ascending: false })
        .limit(1);
    else {
      const id = tenantId.safeParse(u.searchParams.get("id"));
      if (!id.success) return json({ error: "Invalid document." }, 400);
      q = q.eq("id", id.data);
    }
    const { data, error } = await q.maybeSingle();
    if (error) return databaseError(error);
    if (!data) return json({ error: "Document unavailable." }, 404);
    if (!photo) {
      const { error } = await db.rpc("employee_access_audit", {
        p_tenant: tenant.data,
        p_employee: employee.data,
        p_action: "document_download",
        p_reason: "Employee document download",
      });
      if (error) return databaseError(error);
    }
    const { data: file, error: download } = await db.storage
      .from("sdc-employees")
      .download(data.object_path);
    if (download || !file) return json({ error: "Download unavailable." }, 503);
    return new Response(file, {
      headers: {
        "Content-Type": data.mime_type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `${photo ? "inline" : "attachment"}; filename="${data.file_name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      },
    });
  } catch {
    return json({ error: "Document unavailable." }, 503);
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req))
      return json({ error: "Invalid request origin." }, 403);
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db, user } = auth;
    if (Number(req.headers.get("content-length")) > 11000000)
      return json({ error: "Maximum file size is 10 MB." }, 413);
    const f = await req.formData();
    const tenant = tenantId.safeParse(f.get("tenant")),
      employee = tenantId.safeParse(f.get("employee"));
    if (!tenant.success || !employee.success)
      return json({ error: "Invalid employee." }, 400);
    const { data: member } = await db
      .from("memberships")
      .select("role")
      .eq("tenant_id", tenant.data)
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();
    if (
      !member ||
      (!hrRoles.includes(member.role) &&
        !(member.role === "employee" && f.get("category") === "selfie"))
    )
      return json(
        { error: "Only HR and administrators can upload employee documents." },
        403,
      );
    const { data: person } = await db
      .from("employees")
      .select("id")
      .eq("tenant_id", tenant.data)
      .eq("id", employee.data)
      .is("deleted_at", null)
      .single();
    if (!person) return json({ error: "Employee unavailable." }, 404);
    const category = String(f.get("category"));
    if (
      ![
        "photo",
        "kyc",
        "verification",
        "education",
        "offer",
        "form_11",
        "form_2",
        "nomination",
        "cctv_acknowledgement",
        "selfie",
        "other",
      ].includes(category)
    )
      return json({ error: "Invalid category." }, 400);
    const file = f.get("file");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 10485760 ||
      !["application/pdf", "image/png", "image/jpeg"].includes(file.type) ||
      (["photo", "selfie"].includes(category) &&
        !file.type.startsWith("image/"))
    )
      return json({ error: "Choose a PDF, PNG or JPEG up to 10 MB." }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid =
      file.type === "application/pdf"
        ? Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-"
        : file.type === "image/png"
          ? Buffer.from(bytes.slice(0, 8)).toString("hex") ===
            "89504e470d0a1a0a"
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid)
      return json({ error: "File signature does not match its type." }, 400);
    const expires = f.get("expires_on") ? String(f.get("expires_on")) : null;
    if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires))
      return json({ error: "Invalid expiry date." }, 400);
    let version = 1,
      previous = null;
    const previousId = f.get("previous_id");
    if (previousId) {
      if (!tenantId.safeParse(previousId).success)
        return json({ error: "Invalid previous version." }, 400);
      const { data: p } = await db
        .from("employee_documents")
        .select("id,version")
        .eq("tenant_id", tenant.data)
        .eq("employee_id", employee.data)
        .eq("category", category)
        .eq("id", String(previousId))
        .single();
      if (!p) return json({ error: "Previous document unavailable." }, 404);
      version = p.version + 1;
      previous = p.id;
    }
    const id = crypto.randomUUID(),
      path = `${tenant.data}/${employee.data}/${id}/${category === "selfie" ? "selfie/" : ""}${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`;
    const { error: uploaded } = await db.storage
      .from("sdc-employees")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploaded) return json({ error: "Upload failed." }, 503);
    const { error } = await db
      .from("employee_documents")
      .insert({
        id,
        tenant_id: tenant.data,
        employee_id: employee.data,
        category,
        title: String(f.get("title") || file.name).slice(0, 150),
        file_name: file.name.slice(0, 150),
        mime_type: file.type,
        size_bytes: file.size,
        object_path: path,
        version,
        previous_id: previous,
        expires_on: expires,
      });
    if (error) {
      await db.storage.from("sdc-employees").remove([path]);
      return databaseError(error);
    }
    return json({ id, version }, 201);
  } catch {
    return json({ error: "The document could not be uploaded." }, 503);
  }
}
