import {
  identity,
  json,
  databaseError,
  sameOrigin,
} from "@/lib/foundation/http";
import {
  trainingSchemas,
  type TrainingResource,
} from "@/lib/training/validation";
import { z } from "zod";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ resource: string }> };
const uuid = z.string().uuid();
export async function GET(req: Request, { params }: Context) {
  try {
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db } = auth;
    const { resource } = await params,
      u = new URL(req.url),
      tenant = uuid.parse(u.searchParams.get("tenant"));
    if (resource === "matrix") {
      const { data, error } = await db.rpc("training_matrix", {
        p_tenant: tenant,
        p_query: u.searchParams.get("q") || "",
        p_offset: Math.max(0, Number(u.searchParams.get("offset")) || 0),
        p_site: u.searchParams.get("site") || null,
        p_client: u.searchParams.get("client") || null,
        p_grade: u.searchParams.get("grade") || null,
      });
      return error ? databaseError(error) : json(data);
    }
    if (resource === "people" || resource === "trainers") {
      const { data, error } = await db.rpc(
        resource === "people" ? "training_people" : "training_trainers",
        {
          p_tenant: tenant,
          ...(resource === "people"
            ? {
                p_query: u.searchParams.get("q") || "",
                p_offset: Math.max(
                  0,
                  Number(u.searchParams.get("offset")) || 0,
                ),
              }
            : {}),
        },
      );
      return error ? databaseError(error) : json({ rows: data });
    }
    if (resource === "eligibility") {
      const { data, error } = await db.rpc("training_eligibility", {
        p_tenant: tenant,
        p_employee: uuid.parse(u.searchParams.get("employee")),
        p_post: u.searchParams.get("post")
          ? uuid.parse(u.searchParams.get("post"))
          : null,
      });
      return error ? databaseError(error) : json(data);
    }
    if (!(resource in trainingSchemas) && resource !== "awards")
      return json({ error: "Unknown resource" }, 404);
    const offset = Math.max(
      0,
      Math.min(100000, Number(u.searchParams.get("offset")) || 0),
    );
    let q = db
      .from("training_" + resource)
      .select("*", { count: "exact" })
      .eq("tenant_id", tenant)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 49);
    for (const key of ["course_id", "employee_id", "session_id", "post_id"])
      if (u.searchParams.get(key))
        q = q.eq(key, uuid.parse(u.searchParams.get(key)));
    const search = u.searchParams.get("q");
    if (search && resource === "courses")
      q = q.ilike(
        "title",
        "%" + search.replace(/[%_\\]/g, "").slice(0, 80) + "%",
      );
    const { data, error, count } = await q;
    return error
      ? databaseError(error)
      : json({
          rows: data,
          total: count,
          nextOffset:
            offset + (data?.length || 0) < (count || 0) ? offset + 50 : null,
        });
  } catch {
    return json({ error: "Training records could not be loaded." }, 400);
  }
}
export async function POST(req: Request, { params }: Context) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid request origin" }, 403);
    const auth = await identity();
    if (auth.error) return auth.error;
    const { db } = auth;
    const { resource } = await params,
      raw = await req.text();
    if (raw.length > 40000) return json({ error: "Request too large" }, 413);
    const body = JSON.parse(raw),
      tenant = uuid.parse(body.tenant_id);
    if (["start", "submit", "revoke"].includes(resource)) {
      const args =
        resource === "start"
          ? { p_tenant: tenant, p_enrollment: uuid.parse(body.enrollment_id) }
          : resource === "submit"
            ? {
                p_tenant: tenant,
                p_attempt: uuid.parse(body.attempt_id),
                p_answers: z
                  .record(z.number().int().min(0).max(5))
                  .parse(body.answers),
              }
            : {
                p_tenant: tenant,
                p_award: uuid.parse(body.award_id),
                p_reason: z.string().trim().min(5).max(300).parse(body.reason),
              };
      const { data, error } = await db.rpc("training_" + resource, args);
      return error ? databaseError(error) : json({ record: data });
    }
    if (!(resource in trainingSchemas))
      return json({ error: "Unknown resource" }, 404);
    const values = body.archive
      ? { deleted_at: new Date().toISOString() }
      : trainingSchemas[resource as TrainingResource].parse(body.data);
    if (body.id) {
      const id = uuid.parse(body.id),
        version = z.number().int().nonnegative().parse(body.row_version);
      const { data, error } = await db
        .from("training_" + resource)
        .update({ ...values, row_version: version + 1 })
        .eq("tenant_id", tenant)
        .eq("id", id)
        .eq("row_version", version)
        .select()
        .maybeSingle();
      return error
        ? databaseError(error)
        : data
          ? json({ record: data })
          : json(
              {
                error: "Record changed or access denied. Reload before saving.",
              },
              409,
            );
    }
    if (body.archive) return json({ error: "Select a record" }, 400);
    const { data, error } = await db
      .from("training_" + resource)
      .insert({ ...values, tenant_id: tenant })
      .select()
      .single();
    return error ? databaseError(error) : json({ record: data }, 201);
  } catch (e) {
    return json(
      {
        error:
          e instanceof z.ZodError
            ? e.issues.map((i) => i.message).join(" · ")
            : "Training request could not be saved.",
      },
      400,
    );
  }
}
