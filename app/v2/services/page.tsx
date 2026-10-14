import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { BASE, industryBySlug, onboarding, services } from "@/components/v2/data";
import { Accent, Btn, Chapter, CtaBand, HeroPhoto, Intro, Pic, Route, Rule, Eyebrow, Ticks, serviceIcons } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Security guards, facility management, housekeeping, manpower supply and payroll & compliance from one accountable, ex-servicemen-led partner in Bengaluru.",
};

export default function ServicesPage() {
  return (
    <>
      <HeroPhoto
        crumbs={[{ label: "Services" }]}
        eyebrow="What we deliver"
        title={
          <>
            One partner. <Accent>Every layer of protection.</Accent>
          </>
        }
        lead="Five services that work together, so you deal with one accountable partner instead of several vendors: one supervisor, one roster, one set of records."
        photo="fireDemoLine"
        actions={
          <>
            <Btn href={`${BASE}/contact#survey`}>Request a site survey</Btn>
            <Btn href="#all-services" variant="ghost">
              See all five
            </Btn>
          </>
        }
      />

      <div id="all-services">
        {services.map((s, i) => {
          const Icon = serviceIcons[s.icon];
          return (
            <section
              key={s.slug}
              className={`v2-svc-row${i % 2 ? " v2-svc-row--flip" : ""}`}
              aria-labelledby={`svc-${s.slug}`}
            >
              <div className="v2-svc-row-media v2-scan-host">
                {s.slug === "payroll-compliance" ? (
                  <img
                    src="/images/v2/deployment-planner.jpg"
                    alt="SDC Command deployment planner with named guards on each post for the week (demo data)"
                    width={1600}
                    height={705}
                    loading="lazy"
                    data-scan=""
                    className="v2-svc-row-screen"
                  />
                ) : (
                  <Pic photo={s.photo} sizes="(min-width: 900px) 55vw, 100vw" />
                )}
                <span className="v2-svc-row-num v2-mono" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="v2-svc-row-copy">
                <Rule />
                <p className="v2-eyebrow">
                  <Icon size={16} aria-hidden="true" style={{ verticalAlign: "-3px", marginRight: 8 }} />
                  {s.name}
                </p>
                <h2 className="v2-h2" id={`svc-${s.slug}`}>
                  {s.headline[0]} <Accent>{s.headline[1]}</Accent>
                </h2>
                <p className="v2-lead">{s.summary}</p>
                <div className="v2-svc-row-cols">
                  <div>
                    <p className="v2-mono-cap">What’s included</p>
                    <Ticks items={s.includes.slice(0, 5)} />
                  </div>
                  <div>
                    <p className="v2-mono-cap">Who it’s for</p>
                    <p className="v2-svc-who">{s.forWho}</p>
                    <p className="v2-svc-sectors">{s.sectors.slice(0, 3).map((x) => industryBySlug(x).name).join(" · ")}</p>
                  </div>
                </div>
                <a className="v2-link" href={`${BASE}/services/${s.slug}`}>
                  {s.name}: full details <ArrowRight size={15} aria-hidden="true" />
                </a>
              </div>
            </section>
          );
        })}
      </div>

      <Chapter tone="deep" labelledBy="svc-combine" rings>
        <div className="v2-split">
          <div>
            <Rule />
            <Eyebrow>One contract</Eyebrow>
            <h2 className="v2-h2 v2-h2--xl" id="svc-combine">
              Combine services <Accent>under one contract.</Accent>
            </h2>
            <p className="v2-lead" style={{ marginTop: 24 }}>
              When guarding, housekeeping and staffing sit with different contractors, gaps fall between them. With SDC,
              one supervisor answers for the site and one set of records covers every person on it.
            </p>
          </div>
          <ul className="v2-combine">
            {[
              ["One", "point of contact for every service"],
              ["One", "roster, checked for clashes before it goes out"],
              ["One", "client portal for attendance, incidents and reports"],
              ["One", "invoice, built from approved attendance"],
            ].map(([a, b]) => (
              <li key={b}>
                <span className="v2-mono">{a}</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </Chapter>

      <Chapter tone="canvas" labelledBy="svc-process">
        <Intro
          id="svc-process"
          eyebrow="How we take over a site"
          title={
            <>
              From first visit to full cover, <Accent>in five steps.</Accent>
            </>
          }
          lead="Timelines depend on site size, and we commit to them in writing after the survey."
        />
        <Route steps={onboarding} label="How SDC takes over a site" />
      </Chapter>

      <CtaBand />
    </>
  );
}
