"use client";
import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, ImageIcon, Loader2, MessageCircle, Paperclip, Phone, X } from "lucide-react";
import { company } from "@/lib/company";
import type { Opening } from "@/lib/careers/server";
import { optionKey, type Key } from "@/lib/careers/i18n";
import {
  ACCEPTED_MIME,
  CONSENT_VERSION,
  MAX_FILE_BYTES,
  MAX_FILES,
  ageOn,
  branches,
  educations,
  genders,
  normalisePhone,
  roles,
  sources,
  spokenLanguages,
} from "@/lib/careers/options";
import { CareersFooter, CareersHeader, useCareersLang } from "../shared";

type Form = {
  full_name: string;
  phone: string;
  whatsapp_same: boolean;
  whatsapp_phone: string;
  gender: string;
  dob_day: string;
  dob_month: string;
  dob_year: string;
  home_area: string;
  home_district: string;
  languages: string[];
  opening_id: string;
  role: string;
  preferred_work_area: string;
  available_from: string;
  heard_from: string;
  education: string;
  experience_years: string;
  last_employer: string;
  psara_trained: boolean;
  ex_serviceman: boolean;
  service_branch: string;
  rank: string;
  service_years: string;
  consent: boolean;
};
type Upload = {
  key: string;
  kind: "cv" | "certificate" | "photo";
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  path?: string;
  error?: Key;
};
type Errors = Partial<Record<keyof Form | "files" | "captcha" | "form", Key>>;

const districts = [
  "Bengaluru Urban", "Bengaluru Rural", "Bagalkot", "Ballari", "Belagavi", "Bidar", "Chamarajanagar", "Chikkaballapur",
  "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi",
  "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi",
  "Uttara Kannada", "Vijayapura", "Vijayanagara", "Yadgir",
];

const empty: Form = {
  full_name: "", phone: "", whatsapp_same: true, whatsapp_phone: "", gender: "", dob_day: "", dob_month: "", dob_year: "",
  home_area: "", home_district: "", languages: [], opening_id: "", role: "", preferred_work_area: "", available_from: "",
  heard_from: "", education: "", experience_years: "", last_employer: "", psara_trained: false, ex_serviceman: false,
  service_branch: "", rank: "", service_years: "", consent: false,
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
      );

