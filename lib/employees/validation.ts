import { z } from "zod";
const text = z.string().trim().max(4000),
  short = text.max(150),
  name = short.min(2),
  uuid = z.string().uuid(),
  nullableUuid = uuid.nullable();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s,
    "Invalid date",
  );
const nullableDate = date.nullable();
const money = z.number().int().min(0).max(100000000),
  integer = z.number().int().min(0),
  email = z.union([z.literal(""), z.string().email()]);
export const privateProfile = z
  .object({
    dob: nullableDate,
    blood_group: short,
    current_address: text,
    permanent_address: text,
    phone: text.max(25),
    email,
    emergency_name: short,
    emergency_phone: text.max(25),
    nominee_name: short,
    nominee_relation: short,
    family_details: text,
    languages: text.max(300),
    height_cm: z.number().min(0).max(250).nullable(),
    weight_kg: z.number().min(0).max(300).nullable(),
    aadhaar: z.string().regex(/^(\d{12})?$/),
    pan: z.string().regex(/^([A-Z]{5}[0-9]{4}[A-Z])?$/),
    uan: z.string().regex(/^(\d{12})?$/),
    esic: z.string().regex(/^(\d{10})?$/),
    bank_holder: short,
    bank_account: z.string().regex(/^(\d{6,20})?$/),
    bank_ifsc: z.string().regex(/^([A-Z]{4}0[A-Z0-9]{6})?$/),
    education: text,
    ex_service_details: text,
    arms_licence: short,
    weapon_type: short,
  })
  .strict();
