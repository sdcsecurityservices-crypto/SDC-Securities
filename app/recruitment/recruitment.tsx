"use client";
import { useCallback, useEffect, useState } from "react";
import { FileText, MessageCircle, Phone, Plus, RefreshCw, Search } from "lucide-react";
import { OperationsShell, useWorkspace, request, dateLabel } from "@/components/operations/shell";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { genders, openingStatuses, roles, statuses } from "@/lib/careers/options";
import { dictionaries, optionKey } from "@/lib/careers/i18n";

// Response rows are validated by the recruitment API and row level security.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const en = dictionaries.en;
const label = (prefix: string, v: string) => (v ? (en as Record<string, string>)[optionKey(prefix, v)] || v : "—");
const statusLabels: Record<string, string> = {
  new: "New",
  screening: "Screening",
  interview: "Interview",
  verification: "Verification",
  offered: "Offered",
  joined: "Joined",
  on_hold: "On hold",
  not_selected: "Not selected",
};
const statusTone = (s: string) => (s === "joined" || s === "offered" ? "good" : s === "not_selected" ? "bad" : s === "new" || s === "on_hold" ? "warn" : "");
const langNames: Record<string, string> = { en: "English", kn: "Kannada", hi: "Hindi" };
const branchNames: Record<string, string> = { army: "Army", navy: "Navy", air_force: "Air Force", paramilitary: "Paramilitary", police: "Police", other: "Other" };
const age = (dob: string) => {
  const b = new Date(dob + "T00:00:00"),
    n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
};
const when = (v: string) =>
  new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
