import type { Metadata } from "next";
import { BadgeCheck, CalendarClock, Ban, FileCheck2 } from "lucide-react";
import { selection, trainingCycle } from "@/components/v2/data";
import {
  Accent,
  CtaBand,
  Eyebrow,
  PageHero,
  Photo,
  Screen,
  Section,
  SectionHead,
  StepFlow,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Selection & training",
  description:
    "How SDC selects and trains its guards: four checks before joining, a five-stage training cycle, training in Kannada, Hindi or English, and certificates that block rostering when they lapse.",
};

const gallery = [
  { src: "/images/training/fire-drill.jpg", alt: "An SDC guard putting out a live fire with an extinguisher", caption: "Live fire drill", w: 1400, h: 1050, cls: "v2-photo--big" },
  { src: "/images/training/classroom.jpg", alt: "SDC lady guards in a classroom training session", caption: "Classroom sessions", w: 1000, h: 750 },
  { src: "/images/training/hose-drill.jpg", alt: "SDC guards in helmets and high-visibility vests on a fire-hose drill", caption: "Fire-hose drill", w: 1000, h: 750 },
  { src: "/images/training/lecture.jpg", alt: "A trainer addressing SDC guards in a lecture hall", caption: "Expert-led training", w: 1000, h: 750 },
  { src: "/images/training/extinguisher-demo.jpg", alt: "Guards watching an extinguisher demonstration on a training fire", caption: "Extinguisher handling", w: 1000, h: 750 },
  { src: "/images/v2/academy-group.jpg", alt: "SDC guards and lady guards seated in the training hall with SDC's leadership in the front row", caption: "A full training batch", w: 1600, h: 1067, cls: "v2-photo--span2" },
  { src: "/images/v2/hose-team.jpg", alt: "SDC guards in helmets and vests directing a fire hose while colleagues watch", caption: "Team hose practice", w: 1600, h: 1067, cls: "v2-photo--span2" },
];

const hospitalPath = [
  { title: "Before the first shift", items: ["PSARA basic security training", "Fire safety and evacuation", "First aid and CPR", "Conduct, POSH and anti-bribery", "Emergency response and SOS", "Hospital site induction"] },
  { title: "Hospital specialist", items: ["Hospital security and patient dignity", "De-escalation in emergency", "Code Pink: infant abduction", "Infection control", "Biomedical waste segregation"] },
  { title: "Refreshers", items: ["Mock drill and evacuation", "Legal powers and reporting", "Courtesy and patient care"] },
];

/** Five nodes on a ring, with arrows running clockwise. */
function CycleDiagram() {
  const r = 150;
  const pts = trainingCycle.map((_, i) => {
    const a = (-90 + i * 72) * (Math.PI / 180);
    return { x: 200 + r * Math.cos(a), y: 200 + r * Math.sin(a) };
  });
  return (
    <div className="v2-cycle-diagram">
      <svg viewBox="0 0 400 400" role="img" aria-labelledby="cycle-svg-title">
        <title id="cycle-svg-title">
          Training cycle: induction, your site, your industry, refreshers and leadership, then back to refreshers
        </title>
        <defs>
          <marker id="v2-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#FFDC2E" />
          </marker>
        </defs>
        <circle cx="200" cy="200" r={r} fill="none" stroke="#FFDC2E" strokeOpacity=".22" strokeWidth="2" />
        <circle cx="200" cy="200" r="96" fill="none" stroke="#FFDC2E" strokeOpacity=".12" />
        {pts.map((p, i) => {
          const a1 = (-90 + i * 72 + 15) * (Math.PI / 180);
          const a2 = (-90 + (i + 1) * 72 - 15) * (Math.PI / 180);
          return (
            <path
              key={i}
              d={`M${200 + r * Math.cos(a1)} ${200 + r * Math.sin(a1)} A${r} ${r} 0 0 1 ${200 + r * Math.cos(a2)} ${200 + r * Math.sin(a2)}`}
              fill="none"
              stroke="#FFDC2E"
              strokeWidth="2.5"
              markerEnd="url(#v2-arrow)"
            />
          );
        })}
        {pts.map((p, i) => (
          <g key={trainingCycle[i].title}>
            <circle cx={p.x} cy={p.y} r="30" fill="#052B5B" stroke="#FFDC2E" strokeWidth="2.5" />
            <text x={p.x} y={p.y + 7} textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="20" fill="#FFDC2E">
              {i + 1}
            </text>
          </g>
        ))}
        <text x="200" y="192" textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="22" fill="#F5F7FB">
          Never stops
        </text>
        <text x="200" y="218" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="13" fill="#BCC8DA">
          after day one
        </text>
      </svg>
    </div>
  );
}

