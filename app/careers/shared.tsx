"use client";
import { useCallback, useEffect, useState } from "react";
import { initialLang, languages, saveLang, translate, type Key, type Lang } from "@/lib/careers/i18n";

/** Language state shared by the careers pages: saved choice or browser language. */
export function useCareersLang() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const l = initialLang();
    // The saved/browser language is only known in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLang(l);
    saveLang(l);
    return () => {
      document.documentElement.lang = "en-IN";
    };
  }, []);
  const choose = useCallback((l: Lang) => {
    setLang(l);
    saveLang(l);
  }, []);
  const t = useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  return { lang, choose, t };
}

export function LanguageSwitch({ lang, onChange, label }: { lang: Lang; onChange: (l: Lang) => void; label: string }) {
  return (
    <div className="careers-lang" role="group" aria-label={label}>
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.html}
          aria-pressed={lang === l.code}
          onClick={() => onChange(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/** Language switch and page action, under the website header. */
export function CareersHeader({ lang, onLang, t, action }: { lang: Lang; onLang: (l: Lang) => void; t: (k: Key) => string; action?: React.ReactNode }) {
  return (
    <div className="careers-top">
      <LanguageSwitch lang={lang} onChange={onLang} label={t("langLabel")} />
      {action && <div className="careers-top-actions">{action}</div>}
    </div>
  );
}
