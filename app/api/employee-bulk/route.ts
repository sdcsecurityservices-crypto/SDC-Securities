import {
  identity,
  json,
  databaseError,
  sameOrigin,
} from "@/lib/foundation/http";
import { z } from "zod";
import { identityPdf } from "@/lib/employees/pdf";
import { unseal } from "@/lib/employees/crypto";
import { hrRoles } from "@/lib/employees/validation";
import { PDFDocument } from "pdf-lib";
import ExcelJS from "exceljs";
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
        employee_ids: z.array(z.string().uuid()).min(1).max(100),
        kind: z.enum(["id_cards", "bank_advice"]),
        month: z
          .string()
          .regex(/^\d{4}-\d{2}-01$/)
          .optional(),
      })
      .strict()
      .safeParse(await req.json());
    if (!p.success)
      return json(
        { error: "Select up to 100 employees and an export format." },
        400,
      );
    const { tenant_id: tenant, employee_ids: ids, kind, month } = p.data;
    const { data: member } = await db
      .from("memberships")
      .select("role")
      .eq("tenant_id", tenant)
      .eq("user_id", user.id)
      .eq("active", true)
      .single();
    if (!member || (kind === "bank_advice" && !hrRoles.includes(member.role)))
      return json({ error: "HR access required." }, 403);
    const { data: people, error } = await db
      .from("employees")
      .select("id,employee_code,full_name,status,grades(name)")
      .eq("tenant_id", tenant)
      .in("id", ids)
      .is("deleted_at", null);
    if (error) return databaseError(error);
    if (people?.length !== new Set(ids).size)
      return json({ error: "Some selected employees are unavailable." }, 409);
    let bytes: Uint8Array, type: string, name: string;
    if (kind === "id_cards") {
      const merged = await PDFDocument.create();
      for (const person of people) {
        const { data: card } = await db
          .from("employee_id_cards")
          .select("*")
          .eq("tenant_id", tenant)
          .eq("employee_id", person.id)
          .is("revoked_at", null)
          .is("deleted_at", null)
          .gte("valid_until", new Date().toISOString().slice(0, 10))
          .maybeSingle();
        if (!card || person.status !== "active")
          return json(
            {
              error: `${person.employee_code} has no valid active card. Issue or renew it first.`,
            },
            409,
          );
        const { error } = await db.rpc("employee_access_audit", {
          p_tenant: tenant,
          p_employee: person.id,
          p_action: "id_card_download",
          p_reason: "Bulk identity card printing",
        });
        if (error) return databaseError(error);
        const grade = person.grades as unknown as { name: string };
        const pdf = await PDFDocument.load(
          await identityPdf(
            { ...person, grade: grade?.name },
            card,
            process.env.APP_URL || new URL(req.url).origin,
          ),
        );
        for (const page of await merged.copyPages(pdf, pdf.getPageIndices()))
          merged.addPage(page);
      }
      bytes = await merged.save();
      type = "application/pdf";
      name = "SDC-identity-cards.pdf";
    } else {
      if (!month) return json({ error: "Choose a payroll month." }, 400);
      const wb = new ExcelJS.Workbook(),
        sheet = wb.addWorksheet("Bank advice");
      sheet.columns = [
        { header: "Employee ID", key: "code", width: 20 },
        { header: "Beneficiary", key: "holder", width: 30 },
        { header: "Account number", key: "account", width: 25 },
        { header: "IFSC", key: "ifsc", width: 18 },
        { header: "Amount INR", key: "amount", width: 18 },
        { header: "Payroll month", key: "month", width: 18 },
        { header: "Reference", key: "reference", width: 40 },
      ];
      let included = 0;
      for (const person of people) {
        const { data: slip } = await db
          .from("employee_payslips")
          .select("id,net_paise,revision")
          .eq("tenant_id", tenant)
          .eq("employee_id", person.id)
          .eq("month", month)
          .eq("status", "released")
          .is("deleted_at", null)
          .maybeSingle();
        if (!slip)
          return json(
            {
              error: `Release the ${month.slice(0, 7)} payslip for ${person.employee_code} first.`,
            },
            409,
          );
        const { data: paid } = await db
          .from("employee_payments")
          .select("amount_paise")
          .eq("tenant_id", tenant)
          .eq("payslip_id", slip.id)
          .eq("status", "paid")
          .is("deleted_at", null);
        const remaining =
          slip.net_paise - (paid || []).reduce((n, p) => n + p.amount_paise, 0);
        if (remaining <= 0) continue;
        const { error } = await db.rpc("employee_access_audit", {
          p_tenant: tenant,
          p_employee: person.id,
          p_action: "private_reveal",
          p_reason: "Generate bank advice export for released payroll",
        });
        if (error) return databaseError(error);
        const { data: profile } = await db
          .from("employee_private_profiles")
          .select("ciphertext")
          .eq("tenant_id", tenant)
          .eq("employee_id", person.id)
          .is("deleted_at", null)
          .maybeSingle();
        const bank = profile
          ? (unseal(profile.ciphertext, tenant + ":" + person.id) as Record<
              string,
              string
            >)
          : null;
        if (!bank?.bank_account || !bank.bank_ifsc || !bank.bank_holder)
          return json(
            {
              error: `Complete the protected bank details for ${person.employee_code}.`,
            },
            409,
          );
        sheet.addRow({
          code: person.employee_code,
          holder: bank.bank_holder,
          account: bank.bank_account,
          ifsc: bank.bank_ifsc,
          amount: remaining / 100,
          month: month.slice(0, 7),
          reference: slip.id,
        });
        included++;
      }
      if (!included)
        return json({ error: "All selected payslips are already paid." }, 409);
      sheet.getRow(1).font = { bold: true };
      sheet.getColumn("amount").numFmt = "#,##0.00";
      bytes = new Uint8Array(await wb.xlsx.writeBuffer());
      type =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      name = "SDC-bank-advice.xlsx";
    }
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return json({ error: "Bulk export could not be generated." }, 503);
  }
}
