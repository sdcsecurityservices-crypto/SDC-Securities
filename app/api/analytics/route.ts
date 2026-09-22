import { identity, json, databaseError } from "@/lib/foundation/http";
import { brandedPdf } from "@/lib/employees/pdf";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url),
      t = z.string().uuid().parse(u.searchParams.get("tenant")),
      site = u.searchParams.get("site")
        ? z.string().uuid().parse(u.searchParams.get("site"))
        : null;
    const { data, error } = await a.db.rpc("service_analytics", {
      p_tenant: t,
      p_from: z.string().date().parse(u.searchParams.get("from")),
      p_to: z.string().date().parse(u.searchParams.get("to")),
      p_site: site,
    });
    if (error) return databaseError(error);
    if (u.searchParams.get("format") === "pdf") {
      const { error: logged } = await a.db.rpc("operation_access_audit", {
        p_tenant: t,
        p_resource: "risk",
        p_action: "export",
        p_site: site,
      });
      if (logged) return databaseError(logged);
      const pdf = await brandedPdf("Monthly service performance", [
        {
          heading: `${data.from} to ${data.to}`,
          lines: [
            "Published duty coverage and approved attendance only. Unapproved records do not count as confirmed service.",
          ],
        },
        ...data.sites.map((s: Record<string, number | string>) => ({
          heading: String(s.name),
          lines: [
            `Required shifts: ${s.required} | Published duties: ${s.rostered}`,
            `Fill rate: ${Number(s.required) ? Math.round((Number(s.rostered) / Number(s.required)) * 100) + "%" : "No requirement"}`,
            `Approved attendance: ${s.present} present / ${s.approved_days} days`,
            `Incidents: ${s.incidents} | Average acknowledgement: ${s.response_minutes ?? "Not available"} minutes`,
            `Current security score: ${s.security_score}/100 | Audit average: ${s.audit_score ?? "Not assessed"}`,
          ],
        })),
      ]);
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'attachment; filename="SDC-service-performance.pdf"',
          "Cache-Control": "private, no-store",
        },
      });
    }
    return json(data);
  } catch {
    return json({ error: "Service report could not be loaded" }, 400);
  }
}
