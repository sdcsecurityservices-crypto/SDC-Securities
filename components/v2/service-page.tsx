import { ArrowRight } from "lucide-react";
import { equipment } from "./extras-data";
import { JsonLd, pageMeta, serviceSchema } from "./seo";
import { BASE, SURVEY_URL, company, industryBySlug, iso, serviceBySlug, services, type ServiceSlug } from "./data";
import {
  Accent,
  Btn,
  Chapter,
  CtaBand,
  Eyebrow,
  Faq,
  HeroSplit,
  Intro,
  Pic,
  Route,
  Rule,
  Screen,
  ServiceLinks,
  industryIcons,
} from "./ui";

// What people search for, per service: the page title and description in Google.
const serviceSearch: Record<ServiceSlug, { title: string; description: string }> = {
  security: {
    title: "Security Guard Services in Bengaluru | SDC Security",
    description: "Trained, PSARA-licensed security guards and lady guards for offices, hospitals, colleges, factories and apartments in Bengaluru, led by ex-servicemen.",
  },
  "facility-management": {
    title: "Facility Management Services in Bengaluru | SDC",
    description: "Facility management in Bengaluru: building maintenance, electrical and plumbing, fire safety, pest control, landscaping and housekeeping from one partner.",
  },
  housekeeping: {
    title: "Housekeeping Services in Bengaluru | SDC",
    description: "Professional housekeeping and cleaning staff for offices, hospitals, colleges and apartments in Bengaluru: trained teams, eco-friendly products, supervised daily.",
  },
  manpower: {
    title: "Manpower Supply Services in Bengaluru | SDC",
    description: "Manpower supply in Bengaluru: verified, trained staff for security, housekeeping, factories, front office, logistics and catering, from one partner.",
  },
  "payroll-compliance": {
    title: "Payroll & Statutory Compliance Services in Bengaluru | SDC",
    description: "Payroll and statutory compliance for contract staff in Bengaluru: attendance, wages, EPF, ESI, professional tax and labour-law records kept up to date.",
  },
};

export function serviceMetadata(slug: ServiceSlug) {
  const { title, description } = serviceSearch[slug];
  return pageMeta(`/services/${slug}`, title, description);
}

const deliverySteps = () => [
  { title: "Selection", text: "Background verification, fitness, aptitude and a personal interview for every person we place.", tag: "Verified on file" },
  { title: "Training", text: "Induction, then a site induction on your layout, codes and contacts before the first shift.", tag: "Certificates tracked" },
  { title: "Deployment", text: "Every roster is checked for clashes, rest and training before it goes out.", tag: "Deployment planner" },
  { title: "Supervision", text: "Selfie and GPS check-in every shift, reports from the post, and a supervisor who answers for it.", tag: "Guard app · portal" },
];

const complianceNote: Record<ServiceSlug, { title: string; text: string }> = {
  security: {
    title: `PSARA licence ${company.psara}`,
    text: "SDC is licensed under the Private Security Agencies (Regulation) Act to run a private security agency. Every guard completes PSARA basic training before deployment.",
  },
  "facility-management": {
    title: `ISO 9001:2015 · ${iso.number}`,
    text: "Our quality management system is certified to ISO 9001:2015. Facility staff are SDC employees, with EPF and ESI paid for every one of them.",
  },
  housekeeping: {
    title: `ISO 9001:2015 · ${iso.number}`,
    text: "Housekeeping is within the scope of our ISO 9001:2015 certificate. Housekeeping staff are SDC employees, with EPF and ESI paid for every one of them.",
  },
  manpower: {
    title: "EPF · ESI · payslips",
    text: "Manpower supply is within the scope of our ISO 9001:2015 certificate. Every person is on SDC’s payroll, with EPF and ESI paid and a payslip every month.",
  },
  "payroll-compliance": {
    title: "EPF · ESI · GST registered",
    text: "SDC is registered for EPF, ESI, GST, Shops and Establishments and Karnataka Professional Tax. Wages run only on approved attendance.",
  },
};

const compliantMonth = [
  "Attendance recorded on the guard app, every shift",
  "Attendance approved by the supervisor",
  "Wages calculated from approved attendance",
  "A payslip issued to every person",
  "EPF contributions paid for every employee",
  "ESI contributions paid for every employee",
  "Invoice built from the same approved attendance",
  "Reports and invoice available in your client portal",
];

