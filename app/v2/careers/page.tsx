import type { Metadata } from "next";
import { AlertTriangle, ArrowRight, Medal, ShieldCheck, SprayCan, UserCog, UserRound } from "lucide-react";
import { BASE, CAREERS_APPLY_URL, CAREERS_KN_URL, company, perks, whatsappLink } from "@/components/v2/data";
import { Accent, Btn, Chain, Chapter, Eyebrow, HeroPhoto, Intro, Pic, Route, Rule } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join SDC Security & Facility Services in Bengaluru: security guards, lady guards, supervisors, housekeeping and facility staff. EPF and ESI, training at our academy, clear career progression. Ex-servicemen especially welcome.",
};

const roles = [
  { icon: ShieldCheck, title: "Security guards", text: "Access control, patrols and visitor management at corporate, healthcare, industrial and residential sites." },
  { icon: UserRound, title: "Lady guards", text: "Women’s posts in wards, maternity, OPD, ladies’ hostels and libraries, on day and night shifts." },
  { icon: UserCog, title: "Security supervisors", text: "Lead shift teams, run site checks and keep clients informed." },
  { icon: SprayCan, title: "Housekeeping & facility staff", text: "Keep workplaces clean, safe and ready, with on-site supervision." },
];

const steps = [
  { title: "Apply", text: "Apply online, or WhatsApp or call us with your name, the role and where you live." },
  { title: "Selection", text: "Background verification, a physical fitness assessment, an aptitude test and a personal interview." },
  { title: "Training", text: "Induction at our Bengaluru academy, with uniform and a site induction before your first shift." },
  { title: "On post", text: "Start work with EPF and ESI, and keep growing through refreshers and leadership training." },
];

const WA = whatsappLink("Hello SDC, I would like to apply for a job. My name is ");

export default function CareersPage() {
  return (
    <>
      <HeroPhoto
        crumbs={[{ label: "Careers" }]}
        eyebrow="Careers at SDC"
        title={
          <>
            Served the nation. <Accent>Now serving your site.</Accent>
          </>
        }
        lead="Guards, lady guards, supervisors, housekeeping and facility staff. Whether you are experienced or just starting out, SDC offers training and a clear path to grow. Ex-servicemen especially welcome."
        photo="lineup"
        position="50% 35%"
        actions={
          <>
            <Btn href={CAREERS_APPLY_URL}>Apply now</Btn>
            <Btn href={WA} variant="secondary" icon="whatsapp">
              Apply on WhatsApp
            </Btn>
            <Btn href={`tel:${company.phone}`} variant="ghost" icon="phone">
              Call {company.phoneDisplay}
            </Btn>
          </>
        }
      />

      <Chapter tone="canvas" labelledBy="ca-kn" className="v2-ch--tight">
        <div className="v2-kn-band">
          <p lang="kn" className="v2-kn-text">
            ಈ ಪುಟವನ್ನು ಕನ್ನಡದಲ್ಲಿ ಓದಲು
          </p>
          <h2 className="v2-sr" id="ca-kn">
            Careers in Kannada
          </h2>
          <Btn href={CAREERS_KN_URL} variant="secondary">
            <span lang="kn">ಕನ್ನಡದಲ್ಲಿ ಉದ್ಯೋಗಗಳು</span> · Careers in Kannada
          </Btn>
        </div>
      </Chapter>

      <Chapter tone="paper" labelledBy="ca-roles">
        <Intro
          id="ca-roles"
          align="split"
          eyebrow="Roles"
          title={
            <>
              Find your post <Accent>on the team.</Accent>
            </>
          }
          lead="We are always looking for disciplined, dependable people to protect the places our clients care about."
        />
        <ul className="v2-roles">
          {roles.map((r, i) => (
            <li key={r.title} className="v2-role">
              <span className="v2-mono v2-role-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <r.icon size={28} strokeWidth={1.5} aria-hidden="true" />
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              <a className="v2-link" href={CAREERS_APPLY_URL}>
                Apply for this role <ArrowRight size={15} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter tone="deep" labelledBy="ca-why" rings>
        <div className="v2-split v2-split--top">
          <div className="v2-sticky">
            <Rule />
            <Eyebrow>Why SDC</Eyebrow>
            <h2 className="v2-h2 v2-h2--xl" id="ca-why">
              A team that <Accent>looks after its people.</Accent>
            </h2>
            <p className="v2-lead" style={{ marginTop: 24 }}>
              Training that never stops, EPF and ESI for everyone, and a guard app that makes your work visible and fair:
              your check-ins and rounds are on the record.
            </p>
          </div>
          <ul className="v2-perks">
            {perks.map((p, i) => (
              <li key={p}>
                <span className="v2-mono">{String(i + 1).padStart(2, "0")}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </Chapter>

      <section className="v2-vet v2-dark" aria-labelledby="ca-vet">
        <div className="v2-vet-media v2-scan-host">
          <Pic photo="fireBriefing" sizes="100vw" />
        </div>
        <div className="v2-wrap">
          <div className="v2-people-card">
            <Rule />
            <Eyebrow>
              <Medal size={15} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: 6 }} />
              Veteran pathway
            </Eyebrow>
            <h2 className="v2-h2" id="ca-vet">
              Your service <Accent>counts here.</Accent>
            </h2>
            <p className="v2-lead">
              SDC is founded and led by ex-servicemen. Bring your discipline and experience to a veteran-led organisation,
              with a clear path to supervisor and leadership roles.
            </p>
            <div className="v2-actions">
              <Btn href={CAREERS_APPLY_URL}>Apply as an ex-serviceman</Btn>
            </div>
          </div>
        </div>
      </section>

      <Chapter tone="canvas" labelledBy="ca-steps">
        <Intro
          id="ca-steps"
          eyebrow="How hiring works"
          title={
            <>
              Four steps <Accent>to your first shift.</Accent>
            </>
          }
        />
        <Route steps={steps} label="How hiring works" />
        <div className="v2-actions">
          <Btn href={CAREERS_APPLY_URL}>Apply now</Btn>
          <Btn href={WA} variant="secondary" icon="whatsapp">
            WhatsApp {company.phoneDisplay}
          </Btn>
          <Btn href={`mailto:${company.email}?subject=${encodeURIComponent("Job application")}`} variant="ghost" icon="none">
            Email {company.email}
          </Btn>
        </div>
      </Chapter>

      <section className="v2-scam-band v2-dark" aria-labelledby="ca-scam">
        <div className="v2-wrap v2-scam-grid">
          <AlertTriangle size={36} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h2 className="v2-h3" id="ca-scam">
              SDC never charges a fee for jobs.
            </h2>
            <p>
              If anyone asks you to pay for a job, training or a uniform in SDC’s name, do not pay. Call us on{" "}
              <a href={`tel:${company.phone}`}>{company.phoneDisplay}</a> to check.
            </p>
          </div>
        </div>
      </section>

      <Chapter tone="paper" labelledBy="ca-more" className="v2-ch--tight">
        <h2 className="v2-sr" id="ca-more">
          More about SDC
        </h2>
        <Chain
          label="More about SDC"
          items={[
            { title: "How we train", text: "Four checks before joining, then a five-stage training cycle.", href: `${BASE}/training`, link: "Training at SDC" },
            { title: "Who leads SDC", text: "Founded and led by ex-servicemen.", href: `${BASE}/about#leadership`, link: "Meet the leadership" },
          ]}
        />
      </Chapter>
    </>
  );
}
