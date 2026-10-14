"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, FileText, ImageIcon, MessageCircle, Phone } from "lucide-react";
import { OperationsShell, useWorkspace, request, dateLabel } from "@/components/operations/shell";
import { statuses } from "@/lib/careers/options";
import { CardChoice, Crumbs, age, branchNames, label, langNames, size, statusHelp, statusLabels, statusTone, when } from "../../shared";

// Response rows are validated by the recruitment API and row level security.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const waLink = (phone: string, name: string, ref: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${name}, this is SDC Security & Facility Services about your job application ${ref}.`)}`;

export default function Application({ id }: { id: string }) {
  return (
    <OperationsShell title="Application" subtitle="Everything the applicant sent, their documents, and what HR has done so far.">
      <Detail id={id} />
    </OperationsShell>
  );
}

function Detail({ id }: { id: string }) {
  const tenant = useWorkspace().tenant_id;
  const [d, setD] = useState<Row | null>(null);
  const [nav, setNav] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [qs, setQs] = useState("");

  useEffect(() => {
    // The list's filters travel in the address so previous/next stay in that list.
    const sp = new URLSearchParams(window.location.search);
    sp.delete("tenant");
    sp.delete("id");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQs(sp.toString());
  }, []);

  const load = useCallback(async () => {
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
    // Load the application whenever the id or workspace changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setD(null);
    setNote("");
    setNotice("");
    void load();
  }, [load]);
  useEffect(() => {
    let live = true;
    request(`/api/recruitment/neighbours?tenant=${tenant}&id=${id}${qs ? "&" + qs : ""}`)
      .then((r) => live && setNav(r))
      .catch(() => live && setNav(null));
    return () => {
      live = false;
    };
  }, [tenant, id, qs]);

  const save = async () => {
    if (!d) return;
    setBusy(true);
    setError("");
    try {
      await request("/api/recruitment/status", { tenant_id: tenant, id: d.record.id, status, note });
      setNote("");
      setNotice(status === d.record.status ? "Note added to the history." : `Moved to ${statusLabels[status]}.`);
      await load();
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

  const back = "/recruitment" + (qs ? "?" + qs : "");
  const a = d?.record;
  const sections: [string, [string, string][]][] = a
    ? [
        [
          "Contact",
          [
            ["Phone", a.phone],
            ["WhatsApp", a.whatsapp_same ? "Same number" : a.whatsapp_phone || "—"],
            ["Lives in", [a.home_area, a.home_district].filter(Boolean).join(", ")],
            ["Languages", (a.languages || []).map((l: string) => label("l_", l)).join(", ") || "—"],
          ],
        ],
        [
          "About",
          [
            ["Gender", label("g_", a.gender)],
            ["Date of birth", `${dateLabel(a.date_of_birth)} (${age(a.date_of_birth)} years)`],
            ["Education", label("e_", a.education)],
            ["Heard about SDC", a.heard_from ? label("src_", a.heard_from) : "—"],
          ],
        ],
        [
          "The job",
          [
            ["Role", label("r_", a.role)],
            ["Opening", d?.opening ? `${d.opening.title_en}${d.opening.area ? " · " + d.opening.area : ""}` : "Any suitable job"],
            ["Preferred work area", a.preferred_work_area || "—"],
            ["Can join from", a.available_from ? dateLabel(a.available_from) : "Immediately"],
          ],
        ],
        [
          "Experience & service",
          [
            ["Experience", `${a.experience_years} years`],
            ["Last employer", a.last_employer || "—"],
            ["PSARA trained", a.psara_trained ? "Yes" : "No"],
            ["Ex-serviceman", a.ex_serviceman ? ["Yes", branchNames[a.service_branch], a.rank, a.service_years != null ? a.service_years + " years" : ""].filter(Boolean).join(" · ") : "No"],
          ],
        ],
        [
          "Consent & retention",
          [
            ["Form language", langNames[a.applicant_language]],
            ["Consent", `${when(a.consent_at)} · version ${a.consent_version}`],
            ["Kept until", a.status === "joined" ? "Joined: kept with the employee record" : dateLabel(a.retention_until)],
          ],
        ],
      ]
    : [];

  return (
    <div className="recruit-page">
      <div className="recruit-page-top">
        <Crumbs items={[["Recruitment", back], ["Applications", back], [a ? a.full_name : "Application", null]]} />
        <div className="recruit-stepper">
          {nav && nav.total > 0 && (
            <span>
              {nav.index} of {nav.total}
            </span>
          )}
          {nav?.previous ? (
            <Link className="ops-button secondary" href={`/recruitment/applications/${nav.previous.id}${qs ? "?" + qs : ""}`} title={nav.previous.full_name}>
              <ArrowLeft size={16} /> Previous
            </Link>
          ) : (
            <button className="ops-button secondary" disabled>
              <ArrowLeft size={16} /> Previous
            </button>
          )}
          {nav?.next ? (
            <Link className="ops-button secondary" href={`/recruitment/applications/${nav.next.id}${qs ? "?" + qs : ""}`} title={nav.next.full_name}>
              Next <ArrowRight size={16} />
            </Link>
          ) : (
            <button className="ops-button secondary" disabled>
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="ops-error" role="alert">
          {error}
        </p>
      )}
      {!a ? (
        !error && <span className="ops-skeleton" style={{ height: 320, display: "block" }} />
      ) : (
        <>
          <header className="recruit-person">
            <div>
              <h2>{a.full_name}</h2>
              <p>
                {label("r_", a.role)} · {a.reference_code} · received {when(a.created_at)}
              </p>
              <p className="recruit-list-badges">
                <span className={"ops-badge " + statusTone(a.status)}>{statusLabels[a.status]}</span>
                {a.ex_serviceman && <span className="ops-badge good">Ex-serviceman</span>}
                {a.duplicate_of && <span className="ops-badge warn">Applied before</span>}
              </p>
            </div>
            <div className="recruit-contact">
              <a className="ops-button" href={"tel:" + a.phone}>
                <Phone size={16} /> Call {a.phone}
              </a>
              <a className="ops-button accent" href={waLink(a.whatsapp_phone || a.phone, a.full_name.split(" ")[0], a.reference_code)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </header>

          {d!.related.length > 0 && (
            <div className="ops-note recruit-dup">
              <strong>Same phone number applied {d!.related.length === 1 ? "once" : d!.related.length + " times"} before.</strong>
              {d!.related.map((r: Row) => (
                <Link key={r.id} className="recruit-link" href={`/recruitment/applications/${r.id}`}>
                  {r.reference_code} · {label("r_", r.role)} · {statusLabels[r.status]} · {dateLabel(r.created_at)}
                </Link>
              ))}
            </div>
          )}

          <div className="recruit-columns">
            <div className="recruit-col">
              {sections.map(([title, facts]) => (
                <section key={title} className="ops-card recruit-section">
                  <h3>{title}</h3>
                  <dl className="recruit-facts">
                    {facts.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
            <div className="recruit-col">
              <section className="ops-card recruit-section">
                <h3>Documents</h3>
                {d!.files.length ? (
                  <ul className="recruit-files">
                    {d!.files.map((f: Row) => (
                      <li key={f.id}>
                        {f.mime === "application/pdf" ? <FileText size={18} aria-hidden /> : <ImageIcon size={18} aria-hidden />}
                        <span>
                          <strong>{label("k_", f.kind)}</strong> {f.file_name}
                          <small>
                            {f.mime === "application/pdf" ? "PDF" : "Image"} · {size(f.size_bytes)}
                          </small>
                        </span>
                        <button className="ops-button secondary" onClick={() => void openFile(f.id)}>
                          <Eye size={15} /> Preview
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="recruit-muted">No documents attached. The applicant can bring them to the interview.</p>
                )}
                <p className="recruit-muted">Previews open in a new tab for two minutes, and each one is recorded in the history.</p>
              </section>

              <section className="ops-card recruit-section">
                <h3>Move to a stage</h3>
                <CardChoice
                  name="stage"
                  legend="Choose the stage"
                  columns="wide"
                  value={status}
                  onChange={(v) => {
                    setStatus(v);
                    setNotice("");
                  }}
                  options={statuses.map((s) => ({ value: s, title: statusLabels[s] + (s === a.status ? " (current)" : ""), hint: statusHelp[s] }))}
                />
                <label className="recruit-note">
                  <span>Note (optional)</span>
                  <textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called; interview on Monday 10 am at the office" />
                </label>
                {notice && (
                  <p className="ops-success" role="status">
                    {notice}
                  </p>
                )}
                <button className="ops-button" disabled={busy || (status === a.status && !note.trim())} onClick={() => void save()}>
                  <Check size={16} /> {status === a.status ? "Add note" : `Move to ${statusLabels[status]}`}
                </button>
              </section>

              <section className="ops-card recruit-section">
                <h3>History</h3>
                <ol className="recruit-history">
                  {d!.events.map((e: Row) => (
                    <li key={e.id}>
                      <strong>
                        {e.action === "submitted"
                          ? "Applied on the careers page"
                          : e.action === "status_changed"
                            ? `${statusLabels[e.from_status] || e.from_status} → ${statusLabels[e.to_status] || e.to_status}`
                            : e.action === "file_viewed"
                              ? "Document previewed"
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
              </section>
            </div>
          </div>
          <div className="recruit-page-foot">
            <Link className="ops-button secondary" href={back}>
              <ArrowLeft size={16} /> Back to applications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
