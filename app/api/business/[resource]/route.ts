import {
  identity,
  json,
  sameOrigin,
  databaseError,
} from "@/lib/foundation/http";
import { businessSchemas } from "@/lib/business/resources";
import { z } from "zod";
import { brandedPdf, inr } from "@/lib/employees/pdf";
export const dynamic = "force-dynamic";
type C = { params: Promise<{ resource: string }> };
const uuid = z.string().uuid(),
  day = z.string().date();
const tables: Record<string, string> = {
  invoices: "billing_summary",
  receipts: "billing_receipts",
  compliance: "compliance_items",
  recruitment: "recruitment_candidates",
};
export async function GET(req: Request, { params }: C) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url),
      t = uuid.parse(u.searchParams.get("tenant")),
      { resource } = await params;
    if (resource === "invoice_pdf") {
      const { data: i, error } = await a.db
        .from("billing_invoices")
        .select("*")
        .eq("tenant_id", t)
        .eq("id", uuid.parse(u.searchParams.get("id")))
        .single();
      if (error) return databaseError(error);
      const {error:logged}=await a.db.rpc("operation_access_audit",{p_tenant:t,p_resource:"invoice",p_action:"download"});if(logged)return databaseError(logged);
      const pdf = await brandedPdf(
        (i.status === "issued" ? "Tax invoice" : "Draft invoice") +
          " · " +
          i.number,
        [
          {
            heading: i.snapshot.issuer?.legal_name || "SDC Security Services",
            lines: [
              "GSTIN: " + (i.snapshot.issuer?.gstin || "Not configured"),
              i.snapshot.issuer?.billing_address || "",
              "SAC: " + (i.snapshot.issuer?.sac_code || "Not configured"),
            ],
          },
          {
            heading: i.snapshot.client.legal_name || i.snapshot.client.name,
            lines: [
              i.snapshot.client.billing_address,
              "GSTIN: " + (i.snapshot.client.gstin || "Not recorded"),
              "Period: " + i.month,
              "Due: " + i.due_on,
            ],
          },
          {
            heading: "Service detail",
            lines: i.snapshot.lines.map(
              (l: Record<string, unknown>) =>
                `${l.work_date} · ${l.full_name} · ${l.site_name} · ${inr(Number(l.amount_paise))}`,
            ),
          },
          {
            heading: "Invoice totals",
            lines: [
              "Services: " + inr(i.subtotal_paise),
              "Adjustment: " +
                inr(i.adjustment_paise) +
                " · " +
                i.adjustment_reason,
              "GST " + i.tax_basis_points / 100 + "%: " + inr(i.tax_paise),
              "Total payable: " + inr(i.total_paise),
              "Tax basis: " + i.tax_rule_source,
            ],
          },
        ],
      );
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="SDC-invoice.pdf"',
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (!tables[resource]) return json({ error: "Unknown resource" }, 404);
    const offset = Math.min(
      100000,
      Math.max(0, Number(u.searchParams.get("offset")) || 0),
    );
    let q = a.db
      .from(tables[resource])
      .select("*", { count: "exact" })
      .eq("tenant_id", t)
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 49);
    if (["compliance", "recruitment"].includes(resource))
      q = q.is("deleted_at", null);
    if (u.searchParams.get("invoice"))
      q = q.eq("invoice_id", uuid.parse(u.searchParams.get("invoice")));
    if (u.searchParams.get("client") && resource === "invoices")
      q = q.eq("client_id", uuid.parse(u.searchParams.get("client")));
    const { data, error, count } = await q;
    return error ? databaseError(error) : json({ rows: data, total: count });
  } catch {
    return json({ error: "Business records unavailable" }, 400);
  }
}
export async function POST(req: Request, { params }: C) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const a = await identity();
    if (a.error) return a.error;
    const { resource } = await params,
      raw = await req.text();
    if (raw.length > 25000) return json({ error: "Request too large" }, 413);
    const b = JSON.parse(raw),
      t = uuid.parse(b.tenant_id);
    let rpc = "",
      args: Record<string, unknown> = { p_tenant: t };
    if (resource === "generate") {
      rpc = "billing_generate";
      args = {
        ...args,
        p_contract: uuid.parse(b.contract_id),
        p_month: day.parse(b.month),
        p_due: day.parse(b.due_on),
        p_tax: z.number().int().min(0).max(10000).parse(b.tax_basis_points),
        p_tax_source: z.string().min(5).max(500).parse(b.tax_rule_source),
        p_reviewed: z.boolean().parse(b.tax_reviewed),
        p_adjustment: z
          .number()
          .int()
          .safe()
          .parse(b.adjustment_paise || 0),
        p_reason: z
          .string()
          .max(500)
          .parse(b.adjustment_reason || ""),
      };
    } else if (resource === "issue") {
      rpc = "billing_issue";
      args = {
        ...args,
        p_invoice: uuid.parse(b.id),
        p_version: z.number().int().nonnegative().parse(b.row_version),
        p_action: z.enum(["issued", "void"]).parse(b.action),
      };
    } else if (resource === "receive") {
      rpc = "billing_receive";
      args = {
        ...args,
        p_invoice: uuid.parse(b.invoice_id),
        p_kind: z.enum(["payment", "credit_note"]).parse(b.kind),
        p_amount: z.number().int().positive().safe().parse(b.amount_paise),
        p_tds: z.number().int().nonnegative().safe().parse(b.tds_paise),
        p_reference: z.string().min(3).max(200).parse(b.reference),
        p_date: day.parse(b.received_on),
        p_notes: z.string().min(3).max(1000).parse(b.notes),
      };
    } else if (resource === "convert") {
      rpc = "recruitment_convert";
      args = {
        ...args,
        p_candidate: uuid.parse(b.id),
        p_grade: uuid.parse(b.grade_id),
        p_code: z
          .string()
          .regex(/^[A-Z0-9_-]{2,30}$/)
          .parse(b.employee_code),
        p_joined: day.parse(b.joined_on),
      };
    }
    if (rpc) {
      const { data, error } = await a.db.rpc(rpc, args);
      return error ? databaseError(error) : json({ record: data });
    }
    if (!(resource in businessSchemas))
      return json({ error: "Unknown business action" }, 404);
    const values = businessSchemas[
      resource as keyof typeof businessSchemas
    ].parse(b.data);
    if (b.id) {
      const v = z.number().int().nonnegative().parse(b.row_version);
      const { data, error } = await a.db
        .from(tables[resource])
        .update({ ...values, row_version: v + 1 })
        .eq("tenant_id", t)
        .eq("id", uuid.parse(b.id))
        .eq("row_version", v)
        .select()
        .maybeSingle();
      return error
        ? databaseError(error)
        : data
          ? json({ record: data })
          : json({ error: "Record changed or unavailable" }, 409);
    }
    const { data, error } = await a.db
      .from(tables[resource])
      .insert({ ...values, tenant_id: t })
      .select()
      .single();
    return error ? databaseError(error) : json({ record: data }, 201);
  } catch (e) {
    return json(
      {
        error:
          e instanceof z.ZodError
            ? e.issues.map((x) => x.message).join(" · ")
            : "Business request failed",
      },
      400,
    );
  }
}
