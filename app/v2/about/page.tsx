import type { Metadata } from "next";
import { Compass, ShieldCheck } from "lucide-react";
import { BASE, mission, values, vision } from "@/components/v2/data";
import {
  Accent,
  ButtonLink,
  CheckList,
  CtaBand,
  Eyebrow,
  PageHero,
  Photo,
  Rings,
  Section,
  SectionHead,
  StatBand,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "About SDC",
  description:
    "SDC Security & Facility Services is a Bengaluru company founded and led by ex-servicemen. Incorporated in 2017, PSARA licensed in 2019, ISO 9001:2015 certified.",
};

const journey = [
  { year: "2017", title: "Incorporated in Bengaluru", text: "SDC is registered as a private limited company, CIN U74999KA2017PTC103762." },
  { year: "2019", title: "PSARA licence granted", text: "Licensed to run a private security agency, licence ISD/PSA-64/2019." },
  { year: "ISO", title: "ISO 9001:2015 certified", text: "Quality management for security, housekeeping and manpower supply, valid to December 2027." },
  { year: "Today", title: "1000+ people on post", text: "Serving 50+ organisations across Karnataka, run through SDC’s own platform, SDC Command." },
];

const advisors = [
  {
    name: "Nagesh Kumar",
    initials: "NK",
    service: "KSPS · Retired Superintendent of Police",
    role: "Operational standards & training",
    icon: ShieldCheck,
    text: "An advisory focus on the fundamentals of dependable security: disciplined teams, clear site procedures and supervisors prepared to take responsibility.",
    focus: ["Guard and supervisor development", "Site procedures and deployment readiness", "Incident reporting and escalation standards"],
  },
  {
    name: "P. V. Sunil Kumar",
    initials: "PV",
    service: "IPS · Andhra Pradesh cadre",
    role: "Security strategy & governance",
    icon: Compass,
    text: "An advisory focus on the bigger picture: risk-led security planning, accountable decision-making and a structured approach to crisis preparedness.",
    focus: ["Security strategy and risk review", "Governance and leadership mentoring", "Crisis preparedness and response frameworks"],
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "About SDC" }]}
        eyebrow="Who we are"
        title={
          <>
            An ex-servicemen organisation, <Accent>built on discipline.</Accent>
          </>
        }
        lead="SDC Security & Facility Services Pvt. Ltd. is a Bengaluru company founded and led by ex-servicemen. We put trained guards, lady guards, housekeeping, facility and support teams on post, and we stay accountable for every one of them, from the first shift to the last."
        actions={
          <>
            <ButtonLink href="#leadership">Meet the leadership</ButtonLink>
            <ButtonLink href={`${BASE}/contact#survey`} variant="ghost">
              Book a site survey
            </ButtonLink>
          </>
        }
      />

      <Section tone="white" labelledBy="about-story">
        <div className="v2-split v2-split--top">
          <div>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="v2-h2" id="about-story">
              From military service <Accent>to everyday security.</Accent>
            </h2>
            <p className="v2-lead">
              SDC was founded by Lokesh PN after 17 years in the Indian Army’s Air Defence. He built the company to bring
              that discipline to everyday security: a clear chain of command, a service-first mindset and responsibility
              that does not stop at the gate.
            </p>
            <p className="v2-lead">
              The company was incorporated in Bengaluru in 2017 and received its PSARA licence in 2019. Today SDC
              deploys more than 1000 people for over 50 organisations across Karnataka: hospitals, medical colleges,
              offices, plants, construction sites and apartment communities.
            </p>
            <p className="v2-lead">
              Our next chapter connects that human commitment with smarter systems. SDC Command, our own platform, gives
              every client a clear view of the people on their site.
            </p>
          </div>
          <div>
            <StatBand
              tone="light"
              items={[
                { value: "2017", label: "Incorporated", note: "Private limited, Bengaluru" },
                { value: "2019", label: "PSARA licensed", note: "ISD/PSA-64/2019" },
                { value: "1000+", label: "People deployed", note: "Guards, lady guards and facility teams" },
                { value: "50+", label: "Organisations served", note: "Across Karnataka" },
              ]}
            />
            <Photo
              src="/images/team/leadership-briefing.jpg"
              alt="SDC leadership briefing a formation of uniformed guards"
              caption="Leadership on the ground, before the shift"
              width={1600}
              height={1066}
              className="v2-photo--wide"
            />
          </div>
        </div>
      </Section>

      <Section tone="navy" labelledBy="about-journey" rings="right">
        <SectionHead
          id="about-journey"
          eyebrow="Our journey"
          title={
            <>
              Built step by step, <Accent>on the record.</Accent>
            </>
          }
          lead="Each milestone is backed by a licence, a certificate or a registration you can ask to see."
        />
        <ol className="v2-timeline" aria-label="SDC milestones">
          {journey.map((j) => (
            <li key={j.year}>
              <strong>{j.year}</strong>
              <h3>{j.title}</h3>
              <p>{j.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="light" labelledBy="about-values">
        <SectionHead
          id="about-values"
          eyebrow="What we stand for"
          title={
            <>
              Vision, mission <Accent>and values.</Accent>
            </>
          }
        />
        <div className="v2-statements">
          <div className="v2-statement">
            <p className="v2-tag">Our vision</p>
            <p>{vision}</p>
          </div>
          <div className="v2-statement v2-statement--gold">
            <p className="v2-tag">Our mission</p>
            <p>{mission}</p>
          </div>
        </div>
        <ol className="v2-values" aria-label="Our core values">
          {values.map(([t, d], i) => (
            <li key={t}>
              <small>{String(i + 1).padStart(2, "0")}</small>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="white" id="leadership" labelledBy="about-leadership">
        <SectionHead
          id="about-leadership"
          eyebrow="Leadership"
          title={
            <>
              Veterans in command. <Accent>Clients at the centre.</Accent>
            </>
          }
          lead="A veteran-led chain of command, with clear responsibility from your site supervisor to the leadership team."
        />
        <article className="v2-leader" aria-labelledby="leader-lokesh">
          <div className="v2-portrait">
            <Rings />
            <img src="/images/founder-lokesh.png" alt="Lokesh PN, Founder and Managing Director of SDC" width={449} height={731} loading="lazy" />
          </div>
          <div className="v2-leader-copy">
            <Eyebrow>Founder &amp; Managing Director</Eyebrow>
            <h3 className="v2-h2" id="leader-lokesh">
              Lokesh PN
            </h3>
            <p className="v2-leader-lead">
              17 years in the Indian Army’s <Accent>Air Defence.</Accent> Now leading SDC.
            </p>
            <p>
              Lokesh served for 17 years in the Indian Army in Army Air Defence. He took part in Operation Vijay during
              the Kargil war and in Operation Parakram, and served in operational and insurgency-affected areas,
              including Jammu and Kashmir and Ladakh. He received specialised training at the Army Institute of Physical
              Training (AIPT), Pune, and pursued studies in Supply Chain Management at Alliance University, Bengaluru.
            </p>
            <p>
              His service gave him deep experience in leadership, discipline, personnel management, operational planning
              and working in challenging environments, which he now brings to every SDC deployment.
            </p>
            <ul className="v2-record" aria-label="Service record">
              <li>
                <strong>17 years</strong>
                <span>Army Air Defence</span>
              </li>
              <li>
                <strong>Kargil</strong>
                <span>Operation Vijay</span>
              </li>
              <li>
                <strong>Parakram</strong>
                <span>Operation Parakram</span>
              </li>
            </ul>
            <ul className="v2-chips" aria-label="Postings and education">
              <li>Jammu &amp; Kashmir and Ladakh</li>
              <li>AIPT, Pune</li>
              <li>Supply Chain Management · Alliance University</li>
            </ul>
            <blockquote className="v2-quote">
              <p>
                “I am committed to maintaining high standards of security, personnel training, supervision, operational
                efficiency and safety, and to building strong client relationships with dependable security solutions
                tailored to each client’s requirements.”
              </p>
              <cite>Lokesh PN</cite>
            </blockquote>
          </div>
        </article>

        <article className="v2-leader v2-leader--flip" aria-labelledby="leader-vijay">
          <div className="v2-portrait">
            <Rings />
            <img src="/images/director-vijay.png" alt="Vijay Kumar G, Director of SDC" width={560} height={995} loading="lazy" />
          </div>
          <div className="v2-leader-copy">
            <Eyebrow>Director</Eyebrow>
            <h3 className="v2-h2" id="leader-vijay">
              Vijay Kumar G
            </h3>
            <p className="v2-leader-lead">
              21 years in marketing and <Accent>client relationships.</Accent>
            </p>
            <p>
              Vijay is a business partner and professional trader associated with Mirae Asset Sharekhan Ltd. He headed a
              branch in Bengaluru that ranked No. 1 across India, and has worked with more than 5,000 customers,
              including high-net-worth clients, understanding their requirements and guiding them through their
              investments.
            </p>
            <p>
              At SDC he brings that same focus to every client: understanding what each site needs, and making sure the
              service delivers it.
            </p>
            <ul className="v2-record" aria-label="Career record">
              <li>
                <strong>21 years</strong>
                <span>Marketing and CRM</span>
              </li>
              <li>
                <strong>5,000+</strong>
                <span>Customers guided</span>
              </li>
              <li>
                <strong>No. 1</strong>
                <span>Branch in India</span>
              </li>
            </ul>
            <ul className="v2-chips" aria-label="Education">
              <li>B.Sc. Biotechnology</li>
              <li>Technical Analysis · Online Trading Academy, California</li>
            </ul>
            <blockquote className="v2-quote">
              <p>“My strength is customer relationships: understanding what clients need, and delivering it.”</p>
              <cite>Vijay Kumar G</cite>
            </blockquote>
          </div>
        </article>
      </Section>

      <Section tone="deep" id="advisors" labelledBy="about-advisors" rings="left">
        <SectionHead
          id="about-advisors"
          eyebrow="Mentors & advisors"
          title={
            <>
              Experience that guides. <Accent>Standards that endure.</Accent>
            </>
          }
          lead="Guidance for SDC’s leadership, with a focus on stronger operational discipline, thoughtful security strategy and teams prepared for responsibility."
        />
        <div className="v2-grid v2-grid--2">
          {advisors.map((a) => (
            <article key={a.name} className="v2-card v2-card--dark v2-advisor">
              <div className="v2-advisor-head">
                <span className="v2-monogram" aria-hidden="true">
                  {a.initials}
                </span>
                <div>
                  <h3>{a.name}</h3>
                  <p>{a.service}</p>
                </div>
              </div>
              <p className="v2-tag">
                <a.icon size={15} aria-hidden="true" />
                {a.role}
              </p>
              <p>{a.text}</p>
              <CheckList items={a.focus} tone="dark" />
            </article>
          ))}
        </div>
        <p className="v2-fineprint">
          Advisory guidance supports the leadership team. Day-to-day deployment, client service and operational
          accountability remain with SDC management.
        </p>
      </Section>

      <CtaBand />
    </>
  );
}
