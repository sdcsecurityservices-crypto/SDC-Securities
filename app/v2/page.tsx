import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { faceVars, soundarya } from "@/components/v2/extras-data";
import { BASE, DEMO_URL, dayInSystem, facts, industries, onboarding } from "@/components/v2/data";
import { HeroSlideshow } from "@/components/v2/hero-slideshow";
import { ServiceSelector } from "@/components/v2/service-selector";
import { WallOfHonour } from "@/components/v2/wall";
import { DayTimeline } from "@/components/v2/day-timeline";
import {
  Accent,
  Btn,
  Chain,
  Chapter,
  CtaBand,
  Eyebrow,
  IndustryCard,
  Intro,
  Numeral,
  Pic,
  Route,
  Rule,
  StatBand,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: { absolute: "SDC | Security & Facility Services in Bengaluru" },
  description:
    "Ex-servicemen-led, PSARA-licensed and ISO 9001:2015-certified security, facility management, housekeeping and manpower across Karnataka, run on SDC's own platform, SDC Command.",
};

export default function HomePage() {
  return (
    <>
      <HeroSlideshow />

      {/* 1. Services: one large selector */}
      <Chapter tone="canvas" labelledBy="home-services">
        <Intro
          id="home-services"
          align="split"
          eyebrow="What we deliver"
          title={
            <>
              One partner. <Accent>Every layer</Accent> of protection.
            </>
          }
          lead="Most clients start with guarding, then hand us facility upkeep, staffing and the paperwork too. Five services, one accountable partner."
        />
        <ServiceSelector />
      </Chapter>

      {/* 2. Numbers overlapping a full-bleed photo */}
      <section className="v2-proof v2-dark" aria-labelledby="home-proof">
        <div className="v2-proof-media v2-scan-host">
          <Pic photo="academyBatch" sizes="100vw" />
        </div>
        <div className="v2-wrap">
          <div className="v2-proof-panel">
            <Rule />
            <Eyebrow>On the record</Eyebrow>
            <h2 className="v2-h2" id="home-proof">
              1000+ people on post <Accent>across Karnataka.</Accent>
            </h2>
            <StatBand items={facts} />
          </div>
        </div>
      </section>

      {/* 3. Why SDC: chain of command */}
      <Chapter tone="paper" labelledBy="home-why">
        <div className="v2-split v2-split--top">
          <div className="v2-sticky">
            <Rule />
            <Eyebrow>Why SDC</Eyebrow>
            <h2 className="v2-h2 v2-h2--xl" id="home-why">
              Discipline you can see, <Accent>shift after shift.</Accent>
            </h2>
            <p className="v2-lead" style={{ marginTop: 24 }}>
              Three reasons, in order: who leads, how you see the work, and how the paperwork is done.
            </p>
            <div className="v2-duo" aria-label="SDC leadership">
              <a className="v2-duo-card" href={`${BASE}/about#lokesh`} aria-label="Lokesh PN, Founder and Managing Director: read the full profile">
                <div className="v2-duo-photo v2-face" style={{ viewTransitionName: "vt-leader-lokesh", ...faceVars("/images/founder-lokesh.png", 91.5, 31.5) }}>
                  <img src="/images/founder-lokesh.png" alt="Lokesh PN, Founder and Managing Director" width={449} height={731} loading="lazy" />
                </div>
                <span className="v2-duo-cap">
                  <span className="v2-mono-cap">Founder &amp; MD</span>
                  <strong>Lokesh PN</strong>
                  <span className="v2-duo-line">17 years, Indian Army Air Defence. Kargil and Operation Parakram.</span>
                </span>
              </a>
              <a className="v2-duo-card" href={`${BASE}/about#vijay`} aria-label="Vijay Kumar, Director: read the full profile">
                <div className="v2-duo-photo v2-face" style={{ viewTransitionName: "vt-leader-vijay", ...faceVars("/images/director-vijay.png", 95, 26) }}>
                  <img src="/images/director-vijay.png" alt="Vijay Kumar, Director" width={560} height={995} loading="lazy" />
                </div>
                <span className="v2-duo-cap">
                  <span className="v2-mono-cap">Director</span>
                  <strong>Vijay Kumar</strong>
                  <span className="v2-duo-line">21 years in marketing and client relationships. 5,000+ customers guided.</span>
                </span>
              </a>
              <a className="v2-duo-card" href={`${BASE}/about#soundarya`} aria-label="Soundarya, Director: read the full profile">
                <div className="v2-duo-photo v2-face" style={{ viewTransitionName: "vt-leader-soundarya", ...faceVars(soundarya.photos[soundarya.photo].src, 96, 24.6) }}>
                  <img src={soundarya.photos[soundarya.photo].src} alt="Soundarya, Director" width={soundarya.photos[soundarya.photo].w} height={soundarya.photos[soundarya.photo].h} loading="lazy" />
                </div>
                <span className="v2-duo-cap">
                  <span className="v2-mono-cap">Director</span>
                  <strong>Soundarya</strong>
                  <span className="v2-duo-line">10+ years in data analytics at leading tech companies.</span>
                </span>
              </a>
              <a className="v2-duo-link" href={`${BASE}/about#leadership`}>
                Meet the leadership <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <Chain
            label="Why clients choose SDC"
            items={[
              {
                title: "Veteran-led discipline",
                text: "Founded and led by ex-servicemen. A chain of command from your site supervisor to the leadership team, and someone who answers for every post.",
                href: `${BASE}/about`,
                link: "Meet the leadership",
              },
              {
                title: "Visible on SDC Command",
                text: "Selfie and GPS check-in on every shift, patrols and incidents logged from the post, and a client portal that shows you coverage as it happens.",
                href: `${BASE}/technology`,
                link: "See SDC Command",
              },
              {
                title: "Compliance done properly",
                text: "PSARA licensed, ISO 9001:2015 certified, EPF and ESI paid for every employee, and invoices built from approved attendance.",
                href: `${BASE}/compliance`,
                link: "See the paperwork",
              },
            ]}
          />
        </div>
      </Chapter>

      {/* 4. A day in the system */}
      <Chapter tone="deep" labelledBy="home-day" rings>
        <Intro
          id="home-day"
          align="split"
          eyebrow="A day in the system"
          title={
            <>
              Every guard checks in. Every round is logged. <Accent>You see it live.</Accent>
            </>
          }
          lead="An illustrative night shift on SDC Command, from the first check-in to the morning report."
        >
          <Btn href={DEMO_URL} variant="secondary" icon="up">
            Try the interactive demo
          </Btn>
        </Intro>
        <DayTimeline items={dayInSystem} />
      </Chapter>

      {/* 5. Industries */}
      <Chapter tone="navy" labelledBy="home-ind">
        <Intro
          id="home-ind"
          align="split"
          eyebrow="Where we work"
          title={
            <>
              Different environments. <Accent>One standard.</Accent>
            </>
          }
          lead="Hospital wards, college hostels, tech campuses, warehouse gates and apartment lobbies each need something different."
        />
        <ul className="v2-ind-strip">
          {industries.map((ind, i) => (
            <IndustryCard key={ind.slug} industry={ind} index={i} />
          ))}
        </ul>
      </Chapter>

      {/* 6. Process */}
      <Chapter tone="canvas" labelledBy="home-process">
        <Intro
          id="home-process"
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

      {/* 7. Wall of honour */}
      <Chapter tone="deep" labelledBy="home-clients" className="v2-honour">
        <div className="v2-honour-head">
          <div>
            <Rule />
            <Eyebrow>Wall of honour</Eyebrow>
            <h2 className="v2-h2 v2-h2--xl" id="home-clients">
              From Namma Metro to Lamborghini Bangalore: <Accent>trusted where it matters.</Accent>
            </h2>
          </div>
          <div className="v2-honour-count">
            <Numeral value="50+" className="v2-big-num" />
            <p>organisations across Karnataka, from public infrastructure to the places people call home.</p>
          </div>
        </div>
        <WallOfHonour mode="condensed" />
        <div className="v2-honour-foot">
          <p className="v2-mono-cap">Organisations SDC has served, past and present. Logos belong to their respective owners.</p>
          <Btn href={`${BASE}/clients`} variant="secondary">
            See all clients
          </Btn>
        </div>
      </Chapter>

      {/* 8. People & careers */}
      <section className="v2-people v2-dark" aria-labelledby="home-people">
        <div className="v2-people-media v2-scan-host">
          <Pic photo="classroom" sizes="100vw" />
        </div>
        <div className="v2-wrap">
          <div className="v2-people-card">
            <Rule />
            <Eyebrow>Careers</Eyebrow>
            <h2 className="v2-h2" id="home-people">
              Served the nation. <Accent>Now serving your site.</Accent>
            </h2>
            <p className="v2-lead">
              Guards, lady guards, supervisors and facility staff, trained at our Bengaluru academy. Ex-servicemen
              especially welcome.
            </p>
            <div className="v2-actions">
              <Btn href={`${BASE}/careers`}>Careers at SDC</Btn>
              <a className="v2-link" href={`${BASE}/training`}>
                How we train <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
