"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  OperationsShell,
  request,
  useWorkspace,
  dateLabel,
} from "@/components/operations/shell";
type Row = Record<string, any>;
const money = (paise: number | null) =>
  paise == null
    ? "—"
    : `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export default function ClientPortal() {
  return (
    <OperationsShell
      title="Client portal"
      subtitle="Your sites, service evidence and actions in one view."
    >
      <Portal />
    </OperationsShell>
  );
}
function Portal() {
  const member = useWorkspace(),
    [data, setData] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await request(`/api/client-portal?tenant=${member.tenant_id}`));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [member.tenant_id]);
  const action = async (body: Row) => {
    try {
      await request("/api/client-portal", { tenant_id: member.tenant_id, ...body });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [load]);
  if (loading && !data) return <p role="status">Loading your service view…</p>;
  if (error)
    return (
      <div className="ops-error" role="alert">
        {error}{" "}
        <button className="ops-button secondary" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  const analytics = data?.analytics?.sites || [],
    openRisks = data?.findings?.length || 0,
    openIncidents = data?.incidents?.length || 0;
  const onDuty = (data?.summary?.sites || []).reduce(
    (n: number, s: Row) => n + Number(s.on_duty || 0),
    0,
  );
  return (
    <>
      <div className="ops-toolbar">
        <span className="ops-badge good">
          <ShieldCheck size={14} /> Scoped to your contracted sites
        </span>
        <button className="ops-button secondary" onClick={() => void load()}>
          Refresh view
        </button>
      </div>
      <div
        className="ops-grid"
        style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}
      >
        <Metric
          icon={<CalendarCheck />}
          value={String(onDuty)}
          label="People on duty now"
        />
        <Metric
          icon={<AlertTriangle />}
          value={String(openRisks)}
          label="Open risk findings"
          tone={openRisks ? "warn" : "good"}
        />
        <Metric
          icon={<ShieldCheck />}
          value={String(openIncidents)}
          label="Open incidents"
          tone={openIncidents ? "warn" : "good"}
        />
        <Metric
          icon={<FileText />}
          value={String(data?.invoices?.length || 0)}
          label="Issued invoices"
        />
      </div>
      <div className="ops-grid" style={{ marginTop: 24 }}>
        <section className="ops-card">
          <h2>
            <Building2 size={20} /> Site service overview
          </h2>
          {analytics.map((s: Row) => (
            <article
              key={s.id}
              style={{ padding: "16px 0", borderBottom: "1px solid #D8E1EA" }}
            >
              <strong>{s.name}</strong>
              <p>
                {s.rostered} published duties · {s.present} approved attendance
                records · security score {s.security_score}/100
              </p>
              <span
                className={`ops-badge ${s.rostered >= s.required ? "good" : "warn"}`}
              >
                {s.required
                  ? `${Math.round((s.rostered / s.required) * 100)}% coverage`
                  : "No staffing requirement"}
              </span>
            </article>
          ))}
          {!analytics.length && (
            <p>No site data is available in your current scope.</p>
          )}
        </section>
        <section className="ops-card">
          <h2>
            <AlertTriangle size={20} /> Risk actions
          </h2>
          {(data?.findings || []).slice(0, 6).map((f: Row) => (
            <article
              key={f.id}
              style={{ padding: "14px 0", borderBottom: "1px solid #D8E1EA" }}
            >
              <strong>{f.title}</strong>
              <p>
                <span className="ops-badge warn">{f.severity}</span> {f.status}{" "}
                · target {dateLabel(f.target_date)}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {f.status === "flagged" && (
                  <button
                    className="ops-button secondary"
                    onClick={() => {
                      const signoff = window.prompt("Named client sign-off");
                      const comment = window.prompt("Comment for the risk register");
                      if (signoff && comment)
                        void action({ action: "risk_transition", id: f.id, row_version: f.row_version, status: "acknowledged", signoff, comment });
                    }}
                  >
                    Acknowledge
                  </button>
                )}
                {!["risk_accepted", "closed", "verified"].includes(f.status) && (
                  <button
                    className="ops-button secondary"
                    onClick={() => {
                      const signoff = window.prompt("Named client sign-off");
                      const comment = window.prompt("Why is this risk accepted?");
                      if (signoff && comment)
                        void action({ action: "risk_transition", id: f.id, row_version: f.row_version, status: "risk_accepted", signoff, comment });
                    }}
                  >
                    Accept risk
                  </button>
                )}
              </div>
            </article>
          ))}
          {!openRisks && <p>No open weaknesses require your attention.</p>}
          <a className="ops-button secondary" href="/operations?view=findings">
            Review risk register
          </a>
        </section>
      </div>
      <div className="ops-grid" style={{ marginTop: 24 }}>
        <section className="ops-card">
          <h2>
            <ShieldCheck size={20} /> Recent incidents
          </h2>
          {(data?.incidents || []).slice(0, 6).map((i: Row) => (
            <article
              key={i.id}
              style={{ padding: "14px 0", borderBottom: "1px solid #D8E1EA" }}
            >
              <strong>{i.title}</strong>
              <p>
                <span className="ops-badge bad">{i.severity}</span> {i.status} ·{" "}
                {dateLabel(i.occurred_at)}
              </p>
            </article>
          ))}
          {!openIncidents && <p>No open incidents.</p>}
          <a className="ops-button secondary" href="/operations?view=incidents">
            Open incident register
          </a>
        </section>
        <section className="ops-card">
          <h2>
            <FileText size={20} /> Issued invoices
          </h2>
          {(data?.invoices || []).slice(0, 6).map((i: Row) => (
            <article
              key={i.id}
              style={{ padding: "14px 0", borderBottom: "1px solid #D8E1EA" }}
            >
              <strong>{i.number}</strong>
              <p>
                {i.month} · {money(i.total_paise)} · balance{" "}
                {money(i.balance_paise)}
              </p>
            </article>
          ))}
          {!data?.invoices?.length && (
            <p>No issued invoices in this workspace.</p>
          )}
          <a className="ops-button secondary" href="/business">
            Open finance view
          </a>
        </section>
      </div>
      <section className="ops-card" style={{ marginTop: 24 }}>
        <h2>Latest workspace notifications</h2>
        {(data?.notifications || []).slice(0, 5).map((n: Row) => (
          <p key={n.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ flex: 1 }}><strong>{n.title}</strong> · {n.body}</span>
            {!n.read_at && <button className="ops-button secondary" onClick={() => void action({ action: "notification_read", id: n.id })}>Mark read</button>}
          </p>
        ))}
        {!data?.notifications?.length && <p>You are up to date.</p>}
      </section>
    </>
  );
}
function Metric({
  icon,
  value,
  label,
  tone,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  tone?: "good" | "warn";
}) {
  return (
    <article className="ops-card">
      <span className="ops-icon">{icon}</span>
      <strong style={{ display: "block", fontSize: 32, marginTop: 14 }}>
        {value}
      </strong>
      <span>{label}</span>
      {tone && (
        <span className={`ops-badge ${tone}`} style={{ marginTop: 10 }}>
          {tone === "good" ? "On track" : "Needs attention"}
        </span>
      )}
    </article>
  );
}
