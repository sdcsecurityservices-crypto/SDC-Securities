"use client";
import Link from "next/link";
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

export function CareersHeader({ lang, onLang, t, action }: { lang: Lang; onLang: (l: Lang) => void; t: (k: Key) => string; action?: React.ReactNode }) {
  return (
    <header className="careers-top">
      <Link className="brand" href="/" aria-label="SDC home">
        <img className="brand-crest" src="/brand/sdc-logo.png" alt="SDC Security Services eagle crest" width={64} height={64} />
        <strong className="brand-word" lang="en">
          <span className="bw-main">
            SDC Security &amp;
            <br />
            Facility Services
          </span>
          <span className="bw-tag">An ex-servicemen enterprise</span>
        </strong>
      </Link>
      <div className="careers-top-actions">
        <LanguageSwitch lang={lang} onChange={onLang} label={t("langLabel")} />
        {action}
      </div>
    </header>
  );
}

export function CareersFooter({ t }: { t: (k: Key, v?: Record<string, string | number>) => string }) {
  return (
    <footer className="careers-footer">
      <p>{t("privacyShort")}</p>
      <p>
        © {new Date().getFullYear()} SDC Security &amp; Facility Services Pvt. Ltd. ·{" "}
        <a href="mailto:sdcpvtltd01@gmail.com">sdcpvtltd01@gmail.com</a>
      </p>
    </footer>
  );
}
