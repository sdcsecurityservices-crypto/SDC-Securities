import type { Metadata } from "next";
import { BASE, iso, mission, values, vision } from "@/components/v2/data";
import { Accent, Btn, Chain, Chapter, CtaBand, Eyebrow, HeroCompact, Intro, Pic, Rings, Rule, Seals } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "About SDC",
  description:
    "SDC Security & Facility Services is a Bengaluru company founded and led by ex-servicemen. Incorporated 2017, PSARA licensed 2019, ISO 9001:2015 certified.",
};

const journey = [
  { year: "2017", title: "Incorporated in Bengaluru", text: "A private limited company, CIN U74999KA2017PTC103762." },
  { year: "2019", title: "PSARA licence granted", text: "Licensed to run a private security agency, ISD/PSA-64/2019." },
  { year: "2024", title: "ISO 9001:2015 registered", text: `December 2024. Certificate ${iso.number}, ${iso.body}, for security, housekeeping and manpower supply.` },
  { year: "Today", title: "1000+ people on post", text: "For 50+ organisations across Karnataka, run on SDC Command." },
];

const advisors = [
  {
    name: "Nagesh Kumar",
    initials: "NK",
    service: "KSPS · Retired Superintendent of Police",
    role: "Operational standards & training",
    focus: "Guard and supervisor development, site procedures and deployment readiness, incident reporting and escalation standards.",
  },
  {
    name: "P. V. Sunil Kumar",
    initials: "PV",
    service: "IPS · Andhra Pradesh cadre",
    role: "Security strategy & governance",
    focus: "Security strategy and risk review, governance and leadership mentoring, crisis preparedness and response frameworks.",
  },
];

function Leader({
  id,
  img,
  w,
  h,
  alt,
  role,
  name,
  line,
  record,
  body,
  chips,
  quote,
  flip,
}: {
  id: string;
  img: string;
  w: number;
  h: number;
  alt: string;
  role: string;
  name: string;
  line: React.ReactNode;
  record: [string, string][];
  body: string[];
  chips: string[];
  quote: string;
  flip?: boolean;
}) {
  return (
    <article className={`v2-leader${flip ? " v2-leader--flip" : ""}`} aria-labelledby={id}>
      <div className="v2-leader-portrait">
        <Rings />
        <img src={img} alt={alt} width={w} height={h} loading="lazy" />
        <p className="v2-leader-tag v2-mono-cap">{role}</p>
      </div>
      <div className="v2-leader-copy">
        <Rule />
        <Eyebrow>{role}</Eyebrow>
        <h3 className="v2-h2" id={id}>
          {name}
        </h3>
        <p className="v2-leader-line">{line}</p>
        <dl className="v2-record">
          {record.map(([a, b]) => (
            <div key={a}>
              <dt>{b}</dt>
              <dd className="v2-mono">{a}</dd>
            </div>
          ))}
        </dl>
        {body.map((p) => (
          <p key={p.slice(0, 20)} className="v2-leader-body">
            {p}
          </p>
        ))}
        <p className="v2-mono-cap v2-leader-chips">{chips.join(" · ")}</p>
        <blockquote className="v2-quote">
          <p>“{quote}”</p>
          <cite>{name}</cite>
        </blockquote>
      </div>
    </article>
  );
}

