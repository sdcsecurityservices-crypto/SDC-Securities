"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarRange,
  Camera,
  CheckCircle2,
  FileDown,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Siren,
  UserCheck,
  Users,
} from "lucide-react";
import {
  OperationsShell,
  useWorkspace,
  request,
} from "@/components/operations/shell";
import "./control.css";
// Rows come from the command_summary and guard_performance RPCs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const REFRESH_MS = 30000;
const istDate = (d = new Date()) =>
  d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const istTime = (d: Date) =>
  d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
const n = (v: unknown) => Number(v || 0);
/** Higher is more urgent: SOS, then incidents, risks and offline cameras. */
const severity = (s: Row) =>
  n(s.sos) * 1000 + n(s.open_incidents) * 100 + n(s.risks) * 10 + n(s.offline_cameras);
const tone = (s: Row) =>
  n(s.sos) ? "bad" : n(s.open_incidents) || n(s.risks) || n(s.offline_cameras) ? "warn" : "good";
const statusLabel = (s: Row) =>
  n(s.sos)
    ? "SOS active"
    : n(s.open_incidents)
      ? "Incident open"
      : n(s.risks)
        ? "Open risks"
        : n(s.offline_cameras)
          ? "Camera offline"
          : "All clear";

export default function Control() {
  return (
    <OperationsShell
      title="Command centre"
      subtitle="One operational picture. Every site, every shift, every response."
    >
      <Dashboard />
    </OperationsShell>
  );
}

