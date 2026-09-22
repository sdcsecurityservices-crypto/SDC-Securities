import { identity, json, databaseError } from "@/lib/foundation/http";
import { brandedPdf } from "@/lib/employees/pdf";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const auth = await identity();
    if (auth.error) return auth.error;
    const u = new URL(req.url),
      tenant = z.string().uuid().parse(u.searchParams.get("tenant")),
      id = z.string().uuid().parse(u.searchParams.get("id"));
    const { data: a, error } = await auth.db
      .from("training_awards")
      .select("*,training_courses(title)")
      .eq("tenant_id", tenant)
      .eq("id", id)
      .single();
    if (error) return databaseError(error);
    const { data: v, error: ve } = await auth.db.rpc("training_verify", {
      p_token: a.token,
    });
    if (ve) return databaseError(ve);
    const url =
      (process.env.APP_URL || u.origin) + "/verify-training/" + a.token;
    const { error: auditError } = await auth.db.rpc("operation_access_audit", {
      p_tenant: tenant,
      p_resource: "training",
      p_action: "download",
      p_site: null,
    });
    if (auditError) return databaseError(auditError);
    const pdf = await brandedPdf(
      "Certificate of Training",
      [
        {
          heading: v.employee,
          lines: ["Has successfully completed", v.course],
        },
        {
          heading: "Certification record",
          lines: [
            "Certificate: SDC-TR-" + a.attempt_id.slice(0, 8).toUpperCase(),
            "Issued: " + v.issued_on,
            "Valid until: " + (v.expires_on || "No expiry"),
            "Status: " + v.status,
          ],
        },
        {
          heading: "Verify this certificate",
          lines: [
            url,
            "Issued through SDC Training Academy. Verify current status before deployment.",
          ],
        },
      ],
      undefined,
      url,
    );
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="SDC-training-certificate.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return json({ error: "Certificate unavailable" }, 400);
  }
}
