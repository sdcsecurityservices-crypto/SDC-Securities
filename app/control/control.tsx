"use client";
import { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  ArrowUpRight,
  FileDown,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  OperationsShell,
  useWorkspace,
  request,
} from "@/components/operations/shell";
// Schema-driven forms consume records validated by the resource-specific Zod API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
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
    [error, setError] = useState(""),
    [selected, setSelected] = useState<Row | null>(null),
    [people, setPeople] = useState<Row[]>([]),
    [notice, setNotice] = useState("");
  const operator = ["admin", "operations_manager", "senior_manager"].includes(
    m.role,
  );
  const load = useCallback(async () => {
    try {
      const d = await request(`/api/control/summary?tenant=${tenant}`);
      setData(d);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenant]);
  useEffect(() => {
    // Synchronize the external API/browser state when this scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    if (m.role === "client_user") return;
    const end = new Date().toISOString().slice(0, 10),
      start = end.slice(0, 7) + "-01";
    request(`/api/control/performance?tenant=${tenant}&from=${start}&to=${end}`)
      .then((d) => setPeople(d.rows))
      .catch((e) => setError(e.message));
  }, [tenant, m.role]);
  const sum = (key: string) =>
      data.sites.reduce((n: number, s: Row) => n + Number(s[key] || 0), 0),
    located = data.sites.filter(
      (s: Row) => s.latitude !== null && s.longitude !== null,
    );
  const lat = located.map((s: Row) => Number(s.latitude)),
    lon = located.map((s: Row) => Number(s.longitude)),
    minLat = Math.min(...lat) - 0.03,
    maxLat = Math.max(...lat) + 0.03,
    minLon = Math.min(...lon) - 0.03,
    maxLon = Math.max(...lon) + 0.03;
  return (
    <>
      {error && (
        <p className="ops-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="ops-success" role="status">
          {notice}
        </p>
      )}
      <div className="ops-toolbar">
        <span className="ops-badge good">Refreshes every 30 seconds</span>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            className="ops-button secondary"
            href={`/api/control/report?tenant=${tenant}`}
          >
            <FileDown size={16} />
            Client report
          </a>
          {operator && (
            <button
              className="ops-button"
              onClick={async () => {
                try {
                  const d = await request("/api/control/checks", {
                    tenant_id: tenant,
                  });
                  setNotice(
                    `${d.notifications_created} new alerts created. Existing alerts are not duplicated.`,
                  );
                  await load();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <RefreshCw size={16} />
              Run checks
            </button>
          )}
        </div>
      </div>
      <div className="ops-stats">
        <div className="ops-stat">
          <strong>{data.sites.length}</strong>
          <span>Sites in your scope</span>
        </div>
        <div className="ops-stat">
          <strong>{sum("on_duty")}</strong>
          <span>Personnel rostered now</span>
        </div>
        <div className="ops-stat">
          <strong>{sum("open_incidents")}</strong>
          <span>Open incidents</span>
        </div>
        <div className="ops-stat">
          <strong style={{ color: sum("sos") ? "#a32525" : undefined }}>
            {sum("sos")}
          </strong>
          <span>Active SOS alerts</span>
        </div>
      </div>
      <div
        className="ops-card"
        style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}
      >
        <div
          style={{
            padding: 22,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0 }}>Site coverage map</h2>
          <small>Select a location to inspect its status</small>
        </div>
        {located.length ? (
          <svg
            viewBox="0 0 1000 350"
            style={{ width: "100%", background: "#102c4b", display: "block" }}
            role="img"
            aria-label="Geographical site positions based on saved latitude and longitude"
          >
            <defs>
              <pattern
                id="site-grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="#294666"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="1000" height="350" fill="url(#site-grid)" />
            <text x="22" y="30" fill="#b8cce0" fontSize="12">
              GEOGRAPHIC OVERVIEW · NORTH ↑
            </text>
            {located.map((s: Row, i: number) => {
              const x =
                  80 +
                  ((Number(s.longitude) - minLon) / (maxLon - minLon)) * 820,
                y =
                  70 +
                  ((maxLat - Number(s.latitude)) / (maxLat - minLat)) * 210;
              return (
                <g
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  aria-label={s.name}
                  onClick={() => setSelected(s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelected(s);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={16}
                    fill={
                      s.sos
                        ? "#ef6464"
                        : s.open_incidents
                          ? "#f2c45b"
                          : "#58bd9c"
                    }
                    opacity=".25"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={7}
                    fill={
                      s.sos
                        ? "#ef6464"
                        : s.open_incidents
                          ? "#f2c45b"
                          : "#58bd9c"
                    }
                  />
                  <text
                    x={x + 12}
                    y={y + (i % 2 ? 18 : -13)}
                    fill="white"
                    fontSize="11"
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="ops-empty">
            Add GPS coordinates to your sites to populate the map.
          </div>
        )}
        {selected && (
          <div
            style={{
              padding: 22,
              display: "flex",
              justifyContent: "space-between",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong>{selected.name}</strong>
              <p>
                {selected.on_duty} on duty · {selected.open_incidents} incidents
                · {selected.risks} risks
              </p>
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=16/${selected.latitude}/${selected.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ops-button secondary"
            >
              <MapPin size={16} />
              Open street map
            </a>
          </div>
        )}
      </div>
      <div className="ops-grid">
        {data.sites.map((s: Row) => (
          <article className="ops-card" key={s.id}>
            <span
              className={`ops-badge ${s.sos ? "bad" : s.open_incidents ? "warn" : "good"}`}
            >
              {s.sos
                ? "SOS active"
                : s.open_incidents
                  ? "Attention required"
                  : "No open incidents"}
            </span>
            <h3>{s.name}</h3>
            <small>{s.site_type}</small>
            <p>
              {s.on_duty} rostered now · {s.present_today} present today
              <br />
              {s.risks} open risks · {s.offline_cameras} offline cameras
            </p>
            <footer>
              <a
                className="ops-button secondary"
                href={`/operations?view=incidents&site=${s.id}`}
              >
                Site operations <ArrowUpRight size={15} />
              </a>
              <a className="ops-button secondary" href="/deployment">
                Roster
              </a>
            </footer>
          </article>
        ))}
      </div>
      {m.role !== "client_user" && (
        <div style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 24, marginBottom: 18 }}>
            Workforce performance · this month
          </h2>
          <p style={{ marginBottom: 18, color: "#52677f" }}>
            Measured attendance, site audits, training and client feedback.
            Missing evidence is shown as unavailable.
          </p>
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Attendance</th>
                  <th>Audit score</th>
                  <th>Valid certificates</th>
                  <th>Client rating</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.full_name}</strong>
                      <br />
                      {p.employee_code}
                    </td>
                    <td>
                      {p.attendance_percent === null
                        ? "—"
                        : p.attendance_percent + "%"}
                    </td>
                    <td>{p.audit_score ?? "—"}</td>
                    <td>{p.valid_certificates}</td>
                    <td>
                      {p.client_rating === null
                        ? "—"
                        : p.client_rating + " / 5"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <small>Showing up to 100 personnel within your access.</small>
        </div>
      )}
    </>
  );
}
