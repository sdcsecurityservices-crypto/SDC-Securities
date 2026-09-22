"use client";
import { useEffect, useState } from "react";
import {
  OperationsShell,
  useWorkspace,
  request,
  dateLabel,
} from "@/components/operations/shell";
type Point = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  scans: number;
};
type Site = {
  id: string;
  name: string;
  required: number;
  rostered: number;
  present: number;
  approved_days: number;
  incidents: number;
  response_minutes: number | null;
  security_score: number;
  audit_score: number | null;
  score_history: { recorded_at: string; score: number }[];
  patrol_checkpoints: Point[];
};
export default function Analytics() {
  return (
    <OperationsShell
      title="Service analytics"
      subtitle="Measured service delivery. Clear evidence for every client."
    >
      <Reports />
    </OperationsShell>
  );
}
function Reports() {
  const m = useWorkspace(),
    [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)),
    [rows, setRows] = useState<Site[]>([]),
    [error, setError] = useState(""),
    [site, setSite] = useState("");
  const from = month + "-01",
    to = new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5, 7)),
      0,
      12,
    ).toLocaleDateString("en-CA");
  const url = `/api/analytics?tenant=${m.tenant_id}&from=${from}&to=${to}`;
  useEffect(() => {
    let active = true;
    request(url)
      .then((d) => {
        if (active) {
          setRows(d.sites);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [url]);
  return (
    <>
      <div className="ops-toolbar">
        <label>
          Reporting month
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <label>
          Site
          <select value={site} onChange={(e) => setSite(e.target.value)}>
            <option value="">All accessible sites</option>
            {rows.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <a className="ops-button" href={url + "&site=" + site + "&format=pdf"}>
          Download client report
        </a>
      </div>
      {error && (
        <p role="alert" className="ops-error">
          {error}
        </p>
      )}
      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Site</th>
              <th>Required / published</th>
              <th>Fill rate</th>
              <th>Attendance</th>
              <th>Incidents / response</th>
              <th>Security / audit</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((s) => !site || s.id === site)
              .map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>
                    {s.required} / {s.rostered}
                  </td>
                  <td>
                    <span
                      className={`ops-badge ${s.rostered >= s.required ? "good" : "warn"}`}
                    >
                      {s.required
                        ? Math.round((s.rostered / s.required) * 100) + "%"
                        : "No requirement"}
                    </span>
                  </td>
                  <td>
                    {s.approved_days
                      ? Math.round((s.present / s.approved_days) * 100) + "%"
                      : "Awaiting approved muster"}
                  </td>
                  <td>
                    {s.incidents} incidents
                    <br />
                    <small>
                      {s.response_minutes === null
                        ? "No acknowledged incidents"
                        : s.response_minutes + " min average"}
                    </small>
                  </td>
                  <td>
                    {s.security_score}/100
                    <br />
                    <small>Audit {s.audit_score ?? "not assessed"}</small>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="ops-note">
        Fill rate uses published duties. Attendance uses approved present/absent
        days. Scores reflect recorded findings; they are not a guarantee of site
        safety.
      </p>
      {rows
        .filter((s) => !site || s.id === site)
        .map((s) => (
          <section key={s.id} className="ops-card" style={{ marginTop: 24 }}>
            <h2>{s.name}</h2>
            <div className="ops-grid">
              <div>
                <h3>Security score trend</h3>
                {s.score_history.length > 1 ? (
                  <>
                    <svg
                      viewBox="0 0 500 150"
                      role="img"
                      aria-label={`Security score history for ${s.name}`}
                      style={{ width: "100%", maxHeight: 180 }}
                    >
                      <path d="M10 10V130H490" fill="none" stroke="#94a3b8" />
                      <polyline
                        points={[...s.score_history]
                          .reverse()
                          .map(
                            (p, i) =>
                              `${10 + (i * 480) / (s.score_history.length - 1)},${130 - p.score * 1.2}`,
                          )
                          .join(" ")}
                        stroke="#0c5c91"
                        strokeWidth="3"
                        fill="none"
                      />
                    </svg>
                    <small>
                      {dateLabel(s.score_history.at(-1)!.recorded_at)} →{" "}
                      {dateLabel(s.score_history[0].recorded_at)}
                    </small>
                  </>
                ) : (
                  <p>
                    History will appear as findings are recorded and resolved.
                  </p>
                )}
              </div>
              <div>
                <h3>Patrol checkpoint activity</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {s.patrol_checkpoints.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: 18,
                        borderRadius: 8,
                        background: c.scans ? "#d6ece0" : "#fce8cc",
                        border: "1px solid #b5c4ce",
                        minWidth: 130,
                      }}
                    >
                      <strong>{c.scans} scans</strong>
                      <br />
                      {c.title}
                      <br />
                      <small>
                        {c.latitude}, {c.longitude}
                      </small>
                    </div>
                  ))}
                </div>
                {!s.patrol_checkpoints.length && (
                  <p>No checkpoints configured.</p>
                )}
              </div>
            </div>
          </section>
        ))}
    </>
  );
}
