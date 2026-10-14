"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase, Car, Check, Minus, Moon, Plus, Repeat, ShieldCheck, SprayCan, Sun, UserCheck, UserCog, Wrench, Clock } from "lucide-react";
import { OperationsShell, useWorkspace, request } from "@/components/operations/shell";
import { dictionaries, optionKey } from "@/lib/careers/i18n";
import { roles, shifts } from "@/lib/careers/options";
import { AreaChooser, CardChoice, Crumbs, useAreas, type CardOption } from "../shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const roleCards: Record<string, { hint: string; icon: React.ReactNode }> = {
  security_guard: { hint: "Access control, patrols and visitor management", icon: <ShieldCheck size={20} /> },
  lady_guard: { hint: "Frisking, reception and women's areas; women only", icon: <UserCheck size={20} /> },
  supervisor: { hint: "Leads a shift team and reports to the client", icon: <UserCog size={20} /> },
  housekeeping: { hint: "Cleaning and upkeep under site supervision", icon: <SprayCan size={20} /> },
  facility_staff: { hint: "Maintenance help, pantry, front office and similar", icon: <Wrench size={20} /> },
  driver: { hint: "Company or client vehicles; valid licence needed", icon: <Car size={20} /> },
  other: { hint: "Any role not listed here", icon: <Briefcase size={20} /> },
};
const shiftCards: Record<string, { hint: string; icon: React.ReactNode }> = {
  day: { hint: "Daytime duty, usually 8 am to 8 pm", icon: <Sun size={20} /> },
  night: { hint: "Night duty, usually 8 pm to 8 am", icon: <Moon size={20} /> },
  rotating: { hint: "Day and night by rota", icon: <Repeat size={20} /> },
  general: { hint: "Office hours, 9 am to 6 pm", icon: <Clock size={20} /> },
};
const roleTitle = (lang: "en" | "kn" | "hi", role: string) => (dictionaries[lang] as Record<string, string>)[optionKey("r_", role)] || "";

const blank = { role: "", title_en: "", title_kn: "", title_hi: "", area: "", shift: "", gender_requirement: "any", openings: 1, status: "open", notes: "" };
type Form = typeof blank;
const FIELDS = Object.keys(blank) as (keyof Form)[];

export default function OpeningForm({ id }: { id: string | null }) {
  return (
    <OperationsShell title={id ? "Edit opening" : "New opening"} subtitle="Open positions appear on the public careers page in English, Kannada and Hindi.">
      <Editor id={id} />
    </OperationsShell>
  );
}

