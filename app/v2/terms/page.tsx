import type { Metadata } from "next";
import { pageMeta } from "@/components/v2/seo";
import { BASE, HOME, company } from "@/components/v2/data";
import { LegalBody, LegalHero, Ph, Sec } from "@/components/v2/legal";
import { legal } from "@/components/v2/legal-data";
import { Accent } from "@/components/v2/ui";

export const metadata: Metadata = pageMeta(
  "/terms",
  "Terms of Use | SDC Security & Facility Services",
  "The terms for using the SDC Security & Facility Services websites, the SDC Command demo and our content.",
);

const toc = [
  { id: "acceptance", label: "Accepting these terms" },
  { id: "information", label: "About SDC and the information here" },
  { id: "demo", label: "The SDC Command demo" },
  { id: "ip", label: "Intellectual property" },
  { id: "use", label: "Acceptable use" },
  { id: "links", label: "Links to other websites" },
  { id: "recruitment", label: "Recruitment and job fraud" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Limitation of liability" },
  { id: "indemnity", label: "Indemnity" },
  { id: "law", label: "Governing law and jurisdiction" },
  { id: "changes", label: "Changes to these terms" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <>
      <LegalHero
        crumb="Terms of Use"
        eyebrow="Terms of Use"
        title={
          <>
            The ground rules <Accent>for this website.</Accent>
          </>
        }
        lead="Plain terms for using SDC’s websites: what the information here means, what you may do with it, and what we are responsible for."
      />
      <LegalBody toc={toc}>
        <Sec id="acceptance" title="1. Accepting these terms">
          <p>
            These terms apply to the websites run by SDC Security &amp; Facility Services Pvt. Ltd. (“SDC”, “we”, “us”),
            including <a href={HOME}>sdcsecurity.in</a> and the careers pages. By using
            them, you agree to these terms. If you do not agree, please do not use the sites.
          </p>
          <p>
            How we handle personal data is explained in our <a href={`${BASE}/privacy`}>Privacy Policy</a>, which forms
            part of these terms.
          </p>
        </Sec>

        <Sec id="information" title="2. About SDC and the information here">
          <p>
            SDC is a private limited company (CIN {company.cin}) with its registered office in Bengaluru, Karnataka, and
            a licensed private security agency (PSARA licence {company.psara}).
          </p>
          <p>
            The information on this website describes our services in general terms. It is <strong>not an offer</strong>{" "}
            and does not form a contract. Figures such as headcounts, response times and service levels are examples.
            Prices, scope, staffing and timelines are agreed only in a <strong>written quotation or contract</strong>{" "}
            signed by SDC, usually after a site survey.
          </p>
          <p>
            Photos marked as illustrative are not of SDC staff or sites. All other photos are of SDC’s own people. We try
            to keep the content accurate and current, but it may change without notice.
          </p>
        </Sec>

        <Sec id="demo" title="3. The SDC Command demo">
          <p>
            The interactive demo of SDC Command shows how our operations software works. It uses{" "}
            <strong>sample data</strong>: the people, sites, incidents and figures in it are invented. Do not enter real
            personal data into the demo. The demo is provided “as is” to illustrate features and is not a commitment that
            any feature will be part of a client contract.
          </p>
          <p>
            Signed-in use of SDC Command by employees and clients is governed by their employment terms or client
            agreement, not by these terms.
          </p>
        </Sec>

        <Sec id="ip" title="4. Intellectual property">
          <p>
            The text, design, photographs, the SDC name, the eagle crest and other logos on this website belong to SDC or
            are used with permission. You may view and print pages for your own reference, or to evaluate our services
            within your organisation. You may not copy, republish or sell them, or use our name or logo in a way that
            suggests a connection with SDC, without our written permission.
          </p>
          <p>
            <strong>Client names and logos belong to their owners.</strong> We show them to identify organisations we have
            served. Showing them does not mean that a client endorses SDC or this website.
          </p>
        </Sec>

        <Sec id="use" title="5. Acceptable use">
          <p>When using our websites, you must not:</p>
          <ul>
            <li>break any law, or use the site for fraud;</li>
            <li>pretend to be SDC or someone else, or submit false job applications or enquiries;</li>
            <li>upload anything harmful, such as viruses, or anything you have no right to share;</li>
            <li>try to get into parts of the site or systems you are not authorised to use, or test their security without our written permission;</li>
            <li>overload the site, or collect data from it with automated tools, other than search engines respecting our robots rules.</li>
          </ul>
          <p>We may block access or remove content to protect the site, our staff or other users.</p>
        </Sec>

        <Sec id="links" title="6. Links to other websites">
          <p>
            Our pages link to other services, such as Google Maps, WhatsApp, government websites and email. We do not
            control them and are not responsible for their content or privacy practices. Read their terms before using
            them.
          </p>
        </Sec>

        <Sec id="recruitment" title="7. Recruitment and job fraud">
          <p>
            <strong>SDC never charges a fee for a job, an interview, training, a uniform or an appointment letter.</strong>{" "}
            We do not ask job seekers to pay anyone, in cash or online.
          </p>
          <p>
            If anyone asks you for money in SDC’s name, do not pay. Call us on {company.phoneDisplay} and report it to the
            police or at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in<span className="v2-sr"> (opens in a new tab)</span></a>{" "}
            (helpline 1930). SDC is not responsible for payments made to people falsely claiming to act for us.
          </p>
          <p>
            Applying through our website does not guarantee a job. Selection depends on interviews, document and
            background checks, training, and the needs of our clients.
          </p>
        </Sec>

        <Sec id="disclaimers" title="8. Disclaimers">
          <p>
            We provide this website “as is”. We do not promise that it will always be available, error-free or free of
            viruses. Nothing on it is legal, safety or professional advice for your particular site; for that, ask us for a
            site survey.
          </p>
        </Sec>

        <Sec id="liability" title="9. Limitation of liability">
          <p>
            To the extent the law allows, SDC is not liable for any loss or damage arising from your use of this website,
            or from relying on its content, including indirect or consequential loss, loss of profit or loss of data.
          </p>
          <p>
            Nothing in these terms limits liability that cannot be limited under Indian law. Our responsibilities for
            services we provide to clients are set out in the client’s contract.
          </p>
        </Sec>

        <Sec id="indemnity" title="10. Indemnity">
          <p>
            If you break these terms or the law while using our websites, you agree to compensate SDC for reasonable
            losses, costs and claims that result.
          </p>
        </Sec>

        <Sec id="law" title="11. Governing law and jurisdiction">
          <p>
            These terms are governed by {legal.governingLaw} <Ph>to confirm</Ph>. Any dispute about them is subject to the
            exclusive jurisdiction of {legal.jurisdiction} <Ph>to confirm</Ph>.
          </p>
        </Sec>

        <Sec id="changes" title="12. Changes to these terms">
          <p>
            We may update these terms. The date at the top shows the latest version. Continuing to use the site after a
            change means you accept the updated terms.
          </p>
        </Sec>

        <Sec id="contact" title="13. Contact">
          <p>
            SDC Security &amp; Facility Services Pvt. Ltd., No. 102, Ground Floor, Kempamma Layout, near St. Philomena’s
            School, Mariyappana Palya, Bengaluru 560 056, Karnataka. Phone {company.phoneDisplay}. Email{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a>.
          </p>
          <p>
            For a complaint, see <a href={`${BASE}/grievance`}>Grievance redressal</a>.
          </p>
        </Sec>
      </LegalBody>
    </>
  );
}
