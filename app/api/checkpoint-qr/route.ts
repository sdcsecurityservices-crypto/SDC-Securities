import { identity, json, databaseError, failure } from "@/lib/foundation/http";
import { brandedPdf } from "@/lib/employees/pdf";
import { z } from "zod";
export async function GET(req: Request) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url);
    const tenant = z.string().uuid().parse(u.searchParams.get("tenant")),
      id = z.string().uuid().parse(u.searchParams.get("id"));
    // Only field staff (operators and site leads) may read the token.
    let { data: token, error: tokenError } = await a.db.rpc("checkpoint_qr_token", { p_tenant: tenant, p_id: id });
    if (tokenError?.code === "PGRST202") {
      // Security hardening migration not applied yet: fall back to the old read.
      const legacy = await a.db.from("field_checkpoints").select("token").eq("tenant_id", tenant).eq("id", id).maybeSingle();
      token = legacy.data?.token ?? null;
      tokenError = legacy.error;
    }
    if (tokenError) return databaseError(tokenError);
    const { data: meta } = await a.db
      .from("field_checkpoints")
      .select("id,title,location")
      .eq("tenant_id", tenant)
      .eq("id", id)
      .maybeSingle();
    if (!meta || !token) return json({ error: "Checkpoint unavailable" }, 404);
    const c = { ...meta, token: token as string };
    const link =
      (process.env.APP_URL || u.origin) +
      "/attendance?checkpoint=" +
      c.token;
    const pdf = await brandedPdf(
      "Patrol checkpoint",
      [
        {
          heading: c.title,
          lines: [
            c.location,
            "Guards: scan this QR with the SDC Guard app or your phone camera. The visit is recorded with GPS.",
            "Token: " + c.token,
          ],
        },
      ],
      undefined,
      link,
    );
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="SDC-checkpoint.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return failure(e, "QR unavailable");
  }
}
