"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  ArrowRight,
  FileDown,
  Paperclip,
  MapPin,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  OperationsShell,
  useWorkspace,
  request,
  dateLabel,
} from "@/components/operations/shell";
import {
  fieldResources,
  fieldSchemas,
  transitions,
  type FieldResource,
} from "@/lib/field/resources";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
// Schema-driven forms consume records validated by the resource-specific Zod API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export default function FieldWorkspace() {
  return (
    <OperationsShell
      title="Site operations"
      subtitle="Know your risks. Act on every incident. Keep the next shift informed."
    >
      <FieldBoard />
    </OperationsShell>
  );
}
function FieldBoard() {
  const m = useWorkspace(),
    tenant = m.tenant_id,
    staff = [
      "admin",
      "operations_manager",
      "senior_manager",
      "site_lead",
    ].includes(m.role),
    client = m.role === "client_user";
  const [view, setView] = useState<FieldResource>("findings"),
    [sites, setSites] = useState<Row[]>([]),
    [site, setSite] = useState(""),
    [rows, setRows] = useState<Row[]>([]),
    [total, setTotal] = useState(0),
    [offset, setOffset] = useState(0),
    [q, setQ] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState<Row | null>(null),
    [form, setForm] = useState<Row>({}),
    [detail, setDetail] = useState<Row | null>(null),
    [events, setEvents] = useState<Row[]>([]),
    [evidence, setEvidence] = useState<Row[]>([]),
    [lookups, setLookups] = useState<Record<string, Row[]>>({}),
    [comment, setComment] = useState(""),
    [signoff, setSignoff] = useState(""),
    [score, setScore] = useState<Row | null>(null),
    [personSearch, setPersonSearch] = useState("");
  const config = fieldResources[view],
    canCreate =
      staff ||
      (m.role === "employee" &&
        ["incidents", "sos", "handovers", "gate_passes"].includes(view));
  const reload = useCallback(async () => {
    if (!site) return;
    try {
      const d = await request(
        `/api/field/${view}?tenant=${tenant}&site=${site}&offset=${offset}&q=${encodeURIComponent(q)}`,
      );
      setRows(d.rows);
      setTotal(d.total);
      if (staff || client)
        setScore(
          await request(`/api/field/score?tenant=${tenant}&site=${site}`),
        );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [site, view, tenant, offset, q, staff, client]);
  useEffect(() => {
    const v = new URLSearchParams(location.search).get("view");
    // Synchronize the external API/browser state when this scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v && v in fieldResources) setView(v as FieldResource);
    request(`/api/field/context?tenant=${tenant}`)
      .then((d) => {
        setSites(d.sites);
        setSite(
          d.sites.find(
            (s: Row) =>
              s.id === new URLSearchParams(location.search).get("site"),
          )?.id ||
            d.sites[0]?.id ||
            "",
        );
        setLookups((l) => ({ ...l, shift_templates: d.shift_templates }));
      })
      .catch((e) => setError(e.message));
  }, [tenant]);
  useEffect(() => {
    // Synchronize the external API/browser state when this scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);
  useEffect(() => {
    if (!site) return;
    let live = true;
    async function lookup() {
      try {
        const names = [
          "surveys",
          "checkpoints",
          ...(staff ? ["posts"] : []),
          ...(!client ? ["people"] : []),
        ];
        const pairs = await Promise.all(
          names.map(async (n) => [
            n,
            (
              await request(
                n === "posts"
                  ? `/api/foundation/posts?tenant=${tenant}&parent=${site}&limit=100`
                  : `/api/field/${n}?tenant=${tenant}&site=${site}`,
              )
            ).rows,
          ]),
        );
        if (live) setLookups((l) => ({ ...l, ...Object.fromEntries(pairs) }));
      } catch (e) {
        if (live) setError((e as Error).message);
      }
    }
    void lookup();
    return () => {
      live = false;
    };
  }, [tenant, site, staff, client, notice]);
  const open = (r?: Row) => {
    const initial = { ...config.initial, ...r };
    for (const f of config.fields) {
      if (!initial[f.key] && f.type === "date" && !f.optional)
        initial[f.key] = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });
      if (!initial[f.key] && f.type === "datetime-local")
        initial[f.key] = new Date().toISOString();
    }
    setForm(initial);
    setEdit(r || {});
    setError("");
  };
  const inspect = async (r: Row) => {
    setDetail(r);
    setComment("");
    setSignoff("");
    setError("");
    try {
      const [ev, files] = await Promise.all(
        ["events", "evidence"].map((x) =>
          request(
            `/api/field/${x}?tenant=${tenant}&kind=${view}&entity=${r.id}`,
          ),
        ),
      );
      setEvents(ev.rows);
      setEvidence(files.rows);
      if (view === "patrols") {
        const d = await request(
          `/api/field/scans?tenant=${tenant}&patrol=${r.id}`,
        );
        setEvents(
          d.rows.map((s: Row) => ({
            ...s,
            action: "checkpoint scanned",
            actor_name: s.checkpoint_id,
            comment: `GPS accuracy ${s.accuracy} metres`,
            created_at: s.scanned_at,
          })),
        );
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const data = fieldSchemas[view].parse({
        ...Object.fromEntries(config.fields.map((f) => [f.key, form[f.key]])),
        site_id: site,
      });
      await request("/api/field/" + view, {
        tenant_id: tenant,
        id: edit?.id,
        row_version: edit?.row_version,
        data,
      });
      setEdit(null);
      setNotice("Record saved.");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const transition = async (status: string) => {
    setBusy(true);
    setError("");
    try {
      await request("/api/field/transition", {
        tenant_id: tenant,
        kind: view,
        id: detail?.id,
        row_version: detail?.row_version,
        status,
        comment,
        signoff,
      });
      setDetail(null);
      setNotice("Workflow updated and recorded in the activity history.");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const locate = (callback: (coords: GeolocationCoordinates) => void) => {
    if (!navigator.geolocation) {
      setError("Location is unavailable on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => callback(p.coords),
      (e) => setError(e.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };
  const report = (id?: string) =>
    `/api/field-report?tenant=${tenant}&site=${site}&kind=${view}${id ? "&id=" + id : ""}`;
  const allowed = (transitions[view]?.[detail?.status] || []).filter((s) =>
    view === "findings"
      ? ["acknowledged", "risk_accepted"].includes(s)
        ? client
        : ["flagged", "verified", "closed"].includes(s)
          ? staff
          : staff || client
      : view === "handovers"
        ? m.role === "employee"
        : view === "gate_passes"
          ? staff || m.role === "employee"
          : staff,
  );
  return (
    <>
      <div className="ops-toolbar">
        <label>
          Site{" "}
          <select
            aria-label="Site"
            value={site}
            onChange={(e) => {
              setSite(e.target.value);
              setOffset(0);
            }}
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <a className="ops-button secondary" href={report()}>
          <FileDown size={17} />
          Download report
        </a>
      </div>
      {score && (
        <div className="ops-stats">
          <div className="ops-stat">
            <strong>
              {score.score}
              <small style={{ fontSize: 15 }}>/100</small>
            </strong>
            <span>Current site security score</span>
          </div>
          <div className="ops-stat">
            <strong>{score.open}</strong>
            <span>Open weaknesses</span>
          </div>
          <div className="ops-stat">
            <strong>{score.overdue}</strong>
            <span>Overdue remedies</span>
          </div>
          <div className="ops-stat">
            <strong>{score.total}</strong>
            <span>Recorded weaknesses</span>
          </div>
        </div>
      )}
      <div className="ops-tabs" role="tablist" aria-label="Site operations">
        {Object.entries(fieldResources)
          .filter(
            ([k]) =>
              m.role !== "employee" ||
              [
                "incidents",
                "sos",
                "handovers",
                "gate_passes",
                "checkpoints",
                "patrols",
              ].includes(k),
          )
          .map(([k, c]) => (
            <button
              key={k}
              role="tab"
              aria-selected={view === k}
              onClick={() => {
                setView(k as FieldResource);
                setOffset(0);
                setQ("");
              }}
            >
              {c.label}
            </button>
          ))}
      </div>
      <div className="ops-toolbar">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600 }}>{config.label}</h2>
          <p style={{ color: "#52677f", marginTop: 8 }}>{config.description}</p>
        </div>
        {canCreate && (
          <button
            className="ops-button"
            disabled={!site}
            onClick={() => open()}
          >
            <Plus size={17} />
            New record
          </button>
        )}
      </div>
      {notice && (
        <p className="ops-success" role="status">
          {notice}
        </p>
      )}
      {error && !edit && !detail && (
        <p role="alert" className="ops-error">
          {error}
        </p>
      )}
      <div className="ops-toolbar">
        <input
          value={q}
          aria-label="Search records"
          onChange={(e) => {
            setQ(e.target.value);
            setOffset(0);
          }}
          placeholder="Search records…"
        />
        <span>{total} records</span>
      </div>
      <div className="ops-grid">
        {rows.map((r) => (
          <article className="ops-card" key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                className={`ops-badge ${["critical", "high"].includes(r.severity) ? "bad" : ["closed", "verified", "resolved"].includes(r.status) ? "good" : "warn"}`}
              >
                {r.severity || r.kind || view}
              </span>
              <small>{dateLabel(r.created_at)}</small>
            </div>
            <h3>{r.title}</h3>
            <p>
              {r.description || r.notes || r.purpose || r.location || r.venue}
            </p>
            {r.target_date && (
              <p>
                Target {dateLabel(r.target_date)} · {r.responsible_party}
              </p>
            )}
            {r.status && (
              <span className="ops-badge">{r.status.replaceAll("_", " ")}</span>
            )}
            <footer>
              <button
                className="ops-button secondary"
                onClick={() => void inspect(r)}
              >
                Open record <ArrowRight size={15} />
              </button>
              {staff && (
                <button
                  className="ops-button secondary"
                  onClick={() => open(r)}
                >
                  Edit
                </button>
              )}
            </footer>
          </article>
        ))}
      </div>
      {!rows.length && (
        <div className="ops-empty">
          <Activity size={25} style={{ margin: "0 auto 14px" }} />
          No records found at this site.
        </div>
      )}
      <div className="ops-toolbar">
        <button
          className="ops-button secondary"
          disabled={!offset}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          Previous
        </button>
        <span>Page {offset / 50 + 1}</span>
        <button
          className="ops-button secondary"
          disabled={offset + 50 >= total}
          onClick={() => setOffset(offset + 50)}
        >
          Next
        </button>
      </div>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent style={{ maxWidth: 760 }}>
          <DialogHeader>
            <DialogTitle>
              {edit?.id ? "Edit" : "New"} {config.label.toLowerCase()}
            </DialogTitle>
            <DialogDescription>
              {sites.find((s) => s.id === site)?.name} · Changes are recorded
              with your identity.
            </DialogDescription>
          </DialogHeader>
          <form
            className="ops-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            {config.fields.some((f) => f.source === "people") && (
              <label className="wide">
                Find employee
                <input
                  value={personSearch}
                  placeholder="Search name or code"
                  onChange={async (e) => {
                    setPersonSearch(e.target.value);
                    try {
                      const d = await request(
                        `/api/field/people?tenant=${tenant}&site=${site}&q=${encodeURIComponent(e.target.value)}`,
                      );
                      setLookups((l) => ({ ...l, people: d.rows }));
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                />
              </label>
            )}
            {config.fields.map((f) => (
              <label
                key={f.key}
                className={
                  ["textarea", "json", "ids"].includes(f.type || "")
                    ? "wide"
                    : ""
                }
              >
                {f.label}
                {f.type === "json" ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      padding: 12,
                      border: "1px solid #c7d4e3",
                      borderRadius: 6,
                    }}
                  >
                    {Object.keys(form[f.key] || {}).map((k) => (
                      <label
                        key={k}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!form[f.key][k]}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [f.key]: {
                                ...form[f.key],
                                [k]: e.target.checked,
                              },
                            })
                          }
                        />
                        {k.replaceAll("_", " ")}
                      </label>
                    ))}
                  </div>
                ) : f.type === "ids" ? (
                  <div>
                    {lookups[f.source!]?.map((r) => (
                      <label
                        style={{ display: "flex", gap: 8, margin: 8 }}
                        key={r.id}
                      >
                        <input
                          type="checkbox"
                          checked={(form[f.key] || []).includes(r.id)}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [f.key]: e.target.checked
                                ? [...form[f.key], r.id]
                                : form[f.key].filter((x: string) => x !== r.id),
                            })
                          }
                        />
                        {r.title}
                      </label>
                    ))}
                  </div>
                ) : f.source ? (
                  <select
                    value={form[f.key] || ""}
                    required={!f.optional}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value || null })
                    }
                  >
                    <option value="">Select…</option>
                    {lookups[f.source]?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.full_name || r.name || r.title}
                        {r.employee_code ? " · " + r.employee_code : ""}
                      </option>
                    ))}
                  </select>
                ) : f.options ? (
                  <select
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  >
                    {f.options.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={form[f.key] || ""}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    type={f.type || "text"}
                    step={f.type === "number" ? "any" : undefined}
                    value={
                      f.type === "datetime-local" && form[f.key]
                        ? new Date(
                            new Date(form[f.key]).getTime() + 330 * 60000,
                          )
                            .toISOString()
                            .slice(0, 16)
                        : (form[f.key] ?? "")
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [f.key]:
                          f.type === "number"
                            ? e.target.value === ""
                              ? null
                              : Number(e.target.value)
                            : f.type === "datetime-local"
                              ? e.target.value
                                ? new Date(
                                    e.target.value + ":00+05:30",
                                  ).toISOString()
                                : ""
                              : e.target.value || (f.optional ? null : ""),
                      })
                    }
                  />
                )}
              </label>
            ))}
            {["sos", "findings", "checkpoints"].includes(view) && (
              <button
                type="button"
                className="ops-button secondary wide"
                onClick={() =>
                  locate((c) =>
                    setForm({
                      ...form,
                      latitude: c.latitude,
                      longitude: c.longitude,
                    }),
                  )
                }
              >
                <MapPin size={16} />
                Use current GPS location
              </button>
            )}
            {error && (
              <p className="ops-error wide" role="alert">
                {error}
              </p>
            )}
            <div className="ops-form-actions">
              <button
                type="button"
                className="ops-button secondary"
                onClick={() => setEdit(null)}
              >
                Cancel
              </button>
              <button disabled={busy} className="ops-button">
                {busy ? "Saving…" : "Save record"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent
          style={{
            width: "min(620px,100vw)",
            maxWidth: 620,
            padding: 25,
            overflowY: "auto",
          }}
        >
          <SheetHeader>
            <SheetTitle>{detail?.title}</SheetTitle>
            <SheetDescription>
              {config.label} ·{" "}
              {detail?.status?.replaceAll("_", " ") ||
                dateLabel(detail?.created_at)}
            </SheetDescription>
          </SheetHeader>
          {detail && (
            <>
              <div className="ops-card" style={{ marginTop: 20 }}>
                {config.fields
                  .filter((f) => !["title"].includes(f.key))
                  .map((f) => (
                    <div key={f.key} style={{ marginBottom: 12 }}>
                      <small>{f.label}</small>
                      <p style={{ margin: 0, overflowWrap: "anywhere" }}>
                        {typeof detail[f.key] === "object"
                          ? JSON.stringify(detail[f.key])
                          : String(detail[f.key] ?? "—")}
                      </p>
                    </div>
                  ))}
                <a href={report(detail.id)} className="ops-button secondary">
                  <FileDown size={16} />
                  Download PDF
                </a>
                {view === "checkpoints" && (
                  <div style={{ marginTop: 16 }}>
                    <a
                      className="ops-button secondary"
                      href={`/api/checkpoint-qr?tenant=${tenant}&id=${detail.id}`}
                    >
                      Print checkpoint QR
                    </a>
                  </div>
                )}
                {view === "patrols" && m.role === "employee" && (
                  <button
                    className="ops-button"
                    style={{ marginTop: 16 }}
                    onClick={() => {
                      const token = prompt(
                        "Scan the QR with your phone camera, or paste its checkpoint token here",
                      );
                      if (!token) return;
                      let id = token;
                      try {
                        id =
                          new URL(token).searchParams.get("checkpoint") ||
                          token;
                      } catch {}
                      locate(async (c) => {
                        try {
                          await request("/api/field/scan", {
                            tenant_id: tenant,
                            patrol_id: detail.id,
                            token: id,
                            latitude: c.latitude,
                            longitude: c.longitude,
                            accuracy: c.accuracy,
                          });
                          setNotice("Checkpoint recorded.");
                          await inspect(detail);
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      });
                    }}
                  >
                    Record checkpoint visit
                  </button>
                )}
              </div>
              <h3 style={{ margin: "24px 0 12px", fontWeight: 700 }}>
                Evidence & attachments
              </h3>
              {evidence.map((f) => (
                <button
                  style={{ display: "flex", marginBottom: 8 }}
                  key={f.id}
                  className="ops-button secondary"
                  onClick={async () => {
                    try {
                      const d = await request(
                        `/api/field-evidence?tenant=${tenant}&id=${f.id}`,
                      );
                      window.open(d.url, "_blank", "noopener,noreferrer");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <Paperclip size={15} />
                  {f.file_name}
                </button>
              ))}
              <label
                style={{
                  display: "block",
                  border: "1px dashed #afc3d8",
                  padding: 15,
                  borderRadius: 6,
                }}
              >
                Add photo, PDF, video or audio
                <input
                  aria-label="Upload evidence"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf,video/mp4,audio/webm,audio/mpeg"
                  disabled={busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    try {
                      const f = new FormData();
                      f.set("tenant", tenant);
                      f.set("site", site);
                      f.set("kind", view);
                      f.set("entity", detail.id);
                      f.set("file", file);
                      const r = await fetch("/api/field-evidence", {
                        method: "POST",
                        body: f,
                      });
                      const d = (await r.json()) as Row;
                      if (!r.ok) throw Error(d.error);
                      await inspect(detail);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
              {transitions[view] && (
                <div
                  className="ops-form"
                  style={{ display: "block", maxHeight: "none", marginTop: 25 }}
                >
                  <label>
                    Comment / action notes
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </label>
                  {client && view === "findings" && (
                    <label style={{ marginTop: 12 }}>
                      Your name for client acknowledgement / risk acceptance
                      <input
                        value={signoff}
                        onChange={(e) => setSignoff(e.target.value)}
                      />
                    </label>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 15,
                    }}
                  >
                    <button
                      className="ops-button secondary"
                      disabled={busy || comment.trim().length < 3}
                      onClick={() => void transition("comment")}
                    >
                      Add comment
                    </button>
                    {allowed.map((status) => (
                      <button
                        className="ops-button"
                        key={status}
                        disabled={busy || comment.trim().length < 3}
                        onClick={() => void transition(status)}
                      >
                        {status.replaceAll("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <p role="alert" className="ops-error">
                  {error}
                </p>
              )}
              <h3 style={{ margin: "25px 0 15px", fontWeight: 700 }}>
                Activity history
              </h3>
              {events.map((e) => (
                <article
                  key={e.id}
                  style={{
                    borderLeft: "2px solid #c7a530",
                    padding: "0 0 20px 16px",
                  }}
                >
                  <strong>{e.action.replaceAll("_", " ")}</strong>
                  <p>{e.comment}</p>
                  <small>
                    {e.actor_name} · {dateLabel(e.created_at)}
                  </small>
                </article>
              ))}
              {!events.length && <p>No workflow events yet.</p>}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