const waLink = (phone: string, name: string, ref: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${name}, this is SDC Security & Facility Services about your job application ${ref}.`)}`;

export default function Recruitment() {
  return (
    <OperationsShell title="Recruitment" subtitle="Applications from the careers page, and the openings shown there.">
      <Inbox />
    </OperationsShell>
  );
}

const noFilters = { status: "", role: "", gender: "", ex: "", lang: "", duplicates: "", area: "", from: "", to: "", q: "" };

function Inbox() {
  const m = useWorkspace(),
    t = m.tenant_id;
  const [tab, setTab] = useState<"applications" | "openings">("applications");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [fresh, setFresh] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState(noFilters);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
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
  }, [t, offset, filters]);
  useEffect(() => {
    // Synchronise with the API whenever the workspace or filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    // Opened from an in-app alert: /recruitment?application=<id>
    const id = new URLSearchParams(window.location.search).get("application");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id && /^[0-9a-f-]{36}$/.test(id)) setOpenId(id);
  }, []);
  useEffect(() => {
    // Remove documents whose retention period has ended (queued nightly).
    void request("/api/recruitment/purge", { tenant_id: t }).catch(() => {});
  }, [t]);

  const setFilter = (k: keyof typeof noFilters, v: string) => {
    setOffset(0);
    setFilters((f) => ({ ...f, [k]: v }));
  };
  const closeDetail = () => {
    setOpenId(null);
    const u = new URL(window.location.href);
    if (u.searchParams.has("application")) {
      u.searchParams.delete("application");
      window.history.replaceState(null, "", u.pathname + u.search);
    }
  };

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
          <form
            className="recruit-search"
            onSubmit={(e) => {
              e.preventDefault();
              setFilter("q", search.trim());
            }}
          >
            <label className="recruit-search-box">
              <Search size={17} aria-hidden />
              <span className="sr-only">Search by name, phone or reference</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone or SDC-APP reference" />
            </label>
            <button className="ops-button" type="submit">
              Search
            </button>
            <button className="ops-button secondary" type="button" onClick={() => void load()} aria-label="Refresh">
              <RefreshCw size={16} />
            </button>
          </form>
          <div className="recruit-filters">
            <Select label="Status" value={filters.status} onChange={(v) => setFilter("status", v)} options={statuses.map((s) => [s, statusLabels[s]])} />
            <Select label="Role" value={filters.role} onChange={(v) => setFilter("role", v)} options={roles.map((r) => [r, label("r_", r)])} />
            <Select label="Gender" value={filters.gender} onChange={(v) => setFilter("gender", v)} options={genders.map((g) => [g, label("g_", g)])} />
            <Select label="Ex-serviceman" value={filters.ex} onChange={(v) => setFilter("ex", v)} options={[["yes", "Yes"], ["no", "No"]]} />
            <Select label="Form language" value={filters.lang} onChange={(v) => setFilter("lang", v)} options={Object.entries(langNames)} />
            <Select label="Repeat applicants" value={filters.duplicates} onChange={(v) => setFilter("duplicates", v)} options={[["yes", "Applied before"]]} />
            <label>
              <span>Area</span>
              <input value={filters.area} onChange={(e) => setFilter("area", e.target.value)} placeholder="Any" />
            </label>
            <label>
              <span>From</span>
              <input type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} />
            </label>
            {Object.values(filters).some(Boolean) && (
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
          </div>
          {!loading && !rows.length ? (
            <div className="ops-empty">
              {Object.values(filters).some(Boolean)
                ? "No applications match these filters."
                : "No applications yet. They will appear here, with an alert in the bell, when someone applies on the careers page."}
            </div>
          ) : (
            <div className="ops-table-wrap">
              <table className="ops-table recruit-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Role</th>
                    <th>Area</th>
                    <th>Profile</th>
                    <th>Received</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={r.status === "new" ? "is-new" : undefined}>
                      <td>
                        <button className="recruit-name" onClick={() => setOpenId(r.id)}>
                          {r.full_name}
                        </button>
                        <small>
                          {r.reference_code} · {r.phone}
                        </small>
                        {r.duplicate_of && <span className="ops-badge warn">Applied before</span>}
                      </td>
                      <td>{label("r_", r.role)}</td>
                      <td>
                        {r.home_area}
                        {r.preferred_work_area && <small>Wants: {r.preferred_work_area}</small>}
                      </td>
                      <td>
                        {label("g_", r.gender)} · {age(r.date_of_birth)} y · {r.experience_years} y exp
                        {r.ex_serviceman && <span className="ops-badge good">Ex-serviceman</span>}
                        <small>Form in {langNames[r.applicant_language]}</small>
                      </td>
                      <td>{when(r.created_at)}</td>
                      <td>
                        <span className={"ops-badge " + statusTone(r.status)}>{statusLabels[r.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <Detail tenant={t} id={openId} onClose={closeDetail} onChanged={() => void load()} onOpen={setOpenId} />
        </>
      )}
    </>
  );
}

function Select({ label: l, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label>
      <span>{l}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map(([v, n]) => (
          <option key={v} value={v}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

function Detail({ tenant, id, onClose, onChanged, onOpen }: { tenant: string; id: string | null; onClose: () => void; onChanged: () => void; onOpen: (id: string) => void }) {
  const [d, setD] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await request(`/api/recruitment/application?tenant=${tenant}&id=${id}`);
      setD(r);
      setStatus(r.record.status);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenant, id]);
  useEffect(() => {
    // Load the selected application when the drawer opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setD(null);
    setNote("");
    setNotice("");
    void load();
  }, [load]);

  const save = async () => {
    if (!d) return;
    setBusy(true);
    setError("");
    try {
      await request("/api/recruitment/status", { tenant_id: tenant, id: d.record.id, status, note });
      setNote("");
      setNotice(status === d.record.status ? "Note added." : `Moved to ${statusLabels[status]}.`);
      await load();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const openFile = async (fileId: string) => {
    // Open the tab first so pop-up blockers allow it, then point it at the link.
    const w = window.open("", "_blank");
    try {
      const r = await request(`/api/recruitment/file?tenant=${tenant}&id=${fileId}`);
      if (w) {
        w.opener = null;
        w.location.replace(r.url);
      } else window.location.assign(r.url);
      void load();
    } catch (e) {
      w?.close();
      setError((e as Error).message);
    }
  };

  const a = d?.record;
  const facts: [string, string][] = a
    ? [
        ["Phone", a.phone],
        ["WhatsApp", a.whatsapp_same ? "Same number" : a.whatsapp_phone || "—"],
        ["Gender", label("g_", a.gender)],
        ["Date of birth", `${dateLabel(a.date_of_birth)} (${age(a.date_of_birth)} years)`],
        ["Lives in", [a.home_area, a.home_district].filter(Boolean).join(", ")],
        ["Languages", (a.languages || []).map((l: string) => label("l_", l)).join(", ") || "—"],
        ["Role", label("r_", a.role)],
        ["Opening", d?.opening ? `${d.opening.title_en}${d.opening.area ? " · " + d.opening.area : ""}` : "Any suitable job"],
        ["Preferred work area", a.preferred_work_area || "—"],
        ["Can join from", a.available_from ? dateLabel(a.available_from) : "Immediately"],
        ["Education", label("e_", a.education)],
        ["Experience", `${a.experience_years} years`],
        ["Last employer", a.last_employer || "—"],
        ["PSARA trained", a.psara_trained ? "Yes" : "No"],
        [
          "Ex-serviceman",
          a.ex_serviceman ? ["Yes", branchNames[a.service_branch], a.rank, a.service_years != null ? a.service_years + " years" : ""].filter(Boolean).join(" · ") : "No",
        ],
        ["Heard about SDC", a.heard_from ? label("src_", a.heard_from) : "—"],
        ["Form language", langNames[a.applicant_language]],
        ["Consent", `${when(a.consent_at)} · version ${a.consent_version}`],
        ["Kept until", a.status === "joined" ? "Joined: kept with the employee record" : dateLabel(a.retention_until)],
      ]
    : [];

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="recruit-sheet">
        <SheetHeader>
          <SheetTitle>{a ? a.full_name : "Application"}</SheetTitle>
          <SheetDescription>
            {a ? (
              <>
                {a.reference_code} · received {when(a.created_at)} · <span className={"ops-badge " + statusTone(a.status)}>{statusLabels[a.status]}</span>
              </>
            ) : (
              "Loading…"
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="recruit-sheet-body">
          {error && (
            <p className="ops-error" role="alert">
              {error}
            </p>
          )}
          {a && (
            <>
              <div className="recruit-contact">
                <a className="ops-button" href={"tel:" + a.phone}>
                  <Phone size={16} /> Call
                </a>
                <a className="ops-button accent" href={waLink(a.whatsapp_phone || a.phone, a.full_name.split(" ")[0], a.reference_code)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
              {d!.related.length > 0 && (
                <div className="ops-note recruit-dup">
                  <strong>Same phone number applied {d!.related.length === 1 ? "once" : d!.related.length + " times"} before.</strong>
                  {d!.related.map((r: Row) => (
                    <button key={r.id} className="recruit-link" onClick={() => onOpen(r.id)}>
                      {r.reference_code} · {label("r_", r.role)} · {statusLabels[r.status]} · {dateLabel(r.created_at)}
                    </button>
                  ))}
                </div>
              )}
              <dl className="recruit-facts">
                {facts.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <h3 className="recruit-h">Documents</h3>
              {d!.files.length ? (
                <ul className="recruit-files">
                  {d!.files.map((f: Row) => (
                    <li key={f.id}>
                      <FileText size={17} aria-hidden />
                      <span>
                        <strong>{label("k_", f.kind)}</strong> {f.file_name}
                        <small>
                          {f.mime === "application/pdf" ? "PDF" : "Image"} · {f.size_bytes < 1048576 ? Math.max(1, Math.round(f.size_bytes / 1024)) + " KB" : (f.size_bytes / 1048576).toFixed(1) + " MB"}
                        </small>
                      </span>
                      <button className="ops-button secondary" onClick={() => void openFile(f.id)}>
                        Open
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="recruit-muted">No documents attached.</p>
              )}
              <p className="recruit-muted">Links open for two minutes and every opening is recorded below.</p>
              <h3 className="recruit-h">Move to a stage</h3>
              <div className="ops-form recruit-status">
                <label>
                  Stage
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Note (optional)
                  <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called, interview on Monday 10 am at the office" />
                </label>
                {notice && (
                  <p className="ops-success" role="status">
                    {notice}
                  </p>
                )}
                <button className="ops-button" disabled={busy || (status === a.status && !note.trim())} onClick={() => void save()}>
                  {status === a.status ? "Add note" : `Move to ${statusLabels[status]}`}
                </button>
              </div>
              <h3 className="recruit-h">History</h3>
              <ol className="recruit-history">
                {d!.events.map((e: Row) => (
                  <li key={e.id}>
                    <strong>
                      {e.action === "submitted"
                        ? "Applied on the careers page"
                        : e.action === "status_changed"
                          ? `${statusLabels[e.from_status] || e.from_status} → ${statusLabels[e.to_status] || e.to_status}`
                          : e.action === "file_viewed"
                            ? "Document opened"
                            : "Note"}
                    </strong>
                    {e.note && <span>{e.note}</span>}
                    <small>
                      {when(e.created_at)}
                      {e.actor_name ? " · " + e.actor_name : ""}
                    </small>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const blankOpening = { role: "security_guard", title_en: "", title_kn: "", title_hi: "", area: "", shift: "", gender_requirement: "any", openings: 1, status: "open", notes: "" };

function Openings({ tenant }: { tenant: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>(blankOpening);
  const [busy, setBusy] = useState(false);
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
  const open = (r?: Row) => {
    setEdit(r || {});
    setForm(r ? Object.fromEntries(Object.keys(blankOpening).map((k) => [k, r[k]])) : { ...blankOpening });
    setError("");
  };
  const save = async (override?: Row) => {
    setBusy(true);
    setError("");
    try {
      const target = override || edit;
      const data = override ? { ...Object.fromEntries(Object.keys(blankOpening).map((k) => [k, override[k]])), status: override.status } : form;
      await request("/api/recruitment/opening", {
        tenant_id: tenant,
        id: target?.id,
        row_version: target?.row_version,
        data: { ...data, openings: Number(data.openings) },
      });
      setEdit(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const setStatus = (r: Row, status: string) => void save({ ...r, status });

  return (
    <>
      {error && !edit && (
        <p className="ops-error" role="alert">
          {error}
        </p>
      )}
      <div className="ops-toolbar">
        <p className="recruit-muted">Open positions appear on the public careers page in the visitor&apos;s language. Paused and closed ones are hidden.</p>
        <button className="ops-button" onClick={() => open()}>
          <Plus size={17} /> New opening
        </button>
      </div>
      {rows.length ? (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Opening</th>
                <th>Area / shift</th>
                <th>Posts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title_en}</strong>
                    <small>
                      {label("r_", r.role)}
                      {r.gender_requirement !== "any" ? (r.gender_requirement === "female" ? " · Women only" : " · Men only") : ""}
                    </small>
                    {(!r.title_kn || !r.title_hi) && <span className="ops-badge warn">Translation missing</span>}
                  </td>
                  <td>
                    {r.area || "—"}
                    {r.shift && <small>{r.shift}</small>}
                  </td>
                  <td>{r.openings}</td>
                  <td>
                    <span className={"ops-badge " + (r.status === "open" ? "good" : r.status === "paused" ? "warn" : "")}>{r.status[0].toUpperCase() + r.status.slice(1)}</span>
                  </td>
                  <td className="recruit-actions">
                    <button className="ops-button secondary" onClick={() => open(r)}>
                      Edit
                    </button>
                    {r.status !== "open" && (
                      <button className="ops-button secondary" disabled={busy} onClick={() => setStatus(r, "open")}>
                        Reopen
                      </button>
                    )}
                    {r.status === "open" && (
                      <button className="ops-button secondary" disabled={busy} onClick={() => setStatus(r, "paused")}>
                        Pause
                      </button>
                    )}
                    {r.status !== "closed" && (
                      <button className="ops-button secondary" disabled={busy} onClick={() => setStatus(r, "closed")}>
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ops-empty">
          No openings yet. Without any, the careers page says SDC is always hiring guards and lady guards and still accepts applications.
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="recruit-dialog">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit opening" : "New opening"}</DialogTitle>
            <DialogDescription>Give the title in English, Kannada and Hindi so applicants can read it in their language.</DialogDescription>
          </DialogHeader>
          <form
            className="ops-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {label("r_", r)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title (English)
              <input required minLength={2} maxLength={120} value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} placeholder="e.g. Security guard, IT park" />
            </label>
            <label>
              Title (Kannada)
              <input lang="kn" maxLength={120} value={form.title_kn} onChange={(e) => setForm({ ...form, title_kn: e.target.value })} placeholder="ಉದಾ: ಸೆಕ್ಯುರಿಟಿ ಗಾರ್ಡ್" />
            </label>
            <label>
              Title (Hindi)
              <input lang="hi" maxLength={120} value={form.title_hi} onChange={(e) => setForm({ ...form, title_hi: e.target.value })} placeholder="जैसे: सिक्योरिटी गार्ड" />
            </label>
            <label>
              Area
              <input maxLength={120} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Whitefield, Bengaluru" />
            </label>
            <label>
              Shift
              <input maxLength={80} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} placeholder="e.g. 12-hour day / night" />
            </label>
            <label>
              Who can apply
              <select value={form.gender_requirement} onChange={(e) => setForm({ ...form, gender_requirement: e.target.value })}>
                <option value="any">Anyone</option>
                <option value="female">Women only</option>
                <option value="male">Men only</option>
              </select>
            </label>
            <label>
              Number of posts
              <input type="number" min={1} max={500} value={form.openings} onChange={(e) => setForm({ ...form, openings: e.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {openingStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Internal notes (not shown publicly)
              <textarea rows={3} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            {error && (
              <p className="ops-error" role="alert">
                {error}
              </p>
            )}
            <div className="ops-form-actions">
              <button type="button" className="ops-button secondary" onClick={() => setEdit(null)}>
                Cancel
              </button>
              <button className="ops-button" disabled={busy}>
                {busy ? "Saving…" : "Save opening"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