export default function TrainingPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Training" }]}
        eyebrow="People & training"
        title={
          <>
            Selected with care. <Accent>Trained without a break.</Accent>
          </>
        }
        lead="Four checks before anyone joins. A five-stage training cycle that never stops after day one. Taught in the guard’s own language, and enforced by the system that builds the roster."
        image={{
          src: "/images/v2/academy-group.jpg",
          alt: "SDC guards and lady guards seated in the training hall with SDC's leadership in the front row",
          width: 1600,
          height: 1067,
        }}
      />

      <Section tone="white" labelledBy="tr-selection">
        <SectionHead
          id="tr-selection"
          eyebrow="Selection"
          title={
            <>
              Four checks <Accent>before anyone joins.</Accent>
            </>
          }
          lead="We select for integrity, discipline and responsibility, then assess each person against the needs of the post: security protocols, emergency response or facility work."
        />
        <StepFlow steps={selection} label="SDC’s selection process" />
      </Section>

      <Section tone="navy" labelledBy="tr-cycle" rings="right">
        <SectionHead
          id="tr-cycle"
          eyebrow="Continuous training"
          title={
            <>
              Training that <Accent>never stops</Accent> after day one.
            </>
          }
          lead="Training is a cycle, not a one-time induction. Each guard moves through five stages, and the refreshers come round again every 6 to 12 months."
        />
        <div className="v2-cycle">
          <CycleDiagram />
          <ol className="v2-cycle-list" aria-label="The five stages">
            {trainingCycle.map((s, i) => (
              <li key={s.title}>
                <span aria-hidden="true">{i + 1}</span>
                <div>
                  <h3>
                    <span className="v2-sr">Stage {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section tone="light" labelledBy="tr-path">
        <SectionHead
          id="tr-path"
          eyebrow="Example: healthcare"
          title={
            <>
              A hospital guard’s <Accent>training path.</Accent>
            </>
          }
          lead="The same structure runs for education, corporate, logistics, manufacturing, retail, hospitality, banking and residential sites, with modules for each."
        />
        <div className="v2-modules">
          {hospitalPath.map((g) => (
            <div key={g.title} className="v2-card v2-card--accent">
              <h3>{g.title}</h3>
              <ul>
                {g.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="white" labelledBy="tr-lang">
        <div className="v2-split">
          <div>
            <Eyebrow>Taught in the guard’s own language</Eyebrow>
            <h2 className="v2-h2" id="tr-lang">
              Kannada, Hindi <Accent>or English.</Accent>
            </h2>
            <p className="v2-lead">
              People learn best in the language they think in. SDC runs its training in Kannada, Hindi or English, and
              the guard app speaks all three, so a fire-safety lesson or a conduct quiz is never lost in translation.
            </p>
          </div>
          <ul className="v2-langs" aria-label="Training languages">
            <li className="v2-lang">
              <strong lang="kn">ಕನ್ನಡ</strong>
              <span>Kannada</span>
            </li>
            <li className="v2-lang">
              <strong lang="hi">हिन्दी</strong>
              <span>Hindi</span>
            </li>
            <li className="v2-lang">
              <strong>English</strong>
              <span>English</span>
            </li>
          </ul>
        </div>
      </Section>

      <Section tone="light" labelledBy="tr-cert">
        <SectionHead
          id="tr-cert"
          eyebrow="Certificates"
          title={
            <>
              Enforced, <Accent>not just recorded.</Accent>
            </>
          }
          lead="Every certificate has an expiry date. If a guard’s training for a post has lapsed, the system will not roster them to it."
        />
        <ol className="v2-lifecycle" aria-label="How a training certificate works">
          <li>
            <FileCheck2 size={24} aria-hidden="true" />
            <strong>Course completed</strong>
            <p>The guard passes the course in the SDC Training Academy.</p>
          </li>
          <li>
            <BadgeCheck size={24} aria-hidden="true" />
            <strong>Certificate issued</strong>
            <p>A certificate is recorded on the guard’s file, with an expiry date.</p>
          </li>
          <li>
            <CalendarClock size={24} aria-hidden="true" />
            <strong>Refresher due</strong>
            <p>Refreshers come round every 6 to 12 months, depending on the course.</p>
          </li>
          <li>
            <Ban size={24} aria-hidden="true" />
            <strong>Lapsed? Not rostered.</strong>
            <p>The planner will not put a guard on a post whose training has lapsed.</p>
          </li>
        </ol>
        <div style={{ marginTop: 40 }}>
          <Screen
            src="/images/v2/training-academy.jpg"
            alt="SDC Training Academy course catalogue in SDC Command, including courses in Hindi and Kannada"
            width={1600}
            height={705}
            label="SDC Command · Training academy"
            caption="The academy as the office sees it. Screen from the demonstration workspace, with demo data."
          />
        </div>
      </Section>

      <Section tone="white" labelledBy="tr-gallery">
        <SectionHead
          id="tr-gallery"
          eyebrow="Training in action"
          title={
            <>
              Practised for real, <Accent>not just taught.</Accent>
            </>
          }
          lead="Live fire drills, fire-hose practice and classroom sessions: SDC guards rehearse the response before they ever need it on your site."
        />
        <div className="v2-gallery">
          {gallery.map((g) => (
            <Photo key={g.src} src={g.src} alt={g.alt} caption={g.caption} width={g.w} height={g.h} className={g.cls ?? ""} />
          ))}
        </div>
      </Section>

      <CtaBand
        title={
          <>
            Trained people <Accent>for your site.</Accent>
          </>
        }
        text="Tell us about your site. We will show you the training path your guards will follow before the first shift."
      />
    </>
  );
}