export const definitions = {
  employees: {
    label: "Employees",
    schema: z
      .object({
        employee_code: z.string().regex(/^[A-Z0-9_-]{2,30}$/),
        full_name: name,
        grade_id: uuid,
        category: z.enum(["trainee", "full_time", "reliever", "contract"]),
        status: z.enum(["active", "on_leave", "suspended", "exited"]),
        joined_on: date,
        exited_on: nullableDate,
        supervisor_id: nullableUuid,
        membership_id: nullableUuid.optional(),
        notes: text,
      })
      .strict()
      .refine(
        (v) => (v.status === "exited") === (v.exited_on !== null),
        "Exit status needs an exit date",
      ),
  },
  verifications: {
    label: "Verification",
    schema: z
      .object({
        kind: z.enum(["police", "address", "reference", "medical", "arms"]),
        status: z.enum(["pending", "verified", "rejected", "expired"]),
        checked_on: nullableDate,
        expires_on: nullableDate,
        issuer: short,
        reference_mask: short,
        notes: text,
      })
      .strict(),
  },
  events: {
    label: "Employment history",
    schema: z
      .object({
        kind: z.enum([
          "joined",
          "confirmed",
          "promoted",
          "transferred",
          "warning",
          "commendation",
          "exit",
          "settlement",
        ]),
        effective_on: date,
        title: name,
        notes: text,
      })
      .strict(),
  },
  postings: {
    label: "Deployment history",
    schema: z
      .object({
        site_id: uuid,
        post_id: uuid,
        shift_id: nullableUuid.optional(),
        supervisor_id: nullableUuid.optional(),
        replacement_for_id: nullableUuid.optional(),
        starts_on: date,
        ends_on: nullableDate,
        reason: name,
        feedback: text,
        rating: z.number().int().min(1).max(5).nullable(),
      })
      .strict(),
  },
  attendance: {
    label: "Attendance",
    schema: z
      .object({
        work_date: date,
        check_in: z.string().datetime({ offset: true }).nullable(),
        check_out: z.string().datetime({ offset: true }).nullable(),
        status: z.enum([
          "present",
          "absent",
          "weekly_off",
          "paid_leave",
          "unpaid_leave",
        ]),
        approval: z.enum(["pending", "approved"]),
        overtime_minutes: integer.max(720),
        site_id: nullableUuid,
        notes: text,
      })
      .strict(),
  },
  leave_balances: {
    label: "Leave balance",
    schema: z
      .object({
        leave_type: z.enum(["annual", "sick", "casual"]),
        entitled_days: z.number().min(0).max(365),
        year: z.number().int().min(2020).max(2100),
      })
      .strict(),
  },
  leave_requests: {
    label: "Leave requests",
    schema: z
      .object({
        leave_type: z.enum(["annual", "sick", "casual", "unpaid"]),
        starts_on: date,
        ends_on: date,
        reason: name,
        status: z.enum(["requested", "approved", "rejected", "cancelled"]),
        decision_note: text,
      })
      .strict(),
  },
  salary_structures: {
    label: "Compensation",
    schema: z
      .object({
        starts_on: date,
        ends_on: nullableDate,
        basic_paise: money,
        da_paise: money,
        hra_paise: money,
        conveyance_paise: money,
        washing_paise: money,
        special_paise: money,
        site_allowance_paise: money,
        overtime_hour_paise: money,
        pf_basis_points: integer.max(10000),
        esi_basis_points: integer.max(10000),
        pf_ceiling_paise: money,
        pt_paise: money,
        lwf_paise: money,
        tds_paise: money,
        other_deduction_paise: money,
        minimum_wage_paise: money,
        rule_source: name,
        rule_approved: z.boolean(),
        notes: text,
      })
      .strict(),
  },
  advances: {
    label: "Advance repayment schedules",
    schema: z
      .object({
        payment_id: uuid,
        principal_paise: money.min(1),
        installment_paise: money.min(1),
        starts_on: date,
        status: z.enum(["active", "closed"]),
        notes: text,
      })
      .strict(),
  },
  payments: {
    label: "Payments",
    schema: z
      .object({
        payslip_id: nullableUuid,
        kind: z.enum([
          "salary",
          "advance",
          "bonus",
          "arrears",
          "gratuity",
          "settlement",
          "recovery",
        ]),
        amount_paise: money.min(1),
        paid_on: date,
        mode: z.enum(["bank", "upi", "cheque", "cash"]),
        reference: short,
        status: z.enum(["pending", "paid", "failed", "on_hold"]),
        reconciled: z.boolean(),
        notes: text,
      })
      .strict(),
  },
  assets: {
    label: "Assets issued",
    schema: z
      .object({
        asset_type: z.enum([
          "uniform",
          "shoes",
          "baton",
          "torch",
          "radio",
          "id_card",
          "arms",
          "other",
        ]),
        serial: short,
        quantity: integer.min(1).max(100),
        issued_on: date,
        returned_on: nullableDate,
        condition: z.enum(["new", "good", "worn", "damaged", "lost"]),
        recovery_paise: money,
        notes: text,
      })
      .strict(),
  },
  certificates: {
    label: "Training records",
    schema: z
      .object({
        course_title: name,
        certificate_number: short,
        issued_on: date,
        expires_on: nullableDate,
        status: z.enum([
          "assigned",
          "in_progress",
          "passed",
          "failed",
          "revoked",
        ]),
        provider: short,
        hours: integer.max(5000),
        notes: text,
      })
      .strict(),
  },
  id_cards: {
    label: "Identity cards",
    schema: z
      .object({
        valid_from: date,
        valid_until: date,
        issuer: name,
        blood_group: short,
        emergency_phone: text.max(25),
        notes: text,
      })
      .strict(),
  },
} as const;
export type EmployeeResource = keyof typeof definitions;
export const requestSchema = z
  .object({
    tenant_id: uuid,
    employee_id: uuid.optional(),
    id: uuid.optional(),
    row_version: integer.optional(),
    archive: z.boolean().optional(),
    data: z.record(z.unknown()).optional(),
  })
  .strict();
export const hrRoles = ["admin", "hr_payroll"];
export const operationsRoles = [
  "admin",
  "hr_payroll",
  "operations_manager",
  "senior_manager",
];
export const personalFields = Object.keys(privateProfile.shape);
