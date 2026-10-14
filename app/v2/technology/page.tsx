import type { Metadata } from "next";
import {
  Activity,
  Ban,
  Camera,
  ClipboardList,
  FileText,
  Footprints,
  Languages,
  ListOrdered,
  MapPin,
  ReceiptText,
  ShieldAlert,
  Siren,
  UserCheck,
  WifiOff,
  History,
  Lock,
} from "lucide-react";
import { DEMO_URL, SURVEY_URL } from "@/components/v2/data";
import {
  Accent,
  ButtonLink,
  CtaBand,
  Eyebrow,
  PageHero,
  Screen,
  Section,
  SectionHead,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Technology: SDC Command",
  description:
    "SDC Command is SDC's own operations platform: a command centre, a deployment planner that blocks roster clashes, a guard app with selfie and GPS check-in, and a client portal.",
};

const blocks = [
  "The same guard on two posts",
  "Clashes with approved leave",
  "Too little rest between shifts",
  "Missing training for the post",
  "The wrong grade on a women’s post",
];

const appFeatures = [
  { icon: Camera, title: "Selfie check-in", text: "A photo taken on post at the start of every shift." },
  { icon: MapPin, title: "GPS confirmed", text: "Check-in is accepted inside the site boundary." },
  { icon: Siren, title: "SOS", text: "A one-press SOS from the post when help is needed." },
  { icon: FileText, title: "Incident reports", text: "Photo, time and place, filed from the post." },
  { icon: Footprints, title: "Patrol reports", text: "Rounds recorded as they happen, not written up later." },
  { icon: WifiOff, title: "Works offline", text: "Records are kept on the phone and sent when signal returns." },
  { icon: Languages, title: "Kannada, Hindi, English", text: "Guards use the app in the language they read best." },
];

const portal = [
  { icon: UserCheck, title: "Coverage and attendance", text: "Posts staffed against posts contracted, shift by shift." },
  { icon: ShieldAlert, title: "Incidents and risks", text: "Every incident logged and followed up, with risk surveys on record." },
  { icon: ReceiptText, title: "Reports and invoices", text: "Service reports and invoices built from approved attendance." },
  { icon: Lock, title: "Only your sites", text: "Your portal shows your sites and nothing else." },
];

