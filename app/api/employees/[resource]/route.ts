import {
  identity,
  json,
  databaseError,
  sameOrigin,
} from "@/lib/foundation/http";
import { tenantId } from "@/lib/foundation/validation";
import {
  definitions,
  requestSchema,
  hrRoles,
  operationsRoles,
  privateProfile,
  type EmployeeResource,
} from "@/lib/employees/validation";
import { seal, unseal, masks, documentPassword } from "@/lib/employees/crypto";
import { z } from "zod";
import sharp from "sharp";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ resource: string }> };
const extraTables = [
  "payslips",
  "documents",
  "private_profiles",
  "record_history",
];
export async function GET(req: Request, { params }: Context) {
  try {
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db } = auth;
    const { resource } = await params;
    const u = new URL(req.url),
      tenant = tenantId.safeParse(u.searchParams.get("tenant"));
    if (!tenant.success) return json({ error: "Choose a workspace." }, 400);
    if (resource === "stats") {
      const results = await Promise.all(
        ["active", "on_leave", "suspended", "exited"].map((status) =>
          db
            .from("employees")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant.data)
            .is("deleted_at", null)
            .eq("status", status),
        ),
      );
      if (results.some((r) => r.error))
        return json({ error: "Employee totals unavailable." }, 503);
      return json({
        active: results[0].count,
        on_leave: results[1].count,
        suspended: results[2].count,
        exited: results[3].count,
      });
    }
    if (
      resource !== "employees" &&
      !(resource in definitions) &&
      !extraTables.includes(resource)
    )
      return json({ error: "Unknown employee resource." }, 404);
    const employee = u.searchParams.get("employee");
    if (resource !== "employees" && !tenantId.safeParse(employee).success)
      return json({ error: "Choose an employee." }, 400);
    if (resource === "private_profiles") {
      const { data, error } = await db
        .from("employee_private_profiles")
        .select("id,masked,row_version")
        .eq("tenant_id", tenant.data)
        .eq("employee_id", employee)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) return databaseError(error);
      return json({ record: data });
    }
    const table =
      resource === "employees" ? "employees" : "employee_" + resource;
    const limit = Math.min(
      100,
      Math.max(1, Number(u.searchParams.get("limit")) || 30),
    );
    const site = u.searchParams.get("site");
    if (site && !tenantId.safeParse(site).success)
      return json({ error: "Invalid site." }, 400);
    const client = u.searchParams.get("client"),
      availability = u.searchParams.get("availability"),
      certification = u.searchParams.get("certification");
    if (client && !tenantId.safeParse(client).success)
      return json({ error: "Invalid client." }, 400);
    const joins =
      resource === "employees"
        ? `*,grades(name),employee_documents(category),${certification ? "employee_certificates!inner(status,expires_on)," : ""}employee_postings!employee_postings_tenant_id_employee_id_fkey${site || client ? "!inner" : ""}(id,site_id,post_id,starts_on,ends_on,deleted_at,sites${client ? "!inner" : ""}(name,client_id),posts(name))`
        : resource === "postings"
          ? "*,sites(name),posts(name)"
          : resource === "payslips"
            ? "id,tenant_id,employee_id,month,revision,status,salary_id,paid_days,overtime_minutes,gross_paise,deduction_paise,net_paise,breakdown,released_at,row_version,created_at"
            : resource === "record_history"
              ? "id,created_at,entity_type,entity_id,action"
              : resource === "documents"
                ? "id,tenant_id,employee_id,title,category,file_name,mime_type,size_bytes,version,expires_on,previous_id,row_version,created_at"
                : "*";
    let q = db
      .from(table)
      .select(joins, { count: "exact" })
      .eq("tenant_id", tenant.data)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);
    if (!["id_cards", "record_history"].includes(resource))
      q = q.is("deleted_at", null);
    if (employee)
      q = q.eq(resource === "employees" ? "id" : "employee_id", employee);
    if (resource === "employees") {
      q = q.eq("employee_documents.category", "photo");
      for (const field of ["status", "category", "grade_id"]) {
        const val = u.searchParams.get(field);
        if (val) q = q.eq(field, val);
      }
      const term = u.searchParams
        .get("q")
        ?.trim()
        .slice(0, 80)
        .replace(/[\\%_,()]/g, "");
      if (term)
        q = q.or(`full_name.ilike.%${term}%,employee_code.ilike.%${term}%`);
      if (site || client || availability) {
        if (site) q = q.eq("employee_postings.site_id", site);
        if (client) q = q.eq("employee_postings.sites.client_id", client);
        q = q
          .is("employee_postings.deleted_at", null)
          .lte(
            "employee_postings.starts_on",
            new Date().toISOString().slice(0, 10),
          )
          .or(
            `ends_on.is.null,ends_on.gte.${new Date().toISOString().slice(0, 10)}`,
            { referencedTable: "employee_postings" },
          );
        if (availability === "unassigned") q = q.is("employee_postings", null);
      }
      if (certification) {
        q = q
          .eq("employee_certificates.status", "passed")
          .is("employee_certificates.deleted_at", null);
        if (certification === "expired")
          q = q.lt(
            "employee_certificates.expires_on",
            new Date().toISOString().slice(0, 10),
          );
        else
          q = q.or(
            `expires_on.is.null,expires_on.gte.${new Date().toISOString().slice(0, 10)}`,
            { referencedTable: "employee_certificates" },
          );
      }
    }
    if (resource === "attendance") {
      const month = u.searchParams.get("month");
      if (month && /^\d{4}-\d{2}$/.test(month)) {
        const end = new Date(
          Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 1),
        )
          .toISOString()
          .slice(0, 10);
        q = q.gte("work_date", month + "-01").lt("work_date", end);
      }
    }
    const cursor = u.searchParams.get("cursor");
    if (cursor) {
      let c;
      try {
        c = JSON.parse(Buffer.from(cursor, "base64url").toString());
      } catch {
        return json({ error: "Invalid page." }, 400);
      }
      if (
        !tenantId.safeParse(c.id).success ||
        !/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|\+00:00)$/.test(c.at)
      )
        return json({ error: "Invalid page." }, 400);
      q = q.or(
        `created_at.lt.${c.at},and(created_at.eq.${c.at},id.lt.${c.id})`,
      );
    }
    const { data, error, count } = await q;
    if (error) return databaseError(error);
    type LabelledRow = {
      id: string;
      grades?: { name: string } | null;
      sites?: { name: string } | null;
      posts?: { name: string } | null;
      employee_postings?: LabelledRow[];
    };
    const labelled = data as unknown as LabelledRow[] | null;
    if (resource === "employees" && labelled?.some((r) => !r.grades)) {
      for (const r of labelled!) {
        if (r.grades) continue;
        const { data: labels } = await db.rpc("employee_self_labels", {
          p_tenant: tenant.data,
          p_employee: r.id,
        });
        if (labels) {
          r.grades = { name: labels.grade };
          for (const p of r.employee_postings || []) {
            const l = labels.postings?.find(
              (x: { id: string }) => x.id === p.id,
            );
            if (l) {
              p.sites = { name: l.site };
              p.posts = { name: l.post };
            }
          }
        }
      }
    }
    if (resource === "postings" && labelled?.some((r) => !r.sites)) {
      const { data: labels } = await db.rpc("employee_self_labels", {
        p_tenant: tenant.data,
        p_employee: employee,
      });
      if (labels)
        for (const p of labelled!) {
          const l = labels.postings?.find((x: { id: string }) => x.id === p.id);
          if (l) {
            p.sites = { name: l.site };
            p.posts = { name: l.post };
          }
        }
    }
    const rows = (data || []).slice(0, limit) as unknown as Array<{
      id: string;
      created_at: string;
    }>;
    const last = rows.at(-1);
    return json({
      rows,
      total: count,
      nextCursor:
        (data?.length || 0) > limit && last
          ? Buffer.from(
              JSON.stringify({ id: last.id, at: last.created_at }),
            ).toString("base64url")
          : null,
    });
  } catch (e) {
    console.error(
      "Employee read failed",
      e instanceof Error ? e.name : "unknown",
    );
    return json(
      { error: "Employee records are temporarily unavailable." },
      503,
    );
  }
}
export async function POST(req: Request, { params }: Context) {
  try {
    if (!sameOrigin(req))
      return json({ error: "Invalid request origin." }, 403);
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db, user } = auth;
    const { resource } = await params;
    const raw = await req.text();
    if (raw.length > 60000) return json({ error: "Request too large." }, 413);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid request." }, 400);
    }
    const tenant = tenantId.safeParse(body.tenant_id);
    if (!tenant.success) return json({ error: "Choose a workspace." }, 400);
    const { data: member } = await db
      .from("memberships")
      .select("role,id")
      .eq("tenant_id", tenant.data)
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();
    if (!member) return json({ error: "Workspace access denied." }, 403);
    if (resource === "link_account") {
      const p = z
        .object({
          tenant_id: tenantId,
          employee_id: tenantId,
          email: z.string().email(),
        })
        .strict()
        .safeParse(body);
      if (!p.success)
        return json(
          { error: "Enter the employee’s verified email address." },
          400,
        );
      const { error } = await db.rpc("employee_link_account", {
        p_tenant: tenant.data,
        p_employee: p.data.employee_id,
        p_email: p.data.email,
      });
      if (error) return databaseError(error);
      return json({ linked: true });
    }
    if (resource === "check_attendance") {
      const p = z
        .object({
          tenant_id: tenantId,
          employee_id: tenantId,
          action: z.enum(["check_in", "check_out"]),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          accuracy: z.number().min(0).max(100),
          document_id: tenantId.nullable(),
        })
        .strict()
        .safeParse(body);
      if (!p.success)
        return json(
          {
            error:
              "Valid GPS coordinates and accuracy within 100 metres are required.",
          },
          400,
        );
      const { data, error } = await db.rpc("employee_check_attendance", {
        p_tenant: tenant.data,
        p_employee: p.data.employee_id,
        p_action: p.data.action,
        p_latitude: p.data.latitude,
        p_longitude: p.data.longitude,
        p_accuracy: p.data.accuracy,
        p_document: p.data.document_id,
      });
      if (error) return databaseError(error);
      return json({ record: data });
    }
    if (resource === "payroll") {
      const parsed = z
        .object({
          tenant_id: tenantId,
          employee_ids: z.array(tenantId).min(1).max(200),
          month: z.string().regex(/^\d{4}-\d{2}-01$/),
          release: z.boolean(),
          reason: z.string().max(300),
        })
        .strict()
        .safeParse(body);
      if (!parsed.success)
        return json({ error: "Choose employees and a payroll month." }, 400);
      const { data, error } = await db.rpc("employee_run_payroll", {
        p_tenant: tenant.data,
        p_employees: parsed.data.employee_ids,
        p_month: parsed.data.month,
        p_release: parsed.data.release,
        p_reason: parsed.data.reason,
      });
      if (error) return databaseError(error);
      return json({ rows: data });
    }
    if (resource === "reveal" || resource === "payslip_password") {
      const input = z
        .object({
          tenant_id: tenantId,
          employee_id: tenantId,
          reason: z.string().trim().min(5).max(300),
          id: tenantId.optional(),
        })
        .strict()
        .safeParse(body);
      if (!input.success)
        return json(
          {
            error:
              "Provide an employee and a reason of at least five characters.",
          },
          400,
        );
      const { error: logged } = await db.rpc("employee_access_audit", {
        p_tenant: tenant.data,
        p_employee: input.data.employee_id,
        p_action: resource === "reveal" ? "private_reveal" : "payslip_download",
        p_reason: input.data.reason,
      });
      if (logged) return databaseError(logged);
      if (resource === "payslip_password") {
        if (!input.data.id) return json({ error: "Choose a payslip." }, 400);
        const { data } = await db
          .from("employee_payslips")
          .select("id")
          .eq("tenant_id", tenant.data)
          .eq("employee_id", input.data.employee_id)
          .eq("id", input.data.id)
          .single();
        if (!data) return json({ error: "Payslip unavailable." }, 404);
        return json({
          password: documentPassword(
            tenant.data,
            input.data.employee_id,
            data.id,
          ),
        });
      }
      const { data, error } = await db
        .from("employee_private_profiles")
        .select("id,ciphertext,row_version")
        .eq("tenant_id", tenant.data)
        .eq("employee_id", input.data.employee_id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) return databaseError(error);
      return json({
        record: data
          ? {
              id: data.id,
              row_version: data.row_version,
              data: unseal(
                data.ciphertext,
                `${tenant.data}:${input.data.employee_id}`,
              ),
            }
          : null,
      });
    }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success)
      return json({ error: "Invalid employee request." }, 400);
    const input = parsed.data;
    if (resource !== "employees" && !input.employee_id)
      return json({ error: "Choose an employee." }, 400);
    if (resource === "private_profiles") {
      if (!hrRoles.includes(member.role))
        return json(
          { error: "Only HR or administrators can change protected details." },
          403,
        );
      const p = privateProfile.safeParse(input.data);
      if (!p.success)
        return json(
          {
            error: p.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join(" · "),
          },
          400,
        );
      const values = {
        ciphertext: seal(p.data, `${tenant.data}:${input.employee_id}`),
        masked: masks(p.data),
      };
      if (input.id) {
        if (input.row_version === undefined)
          return json({ error: "Record revision required." }, 400);
        const { data, error } = await db
          .from("employee_private_profiles")
          .update({ ...values, row_version: input.row_version + 1 })
          .eq("tenant_id", tenant.data)
          .eq("employee_id", input.employee_id)
          .eq("id", input.id)
          .eq("row_version", input.row_version)
          .select("id,row_version,masked")
          .maybeSingle();
        if (error) return databaseError(error);
        return data
          ? json({ record: data })
          : json(
              { error: "Private details changed. Reload before saving." },
              409,
            );
      }
      const { data, error } = await db
        .from("employee_private_profiles")
        .insert({
          ...values,
          tenant_id: tenant.data,
          employee_id: input.employee_id,
        })
        .select("id,row_version,masked")
        .single();
      if (error) return databaseError(error);
      return json({ record: data }, 201);
    }
    if (!(resource in definitions))
      return json({ error: "Unknown employee action." }, 404);
    const operational = ["postings", "assets", "certificates", "id_cards"];
    const supervisor = ["attendance", "leave_requests"];
    const allowed =
      hrRoles.includes(member.role) ||
      (operational.includes(resource) &&
        operationsRoles.includes(member.role)) ||
      (supervisor.includes(resource) &&
        [...operationsRoles, "site_lead"].includes(member.role)) ||
      (resource === "leave_requests" &&
        member.role === "employee" &&
        !input.id &&
        !input.archive &&
        input.data?.status === "requested");
    if (!allowed)
      return json({ error: "Your role cannot change this record." }, 403);
    const table =
      resource === "employees" ? "employees" : "employee_" + resource;
    let values: Record<string, unknown>;
    if (input.archive) {
      if (!input.id) return json({ error: "Choose a record." }, 400);
      if (resource === "employees")
        return json(
          {
            error:
              "Use the employee exit workflow to preserve employment records.",
          },
          400,
        );
      values =
        resource === "id_cards"
          ? { revoked_at: new Date().toISOString() }
          : { deleted_at: new Date().toISOString() };
    } else {
      const p = definitions[resource as EmployeeResource].schema.safeParse(
        input.data,
      );
      if (!p.success)
        return json(
          {
            error: p.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join(" · "),
          },
          400,
        );
      values = p.data;
    }
    if (resource === "id_cards" && !input.id) {
      values.serial = "SDC-" + crypto.randomUUID().slice(0, 8).toUpperCase();
      const { data: photo } = await db
        .from("employee_documents")
        .select("object_path")
        .eq("tenant_id", tenant.data)
        .eq("employee_id", input.employee_id)
        .eq("category", "photo")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!photo)
        return json(
          {
            error:
              "Upload an employee photograph in Documents before issuing a card.",
          },
          409,
        );
      const { data: file, error: photoError } = await db.storage
        .from("sdc-employees")
        .download(photo.object_path);
      if (photoError || !file)
        return json({ error: "Employee photo unavailable." }, 503);
      const thumbnail = await sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 20000000,
      })
        .rotate()
        .resize(240, 300, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      values.photo_data =
        "data:image/jpeg;base64," + thumbnail.toString("base64");
    }
    if (input.id) {
      if (input.row_version === undefined)
        return json({ error: "Record revision required." }, 400);
      let q = db
        .from(table)
        .update({ ...values, row_version: input.row_version + 1 })
        .eq("tenant_id", tenant.data)
        .eq("id", input.id)
        .eq("row_version", input.row_version)
        .is("deleted_at", null);
      if (resource !== "employees") q = q.eq("employee_id", input.employee_id);
      const { data, error } = await q.select().maybeSingle();
      if (error) return databaseError(error);
      return data
        ? json({ record: data })
        : json({ error: "This record changed. Reload and try again." }, 409);
    }
    const { data, error } = await db
      .from(table)
      .insert({
        ...values,
        tenant_id: tenant.data,
        ...(resource === "employees" ? {} : { employee_id: input.employee_id }),
      })
      .select()
      .single();
    if (error) return databaseError(error);
    return json({ record: data }, 201);
  } catch (e) {
    console.error(
      "Employee write failed",
      e instanceof Error ? e.name : "unknown",
    );
    return json({ error: "The employee record could not be saved." }, 503);
  }
}
