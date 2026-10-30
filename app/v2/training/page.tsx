import type { Metadata } from "next";
import { pageMeta } from "@/components/v2/seo";
import { Ban, BadgeCheck, CalendarClock, FileCheck2, Medal } from "lucide-react";
import { BASE, selection, trainingCycle } from "@/components/v2/data";
import { HeroVideo } from "@/components/v2/hero-video";
import { Accent, Btn, Chapter, CtaBand, Eyebrow, HeroPhoto, Intro, Pic, Route, Rule, Screen } from "@/components/v2/ui";

export const metadata: Metadata = pageMeta(
  "/training",
  "Security Guard Selection & Training in Bengaluru | SDC",
  "How SDC selects and trains security guards: background checks, a five-stage training cycle in Kannada, Hindi or English, and certificates tracked for every guard.",
);

const modules = [
  { title: "Before the first shift", items: ["PSARA basic security training", "Fire safety and evacuation", "First aid and CPR", "Conduct, POSH and anti-bribery", "Emergency response and SOS", "Site induction"] },
  { title: "Hospital specialist", items: ["Hospital security and patient dignity", "De-escalation in emergency", "Code Pink: infant abduction", "Infection control", "Biomedical waste segregation"] },
  { title: "Refreshers", items: ["Mock drill and evacuation", "Legal powers and reporting", "Courtesy and patient care"] },
];

function CycleDiagram() {
  const r = 150;
  const pts = trainingCycle.map((_, i) => {
    const a = (-90 + i * 72) * (Math.PI / 180);
    return { x: 200 + r * Math.cos(a), y: 200 + r * Math.sin(a) };
  });
  return (
    <svg className="v2-cycle-svg" viewBox="0 0 400 400" role="img" aria-labelledby="cycle-title">
      <title id="cycle-title">Training cycle: induction, your site, your industry, refreshers and leadership</title>
      <defs>
        <marker id="v2-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#FFDC2E" />
        </marker>
      </defs>
      <circle cx="200" cy="200" r={r} fill="none" stroke="#FFDC2E" strokeOpacity=".18" strokeWidth="2" />
      <g className="v2-rings-sweep">
        <circle cx="200" cy="200" r="96" fill="none" stroke="#FFDC2E" strokeOpacity=".14" strokeDasharray="3 7" />
      </g>
      {pts.map((_, i) => {
        const a1 = (-90 + i * 72 + 15) * (Math.PI / 180);
        const a2 = (-90 + (i + 1) * 72 - 15) * (Math.PI / 180);
        return (
          <path
            key={i}
            d={`M${200 + r * Math.cos(a1)} ${200 + r * Math.sin(a1)} A${r} ${r} 0 0 1 ${200 + r * Math.cos(a2)} ${200 + r * Math.sin(a2)}`}
            fill="none"
            stroke="#FFDC2E"
            strokeWidth="2"
            markerEnd="url(#v2-arrow)"
          />
        );
      })}
      {pts.map((p, i) => (
        <g key={trainingCycle[i].title}>
          <circle cx={p.x} cy={p.y} r="28" fill="#03142E" stroke="#FFDC2E" strokeWidth="2" />
          <text x={p.x} y={p.y + 6} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontWeight="500" fontSize="17" fill="#FFDC2E">
            0{i + 1}
          </text>
        </g>
      ))}
      <text x="200" y="196" textAnchor="middle" fontFamily="Archivo, sans-serif" fontWeight="700" fontSize="24" fill="#FFFFFF">
        Never stops
      </text>
      <text x="200" y="220" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="2" fill="#8FA0BA">
        AFTER DAY ONE
      </text>
    </svg>
  );
}

