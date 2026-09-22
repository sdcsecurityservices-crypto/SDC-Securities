"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  BookOpen,
  Award,
  Download,
  Search,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  OperationsShell,
  useWorkspace,
  request,
  dateLabel,
} from "@/components/operations/shell";
import {
  trainingSchemas,
  type TrainingResource,
} from "@/lib/training/validation";
// Schema-driven forms consume records validated by the resource-specific Zod API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  source?: string;
  wide?: boolean;
};
const fields: Record<TrainingResource, Field[]> = {
  courses: [
    { key: "code", label: "Course code" },
    { key: "title", label: "Course title" },
    {
      key: "category",
      label: "Track",
      options: ["induction", "specialist", "refresher", "leadership"],
    },
    {
      key: "mode",
      label: "Delivery",
      options: ["classroom", "field", "e_learning", "on_site"],
    },
    {
      key: "language",
      label: "Language",
      options: ["English", "Kannada", "Hindi"],
    },
    {
      key: "mandatory_for",
      label: "Mandatory categories (comma separated)",
      type: "array",
    },
    { key: "duration_hours", label: "Classroom hours", type: "number" },
    { key: "field_hours", label: "Field hours", type: "number" },
    { key: "working_days", label: "Working days", type: "number" },
    {
      key: "condensed_hours",
      label: "Condensed-track total hours",
      type: "number",
    },
    {
      key: "validity_months",
      label: "Validity months (0 = no expiry)",
      type: "number",
    },
    { key: "pass_mark", label: "Theory pass mark %", type: "number" },
    { key: "practical_pass", label: "Practical pass mark %", type: "number" },
    { key: "question_count", label: "Questions per test", type: "number" },
    { key: "max_attempts", label: "Maximum attempts", type: "number" },
    {
      key: "prerequisites",
      label: "Prerequisite course IDs (comma separated)",
      type: "array",
      wide: true,
    },
    {
      key: "syllabus",
      label: "Syllabus and practical rubric",
      type: "textarea",
      wide: true,
    },
    {
      key: "reviewed",
      label: "Content and applicable training policy reviewed",
      type: "checkbox",
      wide: true,
    },
  ],
  sessions: [
    { key: "title", label: "Batch / session name" },
    { key: "course_id", label: "Course", source: "courses" },
    { key: "trainer_id", label: "Trainer", source: "trainers" },
    { key: "venue", label: "Venue" },
    { key: "starts_at", label: "Start (IST)", type: "datetime-local" },
    { key: "ends_at", label: "End (IST)", type: "datetime-local" },
    { key: "capacity", label: "Capacity", type: "number" },
    {
      key: "status",
      label: "Status",
      options: ["scheduled", "completed", "cancelled"],
    },
  ],
  enrollments: [
    { key: "employee_id", label: "Employee", source: "people" },
    { key: "session_id", label: "Session", source: "sessions" },
    {
      key: "attendance",
      label: "Attendance",
      options: ["pending", "present", "absent"],
    },
    { key: "hours_completed", label: "Hours completed", type: "number" },
    { key: "practical_score", label: "Practical score %", type: "number" },
    {
      key: "practical_notes",
      label: "Practical evaluation / evidence notes",
      type: "textarea",
      wide: true,
    },
  ],
  questions: [
    { key: "course_id", label: "Course", source: "courses" },
    { key: "prompt", label: "Question", type: "textarea", wide: true },
    {
      key: "options",
      label: "Answer options (one per line)",
      type: "lines",
      wide: true,
    },
    {
      key: "correct_index",
      label: "Correct option (0 = first, 1 = second…)",
      type: "number",
    },
    {
      key: "explanation",
      label: "Trainer explanation",
      type: "textarea",
      wide: true,
    },
  ],
  requirements: [
    { key: "post_id", label: "Post", source: "posts" },
    { key: "course_id", label: "Required certification", source: "courses" },
    {
      key: "enforcement",
      label: "Deployment policy",
      options: ["block", "warn"],
    },
  ],
};
const defaults: Record<TrainingResource, Row> = {
  courses: {
    code: "",
    title: "",
    category: "induction",
    mode: "classroom",
    language: "English",
    mandatory_for: ["trainee"],
    duration_hours: 8,
    field_hours: 0,
    working_days: 1,
    condensed_hours: 0,
    validity_months: 12,
    pass_mark: 70,
    practical_pass: 60,
    question_count: 5,
    max_attempts: 3,
    prerequisites: [],
    syllabus: "",
    reviewed: false,
  },
  sessions: {
    title: "",
    course_id: "",
    trainer_id: "",
    venue: "",
    starts_at: "",
    ends_at: "",
    capacity: 30,
    status: "scheduled",
  },
  enrollments: {
    employee_id: "",
    session_id: "",
    attendance: "pending",
    hours_completed: 0,
    practical_score: null,
    practical_notes: "",
  },
  questions: {
    course_id: "",
    prompt: "",
    options: ["", ""],
    correct_index: 0,
    explanation: "",
  },
  requirements: { post_id: "", course_id: "", enforcement: "block" },
};
export default function Training() {
  return (
    <OperationsShell
      title="Training academy"
      subtitle="Build capability. Verify readiness. Put qualified people on every post."
    >
      <Academy />
    </OperationsShell>
  );
}
function Academy() {
  const m = useWorkspace(),
    tenant = m.tenant_id,
    trainer = ["admin", "hr_payroll", "trainer"].includes(m.role),
    operator = ["admin", "operations_manager", "senior_manager"].includes(
      m.role,
    );
  const [tab, setTab] = useState("courses"),
    [matrixSite, setMatrixSite] = useState(""),
    [matrixClient, setMatrixClient] = useState(""),
    [matrixGrade, setMatrixGrade] = useState(""),
    [referenceTime] = useState(() => Date.now()),
    [rows, setRows] = useState<Row[]>([]),
    [lookups, setLookups] = useState<Record<string, Row[]>>({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [offset, setOffset] = useState(0),
    [total, setTotal] = useState(0),
    [editing, setEditing] = useState<Row | null>(null),
    [form, setForm] = useState<Row>({}),
    [test, setTest] = useState<Row | null>(null),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [matrix, setMatrix] = useState<Row[]>([]),
    [peopleQuery, setPeopleQuery] = useState("");
  const label = (source: string, id: string) =>
    lookups[source]?.find((x) => x.id === id)?.title ||
    lookups[source]?.find((x) => x.id === id)?.full_name ||
    lookups[source]?.find((x) => x.id === id)?.name ||
    lookups[source]?.find((x) => x.id === id)?.display_name ||
    id;
  const load = useCallback(async () => {
    setError("");
    try {
      const d = await request(
        `/api/training/${tab}?tenant=${tenant}&offset=${offset}&q=${encodeURIComponent(search)}&site=${matrixSite}&client=${matrixClient}&grade=${matrixGrade}`,
      );
      setRows(d.rows || []);
      setTotal(d.total ?? d.rows.length);
      if (tab === "matrix") setMatrix(d.rows);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tenant, tab, offset, search, matrixSite, matrixClient, matrixGrade]);
  useEffect(() => {
    // Synchronize the external API/browser state when this scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const names = [
          "courses",
          "sessions",
          "people",
          ...(trainer ? ["trainers"] : []),
          ...(operator ? ["posts"] : []),
          "sites",
          "clients",
          "grades",
        ];
        const entries = await Promise.all(
          names.map(async (n) => [
            n,
            (
              await request(
                `/api/${["posts", "sites", "clients", "grades"].includes(n) ? "foundation" : "training"}/${n}?tenant=${tenant}&limit=100`,
              )
            ).rows,
          ]),
        );
        if (active) setLookups(Object.fromEntries(entries));
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [tenant, trainer, operator, notice]);
  const open = (row?: Row) => {
    const r = tab as TrainingResource;
    setEditing(row || {});
    setForm({ ...defaults[r], ...row });
    setError("");
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const r = tab as TrainingResource,
        data = Object.fromEntries(fields[r].map((f) => [f.key, form[f.key]]));
      const parsed = trainingSchemas[r].parse(data);
      await request("/api/training/" + r, {
        tenant_id: tenant,
        id: editing?.id,
        row_version: editing?.row_version,
        data: parsed,
      });
      setEditing(null);
      setNotice("Record saved.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const start = async (row: Row) => {
    setBusy(true);
    setError("");
    try {
      const d = await request("/api/training/start", {
        tenant_id: tenant,
        enrollment_id: row.id,
      });
      setTest(d.record);
      setAnswers({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    setBusy(true);
    try {
      const d = await request("/api/training/submit", {
        tenant_id: tenant,
        attempt_id: test?.id,
        answers,
      });
      setTest(null);
      setNotice(
        `Assessment scored ${d.record.score}%. ${d.record.passed ? "Passed — certificate issued." : "Further training required before your next attempt."}`,
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const tabs = [
    ["courses", "Course catalogue"],
    ["sessions", "Batches & sessions"],
    ["enrollments", "Attendance & assessments"],
    ["awards", "Certificates"],
    ["matrix", "Readiness matrix"],
    ...(trainer ? [["questions", "Question bank"]] : []),
    ...(operator ? [["requirements", "Post requirements"]] : []),
  ];
  const editable = tab === "requirements" ? operator : trainer && tab in fields;
  return (
    <>
      <div className="ops-tabs" role="tablist" aria-label="Training views">
        {tabs.map(([k, l]) => (
          <button
            role="tab"
            aria-selected={tab === k}
            key={k}
            onClick={() => {
              setTab(k);
              setOffset(0);
              setSearch("");
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {notice && (
        <div role="status" className="ops-success">
          {notice}
        </div>
      )}
      {error && !editing && !test && (
        <div role="alert" className="ops-error">
          {error}
        </div>
      )}
      <div className="ops-toolbar">
        <div>
          <strong>{tabs.find((t) => t[0] === tab)?.[1]}</strong>
          <p style={{ fontSize: 13, color: "#52677f", marginTop: 6 }}>
            {tab === "matrix"
              ? "Mandatory certification readiness for the current date"
              : `${total} records · scoped to your access`}
          </p>
        </div>
        {["courses", "matrix"].includes(tab) && (
          <label>
            <Search size={16} style={{ display: "inline", marginRight: 8 }} />
            <input
              aria-label="Search"
              placeholder="Search…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
            />
          </label>
        )}
        {editable && (
          <button className="ops-button" onClick={() => open()}>
            <Plus size={17} />
            Add{" "}
            {tab === "courses"
              ? "course"
              : tab === "sessions"
                ? "session"
                : tab === "questions"
                  ? "question"
                  : tab === "enrollments"
                    ? "enrollment"
                    : "requirement"}
          </button>
        )}
      </div>
      {tab === "courses" ? (
        <div className="ops-grid">
          {rows.map((c) => (
            <article className="ops-card" key={c.id}>
              <span className="ops-badge">{c.category}</span>
              <BookOpen
                size={22}
                style={{ float: "right", color: "#8a7200" }}
              />
              <h2>{c.title}</h2>
              <small>
                {c.duration_hours + c.field_hours} hours · {c.language} ·{" "}
                {c.mode.replaceAll("_", " ")}
              </small>
              <p>
                {c.syllabus ||
                  "Add syllabus and practical evaluation criteria before review."}
              </p>
              <div>
                <span className={`ops-badge ${c.reviewed ? "good" : "warn"}`}>
                  {c.reviewed ? "Reviewed" : "Review required"}
                </span>
              </div>
              <footer>
                <small>
                  Pass {c.pass_mark}% ·{" "}
                  {c.validity_months
                    ? `${c.validity_months} months validity`
                    : "No expiry"}
                </small>
                {trainer && (
                  <button
                    className="ops-button secondary"
                    onClick={() => open(c)}
                  >
                    Manage course <ArrowRight size={15} />
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      ) : tab === "matrix" ? (
        <>
          <div className="ops-toolbar">
            {[
              ["sites", matrixSite, setMatrixSite],
              ["clients", matrixClient, setMatrixClient],
              ["grades", matrixGrade, setMatrixGrade],
            ].map(([key, value, setter]) => (
              <label key={String(key)}>
                Filter {String(key)}
                <select
                  value={String(value)}
                  onChange={(e) => {
                    (setter as (v: string) => void)(e.target.value);
                    setOffset(0);
                  }}
                >
                  <option value="">All {String(key)}</option>
                  {(lookups[String(key)] || []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || r.title}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Employee / pipeline</th>
                  <th>Training hours</th>
                  {(lookups.courses || []).map((c) => (
                    <th key={c.id} style={{ minWidth: 170 }}>
                      {c.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.full_name}</strong>
                      <br />
                      <small>
                        {p.employee_code} · {p.category}
                      </small>
                      <br />
                      <span
                        className={`ops-badge ${p.pipeline === "Deployable" ? "good" : "warn"}`}
                      >
                        {p.pipeline}
                      </span>
                    </td>
                    <td>{p.training_hours} h</td>
                    {(lookups.courses || []).map((c) => {
                      const expiry = p.certificates?.[c.id];
                      const today = new Date().toISOString().slice(0, 10);
                      const soon = new Date(referenceTime + 30 * 86400000)
                        .toISOString()
                        .slice(0, 10);
                      const state = !expiry
                        ? "Not taken"
                        : expiry < today
                          ? "Expired"
                          : expiry <= soon
                            ? "Expiring"
                            : "Valid";
                      return (
                        <td key={c.id}>
                          <span
                            className={`ops-badge ${state === "Valid" ? "good" : state === "Expired" ? "bad" : "warn"}`}
                          >
                            {state}
                          </span>
                          {expiry && expiry !== "9999-12-31" && (
                            <small style={{ display: "block", marginTop: 8 }}>
                              {dateLabel(expiry)}
                            </small>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                {(tab === "sessions"
                  ? ["Session", "Course", "Schedule", "Capacity / status"]
                  : tab === "enrollments"
                    ? ["Employee", "Session", "Attendance", "Practical"]
                    : tab === "questions"
                      ? ["Question", "Course", "Options", "Correct option"]
                      : tab === "requirements"
                        ? ["Post", "Course", "Policy"]
                        : ["Employee", "Course", "Validity", "Status"]
                ).map((h) => (
                  <th key={h}>{h}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {tab === "sessions" ? (
                    <>
                      <td>
                        <strong>{r.title}</strong>
                        <br />
                        <small>{r.venue}</small>
                      </td>
                      <td>{label("courses", r.course_id)}</td>
                      <td>
                        {dateLabel(r.starts_at)}
                        <br />
                        <small>
                          {new Date(r.starts_at).toLocaleTimeString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          IST
                        </small>
                      </td>
                      <td>
                        {r.capacity} · {r.status}
                      </td>
                    </>
                  ) : tab === "enrollments" ? (
                    <>
                      <td>{label("people", r.employee_id)}</td>
                      <td>{label("sessions", r.session_id)}</td>
                      <td>
                        <span className="ops-badge">{r.attendance}</span>
                        <br />
                        {r.hours_completed} hours
                      </td>
                      <td>
                        {r.practical_score ?? "Not evaluated"}
                        {r.practical_score !== null ? "%" : ""}
                      </td>
                    </>
                  ) : tab === "questions" ? (
                    <>
                      <td style={{ maxWidth: 350, whiteSpace: "normal" }}>
                        {r.prompt}
                      </td>
                      <td>{label("courses", r.course_id)}</td>
                      <td>{r.options.length}</td>
                      <td>{r.correct_index + 1}</td>
                    </>
                  ) : tab === "requirements" ? (
                    <>
                      <td>{label("posts", r.post_id)}</td>
                      <td>{label("courses", r.course_id)}</td>
                      <td>
                        <span className="ops-badge">{r.enforcement}</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{label("people", r.employee_id)}</td>
                      <td>{label("courses", r.course_id)}</td>
                      <td>
                        {dateLabel(r.issued_on)} →{" "}
                        {r.expires_on ? dateLabel(r.expires_on) : "No expiry"}
                      </td>
                      <td>
                        <span
                          className={`ops-badge ${r.revoked_at ? "bad" : r.expires_on && r.expires_on < new Date().toISOString().slice(0, 10) ? "warn" : "good"}`}
                        >
                          {r.revoked_at
                            ? "Revoked"
                            : r.expires_on &&
                                r.expires_on <
                                  new Date().toISOString().slice(0, 10)
                              ? "Expired"
                              : "Valid"}
                        </span>
                      </td>
                    </>
                  )}
                  <td>
                    {editable && (
                      <button
                        className="ops-button secondary"
                        onClick={() => open(r)}
                      >
                        Edit
                      </button>
                    )}
                    {tab === "enrollments" &&
                      (trainer || m.role === "employee") && (
                        <button
                          className="ops-button"
                          disabled={busy}
                          onClick={() => start(r)}
                        >
                          Take assessment
                        </button>
                      )}
                    {tab === "awards" && (
                      <>
                        <a
                          className="ops-button secondary"
                          href={`/api/training-certificate?tenant=${tenant}&id=${r.id}`}
                        >
                          <Download size={15} />
                          PDF
                        </a>
                        {trainer && !r.revoked_at && (
                          <button
                            className="ops-button secondary"
                            onClick={async () => {
                              const reason = prompt(
                                "Reason for revoking this certificate",
                              );
                              if (!reason) return;
                              try {
                                await request("/api/training/revoke", {
                                  tenant_id: tenant,
                                  award_id: r.id,
                                  reason,
                                });
                                await load();
                              } catch (e) {
                                setError((e as Error).message);
                              }
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!rows.length && !error && (
        <div className="ops-empty">
          <Award size={28} style={{ margin: "0 auto 12px" }} />
          No records in this view.{" "}
          {editable
            ? "Add a record to begin."
            : "Your assigned training will appear here."}
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
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent style={{ maxWidth: 740 }}>
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit" : "Add"} {tab.replaceAll("_", " ")}
            </DialogTitle>
            <DialogDescription>
              Changes are validated, access-controlled and audit logged.
            </DialogDescription>
          </DialogHeader>
          <form
            className="ops-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            {tab === "enrollments" && (
              <label className="wide">
                Find an employee
                <input
                  value={peopleQuery}
                  onChange={async (e) => {
                    setPeopleQuery(e.target.value);
                    try {
                      const d = await request(
                        `/api/training/people?tenant=${tenant}&q=${encodeURIComponent(e.target.value)}`,
                      );
                      setLookups((l) => ({ ...l, people: d.rows }));
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                  placeholder="Search name or employee code"
                />
              </label>
            )}
            {(fields[tab as TrainingResource] || []).map((f) => (
              <label key={f.key} className={f.wide ? "wide" : ""}>
                {f.label}
                {f.source ? (
                  <select
                    required
                    value={form[f.key] || ""}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  >
                    <option value="">Select…</option>
                    {lookups[f.source]?.map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.title || r.full_name || r.display_name || r.name}
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
                ) : f.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={!!form[f.key]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.checked })
                    }
                  />
                ) : ["textarea", "lines"].includes(f.type || "") ? (
                  <textarea
                    value={
                      f.type === "lines"
                        ? (form[f.key] || []).join("\n")
                        : form[f.key] || ""
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [f.key]:
                          f.type === "lines"
                            ? e.target.value.split("\n")
                            : e.target.value,
                      })
                    }
                  />
                ) : (
                  <input
                    type={f.type === "array" ? "text" : f.type || "text"}
                    value={
                      f.type === "array"
                        ? (form[f.key] || []).join(",")
                        : f.type === "datetime-local" && form[f.key]
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
                            : f.type === "array"
                              ? e.target.value
                                  .split(",")
                                  .map((x) => x.trim())
                                  .filter(Boolean)
                              : f.type === "datetime-local"
                                ? e.target.value
                                  ? new Date(
                                      e.target.value + ":00+05:30",
                                    ).toISOString()
                                  : ""
                                : e.target.value,
                      })
                    }
                  />
                )}
              </label>
            ))}
            {error && (
              <p className="ops-error wide" role="alert">
                {error}
              </p>
            )}
            <div className="ops-form-actions">
              <button
                type="button"
                className="ops-button secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="ops-button" disabled={busy}>
                {busy ? "Saving…" : "Save record"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!test} onOpenChange={(v) => !v && setTest(null)}>
        <DialogContent style={{ maxWidth: 740 }}>
          <DialogHeader>
            <DialogTitle>Knowledge assessment</DialogTitle>
            <DialogDescription>
              Answer every question. Your score is calculated on the server.
              Deadline:{" "}
              {test?.expires_at &&
                new Date(test.expires_at).toLocaleTimeString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}{" "}
              IST.
            </DialogDescription>
          </DialogHeader>
          <form
            className="ops-form"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            {test?.questions.map((q: Row, i: number) => (
              <fieldset className="wide" key={q.id}>
                <legend style={{ fontWeight: 600, marginBottom: 12 }}>
                  {i + 1}. {q.prompt}
                </legend>
                {q.options.map((v: string, n: number) => (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      margin: "10px 0",
                    }}
                    key={n}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      required
                      checked={answers[q.id] === n}
                      onChange={() => setAnswers({ ...answers, [q.id]: n })}
                    />
                    {v}
                  </label>
                ))}
              </fieldset>
            ))}
            {error && (
              <p role="alert" className="ops-error wide">
                {error}
              </p>
            )}
            <div className="ops-form-actions">
              <button className="ops-button" disabled={busy}>
                Submit assessment
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