function Dashboard() {
  const m = useWorkspace(),
    tenant = m.tenant_id;
  const [data, setData] = useState<Row>({ sites: [] }),
    [loaded, setLoaded] = useState(false),
    [updated, setUpdated] = useState<Date | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [checking, setChecking] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [people, setPeople] = useState<Row[]>([]);
  const operator = ["admin", "operations_manager", "senior_manager"].includes(m.role);
  const load = useCallback(async () => {
    try {
      const d = await request(`/api/control/summary?tenant=${tenant}`);
      setData(d);
      setUpdated(new Date());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }, [tenant]);
  useEffect(() => {
    // Poll only while the tab is visible; refresh as soon as it returns.
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(timer);
      void load();
      timer = setInterval(() => void load(), REFRESH_MS);
    };
    const onVisibility = () =>
      document.visibilityState === "visible" ? start() : clearInterval(timer);
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);
  useEffect(() => {
    if (m.role === "client_user") return;
    const end = istDate(),
      start = end.slice(0, 8) + "01";
    request(`/api/control/performance?tenant=${tenant}&from=${start}&to=${end}`)
      .then((d) => setPeople(d.rows || []))
      .catch(() => setPeople([]));
  }, [tenant, m.role]);

  const sites: Row[] = data.sites;
  const totals = useMemo(() => {
    const sum = (k: string) => sites.reduce((t, s) => t + n(s[k]), 0);
    return {
      onDuty: sum("on_duty"),
      present: sum("present_today"),
      incidents: sum("open_incidents"),
      sos: sum("sos"),
      risks: sum("risks"),
      cameras: sum("offline_cameras"),
    };
  }, [sites]);
  const attention = useMemo(
    () => sites.filter((s) => severity(s) > 0).sort((a, b) => severity(b) - severity(a)),
    [sites],
  );
  const sosSites = attention.filter((s) => n(s.sos));

  const runChecks = async () => {
    setChecking(true);
    try {
      const d = await request("/api/control/checks", { tenant_id: tenant });
      setNotice(
        d.notifications_created
          ? `${d.notifications_created} new alert${d.notifications_created === 1 ? "" : "s"} raised. Existing alerts are not duplicated.`
          : "Checks complete. No new alerts.",
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="cc">
      <div className="cc-bar">
        <span className="cc-live" aria-live="polite">
          <i aria-hidden />
          {updated ? `Live · updated ${istTime(updated)} IST` : "Connecting…"}
        </span>
        <div className="cc-bar-actions">
          <button
            className="ops-button secondary"
            onClick={() => void load()}
            aria-label="Refresh now"
            title="Refresh now"
          >
            <RefreshCw size={16} />
          </button>
          <a className="ops-button secondary" href={`/api/control/report?tenant=${tenant}`}>
            <FileDown size={16} /> Client report
          </a>
          {operator && (
            <button className="ops-button" onClick={runChecks} disabled={checking}>
              <ShieldAlert size={16} /> {checking ? "Checking…" : "Run checks"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="ops-error" role="alert">
          <AlertTriangle size={18} aria-hidden /> {error}
        </p>
      )}
      {notice && (
        <p className="ops-success" role="status">
          <CheckCircle2 size={18} aria-hidden /> {notice}
        </p>
      )}

      {sosSites.length > 0 && (
        <div className="cc-sos" role="alert">
          <span className="cc-sos-icon">
            <Siren size={22} />
          </span>
          <div>
            <strong>
              {totals.sos} active SOS {totals.sos === 1 ? "alert" : "alerts"}
            </strong>
            <span>{sosSites.map((s) => s.name).join(" · ")}</span>
          </div>
          <Link
            className="ops-button danger"
            href={`/operations?view=sos&site=${sosSites[0].id}`}
          >
            Respond now <ArrowUpRight size={16} />
          </Link>
        </div>
      )}

      <div className="cc-kpis">
        <Kpi icon={Users} label="On duty now" value={totals.onDuty} loading={!loaded} />
        <Kpi icon={UserCheck} label="Present today" value={totals.present} loading={!loaded} />
        <Kpi
          icon={AlertTriangle}
          label="Open incidents"
          value={totals.incidents}
          tone={totals.incidents ? "warn" : undefined}
          loading={!loaded}
        />
        <Kpi
          icon={Siren}
          label="Active SOS"
          value={totals.sos}
          tone={totals.sos ? "bad" : undefined}
          loading={!loaded}
        />
        <Kpi
          icon={ShieldAlert}
          label="Open risks"
          value={totals.risks}
          tone={totals.risks ? "warn" : undefined}
          loading={!loaded}
        />
        <Kpi
          icon={Camera}
          label="Cameras offline"
          value={totals.cameras}
          tone={totals.cameras ? "warn" : undefined}
          loading={!loaded}
        />
      </div>

      <div className="cc-split">
        <section className="ops-card cc-panel">
          <header className="cc-panel-head">
            <div>
              <h2>Needs attention</h2>
              <p>Sites ranked by urgency across your scope.</p>
            </div>
            <span className={`ops-badge ${attention.length ? "warn" : "good"}`}>
              {attention.length ? `${attention.length} of ${sites.length} sites` : "All clear"}
            </span>
          </header>
          {!loaded ? (
            <div className="cc-attn-list">
              {[0, 1, 2].map((i) => (
                <span key={i} className="ops-skeleton" style={{ height: 62 }} />
              ))}
            </div>
          ) : attention.length ? (
            <ul className="cc-attn-list">
              {attention.slice(0, 6).map((s) => (
                <li key={s.id} className={`cc-attn cc-${tone(s)}`}>
                  <button className="cc-attn-main" onClick={() => setSelected(s.id)}>
                    <strong>{s.name}</strong>
                    <span className="cc-chips">
                      {n(s.sos) > 0 && <em className="bad">{s.sos} SOS</em>}
                      {n(s.open_incidents) > 0 && (
                        <em className="warn">
                          {s.open_incidents} incident{n(s.open_incidents) > 1 ? "s" : ""}
                        </em>
                      )}
                      {n(s.risks) > 0 && (
                        <em className="warn">
                          {s.risks} risk{n(s.risks) > 1 ? "s" : ""}
                        </em>
                      )}
                      {n(s.offline_cameras) > 0 && (
                        <em>
                          {s.offline_cameras} camera{n(s.offline_cameras) > 1 ? "s" : ""} offline
                        </em>
                      )}
                    </span>
                  </button>
                  <Link
                    className="cc-attn-go"
                    href={`/operations?view=${n(s.sos) ? "sos" : n(s.open_incidents) ? "incidents" : "findings"}&site=${s.id}`}
                    aria-label={`Open ${s.name} in site operations`}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                </li>
              ))}
              {attention.length > 6 && (
                <li className="cc-attn-more">+{attention.length - 6} more in the site list below</li>
              )}
            </ul>
          ) : (
            <div className="cc-clear">
              <CheckCircle2 size={34} aria-hidden />
              <strong>Every site is clear</strong>
              <span>No SOS, open incidents, risks or offline cameras right now.</span>
            </div>
          )}
        </section>
        <SiteMap sites={sites} selected={selected} onSelect={setSelected} />
      </div>

      <SiteTable sites={sites} loaded={loaded} selected={selected} />

      {m.role !== "client_user" && <Performance people={people} />}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "warn" | "bad";
  loading?: boolean;
}) {
  return (
    <div className={`cc-kpi ${tone ? "cc-" + tone : ""}`}>
      <span className="cc-kpi-icon">
        <Icon size={18} aria-hidden />
      </span>
      {loading ? <span className="ops-skeleton" style={{ height: 34, width: 60 }} /> : <strong>{value}</strong>}
      <small>{label}</small>
    </div>
  );
}

function SiteMap({
  sites,
  selected,
  onSelect,
}: {
  sites: Row[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const located = sites.filter((s) => s.latitude !== null && s.longitude !== null);
  const active = sites.find((s) => s.id === selected);
  const lat = located.map((s) => Number(s.latitude)),
    lon = located.map((s) => Number(s.longitude));
  const pad = 0.02,
    minLat = Math.min(...lat) - pad,
    maxLat = Math.max(...lat) + pad,
    minLon = Math.min(...lon) - pad,
    maxLon = Math.max(...lon) + pad;
  const color = { bad: "#ff6b6b", warn: "#ffc93c", good: "#3ddc97" } as const;
  return (
    <section className="ops-card cc-panel cc-map">
      <header className="cc-panel-head">
        <div>
          <h2>Site map</h2>
          <p>Positions from each site&apos;s saved coordinates.</p>
        </div>
        <span className="cc-legend">
          <i style={{ background: color.good }} /> Clear
          <i style={{ background: color.warn }} /> Attention
          <i style={{ background: color.bad }} /> SOS
        </span>
      </header>
      {located.length ? (
        <svg
          viewBox="0 0 1000 440"
          role="img"
          aria-label={`Map of ${located.length} sites`}
          className="cc-map-svg"
        >
          <defs>
            <pattern id="cc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(255 255 255 / 6%)" />
            </pattern>
            <radialGradient id="cc-glow">
              <stop offset="0" stopColor="#1d4f8a" />
              <stop offset="1" stopColor="#06214a" />
            </radialGradient>
          </defs>
          <rect width="1000" height="440" fill="url(#cc-glow)" />
          <rect width="1000" height="440" fill="url(#cc-grid)" />
          {located.map((s) => {
            const x = 70 + ((Number(s.longitude) - minLon) / (maxLon - minLon || 1)) * 860,
              y = 50 + ((maxLat - Number(s.latitude)) / (maxLat - minLat || 1)) * 340,
              c = color[tone(s) as keyof typeof color],
              on = s.id === selected;
            return (
              <g
                key={s.id}
                role="button"
                tabIndex={0}
                aria-label={`${s.name}: ${statusLabel(s)}`}
                onClick={() => onSelect(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(s.id);
                }}
                className="cc-pin"
              >
                {tone(s) !== "good" && (
                  <circle cx={x} cy={y} r={9} fill={c} className="cc-pulse" />
                )}
                <circle cx={x} cy={y} r={on ? 20 : 15} fill={c} opacity={0.18} />
                <circle cx={x} cy={y} r={on ? 9 : 7} fill={c} stroke="#06214a" strokeWidth={2} />
                <text x={x + 14} y={y + 4} className={on ? "cc-pin-label on" : "cc-pin-label"}>
                  {s.name}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <div className="ops-empty">Add latitude and longitude to your sites to see them on the map.</div>
      )}
      {active && (
        <footer className="cc-map-foot">
          <div>
            <strong>{active.name}</strong>
            <span>
              {n(active.on_duty)} on duty · {n(active.present_today)} present · {statusLabel(active)}
            </span>
          </div>
          {active.latitude !== null && (
            <a
              className="ops-button secondary"
              href={`https://www.google.com/maps/search/?api=1&query=${active.latitude},${active.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={16} /> Directions
            </a>
          )}
        </footer>
      )}
    </section>
  );
}

function SiteTable({ sites, loaded, selected }: { sites: Row[]; loaded: boolean; selected: string | null }) {
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState<"all" | "attention" | "clear">("all");
  const rows = sites
    .filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((s) => (filter === "all" ? true : filter === "attention" ? severity(s) > 0 : severity(s) === 0))
    .sort((a, b) => severity(b) - severity(a) || a.name.localeCompare(b.name));
  return (
    <section className="cc-section">
      <header className="cc-section-head">
        <div>
          <h2>All sites</h2>
          <p>{sites.length} sites in your scope</p>
        </div>
        <div className="cc-filters">
          <label className="cc-search">
            <Search size={16} aria-hidden />
            <input
              aria-label="Search sites"
              placeholder="Search sites…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <div className="cc-seg" role="radiogroup" aria-label="Filter sites">
            {(["all", "attention", "clear"] as const).map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "attention" ? "Needs attention" : "Clear"}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="ops-table-wrap">
        <table className="ops-table cc-table">
          <thead>
            <tr>
              <th>Site</th>
              <th>Status</th>
              <th className="num">On duty</th>
              <th className="num">Present today</th>
              <th className="num">Incidents</th>
              <th className="num">Risks</th>
              <th className="num">Cameras offline</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {!loaded &&
              [0, 1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={8}>
                    <span className="ops-skeleton" style={{ height: 22 }} />
                  </td>
                </tr>
              ))}
            {rows.map((s) => (
              <tr key={s.id} className={s.id === selected ? "cc-row-on" : undefined}>
                <td>
                  <strong className="cc-site">{s.name}</strong>
                  <small className="cc-sub">{s.site_type}</small>
                </td>
                <td>
                  <span className={`ops-badge ${tone(s)}`}>{statusLabel(s)}</span>
                </td>
                <td className="num">{n(s.on_duty)}</td>
                <td className="num">{n(s.present_today)}</td>
                <td className={"num " + (n(s.open_incidents) ? "cc-warn-text" : "cc-zero")}>{n(s.open_incidents)}</td>
                <td className={"num " + (n(s.risks) ? "cc-warn-text" : "cc-zero")}>{n(s.risks)}</td>
                <td className={"num " + (n(s.offline_cameras) ? "cc-warn-text" : "cc-zero")}>{n(s.offline_cameras)}</td>
                <td className="cc-actions">
                  <Link href={`/operations?view=incidents&site=${s.id}`} className="cc-link">
                    Operations
                  </Link>
                  <Link href="/deployment" className="cc-link" aria-label={`Roster for ${s.name}`}>
                    <CalendarRange size={15} aria-hidden /> Roster
                  </Link>
                </td>
              </tr>
            ))}
            {loaded && !rows.length && (
              <tr>
                <td colSpan={8} className="cc-none">
                  {sites.length ? "No sites match this filter." : "No sites are assigned to your account yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Performance({ people }: { people: Row[] }) {
  const [q, setQ] = useState(""),
    [all, setAll] = useState(false);
  const rows = people
    .filter((p) =>
      (p.full_name + " " + p.employee_code).toLowerCase().includes(q.trim().toLowerCase()),
    )
    .sort((a, b) => (a.attendance_percent ?? 101) - (b.attendance_percent ?? 101));
  const shown = all || q ? rows : rows.slice(0, 8);
  return (
    <section className="cc-section">
      <header className="cc-section-head">
        <div>
          <h2>Workforce this month</h2>
          <p>Lowest attendance first. Attendance counts approved records only.</p>
        </div>
        <div className="cc-filters">
          <label className="cc-search">
            <Search size={16} aria-hidden />
            <input
              aria-label="Search personnel"
              placeholder="Search name or ID…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <Link className="ops-button secondary" href="/analytics">
            Service analytics <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <div className="ops-table-wrap">
        <table className="ops-table cc-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Attendance</th>
              <th className="num">Audit score</th>
              <th className="num">Valid certificates</th>
              <th className="num">Client rating</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const pct = p.attendance_percent;
              return (
                <tr key={p.id}>
                  <td>
                    <strong className="cc-site">{p.full_name}</strong>
                    <small className="cc-sub">{p.employee_code}</small>
                  </td>
                  <td>
                    {pct === null ? (
                      <span className="cc-zero">No approved records</span>
                    ) : (
                      <span className="cc-meter">
                        <span className="cc-track">
                          <span
                            className={pct < 85 ? "bad" : pct < 95 ? "warn" : "good"}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </span>
                        <b>{pct}%</b>
                      </span>
                    )}
                  </td>
                  <td className="num">{p.audit_score ?? <span className="cc-zero">—</span>}</td>
                  <td className="num">{p.valid_certificates}</td>
                  <td className="num">
                    {p.client_rating === null ? <span className="cc-zero">—</span> : `${p.client_rating} / 5`}
                  </td>
                </tr>
              );
            })}
            {!shown.length && (
              <tr>
                <td colSpan={5} className="cc-none">
                  {people.length ? "No personnel match your search." : "No personnel records in your scope yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!q && rows.length > 8 && (
        <button className="cc-more" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show all ${rows.length} personnel`}
        </button>
      )}
    </section>
  );
}
