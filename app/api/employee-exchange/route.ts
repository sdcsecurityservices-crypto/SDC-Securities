import ExcelJS from "exceljs";
import {
  identity,
  json,
  databaseError,
  sameOrigin,
} from "@/lib/foundation/http";
import { tenantId } from "@/lib/foundation/validation";
import { definitions, hrRoles } from "@/lib/employees/validation";
const columns = [
  "employee_code",
  "full_name",
  "grade_code",
  "category",
  "joined_on",
  "status",
] as const;
export async function GET(req: Request) {
  try {
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db } = auth;
    const u = new URL(req.url),
      tenant = tenantId.safeParse(u.searchParams.get("tenant"));
    if (!tenant.success) return json({ error: "Choose a workspace." }, 400);
    const wb = new ExcelJS.Workbook(),
      sheet = wb.addWorksheet("Employees");
    sheet.columns = columns.map((key) => ({
      header: key,
      key,
      width: key === "full_name" ? 30 : 20,
    }));
    if (u.searchParams.get("template") === "true")
      sheet.addRow({
        employee_code: "SDC-0151",
        full_name: "Example Employee",
        grade_code: "GUARD",
        category: "full_time",
        joined_on: new Date().toISOString().slice(0, 10),
        status: "active",
      });
    else {
      let offset = 0;
      while (offset < 5000) {
        const { data, error } = await db
          .from("employees")
          .select(
            "id,employee_code,full_name,category,joined_on,status,grades(code)",
          )
          .eq("tenant_id", tenant.data)
          .is("deleted_at", null)
          .order("employee_code")
          .range(offset, offset + 199);
        if (error) return databaseError(error);
        for (const r of data || []) {
          const grade = r.grades as unknown as { code?: string } | null;
          sheet.addRow({ ...r, grade_code: grade?.code || "" });
        }
        if (!data || data.length < 200) break;
        offset += 200;
      }
    }
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0A2E59" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    const bytes = await wb.xlsx.writeBuffer();
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="SDC-employees.xlsx"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return json({ error: "Employee export could not be generated." }, 503);
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req))
      return json({ error: "Invalid request origin." }, 403);
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db, user } = auth;
    const form = await req.formData(),
      tenant = tenantId.safeParse(form.get("tenant"));
    if (!tenant.success) return json({ error: "Choose a workspace." }, 400);
    const { data: member } = await db
      .from("memberships")
      .select("role")
      .eq("tenant_id", tenant.data)
      .eq("user_id", user.id)
      .eq("active", true)
      .single();
    if (!member || !hrRoles.includes(member.role))
      return json(
        { error: "Import is restricted to HR and administrators." },
        403,
      );
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5242880 ||
      !file.name.toLowerCase().endsWith(".xlsx")
    )
      return json({ error: "Upload an .xlsx workbook up to 5 MB." }, 400);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const sheet = wb.worksheets[0];
    if (!sheet || sheet.rowCount > 1001)
      return json(
        { error: "Use one worksheet with at most 1,000 employees." },
        400,
      );
    const headings = sheet.getRow(1).values as unknown[];
    if (columns.some((k, i) => headings[i + 1] !== k))
      return json(
        {
          error:
            "Use the downloadable template and retain its column headings.",
        },
        400,
      );
    const { data: grades } = await db
      .from("grades")
      .select("id,code")
      .eq("tenant_id", tenant.data)
      .is("deleted_at", null);
    const seen = new Set<string>(),
      errors: Array<{ row: number; message: string }> = [],
      rows: Record<string, unknown>[] = [];
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      if (!row.hasValues) continue;
      const data: Record<string, string> = {};
      columns.forEach((key, j) => {
        const value = row.getCell(j + 1).value;
        data[key] =
          value instanceof Date
            ? value.toISOString().slice(0, 10)
            : typeof value === "object" && value !== null
              ? ""
              : String(value ?? "").trim();
      });
      const grade = grades?.find(
        (g) => g.code === data.grade_code.toUpperCase(),
      );
      const parsed = definitions.employees.schema.safeParse({
        employee_code: data.employee_code.toUpperCase(),
        full_name: data.full_name,
        grade_id: grade?.id,
        category: data.category,
        status: data.status,
        joined_on: data.joined_on,
        exited_on: null,
        supervisor_id: null,
        membership_id: null,
        notes: "",
      });
      if (!parsed.success) {
        errors.push({
          row: i,
          message: parsed.error.issues
            .map((x) => `${x.path.join(".")}: ${x.message}`)
            .join("; "),
        });
        continue;
      }
      if (seen.has(parsed.data.employee_code)) {
        errors.push({
          row: i,
          message: "Duplicate employee code in workbook.",
        });
        continue;
      }
      seen.add(parsed.data.employee_code);
      rows.push({ ...parsed.data, tenant_id: tenant.data });
    }
    if (rows.length) {
      for (let i = 0; i < rows.length; i += 100) {
        const { data: existing, error } = await db
          .from("employees")
          .select("employee_code")
          .eq("tenant_id", tenant.data)
          .in(
            "employee_code",
            rows.slice(i, i + 100).map((r) => String(r.employee_code)),
          );
        if (error) return databaseError(error);
        for (const e of existing || [])
          errors.push({
            row: 0,
            message: `Employee code ${e.employee_code} already exists; imports never overwrite existing employees.`,
          });
      }
    }
    if (form.get("commit") !== "true" || errors.length)
      return json({ valid: rows.length, errors, imported: 0 });
    if (!rows.length) return json({ error: "No employees to import." }, 400);
    const { error } = await db.from("employees").insert(rows);
    if (error) return databaseError(error);
    return json({ valid: rows.length, errors: [], imported: rows.length }, 201);
  } catch {
    return json(
      { error: "Could not read this workbook. Use the SDC template." },
      400,
    );
  }
}
