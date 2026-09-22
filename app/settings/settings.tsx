"use client";
import { useEffect, useState } from "react";
import {
  OperationsShell,
  useWorkspace,
  request,
  dateLabel,
} from "@/components/operations/shell";
import { Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
// Schema-driven forms consume records validated by the resource-specific Zod API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export default function Settings() {
  return (
    <OperationsShell
      title="Workspace settings"
      subtitle="Clear permissions. Reviewed business rules. Accountable changes."
    >
      <SettingsBody />
    </OperationsShell>
  );
}
function SettingsBody() {
  const m = useWorkspace(),
    t = m.tenant_id,
    admin = m.role === "admin";
  const [tab, setTab] = useState(admin ? "members" : "preferences"),
    [rows, setRows] = useState<Row[]>([]),
    [form, setForm] = useState<Row>({}),
    [edit, setEdit] = useState(false),
    [sites, setSites] = useState<Row[]>([]),
    [clients, setClients] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [auditCursor, setAuditCursor] = useState<string | null>(null);
  const defaults: Record<string, Row> = {
    business: {
      legal_name: "SDC Security Services Pvt. Ltd.",
      gstin: "",
      billing_address: "",
      sac_code: "",
      bank_instructions: "",
      retention_days: 2555,
      external_notifications_enabled: false,
    },
    policy: {
      minimum_rest_hours: 8,
      maximum_weekly_hours: 48,
      no_show_minutes: 15,
    },
    preferences: {
      language: "English",
      email: false,
      sms: false,
      whatsapp: false,
    },
  };
  useEffect(() => {
    let live = true;
    async function load() {
      try {
        if (tab === "audit") {
          const d = await request(`/api/foundation/audit?tenant=${t}`);
          if (live) {
            setRows(d.rows);
            setAuditCursor(d.nextCursor);
          }
        } else {
          const d = await request(`/api/settings/${tab}?tenant=${t}`);
          if (live) {
            setRows(d.rows || []);
            setForm({ ...defaults[tab], ...d.record });
          }
        }
        if (admin) {
          const [s, c] = await Promise.all(
            ["sites", "clients"].map((r) =>
              request(`/api/foundation/${r}?tenant=${t}&limit=100`),
            ),
          );
          if (live) {
            setSites(s.rows);
            setClients(c.rows);
          }
        }
      } catch (e) {
        if (live) setError((e as Error).message);
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [t, tab, admin]);
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const keys = Object.keys(defaults[tab] || {}),
        data =
          tab === "members"
            ? form
            : Object.fromEntries(keys.map((k) => [k, form[k]]));
      await request("/api/settings/" + tab, { tenant_id: t, data });
      setNotice("Settings saved.");
      setEdit(false);
      if (tab === "members") {
        const d = await request(`/api/settings/members?tenant=${t}`);
        setRows(d.rows);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="ops-tabs">
        {(admin
          ? [
              ["members", "People & permissions"],
              ["business", "Invoice identity"],
              ["policy", "Roster rules"],
              ["preferences", "My notifications"],
              ["audit", "Audit log"],
            ]
          : [["preferences", "My notifications"]]
        ).map(([k, l]) => (
          <button
            key={k}
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setError("");
              setNotice("");
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {error && !edit && (
        <p className="ops-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="ops-success" role="status">
          {notice}
        </p>
      )}
      {tab === "members" ? (
        <>
          <div className="ops-toolbar">
            <p>
              Users register and verify their email before access is assigned.
            </p>
            <button
              className="ops-button"
              onClick={() => {
                setForm({
                  email: "",
                  name: "",
                  role: "employee",
                  active: true,
                  sites: [],
                  clients: [],
                });
                setEdit(true);
              }}
            >
              <Plus size={16} />
              Grant access
            </button>
          </div>
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Scope</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.display_name}</strong>
                      <br />
                      {r.email}
                    </td>
                    <td>{r.role.replaceAll("_", " ")}</td>
                    <td>{r.active ? "Active" : "Disabled"}</td>
                    <td>
                      {r.scopes.length
                        ? `${r.scopes.length} grants`
                        : "Role-wide access"}
                    </td>
                    <td>
                      <button
                        className="ops-button secondary"
                        onClick={() => {
                          setForm({
                            email: r.email,
                            name: r.display_name,
                            role: r.role,
                            active: r.active,
                            sites: r.scopes
                              .filter((s: Row) => s.site_id)
                              .map((s: Row) => s.site_id),
                            clients: r.scopes
                              .filter((s: Row) => s.client_id)
                              .map((s: Row) => s.client_id),
                          });
                          setEdit(true);
                        }}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === "audit" ? (
        <>
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {dateLabel(r.created_at)}
                      <br />
                      {new Date(r.created_at).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                    <td>{r.action}</td>
                    <td>{r.entity_type}</td>
                    <td>{r.entity_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {auditCursor && (
            <button
              className="ops-button secondary"
              style={{ marginTop: 15 }}
              onClick={async () => {
                try {
                  const d = await request(
                    `/api/foundation/audit?tenant=${t}&cursor=${encodeURIComponent(auditCursor)}`,
                  );
                  setRows((r) => [...r, ...d.rows]);
                  setAuditCursor(d.nextCursor);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Older activity
            </button>
          )}
        </>
      ) : (
        <div className="ops-card" style={{ maxWidth: 850 }}>
          <h2>
            {tab === "business"
              ? "Company invoice identity"
              : tab === "policy"
                ? "Deployment rules"
                : "Notification preferences"}
          </h2>
          <p>
            {tab === "business"
              ? "Complete the legal invoice details before generating invoices for issue. Retention is a policy setting; automated deletion requires a separate reviewed retention run."
              : tab === "policy"
                ? "Server-side checks apply these limits on every assignment and publication."
                : "In-app alerts are always available. External channels require a configured provider; selecting a preference does not enable a provider."}
          </p>
          <form
            className="ops-form"
            style={{ maxHeight: "none", marginTop: 20 }}
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            {Object.entries(defaults[tab] || {}).map(([k, v]) => (
              <label key={k} className={typeof v === "string" ? "wide" : ""}>
                {k.replaceAll("_", " ")}
                {typeof v === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={!!form[k]}
                    onChange={(e) =>
                      setForm({ ...form, [k]: e.target.checked })
                    }
                  />
                ) : k === "language" ? (
                  <select
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  >
                    {["English", "Kannada", "Hindi"].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={typeof v === "number" ? "number" : "text"}
                    value={form[k] ?? v}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [k]:
                          typeof v === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                )}
              </label>
            ))}
            <div className="ops-form-actions">
              <button className="ops-button" disabled={busy}>
                <Save size={16} />
                Save settings
              </button>
            </div>
          </form>
        </div>
      )}
      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent style={{ maxWidth: 680 }}>
          <DialogHeader>
            <DialogTitle>Manage workspace access</DialogTitle>
            <DialogDescription>
              Permissions are enforced by the database. Client and supervisor
              roles require explicit scope.
            </DialogDescription>
          </DialogHeader>
          <form
            className="ops-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <label>
              Verified account email
              <input
                type="email"
                required
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Display name
              <input
                required
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Role
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {[
                  "admin",
                  "operations_manager",
                  "senior_manager",
                  "site_lead",
                  "employee",
                  "hr_payroll",
                  "trainer",
                  "client_user",
                ].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Active
              <input
                type="checkbox"
                checked={!!form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
            </label>
            {["site_lead", "client_user"].includes(form.role) && (
              <fieldset className="wide">
                <legend>Site access</legend>
                {sites.map((s) => (
                  <label
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      margin: "8px 0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.sites?.includes(s.id)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sites: e.target.checked
                            ? [...form.sites, s.id]
                            : form.sites.filter((id: string) => id !== s.id),
                        })
                      }
                    />
                    {s.name}
                  </label>
                ))}
              </fieldset>
            )}
            {form.role === "client_user" && (
              <fieldset className="wide">
                <legend>All sites for a client</legend>
                {clients.map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      margin: "8px 0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.clients?.includes(c.id)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          clients: e.target.checked
                            ? [...form.clients, c.id]
                            : form.clients.filter((id: string) => id !== c.id),
                        })
                      }
                    />
                    {c.name}
                  </label>
                ))}
              </fieldset>
            )}
            {error && <p className="ops-error wide">{error}</p>}
            <div className="ops-form-actions">
              <button className="ops-button" disabled={busy}>
                Save access
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
