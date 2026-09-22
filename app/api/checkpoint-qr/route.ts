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
      "/operations?view=patrols&checkpoint=" +
      c.token;
    const pdf = await brandedPdf(
      "Patrol checkpoint",
      [
        {
          heading: c.title,
          lines: [
            c.location,
            "Scan this QR at the checkpoint. An authenticated assigned guard must record the visit with GPS.",
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
