import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import {
  BASE,
  DEMO_URL,
  SURVEY_URL,
  facts,
  featuredClients,
  industries,
  serviceBySlug,
  trainingCycle,
} from "@/components/v2/data";
import {
  Accent,
  ButtonLink,
  CheckList,
  CredentialsStrip,
  CtaBand,
  Eyebrow,
  IndustryCard,
  LogoTile,
  Photo,
  Rings,
  Screen,
  Section,
  SectionHead,
  ServiceCard,
  StatBand,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: { absolute: "SDC | Security & Facility Services in Bengaluru" },
  description:
    "Ex-servicemen-led, PSARA-licensed and ISO 9001:2015-certified security, facility management, housekeeping and manpower services across Karnataka, run with SDC's own technology.",
};

const problems = [
  {
    problem: "Empty posts nobody notices",
    detail: "A guard does not turn up, and the client finds out only when something happens.",
    answer: "Selfie and GPS check-in on every shift, and a planner that forecasts shortfalls 14 days ahead.",
  },
  {
    problem: "No view of what happens on site",
    detail: "Paper registers and phone calls, with nothing to check them against.",
    answer: "A client portal with coverage, attendance, incidents and reports for your sites.",
  },
  {
    problem: "Untrained people on sensitive posts",
    detail: "Hospitals, campuses and plants need people prepared for that site.",
    answer: "A five-stage training cycle, and certificates that expire and block rostering when they lapse.",
  },
  {
    problem: "Compliance risk on the client",
    detail: "Unpaid PF and ESI, missing records and unverified staff become the client’s problem.",
    answer: "EPF and ESI paid for every employee, background checks on file and payroll from approved attendance.",
  },
];

const pillars = [
  ["Leadership that takes ownership", "A veteran-led chain of command, with clear responsibility from your site supervisor to the leadership team."],
  ["Prepared people, every day", "Induction, site, industry and refresher training at SDC’s academy, with a record behind every certificate."],
  ["A more connected standard", "SDC Command, our own platform, puts rosters, attendance, incidents and records in one place you can see."],
];