export function ServicePage({ slug }: { slug: ServiceSlug }) {
  const s = serviceBySlug(slug);
  const isPayroll = slug === "payroll-compliance";
  const related = services.filter((x) => s.related.includes(x.slug));
  const survey = `${SURVEY_URL.replace("#survey", "")}?service=${slug}#survey`;
  return (
    <>
      <JsonLd data={serviceSchema(`/services/${slug}`, s.name, serviceSearch[slug].description)} />
      <HeroSplit
        crumbs={[{ label: "Services", href: `${BASE}/services` }, { label: s.name }]}
        eyebrow={s.name}
        title={
          <>
            {s.headline[0]} <Accent>{s.headline[1]}</Accent>
          </>
        }
        lead={s.summary}
        ticks={s.highlights}
        photo={s.photo}
        actions={
          <>
            <Btn href={survey}>Request a site survey</Btn>
            <Btn href="#included" variant="ghost">
              What is included
            </Btn>
          </>
        }
      />

      <Chapter tone="paper" labelledBy="svc-included" id="included">
        <div className="v2-split v2-split--top">
          <div>
            <Rule />
            <Eyebrow>What is included</Eyebrow>
            <h2 className="v2-h2" id="svc-included">
              The full scope, <Accent>in writing.</Accent>
            </h2>
            {s.intro.map((p) => (
              <p className="v2-lead" key={p.slice(0, 24)} style={{ marginTop: 22 }}>
                {p}
              </p>
            ))}
            <div className="v2-for-who">
              <p className="v2-mono-cap">Who it’s for</p>
              <p>{s.forWho}</p>
            </div>
          </div>
          <div className="v2-scope">
            <p className="v2-mono-cap">{s.includes.length} items · agreed before the first shift</p>
            <ol>
              {s.includes.map((t, i) => (
                <li key={t}>
                  <span className="v2-mono">{String(i + 1).padStart(2, "0")}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Chapter>

      {isPayroll && (
        <Chapter tone="deep" labelledBy="svc-month" rings>
          <div className="v2-split v2-split--top">
            <div>
              <Rule />
              <Eyebrow>For buyers and finance teams</Eyebrow>
              <h2 className="v2-h2 v2-h2--xl" id="svc-month">
                What a compliant month <Accent>looks like.</Accent>
              </h2>
              <p className="v2-lead" style={{ marginTop: 24 }}>
                When a contractor skips PF or ESI, the principal employer carries the risk. Here is what SDC does every
                month, so you can check it rather than take it on trust.
              </p>
            </div>
            <ol className="v2-month">
              {compliantMonth.map((t, i) => (
                <li key={t}>
                  <span className="v2-mono">{String(i + 1).padStart(2, "0")}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </Chapter>
      )}

      {slug === "security" && equipment.show && (
        <Chapter tone="stone" labelledBy="svc-equip">
          <Intro
            id="svc-equip"
            eyebrow="Equipment"
            title={
              <>
                People first, <Accent>with the right kit.</Accent>
              </>
            }
            lead="Equipment we supply, install or manage alongside our guards."
          />
          <div className="v2-equip">
            {equipment.groups.map((g) => (
              <div key={g.title} className="v2-equip-card">
                <h3>{g.title}</h3>
                <ul>
                  {g.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Chapter>
      )}

      <Chapter tone="canvas" labelledBy="svc-delivery">
        <Intro
          id="svc-delivery"
          align="split"
          eyebrow="How we deliver"
          title={
            <>
              Selection to supervision, <Accent>on SDC Command.</Accent>
            </>
          }
          lead="The same disciplined routine on every site, with an SDC Command touchpoint at each step."
        />
        <Route steps={deliverySteps()} label={`How SDC delivers ${s.name.toLowerCase()}`} />
      </Chapter>

      <Chapter tone="navy" labelledBy="svc-portal">
        <div className="v2-split v2-split--media">
          <div>
            <Rule />
            <Eyebrow>What you see</Eyebrow>
            <h2 className="v2-h2" id="svc-portal">
              Your sites, <Accent>in your client portal.</Accent>
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
                  <p>Every incident logged and followed up.</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Sites that need attention</strong>
                  <p>Ranked worst first, so problems surface early.</p>
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
              { n: 3, x: 26, y: 62 },
            ]}
          />
        </div>
      </Chapter>

      <Chapter tone="paper" labelledBy="svc-fit">
        <div className="v2-split v2-split--top">
          <div>
            <Rule />
            <Eyebrow>Where it fits</Eyebrow>
            <h2 className="v2-h2" id="svc-fit">
              Sectors this <Accent>suits.</Accent>
            </h2>
            <ul className="v2-sector-chips">
              {s.sectors.map((sl) => {
                const ind = industryBySlug(sl);
                const Icon = industryIcons[ind.icon];
                return (
                  <li key={sl}>
                    <a href={`${BASE}/industries#${sl}`}>
                      <Icon size={18} aria-hidden="true" />
                      {ind.name}
                      <ArrowRight size={15} aria-hidden="true" className="v2-btn-arrow" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="v2-compliance-note">
            <p className="v2-mono-cap">Compliance for this service</p>
            <h3 className="v2-h3">{complianceNote[slug].title}</h3>
            <p>{complianceNote[slug].text}</p>
            <a className="v2-link" href={`${BASE}/compliance`}>
              All licences and registrations <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </Chapter>

      <Chapter tone="canvas" labelledBy="faq-title">
        <div className="v2-split v2-split--top">
          <div>
            <Rule />
            <Eyebrow>Questions</Eyebrow>
            <p className="v2-h2" aria-hidden="true">
              Asked <Accent>and answered.</Accent>
            </p>
            <div className="v2-scan-host v2-faq-photo">
              <Pic photo={slug === "security" ? "hoseRaise" : slug === "manpower" ? "classroomWide" : "trainer"} sizes="(min-width: 900px) 40vw, 100vw" />
            </div>
          </div>
          <Faq items={s.faq} />
        </div>
      </Chapter>

      <Chapter tone="stone" labelledBy="v2-related-title" className="v2-ch--tight">
        <h2 className="v2-h3" id="v2-related-title" style={{ marginBottom: 22 }}>
          Related services
        </h2>
        <ServiceLinks list={related} />
      </Chapter>

      <CtaBand
        title={
          <>
            Let’s plan your <Accent>{s.short.toLowerCase()}.</Accent>
          </>
        }
      >
        <Btn href={survey}>Request a site survey</Btn>
      </CtaBand>
    </>
  );
}