export default function TechnologyPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Technology" }]}
        eyebrow="Technology · SDC Command"
        title={
          <>
            Security you can see. <Accent>Decisions you can trust.</Accent>
          </>
        }
        lead="SDC built its own operations platform rather than relying on duty sheets and phone calls. Human vigilance on the ground, machine intelligence behind it, and one clear picture for you."
        actions={
          <>
            <ButtonLink href={DEMO_URL} icon="up">
              Try the interactive demo
            </ButtonLink>
            <ButtonLink href={SURVEY_URL} variant="ghost">
              Ask for a walkthrough
            </ButtonLink>
          </>
        }
      />

      <Section tone="white" labelledBy="tech-cc">
        <div className="v2-split v2-split--wide-media">
          <div>
            <Eyebrow>Command centre</Eyebrow>
            <h2 className="v2-h2" id="tech-cc">
              Every site. <Accent>One picture.</Accent>
            </h2>
            <p className="v2-lead">
              On duty, present, open incidents and risks, across every site, on one screen. Sites are ranked by what
              needs attention now, so the worst problem is always at the top.
            </p>
            <ul className="v2-feature-grid" style={{ gridTemplateColumns: "1fr" }}>
              <li className="v2-feature">
                <Activity size={22} aria-hidden="true" />
                <h3>Every site, one picture</h3>
                <p>On duty, present, incidents and risks.</p>
              </li>
              <li className="v2-feature">
                <ListOrdered size={22} aria-hidden="true" />
                <h3>Worst first</h3>
                <p>Sites ranked by what needs attention now.</p>
              </li>
              <li className="v2-feature">
                <History size={22} aria-hidden="true" />
                <h3>A record behind every action</h3>
                <p>What changed, when, and by whom.</p>
              </li>
            </ul>
          </div>
          <Screen
            src="/images/v2/command-centre.jpg"
            alt="SDC Command centre showing people on duty, attendance, open incidents, sites ranked by urgency and a site map"
            width={1600}
            height={752}
            label="SDC Command · Command centre"
            caption="Screen from the demonstration workspace, with demo data."
          />
        </div>
      </Section>

      <Section tone="light" labelledBy="tech-planner">
        <SectionHead
          id="tech-planner"
          eyebrow="Deployment planner"
          title={
            <>
              The right guard on the right post, <Accent>every shift.</Accent>
            </>
          }
          lead="This answers the empty-post problem. Every roster is checked before it goes out, and a roster cannot be published with a clash in it."
        />
        <div className="v2-split v2-split--wide-media v2-split--top">
          <div>
            <p className="v2-tag">The planner blocks</p>
            <ul className="v2-blocks" style={{ marginTop: 14 }}>
              {blocks.map((b) => (
                <li key={b}>
                  <Ban size={18} aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="v2-forecast" style={{ marginTop: 20 }}>
              <strong>14</strong>
              <span>day shortfall forecast. Gaps show up two weeks ahead, not on the night.</span>
            </div>
          </div>
          <Screen
            src="/images/v2/deployment-planner.jpg"
            alt="Deployment planner for a hospital site: named guards on each post for the week, with uncovered control-room shifts flagged"
            width={1600}
            height={705}
            label="SDC Command · Deployment planner"
            caption="Screen from the demonstration workspace, with demo data."
          />
        </div>
      </Section>

      <Section tone="navy" labelledBy="tech-app" rings="right">
        <div className="v2-split">
          <div>
            <Eyebrow>Guard app</Eyebrow>
            <h2 className="v2-h2" id="tech-app">
              Proof <Accent>on the ground.</Accent>
            </h2>
            <p className="v2-lead">
              Every guard carries SDC’s app on their phone. It records who was on post, where and when, and gives them
              a direct line to help.
            </p>
            <ul className="v2-feature-grid" style={{ marginTop: 28 }}>
              {appFeatures.map((f) => (
                <li key={f.title} className="v2-feature">
                  <f.icon size={22} aria-hidden="true" />
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="v2-phone" role="img" aria-label="Illustration of the SDC guard app at the start of a shift: selfie check-in done, GPS confirmed inside the site, incident report and SOS buttons">
              <div className="v2-phone-screen" aria-hidden="true">
                <div className="v2-phone-top">
                  <small>SDC GUARD</small>
                  <strong>Start of shift</strong>
                </div>
                <ul className="v2-phone-list">
                  <li className="is-ok">
                    <span>
                      <Camera size={18} />
                    </span>
                    <div>
                      <strong>Selfie check-in</strong>
                      <small>Photo taken on post</small>
                    </div>
                  </li>
                  <li className="is-ok">
                    <span>
                      <MapPin size={18} />
                    </span>
                    <div>
                      <strong>GPS confirmed</strong>
                      <small>Inside the site boundary</small>
                    </div>
                  </li>
                  <li>
                    <span>
                      <ClipboardList size={18} />
                    </span>
                    <div>
                      <strong>Patrol round</strong>
                      <small>Next round due</small>
                    </div>
                  </li>
                  <li>
                    <span>
                      <FileText size={18} />
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
            <p className="v2-phone-caption">Guard app (illustrative)</p>
          </div>
        </div>
      </Section>

      <Section tone="white" labelledBy="tech-portal">
        <SectionHead
          id="tech-portal"
          eyebrow="Client portal"
          title={
            <>
              You see <Accent>what you are paying for.</Accent>
            </>
          }
          lead="Invoices are built from approved attendance, so you pay for posts actually covered. Facility heads can have a login from day one."
        />
        <ul className="v2-feature-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {portal.map((f) => (
            <li key={f.title} className="v2-feature">
              <f.icon size={22} aria-hidden="true" />
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 40 }}>
          <p className="v2-tag">From the post to your invoice</p>
          <ol className="v2-flow" style={{ marginTop: 14 }} aria-label="How attendance becomes an invoice">
            <li>Guard checks in with selfie and GPS</li>
            <li className="v2-flow-arrow" aria-hidden="true">→</li>
            <li>Supervisor approves attendance</li>
            <li className="v2-flow-arrow" aria-hidden="true">→</li>
            <li>Payroll runs on approved attendance</li>
            <li className="v2-flow-arrow" aria-hidden="true">→</li>
            <li>Your invoice and service report</li>
          </ol>
        </div>
      </Section>

      <Section tone="light" labelledBy="tech-academy">
        <div className="v2-split v2-split--wide-media">
          <div>
            <Eyebrow>Training academy</Eyebrow>
            <h2 className="v2-h2" id="tech-academy">
              The academy, <Accent>built into the platform.</Accent>
            </h2>
            <p className="v2-lead">
              Courses, certificates and expiry dates live in SDC Command, next to the roster. That is how a lapsed
              certificate stops a guard being rostered to a post that needs it.
            </p>
            <div className="v2-actions">
              <ButtonLink href="/v2/training" variant="navy">
                How we train
              </ButtonLink>
            </div>
          </div>
          <Screen
            src="/images/v2/training-academy.jpg"
            alt="SDC Training Academy course catalogue in SDC Command, including courses in Hindi and Kannada"
            width={1600}
            height={705}
            label="SDC Command · Training academy"
            caption="Screen from the demonstration workspace, with demo data."
          />
        </div>
      </Section>

      <CtaBand
        eyebrow="See it for yourself"
        title={
          <>
            Step inside <Accent>the command centre.</Accent>
          </>
        }
        text="Explore the interactive demo with sample data, or ask us for a live walkthrough after your site survey."
      >
        <ButtonLink href={DEMO_URL} icon="up">
          Open the interactive demo
        </ButtonLink>
      </CtaBand>
    </>
  );
}
