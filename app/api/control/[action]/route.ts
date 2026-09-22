import {
  identity,
  json,
  sameOrigin,
  databaseError,
} from "@/lib/foundation/http";
import { z } from "zod";
import { brandedPdf } from "@/lib/employees/pdf";
export const dynamic = "force-dynamic";
type C = { params: Promise<{ action: string }> };
export async function GET(req: Request, { params }: C) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url),
      t = z.string().uuid().parse(u.searchParams.get("tenant")),
      { action } = await params;
    if (action === "performance") {
      const { data, error } = await a.db.rpc("guard_performance", {
        p_tenant: t,
        p_from: z.string().date().parse(u.searchParams.get("from")),
        p_to: z.string().date().parse(u.searchParams.get("to")),
      });
      return error ? databaseError(error) : json({ rows: data });
    }
    const { data, error } = await a.db.rpc("command_summary", { p_tenant: t });
    if (error) return databaseError(error);
    if (action === "report") {
      const { error: auditError } = await a.db.rpc("operation_access_audit", {
        p_tenant: t,
        p_resource: "risk",
        p_action: "download",
        p_site: null,
      });
      if (auditError) return databaseError(auditError);
      const pdf = await brandedPdf("Client service overview", [
        {
          heading: "Report snapshot",
          lines: [
            "Generated " +
              new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) +
              " IST",
            "Visible sites are restricted to your assigned access.",
          ],
        },
        ...data.sites.map((s: Record<string, unknown>) => ({
          heading: String(s.name),
          lines: [
            `On duty: ${s.on_duty}`,
            `Present today: ${s.present_today}`,
            `Open incidents: ${s.open_incidents}`,
            `Open risks: ${s.risks}`,
            `Active SOS: ${s.sos}`,
            `Offline cameras: ${s.offline_cameras}`,
          ],
        })),
      ]);
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'attachment; filename="SDC-client-service-report.pdf"',
          "Cache-Control": "private, no-store",
        },
      });
    }
    return json(data);
  } catch {
    return json({ error: "Command summary unavailable" }, 400);
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const a = await identity();
    if (a.error) return a.error;
    const b = (await req.json()) as { tenant_id: string };
    const { data, error } = await a.db.rpc("run_operational_checks", {
      p_tenant: z.string().uuid().parse(b.tenant_id),
    });
    return error ? databaseError(error) : json(data);
  } catch {
    return json({ error: "Checks could not be run" }, 400);
  }
}
