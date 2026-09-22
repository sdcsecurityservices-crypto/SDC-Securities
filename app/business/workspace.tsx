"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, FileDown, IndianRupee } from "lucide-react";
import {
  OperationsShell,
  useWorkspace,
  request,
  dateLabel,
} from "@/components/operations/shell";
import { businessForms } from "@/lib/business/resources";
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
const money = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    v / 100,
  );
export default function Business() {
  return (
    <OperationsShell
      title="Finance & compliance"
      subtitle="Turn approved work into accountable billing. Keep obligations on track."
    >
      <Workspace />
    </OperationsShell>
  );
}
function Workspace() {
  const m = useWorkspace(),
    t = m.tenant_id,
    hr = ["admin", "hr_payroll"].includes(m.role);
  const [tab, setTab] = useState("invoices"),
    [rows, setRows] = useState<Row[]>([]),
    [contracts, setContracts] = useState<Row[]>([]),
    [grades, setGrades] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [edit, setEdit] = useState<Row | null>(null),
    [form, setForm] = useState<Row>({}),
    [mode, setMode] = useState(""),
    [busy, setBusy] = useState(false),
    [offset, setOffset] = useState(0),
    [total, setTotal] = useState(0),
    [receipts, setReceipts] = useState<Row[]>([]);
  const load = useCallback(async () => {
    try {
      const d = await request(
        `/api/business/${tab}?tenant=${t}&offset=${offset}`,
      );
      setRows(d.rows);
      setTotal(d.total);
      if (tab === "invoices") {
        const r = await request(`/api/business/receipts?tenant=${t}`);
        setReceipts(r.rows);
      }
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [t, tab, offset]);
  useEffect(() => {
    // Synchronize the external API/browser state when this scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    if (!hr) return;
    Promise.all(
      ["contracts", "grades"].map((r) =>
        request(`/api/foundation/${r}?tenant=${t}&limit=100`),
      ),
    )
      .then(([c, g]) => {
        setContracts(c.rows);
        setGrades(g.rows);
      })
      .catch((e) => setError(e.message));
  }, [t, hr]);
  const open = (r?: Row, action?: string) => {
    setEdit(r || {});
    setMode(action || tab);
    setError("");
    setForm(
      action === "receive"
        ? {
            invoice_id: r?.id,
            kind: "payment",
            amount_paise: 0,
            tds_paise: 0,
            reference: "",
            received_on: new Date().toISOString().slice(0, 10),
            notes: "",
          }
        : action === "convert"
          ? {
              grade_id: "",
              employee_code: "",
              joined_on: new Date().toISOString().slice(0, 10),
            }
          : tab === "invoices"
            ? {
                contract_id: "",
                month: new Date().toISOString().slice(0, 7) + "-01",
                due_on: "",
                tax_basis_points: 0,
                tax_rule_source: "",
                tax_reviewed: false,
                adjustment_paise: 0,
                adjustment_reason: "",
              }
            : tab === "compliance"
              ? {
                  title: "",
                  category: "PSARA",
                  state: "Karnataka",
                  due_on: "",
                  expires_on: null,
                  owner: m.display_name,
                  reference: "",
                  notes: "",
                  status: "pending",
                  document_id: null,
                  ...r,
                }
              : {
                  full_name: "",
                  phone: "",
                  source: "",
                  status: "sourced",
                  physical_standards: {},
                  screening_notes: "",
                  verification_notes: "",
                  ...r,
                },
    );
  };
  const action = async (resource: string, b: Row) => {
    setBusy(true);
    setError("");
    try {
      await request("/api/business/" + resource, { tenant_id: t, ...b });
      setEdit(null);
      setNotice("Saved successfully.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = () => {
    if (mode === "invoices") void action("generate", form);
    else if (mode === "receive") void action("receive", form);
    else if (mode === "convert")
      void action("convert", { id: edit?.id, ...form });
    else {
      const data = Object.fromEntries(
        businessForms[mode].map((f) => [f.key, form[f.key]]),
      );
      if (mode === "recruitment")
        data.physical_standards = form.physical_standards;
      void action(mode, { id: edit?.id, row_version: edit?.row_version, data });
    }
  };
  const available = hr
    ? [
        ["invoices", "Client invoices"],
        ["compliance", "Compliance calendar"],
        ["recruitment", "Recruitment pipeline"],
      ]
    : [
        ["invoices", "Client invoices"],
        ...(m.role !== "client_user"
          ? [["compliance", "Compliance calendar"]]
          : []),
      ];
  const amountPaid = (id: string) =>
    Number(rows.find((r) => r.id === id)?.received_paise || 0);
  const fields =
    mode === "invoices"
      ? [
          { key: "contract_id", label: "Contract", source: "contracts" },
          { key: "month", label: "Billing month (first day)", type: "date" },
          { key: "due_on", label: "Due date", type: "date" },
          {
            key: "tax_basis_points",
            label: "GST basis points (100 = 1%)",
            type: "number",
          },
          {
            key: "tax_rule_source",
            label: "Reviewed tax basis / applicable rule",
          },
          {
            key: "adjustment_paise",
            label: "Adjustment in paise (negative = penalty)",
            type: "number",
          },
          { key: "adjustment_reason", label: "Adjustment explanation" },
        ]
      : mode === "receive"
        ? [
            {
              key: "kind",
              label: "Receipt type",
              options: ["payment", "credit_note"],
            },
            { key: "amount_paise", label: "Amount in paise", type: "number" },
            {
              key: "tds_paise",
              label: "TDS withheld in paise",
              type: "number",
            },
            { key: "reference", label: "UTR / credit note reference" },
            { key: "received_on", label: "Date", type: "date" },
            { key: "notes", label: "Notes" },
          ]
        : mode === "convert"
          ? [
              { key: "grade_id", label: "Grade", source: "grades" },
              { key: "employee_code", label: "New employee code" },
              { key: "joined_on", label: "Joining date", type: "date" },
            ]
          : businessForms[mode] || [];
  return (
    <>
      <div className="ops-tabs">
        {available.map(([k, l]) => (
          <button
            key={k}
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setOffset(0);
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
      <div className="ops-toolbar">
        <h2 style={{ fontSize: 24, fontWeight: 600 }}>
          {available.find((x) => x[0] === tab)?.[1]}
        </h2>
        {hr && (
          <button className="ops-button" onClick={() => open()}>
            <Plus size={17} />
            {tab === "invoices"
              ? "Generate from approved muster"
              : "Add record"}
          </button>
        )}
      </div>
      {tab === "invoices" ? (
        <>
          <div className="ops-stats">
            <div className="ops-stat">
              <strong>
                {rows.filter((r) => r.status === "issued").length}
              </strong>
              <span>Issued invoices on this page</span>
            </div>
            <div className="ops-stat">
              <strong style={{ fontSize: 22 }}>
                {money(
                  rows
                    .filter((r) => r.status === "issued")
                    .reduce((n, r) => n + r.total_paise, 0),
                )}
              </strong>
              <span>Invoice value</span>
            </div>
            <div className="ops-stat">
              <strong style={{ fontSize: 22 }}>
                {money(receipts.reduce((n, r) => n + r.amount_paise, 0))}
              </strong>
              <span>Receipts / credits on this page</span>
            </div>
            <div className="ops-stat">
              <strong>
                {
                  rows.filter(
                    (r) =>
                      r.status === "issued" &&
                      r.due_on < new Date().toISOString().slice(0, 10) &&
                      r.total_paise > amountPaid(r.id),
                  ).length
                }
              </strong>
              <span>Overdue invoices on this page</span>
            </div>
          </div>
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Invoice / client</th>
                  <th>Period / due</th>
                  <th>Total</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.number}</strong>
                      <br />
                      {r.snapshot.client.name}
                    </td>
                    <td>
                      {dateLabel(r.month)}
                      <br />
                      Due {dateLabel(r.due_on)}
                    </td>
                    <td>{money(r.total_paise)}</td>
                    <td>{money(r.total_paise - amountPaid(r.id))}</td>
                    <td>
                      <span className="ops-badge">{r.status}</span>
                    </td>
                    <td>
                      <a
                        className="ops-button secondary"
                        href={`/api/business/invoice_pdf?tenant=${t}&id=${r.id}`}
                      >
                        <FileDown size={15} />
                        PDF
                      </a>
                      {hr && r.status === "draft" && (
                        <>
                          <button
                            className="ops-button"
                            disabled={busy}
                            onClick={() =>
                              void action("issue", {
                                id: r.id,
                                row_version: r.row_version,
                                action: "issued",
                              })
                            }
                          >
                            Issue
                          </button>
                          <button
                            className="ops-button secondary"
                            disabled={busy}
                            onClick={() =>
                              void action("issue", {
                                id: r.id,
                                row_version: r.row_version,
                                action: "void",
                              })
                            }
                          >
                            Void
                          </button>
                        </>
                      )}
                      {hr && r.status === "issued" && (
                        <button
                          className="ops-button secondary"
                          onClick={() => open(r, "receive")}
                        >
                          <IndianRupee size={15} />
                          Receipt / credit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="ops-grid">
          {rows.map((r) => (
            <article className="ops-card" key={r.id}>
              <span
                className={`ops-badge ${["ready", "verified", "converted"].includes(r.status) ? "good" : "warn"}`}
              >
                {r.status}
              </span>
              <h3>{r.title || r.full_name}</h3>
              <p>
                {r.category || r.source}
                <br />
                {r.due_on ? "Due " + dateLabel(r.due_on) : r.screening_notes}
              </p>
              {r.reference && <p>Reference: {r.reference}</p>}
              <footer>
                {hr && r.status !== "converted" && (
                  <button
                    className="ops-button secondary"
                    onClick={() => open(r)}
                  >
                    Edit
                  </button>
                )}
                {hr && tab === "recruitment" && r.status === "ready" && (
                  <button
                    className="ops-button"
                    onClick={() => open(r, "convert")}
                  >
                    Convert to trainee
                  </button>
                )}
                {r.employee_id && (
                  <a href="/employees" className="ops-button secondary">
                    Open workforce
                  </a>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
      {!rows.length && (
        <div className="ops-empty">No records available in this view.</div>
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
        <DialogContent style={{ maxWidth: 720 }}>
          <DialogHeader>
            <DialogTitle>
              {mode === "invoices"
                ? "Generate invoice"
                : mode === "receive"
                  ? "Record receipt / credit"
                  : mode === "convert"
                    ? "Convert verified candidate"
                    : edit?.id
                      ? "Edit record"
                      : "New record"}
            </DialogTitle>
            <DialogDescription>
              {mode === "invoices"
                ? "Uses approved present-day attendance, contract grade rates and overtime. Review the applicable GST treatment before issue."
                : "Access-controlled records with a retained audit trail."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="ops-form"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {fields.map((f) => (
              <label
                key={f.key}
                className={f.type === "textarea" ? "wide" : ""}
              >
                {f.label}
                {"source" in f ? (
                  <select
                    value={form[f.key] || ""}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  >
                    <option value="">Select…</option>
                    {(f.source === "grades" ? grades : contracts).map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.name || r.number}
                      </option>
                    ))}
                  </select>
                ) : "options" in f && f.options ? (
                  <select
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                  >
                    {f.options.map((x) => (
                      <option key={x}>{x}</option>
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
                    value={form[f.key] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [f.key]:
                          f.type === "number"
                            ? Number(e.target.value)
                            : e.target.value ||
                              ("optional" in f && f.optional ? null : ""),
                      })
                    }
                  />
                )}
              </label>
            ))}
            {mode === "invoices" && (
              <label
                className="wide"
                style={{ display: "flex", alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={form.tax_reviewed}
                  onChange={(e) =>
                    setForm({ ...form, tax_reviewed: e.target.checked })
                  }
                />
                Applicable tax treatment has been reviewed by finance
              </label>
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
              <button className="ops-button" disabled={busy}>
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