const pad = (n: string) => n.padStart(2, "0");
const dobOf = (f: Form) => (f.dob_year && f.dob_month && f.dob_day ? `${f.dob_year}-${pad(f.dob_month)}-${pad(f.dob_day)}` : "");
const validDate = (s: string) => {
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const NAME_OK = /^[^<>{}[\]\\/@#$%^*=_|~`0-9]+$/u;
const fileSize = (b: number) => (b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1024 / 1024).toFixed(1) + " MB");
const extFor = (mime: string) => ({ "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" })[mime] || "bin";

/** Photos are resized to at most 1600 px and re-encoded as JPEG before upload. */
async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob && (blob.size < file.size || file.type !== "image/jpeg") ? blob : file;
  } catch {
    // e.g. HEIC on browsers that cannot decode it: upload the original.
    return file;
  }
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, o: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export default function ApplyForm({
  openings,
  upload,
  turnstileSiteKey,
  initialOpening,
}: {
  openings: Opening[];
  upload: { url: string; key: string } | null;
  turnstileSiteKey: string | null;
  initialOpening: string | null;
}) {
  const { lang, choose, t } = useCareersLang();
  const preset = openings.find((o) => o.id === initialOpening);
  const [form, setForm] = useState<Form>(() => ({ ...empty, opening_id: preset?.id || "", role: preset?.role || "" }));
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [files, setFiles] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [token, setToken] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [ids] = useState(() => ({ app: newId(), started: Date.now() }));
  const heading = useRef<HTMLHeadingElement>(null);
  const captchaBox = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const client = useRef<SupabaseClient | null>(null);
  const uploadCount = useRef(0);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));
  };
  const title = (o: Opening) => (lang === "kn" ? o.title_kn : lang === "hi" ? o.title_hi : "") || o.title_en;

  const go = (n: number) => {
    setStep(n);
    setErrors({});
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      heading.current?.focus({ preventScroll: true });
    });
  };

  const validate = useCallback(
    (s: number): Errors => {
      const e: Errors = {};
      if (s === 1) {
        const name = form.full_name.trim();
        if (!name) e.full_name = "required";
        else if (name.length < 2 || !NAME_OK.test(name)) e.full_name = "nameInvalid";
        if (!form.phone.trim()) e.phone = "required";
        else if (!normalisePhone(form.phone)) e.phone = "phoneInvalid";
        if (!form.whatsapp_same && !normalisePhone(form.whatsapp_phone)) e.whatsapp_phone = "phoneInvalid";
        if (!form.gender) e.gender = "required";
        const dob = dobOf(form);
        if (!dob) e.dob_year = "required";
        else if (!validDate(dob)) e.dob_year = "required";
        else {
          const a = ageOn(dob);
          if (!(a >= 18 && a <= 60)) e.dob_year = "ageInvalid";
        }
        if (form.home_area.trim().length < 2) e.home_area = "required";
      }
      if (s === 2) {
        if (!form.role) e.role = "required";
        if (form.available_from) {
          const d = new Date(form.available_from + "T00:00:00").getTime(),
            now = Date.now();
          if (!validDate(form.available_from) || d < now - 2 * 864e5 || d > now + 365 * 864e5) e.available_from = "dateInvalid";
        }
      }
      if (s === 3) {
        if (!form.education) e.education = "required";
        const x = Number(form.experience_years);
        if (form.experience_years === "") e.experience_years = "required";
        else if (!Number.isInteger(x) || x < 0 || x > 45) e.experience_years = "numberInvalid";
        if (form.ex_serviceman) {
          if (!form.service_branch) e.service_branch = "required";
          const y = Number(form.service_years);
          if (form.service_years !== "" && (!Number.isInteger(y) || y < 0 || y > 45)) e.service_years = "numberInvalid";
        }
      }
      if (s === 4) {
        if (files.some((f) => f.status === "uploading")) e.files = "uploadsPending";
        else if (files.some((f) => f.status === "error")) e.files = "err_file";
        if (!form.consent) e.consent = "consentRequired";
        if (turnstileSiteKey && !token) e.captcha = "captchaRequired";
      }
      return e;
    },
    [form, files, token, turnstileSiteKey],
  );

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) {
      setErrors({ ...e, form: "fixErrors" });
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".careers-field.has-error input, .careers-field.has-error select, .careers-field.has-error button")?.focus());
      return;
    }
    go(step + 1);
  };

  // Turnstile widget, only when both keys are configured on the server.
  useEffect(() => {
    if (!turnstileSiteKey || step !== 4) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !captchaBox.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(captchaBox.current, {
        sitekey: turnstileSiteKey,
        language: lang === "en" ? "en" : lang,
        callback: (v: string) => setToken(v),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    };
    if (window.turnstile) mount();
    else if (!document.getElementById("cf-turnstile")) {
      const s = document.createElement("script");
      s.id = "cf-turnstile";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = mount;
      document.head.appendChild(s);
    } else document.getElementById("cf-turnstile")!.addEventListener("load", mount);
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [turnstileSiteKey, step, lang]);

  const addFile = async (kind: Upload["kind"], file: File | undefined) => {
    if (!file) return;
    setErrors((e) => ({ ...e, files: undefined }));
    if (files.filter((f) => f.status !== "error").length >= MAX_FILES || uploadCount.current >= 4) {
      setErrors((e) => ({ ...e, files: "fileLimit" }));
      return;
    }
    const type = file.type || (/\.heic$/i.test(file.name) ? "image/heic" : "");
    if (!(ACCEPTED_MIME as readonly string[]).includes(type)) {
      setErrors((e) => ({ ...e, files: "fileType" }));
      return;
    }
    const key = newId();
    setFiles((l) => [...l, { key, kind, name: file.name.slice(0, 120), size: file.size, status: "uploading" }]);
    const fail = (error: Key) => setFiles((l) => l.map((f) => (f.key === key ? { ...f, status: "error", error } : f)));
    try {
      const blob = await compress(file);
      const mime = blob === file ? type : "image/jpeg";
      if (blob.size > MAX_FILE_BYTES) return fail("fileTooBig");
      if (!upload) return fail("uploadFailed");
      if (!client.current) {
        const { createClient } = await import("@supabase/supabase-js");
        client.current = createClient(upload.url, upload.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
      }
      uploadCount.current += 1;
      const path = `pending/${ids.app}/${kind}-${uploadCount.current}.${extFor(mime)}`;
      const { error } = await client.current.storage.from("sdc-careers").upload(path, blob, { contentType: mime, upsert: false });
      if (error) return fail("uploadFailed");
      setFiles((l) => l.map((f) => (f.key === key ? { ...f, status: "done", path, size: blob.size } : f)));
    } catch {
      fail("uploadFailed");
    }
  };

  const submit = async () => {
    for (const s of [1, 2, 3, 4]) {
      const e = validate(s);
      if (Object.keys(e).length) {
        go(s);
        setTimeout(() => setErrors({ ...e, form: "fixErrors" }), 0);
        return;
      }
    }
    setBusy(true);
    setErrors({});
    const application = {
      id: ids.app,
      opening_id: form.opening_id || null,
      role: form.role,
      full_name: form.full_name.trim().replace(/\s+/g, " "),
      phone: form.phone,
      whatsapp_same: form.whatsapp_same,
      whatsapp_phone: form.whatsapp_same ? "" : form.whatsapp_phone,
      gender: form.gender,
      date_of_birth: dobOf(form),
      home_area: form.home_area.trim(),
      home_district: form.home_district.trim(),
      preferred_work_area: form.preferred_work_area.trim(),
      languages: form.languages,
      education: form.education,
      experience_years: Number(form.experience_years),
      last_employer: form.last_employer.trim(),
      ex_serviceman: form.ex_serviceman,
      service_branch: form.ex_serviceman ? form.service_branch : "",
      rank: form.ex_serviceman ? form.rank.trim() : "",
      service_years: form.ex_serviceman && form.service_years !== "" ? Number(form.service_years) : null,
      psara_trained: form.psara_trained,
      available_from: form.available_from,
      heard_from: form.heard_from,
      applicant_language: lang,
      consent: true,
      consent_version: CONSENT_VERSION,
    };
    try {
      const r = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application,
          files: files.filter((f) => f.status === "done").map((f) => ({ kind: f.kind, path: f.path, name: f.name })),
          turnstile_token: token,
          website: honeypot,
          started_at: ids.started,
        }),
      });
      const d = (await r.json().catch(() => ({}))) as { reference?: string; code?: string };
      if (r.ok && d.reference) {
        setReference(d.reference);
        go(6);
        return;
      }
      const code = (d.code as string) || "server";
      const key = (["throttled", "rate", "captcha", "invalid", "file", "duplicate", "closed"].includes(code) ? "err_" + code : "err_server") as Key;
      setErrors({ form: key });
      if (code === "captcha" && widget.current && window.turnstile) {
        window.turnstile.reset(widget.current);
        setToken("");
      }
    } catch {
      setErrors({ form: "err_offline" });
    } finally {
      setBusy(false);
    }
  };

  const months = useMemo(() => {
    const locale = lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    const fmt = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2000, i, 1))));
  }, [lang]);
  const thisYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 44 }, (_, i) => String(thisYear - 18 - i)), [thisYear]);

  const err = (k: keyof Errors) => (errors[k] ? t(errors[k]!) : "");
  const steps: Key[] = ["s1", "s2", "s3", "s4"];

  if (step === 6)
    return (
      <div className="careers-page careers-apply" data-lang={lang}>
        <CareersHeader lang={lang} onLang={choose} t={t} />
        <main className="careers-form-wrap">
          <section className="careers-success" aria-live="polite">
            <CheckCircle2 size={52} strokeWidth={1.6} aria-hidden />
            <h1 ref={heading} tabIndex={-1}>
              {t("successTitle")}
            </h1>
            <p className="careers-ref-label">{t("successRef")}</p>
            <p className="careers-ref" lang="en">
              {reference}
            </p>
            <p className="careers-success-text">
              <MessageCircle size={20} aria-hidden /> {t("successText")}
            </p>
            <p className="careers-help">{t("successSave")}</p>
            <div className="careers-form-nav center">
              <a className="careers-btn navy" href="/careers">
                {t("backToCareers")}
              </a>
              <a className="careers-btn ghost-dark" href={"tel:" + company.phone}>
                <Phone size={17} aria-hidden /> {t("questions", { phone: company.phoneDisplay })}
              </a>
            </div>
          </section>
        </main>
        <CareersFooter t={t} />
      </div>
    );

  const reviewRows: [Key, string, number][] = [
    ["fullName", form.full_name, 1],
    ["phone", normalisePhone(form.phone) || form.phone, 1],
    ...(!form.whatsapp_same ? ([["whatsappPhone", normalisePhone(form.whatsapp_phone) || form.whatsapp_phone, 1]] as [Key, string, number][]) : []),
    ["gender", form.gender ? t(optionKey("g_", form.gender)) : "", 1],
    ["dob", dobOf(form) ? `${form.dob_day} ${months[Number(form.dob_month) - 1] || ""} ${form.dob_year}` : "", 1],
    ["homeArea", [form.home_area, form.home_district].filter(Boolean).join(", "), 1],
    ["languagesSpoken", form.languages.map((l) => t(optionKey("l_", l))).join(", "), 1],
    ["opening", form.opening_id ? title(openings.find((o) => o.id === form.opening_id)!) : t("openingNone"), 2],
    ["role", form.role ? t(optionKey("r_", form.role)) : "", 2],
    ["workArea", form.preferred_work_area, 2],
    ["availableFrom", form.available_from, 2],
    ["education", form.education ? t(optionKey("e_", form.education)) : "", 3],
    ["experience", form.experience_years, 3],
    ["lastEmployer", form.last_employer, 3],
    ["psara", form.psara_trained ? t("yes") : t("no"), 3],
    ["exService", form.ex_serviceman ? [t("yes"), form.service_branch && t(optionKey("b_", form.service_branch)), form.rank, form.service_years && form.service_years + " y"].filter(Boolean).join(" · ") : t("no"), 3],
    ["docsTitle", files.filter((f) => f.status === "done").map((f) => t(optionKey("k_", f.kind))).join(", ") || "—", 4],
  ];

  return (
    <div className="careers-page careers-apply" data-lang={lang}>
      <CareersHeader lang={lang} onLang={choose} t={t} />
      <main className="careers-form-wrap">
        <div className="careers-form-head">
          <a className="careers-back-link" href="/careers">
            <ArrowLeft size={16} aria-hidden /> {t("navCareers")}
          </a>
          <h1>{t("formTitle")}</h1>
          <p>{t("formSub")}</p>
        </div>
        <ol className="careers-progress" aria-label={step <= 4 ? t("stepOf", { n: step }) : t("reviewStep")}>
          {steps.map((s, i) => (
            <li key={s} className={i + 1 < step ? "done" : i + 1 === step ? "current" : ""} aria-current={i + 1 === step ? "step" : undefined}>
              <span className="careers-progress-dot" aria-hidden>
                {i + 1 < step ? <Check size={14} /> : i + 1}
              </span>
              <span className="careers-progress-label">{t(s)}</span>
            </li>
          ))}
        </ol>

        <form
          className="careers-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step <= 4) next();
            else void submit();
          }}
        >
          {/* Honeypot: hidden from people and assistive technology. */}
          <div className="careers-hp" aria-hidden="true">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </label>
          </div>

          <p className="careers-step-count">{step <= 4 ? t("stepOf", { n: step }) : t("reviewStep")}</p>
          <h2 ref={heading} tabIndex={-1}>
            {step <= 4 ? t(steps[step - 1]) : t("reviewTitle")}
          </h2>
          {errors.form && (
            <p className="careers-alert" role="alert">
              {t(errors.form)}
            </p>
          )}

          {step === 1 && (
            <>
              <Field id="full_name" label={t("fullName")} help={t("fullNameHelp")} error={err("full_name")} required>
                <input id="full_name" autoComplete="name" value={form.full_name} maxLength={100} onChange={(e) => set("full_name", e.target.value)} />
              </Field>
              <Field id="phone" label={t("phone")} help={t("phoneHelp")} error={err("phone")} required>
                <div className="careers-phone">
                  <span aria-hidden>+91</span>
                  <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
              </Field>
              <label className="careers-check">
                <input type="checkbox" checked={form.whatsapp_same} onChange={(e) => set("whatsapp_same", e.target.checked)} />
                <span>{t("whatsappSame")}</span>
              </label>
              {!form.whatsapp_same && (
                <Field id="whatsapp_phone" label={t("whatsappPhone")} error={err("whatsapp_phone")} required>
                  <div className="careers-phone">
                    <span aria-hidden>+91</span>
                    <input id="whatsapp_phone" type="tel" inputMode="numeric" maxLength={14} value={form.whatsapp_phone} onChange={(e) => set("whatsapp_phone", e.target.value)} />
                  </div>
                </Field>
              )}
              <Choice
                id="gender"
                label={t("gender")}
                required
                error={err("gender")}
                value={form.gender}
                onChange={(v) => set("gender", v)}
                options={genders.map((g) => [g, t(optionKey("g_", g))])}
              />
              <Field id="dob_day" label={t("dob")} help={t("dobHelp")} error={err("dob_year")} required group>
                <div className="careers-dob">
                  <select id="dob_day" aria-label={t("dob") + " — 1–31"} value={form.dob_day} onChange={(e) => (set("dob_day", e.target.value), setErrors((x) => ({ ...x, dob_year: undefined })))}>
                    <option value="">DD</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i} value={String(i + 1)}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <select aria-label={t("dob") + " — month"} value={form.dob_month} onChange={(e) => (set("dob_month", e.target.value), setErrors((x) => ({ ...x, dob_year: undefined })))}>
                    <option value="">MM</option>
                    {months.map((m, i) => (
                      <option key={m} value={String(i + 1)}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select aria-label={t("dob") + " — year"} value={form.dob_year} onChange={(e) => set("dob_year", e.target.value)}>
                    <option value="">YYYY</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field id="home_area" label={t("homeArea")} help={t("homeAreaHelp")} error={err("home_area")} required>
                <input id="home_area" autoComplete="address-level3" maxLength={120} value={form.home_area} onChange={(e) => set("home_area", e.target.value)} />
              </Field>
              <Field id="home_district" label={t("district")} optional={t("optional")}>
                <input id="home_district" list="careers-districts" maxLength={80} value={form.home_district} onChange={(e) => set("home_district", e.target.value)} />
                <datalist id="careers-districts">
                  {districts.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
              <fieldset className="careers-field">
                <legend>
                  {t("languagesSpoken")} <small>({t("optional")})</small>
                </legend>
                <div className="careers-chips">
                  {spokenLanguages.map((l) => (
                    <label key={l} className="careers-chip-toggle">
                      <input
                        type="checkbox"
                        checked={form.languages.includes(l)}
                        onChange={(e) => set("languages", e.target.checked ? [...form.languages, l] : form.languages.filter((x) => x !== l))}
                      />
                      <span>{t(optionKey("l_", l))}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {step === 2 && (
            <>
              {openings.length > 0 && (
                <Choice
                  id="opening_id"
                  label={t("opening")}
                  value={form.opening_id || "_any"}
                  onChange={(v) => {
                    const o = openings.find((x) => x.id === v);
                    setForm((f) => ({ ...f, opening_id: o ? o.id : "", role: o ? o.role : f.role }));
                    setErrors((e) => ({ ...e, role: undefined }));
                  }}
                  options={[
                    ...openings.map((o) => [o.id, title(o) + (o.area ? " · " + o.area : "")] as [string, string]),
                    ["_any", t("openingNone")] as [string, string],
                  ]}
                  stacked
                />
              )}
              <Choice
                id="role"
                label={t("role")}
                required
                error={err("role")}
                value={form.role}
                onChange={(v) => setForm((f) => ({ ...f, role: v, opening_id: openings.find((o) => o.id === f.opening_id)?.role === v ? f.opening_id : "" }))}
                options={roles.map((r) => [r, t(optionKey("r_", r))])}
              />
              <Field id="preferred_work_area" label={t("workArea")} help={t("workAreaHelp")} optional={t("optional")}>
                <input id="preferred_work_area" maxLength={120} value={form.preferred_work_area} onChange={(e) => set("preferred_work_area", e.target.value)} />
              </Field>
              <Field id="available_from" label={t("availableFrom")} help={t("availableHelp")} error={err("available_from")} optional={t("optional")}>
                <input id="available_from" type="date" value={form.available_from} onChange={(e) => set("available_from", e.target.value)} />
              </Field>
              <Field id="heard_from" label={t("heardFrom")} optional={t("optional")}>
                <select id="heard_from" value={form.heard_from} onChange={(e) => set("heard_from", e.target.value)}>
                  <option value="">{t("choose")}</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {t(optionKey("src_", s))}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field id="education" label={t("education")} error={err("education")} required>
                <select id="education" value={form.education} onChange={(e) => set("education", e.target.value)}>
                  <option value="">{t("choose")}</option>
                  {educations.map((s) => (
                    <option key={s} value={s}>
                      {t(optionKey("e_", s))}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="experience_years" label={t("experience")} help={t("experienceHelp")} error={err("experience_years")} required>
                <input id="experience_years" className="careers-short" type="number" inputMode="numeric" min={0} max={45} value={form.experience_years} onChange={(e) => set("experience_years", e.target.value)} />
              </Field>
              <Field id="last_employer" label={t("lastEmployer")} optional={t("optional")}>
                <input id="last_employer" maxLength={120} value={form.last_employer} onChange={(e) => set("last_employer", e.target.value)} />
              </Field>
              <YesNo id="psara_trained" label={t("psara")} value={form.psara_trained} onChange={(v) => set("psara_trained", v)} yes={t("yes")} no={t("no")} />
              <YesNo id="ex_serviceman" label={t("exService")} value={form.ex_serviceman} onChange={(v) => set("ex_serviceman", v)} yes={t("yes")} no={t("no")} />
              {form.ex_serviceman && (
                <div className="careers-subgroup">
                  <Choice
                    id="service_branch"
                    label={t("branch")}
                    required
                    error={err("service_branch")}
                    value={form.service_branch}
                    onChange={(v) => set("service_branch", v)}
                    options={branches.map((b) => [b, t(optionKey("b_", b))])}
                  />
                  <Field id="rank" label={t("rank")} optional={t("optional")}>
                    <input id="rank" maxLength={60} value={form.rank} onChange={(e) => set("rank", e.target.value)} />
                  </Field>
                  <Field id="service_years" label={t("serviceYears")} error={err("service_years")} optional={t("optional")}>
                    <input id="service_years" className="careers-short" type="number" inputMode="numeric" min={0} max={45} value={form.service_years} onChange={(e) => set("service_years", e.target.value)} />
                  </Field>
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <section className="careers-docs" aria-labelledby="docs-title">
                <h3 id="docs-title">
                  {t("docsTitle")} <small>({t("optional")})</small>
                </h3>
                <p className="careers-help">{t("docsHelp")}</p>
                <p className="careers-nocv">{t("noCvHelp")}</p>
                <p className="careers-warn">{t("doNotUpload")}</p>
                <div className="careers-upload-buttons">
                  {(
                    [
                      ["cv", "addCv", FileText, "application/pdf,image/*"],
                      ["certificate", "addCertificate", Paperclip, "application/pdf,image/*"],
                      ["photo", "addPhoto", ImageIcon, "image/*"],
                    ] as const
                  ).map(([kind, label, Icon, accept]) => (
                    <label key={kind} className="careers-upload">
                      <input
                        type="file"
                        accept={accept}
                        onChange={(e) => {
                          void addFile(kind, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                      <Icon size={20} aria-hidden />
                      <span>{t(label)}</span>
                    </label>
                  ))}
                </div>
                {errors.files && (
                  <p className="careers-error" role="alert">
                    {t(errors.files)}
                  </p>
                )}
                {files.length ? (
                  <ul className="careers-files" aria-live="polite">
                    {files.map((f) => (
                      <li key={f.key} className={f.status}>
                        {f.status === "uploading" ? <Loader2 className="careers-spin" size={18} aria-hidden /> : f.status === "done" ? <CheckCircle2 size={18} aria-hidden /> : <X size={18} aria-hidden />}
                        <span className="careers-file-name">
                          <strong>{t(optionKey("k_", f.kind))}</strong> · {f.name}
                          <small>{f.status === "uploading" ? t("uploading") : f.status === "done" ? `${t("uploaded")} · ${fileSize(f.size)}` : t(f.error || "uploadFailed")}</small>
                        </span>
                        {f.status !== "uploading" && (
                          <button type="button" className="careers-link" onClick={() => setFiles((l) => l.filter((x) => x.key !== f.key))}>
                            {t("remove")}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="careers-help">{t("noDocs")}</p>
                )}
              </section>
              <section className="careers-consent" aria-labelledby="consent-title">
                <h3 id="consent-title">{t("consentTitle")}</h3>
                <p id="consent-text">{t("consentText")}</p>
                <p>
                  <a className="careers-privacy-link" href="/v2/privacy" target="_blank" rel="noopener">
                    {t("privacyLink")}
                  </a>
                </p>
                <label className={"careers-check big" + (errors.consent ? " has-error" : "")}>
                  <input type="checkbox" checked={form.consent} aria-describedby="consent-text" aria-invalid={!!errors.consent} onChange={(e) => set("consent", e.target.checked)} />
                  <span>{t("consentAgree")}</span>
                </label>
                {errors.consent && (
                  <p className="careers-error" role="alert">
                    {t(errors.consent)}
                  </p>
                )}
              </section>
              {turnstileSiteKey && (
                <section className="careers-captcha" aria-label={t("captcha")}>
                  <div ref={captchaBox} />
                  {errors.captcha && (
                    <p className="careers-error" role="alert">
                      {t(errors.captcha)}
                    </p>
                  )}
                </section>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <p className="careers-help">{t("reviewHelp")}</p>
              <dl className="careers-review">
                {reviewRows
                  .filter(([, v]) => v)
                  .map(([k, v, s]) => (
                    <div key={k}>
                      <dt>{t(k)}</dt>
                      <dd>
                        <span>{v}</span>
                        <button type="button" className="careers-link" onClick={() => go(s)}>
                          {t("edit")}
                        </button>
                      </dd>
                    </div>
                  ))}
              </dl>
            </>
          )}

          <div className="careers-form-nav">
            {step > 1 && (
              <button type="button" className="careers-btn ghost-dark" onClick={() => go(step - 1)} disabled={busy}>
                <ArrowLeft size={18} aria-hidden /> {t("back")}
              </button>
            )}
            <button type="submit" className="careers-btn navy big" disabled={busy}>
              {step < 4 ? (
                <>
                  {t("next")} <ArrowRight size={18} aria-hidden />
                </>
              ) : step === 4 ? (
                <>
                  {t("reviewBtn")} <ArrowRight size={18} aria-hidden />
                </>
              ) : busy ? (
                <>
                  <Loader2 className="careers-spin" size={18} aria-hidden /> {t("submitting")}
                </>
              ) : (
                <>
                  {t("submit")} <Check size={18} aria-hidden />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
      <CareersFooter t={t} />
    </div>
  );
}

/** Adds aria-describedby / aria-invalid to every input and select inside a field. */
function withAria(node: ReactNode, props: Record<string, unknown>): ReactNode {
  return Children.map(node, (c) => {
    if (!isValidElement<{ children?: ReactNode }>(c)) return c;
    if (c.type === "input" || c.type === "select") return cloneElement(c, props);
    if (c.props.children && typeof c.type === "string") return cloneElement(c, {}, withAria(c.props.children, props));
    return c;
  });
}

function Field({
  id,
  label,
  help,
  error,
  required,
  optional,
  group,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  optional?: string;
  group?: boolean;
  children: React.ReactNode;
}) {
  const describe = [help && id + "-help", error && id + "-error"].filter(Boolean).join(" ") || undefined;
  return (
    <div className={"careers-field" + (error ? " has-error" : "")} role={group ? "group" : undefined} aria-labelledby={group ? id + "-label" : undefined}>
      <label htmlFor={id} id={id + "-label"}>
        {label}
        {required ? <span className="careers-req"> *</span> : optional ? <small> ({optional})</small> : null}
      </label>
      {help && (
        <p className="careers-help" id={id + "-help"}>
          {help}
        </p>
      )}
      <div className="careers-control">{withAria(children, { "aria-describedby": describe, "aria-invalid": error ? true : undefined })}</div>
      {error && (
        <p className="careers-error" id={id + "-error"} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Choice({
  id,
  label,
  options,
  value,
  onChange,
  error,
  required,
  stacked,
}: {
  id: string;
  label: string;
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  stacked?: boolean;
}) {
  return (
    <fieldset className={"careers-field" + (error ? " has-error" : "")} aria-describedby={error ? id + "-error" : undefined}>
      <legend>
        {label}
        {required && <span className="careers-req"> *</span>}
      </legend>
      <div className={"careers-choices" + (stacked ? " stacked" : "")} role="radiogroup">
        {options.map(([v, l]) => (
          <label key={v} className={"careers-choice" + (value === v ? " selected" : "")}>
            <input type="radio" name={id} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span>{l}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="careers-error" id={id + "-error"} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function YesNo({ id, label, value, onChange, yes, no }: { id: string; label: string; value: boolean; onChange: (v: boolean) => void; yes: string; no: string }) {
  return (
    <fieldset className="careers-field">
      <legend>{label}</legend>
      <div className="careers-choices two" role="radiogroup">
        {(
          [
            [true, yes],
            [false, no],
          ] as const
        ).map(([v, l]) => (
          <label key={String(v)} className={"careers-choice" + (value === v ? " selected" : "")}>
            <input type="radio" name={id} checked={value === v} onChange={() => onChange(v)} />
            <span>{l}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
