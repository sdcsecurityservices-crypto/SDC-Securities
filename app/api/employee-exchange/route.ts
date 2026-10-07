import ExcelJS from "exceljs";
import {
  identity,
  json,
  databaseError,
  sameOrigin,
} from "@/lib/foundation/http";
import { tenantId } from "@/lib/foundation/validation";
import {
  definitions,
  hrRoles,
  privateProfile,
} from "@/lib/employees/validation";
import { seal, masks } from "@/lib/employees/crypto";
import { cappedForm } from "@/lib/foundation/body";
import { zipWithinLimits } from "@/lib/foundation/zip-guard";
const columns = [
  "employee_code",
  "full_name",
  "grade_code",
  "category",
  "joined_on",
  "status",
] as const;
// Optional second sheet: protected details, encrypted per employee on import.
const privateSheet = "Private details";
const privateColumns = [
  "employee_code",
  "phone",
  "family_details",
  "uan",
  "esic",
  "bank_holder",
  "bank_account",
  "bank_ifsc",
] as const;
const emptyProfile = {
  dob: null,
  blood_group: "",
  current_address: "",
  permanent_address: "",
  phone: "",
  email: "",
  emergency_name: "",
  emergency_phone: "",
  nominee_name: "",
  nominee_relation: "",
  family_details: "",
  languages: "",
  height_cm: null,
  weight_kg: null,
  aadhaar: "",
  pan: "",
  uan: "",
  esic: "",
  bank_holder: "",
  bank_account: "",
  bank_ifsc: "",
  education: "",
  ex_service_details: "",
  arms_licence: "",
  weapon_type: "",
};
const cellText = (value: unknown) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : typeof value === "object" && value !== null
      ? "text" in value
        ? String((value as { text: unknown }).text ?? "").trim()
        : ""
      : String(value ?? "").trim();
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
    if (u.searchParams.get("template") === "true") {
      const extra = wb.addWorksheet(privateSheet);
      extra.columns = privateColumns.map((key) => ({
        header: key,
        key,
        width: 22,
        style: { numFmt: "@" },
      }));
    }
    for (const ws of wb.worksheets) {
      ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      ws.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A2E59" },
      };
      ws.views = [{ state: "frozen", ySplit: 1 }];
    }
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
    const form = await cappedForm(req, 5500000);
    if (!form) return json({ error: "Upload an .xlsx workbook up to 5 MB." }, 413);
    const tenant = tenantId.safeParse(form.get("tenant"));
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
    const bytes = await file.arrayBuffer();
    if (!zipWithinLimits(bytes))
      return json({ error: "This workbook is not a valid .xlsx file or is too large when unpacked." }, 400);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(bytes);
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
        data[key] = cellText(row.getCell(j + 1).value);
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
    // Protected details: each row must name an employee in this workbook, or
    // an existing employee who has no protected details yet.
    const profiles = new Map<string, Record<string, unknown>>();
    const known = new Map<string, string>();
    const profiled = new Set<string>();
    const extra = wb.getWorksheet(privateSheet);
    if (extra) {
      const heads = extra.getRow(1).values as unknown[];
      const at = new Map<string, number>();
      heads.forEach((h, i) => typeof h === "string" && at.set(h.trim(), i));
      if (!at.has("employee_code"))
        return json(
          { error: `The "${privateSheet}" sheet needs an employee_code column.` },
          400,
        );
      if (extra.rowCount > 1001)
        return json({ error: "Use at most 1,000 rows of private details." }, 400);
      for (let i = 2; i <= extra.rowCount; i++) {
        const row = extra.getRow(i);
        if (!row.hasValues) continue;
        const read = (k: string) =>
          at.has(k) ? cellText(row.getCell(at.get(k)!).value) : "";
        const code = read("employee_code").toUpperCase();
        if (!code) continue;
        const values: Record<string, unknown> = { ...emptyProfile };
        for (const k of privateColumns.slice(1)) values[k] = read(k);
        values.bank_ifsc = String(values.bank_ifsc).toUpperCase();
        const parsed = privateProfile.safeParse(values);
        if (!parsed.success) {
          errors.push({
            row: i,
            message: `${privateSheet} · ${code}: ${parsed.error.issues.map((x) => x.path.join(".")).join(", ")} invalid`,
          });
          continue;
        }
        if (profiles.has(code)) {
          errors.push({
            row: i,
            message: `${privateSheet} · ${code}: listed more than once.`,
          });
          continue;
        }
        profiles.set(code, parsed.data);
      }
      const outside = [...profiles.keys()].filter((c) => !seen.has(c));
      for (let i = 0; i < outside.length; i += 100) {
        const { data: found, error } = await db
          .from("employees")
          .select("id,employee_code,employee_private_profiles(id)")
          .eq("tenant_id", tenant.data)
          .is("deleted_at", null)
          .in("employee_code", outside.slice(i, i + 100));
        if (error) return databaseError(error);
        for (const e of found || []) {
          if ((e.employee_private_profiles as unknown[] | null)?.length) {
            profiled.add(e.employee_code);
            profiles.delete(e.employee_code);
          } else known.set(e.employee_code, e.id);
        }
      }
      for (const c of outside)
        if (!known.has(c) && !profiled.has(c))
          errors.push({
            row: 0,
            message: `${privateSheet} · ${c}: no such employee in this workbook or workspace.`,
          });
      if (profiles.size) {
        try {
          seal({}, "check");
        } catch {
          return json(
            { error: "Protected storage is not configured on the server." },
            503,
          );
        }
      }
    }
    const report = {
      valid: rows.length,
      private_valid: profiles.size,
      private_skipped: [...profiled],
      errors,
      imported: 0,
      private_imported: 0,
    };
    if (form.get("commit") !== "true" || errors.length) return json(report);
    if (!rows.length && !profiles.size)
      return json({ error: "No employees to import." }, 400);
    const ids = new Map(known);
    if (rows.length) {
      const { data: inserted, error } = await db
        .from("employees")
        .insert(rows)
        .select("id,employee_code");
      if (error) return databaseError(error);
      for (const e of inserted || []) ids.set(e.employee_code, e.id);
    }
    const sealed = [...profiles].flatMap(([code, values]) => {
      const id = ids.get(code);
      return id
        ? [
            {
              tenant_id: tenant.data,
              employee_id: id,
              ciphertext: seal(values, `${tenant.data}:${id}`),
              masked: masks(values),
            },
          ]
        : [];
    });
    for (let i = 0; i < sealed.length; i += 100) {
      const { error } = await db
        .from("employee_private_profiles")
        .insert(sealed.slice(i, i + 100));
      if (error) {
        console.error("Private details import stopped", { code: error.code });
        return json(
          {
            ...report,
            imported: rows.length,
            private_imported: i,
            error: `${rows.length} employees were imported, but protected details stopped after ${i}. To finish, upload the file again with only the heading row left on the Employees sheet.`,
          },
          207,
        );
      }
    }
    return json(
      { ...report, imported: rows.length, private_imported: sealed.length },
      201,
    );
  } catch {
    return json(
      { error: "Could not read this workbook. Use the SDC template." },
      400,
    );
  }
}
