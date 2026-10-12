import { identity, json, databaseError, failure } from "@/lib/foundation/http";
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
            "Present is approved present days out of approved attendance days. Response is the average minutes to acknowledge an incident.",
          ],
        },
        ...data.sites.map((s: Record<string, number | string>) => ({
          heading: String(s.name),
          lines: [
            `Required: ${s.required}`,
            `Rostered: ${s.rostered}`,
            `Fill rate: ${Number(s.required) ? Math.round((Number(s.rostered) / Number(s.required)) * 100) + "%" : "—"}`,
            `Present: ${s.present}/${s.approved_days}`,
            `Incidents: ${s.incidents}`,
            `Response: ${s.response_minutes != null ? s.response_minutes + " min" : "—"}`,
            `Score: ${s.security_score}/100`,
            `Audit: ${s.audit_score ?? "—"}`,
          ],
        })),
      ], undefined, undefined, { rowLabel: "Site" });
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
  } catch (e) {
    return failure(e, "Service report could not be loaded");
  }
}
