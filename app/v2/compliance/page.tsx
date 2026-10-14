import type { Metadata } from "next";
import { Building2, CheckCircle2, FileBadge, Landmark, ReceiptText, ShieldCheck, Store, Users, XCircle } from "lucide-react";
import { company, iso } from "@/components/v2/data";
import {
  Accent,
  ButtonLink,
  CtaBand,
  Eyebrow,
  PageHero,
  Section,
  SectionHead,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Compliance & credentials",
  description:
    "SDC holds PSARA licence ISD/PSA-64/2019 and ISO 9001:2015 certificate QMS24221266, and is registered for EPF, ESI, GST, Shops and Establishments and Karnataka Professional Tax. CIN U74999KA2017PTC103762.",
};

const credentialsMail = `mailto:${company.email}?subject=${encodeURIComponent("Request for company credentials")}&body=${encodeURIComponent(
  "Hello SDC,\n\nPlease share copies of your company credentials (PSARA licence, ISO 9001:2015 certificate and registrations).\n\nName:\nOrganisation:\n",
)}`;

const registrations = [
  { icon: ShieldCheck, tag: "Licensed", title: "PSARA licence", code: company.psara, text: "Licensed in 2019 under the Private Security Agencies (Regulation) Act to run a private security agency." },
  { icon: FileBadge, tag: "Certified", title: "ISO 9001:2015", code: `${iso.number} · ${iso.body}`, text: `Quality management certified for ${iso.scope.toLowerCase()}. Valid to ${iso.validTo}.` },
  { icon: Building2, tag: "Incorporated", title: "Private limited, 2017", code: `CIN ${company.cin}`, text: "Incorporated in Bengaluru as SDC Security & Facility Services Pvt. Ltd." },
  { icon: Users, tag: "Registered", title: "EPF", code: "Employees’ Provident Fund", text: "Provident fund contributions for every employee." },
  { icon: Users, tag: "Registered", title: "ESI", code: "Employees’ State Insurance", text: "State insurance cover for every employee." },
  { icon: ReceiptText, tag: "Registered", title: "GST", code: "Goods and Services Tax", text: "Registered under the Goods and Services Tax." },
  { icon: Store, tag: "Licensed", title: "Shops and Establishments", code: "Karnataka", text: "A licensed establishment under the Shops and Establishments Act." },
  { icon: Landmark, tag: "Registered", title: "Professional Tax", code: "Karnataka", text: "Registered for Karnataka Professional Tax." },
];

export default function CompliancePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Company" }, { label: "Compliance" }]}
        eyebrow="Compliance"
        title={
          <>
            Trust has a <Accent>paper trail.</Accent>
          </>
        }
        lead="Licensed, certified and registered, with the documents to prove it. When a contractor cuts corners on PF or ESI, the client carries the risk. With SDC, you do not."
        actions={
          <>
            <ButtonLink href={credentialsMail}>Request our credentials</ButtonLink>
            <ButtonLink href="#iso" variant="ghost">
              See the ISO certificate
            </ButtonLink>
          </>
        }
      />

      <Section tone="white" labelledBy="co-regs">
        <SectionHead
          id="co-regs"
          eyebrow="Licences & registrations"
          title={
            <>
              Every licence, <Accent>on the record.</Accent>
            </>
          }
          lead="Copies of each are available on request, along with our EPF ownership declaration."
        />
        <ul className="v2-reg-grid">
          {registrations.map((r) => (
            <li key={r.title} className="v2-card v2-reg">
              <span className="v2-icon-bubble" aria-hidden="true">
                <r.icon size={22} strokeWidth={1.7} />
              </span>
              <p className="v2-tag">{r.tag}</p>
              <h3>{r.title}</h3>
              <code>{r.code}</code>
              <p>{r.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="light" id="iso" labelledBy="co-iso">
        <div className="v2-cert">
          <a className="v2-cert-image" href="/images/v2/iso-9001.jpg" target="_blank" rel="noopener noreferrer">
            <img
              src="/images/v2/iso-9001.jpg"
              alt="ISO 9001:2015 certificate of registration for SDC Security Services Pvt. Ltd., certificate number QMS24221266"
              width={900}
              height={1272}
              loading="lazy"
            />
            <span className="v2-sr">Open the full-size certificate in a new tab</span>
          </a>
          <div>
            <Eyebrow>Quality management</Eyebrow>
            <h2 className="v2-h2" id="co-iso">
              ISO 9001:2015 <Accent>certified.</Accent>
            </h2>
            <p className="v2-lead">
              Our quality management system is certified to ISO 9001:2015 for the services clients rely on most:
              security, housekeeping and manpower supply.
            </p>
            <dl className="v2-cert-meta">
              <div>
                <dt>Standard</dt>
                <dd>{iso.standard}</dd>
              </div>
              <div>
                <dt>Certificate</dt>
                <dd>{iso.number}</dd>
              </div>
              <div>
                <dt>Certified by</dt>
                <dd>{iso.body}</dd>
              </div>
              <div>
                <dt>Valid to</dt>
                <dd>{iso.validTo}</dd>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <dt>Scope</dt>
                <dd>{iso.scope}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>

      <Section tone="deep" labelledBy="co-means" rings="right">
        <SectionHead
          id="co-means"
          eyebrow="What it means for you"
          title={
            <>
              No PF or ESI risk <Accent>passed on to you.</Accent>
            </>
          }
          lead="Unpaid statutory dues, missing records and unverified staff become the client’s problem. Here is how SDC keeps them off your desk."
        />
        <div className="v2-compare">
          <div>
            <h3>The usual risks with a contractor</h3>
            <ul>
              {[
                "PF and ESI not paid, leaving the principal employer liable",
                "Staff on site with no background check on file",
                "Wages paid on guesswork, with no payslips",
                "Invoices that do not match the posts covered",
                "Personal data kept in registers anyone can read",
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
        <p className="v2-fineprint">Company credentials are available on request.</p>
      </Section>

      <CtaBand
        eyebrow="Credentials available on request"
        title={
          <>
            Ask for the documents. <Accent>We will send them.</Accent>
          </>
        }
        text="Copies of the PSARA licence, ISO 9001:2015 certificate and registration documents are ready to share with your procurement or compliance team."
      >
        <ButtonLink href={credentialsMail}>Request our credentials</ButtonLink>
      </CtaBand>
    </>
  );
}
