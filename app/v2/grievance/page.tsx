import type { Metadata } from "next";
import { BASE, company, whatsappLink } from "@/components/v2/data";
import { LegalBody, LegalHero, Ph, Sec, Val } from "@/components/v2/legal";
import { legal } from "@/components/v2/legal-data";
import { Accent, Btn } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Grievance redressal",
  description:
    "How to raise a privacy or other complaint with SDC Security & Facility Services, our Grievance Officer, response timelines, and escalation to the Data Protection Board of India.",
};

const toc = [
  { id: "officer", label: "Grievance Officer" },
  { id: "what-you-can-raise", label: "What you can raise" },
  { id: "how", label: "How to raise a complaint" },
  { id: "include", label: "What to include" },
  { id: "timeline", label: "What happens next" },
  { id: "escalation", label: "If you are not satisfied" },
  { id: "write", label: "Write to us" },
];

const officer = legal.grievanceOfficer;
const to = officer.email || company.email;
const mail = `mailto:${to}?subject=${encodeURIComponent("Grievance")}&body=${encodeURIComponent(
  "Hello SDC,\n\nI would like to raise a grievance.\n\nName:\nMobile number:\nJob application reference (if any):\nWhat happened, and when:\n\nWhat I would like SDC to do:\n",
)}`;
const wa = whatsappLink(
  "Hello SDC, I would like to raise a grievance.\n\nName:\nJob application reference (if any):\nWhat happened, and when:\nWhat I would like SDC to do:",
);

export default function GrievancePage() {
  return (
    <>
      <LegalHero
        crumb="Grievance redressal"
        eyebrow="Grievance redressal"
        title={
          <>
            Something wrong? <Accent>Tell us, and we will fix it.</Accent>
          </>
        }
        lead="How to raise a complaint about your personal data, a job application, our staff or this website, and how quickly we respond."
      />
      <LegalBody toc={toc}>
        <Sec id="officer" title="1. Grievance Officer">
          <p>
            Our Grievance Officer handles complaints about personal data under the Digital Personal Data Protection Act,
            2023 and the IT Rules 2011, and any other complaint about this website.
          </p>
          <dl className="v2-kv">
            <div>
              <dt>Name</dt>
              <dd>
                <Val value={officer.name} ph="Grievance Officer name" />
              </dd>
            </div>
            <div>
              <dt>Designation</dt>
              <dd>
                <Val value={officer.designation} ph="designation" />
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{officer.email ? <a href={`mailto:${officer.email}`}>{officer.email}</a> : <Ph>officer email</Ph>}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <Val value={officer.phone} ph="officer phone" />
              </dd>
            </div>
            <div>
              <dt>Office hours</dt>
              <dd>
                <Ph>days and hours to be confirmed</Ph>
              </dd>
            </div>
            <div>
              <dt>Post</dt>
              <dd>No. 102, Ground Floor, Kempamma Layout, Mariyappana Palya, Bengaluru 560 056, Karnataka</dd>
            </div>
          </dl>
          <p>
            Until the officer’s details are published, send complaints to{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a> or {company.phoneDisplay}. They reach the same team.
          </p>
        </Sec>

        <Sec id="what-you-can-raise" title="2. What you can raise">
          <ul>
            <li>Your personal data: to see it, correct it, delete it, withdraw consent, or complain about how it was used.</li>
            <li>A job application: how it was handled, or a request to remove it.</li>
            <li>Anyone asking for money for a job in SDC’s name. SDC never charges a fee.</li>
            <li>The conduct of SDC staff you have dealt with.</li>
            <li>Problems with this website, including accessibility.</li>
          </ul>
          <p>
            Clients with a concern about service at their site should also contact their SDC account manager, as set out
            in their contract.
          </p>
        </Sec>

        <Sec id="how" title="3. How to raise a complaint">
          <p>Use whichever is easiest for you, in English, Kannada or Hindi:</p>
          <ul>
            <li>
              Email <a href={`mailto:${to}`}>{to}</a>
            </li>
            <li>WhatsApp or call {company.phoneDisplay}</li>
            <li>Write to the Grievance Officer at our registered office (address above)</li>
          </ul>
          <p>There is no fee, and you do not need to use a particular form.</p>
        </Sec>

        <Sec id="include" title="4. What to include">
          <ul>
            <li>Your name, and a mobile number or email where we can reach you.</li>
            <li>Your job application reference number (SDC-APP-…), if you have one.</li>
            <li>What happened, when, and who was involved.</li>
            <li>What you would like us to do.</li>
            <li>Any screenshots or documents that help. Do not send Aadhaar or bank details unless we ask.</li>
          </ul>
          <p>We may call you to confirm your identity before we share or change any personal data.</p>
        </Sec>

        <Sec id="timeline" title="5. What happens next">
          <ol className="v2-steps">
            <li>
              <strong>Acknowledgement within 24 hours</strong> (working days), with a reference for your complaint.
            </li>
            <li>We look into it, and may contact you for more details.</li>
            <li>
              <strong>Resolution within 30 days</strong> <Ph>confirm</Ph> of receiving your complaint, as the law requires.
              We tell you in writing what we found and what we did.
            </li>
          </ol>
        </Sec>

        <Sec id="escalation" title="6. If you are not satisfied">
          <p>
            If you are not happy with our reply, or do not hear from us in time, you can complain to the{" "}
            <strong>Data Protection Board of India</strong> under the Digital Personal Data Protection Act, 2023. The Board
            expects you to have raised the complaint with us first.
          </p>
          <p>
            For fraud or a cyber crime, you can also report it at{" "}
            <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">
              cybercrime.gov.in<span className="v2-sr"> (opens in a new tab)</span>
            </a>{" "}
            or call 1930.
          </p>
          <p>
            Read more in our <a href={`${BASE}/privacy`}>Privacy Policy</a>.
          </p>
        </Sec>

        <Sec id="write" title="7. Write to us">
          <p>
            These buttons open your own email app or WhatsApp with a short template. You check it and send it yourself;
            this website does not send or store anything.
          </p>
          <div className="v2-actions">
            <Btn href={mail} icon="none">
              Email a grievance
            </Btn>
            <Btn href={wa} variant="secondary" icon="whatsapp">
              WhatsApp {company.phoneDisplay}
            </Btn>
          </div>
        </Sec>
      </LegalBody>
    </>
  );
}
