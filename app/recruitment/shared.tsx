"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Building2, Check, ChevronRight, MapPin, Plus, Search, Users, X } from "lucide-react";
import { request } from "@/components/operations/shell";
import { dictionaries, optionKey } from "@/lib/careers/i18n";

// Shared pieces for the Recruitment screens: labels, card and chip choosers,
// and the searchable area chooser. "Pick, don't type": every bounded choice is
// a card or chip; free text is only for search and genuinely new values.

const en = dictionaries.en as Record<string, string>;
export const label = (prefix: string, v: string | null | undefined) => (v ? en[optionKey(prefix, v)] || v : "—");
export const statusLabels: Record<string, string> = {
  new: "New",
  screening: "Screening",
  interview: "Interview",
  verification: "Verification",
  offered: "Offered",
  joined: "Joined",
  on_hold: "On hold",
  not_selected: "Not selected",
};
export const statusHelp: Record<string, string> = {
  new: "Not yet contacted",
  screening: "Called or being checked",
  interview: "Interview arranged",
  verification: "Documents and police check",
  offered: "Offer made, awaiting joining",
  joined: "Joined SDC; kept beyond 12 months",
  on_hold: "Good candidate, no post right now",
  not_selected: "Not suitable this time",
};
export const statusTone = (s: string) => (s === "joined" || s === "offered" ? "good" : s === "not_selected" ? "bad" : s === "new" || s === "on_hold" ? "warn" : "");
export const langNames: Record<string, string> = { en: "English", kn: "Kannada", hi: "Hindi" };
export const branchNames: Record<string, string> = { army: "Army", navy: "Navy", air_force: "Air Force", paramilitary: "Paramilitary", police: "Police", other: "Other" };
export const age = (dob: string) => {
  const b = new Date(dob + "T00:00:00"),
    n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
};
export const when = (v: string) =>
  new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const size = (b: number) => (b < 1048576 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1048576).toFixed(1) + " MB");

export function Crumbs({ items }: { items: [string, string | null][] }) {
  return (
    <nav className="recruit-crumbs" aria-label="Breadcrumb">
      {items.map(([text, href], i) => (
        <span key={text + i}>
          {i > 0 && <ChevronRight size={14} aria-hidden />}
          {href ? <Link href={href}>{text}</Link> : <b aria-current="page">{text}</b>}
        </span>
      ))}
    </nav>
  );
}

export type CardOption = { value: string; title: string; hint?: string; icon?: ReactNode };

