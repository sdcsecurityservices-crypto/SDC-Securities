import { z } from "zod";

// Values stored in the database. Labels live in lib/careers/i18n.ts.
export const roles = ["security_guard", "lady_guard", "supervisor", "housekeeping", "facility_staff", "driver", "other"] as const;
export const genders = ["female", "male", "other", "undisclosed"] as const;
export const educations = ["below_10th", "10th", "12th", "diploma", "graduate", "postgraduate"] as const;
export const spokenLanguages = ["kannada", "hindi", "english", "tamil", "telugu", "malayalam", "marathi", "other"] as const;
export const branches = ["army", "navy", "air_force", "paramilitary", "police", "other"] as const;
export const sources = ["friend", "employee", "whatsapp", "facebook", "instagram", "youtube", "newspaper", "poster", "website", "job_portal", "other"] as const;
export const fileKinds = ["cv", "certificate", "photo", "other"] as const;
export const statuses = ["new", "screening", "interview", "verification", "offered", "joined", "on_hold", "not_selected"] as const;
export const shifts = ["day", "night", "rotating", "general"] as const;
export const openingStatuses = ["open", "paused", "closed"] as const;

export type Role = (typeof roles)[number];
export type Status = (typeof statuses)[number];

/** Version of the consent text shown on the form. Change it when the text changes. */
export const CONSENT_VERSION = "2026-10-v1";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 3;
export const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"] as const;

/** Indian mobile number to E.164 (+91XXXXXXXXXX), or null when it is not one. */
export function normalisePhone(raw: string) {
  let d = (raw || "").replace(/[^\d]/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? "+91" + d : null;
}

/** Age in whole years on today's date (India time is close enough for 18–60). */
export function ageOn(dob: string, today = new Date()) {
  const b = new Date(dob + "T00:00:00");
  if (Number.isNaN(b.getTime())) return NaN;
  let a = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) a--;
  return a;
}

const text = (max: number) => z.string().trim().max(max);
const phone = z.string().transform((v, ctx) => {
  const p = normalisePhone(v);
  if (!p) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "phone" });
  return p || "";
});

/** Server-side shape of a submission (the database validates again). */
export const applicationSchema = z
  .object({
    id: z.string().uuid(),
    opening_id: z.string().uuid().nullable().optional(),
    role: z.enum(roles),
    full_name: z.string().trim().min(2).max(100).regex(/^[^<>{}[\]\\/@#$%^*=_|~`0-9]+$/u),
    phone,
    whatsapp_same: z.boolean(),
    whatsapp_phone: z.string().max(20).optional().default(""),
    gender: z.enum(genders),
    date_of_birth: z.string().date().refine((d) => {
      const a = ageOn(d);
      return a >= 18 && a <= 60;
    }),
    home_area: text(120).min(2),
    home_district: text(80).default(""),
    preferred_work_area: text(120).default(""),
    languages: z.array(z.enum(spokenLanguages)).max(8).default([]),
    education: z.enum(educations),
    experience_years: z.number().int().min(0).max(45),
    last_employer: text(120).default(""),
    ex_serviceman: z.boolean(),
    service_branch: z.union([z.enum(branches), z.literal("")]).default(""),
    rank: text(60).default(""),
    service_years: z.number().int().min(0).max(45).nullable().optional(),
    psara_trained: z.boolean(),
    available_from: z.union([z.string().date(), z.literal("")]).default(""),
    heard_from: z.union([z.enum(sources), z.literal("")]).default(""),
    applicant_language: z.enum(["en", "kn", "hi"]),
    consent: z.literal(true),
    consent_version: z.literal(CONSENT_VERSION),
  })
  .superRefine((v, ctx) => {
    if (!v.whatsapp_same && !normalisePhone(v.whatsapp_phone))
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["whatsapp_phone"], message: "whatsapp" });
  });

export const filesSchema = z
  .array(
    z.object({
      kind: z.enum(fileKinds),
      path: z.string().regex(/^pending\/[0-9a-f-]{36}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/),
      name: z.string().max(200).default(""),
    }),
  )
  .max(4);
