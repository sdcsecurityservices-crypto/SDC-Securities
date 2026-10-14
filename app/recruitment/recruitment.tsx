"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Plus, RefreshCw, Search } from "lucide-react";
import { OperationsShell, useWorkspace, request } from "@/components/operations/shell";
import { genders, roles, statuses } from "@/lib/careers/options";
import { AreaChooser, ChipFilter, age, label, langNames, statusLabels, statusTone, useAreas, when } from "./shared";

// Response rows are validated by the recruitment API and row level security.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export default function Recruitment() {
  return (
    <OperationsShell title="Recruitment" subtitle="Applications from the careers page, and the openings shown there.">
      <Inbox />
    </OperationsShell>
  );
}

const FILTER_KEYS = ["status", "role", "gender", "ex", "lang", "duplicates", "area", "days", "q"] as const;
type Filters = Record<(typeof FILTER_KEYS)[number], string>;
const noFilters = Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])) as Filters;

/** Filters live in the address so a full application page can go back, or step through the same list. */
function filterQuery(f: Partial<Filters>) {
  const qs = new URLSearchParams();
  for (const k of FILTER_KEYS) if (f[k]) qs.set(k, f[k]!);
  return qs.toString();
}

function Inbox() {
  const m = useWorkspace(),
    t = m.tenant_id;
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"applications" | "openings">("applications");
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [fresh, setFresh] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const areas = useAreas(t);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    // Older in-app alerts link to /recruitment?application=<id>.
    const legacy = sp.get("application");
    if (legacy && /^[0-9a-f-]{36}$/.test(legacy)) {
      window.location.replace(`/recruitment/applications/${legacy}`);
      return;
    }
    const f = { ...noFilters };
    for (const k of FILTER_KEYS) f[k] = sp.get(k) || "";
    // Read the address once on arrival; afterwards state drives the address.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(f);
    setSearch(f.q);
    setTab(sp.get("tab") === "openings" ? "openings" : "applications");
    setMore(Boolean(f.gender || f.lang || f.duplicates || f.days));
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const qs = tab === "openings" ? "tab=openings" : filterQuery(filters);
    window.history.replaceState(null, "", "/recruitment" + (qs ? "?" + qs : ""));
  }, [filters, tab, ready]);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ tenant: t, offset: String(offset) });
      for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
      const d = await request(`/api/recruitment/applications?${qs}`);
      setRows(d.rows);
      setTotal(d.total ?? 0);
      setFresh(d.new_count ?? 0);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [t, offset, filters, ready]);
  useEffect(() => {
    // Synchronise with the API whenever the workspace or filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    // Remove documents whose retention period has ended (queued nightly).
    void request("/api/recruitment/purge", { tenant_id: t }).catch(() => {});
  }, [t]);

  const setFilter = (k: keyof Filters, v: string) => {
    setOffset(0);
    setFilters((f) => ({ ...f, [k]: v }));
  };
  const active = Object.values(filters).some(Boolean);
  const qs = filterQuery(filters);

  return (
    <>
      <div className="ops-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "applications"} onClick={() => setTab("applications")}>
          Applications {fresh > 0 && <span className="ops-badge warn">{fresh} new</span>}
        </button>
        <button role="tab" aria-selected={tab === "openings"} onClick={() => setTab("openings")}>
          Openings
        </button>
      </div>
      {tab === "openings" ? (
        <Openings tenant={t} />
      ) : (
        <>
          {error && (
            <p className="ops-error" role="alert">
              {error}
            </p>
          )}
          <section className="recruit-filter-panel" aria-label="Filter applications">
            <ChipFilter legend="Stage" value={filters.status} onChange={(v) => setFilter("status", v)} options={statuses.map((s) => [s, statusLabels[s]])} />
            <ChipFilter legend="Role" value={filters.role} onChange={(v) => setFilter("role", v)} options={roles.map((r) => [r, label("r_", r)])} />
            <div className="recruit-filter-row">
              <ChipFilter legend="Ex-serviceman" value={filters.ex} onChange={(v) => setFilter("ex", v)} options={[["yes", "Yes"], ["no", "No"]]} />
              <AreaChooser legend="Area" areas={areas} value={filters.area} onChange={(v) => setFilter("area", v)} placeholder="Search sites and applicant areas" />
            </div>
            {more ? (
              <div className="recruit-filter-row">
                <ChipFilter legend="Gender" value={filters.gender} onChange={(v) => setFilter("gender", v)} options={genders.map((g) => [g, label("g_", g)])} />
                <ChipFilter legend="Form language" value={filters.lang} onChange={(v) => setFilter("lang", v)} options={Object.entries(langNames)} />
                <ChipFilter legend="Received" value={filters.days} onChange={(v) => setFilter("days", v)} options={[["1", "Today"], ["7", "7 days"], ["30", "30 days"], ["90", "90 days"]]} />
                <ChipFilter legend="Repeat applicants" value={filters.duplicates} onChange={(v) => setFilter("duplicates", v)} options={[["yes", "Applied before"]]} />
              </div>
            ) : (
              <button type="button" className="recruit-link" onClick={() => setMore(true)}>
                More filters: gender, form language, received, repeat applicants
              </button>
            )}
            <div className="recruit-filter-foot">
              <form
                className="recruit-quick"
                onSubmit={(e) => {
                  e.preventDefault();
                  setFilter("q", search.trim());
                }}
              >
                <label className="recruit-search-box small">
                  <Search size={15} aria-hidden />
                  <span className="sr-only">Find by name, phone or reference</span>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a name, phone or SDC-APP number" />
                </label>
                <button className="ops-button secondary" type="submit">
                  Find
                </button>
              </form>
              <div className="recruit-filter-actions">
                {active && (
                  <button
                    className="ops-button secondary"
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setOffset(0);
                      setFilters(noFilters);
                    }}
                  >
                    Clear filters
                  </button>
                )}
                <button className="ops-button secondary" type="button" onClick={() => void load()} aria-label="Refresh">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </section>
          <p className="recruit-count" aria-live="polite">
            {loading ? "Loading…" : `${total} application${total === 1 ? "" : "s"}${active ? " match" : ""}`}
          </p>
          {!loading && !rows.length ? (
            <div className="ops-empty">
              {active ? "No applications match these filters." : "No applications yet. They will appear here, with an alert in the bell, when someone applies on the careers page."}
            </div>
          ) : (
            <ul className="recruit-list">
              {rows.map((r) => (
                <li key={r.id} className={r.status === "new" ? "is-new" : undefined}>
                  <Link href={`/recruitment/applications/${r.id}${qs ? "?" + qs : ""}`}>
                    <span className="recruit-list-main">
                      <strong>{r.full_name}</strong>
                      <small>
                        {label("r_", r.role)} · {r.home_area} · {label("g_", r.gender)}, {age(r.date_of_birth)} y · {r.experience_years} y exp
                      </small>
                      <small>
                        {r.reference_code} · {r.phone} · {when(r.created_at)} · form in {langNames[r.applicant_language]}
                      </small>
                    </span>
                    <span className="recruit-list-badges">
                      <span className={"ops-badge " + statusTone(r.status)}>{statusLabels[r.status]}</span>
                      {r.ex_serviceman && <span className="ops-badge good">Ex-serviceman</span>}
                      {r.duplicate_of && <span className="ops-badge warn">Applied before</span>}
                    </span>
                    <ChevronRight size={18} aria-hidden className="recruit-list-go" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {total > 50 && (
            <div className="recruit-pager">
              <button className="ops-button secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>
                Previous
              </button>
              <span>
                {offset + 1}–{Math.min(offset + 50, total)} of {total}
              </span>
              <button className="ops-button secondary" disabled={offset + 50 >= total} onClick={() => setOffset(offset + 50)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function Openings({ tenant }: { tenant: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    try {
      const d = await request(`/api/recruitment/openings?tenant=${tenant}`);
      setRows(d.rows);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenant]);
  useEffect(() => {
    // Load openings for the current workspace.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  const setStatus = async (r: Row, status: string) => {
    setBusy(r.id);
    setError("");
    try {
      const data = Object.fromEntries(["role", "title_en", "title_kn", "title_hi", "area", "shift", "gender_requirement", "openings", "notes"].map((k) => [k, r[k]]));
      await request("/api/recruitment/opening", { tenant_id: tenant, id: r.id, row_version: r.row_version, data: { ...data, status } });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      {error && (
        <p className="ops-error" role="alert">
          {error}
        </p>
      )}
      <div className="ops-toolbar">
        <p className="recruit-muted">Open positions appear on the public careers page in the visitor&apos;s language. Paused and closed ones are hidden.</p>
        <Link className="ops-button" href="/recruitment/openings/new">
          <Plus size={17} /> New opening
        </Link>
      </div>
      {rows.length ? (
        <ul className="recruit-list">
          {rows.map((r) => (
            <li key={r.id}>
              <div className="recruit-opening-row">
                <Link href={`/recruitment/openings/${r.id}`} className="recruit-list-main">
                  <strong>{r.title_en}</strong>
                  <small>
                    {label("r_", r.role)} · {r.area || "Any area"} · {r.shift ? label("shift_", r.shift) : "Shift not set"} · {r.openings} post{r.openings === 1 ? "" : "s"}
                    {r.gender_requirement !== "any" ? (r.gender_requirement === "female" ? " · Women only" : " · Men only") : ""}
                  </small>
                </Link>
                <span className="recruit-list-badges">
                  <span className={"ops-badge " + (r.status === "open" ? "good" : r.status === "paused" ? "warn" : "")}>{r.status[0].toUpperCase() + r.status.slice(1)}</span>
                  {(!r.title_kn || !r.title_hi) && <span className="ops-badge warn">Translation missing</span>}
                </span>
                <span className="recruit-actions">
                  <Link className="ops-button secondary" href={`/recruitment/openings/${r.id}`}>
                    Edit
                  </Link>
                  {r.status !== "open" && (
                    <button className="ops-button secondary" disabled={busy === r.id} onClick={() => void setStatus(r, "open")}>
                      Reopen
                    </button>
                  )}
                  {r.status === "open" && (
                    <button className="ops-button secondary" disabled={busy === r.id} onClick={() => void setStatus(r, "paused")}>
                      Pause
                    </button>
                  )}
                  {r.status !== "closed" && (
                    <button className="ops-button secondary" disabled={busy === r.id} onClick={() => void setStatus(r, "closed")}>
                      Close
                    </button>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="ops-empty">No openings yet. Without any, the careers page says SDC is always hiring guards and lady guards and still accepts applications.</div>
      )}
    </>
  );
}
