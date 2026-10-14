"use client";
import { ArrowRight, BadgeCheck, GraduationCap, HeartPulse, Medal, MessageCircle, Phone, Shirt, TrendingUp, MapPin, Clock, Users } from "lucide-react";
import { company, whatsappLink } from "@/lib/company";
import type { Opening } from "@/lib/careers/server";
import { optionKey } from "@/lib/careers/i18n";
import { shifts } from "@/lib/careers/options";
import { CareersFooter, CareersHeader, useCareersLang } from "./shared";

const perks = [
  { icon: HeartPulse, t: "perkEpfT", d: "perkEpfD" },
  { icon: GraduationCap, t: "perkTrainT", d: "perkTrainD" },
  { icon: Shirt, t: "perkUniformT", d: "perkUniformD" },
  { icon: TrendingUp, t: "perkGrowT", d: "perkGrowD" },
  { icon: BadgeCheck, t: "perkLeadT", d: "perkLeadD" },
  { icon: Medal, t: "perkExT", d: "perkExD" },
] as const;

export default function CareersHome({ openings }: { openings: Opening[] }) {
  const { lang, choose, t } = useCareersLang();
  const title = (o: Opening) => (lang === "kn" ? o.title_kn : lang === "hi" ? o.title_hi : "") || o.title_en;
  return (
    <div className="careers-page" data-lang={lang}>
      <CareersHeader
        lang={lang}
        onLang={choose}
        t={t}
        action={
          <a className="careers-btn gold careers-top-apply" href="/careers/apply">
            {t("applyNow")}
          </a>
        }
      />
      <main>
        <section className="careers-hero">
          <div className="careers-hero-copy">
            <p className="careers-eyebrow">{t("heroEyebrow")}</p>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroText")}</p>
            <div className="careers-hero-actions">
              <a className="careers-btn gold big" href="/careers/apply">
                {t("applyNow")} <ArrowRight size={20} aria-hidden />
              </a>
              <a className="careers-btn ghost" href={whatsappLink("Hello SDC, I would like to apply for a job. My name is ")} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} aria-hidden /> {t("whatsappUs")}
              </a>
            </div>
            <p className="careers-hero-note">{t("noCvNote")}</p>
          </div>
          <figure className="careers-hero-photo">
            <img src="/images/team/guards-and-lady-guards.jpg" alt="SDC guards and lady guards standing in line in uniform" width={1600} height={1174} />
          </figure>
        </section>

        <section className="careers-section" aria-labelledby="careers-open">
          <h2 id="careers-open">{t("openTitle")}</h2>
          {openings.length ? (
            <ul className="careers-openings">
              {openings.map((o) => (
                <li key={o.id} className="careers-opening">
                  <div>
                    <h3>{title(o)}</h3>
                    <p className="careers-opening-meta">
                      <span>{t(optionKey("r_", o.role))}</span>
                      {o.area && (
                        <span>
                          <MapPin size={14} aria-hidden /> {o.area}
                        </span>
                      )}
                      {o.shift && (
                        <span>
                          <Clock size={14} aria-hidden /> {(shifts as readonly string[]).includes(o.shift) ? t(optionKey("shift_", o.shift)) : o.shift}
                        </span>
                      )}
                      <span>
                        <Users size={14} aria-hidden /> {o.openings === 1 ? t("oneOpening") : t("openingsCount", { n: o.openings })}
                      </span>
                      {o.gender_requirement !== "any" && <span className="careers-chip">{o.gender_requirement === "female" ? t("womenOnly") : t("menOnly")}</span>}
                    </p>
                  </div>
                  <a className="careers-btn navy" href={`/careers/apply?opening=${o.id}`} aria-label={`${t("applyFor")}: ${title(o)}`}>
                    {t("applyFor")} <ArrowRight size={17} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="careers-empty">
              <p>{t("openEmpty")}</p>
              <a className="careers-btn navy" href="/careers/apply">
                {t("applyNow")} <ArrowRight size={17} aria-hidden />
              </a>
            </div>
          )}
        </section>

        <section className="careers-section careers-why" aria-labelledby="careers-why">
          <h2 id="careers-why">{t("whyTitle")}</h2>
          <ul className="careers-perk-grid">
            {perks.map((p) => (
              <li key={p.t} className="careers-perk">
                <span className="careers-perk-icon">
                  <p.icon size={22} strokeWidth={1.7} aria-hidden />
                </span>
                <h3>{t(p.t)}</h3>
                <p>{t(p.d)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="careers-section" aria-labelledby="careers-how">
          <h2 id="careers-how">{t("stepsTitle")}</h2>
          <ol className="careers-how">
            {(["how1", "how2", "how3", "how4"] as const).map((k, i) => (
              <li key={k}>
                <span aria-hidden>{i + 1}</span>
                <p>{t(k)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="careers-cta">
          <h2>{t("heroTitle")}</h2>
          <div className="careers-hero-actions">
            <a className="careers-btn gold big" href="/careers/apply">
              {t("applyOnline")} <ArrowRight size={20} aria-hidden />
            </a>
            <a className="careers-btn ghost" href={"tel:" + company.phone}>
              <Phone size={17} aria-hidden /> {t("callUs", { phone: company.phoneDisplay })}
            </a>
          </div>
        </section>
      </main>
      <CareersFooter t={t} />
    </div>
  );
}
