import type { Metadata } from "next";
import { ArrowRight, Briefcase, LayoutDashboard, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { CAREERS_APPLY_URL, PORTAL_URL, addressLines, company, mapsUrl, onboarding, whatsappLink } from "@/components/v2/data";
import { EnquiryForm } from "@/components/v2/enquiry-form";
import { Accent, Chapter, GuardHelpline, HeroCompact, Intro, Route } from "@/components/v2/ui";
import { guardHelpline } from "@/components/v2/extras-data";

export const metadata: Metadata = {
  title: "Contact & site survey",
  description:
    "Request a free site survey, call or WhatsApp SDC on +91 99803 43925, or email sdcpvtltd01@gmail.com. Office near St. Philomena's School, Mariyappana Palya, Bengaluru 560 056.",
};

const WA = whatsappLink("Hello SDC, I would like to discuss security services for my site.");

export default function ContactPage() {
  return (
    <>
      <HeroCompact
        crumbs={[{ label: "Contact" }]}
        eyebrow="Let’s build a safer tomorrow"
        title={
          <>
            Your peace of mind. <Accent>Our next mission.</Accent>
          </>
        }
        lead="Start with a free site survey. We walk your site, assess gates, blocks, parking and night routes, and give you a written post plan."
        aside={
          <ul className="v2-routes" aria-label="Choose your route">
            <li>
              <a href="#survey">
                <ShieldCheck size={22} strokeWidth={1.6} aria-hidden="true" />
                <span>
                  <strong>Client enquiry</strong>
                  <small>Request a site survey</small>
                </span>
                <ArrowRight size={18} aria-hidden="true" className="v2-btn-arrow" />
              </a>
            </li>
            <li>
              <a href={CAREERS_APPLY_URL}>
                <Briefcase size={22} strokeWidth={1.6} aria-hidden="true" />
                <span>
                  <strong>Job seeker</strong>
                  <small>Apply for a role at SDC</small>
                </span>
                <ArrowRight size={18} aria-hidden="true" className="v2-btn-arrow" />
              </a>
            </li>
            <li>
              <a href={PORTAL_URL}>
                <LayoutDashboard size={22} strokeWidth={1.6} aria-hidden="true" />
                <span>
                  <strong>Existing client</strong>
                  <small>Log in to the client portal</small>
                </span>
                <ArrowRight size={18} aria-hidden="true" className="v2-btn-arrow" />
              </a>
            </li>
          </ul>
        }
      />

      <Chapter tone="paper" id="survey" labelledBy="ct-survey" className="v2-survey">
        <div className="v2-contact">
          <div>
            <p className="v2-eyebrow" style={{ marginTop: 0 }}>
              Request a site survey
            </p>
            <h2 className="v2-h2" id="ct-survey">
              Tell us about <Accent>your site.</Accent>
            </h2>
            <p className="v2-lead" style={{ margin: "18px 0 32px" }}>
              There is no charge for the survey. You receive a written post plan: posts, shifts, headcount and post
              orders.
            </p>
            <EnquiryForm />
          </div>
          <aside className="v2-info-card v2-dark" aria-label="Contact details">
            <p className="v2-mono-cap">SDC Security &amp; Facility Services Pvt. Ltd.</p>
            <a href={`tel:${company.phone}`} className="v2-info-big">
              <Phone size={22} aria-hidden="true" />
              <span className="v2-mono">{company.phoneDisplay}</span>
            </a>
            <a href={WA} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp {company.phoneDisplay}
              <span className="v2-sr"> (opens in a new tab)</span>
            </a>
            <a href={`mailto:${company.email}`}>
              <Mail size={18} aria-hidden="true" />
              {company.email}
            </a>
            <div className="v2-info-address">
              <MapPin size={18} aria-hidden="true" />
              <address>
                {addressLines.map((l) => (
                  <span key={l} className="v2-block">
                    {l}
                  </span>
                ))}
              </address>
            </div>
            <p className="v2-info-landmark">
              <span className="v2-mono-cap">Landmark</span> Near St. Philomena’s School, Mariyappana Palya
            </p>
            <a className="v2-btn v2-btn--secondary" href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <span>Open in Google Maps</span>
              <ArrowRight size={17} aria-hidden="true" className="v2-btn-arrow" />
              <span className="v2-sr"> (opens in a new tab)</span>
            </a>
            <p className="v2-info-note">Serving Bengaluru and across Karnataka.</p>
          </aside>
        </div>
      </Chapter>

      <Chapter tone="canvas" labelledBy="ct-steps">
        <Intro
          id="ct-steps"
          eyebrow="What happens next"
          title={
            <>
              From first visit to full cover, <Accent>in five steps.</Accent>
            </>
          }
          lead="Timelines depend on site size, and we commit to them in writing after the survey."
        />
        <Route steps={onboarding} label="How SDC takes over a site" />
      </Chapter>

      <GuardHelpline {...guardHelpline} />
    </>
  );
}
