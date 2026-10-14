import { z } from "zod";
import { identity, json, sameOrigin, databaseError, failure } from "@/lib/foundation/http";
import { cappedJson } from "@/lib/foundation/body";
import { genders, openingStatuses, roles, statuses } from "@/lib/careers/options";
export const dynamic = "force-dynamic";

// HR recruitment inbox. Every query runs as the signed-in user, so row level
// security (sdc_private.can_recruit) decides what is visible. Applicant
// documents are only ever handed out as short-lived signed links, and each
// link is logged against the application first.
type C = { params: Promise<{ action: string }> };
const uuid = z.string().uuid();
const BUCKET = "sdc-careers";
const SIGNED_SECONDS = 120;
const listColumns =
  "id,reference_code,opening_id,role,full_name,phone,gender,date_of_birth,home_area,home_district,preferred_work_area,languages,experience_years,ex_serviceman,applicant_language,status,duplicate_of,created_at";

const openingSchema = z.object({
  role: z.enum(roles),
  title_en: z.string().trim().min(2).max(120),
  title_kn: z.string().trim().max(120).default(""),
  title_hi: z.string().trim().max(120).default(""),
  area: z.string().trim().max(120).default(""),
  shift: z.string().trim().max(80).default(""),
  gender_requirement: z.enum(["any", "female", "male"]),
  openings: z.number().int().min(1).max(500),
  status: z.enum(openingStatuses),
  notes: z.string().trim().max(1000).default(""),
});

