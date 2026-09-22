import { identity, json, databaseError } from "@/lib/foundation/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const tenant = z
      .string()
      .uuid()
      .parse(new URL(req.url).searchParams.get("tenant"));
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    const month = today.slice(0, 7),
      start = `${month}-01`,
      end = new Date(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)),
        0,
        12,
      ).toLocaleDateString("en-CA");
    const [summary, analytics, findings, incidents, invoices, notifications] =
      await Promise.all([
        a.db.rpc("command_summary", { p_tenant: tenant }),
        a.db.rpc("service_analytics", {
          p_tenant: tenant,
          p_from: start,
          p_to: end,
          p_site: null,
        }),
        a.db
          .from("field_findings")
          .select(
            "id,site_id,title,kind,severity,status,target_date,updated_at",
          )
          .eq("tenant_id", tenant)
          .eq("kind", "weakness")
          .not("status", "in", "(closed,verified)")
          .is("deleted_at", null)
          .order("target_date", { ascending: true })
          .limit(50),
        a.db
          .from("field_incidents")
          .select("id,site_id,title,severity,status,occurred_at")
          .eq("tenant_id", tenant)
          .not("status", "eq", "closed")
          .is("deleted_at", null)
          .order("occurred_at", { ascending: false })
          .limit(25),
        a.db
          .from("billing_summary")
          .select("id,number,month,status,total_paise,balance_paise,due_on")
          .eq("tenant_id", tenant)
          .eq("status", "issued")
          .order("month", { ascending: false })
          .limit(12),
        a.db
          .from("workforce_notifications")
          .select("id,title,body,href,created_at,read_at")
          .eq("tenant_id", tenant)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);
    for (const result of [
      summary,
      analytics,
      findings,
      incidents,
      invoices,
      notifications,
    ])
      if (result.error) return databaseError(result.error);
    return json({
      summary: summary.data,
      analytics: analytics.data,
      findings: findings.data,
      incidents: incidents.data,
      invoices: invoices.data,
      notifications: notifications.data,
    });
  } catch {
    return json(
      { error: "Client portal data is temporarily unavailable." },
      400,
    );
  }
}
