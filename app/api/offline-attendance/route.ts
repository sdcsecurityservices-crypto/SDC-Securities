import {
  identity,
  json,
  sameOrigin,
  databaseError,
  failure,
} from "@/lib/foundation/http";
import { z } from "zod";
import { cappedText } from "@/lib/foundation/body";
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const a = await identity();
    if (a.error) return a.error;
    const raw = await cappedText(req, 5000);
    if (raw === null) return json({ error: "Request too large" }, 413);
    const uuid = z.string().uuid();
    const b = z
      .object({
        tenant_id: uuid,
        event_id: uuid,
        employee_id: uuid,
        site_id: uuid,
        action: z.enum(["check_in", "check_out"]),
        captured_at: z.string().datetime(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().min(0).max(100),
        document_id: uuid.nullable(),
      })
      .parse(JSON.parse(raw));
    const { data, error } = await a.db.rpc("offline_attendance_sync", {
      p_tenant: b.tenant_id,
      p_event: b.event_id,
      p_employee: b.employee_id,
      p_site: b.site_id,
      p_action: b.action,
      p_captured: b.captured_at,
      p_lat: b.latitude,
      p_lon: b.longitude,
      p_accuracy: b.accuracy,
      p_document: b.document_id,
    });
    return error ? databaseError(error) : json(data);
  } catch (e) {
    return failure(e, "Invalid attendance submission");
  }
}