export default function HomePage() {
  const teaser = ["security", "facility-management", "manpower", "payroll-compliance"] as const;
  return (
    <>
      <section className="v2-hero" aria-labelledby="v2-home-title">
        <img
          className="v2-hero-bg"
          src="/images/team/assembly-leadership.jpg"
          alt="SDC guards, lady guards and supervisors lined up at morning assembly with the company's leadership in front"
          width={1600}
          height={1066}
        />
        <Rings className="v2-rings--hero-home" />
        <div className="v2-container v2-hero-inner">
          <div className="v2-hero-copy">
            <Eyebrow>Veteran led · Technology enabled</Eyebrow>
            <h1 id="v2-home-title" className="v2-display">
              Human vigilance.
              <br />
              <Accent>Machine intelligence.</Accent>
            </h1>
            <p className="v2-hero-lead">
              Security, facility management, housekeeping and manpower services for Karnataka, run with military
              discipline and our own technology.
            </p>
            <div className="v2-actions">
              <ButtonLink href={SURVEY_URL}>Book a free site survey</ButtonLink>
              <ButtonLink href={`${BASE}/services`} variant="ghost">
                Explore our services
              </ButtonLink>
            </div>
            <ul className="v2-proof" aria-label="At a glance">
              <li>
                <ShieldCheck size={16} aria-hidden="true" />
                Ex-servicemen led
              </li>
              <li>
                <BadgeCheck size={16} aria-hidden="true" />
                PSARA licensed · ISO 9001:2015
              </li>
              <li>
                <MapPin size={16} aria-hidden="true" />
                Bengaluru, Karnataka
              </li>
            </ul>
          </div>
          <aside className="v2-hero-card" aria-label="Our promise">
            <p className="v2-tag">Our promise</p>
            <p className="v2-hero-card-title">
              The right people. <Accent>Where it matters.</Accent>
            </p>
            <p>
              Founded and led by ex-servicemen, SDC brings a service-first mindset to every deployment, and stays
              accountable for it from the first shift to the last.
            </p>
            <Link href={`${BASE}/about`} className="v2-text-link">
              Our story <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </section>

      <div className="v2-statwrap">
        <div className="v2-container">
          <StatBand items={facts} />
        </div>
      </div>

      <Section tone="white" labelledBy="home-services">
        <SectionHead
          id="home-services"
          eyebrow="What we deliver"
          title={
            <>
              One partner. <Accent>Every layer of protection.</Accent>
            </>
          }
          lead="From the people at your gate to the systems behind them. Most clients start with guarding, then hand us facility upkeep, staffing and the paperwork too."
        >
          <Link href={`${BASE}/services/housekeeping`} className="v2-text-link">
            Also: housekeeping <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </SectionHead>
        <div className="v2-grid v2-grid--4">
          {teaser.map((slug, i) => (
            <ServiceCard key={slug} service={serviceBySlug(slug)} index={i} />
          ))}
        </div>
      </Section>

      <Section tone="deep" labelledBy="home-problem" rings="right">
        <SectionHead
          id="home-problem"
          eyebrow="The problem we solve"
          title={
            <>
              Where security contracts <Accent>usually go wrong.</Accent>
            </>
          }
          lead="Most facility heads have lived through two or three of these. Each one has an answer built into how SDC works."
        />
        <ol className="v2-problems">
          {problems.map((p, i) => (
            <li key={p.problem}>
              <div className="v2-problem">
                <span className="v2-problem-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{p.problem}</h3>
                  <p>{p.detail}</p>
                </div>
              </div>
              <div className="v2-answer">
                <p className="v2-tag">The SDC answer</p>
                <p>{p.answer}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="light" labelledBy="home-sectors">
        <SectionHead
          id="home-sectors"
          eyebrow="Where we work"
          title={
            <>
              Different environments. <Accent>One standard.</Accent>
            </>
          }
          lead="Hospitals, campuses, offices, plants and apartment communities each need something different. The discipline stays the same."
        />
        <div className="v2-grid v2-grid--3">
          {industries.map((ind) => (
            <IndustryCard key={ind.slug} industry={ind} />
          ))}
          <div className="v2-card v2-card--gold">
            <h3>Your site next.</h3>
            <p>Every deployment starts with a site survey and a written post plan.</p>
            <ButtonLink href={SURVEY_URL} variant="navy">
              Book a site survey
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section tone="white" labelledBy="home-difference">
        <SectionHead
          id="home-difference"
          eyebrow="The SDC difference"
          title={
            <>
              Technology moves us forward. <Accent>Discipline keeps us grounded.</Accent>
            </>
          }
          lead="Three reasons, in order: who leads, how people are prepared, and how you see the work."
        />
        <ol className="v2-pillars">
          {pillars.map(([t, d], i) => (
            <li key={t}>
              <span className="v2-outline-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
        <div className="v2-leaders-mini">
          <Link href={`${BASE}/about#leadership`} className="v2-person-chip">
            <img src="/images/founder-lokesh-avatar.png" alt="" width={56} height={56} />
            <span>
              <strong>Lokesh PN</strong>
              <small>Founder &amp; Managing Director · 17 years, Indian Army</small>
            </span>
          </Link>
          <Link href={`${BASE}/about#leadership`} className="v2-person-chip">
            <img src="/images/director-vijay-avatar.png" alt="" width={56} height={56} />
            <span>
              <strong>Vijay Kumar G</strong>
              <small>Director · 21 years in client relationships</small>
            </span>
          </Link>
        </div>
      </Section>

      <Section tone="light" labelledBy="home-training">
        <div className="v2-split">
          <div>
            <Eyebrow>People &amp; training</Eyebrow>
            <h2 className="v2-h2" id="home-training">
              Selected with care. <Accent>Trained without a break.</Accent>
            </h2>
            <p className="v2-lead">
              Four checks before anyone joins, then a training cycle that never stops after day one. Taught in Kannada,
              Hindi or English.
            </p>
            <ol className="v2-chain" aria-label="The five-stage training cycle">
              {trainingCycle.map((s, i) => (
                <li key={s.title}>
                  <span aria-hidden="true">{i + 1}</span>
                  {s.title}
                </li>
              ))}
            </ol>
            <div className="v2-note">
              <strong>Enforced, not just recorded.</strong> Every certificate has an expiry date. A guard whose training
              for a post has lapsed cannot be rostered there.
            </div>
            <ButtonLink href={`${BASE}/training`} variant="navy">
              Inside our training
            </ButtonLink>
          </div>
          <Photo
            src="/images/training/fire-drill.jpg"
            alt="An SDC guard putting out a live fire with an extinguisher during a fire-safety drill"
            caption="Live fire drill at an SDC training session"
            width={1400}
            height={1050}
          />
        </div>
      </Section>

      <Section tone="navy" labelledBy="home-tech" rings="left">
        <div className="v2-split v2-split--wide-media">
          <div>
            <Eyebrow>Technology · SDC Command</Eyebrow>
            <h2 className="v2-h2" id="home-tech">
              Security you can see. <Accent>Decisions you can trust.</Accent>
            </h2>
            <p className="v2-lead">
              SDC Command is our own platform. Human vigilance on the ground, machine intelligence behind it, and one
              clear picture for you.
            </p>
            <CheckList
              tone="dark"
              items={[
                "Command centre: on duty, present, incidents and risks",
                "Deployment planner that blocks clashes before a roster goes out",
                "Guard app with selfie and GPS check-in, SOS and reports",
                "Client portal: you see what you pay for",
              ]}
            />
            <div className="v2-actions">
              <ButtonLink href={`${BASE}/technology`}>How SDC Command works</ButtonLink>
              <ButtonLink href={DEMO_URL} variant="ghost" icon="up">
                Try the interactive demo
              </ButtonLink>
            </div>
          </div>
          <Screen
            src="/images/v2/command-centre.jpg"
            alt="SDC Command centre with people on duty, attendance, open incidents, sites ranked by urgency and a site map"
            width={1600}
            height={752}
            label="SDC Command · Command centre"
            caption="Screen from the demonstration workspace, with demo data."
          />
        </div>
      </Section>

      <Section tone="white" labelledBy="home-clients">
        <SectionHead
          id="home-clients"
          eyebrow="Trusted where it matters"
          title={
            <>
              Infrastructure, healthcare, <Accent>industry and homes.</Accent>
            </>
          }
          lead="50+ organisations across Karnataka, from a metro rail system to hospitals, plants and apartment communities."
        >
          <Link href={`${BASE}/clients`} className="v2-text-link">
            See all clients <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </SectionHead>
        <ul className="v2-logos v2-logos--strip">
          {featuredClients.map((c) => (
            <LogoTile key={c.name} client={c} />
          ))}
        </ul>
        <p className="v2-fineprint">Organisations SDC has served, past and present. Logos belong to their respective owners.</p>
      </Section>

      <Section tone="light" labelledBy="home-creds">
        <div className="v2-creds-row">
          <div>
            <Eyebrow>Compliance</Eyebrow>
            <h2 className="v2-h3" id="home-creds">
              Trust has a <Accent>paper trail.</Accent>
            </h2>
          </div>
          <CredentialsStrip />
          <Link href={`${BASE}/compliance`} className="v2-text-link">
            Every licence and registration <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
