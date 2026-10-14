import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BASE, SURVEY_URL, onboarding, services } from "@/components/v2/data";
import {
  Accent,
  ButtonLink,
  CheckList,
  CtaBand,
  Eyebrow,
  PageHero,
  Section,
  SectionHead,
  StepFlow,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Security guards, facility management, housekeeping, manpower supply and payroll & compliance from one accountable, ex-servicemen-led partner in Bengaluru.",
};

const nodes = [
  { x: 50, y: 10 },
  { x: 88, y: 37.6 },
  { x: 73.5, y: 82.4 },
  { x: 26.5, y: 82.4 },
  { x: 12, y: 37.6 },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Services" }]}
        eyebrow="What we deliver"
        title={
          <>
            One partner. <Accent>Every layer of protection.</Accent>
          </>
        }
        lead="From the people at your gate to the systems behind them. Five services that work together, so you deal with one accountable partner instead of several vendors."
        actions={<ButtonLink href={SURVEY_URL}>Book a free site survey</ButtonLink>}
        aside={
          <div className="v2-orbit" role="img" aria-label="SDC at the centre of five connected services: security, facility management, housekeeping, manpower supply, and payroll and compliance">
            <svg viewBox="0 0 400 400" aria-hidden="true">
              <g fill="none" stroke="#FFDC2E">
                <circle cx="200" cy="200" r="160" strokeOpacity=".5" strokeWidth="1.5" />
                <circle cx="200" cy="200" r="110" strokeOpacity=".25" />
                <circle cx="200" cy="200" r="64" strokeOpacity=".7" strokeWidth="2" />
                <path d="M200 40 A160 160 0 0 1 352 150" strokeWidth="4" strokeLinecap="round" />
              </g>
            </svg>
            <div className="v2-orbit-center">
              <img src="/brand/sdc-logo.png" alt="" width={64} height={64} />
              <strong>One accountable partner</strong>
            </div>
            {services.map((s, i) => (
              <span key={s.slug} className="v2-orbit-node" style={{ left: `${nodes[i].x}%`, top: `${nodes[i].y}%` }}>
                {s.short}
              </span>
            ))}
          </div>
        }
      />

      <Section tone="white" labelledBy="svc-all">
        <SectionHead
          id="svc-all"
          eyebrow="Our services"
          title={
            <>
              Five services. <Accent>One standard.</Accent>
            </>
          }
          lead="Most clients start with guarding. Many then hand us facility upkeep, staffing and the payroll paperwork too."
        />
        <ol className="v2-service-rows">
          {services.map((s, i) => (
            <li key={s.slug} className="v2-service-row">
              <span className="v2-outline-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="v2-tag">{s.name}</p>
                <h3>
                  <Link className="v2-stretched" href={`${BASE}/services/${s.slug}`}>
                    {s.headline[0]} {s.headline[1]}
                  </Link>
                </h3>
                <p>{s.summary}</p>
              </div>
              <ul className="v2-mini-list" aria-label={`Included in ${s.name.toLowerCase()}`}>
                {s.includes.slice(0, 6).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <span className="v2-card-more" aria-hidden="true">
                Full details <ArrowRight size={16} />
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="navy" labelledBy="svc-why" rings="left">
        <div className="v2-split">
          <div>
            <Eyebrow>Why one partner</Eyebrow>
            <h2 className="v2-h2" id="svc-why">
              Fewer vendors. <Accent>Clearer accountability.</Accent>
            </h2>
            <p className="v2-lead">
              When guarding, housekeeping and staffing sit with different contractors, gaps fall between them. With SDC,
              one supervisor answers for the site and one set of records covers every person on it.
            </p>
          </div>
          <CheckList
            tone="dark"
            items={[
              "One point of contact for every service on your site",
              "One roster, checked for clashes before it goes out",
              "Attendance, incidents and reports in one client portal",
              "EPF and ESI paid for every employee we deploy",
              "Invoices built from approved attendance",
              "A monthly review of coverage, incidents and improvements",
            ]}
          />
        </div>
      </Section>

      <Section tone="light" labelledBy="svc-onboard">
        <SectionHead
          id="svc-onboard"
          eyebrow="How we take over a site"
          title={
            <>
              From first visit to full cover, <Accent>in five steps.</Accent>
            </>
          }
          lead="Timelines depend on site size, and we commit to them in writing after the survey."
        />
        <StepFlow steps={onboarding} label="How SDC takes over a site" />
      </Section>

      <CtaBand />
    </>
  );
}
