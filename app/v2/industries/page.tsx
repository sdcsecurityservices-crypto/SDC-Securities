import type { Metadata } from "next";
import { ArrowRight, Check, Moon } from "lucide-react";
import { BASE, industries, serviceBySlug, type IndustrySlug, type PhotoKey } from "@/components/v2/data";
import { SubNav } from "@/components/v2/subnav";
import { Accent, Btn, CtaBand, Eyebrow, HeroCompact, Pic, Rule, industryIcons } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Industries we serve",
  description:
    "Security, housekeeping, facility and manpower services for healthcare, education, corporate and technology, industrial and logistics sites and residential communities across Karnataka.",
};

// Illustrative shifts, built only from how SDC works.
const scenario: Record<IndustrySlug, { title: string; beats: [string, string][] }> = {
  healthcare: {
    title: "A night shift on a maternity ward",
    beats: [
      ["22:00", "A trained lady guard checks in at the ward entrance with a selfie and GPS."],
      ["23:40", "A late visitor is checked against the ward’s post orders and logged."],
      ["06:00", "Handover. The hospital sees the night’s check-ins and rounds in its portal."],
    ],
  },
  education: {
    title: "Evening at a ladies’ hostel",
    beats: [
      ["18:00", "Lady guards take over the hostel gate and check in on the guard app."],
      ["21:00", "Rounds of the blocks, each logged from the app as it happens."],
      ["07:00", "The campus administrator reads the night’s record the next morning."],
    ],
  },
  corporate: {
    title: "Monday morning at reception",
    beats: [
      ["07:30", "Housekeeping has floors, washrooms and pantries ready."],
      ["08:45", "Visitors are received, logged and given access as the post orders say."],
      ["10:00", "The facility team sees coverage for every post in one portal."],
    ],
  },
  industrial: {
    title: "A truck at the gate after dark",
    beats: [
      ["20:10", "The gate guard checks the vehicle and material and records it."],
      ["20:30", "A round of the perimeter, logged from the guard app."],
      ["02:00", "A guard practised in live fire drills holds the next round."],
    ],
  },
  residential: {
    title: "A night shift at a gated community",
    beats: [
      ["19:00", "The night guard checks in at the gate. Deliveries are logged."],
      ["23:00", "Rounds of the towers and parking, recorded from the guard app."],
      ["07:00", "The association sees the record, not just a register."],
    ],
  },
};

const photoFor: Record<IndustrySlug, PhotoKey> = {
  healthcare: "fireDemoLine",
  education: "lineup",
  corporate: "trainer",
  industrial: "fireDrillTeam",
  residential: "fireBriefing",
};

export default function IndustriesPage() {
  const sub = [...industries.map((i) => ({ id: i.slug, label: i.name })), { id: "womens-safety", label: "Women’s safety" }];
  return (
    <>
      <HeroCompact
        crumbs={[{ label: "Industries" }]}
        eyebrow="Where we work"
        title={
          <>
            Different environments. <Accent>One standard.</Accent>
          </>
        }
        lead="A hospital ward, a college hostel, a tech campus, a warehouse gate and an apartment lobby each need something different. Here is what each needs, and how SDC serves it."
      />
      <SubNav items={sub} label="Industries on this page" />

      {industries.map((ind, idx) => {
        const Icon = industryIcons[ind.icon];
        const sc = scenario[ind.slug];
        const dark = idx % 2 === 1;
        return (
          <div key={ind.slug}>
            <section
              id={ind.slug}
              className={`v2-ind${dark ? " v2-ind--dark v2-dark" : ""}${idx % 2 ? " v2-ind--flip" : ""}`}
              aria-labelledby={`ind-${ind.slug}`}
            >
              <div className="v2-ind-media">
                <div className="v2-ind-photo">
                  <Pic photo={photoFor[ind.slug]} sizes="(min-width: 900px) 50vw, 100vw" scan={false} />
                </div>
                <aside className="v2-shift-card v2-dark" aria-label={`Scenario: ${sc.title}`}>
                  <p className="v2-mono-cap">
                    <Moon size={14} aria-hidden="true" /> Scenario · illustrative
                  </p>
                  <h3>{sc.title}</h3>
                  <ol>
                    {sc.beats.map(([t, d]) => (
                      <li key={t}>
                        <span className="v2-mono">{t}</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ol>
                </aside>
              </div>
              <div className="v2-ind-copy">
                <div className="v2-ind-head">
                  <span className="v2-ind-icon" aria-hidden="true">
                    <Icon size={26} strokeWidth={1.5} />
                  </span>
                  <span className="v2-mono-cap">
                    {String(idx + 1).padStart(2, "0")} / 05 · {ind.name}
                  </span>
                </div>
                <Rule />
                <h2 className="v2-h2 v2-h2--xl" id={`ind-${ind.slug}`}>
                  {ind.line}
                </h2>
                <p className="v2-lead">{ind.text}</p>
                <div className="v2-vs">
                  <div className="v2-vs-col">
                    <p className="v2-vs-head">Typical risks and needs</p>
                    <ul>
                      {ind.needs.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="v2-vs-col v2-vs-col--sdc">
                    <p className="v2-vs-head">How SDC serves it</p>
                    <ul>
                      {ind.serve.map((n) => (
                        <li key={n}>
                          <Check size={17} strokeWidth={2.4} aria-hidden="true" />
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="v2-mono-cap v2-mix-label">Recommended service mix</p>
                <div className="v2-mix">
                  {ind.services.map((sl) => (
                    <Btn key={sl} href={`${BASE}/services/${sl}`} variant="secondary" className="v2-btn--sm">
                      {serviceBySlug(sl).name}
                    </Btn>
                  ))}
                </div>
              </div>
            </section>
            {ind.slug === "education" && <WomensSafety />}
          </div>
        );
      })}

      <CtaBand
        title={
          <>
            Your site next. <Accent>Let’s walk it together.</Accent>
          </>
        }
      />
    </>
  );
}

function WomensSafety() {
  return (
    <section id="womens-safety" className="v2-women v2-dark" aria-labelledby="ind-women">
      <div className="v2-women-media">
        <Pic photo="classroom" sizes="100vw" scan={false} />
      </div>
      <div className="v2-wrap">
        <div className="v2-women-card">
          <Rule />
          <Eyebrow>Women’s safety</Eyebrow>
          <h2 className="v2-h2 v2-h2--xl" id="ind-women">
            Women’s spaces, <Accent>guarded by women.</Accent>
          </h2>
          <p className="v2-lead">
            Wards, maternity, OPD, ladies’ hostels and libraries need trained women officers on every shift. SDC staffs
            them with trained lady guards as a matter of course.
          </p>
          <p className="v2-women-rule">
            <span className="v2-mono">RULE</span> When a post is marked as a women’s post, SDC’s deployment planner will
            not roster anyone else on it.
          </p>
          <ul className="v2-women-posts" aria-label="Typical women’s posts">
            {["Wards", "Maternity", "OPD", "Ladies’ hostels", "Libraries"].map((t) => (
              <li key={t} className="v2-chip">
                {t}
              </li>
            ))}
          </ul>
          <div className="v2-actions">
            <Btn href={`${BASE}/contact#survey`}>Plan women’s posts for your site</Btn>
            <a className="v2-link" href={`${BASE}/services/security`}>
              Security services <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