function Editor({ id }: { id: string | null }) {
  const tenant = useWorkspace().tenant_id;
  const router = useRouter();
  const areas = useAreas(tenant);
  const [form, setForm] = useState<Form>(blank);
  const [record, setRecord] = useState<Row | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [errors, setErrors] = useState<Partial<Record<keyof Form | "form", string>>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let live = true;
    request(`/api/recruitment/opening?tenant=${tenant}&id=${id}`)
      .then((d) => {
        if (!live) return;
        setRecord(d.record);
        setForm(Object.fromEntries(FIELDS.map((k) => [k, d.record[k] ?? blank[k]])) as Form);
      })
      .catch((e) => live && setErrors({ form: (e as Error).message }))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [id, tenant]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));
  };
  const chooseRole = (role: string) => {
    setForm((f) => {
      // Titles follow the role until someone edits them.
      const follow = (lang: "en" | "kn" | "hi", current: string) => (!current || current === roleTitle(lang, f.role) ? roleTitle(lang, role) : current);
      return {
        ...f,
        role,
        title_en: follow("en", f.title_en),
        title_kn: follow("kn", f.title_kn),
        title_hi: follow("hi", f.title_hi),
        gender_requirement: role === "lady_guard" && f.gender_requirement === "any" ? "female" : f.gender_requirement,
      };
    });
    setErrors((e) => ({ ...e, role: undefined, title_en: undefined }));
  };

  const save = async () => {
    const e: typeof errors = {};
    if (!form.role) e.role = "Choose the role.";
    if (form.title_en.trim().length < 2) e.title_en = "Give an English title.";
    if (!form.shift) e.shift = "Choose the shift.";
    if (Object.keys(e).length) {
      setErrors({ ...e, form: "Some choices are missing." });
      return;
    }
    setBusy(true);
    try {
      await request("/api/recruitment/opening", {
        tenant_id: tenant,
        id: record?.id,
        row_version: record?.row_version,
        data: { ...form, openings: Number(form.openings) },
      });
      router.push("/recruitment?tab=openings");
    } catch (err) {
      setErrors({ form: (err as Error).message });
      setBusy(false);
    }
  };

  const shiftOptions: CardOption[] = shifts.map((s) => ({ value: s, title: (dictionaries.en as Record<string, string>)[optionKey("shift_", s)], hint: shiftCards[s].hint, icon: shiftCards[s].icon }));
  if (form.shift && !(shifts as readonly string[]).includes(form.shift)) shiftOptions.push({ value: form.shift, title: form.shift, hint: "Saved earlier as free text" });

  return (
    <div className="recruit-page">
      <div className="recruit-page-top">
        <Crumbs items={[["Recruitment", "/recruitment"], ["Openings", "/recruitment?tab=openings"], [id ? record?.title_en || "Edit opening" : "New opening", null]]} />
      </div>
      {loading ? (
        <span className="ops-skeleton" style={{ height: 320, display: "block" }} />
      ) : (
        <form
          className="recruit-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <section className="ops-card recruit-section">
            <h3>1. The job</h3>
            <CardChoice
              name="role"
              legend="Role"
              value={form.role}
              onChange={chooseRole}
              error={errors.role}
              options={roles.map((r) => ({ value: r, title: roleTitle("en", r), hint: roleCards[r].hint, icon: roleCards[r].icon }))}
            />
            <CardChoice
              name="gender"
              legend="Who can apply"
              columns="segmented"
              value={form.gender_requirement}
              onChange={(v) => set("gender_requirement", v)}
              options={[
                { value: "any", title: "Anyone" },
                { value: "female", title: "Women only" },
                { value: "male", title: "Men only" },
              ]}
            />
            <div className="recruit-stepper-field">
              <span className="recruit-area-legend">Number of posts</span>
              <div className="recruit-number">
                <button type="button" aria-label="One fewer post" disabled={Number(form.openings) <= 1} onClick={() => set("openings", Math.max(1, Number(form.openings) - 1))}>
                  <Minus size={16} />
                </button>
                <output aria-live="polite">{form.openings}</output>
                <button type="button" aria-label="One more post" disabled={Number(form.openings) >= 500} onClick={() => set("openings", Math.min(500, Number(form.openings) + 1))}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </section>

          <section className="ops-card recruit-section">
            <h3>2. Where and when</h3>
            <AreaChooser legend="Area" areas={areas} value={form.area} onChange={(v) => set("area", v)} allowNew placeholder="Search your sites and known areas" />
            <p className="recruit-muted">Pick one of your sites or an area applicants already use. Add a new area only if none fits. Leave it empty for any area.</p>
            <CardChoice name="shift" legend="Shift" value={form.shift} onChange={(v) => set("shift", v)} error={errors.shift} options={shiftOptions} />
          </section>

          <section className="ops-card recruit-section">
            <h3>3. Title in each language</h3>
            <p className="recruit-muted">Filled in from the role. Change them if the post needs more detail, e.g. “Security guard, IT park”.</p>
            <div className="ops-form recruit-titles">
              <label>
                English
                <input required maxLength={120} value={form.title_en} onChange={(e) => set("title_en", e.target.value)} aria-invalid={!!errors.title_en} />
                {errors.title_en && <small className="recruit-error">{errors.title_en}</small>}
              </label>
              <label>
                Kannada
                <input lang="kn" maxLength={120} value={form.title_kn} onChange={(e) => set("title_kn", e.target.value)} />
              </label>
              <label>
                Hindi
                <input lang="hi" maxLength={120} value={form.title_hi} onChange={(e) => set("title_hi", e.target.value)} />
              </label>
            </div>
          </section>

          <section className="ops-card recruit-section">
            <h3>4. Visibility</h3>
            <CardChoice
              name="status"
              legend="Status"
              columns="segmented"
              value={form.status}
              onChange={(v) => set("status", v)}
              options={[
                { value: "open", title: "Open", hint: "Shown on the careers page" },
                { value: "paused", title: "Paused", hint: "Hidden for now; can reopen" },
                { value: "closed", title: "Closed", hint: "Filled or cancelled" },
              ]}
            />
            <label className="recruit-note">
              <span>Internal notes (not shown publicly)</span>
              <textarea rows={3} maxLength={1000} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </label>
          </section>

          {errors.form && (
            <p className="ops-error" role="alert">
              {errors.form}
            </p>
          )}
          <div className="recruit-page-foot">
            <Link className="ops-button secondary" href="/recruitment?tab=openings">
              Cancel
            </Link>
            <button className="ops-button" disabled={busy}>
              <Check size={16} /> {busy ? "Saving…" : id ? "Save changes" : "Create opening"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
