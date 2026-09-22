import { identity, json, databaseError } from "@/lib/foundation/http";
import { brandedPdf } from "@/lib/employees/pdf";
import { z } from "zod";
import { fieldResources, type FieldResource } from "@/lib/field/resources";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url),
      tenant = z.string().uuid().parse(u.searchParams.get("tenant")),
      site = z.string().uuid().parse(u.searchParams.get("site")),
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
        .parse(u.searchParams.get("kind"));
    let q = a.db
      .from("field_" + kind)
      .select("*")
      .eq("tenant_id", tenant)
      .eq("site_id", site)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(250);
    if (u.searchParams.get("id"))
      q = q.eq("id", z.string().uuid().parse(u.searchParams.get("id")));
    const { data, error } = await q;
    if (error) return databaseError(error);
    const { data: s } = await a.db
      .from("sites")
      .select("name")
      .eq("tenant_id", tenant)
      .eq("id", site)
      .maybeSingle();
    const { error: auditError } = await a.db.rpc("operation_access_audit", {
      p_tenant: tenant,
      p_resource: "risk",
      p_action: "download",
      p_site: site,
    });
    if (auditError) return databaseError(auditError);
    const buf = await brandedPdf(fieldResources[kind].label + " report", [
      {
        heading: s?.name || "Assigned site",
        lines: [
          "Generated " +
            new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) +
            " IST",
          "Most recent " + data.length + " records (maximum 250 per report).",
        ],
      },
      ...data.map((r) => ({
        heading: r.title,
        lines: [
          ...(r.status ? ["Status: " + r.status] : []),
          ...fieldResources[kind as FieldResource].fields
            .filter((f) => !["title", "ids"].includes(f.key) && !f.source)
            .map(
              (f) =>
                f.label +
                ": " +
                (typeof r[f.key] === "object"
                  ? JSON.stringify(r[f.key])
                  : String(r[f.key] ?? "—")),
            ),
        ],
      })),
    ]);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SDC-${kind}-report.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return json({ error: "Report could not be generated" }, 400);
  }
}
