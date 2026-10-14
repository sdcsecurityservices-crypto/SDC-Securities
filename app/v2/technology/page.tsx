import type { Metadata } from "next";
import { Ban, Camera, ClipboardList, Database, Eye, FileText, Fingerprint, History, MapPin, Siren, WifiOff, Languages } from "lucide-react";
import { DEMO_URL, SURVEY_URL, dayInSystem } from "@/components/v2/data";
import { DayTimeline } from "@/components/v2/day-timeline";
import { Accent, Breadcrumbs, Btn, Chapter, CtaBand, Eyebrow, Intro, Numeral, Pic, Rule, Screen } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Technology: SDC Command",
  description:
    "SDC Command is SDC's own operations platform: a guard app with selfie and GPS check-in, an operations desk that blocks roster clashes, and a client portal that shows you what you pay for.",
};

function PhoneMock() {
  return (
    <div className="v2-phone" role="img" aria-label="Illustration of the SDC guard app at the start of a shift: selfie check-in done, GPS confirmed inside the site, patrol round and incident report, and an SOS button">
      <div className="v2-phone-screen" aria-hidden="true">
        <div className="v2-phone-top">
          <small>SDC GUARD · 18:00</small>
          <strong>Start of shift</strong>
        </div>
        <ul className="v2-phone-list">
          <li className="is-ok">
            <span>
              <Camera size={17} />
            </span>
            <div>
              <strong>Selfie check-in</strong>
              <small>Photo taken on post</small>
            </div>
          </li>
          <li className="is-ok">
            <span>
              <MapPin size={17} />
            </span>
            <div>
              <strong>GPS confirmed</strong>
              <small>Inside the site boundary</small>
            </div>
          </li>
          <li>
            <span>
              <ClipboardList size={17} />
            </span>
            <div>
              <strong>Patrol round</strong>
              <small>Next round due 21:00</small>
            </div>
          </li>
          <li>
            <span>
              <FileText size={17} />
            </span>
            <div>
              <strong>Incident report</strong>
              <small>Photo, time, place</small>
            </div>
          </li>
        </ul>
        <div className="v2-phone-sos">SOS</div>
      </div>
    </div>
  );
}

const modules = [
  {
    id: "guard-app",
    eyebrow: "01 · Guard app",
    title: (
      <>
        Proof <Accent>on the ground.</Accent>
      </>
    ),
    text: "Every guard carries SDC’s app. It records who was on post, where and when, and gives them a direct line to help.",
    points: [
      [Camera, "Selfie check-in", "A photo on post at the start of every shift."],
      [MapPin, "GPS confirmed", "Check-in is accepted inside the site boundary."],
      [Siren, "SOS", "A one-press SOS from the post."],
      [FileText, "Incident and patrol reports", "Photo, time and place, filed from the post."],
      [WifiOff, "Works offline", "Records are kept on the phone and sent when signal returns."],
      [Languages, "Kannada, Hindi, English", "Guards use the app in the language they read best."],
    ],
  },
  {
    id: "ops-desk",
    eyebrow: "02 · Operations desk",
    title: (
      <>
        The right guard on the right post, <Accent>every shift.</Accent>
      </>
    ),
    text: "Every roster is checked before it goes out, and a roster cannot be published with a clash in it.",
    points: [
      [Ban, "Same guard on two posts", "Blocked."],
      [Ban, "Clashes with approved leave", "Blocked."],
      [Ban, "Too little rest between shifts", "Blocked."],
      [Ban, "Missing training for the post", "Blocked."],
      [Ban, "Wrong grade on a women’s post", "Blocked."],
    ],
  },
];

