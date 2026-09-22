"use client";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Search,
  Send,
  Copy,
  GripVertical,
  Bell,
  Download,
} from "lucide-react";
import {
  OperationsShell,
  useWorkspace,
  request,
  dateLabel,
} from "@/components/operations/shell";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import "./planner.css";
// Schema-driven forms consume records validated by the resource-specific Zod API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type Slot = { post: Row; date: string; slot: number; assignment?: Row };
const day = (d: Date) =>
  d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
function plus(d: string, n: number) {
  const x = new Date(d + "T12:00:00+05:30");
  x.setDate(x.getDate() + n);
  return day(x);
}
export default function Planner() {
  return (
    <OperationsShell
      title="Deployment planner"
      subtitle="The right person. The right post. A complete view of every shift."
    >
      <Board />
    </OperationsShell>
  );
}
function Board() {
  const m = useWorkspace(),
    tenant = m.tenant_id,
    editable = ["admin", "operations_manager", "senior_manager"].includes(
      m.role,
    );
  const [sites, setSites] = useState<Row[]>([]),
    [site, setSite] = useState(""),
    [posts, setPosts] = useState<Row[]>([]),
    [shifts, setShifts] = useState<Row[]>([]),
    [shift, setShift] = useState(""),
    [requirements, setRequirements] = useState<Row[]>([]),
    [assignments, setAssignments] = useState<Row[]>([]),
    [start, setStart] = useState(day(new Date())),
    [days, setDays] = useState(7),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Slot | null>(null),
    [candidates, setCandidates] = useState<Row[]>([]),
    [search, setSearch] = useState(""),
    [candidateOffset, setCandidateOffset] = useState(0),
    [reason, setReason] = useState("Operational deployment"),
    [override, setOverride] = useState(""),
    [history, setHistory] = useState<Row[]>([]),
    [notifications, setNotifications] = useState<Row[]>([]),
    [showNotifications, setShowNotifications] = useState(false),
    [drag, setDrag] = useState<Row | null>(null),
    [forecast, setForecast] = useState<Row[]>([]);
  const load = useCallback(async () => {
    try {
      const d = await request(
        `/api/roster/board?tenant=${tenant}&site=${site}&from=${start}&days=${days}`,
      );
      setAssignments(d.rows);
      if (site) {
        const h = await request(
          `/api/roster/history?tenant=${tenant}&site=${site}`,
        );
        setHistory(h.rows);
        const f = await request(
          `/api/roster/forecast?tenant=${tenant}&site=${site}&from=${start}`,
        );
        setForecast(f.rows);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenant, site, start, days]);
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [s, sh] = await Promise.all(
          ["sites", "shift_templates"].map((r) =>
            request(`/api/foundation/${r}?tenant=${tenant}&limit=100`),
          ),
        );
        if (cancelled) return;
        setSites(s.rows);
        setSite(s.rows[0]?.id || "");
        setShifts(sh.rows);
        setShift(sh.rows[0]?.id || "");
        const n = await request(`/api/roster/notifications?tenant=${tenant}`);
        if (!cancelled) setNotifications(n.rows);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [tenant]);
  useEffect(() => {
    // Synchronize the external API/browser state when this scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    if (!site) {
      // Synchronize the external API/browser state when this scope changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosts([]);
      return;
    }
    let active = true;
    async function fetchPosts() {
      try {
        let cursor = "",
          all: Row[] = [];
        do {
          const d = await request(
            `/api/foundation/posts?tenant=${tenant}&parent=${site}&limit=100${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`,
          );
          all = all.concat(d.rows);
          cursor = d.nextCursor || "";
        } while (cursor);
        const reqs = (
          await Promise.all(
            all.map((p) =>
              request(
                `/api/foundation/staffing_requirements?tenant=${tenant}&parent=${p.id}&limit=100`,
              ),
            ),
          )
        ).flatMap((x) => x.rows);
        if (active) {
          setPosts(all);
          setRequirements(reqs);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }
    void fetchPosts();
    return () => {
      active = false;
    };
  }, [site, tenant]);
  useEffect(() => {
    if (!selected || !editable) return;
    let current = true;
    request(
      `/api/roster/candidates?tenant=${tenant}&post=${selected.post.id}&shift=${shift}&date=${selected.date}&q=${encodeURIComponent(search)}&offset=${candidateOffset}`,
    )
      .then((d) => {
        if (current)
          setCandidates(
            d.rows.sort(
              (a: Row, b: Row) =>
                a.reasons.length - b.reasons.length ||
                b.previous_shifts - a.previous_shifts,
            ),
          );
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [selected, tenant, shift, search, candidateOffset, editable]);
  const dates = Array.from({ length: days }, (_, i) => plus(start, i));
  const required = (p: Row, d: string) =>
    requirements.find(
      (r) =>
        r.post_id === p.id &&
        r.shift_id === shift &&
        r.effective_from <= d &&
        (!r.effective_to || r.effective_to >= d) &&
        r.weekdays.includes(new Date(d + "T12:00:00+05:30").getUTCDay() || 7),
    )?.headcount || 0;
  const slots = posts.reduce(
      (n, p) => n + dates.reduce((s, d) => s + required(p, d), 0),
      0,
    ),
    visible = assignments.filter((a) => a.shift_id === shift),
    present = visible.filter(
      (a) => a.attendance === "present" || a.attendance === "late",
    ).length;
  const act = async (action: string, data: Row) => {
    setBusy(true);
    setError("");
    try {
      const r = await request("/api/roster/" + action, {
        tenant_id: tenant,
        ...data,
      });
      setNotice(
        action === "publish"
          ? `Roster published · revision ${r.record.revision}. Employee notifications are available in the portal.`
          : action === "copy"
            ? `${r.record} assignments copied.`
            : "Roster updated.",
      );
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const assign = async (person: Row, target: Slot, moving?: Row) => {
    const ok = await act("assign", {
      employee_id: person.id,
      post_id: target.post.id,
      shift_id: shift,
      work_date: target.date,
      slot: target.slot,
      reason,
      override_reason: override,
      ...(moving
        ? { id: moving.id, row_version: moving.row_version }
        : target.assignment
          ? {
              id: target.assignment.id,
              row_version: target.assignment.row_version,
            }
          : {}),
    });
    if (ok) setSelected(null);
  };
  const exportCSV = () => {
    const cols = [
      "Date",
      "Site",
      "Post",
      "Shift",
      "Employee",
      "Code",
      "Status",
      "Attendance",
    ];
    const escape = (v: unknown) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'")
        .replaceAll('"', '""') +
      '"';
    const text = [
      cols,
      ...assignments.map((a) => [
        a.work_date,
        a.site_name,
        a.post_name,
        a.shift_name,
        a.full_name,
        a.employee_code,
        a.status,
        a.attendance || "Not checked in",
      ]),
    ]
      .map((r) => r.map(escape).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "SDC-deployment-" + start + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      {error && (
        <div role="alert" className="ops-error">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="ops-success">
          {notice}
        </div>
      )}
      <div className="ops-toolbar">
        <label>
          Site{" "}
          <select
            aria-label="Site"
            value={site}
            onChange={(e) => setSite(e.target.value)}
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="roster-dates">
          <button
            aria-label="Previous period"
            onClick={() => setStart(plus(start, -days))}
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            aria-label="Period start"
            value={start}
            onChange={(e) => e.target.value && setStart(e.target.value)}
          />
          <button
            aria-label="Next period"
            onClick={() => setStart(plus(start, days))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <select
          aria-label="Calendar view"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={1}>Day</option>
          <option value={7}>Week</option>
          <option value={31}>31 days</option>
        </select>
        <button
          className="ops-button secondary"
          onClick={() => setShowNotifications(true)}
        >
          <Bell size={17} />
          {notifications.filter((n) => !n.read_at).length}
        </button>
      </div>
      <div className="ops-stats">
        <div className="ops-stat">
          <strong>{slots}</strong>
          <span>Required shift positions</span>
        </div>
        <div className="ops-stat">
          <strong>{visible.length}</strong>
          <span>Rostered personnel</span>
        </div>
        <div className="ops-stat">
          <strong>{present}</strong>
          <span>Marked present</span>
        </div>
        <div className="ops-stat">
          <strong
            style={{ color: slots > visible.length ? "#a34024" : undefined }}
          >
            {Math.max(0, slots - visible.length)}
          </strong>
          <span>Open deployment gaps</span>
        </div>
      </div>
      <div className="ops-toolbar">
        <div className="ops-tabs" style={{ margin: 0 }}>
          {shifts.map((s) => (
            <button
              key={s.id}
              aria-selected={s.id === shift}
              onClick={() => setShift(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="ops-button secondary" onClick={exportCSV}>
            <Download size={16} />
            Export
          </button>
          {editable && site && (
            <>
              <button
                className="ops-button secondary"
                disabled={busy || days !== 7}
                onClick={() => {
                  const to = prompt(
                    "Copy this week to a new start date (YYYY-MM-DD)",
                    plus(start, 7),
                  );
                  if (to) void act("copy", { site_id: site, from: start, to });
                }}
              >
                <Copy size={16} />
                Copy week
              </button>
              <button
                className="ops-button"
                disabled={busy || days !== 7}
                onClick={() =>
                  void act("publish", { site_id: site, week: start })
                }
              >
                <Send size={16} />
                Publish week
              </button>
            </>
          )}
        </div>
      </div>
      {posts.length ? (
        <div className="roster-scroll">
          <table className="roster-board">
            <thead>
              <tr>
                <th>POST / POSITION</th>
                {dates.map((d) => (
                  <th key={d}>
                    {new Date(d + "T12:00:00+05:30").toLocaleDateString(
                      "en-IN",
                      { weekday: "short", day: "2-digit", month: "short" },
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <th>
                    <strong>{p.name}</strong>
                    <small>{p.location_notes || "Security post"}</small>
                  </th>
                  {dates.map((d) => (
                    <td key={d}>
                      {Array.from({ length: required(p, d) }, (_, i) => {
                        const a = visible.find(
                            (x) =>
                              x.post_id === p.id &&
                              x.work_date === d &&
                              x.slot === i + 1,
                          ),
                          target = {
                            post: p,
                            date: d,
                            slot: i + 1,
                            assignment: a,
                          };
                        return (
                          <button
                            key={i}
                            className={`roster-slot ${a ? a.status : "gap"}`}
                            draggable={editable && !!a}
                            onDragStart={() => a && setDrag(a)}
                            onDragEnd={() => setDrag(null)}
                            onDragOver={(e) => {
                              if (editable) e.preventDefault();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (drag && !a)
                                void assign(
                                  { id: drag.employee_id },
                                  target,
                                  drag,
                                );
                              setDrag(null);
                            }}
                            onClick={() => {
                              setSelected(target);
                              setSearch("");
                              setCandidateOffset(0);
                              setOverride("");
                            }}
                          >
                            <span>
                              {a ? (
                                <>
                                  <GripVertical size={13} />
                                  {a.full_name}
                                </>
                              ) : (
                                <>
                                  <Plus size={16} />
                                  Assign guard
                                </>
                              )}
                            </span>
                            <small>
                              {a
                                ? a.acknowledged_at
                                  ? "Acknowledged"
                                  : a.status === "draft"
                                    ? "Draft · not published"
                                    : "Awaiting acknowledgement"
                                : `Position ${i + 1} · uncovered`}
                            </small>
                            {a?.attendance && <small>{a.attendance}</small>}
                          </button>
                        );
                      })}
                      {!required(p, d) && (
                        <span className="roster-no-duty">No requirement</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ops-empty">
          {m.role === "employee"
            ? "Your published duties are listed below."
            : "Select a site with configured posts and staffing requirements."}
        </div>
      )}
      {m.role === "employee" && (
        <div className="ops-grid">
          {assignments.map((a) => (
            <article className="ops-card" key={a.id}>
              <CalendarDays size={22} />
              <h2>{a.site_name}</h2>
              <p>
                {a.post_name} · {a.shift_name}
                <br />
                {dateLabel(a.work_date)}
              </p>
              <button
                className="ops-button"
                disabled={busy || !!a.acknowledged_at}
                onClick={() => void act("acknowledge", { id: a.id })}
              >
                <Check size={16} />
                {a.acknowledged_at ? "Acknowledged" : "Acknowledge duty"}
              </button>
            </article>
          ))}
        </div>
      )}
      <div className="ops-card" style={{ marginTop: 24 }}>
        <h3>14-day coverage forecast</h3>
        <p>
          Published coverage with forward checks for leave, training,
          certificate expiry and working-hour limits.
        </p>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Required</th>
                <th>Published</th>
                <th>At risk</th>
                <th>Expected shortfall</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((f) => (
                <tr key={f.date}>
                  <td>{dateLabel(f.date)}</td>
                  <td>{f.required}</td>
                  <td>{f.rostered}</td>
                  <td>{f.at_risk}</td>
                  <td>
                    <span
                      className={`ops-badge ${Number(f.required) - Number(f.rostered) + Number(f.at_risk) > 0 ? "warn" : "good"}`}
                    >
                      {Math.max(
                        0,
                        Number(f.required) -
                          Number(f.rostered) +
                          Number(f.at_risk),
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="ops-card" style={{ marginTop: 24 }}>
        <h3>Publication history</h3>
        <p>
          Draft changes stay visible to planners. Publish the week to release
          assignments to employees. Open gaps remain visible.
        </p>
        {history.slice(0, 5).map((h) => (
          <p key={h.id}>
            Revision {h.revision} · Week of {dateLabel(h.week_start)} ·
            Published {dateLabel(h.published_at)}
          </p>
        ))}
      </div>
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent
          style={{
            width: "min(520px,100vw)",
            maxWidth: 520,
            overflowY: "auto",
            padding: 24,
          }}
        >
          <SheetHeader>
            <SheetTitle>
              {selected?.assignment
                ? "Manage assignment"
                : "Find the right replacement"}
            </SheetTitle>
            <SheetDescription>
              {selected?.post.name} · {selected && dateLabel(selected.date)} ·
              Position {selected?.slot}
            </SheetDescription>
          </SheetHeader>
          {error && (
            <p className="ops-error" role="alert">
              {error}
            </p>
          )}
          {selected?.assignment && (
            <div className="ops-card">
              <h3>{selected.assignment.full_name}</h3>
              <p>{selected.assignment.status}</p>
              {editable && (
                <button
                  className="ops-button secondary"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await act("remove", {
                        id: selected.assignment!.id,
                        row_version: selected.assignment!.row_version,
                        reason,
                      })
                    )
                      setSelected(null);
                  }}
                >
                  Remove assignment
                </button>
              )}
            </div>
          )}
          {editable ? (
            <>
              <div
                className="ops-form"
                style={{ display: "grid", marginTop: 20, maxHeight: "none" }}
              >
                <label className="wide">
                  Change reason
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                {m.role === "admin" && (
                  <label className="wide">
                    Training override reason (optional)
                    <input
                      value={override}
                      onChange={(e) => setOverride(e.target.value)}
                      placeholder="At least 10 characters · audit logged"
                    />
                  </label>
                )}
                <label className="wide">
                  <span>
                    <Search size={15} style={{ display: "inline" }} /> Find
                    personnel
                  </span>
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCandidateOffset(0);
                    }}
                    placeholder="Name or employee code"
                  />
                </label>
              </div>
              <p style={{ fontSize: 13, color: "#536980", margin: "18px 0" }}>
                Available people first, then site experience, travel distance and estimated overtime.
                Eligibility is checked again when you assign.
              </p>
              {candidates.map((p) => (
                <article
                  className="ops-card"
                  style={{ marginBottom: 12, padding: 17 }}
                  key={p.id}
                >
                  <strong>{p.full_name}</strong>
                  <small style={{ display: "block" }}>
                    {p.employee_code} · {p.category} · {p.previous_shifts}{" "}
                    previous shifts
                  </small>
                  <p style={{fontSize:14,margin:"8px 0"}}>{p.weekly_hours} h this week · {p.rest_hours===null?"No previous shift":p.rest_hours+" h rest"}<br/>{p.distance_km===null?"Current site distance unavailable":p.distance_km+" km from current posting"} · {p.estimated_overtime_paise===null?"Overtime rate unavailable":"Est. OT ₹"+(p.estimated_overtime_paise/100).toLocaleString("en-IN")}</p>
                  <p style={{ fontSize: 15, margin: "8px 0" }}>
                    {p.reasons.length
                      ? p.reasons.join(" · ")
                      : "Available · checks passed"}
                  </p>
                  <button
                    className="ops-button"
                    disabled={
                      busy ||
                      (!!p.reasons.length &&
                        !(
                          m.role === "admin" &&
                          override.trim().length >= 10 &&
                          p.reasons.every((r: string) =>
                            r.startsWith("Missing certification:"),
                          )
                        ))
                    }
                    onClick={() => selected && void assign(p, selected)}
                  >
                    Assign to post
                  </button>
                </article>
              ))}
              <div className="ops-toolbar">
                <button
                  className="ops-button secondary"
                  disabled={!candidateOffset}
                  onClick={() =>
                    setCandidateOffset(Math.max(0, candidateOffset - 50))
                  }
                >
                  Previous
                </button>
                <button
                  className="ops-button secondary"
                  disabled={candidates.length < 50}
                  onClick={() => setCandidateOffset(candidateOffset + 50)}
                >
                  More personnel
                </button>
              </div>
            </>
          ) : (
            <p style={{ marginTop: 24 }}>
              Your role can view published assignments. An operations manager
              manages changes.
            </p>
          )}
        </SheetContent>
      </Sheet>
      <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
        <SheetContent style={{ overflowY: "auto", padding: 24 }}>
          <SheetHeader>
            <SheetTitle>Your notifications</SheetTitle>
            <SheetDescription>Duty updates for your account.</SheetDescription>
          </SheetHeader>
          {notifications.map((n) => (
            <article className="ops-card" style={{ marginTop: 12 }} key={n.id}>
              <strong>{n.title}</strong>
              <p>{n.body}</p>
              {!n.read_at && (
                <button
                  className="ops-button secondary"
                  onClick={async () => {
                    await act("notification_read", { id: n.id });
                    setNotifications((old) =>
                      old.map((x) =>
                        x.id === n.id
                          ? { ...x, read_at: new Date().toISOString() }
                          : x,
                      ),
                    );
                  }}
                >
                  Mark read
                </button>
              )}
            </article>
          ))}
          {!notifications.length && <p>No notifications yet.</p>}
        </SheetContent>
      </Sheet>
    </>
  );
}
