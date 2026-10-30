import type { Metadata } from "next";
import { pageMeta } from "@/components/v2/seo";
import { Building2, CheckCircle2, FileBadge, Landmark, ReceiptText, ShieldCheck, Store, Users, XCircle } from "lucide-react";
import { BASE, company, iso } from "@/components/v2/data";
import { Accent, Btn, Chapter, CtaBand, Eyebrow, HeroCompact, Intro, Rule } from "@/components/v2/ui";

export const metadata: Metadata = pageMeta(
  "/compliance",
  "PSARA Licence & ISO 9001:2015 Compliance | SDC Security",
  "SDC holds PSARA licence ISD/PSA-64/2019 and ISO 9001:2015 certification, and is registered for EPF, ESI, GST and Karnataka Professional Tax.",
);

const pack = `mailto:${company.email}?subject=${encodeURIComponent("Request for SDC compliance pack")}&body=${encodeURIComponent(
  "Hello SDC,\n\nPlease share your compliance pack (PSARA licence, ISO 9001:2015 certificate and registration documents).\n\nName:\nOrganisation:\n",
)}`;

const creds = [
  { icon: ShieldCheck, tag: "Licensed", name: "PSARA licence", value: company.psara, text: "Granted 2019 under the Private Security Agencies (Regulation) Act to run a private security agency." },
  { icon: FileBadge, tag: "Certified", name: "ISO 9001:2015", value: iso.number, text: `${iso.body}. Registered ${iso.registered}, valid to ${iso.validTo}. Scope: ${iso.scope.toLowerCase()}.` },
  { icon: Building2, tag: "Incorporated", name: "Private limited, 2017", value: company.cin, text: "Incorporated in Bengaluru as SDC Security & Facility Services Pvt. Ltd." },
  { icon: Users, tag: "Registered", name: "EPF", value: "Employees’ Provident Fund", text: "Provident fund contributions for every employee." },
  { icon: Users, tag: "Registered", name: "ESI", value: "Employees’ State Insurance", text: "State insurance cover for every employee." },
  { icon: ReceiptText, tag: "Registered", name: "GST", value: "Goods and Services Tax", text: "Registered under the Goods and Services Tax Act." },
  { icon: Store, tag: "Licensed", name: "Shops and Establishments", value: "Karnataka", text: "A licensed establishment under the Shops and Establishments Act." },
  { icon: Landmark, tag: "Registered", name: "Professional Tax", value: "Karnataka", text: "Registered for Karnataka Professional Tax." },
];

export default function CompliancePage() {
  return (
    <>
      <HeroCompact
        crumbs={[{ label: "About", href: `${BASE}/about` }, { label: "Compliance" }]}
        eyebrow="Compliance"
        title={
          <>
            Licensed, certified, and happy to <Accent>show you the paperwork.</Accent>
          </>
        }
        lead="When a contractor cuts corners on PF or ESI, the client carries the risk. With SDC, every licence and registration is on the record, and copies are available on request."
        actions={
          <>
            <Btn href={pack}>Request our compliance pack</Btn>
            <Btn href="#iso" variant="ghost">
              See the ISO certificate
            </Btn>
          </>
        }
        aside={
          <dl className="v2-licence-card">
            <div>
              <dt className="v2-mono-cap">PSARA licence</dt>
              <dd className="v2-mono">{company.psara}</dd>
            </div>
            <div>
              <dt className="v2-mono-cap">ISO 9001:2015</dt>
              <dd className="v2-mono">{iso.number}</dd>
            </div>
            <div>
              <dt className="v2-mono-cap">CIN</dt>
              <dd className="v2-mono">{company.cin}</dd>
            </div>
          </dl>
        }
      />

      <Chapter tone="paper" labelledBy="co-grid">
        <Intro
          id="co-grid"
          align="split"
          eyebrow="Credentials"
          title={
            <>
              Every licence, <Accent>on the record.</Accent>
            </>
          }
          lead="Copies of each are available on request, along with our EPF ownership declaration."
        />
        <ul className="v2-cred-grid">
          {creds.map((c, i) => (
            <li key={c.name} className="v2-cred" data-seal="" style={{ ["--i" as string]: i }}>
              <span className="v2-seal-icon" aria-hidden="true">
                <c.icon size={22} strokeWidth={1.6} />
              </span>
              <p className="v2-mono-cap">{c.tag}</p>
              <h3>{c.name}</h3>
              <p className="v2-cred-value">{c.value}</p>
              <p>{c.text}</p>
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter tone="canvas" id="iso" labelledBy="co-iso">
        <div className="v2-split">
          <a className="v2-cert-image" href="/images/v2/iso-9001.jpg" target="_blank" rel="noopener noreferrer">
            <img
              src="/images/v2/iso-9001.jpg"
              alt="ISO 9001:2015 certificate of registration for SDC Security Services Pvt. Ltd., certificate number QMS24221266"
              width={900}
              height={1272}
              loading="lazy"
              data-scan=""
            />
            <span className="v2-sr">View the full-size certificate (opens in a new tab)</span>
          </a>
          <div>
            <Rule />
            <Eyebrow>Quality management</Eyebrow>
            <h2 className="v2-h2" id="co-iso">
              ISO 9001:2015 <Accent>certified.</Accent>
            </h2>
            <p className="v2-lead" style={{ marginTop: 22 }}>
              Our quality management system is certified for the services clients rely on most: security, housekeeping
              and manpower supply. Supervisors inspect sites against written post orders, and every month we review
              coverage, incidents and improvements with the client.
            </p>
            <dl className="v2-cert-meta">
              {[
                ["Standard", iso.standard],
                ["Certificate", iso.number],
                ["Certified by", iso.body],
                ["Registered", iso.registered],
                ["Valid to", iso.validTo],
                ["Scope", iso.scope],
              ].map(([a, b]) => (
                <div key={a}>
                  <dt className="v2-mono-cap">{a}</dt>
                  <dd>{b}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Chapter>

      <Chapter tone="deep" labelledBy="co-means" rings>
        <Intro
          id="co-means"
          align="split"
          eyebrow="Statutory compliance for staff"
          title={
            <>
              No PF or ESI risk <Accent>passed on to you.</Accent>
            </>
          }
          lead="Unpaid statutory dues, missing records and unverified staff become the client’s problem. This is what SDC handles."
        />
        <div className="v2-compare">
          <div>
            <h3>The usual risks with a contractor</h3>
            <ul>
              {[
                "PF and ESI not paid, leaving the principal employer exposed",
                "Staff on site with no background check on file",
                "Wages paid on guesswork, with no payslips",
                "Invoices that do not match the posts covered",
                "Personal data in registers anyone can read",
              ].map((t) => (
                <li key={t}>
                  <XCircle size={18} aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>How SDC handles it</h3>
            <ul>
              {[
                "EPF and ESI paid for every employee on your site",
                "Verification status kept on every employee’s file",
                "Wages run only on approved attendance, with payslips for every guard",
                "Invoices built from the same approved attendance",
                "ID and bank details encrypted, and every change logged",
              ].map((t) => (
                <li key={t}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Chapter>

      <CtaBand
        eyebrow="Credentials available on request"
        title={
          <>
            Ask for the documents. <Accent>We’ll send them.</Accent>
          </>
        }
        text="Copies of the PSARA licence, ISO 9001:2015 certificate and registration documents, ready for your procurement or compliance team."
      >
        <Btn href={pack}>Request our compliance pack</Btn>
      </CtaBand>
    </>
  );
}
