import type { Metadata } from "next";
import { BASE, HOME, company } from "@/components/v2/data";
import { LegalBody, LegalHero, Ph, Sec, Summary, Val } from "@/components/v2/legal";
import { legal } from "@/components/v2/legal-data";
import { Accent } from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SDC Security & Facility Services collects, uses, stores and protects personal data from job applications, enquiries and website visits, and how to use your rights under India’s DPDP Act 2023.",
};

const toc = [
  { id: "who-we-are", label: "Who we are" },
  { id: "what-we-collect", label: "What we collect and when" },
  { id: "purposes", label: "Why we use it, and on what basis" },
  { id: "retention", label: "How long we keep it" },
  { id: "sharing", label: "Who we share it with" },
  { id: "transfers", label: "Where your data is stored" },
  { id: "security", label: "How we protect it" },
  { id: "rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "cookies", label: "Cookies and browser storage" },
  { id: "portal", label: "SDC Command portal" },
  { id: "grievance-officer", label: "Grievance Officer" },
  { id: "board", label: "Complaints to the Data Protection Board" },
  { id: "changes", label: "Changes to this policy" },
  { id: "careers-languages", label: "ಕನ್ನಡ · हिन्दी summary" },
];

const officer = legal.grievanceOfficer;
const contactEmail = legal.dataProtectionContact || officer.email;

export default function PrivacyPage() {
  return (
    <>
      <LegalHero
        crumb="Privacy Policy"
        eyebrow="Privacy Policy"
        title={
          <>
            Your data, used for <Accent>one purpose at a time.</Accent>
          </>
        }
        lead="What personal data SDC collects through this website and the careers form, why we collect it, how long we keep it, and how you can see, correct or delete it."
      />
      <LegalBody toc={toc}>
        <Summary>
          <ul>
            <li>SDC Security &amp; Facility Services Pvt. Ltd. decides how your data is used. In law, we are the “data fiduciary”.</li>
            <li>We use no analytics, advertising or tracking cookies. We do not sell your data.</li>
            <li>Job applications are used only for recruitment. If you do not join SDC, we delete them after 12 months.</li>
            <li>The enquiry and site-survey forms do not send anything through this website. They open your own email app or WhatsApp with a message for you to check and send.</li>
            <li>Our database and uploaded documents are stored in India (Mumbai).</li>
            <li>
              You can ask to see, correct or delete your data, or withdraw your consent, at any time. Write to{" "}
              <a href={`mailto:${company.email}`}>{company.email}</a>.
            </li>
          </ul>
        </Summary>

        <Sec id="who-we-are" title="1. Who we are">
          <p>
            This website is run by <strong>SDC Security &amp; Facility Services Pvt. Ltd.</strong> (“SDC”, “we”, “us”), a
            private limited company incorporated in India (CIN {company.cin}) and licensed as a private security agency
            under PSARA licence {company.psara}.
          </p>
          <p>
            Registered office: No. 102, Ground Floor, Kempamma Layout, near St. Philomena’s School, Mariyappana Palya,
            Bengaluru 560 056, Karnataka. Phone {company.phoneDisplay}. Email{" "}
            <a href={`mailto:${company.email}`}>{company.email}</a>.
          </p>
          <p>
            For the personal data described here, SDC is the <strong>data fiduciary</strong> under the Digital Personal
            Data Protection Act, 2023 (“DPDP Act”). This policy is also written to meet the Information Technology Act,
            2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data
            or Information) Rules, 2011. We will follow the Digital Personal Data Protection Rules, 2025 as each part comes
            into force.
          </p>
          <p>
            This policy covers our public website, <a href={HOME}>sdcsecurity.in</a>, including
            the careers pages. It does not cover sites we link to.
          </p>
        </Sec>

        <Sec id="what-we-collect" title="2. What we collect and when">
          <p>We collect personal data only when you give it to us, or when your browser asks our servers for a page.</p>
          <table className="v2-data-table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">What we collect</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">You apply for a job at /careers/apply</th>
                <td data-label="What we collect">
                  Your name; mobile number and WhatsApp number (if different); gender; date of birth; where you live
                  (area and district); the area you would like to work in; languages you speak; education; years of
                  experience and last employer; whether you are an ex-serviceman and, if so, your branch, rank and years of
                  service; whether you have PSARA training; the job you want and when you can join; how you heard about
                  us; any CV, certificate or photo you upload (up to 3 files, PDF or image, 5 MB each); the language you
                  used for the form; and the date and time you gave consent, with the version of the consent text you saw.
                </td>
              </tr>
              <tr>
                <th scope="row">You send an enquiry or request a site survey</th>
                <td data-label="What we collect">
                  The form builds a message from your name, phone or email, organisation, service, site location,
                  approximate headcount and message. <strong>The website does not send or store it.</strong> It opens your
                  email app or WhatsApp with the message ready. We receive it only if you choose to send it. We then hold
                  the email or WhatsApp message you sent us.
                </td>
              </tr>
              <tr>
                <th scope="row">You call, email or WhatsApp us</th>
                <td data-label="What we collect">Your phone number or email address, and whatever you tell us.</td>
              </tr>
              <tr>
                <th scope="row">You visit any page</th>
                <td data-label="What we collect">
                  Like every website, our hosting providers record basic server logs: your IP address, the page asked for,
                  the date and time, and your browser type. We use them to keep the site running and secure. When you
                  submit a job application, our server also holds your IP address in memory for up to an hour to limit
                  repeated submissions; it is not written to our database.
                </td>
              </tr>
              <tr>
                <th scope="row">Pages load their fonts</th>
                <td data-label="What we collect">
                  Our pages use fonts from Google Fonts, which load from Google’s servers. This means your browser shares
                  your IP address and browser details with Google when the fonts load. Google’s use of this is covered by
                  Google’s own privacy policy.
                </td>
              </tr>
              <tr>
                <th scope="row">Security check on the job form (if switched on)</th>
                <td data-label="What we collect">
                  We may switch on a spam check from Cloudflare (Turnstile) on the last step of the job form. When it is
                  on, Cloudflare receives your IP address and browser details to confirm a person is applying. It is not
                  switched on today.
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            We do not ask for Aadhaar, PAN, bank details, health information or biometrics on this website. Please do not
            put them in an uploaded document. If we need identity documents after an interview, we will ask for them
            separately and explain why.
          </p>
        </Sec>

        <Sec id="purposes" title="3. Why we use it, and on what basis">
          <h3>Job applications: your consent</h3>
          <p>
            Before you can apply, the form shows you a short notice and asks you to agree. We use your application only
            for recruitment: to contact you (by phone or WhatsApp), to assess you for the job, to check your documents, and
            to tell you the outcome. If the same mobile number has applied before, we link the applications so our team
            does not call you twice. You can withdraw your consent at any time (see <a href="#rights">Your rights</a>).
            Withdrawing does not affect anything we did before you withdrew, but we will stop considering your
            application.
          </p>
          <h3>Enquiries and messages: you contacted us for a purpose</h3>
          <p>
            When you send us an enquiry, email or WhatsApp message, we use your details only to reply, arrange a site
            survey and prepare a quotation. The DPDP Act allows this where you have voluntarily given us your data for a
            specific purpose (section 7(a)). We will not add you to marketing lists.
          </p>
          <h3>Running the website safely</h3>
          <p>
            We use server logs and the short-term IP check to keep the site available, stop abuse and investigate security
            problems.
          </p>
          <h3>When the law requires it</h3>
          <p>
            We may use or disclose data to meet a legal obligation, or to comply with an order of a court, tribunal or
            authority (sections 7(d) and 7(e) of the DPDP Act). <Ph>Legal basis to be confirmed by SDC’s legal adviser</Ph>
          </p>
        </Sec>

        <Sec id="retention" title="4. How long we keep it">
          <ul>
            <li>
              <strong>Job applications:</strong> 12 months from the date you apply. Every night, an automatic job deletes
              applications that are more than 12 months old, unless the person joined SDC. It also deletes their history
              and alerts. Uploaded documents are marked for deletion at the same time and removed from storage the next
              time our HR team opens the recruitment system, usually within a few days.
            </li>
            <li>
              <strong>If you join SDC:</strong> your application becomes part of your employee record and is kept under our
              employee privacy notice <Ph>employee privacy notice to be provided</Ph>, as long as employment and labour laws
              require.
            </li>
            <li>
              <strong>Files uploaded but never submitted:</strong> deleted after 2 days.
            </li>
            <li>
              <strong>Enquiry emails and WhatsApp messages:</strong> kept while we discuss your enquiry and, if you become
              a client, for the contract and the period tax and company law require. Otherwise deleted within{" "}
              <Ph>retention period for enquiries to be confirmed by SDC</Ph>.
            </li>
            <li>
              <strong>Server logs:</strong> kept by our hosting providers for their standard log period, typically a few
              days to a few weeks. <Ph>to be confirmed for Railway and Vercel</Ph>
            </li>
          </ul>
          <p>If you ask us to delete your data sooner, we will, unless a law requires us to keep it.</p>
        </Sec>

        <Sec id="sharing" title="5. Who we share it with">
          <p>
            <strong>We do not sell your personal data, and we do not share it for advertising.</strong> Inside SDC, job
            applications can be seen only by staff whose role needs them: administrators, HR and payroll, operations
            managers and senior managers.
          </p>
          <p>We use these service providers (“data processors”), who handle data only on our instructions:</p>
          <ul>
            <li>
              <strong>Supabase</strong> — database and private file storage for job applications.
            </li>
            <li>
              <strong>Railway</strong> and <strong>Vercel</strong> — hosting for this website and our application
              server.
            </li>
            <li>
              <strong>Cloudflare</strong> — the Turnstile spam check, only if we switch it on.
            </li>
          </ul>
          <p>
            When you contact us by email or WhatsApp, the message passes through those services, which act under their
            own terms. Our email address is a Google Gmail account, and WhatsApp is run by Meta. Google Fonts is
            described in section 2.
          </p>
          <p>
            We will disclose personal data to the police, a court or another authority only when the law requires it, or
            to protect someone’s safety in an emergency.
          </p>
        </Sec>

        <Sec id="transfers" title="6. Where your data is stored">
          <p>
            Our database and the documents you upload are stored in <strong>{legal.databaseRegion}</strong>.
          </p>
          <p>
            Our web hosting providers and Google Fonts may process requests on servers outside India. Web server region:{" "}
            <Val value={legal.webServerRegion} ph="to be confirmed for Railway and Vercel" />. The DPDP Act allows transfers
            outside India except to countries the Central Government restricts. We will not transfer data to any
            restricted country.
          </p>
        </Sec>

        <Sec id="security" title="7. How we protect it">
          <p>We take reasonable security measures, as the IT Rules 2011 and the DPDP Act require. They include:</p>
          <ul>
            <li>Encryption in transit (HTTPS) on every page and upload.</li>
            <li>
              Uploaded documents go to a <strong>private</strong> storage area. There are no public links. Only PDF and
              image files up to 5 MB are accepted.
            </li>
            <li>
              Applicants can send an application but cannot read anything back. Database rules allow only authorised SDC
              staff to see applications.
            </li>
            <li>
              Staff open documents through a link that expires after two minutes, and every time a document is opened it
              is logged with the staff member’s name.
            </li>
            <li>Every change of status on an application is recorded.</li>
            <li>Limits on repeated submissions, and checks on every field, in the browser and again in the database.</li>
          </ul>
          <p>
            No system is perfectly secure. If a personal data breach affects you, we will inform you and the Data
            Protection Board of India as the DPDP Act and Rules require, and tell you what we are doing about it.
          </p>
        </Sec>

        <Sec id="rights" title="8. Your rights">
          <p>Under the DPDP Act you have the right to:</p>
          <ul>
            <li>
              <strong>Access</strong> — a summary of the personal data we hold about you and how we use it, and who we have
              shared it with.
            </li>
            <li>
              <strong>Correction and completion</strong> — fix anything that is wrong or incomplete, or update it.
            </li>
            <li>
              <strong>Erasure</strong> — ask us to delete your data, unless a law requires us to keep it.
            </li>
            <li>
              <strong>Withdraw consent</strong> — as easily as you gave it. We will then stop using that data and delete
              it.
            </li>
            <li>
              <strong>Grievance redressal</strong> — complain to us and get a reply.
            </li>
            <li>
              <strong>Nominate</strong> — name another person to use these rights for you if you die or become unable to.
            </li>
          </ul>
          <h3>How to use them</h3>
          <ol className="v2-steps">
            <li>
              Email <a href={`mailto:${company.email}`}>{company.email}</a>
              {contactEmail && contactEmail !== company.email && (
                <>
                  {" "}or <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </>
              )}
              , or call or WhatsApp {company.phoneDisplay}. If you applied for a job, give your name, mobile number and
              your reference number (SDC-APP-…) if you have it.
            </li>
            <li>We may ask a question to confirm it is you, for example by calling the mobile number on the application.</li>
            <li>We acknowledge your request within 24 hours (working days).</li>
            <li>
              We complete it within 30 days <Ph>confirm timeline</Ph>, and tell you what we did. If we cannot do what you
              ask, we will tell you why.
            </li>
          </ol>
          <p>
            There is no charge. See also <a href={`${BASE}/grievance`}>Grievance redressal</a>.
          </p>
        </Sec>

        <Sec id="children" title="9. Children">
          <p>
            This website is not meant for children, and we do not knowingly collect personal data from anyone under 18.
            The job application form accepts applicants aged 18 to 60 only, and checks the date of birth. If you believe a
            child has sent us personal data, tell us and we will delete it.
          </p>
        </Sec>

        <Sec id="cookies" title="10. Cookies and browser storage">
          <p>
            <strong>We do not use analytics, advertising or tracking cookies.</strong> The public pages set no cookies of
            their own.
          </p>
          <ul>
            <li>
              The careers pages remember the language you choose (English, Kannada or Hindi) in your browser’s local
              storage. It stays on your device and is not sent to us.
            </li>
            <li>
              When staff or clients sign in to SDC Command, we set essential cookies to keep the session signed in. These
              are strictly necessary and are not used for tracking.
            </li>
          </ul>
          <p>If we ever add analytics or other non-essential cookies, we will ask for your consent first with a banner.</p>
        </Sec>

        <Sec id="portal" title="11. SDC Command portal">
          <p>
            SDC Command is our system for employees and clients who sign in. Employees’ data in it is covered by a separate
            employee privacy notice <Ph>to be provided</Ph>. Client data is handled under our agreements with each client{" "}
            <Ph>to be provided</Ph>. The public demo of SDC Command uses sample people and sites. Please do not enter real
            personal data into it.
          </p>
        </Sec>

        <Sec id="grievance-officer" title="12. Grievance Officer">
          <p>If you have a question or complaint about how we handle your personal data, contact our Grievance Officer:</p>
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
              <dd>
                {officer.email ? <a href={`mailto:${officer.email}`}>{officer.email}</a> : <Ph>officer email</Ph>}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <Val value={officer.phone} ph="officer phone" />
              </dd>
            </div>
            <div>
              <dt>Data protection contact</dt>
              <dd>
                <Val value={legal.dataProtectionContact} ph="same as Grievance Officer unless SDC says otherwise" />
              </dd>
            </div>
            <div>
              <dt>Post</dt>
              <dd>SDC Security &amp; Facility Services Pvt. Ltd., No. 102, Kempamma Layout, Mariyappana Palya, Bengaluru 560 056</dd>
            </div>
          </dl>
          <p>
            Until the officer’s details are published, write to <a href={`mailto:${company.email}`}>{company.email}</a>.
            How we handle complaints is set out on the <a href={`${BASE}/grievance`}>Grievance redressal</a> page.
          </p>
        </Sec>

        <Sec id="board" title="13. Complaints to the Data Protection Board of India">
          <p>
            If you are not satisfied with our reply, or we do not reply in time, you may complain to the{" "}
            <strong>Data Protection Board of India</strong>, set up under the DPDP Act. The Board expects you to raise the
            complaint with us first.
          </p>
        </Sec>

        <Sec id="changes" title="14. Changes to this policy">
          <p>
            We will update this policy when the way we handle data changes, or when the law changes. The date at the top
            shows when it was last updated. If a change affects how we use data you have already given us, we will tell
            you before it applies, where we have a way to contact you.
          </p>
        </Sec>

        <Sec id="careers-languages" title="Job applications, in Kannada and Hindi">
          <div className="v2-translation" lang="kn">
            <h3>ಉದ್ಯೋಗ ಅರ್ಜಿ — ನಿಮ್ಮ ಮಾಹಿತಿ</h3>
            <ul>
              <li>
                ನೀವು ಅರ್ಜಿ ಸಲ್ಲಿಸಿದಾಗ ನಿಮ್ಮ ಹೆಸರು, ಫೋನ್ ಸಂಖ್ಯೆ, ಜನ್ಮ ದಿನಾಂಕ, ನೀವು ವಾಸಿಸುವ ಪ್ರದೇಶ, ಶಿಕ್ಷಣ, ಅನುಭವ ಮತ್ತು ನೀವು
                ಕಳುಹಿಸುವ ದಾಖಲೆಗಳನ್ನು ನಾವು ಪಡೆಯುತ್ತೇವೆ.
              </li>
              <li>ಇವುಗಳನ್ನು ನೇಮಕಾತಿಗೆ ಮಾತ್ರ ಬಳಸುತ್ತೇವೆ: ನಿಮಗೆ ಕರೆ ಮಾಡಲು, ಅರ್ಜಿ ನೋಡಲು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು.</li>
              <li>ನಮ್ಮ HR ತಂಡ ಮಾತ್ರ ಇವುಗಳನ್ನು ನೋಡಬಹುದು. ನಾವು ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಮಾರುವುದಿಲ್ಲ.</li>
              <li>ನೀವು SDC ಸೇರದಿದ್ದರೆ, 12 ತಿಂಗಳ ನಂತರ ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಅಳಿಸುತ್ತೇವೆ.</li>
              <li>
                ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನೋಡಲು, ಸರಿಪಡಿಸಲು, ಅಳಿಸಲು ಅಥವಾ ಒಪ್ಪಿಗೆ ಹಿಂಪಡೆಯಲು{" "}
                <a href={`mailto:${company.email}`}>{company.email}</a> ಗೆ ಬರೆಯಿರಿ ಅಥವಾ {company.phoneDisplay} ಗೆ ಕರೆ ಮಾಡಿ.
              </li>
              <li>SDC ಉದ್ಯೋಗಕ್ಕಾಗಿ ಎಂದಿಗೂ ಹಣ ಕೇಳುವುದಿಲ್ಲ.</li>
            </ul>
            <p className="v2-translation-note" lang="en">
              Kannada summary. Translation to be reviewed by a native speaker. The English text above is the full policy.
            </p>
          </div>
          <div className="v2-translation" lang="hi">
            <h3>नौकरी का आवेदन — आपकी जानकारी</h3>
            <ul>
              <li>
                जब आप आवेदन करते हैं, तो हम आपका नाम, फ़ोन नंबर, जन्म तिथि, आप कहाँ रहते हैं, शिक्षा, अनुभव और आपके भेजे गए
                दस्तावेज़ लेते हैं।
              </li>
              <li>हम इनका इस्तेमाल केवल भर्ती के लिए करते हैं: आपको कॉल करने, आवेदन देखने और दस्तावेज़ जाँचने के लिए।</li>
              <li>केवल हमारी HR टीम इन्हें देख सकती है। हम आपकी जानकारी नहीं बेचते।</li>
              <li>अगर आप SDC में शामिल नहीं होते, तो 12 महीने बाद आपकी जानकारी मिटा दी जाती है।</li>
              <li>
                अपनी जानकारी देखने, सुधारने, मिटवाने या सहमति वापस लेने के लिए{" "}
                <a href={`mailto:${company.email}`}>{company.email}</a> पर लिखें या {company.phoneDisplay} पर कॉल करें।
              </li>
              <li>SDC नौकरी के लिए कभी पैसे नहीं माँगता।</li>
            </ul>
            <p className="v2-translation-note" lang="en">
              Hindi summary. Translation to be reviewed by a native speaker. The English text above is the full policy.
            </p>
          </div>
        </Sec>
      </LegalBody>
    </>
  );
}