export default function TrainingPage() {
  return (
    <>
      <HeroPhoto
        crumbs={[{ label: "About", href: `${BASE}/about` }, { label: "Training" }]}
        eyebrow="People & training"
        title={
          <>
            Selected with care. <Accent>Trained without a break.</Accent>
          </>
        }
        lead="Four checks before anyone joins. A five-stage training cycle that never stops after day one. Taught in the guard’s own language, and enforced by the system that builds the roster."
        position="50% 40%"
      >
        <HeroVideo
          src="/media/v2/hose-drill-loop.mp4"
          poster="/media/v2/hose-drill-poster.jpg"
          label="SDC guards and lady guards running a fire-hose drill outdoors"
        />
      </HeroPhoto>

      <Chapter tone="canvas" labelledBy="tr-sel">
        <Intro
          id="tr-sel"
          align="split"
          eyebrow="Selection"
          title={
            <>
              Four checks <Accent>before anyone joins.</Accent>
            </>
          }
          lead="We select for integrity, discipline and responsibility, then match each person to the needs of the post: security protocols, emergency response or facility work."
        />
        <Route steps={selection} label="SDC’s selection process" />
      </Chapter>

      <Chapter tone="deep" labelledBy="tr-cycle" rings>
        <div className="v2-cycle">
          <div>
            <Rule />
            <Eyebrow>Continuous training</Eyebrow>
            <h2 className="v2-h2 v2-h2--xl" id="tr-cycle">
              Training that <Accent>never stops</Accent> after day one.
            </h2>
            <CycleDiagram />
          </div>
          <ol className="v2-cycle-list" aria-label="The five stages">
            {trainingCycle.map((s, i) => (
              <li key={s.title}>
                <span className="v2-mono" aria-hidden="true">
                  0{i + 1}
                </span>
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
      </Chapter>

      <section className="v2-mosaic" aria-label="Training in action">
        <figure className="v2-mosaic-a v2-scan-host">
          <Pic photo="fireDrill" sizes="(min-width: 900px) 60vw, 100vw" />
          <figcaption className="v2-mono-cap">Live fire drill</figcaption>
        </figure>
        <figure className="v2-mosaic-b v2-scan-host">
          <Pic photo="classroomWide" sizes="(min-width: 900px) 40vw, 100vw" />
          <figcaption className="v2-mono-cap">Classroom</figcaption>
        </figure>
        <figure className="v2-mosaic-c v2-scan-host">
          <Pic photo="hoseDrill" sizes="(min-width: 900px) 40vw, 100vw" />
          <figcaption className="v2-mono-cap">Fire-hose drill</figcaption>
        </figure>
      </section>

      <Chapter tone="paper" labelledBy="tr-mod">
        <Intro
          id="tr-mod"
          align="split"
          eyebrow="Example: healthcare"
          title={
            <>
              A hospital guard’s <Accent>training path.</Accent>
            </>
          }
          lead="The same structure runs for education, corporate, logistics, manufacturing, retail, hospitality, banking and residential sites, with modules for each."
        />
        <div className="v2-modules">
          {modules.map((m, i) => (
            <div key={m.title} className="v2-module">
              <p className="v2-mono-cap">
                {String(i + 1).padStart(2, "0")} · {m.title}
              </p>
              <ul>
                {m.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Chapter>

      <Chapter tone="canvas" labelledBy="tr-lang">
        <div className="v2-split">
          <div>
            <Rule />
            <Eyebrow>Taught in the guard’s own language</Eyebrow>
            <h2 className="v2-h2" id="tr-lang">
              Kannada, Hindi <Accent>or English.</Accent>
            </h2>
            <p className="v2-lead" style={{ marginTop: 22 }}>
              People learn best in the language they think in. Training runs in Kannada, Hindi or English, and the guard
              app speaks all three.
            </p>
          </div>
          <ul className="v2-langs" aria-label="Training languages">
            <li>
              <strong lang="kn">ಕನ್ನಡ</strong>
              <span className="v2-mono-cap">Kannada</span>
            </li>
            <li>
              <strong lang="hi">हिन्दी</strong>
              <span className="v2-mono-cap">Hindi</span>
            </li>
            <li>
              <strong>English</strong>
              <span className="v2-mono-cap">English</span>
            </li>
          </ul>
        </div>
      </Chapter>

      <Chapter tone="navy" labelledBy="tr-cert">
        <Intro
          id="tr-cert"
          align="split"
          eyebrow="Records in SDC Command"
          title={
            <>
              Enforced, <Accent>not just recorded.</Accent>
            </>
          }
          lead="Every certificate has an expiry date. If a guard’s training for a post has lapsed, the planner will not roster them to it."
        />
        <ol className="v2-lifecycle" aria-label="How a training certificate works">
          {[
            [FileCheck2, "Course completed", "The guard passes the course in the SDC Training Academy."],
            [BadgeCheck, "Certificate issued", "Recorded on the guard’s file, with an expiry date."],
            [CalendarClock, "Refresher due", "Refreshers come round every 6 to 12 months."],
            [Ban, "Lapsed? Not rostered.", "The planner will not put that guard on a post that needs it."],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof Ban;
            return (
              <li key={t as string} data-seal="" style={{ ["--i" as string]: i }}>
                <I size={24} strokeWidth={1.6} aria-hidden="true" />
                <strong>{t as string}</strong>
                <p>{d as string}</p>
              </li>
            );
          })}
        </ol>
        <div style={{ marginTop: 48 }}>
          <Screen
            src="/images/v2/training-academy.jpg"
            alt="SDC Training Academy course catalogue in SDC Command, including courses in Hindi and Kannada"
            width={1600}
            height={705}
            label="SDC Command · Training academy"
          />
        </div>
      </Chapter>

      <Chapter tone="paper" labelledBy="tr-vet">
        <div className="v2-split">
          <div className="v2-scan-host v2-round">
            <Pic photo="academyBatch" sizes="(min-width: 900px) 50vw, 100vw" />
          </div>
          <div>
            <Rule />
            <Eyebrow>
              <Medal size={15} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: 6 }} />
              The ex-servicemen advantage
            </Eyebrow>
            <h2 className="v2-h2" id="tr-vet">
              Trained by people <Accent>who have served.</Accent>
            </h2>
            <p className="v2-lead" style={{ marginTop: 22 }}>
              SDC was founded by Lokesh PN after 17 years in the Indian Army, with specialised training at the Army
              Institute of Physical Training, Pune. That discipline shapes how we train: clear orders, practised drills
              and supervisors who lead from the front.
            </p>
            <div className="v2-actions">
              <Btn href={`${BASE}/careers`}>Join SDC</Btn>
              <Btn href={`${BASE}/about#leadership`} variant="ghost">
                Meet the leadership
              </Btn>
            </div>
          </div>
        </div>
      </Chapter>

      <CtaBand
        title={
          <>
            Trained people <Accent>for your site.</Accent>
          </>
        }
        text="Tell us about your site. We will show you the training path your guards follow before the first shift."
      />
    </>
  );
}
