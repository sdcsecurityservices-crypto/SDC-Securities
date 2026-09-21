import { identity, json, databaseError } from "@/lib/foundation/http";
import { tenantId } from "@/lib/foundation/validation";
import { brandedPdf, identityPdf, inr } from "@/lib/employees/pdf";
import { documentPassword } from "@/lib/employees/crypto";
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
    const { data: person, error } = await db
      .from("employees")
      .select("*,grades(name)")
      .eq("tenant_id", tenant.data)
      .eq("id", employee.data)
      .is("deleted_at", null)
      .single();
    if (error || !person) return json({ error: "Employee unavailable." }, 404);
    let gradeName = person.grades?.name;
    if (!gradeName) {
      const { data: labels } = await db.rpc("employee_self_labels", {
        p_tenant: tenant.data,
        p_employee: employee.data,
      });
      gradeName = labels?.grade;
    }
    const kind = u.searchParams.get("kind");
    const id = u.searchParams.get("id");
    if (!["id_card", "payslip", "employment_letter"].includes(kind || ""))
      return json({ error: "Unknown print format." }, 400);
    const { error: logged } = await db.rpc("employee_access_audit", {
      p_tenant: tenant.data,
      p_employee: employee.data,
      p_action:
        kind === "id_card"
          ? "id_card_download"
          : kind === "payslip"
            ? "payslip_download"
            : "profile_export",
      p_reason: "Requested branded " + kind + " PDF",
    });
    if (logged) return databaseError(logged);
    let bytes: Buffer;
    if (kind === "id_card") {
      const { data: card } = await db
        .from("employee_id_cards")
        .select("*")
        .eq("tenant_id", tenant.data)
        .eq("employee_id", employee.data)
        .eq("id", id)
        .is("deleted_at", null)
        .is("revoked_at", null)
        .single();
      if (!card || person.status !== "active")
        return json({ error: "This card has been revoked." }, 409);
      bytes = await identityPdf(
        { ...person, grade: gradeName },
        card,
        process.env.APP_URL || u.origin,
      );
    } else if (kind === "payslip") {
      const { data: slip } = await db
        .from("employee_payslips")
        .select("*")
        .eq("tenant_id", tenant.data)
        .eq("employee_id", employee.data)
        .eq("id", id)
        .single();
      if (!slip) return json({ error: "Payslip unavailable." }, 404);
      const b = slip.breakdown;
      bytes = await brandedPdf(
        `${slip.status === "draft" ? "DRAFT • " : ""}Payslip • ${slip.month.slice(0, 7)}`,
        [
          {
            heading: person.full_name,
            lines: [
              `${person.employee_code} • ${gradeName || ""}`,
              `Revision ${slip.revision} • Paid days ${slip.paid_days}/${b.calendar_days} • Approved overtime ${(slip.overtime_minutes / 60).toFixed(2)} hours`,
            ],
          },
          {
            heading: "Earnings",
            lines: ["basic", "da", "hra", "allowances", "overtime"].map(
              (k) => `${k.toUpperCase()}: ${inr(b[k] || 0)}`,
            ),
          },
          {
            heading: "Deductions",
            lines: ["pf", "esi", "fixed_deductions", "advance_deductions"].map(
              (k) => `${k.toUpperCase()}: ${inr(b[k] || 0)}`,
            ),
          },
          {
            heading: "Net payable",
            lines: [
              inr(slip.net_paise),
              `Gross ${inr(slip.gross_paise)} less deductions ${inr(slip.deduction_paise)}.`,
              slip.status === "draft"
                ? "Draft calculation. Not released for payment."
                : "Generated from approved attendance and the recorded salary rule snapshots.",
            ],
          },
        ],
        documentPassword(tenant.data, employee.data, slip.id),
      );
    } else {
      bytes = await brandedPdf("Employment particulars", [
        {
          heading: person.full_name,
          lines: [
            `Employee ID: ${person.employee_code}`,
            `Designation: ${gradeName || ""}`,
            `Category: ${person.category.replace("_", " ")}`,
            `Date of joining: ${person.joined_on}`,
            `Employment status: ${person.status}`,
          ],
        },
        {
          heading: "Company record",
          lines: [
            "This document confirms the employment particulars recorded in SDC Command. It does not amend the signed appointment terms.",
            "Authorised signatory: ____________________",
            "Date: ____________________",
          ],
        },
      ]);
    }
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${person.employee_code}-${kind}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return json({ error: "The PDF could not be generated." }, 503);
  }
}
