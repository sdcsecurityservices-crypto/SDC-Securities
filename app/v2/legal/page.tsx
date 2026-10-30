import type { Metadata } from "next";
import { pageMeta } from "@/components/v2/seo";
import { ArrowRight, FileDown } from "lucide-react";
import { BASE, addressLines, company, iso } from "@/components/v2/data";
import { LegalBody, LegalHero, Sec } from "@/components/v2/legal";
import { legal } from "@/components/v2/legal-data";
import { Accent } from "@/components/v2/ui";

export const metadata: Metadata = pageMeta(
  "/legal",
  "Legal & Disclosures | SDC Security & Facility Services",
  "Privacy Policy, Terms of Use, grievance redressal, accessibility and corporate disclosures for SDC Security & Facility Services Pvt. Ltd., Bengaluru.",
);

const pages = [
  { href: `${BASE}/privacy`, title: "Privacy Policy", text: "What data we collect, why, how long we keep it, and your rights under the DPDP Act 2023." },
  { href: `${BASE}/terms`, title: "Terms of Use", text: "The rules for using our websites, the SDC Command demo and our content." },
  { href: `${BASE}/grievance`, title: "Grievance redressal", text: "Our Grievance Officer, how to complain, and how fast we respond." },
  { href: `${BASE}/accessibility`, title: "Accessibility", text: "What we have done to make the site usable for everyone, and how to report a problem." },
];

export default function LegalIndexPage() {
  return (
    <>
      <LegalHero
        parent={false}
        crumb="Legal & disclosures"
        eyebrow="Legal & disclosures"
        title={
          <>
            Policies and company details, <Accent>in one place.</Accent>
          </>
        }
        lead="Our privacy, terms, grievance and accessibility pages, and the registration details every client and job seeker can check."
      />
      <LegalBody>
        <Sec id="policies" title="Policies">
          <ul className="v2-legal-cards">
            {pages.map((p) => (
              <li key={p.href}>
                <a href={p.href}>
                  <strong>
                    {p.title}
                    <ArrowRight size={18} aria-hidden="true" />
                  </strong>
                  <span>{p.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </Sec>

        <Sec id="disclosures" title="Corporate disclosures">
          <dl className="v2-kv">
            <div>
              <dt>Company name</dt>
              <dd>{company.name}</dd>
            </div>
            <div>
              <dt>Corporate Identity Number (CIN)</dt>
              <dd className="v2-mono">{company.cin}</dd>
            </div>
            <div>
              <dt>Company type</dt>
              <dd>Private limited company, incorporated in Karnataka in 2017</dd>
            </div>
            <div>
              <dt>PSARA licence</dt>
              <dd className="v2-mono">{company.psara}</dd>
            </div>
            <div>
              <dt>ISO 9001:2015</dt>
              <dd>
                Certificate <span className="v2-mono">{iso.number}</span> ({iso.body}), valid to {iso.validTo}
              </dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>
                {company.phoneDisplay} · <a href={`mailto:${company.email}`}>{company.email}</a>
              </dd>
            </div>
          </dl>
          <dl className="v2-kv v2-kv--wide" style={{ marginTop: 16 }}>
            <div>
              <dt>Registered office</dt>
              <dd>
                {addressLines.map((l) => (
                  <span key={l} className="v2-block">
                    {l}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
          {/* Annual return (Form MGT-7A, Companies Act 2013 s.92(3)). Hidden until SDC supplies the
              filed MGT-7A PDF: set legal.annualReturnUrl in components/v2/legal-data.ts and this
              item appears. Do not publish a placeholder here. */}
          {legal.annualReturnUrl && (
            <p>
              <a className="v2-link" href={legal.annualReturnUrl} target="_blank" rel="noopener noreferrer">
                <FileDown size={17} aria-hidden="true" />
                {legal.annualReturnLabel} (PDF)
                <span className="v2-sr"> (opens in a new tab)</span>
              </a>
            </p>
          )}
          <p>
            Copies of our licence, certificate and registrations are available on request. See{" "}
            <a href={`${BASE}/compliance`}>Compliance &amp; credentials</a>.
          </p>
        </Sec>
      </LegalBody>
    </>
  );
}