/** Single choice as cards. Radio inputs underneath keep it keyboard-accessible. */
export function CardChoice({
  name,
  legend,
  options,
  value,
  onChange,
  columns = "auto",
  error,
}: {
  name: string;
  legend: string;
  options: CardOption[];
  value: string;
  onChange: (v: string) => void;
  columns?: "auto" | "segmented" | "wide";
  error?: string;
}) {
  return (
    <fieldset className={"recruit-cards " + columns + (error ? " has-error" : "")}>
      <legend>{legend}</legend>
      <div role="radiogroup">
        {options.map((o) => (
          <label key={o.value} className={"recruit-card" + (value === o.value ? " selected" : "")}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.icon && <span className="recruit-card-icon">{o.icon}</span>}
            <span className="recruit-card-text">
              <strong>{o.title}</strong>
              {o.hint && <small>{o.hint}</small>}
            </span>
            {value === o.value && <Check className="recruit-card-tick" size={17} aria-hidden />}
          </label>
        ))}
      </div>
      {error && (
        <p className="ops-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Single-select chips for list filters; "All" clears the filter. */
export function ChipFilter({ legend, options, value, onChange }: { legend: string; options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="recruit-chips">
      <legend>{legend}</legend>
      <div>
        {[["", "All"] as [string, string], ...options].map(([v, l]) => (
          <button key={v || "all"} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export type Areas = {
  sites: { area: string; sites: string[] }[];
  areas: { label: string; applicants: number; opening: boolean }[];
};

/** Workspace sites and known areas, loaded once per tenant. */
export function useAreas(tenant: string) {
  const [data, setData] = useState<Areas>({ sites: [], areas: [] });
  useEffect(() => {
    let live = true;
    request(`/api/recruitment/areas?tenant=${tenant}`)
      .then((d) => live && setData(d as Areas))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tenant]);
  return data;
}

type AreaOption = { key: string; value: string; title: string; hint: string; kind: "site" | "area" };

/**
 * Searchable chooser of known areas. Typing only narrows the list; a new
 * area can be added only when nothing matches (and only if allowNew).
 */
export function AreaChooser({
  legend,
  areas,
  value,
  onChange,
  allowNew,
  includeSites = true,
  placeholder = "Search sites and areas",
}: {
  legend: string;
  areas: Areas;
  value: string;
  onChange: (v: string) => void;
  allowNew?: boolean;
  includeSites?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const options = useMemo<AreaOption[]>(() => {
    const site: AreaOption[] = includeSites
      ? areas.sites.map((s) => ({
          key: "s" + s.area,
          value: s.area,
          title: s.area,
          hint: (s.sites.length === 1 ? "Site: " : `${s.sites.length} sites: `) + s.sites.slice(0, 3).join(", ") + (s.sites.length > 3 ? "…" : ""),
          kind: "site",
        }))
      : [];
    const seen = new Set(site.map((s) => s.value.toLowerCase()));
    const siteHint = new Map(site.map((s) => [s.value.toLowerCase(), s]));
    const known: AreaOption[] = areas.areas
      .filter((a) => {
        const s = siteHint.get(a.label.toLowerCase());
        if (s && a.applicants) s.hint = `${a.applicants} applicant${a.applicants === 1 ? "" : "s"} · ` + s.hint;
        return !seen.has(a.label.toLowerCase());
      })
      .map((a) => ({
        key: "a" + a.label,
        value: a.label,
        title: a.label,
        hint: [a.applicants ? `${a.applicants} applicant${a.applicants === 1 ? "" : "s"}` : "", a.opening ? "used by an opening" : ""].filter(Boolean).join(" · ") || "Known area",
        kind: "area",
      }));
    return [...site, ...known];
  }, [areas, includeSites]);
  const q = query.trim().toLowerCase();
  const shown = (q ? options.filter((o) => (o.title + " " + o.hint).toLowerCase().includes(q)) : options).slice(0, 40);
  const exact = options.some((o) => o.value.toLowerCase() === q);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="recruit-area" ref={box}>
      <span className="recruit-area-legend">{legend}</span>
      {value ? (
        <div className="recruit-area-current">
          <MapPin size={16} aria-hidden />
          <strong>{value}</strong>
          <button type="button" className="ops-button secondary" onClick={() => setOpen(true)}>
            Change
          </button>
          <button type="button" className="recruit-icon-button" aria-label="Clear area" onClick={() => onChange("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}
      {(!value || open) && (
        <div className="recruit-area-pick">
          <label className="recruit-search-box">
            <Search size={16} aria-hidden />
            <span className="sr-only">{legend}</span>
            <input
              value={query}
              placeholder={placeholder}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (shown[0]) pick(shown[0].value);
                }
              }}
              aria-expanded={open}
              aria-controls="recruit-area-list"
              role="combobox"
              aria-autocomplete="list"
            />
          </label>
          {open && (
            <ul className="recruit-area-list" id="recruit-area-list" role="listbox">
              {shown.map((o) => (
                <li key={o.key} role="option" aria-selected={o.value === value}>
                  <button type="button" onClick={() => pick(o.value)}>
                    {o.kind === "site" ? <Building2 size={16} aria-hidden /> : <Users size={16} aria-hidden />}
                    <span>
                      <strong>{o.title}</strong>
                      <small>{o.hint}</small>
                    </span>
                  </button>
                </li>
              ))}
              {!shown.length && !allowNew && <li className="recruit-area-empty">No known area matches “{query}”.</li>}
              {allowNew && q.length >= 2 && !exact && !shown.length && (
                <li>
                  <button type="button" className="recruit-area-new" onClick={() => pick(query.trim().replace(/\s+/g, " "))}>
                    <Plus size={16} aria-hidden />
                    <span>
                      <strong>Add “{query.trim()}” as a new area</strong>
                      <small>Nothing above fits, so this will be saved as a new area.</small>
                    </span>
                  </button>
                </li>
              )}
              {allowNew && q.length < 2 && !shown.length && <li className="recruit-area-empty">Type an area name to search.</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
