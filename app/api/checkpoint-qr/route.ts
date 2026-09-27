import { identity, json } from "@/lib/foundation/http";
import { brandedPdf } from "@/lib/employees/pdf";
import { z } from "zod";
export async function GET(req: Request) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url);
    const { data: c } = await a.db
      .from("field_checkpoints")
      .select("id,title,location,token")
      .eq("tenant_id", z.string().uuid().parse(u.searchParams.get("tenant")))
      .eq("id", z.string().uuid().parse(u.searchParams.get("id")))
      .single();
    if (!c) return json({ error: "Checkpoint unavailable" }, 404);
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
  } catch {
    return json({ error: "QR unavailable" }, 400);
  }
}
