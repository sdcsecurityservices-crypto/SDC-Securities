"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Download,
  Upload,
  FileText,
  RefreshCw,
  CheckCircle2,
  Clock3,
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  GraduationCap,
  Package,
  LockKeyhole,
  Activity,
  IdCard,
  LogOut,
  ChevronRight,
  LoaderCircle,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { fields, initialValues, type Field } from "@/lib/employees/fields";
import { hrRoles, operationsRoles } from "@/lib/employees/validation";
import { roleNames } from "@/lib/foundation/validation";
// Field descriptors select heterogeneous, server-validated record values.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const human = (s: string) =>
  s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n / 100,
  );
const date = (s: string) =>
  s
    ? new Date(s.length === 10 ? s + "T12:00Z" : s)
        .toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" })
        .replaceAll("/", "-")
    : "—";
async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const d = (await res.json()) as Row;
  if (res.status === 401) {
    location.assign("/login");
    throw Error("Please sign in.");
  }
  if (!res.ok) throw Error(d.error || "Request failed.");
  return d;
}
const post = (resource: string, body: Row) =>
  api("/api/employees/" + resource, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
async function download(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const d = (await res.json()) as Row;
    throw Error(d.error || "Download failed.");
  }
  const blob = await res.blob(),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download =
    res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ||
    "SDC-download";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const tabs = [
  ["overview", "Overview", Users],
  ["private_profiles", "Personal & KYC", LockKeyhole],
  ["verifications", "Verification", ShieldCheck],
  ["id_cards", "Identity card", IdCard],
  ["events", "Employment", BriefcaseBusiness],
  ["postings", "Deployments", MapPin],
  ["attendance", "Attendance & leave", CalendarDays],
  ["salary_structures", "Compensation", CreditCard],
  ["payslips", "Payslips", FileText],
  ["payments", "Payments", CreditCard],
  ["certificates", "Training", GraduationCap],
  ["assets", "Assets issued", Package],
  ["documents", "Documents", FileText],
] as const;
const resourceLabel = (r: string) =>
  tabs.find((t) => t[0] === r)?.[1] || human(r);
const badge = (status: string) => (
  <span className={"people-badge " + status}>{human(status)}</span>
);
function Photo({
  tenant,
  id,
  name,
  hasPhoto,
}: {
  tenant: string;
  id: string;
  name: string;
  hasPhoto?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="people-avatar">
      {failed || hasPhoto === false ? (
        name
          .split(" ")
          .slice(0, 2)
          .map((s) => s[0])
          .join("")
      ) : (
        <img
          alt={name}
          src={`/api/employee-files?tenant=${tenant}&employee=${id}&photo=true`}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
function Relation({
  field,
  tenant,
  employee,
  value,
  onChange,
}: {
  field: Field;
  tenant: string;
  employee?: string;
  value: string;
  onChange: (s: string) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]),
    [q, setQ] = useState(""),
    [next, setNext] = useState<string | null>(null),
    [error, setError] = useState("");
  const url = `/api/${["employees", "payslips", "payments"].includes(field.relation!) ? "employees" : "foundation"}/${field.relation}?tenant=${tenant}&limit=100&q=${encodeURIComponent(q)}${["payslips", "payments"].includes(field.relation!) ? "&employee=" + employee : ""}`;
  useEffect(() => {
    const abort = new AbortController();
    const t = setTimeout(() => {
      api(url, { signal: abort.signal })
        .then((d) => {
          setRows(d.rows);
          setNext(d.nextCursor);
          setError("");
        })
        .catch((e) => {
          if (!abort.signal.aborted) setError(e.message);
        });
    }, 150);
    return () => {
      clearTimeout(t);
      abort.abort();
    };
  }, [url]);
  return (
    <div className="relation-input">
      <input
        aria-label={`Search ${field.label}`}
        value={q}
        placeholder="Search options…"
        onChange={(e) => setQ(e.target.value)}
      />
      <select
        aria-label={field.label}
        required={field.required}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{field.nullable ? "None" : "Choose…"}</option>
        {value && !rows.some((r) => r.id === value) && (
          <option value={value}>Current selection</option>
        )}
        {rows
          .filter((r) =>
            field.relation === "payslips"
              ? r.status === "released"
              : field.relation === "payments"
                ? r.kind === "advance" && r.status === "paid"
                : true,
          )
          .map((r) => (
            <option key={r.id} value={r.id}>
              {r.name ||
                r.full_name ||
                `${date(r.month || r.paid_on)} · ${money(r.net_paise ?? r.amount_paise)}`}{" "}
              {r.code || r.employee_code || ""}
            </option>
          ))}
      </select>
      {next && (
        <button
          type="button"
          onClick={async () => {
            try {
              const d = await api(url + "&cursor=" + encodeURIComponent(next));
              setRows((r) => [...r, ...d.rows]);
              setNext(d.nextCursor);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          More options
        </button>
      )}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
function RecordEditor({
  resource,
  record,
  tenant,
  employee,
  role,
  onClose,
  onSaved,
}: {
  resource: string;
  record: Row;
  tenant: string;
  employee?: string;
  role: string;
  onClose: () => void;
  onSaved: (r: Row) => void;
}) {
  const [form, setForm] = useState<Row>(() => {
      const v = initialValues(resource);
      for (const f of fields[resource] || []) {
        if (record.id || record.data) {
          const data = record.data || record;
          let value = data[f.key] ?? v[f.key];
          if (f.type === "money") value = Number(value) / 100;
          if (f.type === "datetime-local" && value)
            value = new Date(new Date(value).getTime() + 330 * 60000)
              .toISOString()
              .slice(0, 16);
          v[f.key] = value;
        }
      }
      if (resource === "id_cards" && !record.id) {
        v.issuer = "SDC Security Services Pvt. Ltd.";
        v.valid_until = Number(today().slice(0, 4)) + 1 + today().slice(4);
      }
      return v;
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save() {
    setBusy(true);
    setError("");
    try {
      const data: Row = {};
      for (const f of fields[resource]) {
        let v = form[f.key];
        if (f.nullable && (v === "" || v === null)) v = null;
        else if (f.type === "money") v = Math.round(Number(v) * 100);
        else if (f.type === "number") v = Number(v);
        else if (f.type === "datetime-local" && v)
          v = new Date(v + ":00+05:30").toISOString();
        data[f.key] = v;
      }
      const d = await post(resource, {
        tenant_id: tenant,
        ...(employee ? { employee_id: employee } : {}),
        ...(record.id
          ? { id: record.id, row_version: record.row_version }
          : {}),
        data,
      });
      toast.success("Record saved.");
      onSaved(d.record);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="foundation-dialog people-dialog">
        <DialogHeader>
          <DialogTitle>
            {record.id ? "Edit" : "Add"} {resourceLabel(resource).toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            {resource === "private_profiles"
              ? "Sensitive details are encrypted and access is recorded."
              : "Changes are permission checked, versioned and recorded in the activity log."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="foundation-fields">
            {fields[resource]
              ?.filter(
                (f) =>
                  !(
                    role === "employee" &&
                    ["status", "decision_note"].includes(f.key)
                  ),
              )
              .map((f) => (
                <label
                  key={f.key}
                  className={f.type === "textarea" ? "full" : ""}
                >
                  {f.label}
                  {f.required && " *"}
                  {f.relation ? (
                    <Relation
                      field={f}
                      tenant={tenant}
                      employee={employee}
                      value={form[f.key]}
                      onChange={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                    />
                  ) : f.options ? (
                    <select
                      value={form[f.key] || ""}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    >
                      {f.options.map((v) => (
                        <option key={v} value={v}>
                          {v ? human(v) : "Not recorded"}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={form[f.key] || ""}
                      maxLength={4000}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    />
                  ) : f.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={!!form[f.key]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [f.key]: e.target.checked }))
                      }
                    />
                  ) : (
                    <input
                      type={f.type === "money" ? "number" : f.type || "text"}
                      required={f.required}
                      step={
                        f.type === "money"
                          ? "0.01"
                          : f.type === "number"
                            ? "any"
                            : undefined
                      }
                      min={
                        ["money", "number"].includes(f.type || "")
                          ? 0
                          : undefined
                      }
                      value={form[f.key] ?? ""}
                      autoComplete="off"
                      maxLength={4000}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                    />
                  )}
                </label>
              ))}
          </div>
          {resource === "salary_structures" && (
            <p className="foundation-form-note">
              Rates are configured by HR for the applicable period. Payroll
              release is blocked until the wage floor and deduction policy have
              been reviewed.
            </p>
          )}
          {error && (
            <p role="alert" className="foundation-error">
              {error}
            </p>
          )}
          <div className="foundation-form-actions">
            <button
              type="button"
              className="button outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button disabled={busy} className="button brand-navy">
              {busy ? "Saving…" : "Save record"}
              <CheckCircle2 size={16} />
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default function Workforce() {
  const [memberships, setMemberships] = useState<Row[]>([]),
    [tenant, setTenant] = useState(""),
    [ready, setReady] = useState(false),
    [fatal, setFatal] = useState(""),
    [rows, setRows] = useState<Row[]>([]),
    [total, setTotal] = useState(0),
    [next, setNext] = useState<string | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [category, setCategory] = useState(""),
    [site, setSite] = useState(""),
    [grade, setGrade] = useState(""),
    [client, setClient] = useState(""),
    [certification, setCertification] = useState(""),
    [availability, setAvailability] = useState(""),
    [grades, setGrades] = useState<Row[]>([]),
    [clients, setClients] = useState<Row[]>([]),
    [moreFilters, setMoreFilters] = useState(false),
    [sites, setSites] = useState<Row[]>([]),
    [stats, setStats] = useState<Row>({}),
    [selected, setSelected] = useState<string[]>([]),
    [person, setPerson] = useState<Row | null>(null),
    [edit, setEdit] = useState<Row | null>(null),
    [revision, setRevision] = useState(0),
    [importing, setImporting] = useState(false),
    [payroll, setPayroll] = useState(false);
  const seq = useRef(0),
    membership = memberships.find((m) => m.tenant_id === tenant),
    role = membership?.role || "",
    hr = hrRoles.includes(role);
  useEffect(() => {
    api("/api/foundation/context")
      .then((d) => {
        setMemberships(d.memberships);
        setTenant(d.memberships[0]?.tenant_id || "");
        setReady(true);
      })
      .catch((e) => setFatal(e.message));
  }, []);
  const load = useCallback(
    async (cursor?: string) => {
      if (!tenant) return;
      const n = ++seq.current;
      setLoading(true);
      setError("");
      try {
        const d = await api(
          `/api/employees/employees?tenant=${tenant}&q=${encodeURIComponent(q)}&status=${status}&category=${category}&site=${site}&grade_id=${grade}&client=${client}&certification=${certification}&availability=${availability}${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`,
        );
        if (n !== seq.current) return;
        setRows((r) => (cursor ? [...r, ...d.rows] : d.rows));
        if (!cursor) setTotal(d.total);
        setNext(d.nextCursor);
      } catch (e) {
        if (n === seq.current) setError((e as Error).message);
      } finally {
        if (n === seq.current) setLoading(false);
      }
    },
    [
      tenant,
      q,
      status,
      category,
      site,
      grade,
      client,
      certification,
      availability,
    ],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelected([]);
      void load();
    }, 180);
    return () => {
      clearTimeout(timer);
      seq.current++;
    };
  }, [load, revision]);
  useEffect(() => {
    if (!tenant) return;
    const abort = new AbortController();
    api(`/api/foundation/grades?tenant=${tenant}&limit=100`, {
      signal: abort.signal,
    })
      .then((d) => setGrades(d.rows))
      .catch(() => {});
    api(`/api/foundation/clients?tenant=${tenant}&limit=100`, {
      signal: abort.signal,
    })
      .then((d) => setClients(d.rows))
      .catch(() => {});
    api(`/api/employees/stats?tenant=${tenant}`, { signal: abort.signal })
      .then(setStats)
      .catch(() => {});
    api(`/api/foundation/sites?tenant=${tenant}&limit=100`, {
      signal: abort.signal,
    })
      .then((d) => setSites(d.rows))
      .catch(() => {});
    return () => abort.abort();
  }, [tenant, revision]);
  if (fatal)
    return (
      <main className="foundation-state">
        <ShieldCheck size={40} />
        <h1>Connection unavailable</h1>
        <p>{fatal}</p>
        <button className="button brand-navy" onClick={() => location.reload()}>
          Retry
        </button>
      </main>
    );
  if (!ready)
    return (
      <main className="foundation-state">
        <LoaderCircle className="spin" />
        <p>Opening people & workforce…</p>
      </main>
    );
  if (!membership)
    return (
      <main className="foundation-state">
        <h1>Workspace access needed</h1>
        <p>Your account needs an assigned role.</p>
        <a href="/workspace">Return to workspace</a>
      </main>
    );
  return (
    <div className="foundation-app people-app">
      <aside className="foundation-sidebar">
        <Link href="/" className="foundation-brand">
          <img src="/brand/sdc-logo.png" alt="SDC crest" />
          <span>
            SDC <b>COMMAND</b>
            <small>CONNECTED OPERATIONS</small>
          </span>
        </Link>
        <div className="foundation-tenant">
          <Building2 size={18} />
          <span>
            {membership.tenants?.name}
            <small>
              {membership.tenants?.is_demo
                ? "Demonstration workspace"
                : "Operations workspace"}
            </small>
          </span>
        </div>
        <span className="foundation-nav-label">YOUR WORKSPACE</span>
        <nav>
          <a className="workforce-nav-link" href="/workspace">
            <Building2 size={18} /> Clients & sites
          </a>
          <button className="active" onClick={() => setPerson(null)}>
            <Users size={18} /> People & workforce
          </button>
        </nav>
        <div className="people-sidebar-note">
          <ShieldCheck size={24} />
          <h3>
            People first.
            <br />
            Every detail connected.
          </h3>
          <p>One secure record for every person protecting your clients.</p>
        </div>
        <div className="foundation-sidebar-bottom">
          <div className="foundation-profile">
            <span>{membership.display_name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{membership.display_name}</strong>
              <small>{roleNames[role]}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="foundation-main">
        <header className="foundation-header">
          <div>
            <a className="people-mobile-home" href="/workspace">
              SDC
            </a>
            <span>
              Workspace <ChevronRight size={13} />
              <button onClick={() => setPerson(null)}>People</button>
              {person && (
                <>
                  <ChevronRight size={13} />
                  <b>{person.employee_code}</b>
                </>
              )}
            </span>
          </div>
          <div>
            {memberships.length > 1 && (
              <select
                aria-label="Workspace"
                value={tenant}
                onChange={(e) => {
                  setTenant(e.target.value);
                  setPerson(null);
                }}
              >
                {memberships.map((m) => (
                  <option key={m.id} value={m.tenant_id}>
                    {m.tenants?.name}
                  </option>
                ))}
              </select>
            )}
            <span className="foundation-role">
              <ShieldCheck size={13} />
              {roleNames[role]}
            </span>
            <button
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await api("/api/auth/logout", { method: "POST" });
                  location.assign("/login");
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="foundation-content">
          {membership.tenants?.is_demo && (
            <div className="foundation-demo">
              <b>DEMO</b> Fictional employee records · Do not use demonstration
              salary rules for live payroll
            </div>
          )}
          {person ? (
            <Profile
              key={tenant + person.id}
              tenant={tenant}
              person={person}
              role={role}
              onBack={() => setPerson(null)}
              onChanged={(r) => {
                setPerson(r);
                setRevision((v) => v + 1);
              }}
            />
          ) : (
            <>
              <div className="foundation-title">
                <div>
                  <span className="foundation-eyebrow">
                    SDC COMMAND / PEOPLE & WORKFORCE
                  </span>
                  <h1>
                    Your people<span>.</span>
                  </h1>
                  <p>Every person. Every posting. One connected record.</p>
                </div>
                <div className="people-actions">
                  <button
                    className="button outline"
                    onClick={() =>
                      download(`/api/employee-exchange?tenant=${tenant}`).catch(
                        (e) => toast.error(e.message),
                      )
                    }
                  >
                    <Download size={16} /> Export
                  </button>
                  {hr && (
                    <>
                      <button
                        className="button outline"
                        onClick={() => setImporting(true)}
                      >
                        <Upload size={16} /> Import
                      </button>
                      <button
                        className="button brand-navy"
                        onClick={() => setEdit({})}
                      >
                        <Plus size={17} /> Add employee
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="people-kpis">
                {(
                  [
                    ["active", "Active workforce", Users],
                    ["on_leave", "On leave", CalendarDays],
                    ["suspended", "On hold", Clock3],
                    ["exited", "Exited / history", BriefcaseBusiness],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    className={status === key ? "selected" : ""}
                    onClick={() => setStatus(status === key ? "" : key)}
                  >
                    <Icon size={20} />
                    <strong>{stats[key] ?? "—"}</strong>
                    <span>{label}</span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
              <section className="foundation-panel">
                <div className="people-toolbar">
                  <div className="foundation-search">
                    <Search size={17} />
                    <input
                      aria-label="Search employees"
                      placeholder="Search name or employee ID…"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Employment category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">All categories</option>
                    {["full_time", "trainee", "reliever", "contract"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {human(s)}
                        </option>
                      ),
                    )}
                  </select>
                  <select
                    aria-label="Employee status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    {["active", "on_leave", "suspended", "exited"].map((s) => (
                      <option key={s} value={s}>
                        {human(s)}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Current site"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                  >
                    <option value="">All sites</option>
                    {sites.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setMoreFilters((v) => !v)}
                    aria-expanded={moreFilters}
                  >
                    Filters
                  </button>
                  <button
                    aria-label="Refresh employees"
                    disabled={loading}
                    onClick={() => setRevision((v) => v + 1)}
                  >
                    <RefreshCw size={17} className={loading ? "spin" : ""} />
                  </button>
                </div>
                {moreFilters && (
                  <div className="people-toolbar">
                    <select
                      aria-label="Employee grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    >
                      <option value="">All designations</option>
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Current client"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                    >
                      <option value="">All clients</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Certificate validity"
                      value={certification}
                      onChange={(e) => setCertification(e.target.value)}
                    >
                      <option value="">Any certification</option>
                      <option value="valid">Has valid certificate</option>
                      <option value="expired">Has expired certificate</option>
                    </select>
                    <select
                      aria-label="Posting availability"
                      value={availability}
                      onChange={(e) => {
                        setAvailability(e.target.value);
                        if (e.target.value) {
                          setSite("");
                          setClient("");
                        }
                      }}
                    >
                      <option value="">Any posting status</option>
                      <option value="unassigned">No current posting</option>
                    </select>
                    <button
                      onClick={() => {
                        setGrade("");
                        setClient("");
                        setCertification("");
                        setAvailability("");
                        setCategory("");
                        setStatus("");
                        setSite("");
                        setQ("");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                )}
                {selected.length > 0 && (
                  <div className="people-selection">
                    <strong>{selected.length} selected</strong>
                    <button onClick={() => setPayroll(true)}>
                      Payroll / bank advice <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() =>
                        download("/api/employee-bulk", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            tenant_id: tenant,
                            employee_ids: selected,
                            kind: "id_cards",
                          }),
                        }).catch((e) => toast.error(e.message))
                      }
                    >
                      Print ID cards <IdCard size={14} />
                    </button>
                    <button onClick={() => setSelected([])}>Clear</button>
                  </div>
                )}
                {error ? (
                  <div className="foundation-empty" role="alert">
                    <h3>Unable to load employees</h3>
                    <p>{error}</p>
                    <button onClick={() => void load()}>Retry</button>
                  </div>
                ) : loading && !rows.length ? (
                  <div className="foundation-empty">
                    <LoaderCircle className="spin" />
                    <p>Loading workforce…</p>
                  </div>
                ) : !rows.length ? (
                  <div className="foundation-empty">
                    <Users size={36} />
                    <h3>
                      {q || status || category || site
                        ? "No matching employees"
                        : "Your workforce starts here"}
                    </h3>
                    <p>
                      {hr
                        ? "Add an employee or import your validated Excel directory."
                        : "No employees are available in your assigned scope."}
                    </p>
                  </div>
                ) : (
                  <div className="people-table-scroll">
                    <table className="people-table">
                      <thead>
                        <tr>
                          {hr && (
                            <th>
                              <input
                                type="checkbox"
                                aria-label="Select loaded employees"
                                checked={
                                  rows.length > 0 &&
                                  rows.every((r) => selected.includes(r.id))
                                }
                                onChange={(e) =>
                                  setSelected(
                                    e.target.checked
                                      ? rows.map((r) => r.id)
                                      : [],
                                  )
                                }
                              />
                            </th>
                          )}
                          <th>Employee</th>
                          <th>Designation / category</th>
                          <th>Current deployment</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const posting = r.employee_postings?.find(
                            (p: Row) =>
                              !p.deleted_at &&
                              p.starts_on <= today() &&
                              (!p.ends_on || p.ends_on >= today()),
                          );
                          return (
                            <tr key={r.id}>
                              {hr && (
                                <td>
                                  <input
                                    type="checkbox"
                                    aria-label={`Select ${r.full_name}`}
                                    checked={selected.includes(r.id)}
                                    onChange={(e) =>
                                      setSelected((s) =>
                                        e.target.checked
                                          ? [...s, r.id]
                                          : s.filter((id) => id !== r.id),
                                      )
                                    }
                                  />
                                </td>
                              )}
                              <td>
                                <button
                                  className="people-person"
                                  onClick={() => setPerson(r)}
                                >
                                  <Photo
                                    tenant={tenant}
                                    id={r.id}
                                    name={r.full_name}
                                    hasPhoto={!!r.employee_documents?.length}
                                  />
                                  <span>
                                    <strong>{r.full_name}</strong>
                                    <small>{r.employee_code}</small>
                                  </span>
                                </button>
                              </td>
                              <td>
                                <strong>{r.grades?.name || "—"}</strong>
                                <small>{human(r.category)}</small>
                              </td>
                              <td>
                                <strong>
                                  {posting?.sites?.name || "No current posting"}
                                </strong>
                                <small>
                                  {posting?.posts?.name ||
                                    "Available for planning"}
                                </small>
                              </td>
                              <td>{badge(r.status)}</td>
                              <td>
                                <button
                                  aria-label={`Open ${r.full_name}`}
                                  onClick={() => setPerson(r)}
                                >
                                  <ChevronRight size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <footer className="foundation-list-footer">
                  <span>
                    {rows.length} of {total} employees · permissions applied
                  </span>
                  {next && (
                    <button disabled={loading} onClick={() => void load(next)}>
                      {loading ? "Loading…" : "Load more"}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </footer>
              </section>
            </>
          )}
        </main>
      </div>
      {edit && (
        <RecordEditor
          resource="employees"
          record={edit}
          tenant={tenant}
          role={role}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            setRevision((v) => v + 1);
          }}
        />
      )}
      {importing && (
        <ImportDialog
          tenant={tenant}
          onClose={() => setImporting(false)}
          onDone={() => {
            setImporting(false);
            setRevision((v) => v + 1);
          }}
        />
      )}
      {payroll && (
        <Payroll
          tenant={tenant}
          employees={selected}
          onClose={() => setPayroll(false)}
          onDone={() => {
            setPayroll(false);
            setRevision((v) => v + 1);
          }}
        />
      )}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
function Profile({
  tenant,
  person,
  role,
  onBack,
  onChanged,
}: {
  tenant: string;
  person: Row;
  role: string;
  onBack: () => void;
  onChanged: (r: Row) => void;
}) {
  const [tab, setTab] = useState("overview"),
    [edit, setEdit] = useState(false),
    [linking, setLinking] = useState(false),
    [revision, setRevision] = useState(0);
  const hr = hrRoles.includes(role),
    personal = hr || role === "employee";
  const posting = person.employee_postings?.find(
    (p: Row) =>
      !p.deleted_at &&
      p.starts_on <= today() &&
      (!p.ends_on || p.ends_on >= today()),
  );
  const restricted = [
    "private_profiles",
    "verifications",
    "events",
    "salary_structures",
    "payments",
    "payslips",
    "documents",
  ];
  async function refreshed() {
    const d = await api(
      `/api/employees/employees?tenant=${tenant}&employee=${person.id}`,
    );
    if (d.rows[0]) onChanged(d.rows[0]);
    setRevision((v) => v + 1);
  }
  return (
    <>
      <button className="people-back" onClick={onBack}>
        <ArrowLeft size={15} /> All employees
      </button>
      <section className="people-profile">
        <div className="people-profile-top">
          <Photo
            tenant={tenant}
            id={person.id}
            name={person.full_name}
            hasPhoto={!!person.employee_documents?.length}
          />
          <div>
            <span className="foundation-eyebrow">
              {person.employee_code} · {human(person.category)}
            </span>
            <h1>{person.full_name}</h1>
            <p>
              {person.grades?.name || "Security professional"} <span>•</span>{" "}
              Joined {date(person.joined_on)}
            </p>
          </div>
          <div className="people-profile-actions">
            {badge(person.status)}
            {hr && (
              <button
                className="button outline compact"
                onClick={() => setEdit(true)}
              >
                Edit employee
              </button>
            )}
            {role === "admin" && (
              <button
                className="button outline compact"
                onClick={() => setLinking(true)}
              >
                {person.membership_id ? "Manage login" : "Link employee login"}
              </button>
            )}
          </div>
        </div>
        <div className="people-profile-strip">
          <span>
            <MapPin size={16} />
            {posting?.sites?.name || "No current site"}{" "}
            {posting && `/ ${posting.posts?.name}`}
          </span>
          <span>
            <ShieldCheck size={16} />
            Access controlled employee record
          </span>
        </div>
      </section>
      <nav className="people-tabs" aria-label="Employee profile sections">
        {tabs
          .filter(([id]) => personal || !restricted.includes(id))
          .map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
      </nav>
      {tab === "overview" ? (
        <Overview
          tenant={tenant}
          person={person}
          posting={posting}
          personal={personal}
          onTab={setTab}
        />
      ) : tab === "private_profiles" ? (
        <PrivateProfile tenant={tenant} employee={person.id} role={role} />
      ) : tab === "payments" ? (
        <>
          <Records
            resource="payments"
            tenant={tenant}
            employee={person.id}
            role={role}
          />
          <div style={{ height: 22 }} />
          <Records
            resource="advances"
            tenant={tenant}
            employee={person.id}
            role={role}
          />
        </>
      ) : tab === "documents" ? (
        <Documents
          tenant={tenant}
          employee={person.id}
          editable={hr}
          onChanged={refreshed}
        />
      ) : tab === "attendance" ? (
        <>
          {role === "employee" && (
            <CheckIn tenant={tenant} employee={person.id} onDone={refreshed} />
          )}
          <Records
            key={"attendance" + revision}
            resource="attendance"
            tenant={tenant}
            employee={person.id}
            role={role}
            onChanged={refreshed}
          />
          <div className="people-two-columns">
            <Records
              resource="leave_balances"
              tenant={tenant}
              employee={person.id}
              role={role}
            />
            <Records
              resource="leave_requests"
              tenant={tenant}
              employee={person.id}
              role={role}
            />
          </div>
        </>
      ) : (
        <Records
          key={tab + revision}
          resource={tab}
          tenant={tenant}
          employee={person.id}
          role={role}
          onChanged={refreshed}
        />
      )}
      {linking && (
        <LinkAccount
          tenant={tenant}
          employee={person.id}
          onClose={() => setLinking(false)}
          onDone={() => {
            setLinking(false);
            void refreshed();
          }}
        />
      )}
      {edit && (
        <RecordEditor
          resource="employees"
          record={person}
          tenant={tenant}
          role={role}
          onClose={() => setEdit(false)}
          onSaved={async () => {
            setEdit(false);
            await refreshed();
          }}
        />
      )}
    </>
  );
}
function Overview({
  tenant,
  person,
  posting,
  personal,
  onTab,
}: {
  tenant: string;
  person: Row;
  posting?: Row;
  personal: boolean;
  onTab: (s: string) => void;
}) {
  const [attendance, setAttendance] = useState<Row[]>([]),
    [certificates, setCertificates] = useState<Row[]>([]),
    [history, setHistory] = useState<Row[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    const a = new AbortController();
    api(
      `/api/employees/record_history?tenant=${tenant}&employee=${person.id}&limit=20`,
      { signal: a.signal },
    )
      .then((d) => setHistory(d.rows))
      .catch(() => {});
    Promise.all([
      api(
        `/api/employees/attendance?tenant=${tenant}&employee=${person.id}&month=${today().slice(0, 7)}&limit=100`,
        { signal: a.signal },
      ),
      api(
        `/api/employees/certificates?tenant=${tenant}&employee=${person.id}&limit=100`,
        { signal: a.signal },
      ),
    ])
      .then(([x, y]) => {
        setAttendance(x.rows);
        setCertificates(y.rows);
      })
      .catch((e) => {
        if (!a.signal.aborted) setError(e.message);
      });
    return () => a.abort();
  }, [tenant, person.id]);
  const approved = attendance.filter((r) => r.approval === "approved"),
    present = approved.filter((r) => r.status === "present").length,
    valid = certificates.filter(
      (r) =>
        r.status === "passed" && (!r.expires_on || r.expires_on >= today()),
    );
  return (
    <>
      <div className="people-kpis">
        <button onClick={() => onTab("attendance")}>
          <CalendarDays size={20} />
          <strong>
            {approved.length
              ? Math.round((present / approved.length) * 100) + "%"
              : "—"}
          </strong>
          <span>Present / approved days this month</span>
        </button>
        <button onClick={() => onTab("certificates")}>
          <GraduationCap size={20} />
          <strong>{valid.length}</strong>
          <span>Current passed certificates</span>
        </button>
        <button onClick={() => onTab("postings")}>
          <MapPin size={20} />
          <strong>
            {posting
              ? Math.floor(
                  (Date.parse(today()) - Date.parse(posting.starts_on)) /
                    86400000,
                ) + 1
              : "—"}
          </strong>
          <span>Days at current site</span>
        </button>
        <div>
          <BriefcaseBusiness size={20} />
          <strong>
            {Math.max(
              0,
              Math.floor(
                (Date.parse(person.exited_on || today()) -
                  Date.parse(person.joined_on)) /
                  86400000,
              ),
            )}
          </strong>
          <span>Days of service</span>
        </div>
      </div>
      {error && <p className="foundation-error">{error}</p>}
      <div className="people-two-columns">
        <section className="foundation-panel people-summary">
          <span className="foundation-eyebrow">CURRENT ASSIGNMENT</span>
          <h2>{posting?.sites?.name || "Ready for workforce planning"}</h2>
          <p>{posting?.posts?.name || "No active deployment is recorded."}</p>
          {posting && (
            <p>
              Started {date(posting.starts_on)} ·{" "}
              {posting.ends_on ? "Ends " + date(posting.ends_on) : "Ongoing"}
            </p>
          )}
          <button onClick={() => onTab("postings")}>
            View deployment history <ArrowRight size={16} />
          </button>
        </section>
        <section className="foundation-panel people-summary">
          <span className="foundation-eyebrow">EMPLOYEE RECORD</span>
          <h2>One person. A complete history.</h2>
          <p>
            Manage employment, verification, equipment and learning from this
            profile.
          </p>
          <div className="people-actions">
            <button onClick={() => onTab("id_cards")}>
              Identity card <ArrowRight size={16} />
            </button>
            {personal && (
              <button onClick={() => onTab("private_profiles")}>
                Protected details <LockKeyhole size={15} />
              </button>
            )}
          </div>
        </section>
      </div>
      {history.length > 0 && (
        <section
          className="foundation-panel people-summary"
          style={{ marginTop: 22 }}
        >
          <h2>
            <Activity size={19} /> Recent record activity
          </h2>
          {history.map((r) => (
            <div className="people-history-row" key={r.id}>
              <span>
                {human(r.entity_type.replace("employee_", ""))} ·{" "}
                {human(r.action)}
              </span>
              <small>
                {date(r.created_at)} ·{" "}
                {new Date(r.created_at).toLocaleTimeString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                IST
              </small>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
function Records({
  resource,
  tenant,
  employee,
  role,
  onChanged,
}: {
  resource: string;
  tenant: string;
  employee: string;
  role: string;
  onChanged?: () => Promise<void>;
}) {
  const [rows, setRows] = useState<Row[]>([]),
    [next, setNext] = useState<string | null>(null),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [edit, setEdit] = useState<Row | null>(null),
    [detail, setDetail] = useState<Row | null>(null),
    [payroll, setPayroll] = useState(false),
    [month, setMonth] = useState(today().slice(0, 7)),
    [password, setPassword] = useState(""),
    [revoke, setRevoke] = useState<Row | null>(null),
    [busy, setBusy] = useState(false);
  const hr = hrRoles.includes(role),
    operational = operationsRoles.includes(role),
    editable =
      hr ||
      (["postings", "assets", "certificates", "id_cards"].includes(resource) &&
        operational) ||
      (["attendance", "leave_requests"].includes(resource) &&
        [...operationsRoles, "site_lead"].includes(role)),
    canAdd = editable || (resource === "leave_requests" && role === "employee");
  const load = useCallback(
    async (cursor?: string) => {
      setLoading(true);
      setError("");
      try {
        const d = await api(
          `/api/employees/${resource}?tenant=${tenant}&employee=${employee}&limit=100${resource === "attendance" ? "&month=" + month : ""}${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`,
        );
        setRows((r) => (cursor ? [...r, ...d.rows] : d.rows));
        setNext(d.nextCursor);
        if (!cursor) setTotal(d.total);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [resource, tenant, employee, month],
  );
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => {
    if (!password) return;
    const t = setTimeout(() => setPassword(""), 30000);
    return () => clearTimeout(t);
  }, [password]);
  const title = (r: Row) =>
    r.title ||
    r.course_title ||
    r.serial ||
    (resource === "postings"
      ? r.sites?.name
      : resource === "attendance"
        ? date(r.work_date)
        : resource === "salary_structures"
          ? money(
              r.basic_paise +
                r.da_paise +
                r.hra_paise +
                r.conveyance_paise +
                r.washing_paise +
                r.special_paise +
                r.site_allowance_paise,
            ) + " / month"
          : resource === "advances"
            ? money(r.principal_paise) + " advance"
            : resource === "payments"
              ? money(r.amount_paise)
              : resource === "payslips"
                ? date(r.month) + " · Revision " + r.revision
                : human(r.kind || r.asset_type || r.leave_type || "Record"));
  const subtitle = (r: Row) =>
    resource === "advances"
      ? `${money(r.installment_paise)} / month from ${date(r.starts_on)}`
      : resource === "postings"
        ? `${r.posts?.name} · ${date(r.starts_on)} → ${r.ends_on ? date(r.ends_on) : "Current"}`
        : resource === "payslips"
          ? `Net ${money(r.net_paise)} · ${r.paid_days} paid days`
          : resource === "salary_structures"
            ? `Effective ${date(r.starts_on)} → ${r.ends_on ? date(r.ends_on) : "Ongoing"} · ${r.rule_approved ? "Policy reviewed" : "Policy review required"}`
            : resource === "attendance"
              ? `${human(r.approval)} · ${r.overtime_minutes} min overtime`
              : resource === "leave_balances"
                ? `${r.entitled_days} days entitlement · ${r.year}`
                : resource === "leave_requests"
                  ? `${date(r.starts_on)} → ${date(r.ends_on)}`
                  : resource === "id_cards"
                    ? `Valid ${date(r.valid_from)} → ${date(r.valid_until)}`
                    : resource === "payments"
                      ? `${date(r.paid_on)} · ${human(r.mode)} · ${r.reference || "No reference"}`
                      : resource === "assets"
                        ? `Issued ${date(r.issued_on)} · ${r.returned_on ? "Returned " + date(r.returned_on) : "In possession"} · Qty ${r.quantity}`
                        : r.expires_on
                          ? "Expires " + date(r.expires_on)
                          : date(r.effective_on || r.checked_on || r.issued_on);
  const state = (r: Row) =>
    resource === "id_cards"
      ? r.revoked_at || r.deleted_at
        ? "revoked"
        : r.valid_until < today()
          ? "expired"
          : r.valid_from > today()
            ? "not_yet_valid"
            : "active"
      : r.status || "";
  return (
    <section className="foundation-panel people-record-panel">
      <header className="people-section-heading">
        <div>
          <h2>{resourceLabel(resource)}</h2>
          <p>
            {resource === "certificates"
              ? "Recorded courses, outcomes and certificate validity."
              : resource === "salary_structures"
                ? "Effective salary revisions and reviewed deduction rules."
                : resource === "id_cards"
                  ? "Printable cards with live QR verification."
                  : "Employee records and retained history."}
          </p>
        </div>
        <div className="people-actions">
          {resource === "attendance" && (
            <input
              aria-label="Attendance month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          )}
          <button
            aria-label={`Refresh ${resourceLabel(resource)}`}
            onClick={() => void load()}
          >
            <RefreshCw size={16} />
          </button>
          {resource === "payslips" && hr ? (
            <button
              className="button brand-navy compact"
              onClick={() => setPayroll(true)}
            >
              Run payroll
            </button>
          ) : (
            canAdd && (
              <button
                className="button brand-navy compact"
                onClick={() => setEdit({})}
              >
                <Plus size={15} />
                {resource === "id_cards" ? "Issue card" : "Add record"}
              </button>
            )
          )}
        </div>
      </header>
      {resource === "attendance" && (
        <div className="people-calendar">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span className="people-calendar-day" key={d}>
              {d}
            </span>
          ))}
          {Array.from(
            { length: (new Date(month + "-01T12:00:00Z").getUTCDay() + 6) % 7 },
            (_, i) => (
              <span key={"blank" + i} />
            ),
          )}
          {Array.from(
            {
              length: new Date(
                Number(month.slice(0, 4)),
                Number(month.slice(5)),
                0,
              ).getDate(),
            },
            (_, i) => {
              const day = month + "-" + String(i + 1).padStart(2, "0"),
                r = rows.find((r) => r.work_date === day);
              return (
                <button
                  key={day}
                  disabled={!r && !editable}
                  className={r?.status || "unrecorded"}
                  onClick={() =>
                    r
                      ? setDetail(r)
                      : setEdit({
                          data: {
                            ...initialValues("attendance"),
                            work_date: day,
                          },
                        })
                  }
                >
                  <strong>{i + 1}</strong>
                  <span>{r ? human(r.status) : "No record"}</span>
                  {r && (
                    <small>
                      {r.approval === "approved" ? "Approved" : "Pending"}
                    </small>
                  )}
                </button>
              );
            },
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="foundation-error">
          {error}
        </p>
      )}
      {loading && !rows.length ? (
        <div className="foundation-empty">
          <LoaderCircle className="spin" />
        </div>
      ) : !rows.length ? (
        <div className="foundation-empty">
          <FileText size={28} />
          <h3>No records yet</h3>
          <p>
            {canAdd
              ? "Add the first record for this employee."
              : "No records available in your access scope."}
          </p>
        </div>
      ) : (
        <div className="people-record-list">
          {rows.map((r) => (
            <article key={r.id}>
              <button
                onClick={() => {
                  setDetail(r);
                  setPassword("");
                }}
              >
                <span className="people-record-symbol">
                  {resource === "postings" ? (
                    <MapPin size={18} />
                  ) : resource === "id_cards" ? (
                    <IdCard size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                </span>
                <span>
                  <strong>{title(r)}</strong>
                  <small>{subtitle(r)}</small>
                </span>
              </button>
              <div>
                {state(r) && badge(state(r))}
                {r.expires_on && r.expires_on < today() && badge("expired")}
                {resource === "salary_structures" &&
                  r.basic_paise + r.da_paise < r.minimum_wage_paise &&
                  badge("below_wage_floor")}
                {resource === "payslips" && (
                  <button
                    aria-label="Download payslip"
                    onClick={() =>
                      download(
                        `/api/employee-print?tenant=${tenant}&employee=${employee}&kind=payslip&id=${r.id}`,
                      ).catch((e) => toast.error(e.message))
                    }
                  >
                    <Download size={17} />
                  </button>
                )}
                <button
                  aria-label={`View ${title(r)}`}
                  onClick={() => setDetail(r)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <footer className="foundation-list-footer">
        <span>
          {rows.length} of {total} records
        </span>
        {next && (
          <button disabled={loading} onClick={() => void load(next)}>
            Load more
          </button>
        )}
      </footer>
      {edit && (
        <RecordEditor
          resource={resource}
          record={edit}
          tenant={tenant}
          employee={employee}
          role={role}
          onClose={() => setEdit(null)}
          onSaved={async () => {
            setEdit(null);
            await load();
            await onChanged?.();
          }}
        />
      )}
      <Dialog
        open={!!detail}
        onOpenChange={(v) => {
          if (!v) {
            setDetail(null);
            setPassword("");
          }
        }}
      >
        <DialogContent className="foundation-dialog people-dialog">
          <DialogHeader>
            <DialogTitle>{detail && title(detail)}</DialogTitle>
            <DialogDescription>{detail && subtitle(detail)}</DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <div className="people-actions">
                {editable &&
                  resource !== "payslips" &&
                  resource !== "id_cards" && (
                    <button
                      className="button brand-navy compact"
                      onClick={() => {
                        setEdit(detail);
                        setDetail(null);
                      }}
                    >
                      Edit record
                    </button>
                  )}
                {resource === "id_cards" && state(detail) !== "revoked" && (
                  <>
                    <button
                      className="button brand-navy compact"
                      onClick={() =>
                        download(
                          `/api/employee-print?tenant=${tenant}&employee=${employee}&kind=id_card&id=${detail.id}`,
                        ).catch((e) => toast.error(e.message))
                      }
                    >
                      <Download size={15} /> Print front / back
                    </button>
                    <a
                      className="button outline compact"
                      href={"/verify/" + detail.token}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Verify QR
                    </a>
                    {editable && (
                      <button
                        className="button outline compact"
                        onClick={() => setRevoke(detail)}
                      >
                        Revoke card
                      </button>
                    )}
                  </>
                )}
                {resource === "payslips" && (
                  <>
                    <button
                      className="button brand-navy compact"
                      onClick={() =>
                        download(
                          `/api/employee-print?tenant=${tenant}&employee=${employee}&kind=payslip&id=${detail.id}`,
                        ).catch((e) => toast.error(e.message))
                      }
                    >
                      <Download size={15} /> Download PDF
                    </button>
                    <button
                      className="button outline compact"
                      onClick={async () => {
                        try {
                          const d = await post("payslip_password", {
                            tenant_id: tenant,
                            employee_id: employee,
                            id: detail.id,
                            reason: "Open my authorised payslip PDF",
                          });
                          setPassword(d.password);
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                    >
                      Show PDF password
                    </button>
                  </>
                )}
                {password && (
                  <p className="people-secret" role="status">
                    PDF password: <code>{password}</code> · hides in 30 seconds
                  </p>
                )}
              </div>
              <dl className="people-details">
                {(fields[resource] || []).map((f) => (
                  <div key={f.key}>
                    <dt>{f.label}</dt>
                    <dd>
                      {f.type === "money"
                        ? money(detail[f.key])
                        : f.type === "date"
                          ? date(detail[f.key])
                          : f.type === "boolean"
                            ? detail[f.key]
                              ? "Yes"
                              : "No"
                            : f.relation
                              ? detail[f.relation]?.name || detail[f.key] || "—"
                              : String(detail[f.key] ?? "—") || "—"}
                    </dd>
                  </div>
                ))}
                {resource === "payslips" &&
                  [
                    ["Gross", money(detail.gross_paise)],
                    ["Deductions", money(detail.deduction_paise)],
                    ["Net payable", money(detail.net_paise)],
                    ["Status", human(detail.status)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!revoke}
        onOpenChange={(v) => {
          if (!v && !busy) setRevoke(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke this identity card?</DialogTitle>
            <DialogDescription>
              The QR verification will immediately stop showing this card as
              valid. You can issue a replacement after revocation.
            </DialogDescription>
          </DialogHeader>
          <div className="people-actions">
            <button
              className="button outline"
              disabled={busy}
              onClick={() => setRevoke(null)}
            >
              Keep active
            </button>
            <button
              className="button brand-navy"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await post("id_cards", {
                    tenant_id: tenant,
                    employee_id: employee,
                    id: revoke!.id,
                    row_version: revoke!.row_version,
                    archive: true,
                  });
                  setRevoke(null);
                  setDetail(null);
                  await load();
                  toast.success("Card revoked.");
                } catch (e) {
                  toast.error((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Revoking…" : "Revoke card"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {payroll && (
        <Payroll
          tenant={tenant}
          employees={[employee]}
          onClose={() => setPayroll(false)}
          onDone={() => {
            setPayroll(false);
            void load();
          }}
        />
      )}
    </section>
  );
}
function PrivateProfile({
  tenant,
  employee,
  role,
}: {
  tenant: string;
  employee: string;
  role: string;
}) {
  const [record, setRecord] = useState<Row | null>(null),
    [revealed, setRevealed] = useState<Row | null>(null),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState<Row | null>(null),
    [loaded, setLoaded] = useState(false);
  const load = useCallback(
    () =>
      api(
        `/api/employees/private_profiles?tenant=${tenant}&employee=${employee}`,
      )
        .then((d) => {
          setRecord(d.record);
          setLoaded(true);
        })
        .catch((e) => setError(e.message)),
    [tenant, employee],
  );
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => {
    if (!revealed && !edit) return;
    const t = setTimeout(() => {
      setRevealed(null);
      setEdit(null);
      toast.info("Protected details hidden after two minutes.");
    }, 120000);
    return () => clearTimeout(t);
  }, [revealed, edit]);
  async function reveal(editing = false) {
    setBusy(true);
    setError("");
    try {
      const d = await post("reveal", {
        tenant_id: tenant,
        employee_id: employee,
        reason,
      });
      if (editing)
        setEdit(d.record || { data: initialValues("private_profiles") });
      else setRevealed(d.record);
      setReason("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="foundation-panel people-summary">
      <div className="people-section-heading">
        <div>
          <h2>
            <LockKeyhole size={22} /> Personal & KYC
          </h2>
          <p>
            Masked by default. Every reveal requires a reason and is recorded.
          </p>
        </div>
        {revealed && (
          <button className="button outline" onClick={() => setRevealed(null)}>
            Hide details
          </button>
        )}
      </div>
      {error && (
        <p className="foundation-error" role="alert">
          {error}
        </p>
      )}
      <dl className="people-details">
        {revealed
          ? fields.private_profiles.map((f) => (
              <div key={f.key}>
                <dt>{f.label}</dt>
                <dd>
                  {f.type === "date"
                    ? date(revealed.data[f.key])
                    : String(revealed.data[f.key] ?? "") || "—"}
                </dd>
              </div>
            ))
          : Object.entries(record?.masked || {}).map(([k, v]) => (
              <div key={k}>
                <dt>{human(k)}</dt>
                <dd>{String(v) || "Not recorded"}</dd>
              </div>
            ))}
      </dl>
      {loaded && !record && <p>No personal details have been recorded.</p>}
      <div className="people-reveal">
        <label htmlFor="reveal-reason">
          Reason for accessing protected details
        </label>
        <input
          id="reveal-reason"
          minLength={5}
          maxLength={300}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="For example: onboarding document review"
        />
        <div className="people-actions">
          {record && (
            <button
              className="button outline"
              disabled={busy || reason.trim().length < 5}
              onClick={() => void reveal()}
            >
              Reveal for 2 minutes
            </button>
          )}
          {hrRoles.includes(role) && (
            <button
              className="button brand-navy"
              disabled={busy || reason.trim().length < 5}
              onClick={() => void reveal(true)}
            >
              {record ? "Edit protected details" : "Add protected details"}
            </button>
          )}
        </div>
      </div>
      {edit && (
        <RecordEditor
          resource="private_profiles"
          record={edit}
          tenant={tenant}
          employee={employee}
          role={role}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            setRevealed(null);
            void load();
          }}
        />
      )}
    </section>
  );
}
function Payroll({
  tenant,
  employees,
  onClose,
  onDone,
}: {
  tenant: string;
  employees: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [month, setMonth] = useState(() => {
      const d = new Date();
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - 1);
      return d.toISOString().slice(0, 7);
    }),
    [release, setRelease] = useState(false),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="foundation-dialog">
        <DialogHeader>
          <DialogTitle>Run payroll</DialogTitle>
          <DialogDescription>
            {employees.length} employee{employees.length === 1 ? "" : "s"}{" "}
            selected. Calculated from approved attendance and effective salary
            records.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await post("payroll", {
                tenant_id: tenant,
                employee_ids: employees,
                month: month + "-01",
                release,
                reason,
              });
              toast.success(
                release ? "Payslips released." : "Draft payslips generated.",
              );
              onDone();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="foundation-fields">
            <label>
              Payroll month
              <input
                type="month"
                required
                value={month}
                max={today().slice(0, 7)}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <label>
              Action
              <select
                value={release ? "release" : "draft"}
                onChange={(e) => setRelease(e.target.value === "release")}
              >
                <option value="draft">Calculate draft</option>
                <option value="release">
                  Calculate and release to employees
                </option>
              </select>
            </label>
            <label className="full">
              Correction reason (required to replace a released payslip)
              <textarea
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          </div>
          <p className="foundation-form-note">
            All employed days must have approved attendance. Release also
            requires approved wage rules. Paid payslips cannot be replaced.
          </p>
          {error && (
            <p role="alert" className="foundation-error">
              {error}
            </p>
          )}
          <div className="foundation-form-actions">
            <button
              className="button outline"
              type="button"
              disabled={busy}
              onClick={() =>
                download("/api/employee-bulk", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tenant_id: tenant,
                    employee_ids: employees,
                    kind: "bank_advice",
                    month: month + "-01",
                  }),
                }).catch((e) => setError(e.message))
              }
            >
              Export bank advice
            </button>
            <button
              className="button outline"
              type="button"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button brand-navy" disabled={busy}>
              {busy
                ? "Calculating…"
                : release
                  ? "Release payslips"
                  : "Generate drafts"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function ImportDialog({
  tenant,
  onClose,
  onDone,
}: {
  tenant: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [report, setReport] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run(commit = false) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const f = new FormData();
      f.set("tenant", tenant);
      f.set("file", file);
      f.set("commit", String(commit));
      const d = await api("/api/employee-exchange", {
        method: "POST",
        body: f,
      });
      setReport(d);
      if (d.imported) {
        toast.success(`${d.imported} employees imported.`);
        onDone();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="foundation-dialog">
        <DialogHeader>
          <DialogTitle>Import your workforce</DialogTitle>
          <DialogDescription>
            Validate an Excel workbook before importing. Existing employees are
            never overwritten.
          </DialogDescription>
        </DialogHeader>
        <button
          className="button outline"
          onClick={() =>
            download(
              `/api/employee-exchange?tenant=${tenant}&template=true`,
            ).catch((e) => setError(e.message))
          }
        >
          <Download size={16} /> Download Excel template
        </button>
        <label className="people-file-input">
          Employee workbook (.xlsx, up to 1,000 rows)
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setReport(null);
            }}
          />
        </label>
        {error && (
          <p className="foundation-error" role="alert">
            {error}
          </p>
        )}
        {report && (
          <div className="people-import-report">
            <strong>
              {report.valid} valid rows · {report.errors.length} issues
            </strong>
            {report.errors.map((e: Row, i: number) => (
              <p key={i}>
                {e.row ? "Row " + e.row + ": " : ""}
                {e.message}
              </p>
            ))}
          </div>
        )}
        <div className="foundation-form-actions">
          <button
            className="button outline"
            disabled={busy || !file}
            onClick={() => void run()}
          >
            Validate workbook
          </button>
          <button
            className="button brand-navy"
            disabled={busy || !report?.valid || report?.errors.length > 0}
            onClick={() => void run(true)}
          >
            {busy ? "Processing…" : "Import validated employees"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Documents({
  tenant,
  employee,
  editable,
  onChanged,
}: {
  tenant: string;
  employee: string;
  editable: boolean;
  onChanged?: () => Promise<void>;
}) {
  const [rows, setRows] = useState<Row[]>([]),
    [next, setNext] = useState<string | null>(null),
    [category, setCategory] = useState("photo"),
    [title, setTitle] = useState(""),
    [expires, setExpires] = useState(""),
    [letter, setLetter] = useState(false),
    [previous, setPrevious] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(
    async (cursor?: string) => {
      try {
        const d = await api(
          `/api/employees/documents?tenant=${tenant}&employee=${employee}${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`,
        );
        setRows((r) => (cursor ? [...r, ...d.rows] : d.rows));
        setNext(d.nextCursor);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [tenant, employee],
  );
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);
  return (
    <section className="foundation-panel people-summary">
      <header className="people-section-heading">
        <div>
          <h2>Documents</h2>
          <p>Private files, expiry dates and retained versions.</p>
        </div>
        <button
          className="button outline compact"
          onClick={() =>
            download(
              `/api/employee-print?tenant=${tenant}&employee=${employee}&kind=employment_letter`,
            ).catch((e) => setError(e.message))
          }
        >
          <Download size={15} /> Employment particulars
        </button>
      </header>
      {editable && (
        <div className="people-actions">
          <button
            className="button brand-navy compact"
            onClick={() => setLetter(true)}
          >
            <Plus size={15} /> Generate appointment letter
          </button>
          <a
            className="button outline compact"
            href="https://www.epfindia.gov.in/site_docs/PDFs/Downloads_PDFs/Form11Revised.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Official Form 11 <Download size={15} />
          </a>
        </div>
      )}
      <div className="people-document-grid">
        {rows.map((r) => (
          <article key={r.id}>
            <FileText size={24} />
            <strong>{r.title}</strong>
            <small>
              {human(r.category)} · Version {r.version} ·{" "}
              {Math.ceil(r.size_bytes / 1024)} KB
            </small>
            {r.expires_on && (
              <small className={r.expires_on < today() ? "people-expired" : ""}>
                Expires {date(r.expires_on)}
              </small>
            )}
            <button
              onClick={() =>
                download(
                  `/api/employee-files?tenant=${tenant}&employee=${employee}&id=${r.id}`,
                ).catch((e) => setError(e.message))
              }
            >
              Download <Download size={15} />
            </button>
            {editable && !rows.some((v) => v.previous_id === r.id) && (
              <button
                onClick={() => {
                  setPrevious(r.id);
                  setCategory(r.category);
                  setTitle(r.title);
                }}
              >
                Upload next version
              </button>
            )}
          </article>
        ))}
      </div>
      {!rows.length && <p>No documents uploaded.</p>}
      {next && (
        <button onClick={() => void load(next)}>Load more documents</button>
      )}
      {editable && (
        <form
          className="people-upload"
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const f = new FormData(formEl);
            f.set("tenant", tenant);
            f.set("employee", employee);
            f.set("category", category);
            f.set("title", title);
            if (expires) f.set("expires_on", expires);
            if (previous) f.set("previous_id", previous);
            setBusy(true);
            setError("");
            try {
              await api("/api/employee-files", { method: "POST", body: f });
              setPrevious("");
              setTitle("");
              setExpires("");
              formEl.reset();
              await load();
              await onChanged?.();
              toast.success("Document saved.");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>
            <Upload size={18} />{" "}
            {previous ? "Upload next document version" : "Upload a document"}
          </h3>
          <div className="foundation-fields">
            <label>
              Category
              <select
                disabled={!!previous}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[
                  "photo",
                  "kyc",
                  "verification",
                  "education",
                  "offer",
                  "form_11",
                  "form_2",
                  "nomination",
                  "cctv_acknowledgement",
                  "other",
                ].map((c) => (
                  <option key={c} value={c}>
                    {human(c)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Document title
              <input
                required
                value={title}
                maxLength={150}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Expiry date (optional)
              <input
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
            </label>
            <label>
              PDF, PNG or JPEG · maximum 10 MB
              <input
                name="file"
                type="file"
                accept={
                  category === "photo"
                    ? "image/png,image/jpeg"
                    : "application/pdf,image/png,image/jpeg"
                }
                required
              />
            </label>
          </div>
          <div className="people-actions">
            {previous && (
              <button
                type="button"
                className="button outline"
                onClick={() => setPrevious("")}
              >
                Cancel new version
              </button>
            )}
            <button className="button brand-navy" disabled={busy}>
              {busy ? "Uploading…" : "Upload securely"}
              <Upload size={16} />
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="foundation-error" role="alert">
          {error}
        </p>
      )}
      {letter && (
        <Letter
          tenant={tenant}
          employee={employee}
          onClose={() => setLetter(false)}
          onDone={() => {
            setLetter(false);
            void load();
          }}
        />
      )}
    </section>
  );
}

function CheckIn({
  tenant,
  employee,
  onDone,
}: {
  tenant: string;
  employee: string;
  onDone: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(action: string) {
    setBusy(true);
    setError("");
    try {
      if (!navigator.geolocation)
        throw Error("GPS is not available on this device.");
      if (action === "check_in" && !file)
        throw Error("Take a selfie before checking in.");
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }),
      );
      let document_id = null;
      if (action === "check_in") {
        const f = new FormData();
        f.set("tenant", tenant);
        f.set("employee", employee);
        f.set("category", "selfie");
        f.set("title", "Check-in selfie");
        f.set("file", file!);
        const uploaded = await api("/api/employee-files", {
          method: "POST",
          body: f,
        });
        document_id = uploaded.id;
      }
      await post("check_attendance", {
        tenant_id: tenant,
        employee_id: employee,
        action,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        document_id,
      });
      setFile(null);
      toast.success(
        action === "check_in"
          ? "Checked in. Awaiting manager approval."
          : "Checked out.",
      );
      await onDone();
    } catch (e) {
      setError(
        (e as Error).message ||
          "Unable to read your location. Enable GPS permissions and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="foundation-panel people-summary"
      style={{ marginBottom: 20 }}
    >
      <h2>Check in at your site</h2>
      <p>
        A fresh selfie and GPS fix inside your assigned site are required. Your
        manager approves attendance before payroll.
      </p>
      <label className="people-file-input">
        Take a selfie
        <input
          type="file"
          accept="image/jpeg,image/png"
          capture="user"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>
      <div className="people-actions">
        <button
          className="button brand-navy"
          disabled={busy || !file}
          onClick={() => void submit("check_in")}
        >
          {busy ? "Checking location…" : "Check in"}
        </button>
        <button
          className="button outline"
          disabled={busy}
          onClick={() => void submit("check_out")}
        >
          Check out
        </button>
      </div>
      {error && (
        <p role="alert" className="foundation-error">
          {error}
        </p>
      )}
    </section>
  );
}

function Letter({
  tenant,
  employee,
  onClose,
  onDone,
}: {
  tenant: string;
  employee: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("Appointment letter"),
    [terms, setTerms] = useState(""),
    [issuer, setIssuer] = useState("SDC Security Services Pvt. Ltd."),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="foundation-dialog">
        <DialogHeader>
          <DialogTitle>Generate appointment letter</DialogTitle>
          <DialogDescription>
            Your reviewed terms will be combined with the employee particulars
            and saved as a versioned PDF.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("/api/employee-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tenant_id: tenant,
                  employee_id: employee,
                  title,
                  terms,
                  issuer,
                }),
              });
              toast.success("Letter saved in Documents.");
              onDone();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="foundation-fields">
            <label>
              Letter title
              <input
                required
                minLength={5}
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Issuing authority
              <input
                required
                minLength={3}
                maxLength={150}
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
              />
            </label>
            <label className="full">
              Reviewed appointment terms
              <textarea
                required
                minLength={30}
                maxLength={8000}
                rows={10}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Enter approved compensation, probation, duties, working hours, leave and notice terms for this appointment."
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="foundation-error">
              {error}
            </p>
          )}
          <div className="foundation-form-actions">
            <button
              type="button"
              className="button outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button brand-navy" disabled={busy}>
              {busy ? "Generating…" : "Generate and save PDF"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkAccount({
  tenant,
  employee,
  onClose,
  onDone,
}: {
  tenant: string;
  employee: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link employee login</DialogTitle>
          <DialogDescription>
            Link a verified, individually activated account to this employee.
            The account receives employee self-service access only.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await post("link_account", {
                tenant_id: tenant,
                employee_id: employee,
                email,
              });
              toast.success("Employee login linked.");
              onDone();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="foundation-fields">
            <label className="full">
              Verified email address
              <input
                required
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>
          <p className="foundation-form-note">
            For a new account, send an individual invitation from Supabase
            Authentication → Users → Invite. Once the employee activates it,
            link their verified email here.
          </p>
          {error && (
            <p role="alert" className="foundation-error">
              {error}
            </p>
          )}
          <div className="foundation-form-actions">
            <button
              type="button"
              className="button outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button brand-navy" disabled={busy}>
              {busy ? "Linking…" : "Link employee account"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
