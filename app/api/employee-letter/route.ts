import {
  identity,
  json,
  databaseError,
  sameOrigin,
} from "@/lib/foundation/http";
import { brandedPdf } from "@/lib/employees/pdf";
import { hrRoles } from "@/lib/employees/validation";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req))
      return json({ error: "Invalid request origin." }, 403);
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db, user } = auth;
    const p = z
      .object({
        tenant_id: z.string().uuid(),
        employee_id: z.string().uuid(),
        title: z.string().trim().min(5).max(100),
        terms: z.string().trim().min(30).max(8000),
        issuer: z.string().trim().min(3).max(150),
      })
      .strict()
      .safeParse(await req.json());
    if (!p.success)
      return json(
        {
          error:
            "Provide the letter title, authorised issuer and reviewed terms (at least 30 characters).",
        },
        400,
      );
    const v = p.data;
    const { data: m } = await db
      .from("memberships")
      .select("role")
      .eq("tenant_id", v.tenant_id)
      .eq("user_id", user.id)
      .eq("active", true)
      .single();
    if (!m || !hrRoles.includes(m.role))
      return json(
        {
          error: "Only HR and administrators can generate appointment letters.",
        },
        403,
      );
    const { data: e } = await db
      .from("employees")
      .select("id,employee_code,full_name,joined_on,category,grades(name)")
      .eq("tenant_id", v.tenant_id)
      .eq("id", v.employee_id)
      .is("deleted_at", null)
      .single();
    if (!e) return json({ error: "Employee unavailable." }, 404);
    const { error: logged } = await db.rpc("employee_access_audit", {
      p_tenant: v.tenant_id,
      p_employee: v.employee_id,
      p_action: "profile_export",
      p_reason: "Generate and retain reviewed employment letter",
    });
    if (logged) return databaseError(logged);
    const grade = e.grades as unknown as { name: string };
    const bytes = await brandedPdf(v.title, [
      {
        heading: "To " + e.full_name,
        lines: [
          `Employee ID: ${e.employee_code}`,
          `Designation: ${grade?.name || ""}`,
          `Joining date: ${e.joined_on}`,
          `Category: ${e.category.replaceAll("_", " ")}`,
        ],
      },
      { heading: "Terms of appointment", lines: v.terms.split("\n") },
      {
        heading: "Acknowledgement",
        lines: [
          `Issued by: ${v.issuer}`,
          "Authorised signature: __________________________",
          "Employee signature: __________________________",
          "Date: __________________________",
        ],
      },
    ]);
    const { data: previous } = await db
      .from("employee_documents")
      .select("id,version")
      .eq("tenant_id", v.tenant_id)
      .eq("employee_id", v.employee_id)
      .eq("category", "offer")
      .eq("title", v.title)
      .is("deleted_at", null)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const id = crypto.randomUUID(),
      file = e.employee_code + "-appointment.pdf",
      path = `${v.tenant_id}/${v.employee_id}/${id}/${file}`;
    const { error: upload } = await db.storage
      .from("sdc-employees")
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upload) return json({ error: "Could not save the letter." }, 503);
    const { error } = await db
      .from("employee_documents")
      .insert({
        id,
        tenant_id: v.tenant_id,
        employee_id: v.employee_id,
        category: "offer",
        title: v.title,
        file_name: file,
        mime_type: "application/pdf",
        size_bytes: bytes.length,
        object_path: path,
        version: previous ? previous.version + 1 : 1,
        previous_id: previous?.id || null,
      });
    if (error) {
      await db.storage.from("sdc-employees").remove([path]);
      return databaseError(error);
    }
    return json({ id }, 201);
  } catch {
    return json({ error: "Letter generation failed." }, 503);
  }
}
