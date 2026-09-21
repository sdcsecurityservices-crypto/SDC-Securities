export type Field = {
  key: string;
  label: string;
  type?:
    | "date"
    | "number"
    | "money"
    | "textarea"
    | "boolean"
    | "datetime-local"
    | "email"
    | "password";
  options?: string[];
  relation?: string;
  required?: boolean;
  nullable?: boolean;
};
const f = (
  key: string,
  label: string,
  type?: Field["type"],
  extra: Partial<Field> = {},
): Field => ({ key, label, type, ...extra });
const options = (key: string, label: string, items: string[]) =>
  f(key, label, undefined, { options: items });
const date = (key: string, label: string, nullable = false) =>
  f(key, label, "date", { nullable, required: !nullable });
const money = (key: string, label: string) => f(key, label, "money");
const note = f("notes", "Notes", "textarea");
const relation = (
  key: string,
  label: string,
  table: string,
  nullable = false,
) =>
  f(key, label, undefined, { relation: table, nullable, required: !nullable });
export const fields: Record<string, Field[]> = {
  employees: [
    f("employee_code", "Employee ID", undefined, { required: true }),
    f("full_name", "Full name", undefined, { required: true }),
    relation("grade_id", "Designation", "grades"),
    options("category", "Employment category", [
      "full_time",
      "trainee",
      "reliever",
      "contract",
    ]),
    options("status", "Employment status", [
      "active",
      "on_leave",
      "suspended",
      "exited",
    ]),
    date("joined_on", "Joining date"),
    date("exited_on", "Exit date", true),
    relation("supervisor_id", "Reporting supervisor", "employees", true),
    note,
  ],
  private_profiles: [
    date("dob", "Date of birth", true),
    options("blood_group", "Blood group", [
      "",
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
    ]),
    f("phone", "Mobile number"),
    f("email", "Email", "email"),
    f("current_address", "Current address", "textarea"),
    f("permanent_address", "Permanent address", "textarea"),
    f("emergency_name", "Emergency contact"),
    f("emergency_phone", "Emergency phone"),
    f("nominee_name", "Nominee name"),
    f("nominee_relation", "Nominee relationship"),
    f("family_details", "Family details", "textarea"),
    f("languages", "Languages"),
    f("height_cm", "Height (cm)", "number", { nullable: true }),
    f("weight_kg", "Weight (kg)", "number", { nullable: true }),
    f("aadhaar", "Aadhaar (12 digits)"),
    f("pan", "PAN"),
    f("uan", "UAN (12 digits)"),
    f("esic", "ESIC number"),
    f("bank_holder", "Bank account holder"),
    f("bank_account", "Bank account number"),
    f("bank_ifsc", "IFSC"),
    f("education", "Education", "textarea"),
    f("ex_service_details", "Ex-servicemen / discharge details", "textarea"),
    f("arms_licence", "Arms licence number"),
    f("weapon_type", "Weapon type"),
  ],
  verifications: [
    options("kind", "Verification type", [
      "police",
      "address",
      "reference",
      "medical",
      "arms",
    ]),
    options("status", "Verification status", [
      "pending",
      "verified",
      "rejected",
      "expired",
    ]),
    date("checked_on", "Checked on", true),
    date("expires_on", "Expires on", true),
    f("issuer", "Issuing authority"),
    f("reference_mask", "Reference — last four characters only"),
    note,
  ],
  events: [
    options("kind", "Event", [
      "joined",
      "confirmed",
      "promoted",
      "transferred",
      "warning",
      "commendation",
      "exit",
      "settlement",
    ]),
    date("effective_on", "Effective date"),
    f("title", "Event title", undefined, { required: true }),
    note,
  ],
  postings: [
    relation("site_id", "Site", "sites"),
    relation("post_id", "Post", "posts"),
    relation("shift_id", "Shift", "shift_templates", true),
    relation("supervisor_id", "Posting supervisor", "employees", true),
    relation("replacement_for_id", "Replacing employee", "employees", true),
    date("starts_on", "Posting starts"),
    date("ends_on", "Posting ends", true),
    f("reason", "Reason for posting", undefined, { required: true }),
    f("feedback", "Client feedback", "textarea"),
    f("rating", "Client rating (1–5)", "number", { nullable: true }),
  ],
  attendance: [
    date("work_date", "Attendance date"),
    f("check_in", "Check-in time (IST)", "datetime-local", { nullable: true }),
    f("check_out", "Check-out time (IST)", "datetime-local", {
      nullable: true,
    }),
    options("status", "Attendance status", [
      "present",
      "absent",
      "weekly_off",
      "paid_leave",
      "unpaid_leave",
    ]),
    options("approval", "Approval", ["pending", "approved"]),
    f("overtime_minutes", "Approved overtime (minutes)", "number"),
    relation("site_id", "Site", "sites", true),
    note,
  ],
  leave_balances: [
    options("leave_type", "Leave type", ["annual", "sick", "casual"]),
    f("entitled_days", "Annual entitlement (days)", "number"),
    f("year", "Calendar year", "number"),
  ],
  leave_requests: [
    options("leave_type", "Leave type", ["annual", "sick", "casual", "unpaid"]),
    date("starts_on", "First day"),
    date("ends_on", "Last day"),
    f("reason", "Reason", undefined, { required: true }),
    options("status", "Decision", [
      "requested",
      "approved",
      "rejected",
      "cancelled",
    ]),
    f("decision_note", "Decision note", "textarea"),
  ],
  salary_structures: [
    date("starts_on", "Effective from"),
    date("ends_on", "Effective to", true),
    money("basic_paise", "Basic salary (₹ / month)"),
    money("da_paise", "DA / VDA (₹ / month)"),
    money("hra_paise", "HRA (₹ / month)"),
    money("conveyance_paise", "Conveyance (₹ / month)"),
    money("washing_paise", "Washing allowance (₹ / month)"),
    money("special_paise", "Special allowance (₹ / month)"),
    money("site_allowance_paise", "Site allowance (₹ / month)"),
    money("overtime_hour_paise", "Overtime rate (₹ / hour)"),
    f("pf_basis_points", "Employee PF rate (basis points: 100 = 1%)", "number"),
    money("pf_ceiling_paise", "PF wage ceiling (₹; 0 = uncapped)"),
    f("esi_basis_points", "Employee ESI rate (basis points)", "number"),
    money("pt_paise", "Professional tax (₹ / month)"),
    money("lwf_paise", "LWF deduction for this period (₹)"),
    money("tds_paise", "TDS for this period (₹)"),
    money("other_deduction_paise", "Other deductions / recovery (₹)"),
    money("minimum_wage_paise", "Applicable minimum Basic + DA (₹)"),
    f("rule_source", "Wage / deduction policy source", undefined, {
      required: true,
    }),
    f(
      "rule_approved",
      "I have reviewed and approved these effective rates",
      "boolean",
    ),
    note,
  ],
  advances: [
    relation("payment_id", "Paid advance payment", "payments"),
    money("principal_paise", "Principal amount (₹)"),
    money("installment_paise", "Monthly recovery (₹)"),
    date("starts_on", "Recovery starts (first day of month)"),
    options("status", "Schedule status", ["active", "closed"]),
    note,
  ],
  payments: [
    relation("payslip_id", "Released payslip", "payslips", true),
    options("kind", "Payment category", [
      "salary",
      "advance",
      "bonus",
      "arrears",
      "gratuity",
      "settlement",
      "recovery",
    ]),
    money("amount_paise", "Amount (₹)"),
    date("paid_on", "Payment date"),
    options("mode", "Payment mode", ["bank", "upi", "cheque", "cash"]),
    f("reference", "UTR / transaction reference"),
    options("status", "Payment status", [
      "pending",
      "paid",
      "failed",
      "on_hold",
    ]),
    f("reconciled", "Bank reconciliation completed", "boolean"),
    note,
  ],
  assets: [
    options("asset_type", "Asset", [
      "uniform",
      "shoes",
      "baton",
      "torch",
      "radio",
      "id_card",
      "arms",
      "other",
    ]),
    f("serial", "Serial / identifying reference"),
    f("quantity", "Quantity", "number"),
    date("issued_on", "Issued on"),
    date("returned_on", "Returned on", true),
    options("condition", "Condition", [
      "new",
      "good",
      "worn",
      "damaged",
      "lost",
    ]),
    money("recovery_paise", "Approved recovery (₹)"),
    note,
  ],
  certificates: [
    f("course_title", "Course title", undefined, { required: true }),
    f("certificate_number", "Certificate / enrolment reference"),
    date("issued_on", "Issue / assignment date"),
    date("expires_on", "Valid until", true),
    options("status", "Learning status", [
      "assigned",
      "in_progress",
      "passed",
      "failed",
      "revoked",
    ]),
    f("provider", "Training provider"),
    f("hours", "Training hours", "number"),
    note,
  ],
  id_cards: [
    date("valid_from", "Valid from"),
    date("valid_until", "Valid until"),
    f("issuer", "Issuing authority", undefined, { required: true }),
    f("blood_group", "Blood group"),
    f("emergency_phone", "Emergency phone"),
    note,
  ],
};
export function initialValues(resource: string) {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
  return Object.fromEntries(
    (fields[resource] || []).map((f) => [
      f.key,
      f.type === "boolean"
        ? false
        : f.nullable
          ? null
          : f.type === "date"
            ? today
            : f.type === "money" || f.type === "number"
              ? f.key === "quantity"
                ? 1
                : f.key === "year"
                  ? new Date().getFullYear()
                  : 0
              : f.options?.[0] || "",
    ]),
  );
}