export default function TechnologyPage() {
  return (
    <>
      <section className="v2-product-hero v2-dark" aria-labelledby="v2-page-title" data-torch="">
        <div className="v2-product-bg">
          <Pic photo="campus" priority sizes="100vw" />
        </div>
        <div className="v2-hero-shade" aria-hidden="true" />
        <div className="v2-torch" aria-hidden="true" />
        <div className="v2-wrap v2-product-grid">
          <div>
            <Breadcrumbs items={[{ label: "Technology" }]} />
            <Rule />
            <Eyebrow>SDC Command · our own platform</Eyebrow>
            <h1 id="v2-page-title" className="v2-h1 v2-h1--xl">
              Every guard checks in. Every round is logged. <Accent>You see it live.</Accent>
            </h1>
            <p className="v2-hero-lead">
              SDC built its own operations platform rather than relying on duty sheets and phone calls: a guard app, an
              operations desk and a client portal, on one record.
            </p>
            <div className="v2-actions">
              <Btn href={DEMO_URL} icon="up">
                Try the interactive demo
              </Btn>
              <Btn href={SURVEY_URL} variant="secondary">
                Book a walkthrough
              </Btn>
            </div>
          </div>
          <div className="v2-devices">
            <div className="v2-laptop">
              <img src="/images/v2/command-centre.jpg" alt="SDC Command centre on a laptop: people on duty, attendance, open incidents and a site map (demo data)" width={1600} height={752} />
            </div>
            <PhoneMock />
            <p className="v2-mono-cap v2-devices-note">Demo data · guard app illustrative</p>
          </div>
        </div>
      </section>

      <Chapter tone="canvas" labelledBy="tech-problem">
        <div className="v2-problem">
          <div>
            <Rule />
            <Eyebrow>The problem</Eyebrow>
            <h2 className="v2-h2 v2-h2--xl" id="tech-problem">
              You can’t see <Accent>what happens at night.</Accent>
            </h2>
          </div>
          <div className="v2-problem-side">
            <p className="v2-lead">
              Paper registers and phone calls, with nothing to check them against. A guard doesn’t turn up, and the
              client finds out only when something happens.
            </p>
            <div className="v2-problem-stat">
              <Numeral value="14" className="v2-big-num v2-big-num--navy" />
              <p>
                <strong>day shortfall forecast.</strong> Gaps show up two weeks ahead on SDC Command, not on the night.
              </p>
            </div>
          </div>
        </div>
      </Chapter>

      {modules.map((m, i) => (
        <Chapter key={m.id} tone={i === 0 ? "deep" : "paper"} labelledBy={m.id} rings={i === 0}>
          <div className={`v2-split v2-split--media${i % 2 ? " v2-split--flip" : ""}`}>
            <div>
              <Rule />
              <Eyebrow>{m.eyebrow}</Eyebrow>
              <h2 className="v2-h2" id={m.id}>
                {m.title}
              </h2>
              <p className="v2-lead" style={{ marginTop: 22 }}>
                {m.text}
              </p>
              <ol className={`v2-points${i === 1 ? " v2-points--blocks" : ""}`}>
                {m.points.map(([Icon, t, d]) => {
                  const I = Icon as typeof Ban;
                  return (
                    <li key={t as string}>
                      <I size={20} strokeWidth={1.7} aria-hidden="true" />
                      <span>
                        <strong>{t as string}</strong> {d as string}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
            {i === 0 ? (
              <div className="v2-guard-media">
                <div className="v2-scan-host v2-round">
                  <Pic photo="hoseRaise" sizes="(min-width: 900px) 50vw, 100vw" />
                </div>
                <PhoneMock />
              </div>
            ) : (
              <Screen
                src="/images/v2/deployment-planner.jpg"
                alt="Deployment planner for a hospital site: named guards on each post for the week, with uncovered control-room shifts flagged"
                width={1600}
                height={705}
                label="SDC Command · Deployment planner"
                callouts={[
                  { n: 1, x: 30, y: 52 },
                  { n: 2, x: 62, y: 78 },
                ]}
              />
            )}
          </div>
        </Chapter>
      ))}

      <Chapter tone="navy" labelledBy="tech-portal">
        <div className="v2-split v2-split--media v2-split--flip">
          <div>
            <Rule />
            <Eyebrow>03 · Client portal</Eyebrow>
            <h2 className="v2-h2" id="tech-portal">
              You see <Accent>what you are paying for.</Accent>
            </h2>
            <ol className="v2-callout-list">
              <li>
                <span>1</span>
                <div>
                  <strong>Coverage and attendance</strong>
                  <p>Posts staffed against posts contracted, shift by shift.</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Incidents and risks</strong>
                  <p>Every incident logged and followed up, with risk surveys on record.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Reports and invoices</strong>
                  <p>Built from approved attendance, so you pay for posts actually covered.</p>
                </div>
              </li>
            </ol>
          </div>
          <Screen
            src="/images/v2/command-centre.jpg"
            alt="SDC Command centre showing people on duty, attendance, open incidents, sites ranked by urgency and a site map"
            width={1600}
            height={752}
            label="SDC Command · Command centre"
            callouts={[
              { n: 1, x: 22, y: 30 },
              { n: 2, x: 52, y: 30 },
              { n: 3, x: 74, y: 62 },
            ]}
          />
        </div>
      </Chapter>

      <Chapter tone="deep" labelledBy="tech-day" rings>
        <Intro
          id="tech-day"
          align="split"
          eyebrow="A day in the system"
          title={
            <>
              One night shift, <Accent>start to finish.</Accent>
            </>
          }
          lead="An illustrative night shift on SDC Command, from the first check-in to the morning report."
        />
        <DayTimeline items={dayInSystem} />
      </Chapter>

      <Chapter tone="canvas" labelledBy="tech-privacy">
        <div className="v2-split v2-split--top">
          <div>
            <Rule />
            <Eyebrow>Data and privacy</Eyebrow>
            <h2 className="v2-h2" id="tech-privacy">
              Who sees what, <Accent>and who changed it.</Accent>
            </h2>
          </div>
          <ul className="v2-privacy">
            <li>
              <Eye size={22} strokeWidth={1.6} aria-hidden="true" />
              <span>
                <strong>Only your sites.</strong> Your client portal shows your sites and nothing else, enforced by the
                database.
              </span>
            </li>
            <li>
              <Fingerprint size={22} strokeWidth={1.6} aria-hidden="true" />
              <span>
                <strong>Personal data protected.</strong> Guards’ ID and bank details are encrypted.
              </span>
            </li>
            <li>
              <History size={22} strokeWidth={1.6} aria-hidden="true" />
              <span>
                <strong>A record behind every action.</strong> What changed, when, and by whom.
              </span>
            </li>
            <li>
              <Database size={22} strokeWidth={1.6} aria-hidden="true" />
              <span>
                <strong>One record.</strong> Attendance, payroll and invoices come from the same approved data.
              </span>
            </li>
          </ul>
        </div>
      </Chapter>

      <CtaBand
        eyebrow="See it for yourself"
        title={
          <>
            Step inside <Accent>the command centre.</Accent>
          </>
        }
        text="Explore the interactive demo with sample data, or ask for a walkthrough after your site survey."
      >
        <Btn href={DEMO_URL} icon="up">
          Open the interactive demo
        </Btn>
      </CtaBand>
    </>
  );
}