export async function GET(req: Request, { params }: C) {
  try {
    const a = await identity();
    if (a.error) return a.error;
    const u = new URL(req.url),
      t = uuid.parse(u.searchParams.get("tenant")),
      { action } = await params,
      p = (k: string) => u.searchParams.get(k) || "";

    if (action === "applications") {
      const offset = Math.min(100000, Math.max(0, Number(p("offset")) || 0));
      let q = a.db
        .from("job_applications")
        .select(listColumns, { count: "exact" })
        .eq("tenant_id", t)
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + 49);
      if (p("status")) q = q.eq("status", z.enum(statuses).parse(p("status")));
      if (p("role")) q = q.eq("role", z.enum(roles).parse(p("role")));
      if (p("gender")) q = q.eq("gender", z.enum(genders).parse(p("gender")));
      if (p("ex") === "yes") q = q.eq("ex_serviceman", true);
      if (p("ex") === "no") q = q.eq("ex_serviceman", false);
      if (p("lang")) q = q.eq("applicant_language", z.enum(["en", "kn", "hi"]).parse(p("lang")));
      if (p("duplicates") === "yes") q = q.not("duplicate_of", "is", null);
      if (p("from")) q = q.gte("created_at", z.string().date().parse(p("from")) + "T00:00:00+05:30");
      if (p("to")) q = q.lte("created_at", z.string().date().parse(p("to")) + "T23:59:59.999+05:30");
      // Free text is reduced to safe characters before it reaches the filter.
      const area = p("area").replace(/[^\p{L}\p{N} .-]/gu, "").trim().slice(0, 60);
      if (area) q = q.or(`home_area.ilike.*${area}*,home_district.ilike.*${area}*,preferred_work_area.ilike.*${area}*`);
      const search = p("q").replace(/[^\p{L}\p{N} +.-]/gu, "").trim().slice(0, 60);
      if (search) {
        const digits = search.replace(/\D/g, "");
        q =
          digits.length >= 4
            ? q.ilike("phone", `%${digits.slice(-10)}%`)
            : q.or(`full_name.ilike.*${search}*,reference_code.ilike.*${search}*`);
      }
      const [{ data, error, count }, fresh] = await Promise.all([
        q,
        a.db.from("job_applications").select("id", { count: "exact", head: true }).eq("tenant_id", t).eq("status", "new"),
      ]);
      if (error) return databaseError(error);
      return json({ rows: data, total: count, new_count: fresh.count ?? 0 });
    }

    if (action === "application") {
      const id = uuid.parse(p("id"));
      const { data: app, error } = await a.db.from("job_applications").select("*").eq("tenant_id", t).eq("id", id).single();
      if (error) return databaseError(error);
      const [files, events, related, opening] = await Promise.all([
        a.db.from("job_application_files").select("id,kind,file_name,mime,size_bytes,created_at").eq("tenant_id", t).eq("application_id", id).order("created_at"),
        a.db.from("job_application_events").select("id,action,from_status,to_status,note,actor_name,created_at").eq("tenant_id", t).eq("application_id", id).order("created_at", { ascending: false }),
        a.db.from("job_applications").select("id,reference_code,role,status,created_at").eq("tenant_id", t).eq("phone", app.phone).neq("id", id).order("created_at", { ascending: false }).limit(10),
        app.opening_id
          ? a.db.from("job_openings").select("id,title_en,area").eq("tenant_id", t).eq("id", app.opening_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      const failed = files.error || events.error || related.error || opening.error;
      if (failed) return databaseError(failed);
      return json({ record: app, files: files.data, events: events.data, related: related.data, opening: opening.data });
    }

    if (action === "file") {
      const { data: path, error } = await a.db.rpc("careers_log_file_access", { p_tenant: t, p_file: uuid.parse(p("id")) });
      if (error) return databaseError(error);
      const { data, error: signError } = await a.db.storage.from(BUCKET).createSignedUrl(path as string, SIGNED_SECONDS);
      if (signError || !data) return json({ error: "The document is unavailable." }, 404);
      return json({ url: data.signedUrl, expires_in: SIGNED_SECONDS });
    }

    if (action === "openings") {
      const { data, error } = await a.db
        .from("job_openings")
        .select("*")
        .eq("tenant_id", t)
        .is("deleted_at", null)
        .order("status")
        .order("created_at", { ascending: false })
        .limit(200);
      return error ? databaseError(error) : json({ rows: data });
    }
    return json({ error: "Unknown resource" }, 404);
  } catch (e) {
    return failure(e, "Recruitment records unavailable");
  }
}

export async function POST(req: Request, { params }: C) {
  try {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    const a = await identity();
    if (a.error) return a.error;
    const { action } = await params;
    const b = await cappedJson<Record<string, unknown>>(req, 20000);
    if (b === null) return json({ error: "Request too large" }, 413);
    const t = uuid.parse(b.tenant_id);

    if (action === "status") {
      const { data, error } = await a.db.rpc("careers_set_status", {
        p_tenant: t,
        p_application: uuid.parse(b.id),
        p_status: z.enum(statuses).parse(b.status),
        p_note: z.string().max(1000).default("").parse(b.note ?? ""),
      });
      return error ? databaseError(error) : json({ record: data });
    }

    if (action === "opening") {
      const values = openingSchema.parse(b.data);
      if (b.id) {
        const v = z.number().int().nonnegative().parse(b.row_version);
        const { data, error } = await a.db
          .from("job_openings")
          .update({ ...values, row_version: v + 1 })
          .eq("tenant_id", t)
          .eq("id", uuid.parse(b.id))
          .eq("row_version", v)
          .select()
          .maybeSingle();
        return error ? databaseError(error) : data ? json({ record: data }) : json({ error: "This opening changed. Reload and try again." }, 409);
      }
      const { data, error } = await a.db.from("job_openings").insert({ ...values, tenant_id: t }).select().single();
      return error ? databaseError(error) : json({ record: data }, 201);
    }

    if (action === "purge") {
      // Removes storage objects queued by the retention job (expired or never
      // submitted). The database decides which paths this user may remove.
      const { data, error } = await a.db.rpc("careers_purge_paths", { p_tenant: t });
      if (error) return databaseError(error);
      const paths = (Array.isArray(data) ? data : []).filter((x): x is string => typeof x === "string");
      if (!paths.length) return json({ removed: 0 });
      const { data: removed, error: removeError } = await a.db.storage.from(BUCKET).remove(paths);
      if (removeError) {
        console.error("Careers purge failed");
        return json({ removed: 0 });
      }
      return json({ removed: removed?.length ?? 0 });
    }
    return json({ error: "Unknown action" }, 404);
  } catch (e) {
    if (e instanceof z.ZodError) return json({ error: e.issues.map((x) => x.message).join(" · ") }, 400);
    return failure(e, "Recruitment request failed");
  }
}