export default function AboutPage() {
  return (
    <>
      <HeroCompact
        crumbs={[{ label: "About SDC" }]}
        eyebrow="Who we are"
        title={
          <>
            Led by veterans. Run by systems. <Accent>Answerable to you.</Accent>
          </>
        }
        lead="SDC Security & Facility Services Pvt. Ltd. is a Bengaluru company founded and led by ex-servicemen. We put trained guards, lady guards, housekeeping, facility and support teams on post, and we stay accountable for every one of them."
        actions={
          <>
            <Btn href="#leadership">Meet the leadership</Btn>
            <Btn href={`${BASE}/contact#survey`} variant="ghost">
              Request a site survey
            </Btn>
          </>
        }
      />

      <section className="v2-story v2-dark" aria-labelledby="ab-story">
        <div className="v2-story-media v2-scan-host">
          <Pic photo="academyBatch" sizes="100vw" />
        </div>
        <div className="v2-wrap">
          <div className="v2-story-card">
            <Rule />
            <Eyebrow>Our story</Eyebrow>
            <h2 className="v2-h2" id="ab-story">
              From military service <Accent>to everyday security.</Accent>
            </h2>
            <p>
              SDC was founded by Lokesh PN after 17 years in the Indian Army’s Air Defence. He built the company to bring
              that discipline to everyday security: a clear chain of command, a service-first mindset and responsibility
              that does not stop at the gate.
            </p>
            <p>
              Incorporated in Bengaluru in 2017 and PSARA licensed in 2019, SDC now deploys more than 1000 people for over
              50 organisations across Karnataka. Our next chapter connects that human commitment with smarter systems:
              SDC Command, our own platform, gives every client a clear view of the people on their site.
            </p>
          </div>
        </div>
      </section>

      <Chapter tone="canvas" labelledBy="ab-vm">
        <div className="v2-vm">
          <div>
            <p className="v2-mono-cap">Our vision</p>
            <p className="v2-vm-text">{vision}</p>
          </div>
          <div>
            <p className="v2-mono-cap">Our mission</p>
            <p className="v2-vm-text">{mission}</p>
          </div>
        </div>
      </Chapter>

      <Chapter tone="paper" labelledBy="ab-values">
        <div className="v2-split v2-split--top">
          <div className="v2-sticky">
            <Rule />
            <Eyebrow>Five values</Eyebrow>
            <h2 className="v2-h2 v2-h2--xl" id="ab-values">
              What we <Accent>stand for.</Accent>
            </h2>
          </div>
          <Chain label="Our core values" items={values.map(([t, d]) => ({ title: t, text: d }))} />
        </div>
      </Chapter>

      <Chapter tone="canvas" id="leadership" labelledBy="ab-lead">
        <Intro
          id="ab-lead"
          align="split"
          eyebrow="Leadership"
          title={
            <>
              Veterans in command. <Accent>Clients at the centre.</Accent>
            </>
          }
          lead="A veteran-led chain of command, with clear responsibility from your site supervisor to the leadership team."
        />
        <Leader
          id="leader-lokesh"
          img="/images/founder-lokesh.png"
          w={449}
          h={731}
          alt="Lokesh PN, Founder and Managing Director of SDC"
          role="Founder & Managing Director"
          name="Lokesh PN"
          line={
            <>
              17 years in the Indian Army’s <Accent>Air Defence.</Accent> Now leading SDC.
            </>
          }
          record={[
            ["17 yrs", "Army Air Defence"],
            ["Kargil", "Operation Vijay"],
            ["Parakram", "Operation Parakram"],
          ]}
          body={[
            "Lokesh served for 17 years in the Indian Army in Army Air Defence. He took part in Operation Vijay during the Kargil war and in Operation Parakram, and served in operational and insurgency-affected areas, including Jammu and Kashmir and Ladakh.",
            "He received specialised training at the Army Institute of Physical Training (AIPT), Pune, and studied Supply Chain Management at Alliance University, Bengaluru. He brings that experience in leadership, discipline, personnel management and operational planning to every SDC deployment.",
          ]}
          chips={["Indian Army · 17 years", "J&K and Ladakh", "AIPT, Pune", "Alliance University"]}
          quote="I am committed to maintaining high standards of security, personnel training, supervision, operational efficiency and safety, and to building strong client relationships with dependable security solutions tailored to each client’s requirements."
        />
        <Leader
          flip
          id="leader-vijay"
          img="/images/director-vijay.png"
          w={560}
          h={995}
          alt="Vijay Kumar G, Director of SDC"
          role="Director"
          name="Vijay Kumar G"
          line={
            <>
              21 years in marketing and <Accent>client relationships.</Accent>
            </>
          }
          record={[
            ["21 yrs", "Marketing and CRM"],
            ["5,000+", "Customers guided"],
            ["No. 1", "Branch in India"],
          ]}
          body={[
            "Vijay is a business partner and professional trader associated with Mirae Asset Sharekhan Ltd. He headed a branch in Bengaluru that ranked No. 1 across India, and has worked with more than 5,000 customers, including high-net-worth clients.",
            "At SDC he brings that same focus to every client: understanding what each site needs, and making sure the service delivers it.",
          ]}
          chips={["B.Sc. Biotechnology", "Technical Analysis · Online Trading Academy, California"]}
          quote="My strength is customer relationships: understanding what clients need, and delivering it."
        />
      </Chapter>

      <Chapter tone="deep" labelledBy="ab-adv" rings>
        <Intro
          id="ab-adv"
          align="split"
          eyebrow="Mentors & advisors"
          title={
            <>
              Experience that guides. <Accent>Standards that endure.</Accent>
            </>
          }
          lead="Advisory guidance supports the leadership team. Day-to-day deployment, client service and operational accountability remain with SDC management."
        />
        <div className="v2-advisors">
          {advisors.map((a) => (
            <article key={a.name} className="v2-advisor">
              <span className="v2-monogram" aria-hidden="true">
                {a.initials}
              </span>
              <div>
                <h3>{a.name}</h3>
                <p className="v2-mono-cap">{a.service}</p>
                <p className="v2-advisor-role">{a.role}</p>
                <p>{a.focus}</p>
              </div>
            </article>
          ))}
        </div>
      </Chapter>

      <Chapter tone="navy" labelledBy="ab-journey">
        <Intro
          id="ab-journey"
          eyebrow="Our journey"
          title={
            <>
              Built step by step, <Accent>on the record.</Accent>
            </>
          }
        />
        <ol className="v2-journey">
          {journey.map((j) => (
            <li key={j.year}>
              <span className="v2-mono v2-journey-year">{j.year}</span>
              <h3>{j.title}</h3>
              <p>{j.text}</p>
            </li>
          ))}
        </ol>
      </Chapter>

      <Chapter tone="canvas" labelledBy="ab-creds" className="v2-ch--tight">
        <h2 className="v2-h3" id="ab-creds" style={{ marginBottom: 24 }}>
          Licensed, certified and registered
        </h2>
        <Seals />
      </Chapter>

      <CtaBand />
    </>
  );
}
