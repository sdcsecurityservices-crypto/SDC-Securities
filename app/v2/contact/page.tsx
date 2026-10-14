import type { Metadata } from "next";
import { ClipboardList, Mail, MapPin, MessageCircle, Phone, Route } from "lucide-react";
import { addressLines, company, mapsUrl, onboarding, whatsappLink } from "@/components/v2/data";
import { EnquiryForm } from "@/components/v2/enquiry-form";
import {
  Accent,
  ButtonLink,
  CheckList,
  Eyebrow,
  PageHero,
  Section,
  SectionHead,
  StepFlow,
} from "@/components/v2/ui";

export const metadata: Metadata = {
  title: "Contact & site survey",
  description:
    "Call or WhatsApp SDC on +91 99803 43925, email sdcpvtltd01@gmail.com, or book a free site survey. Office at Kempamma Layout, Mariyappana Palya, Bengaluru 560 056.",
};

export default function ContactPage() {
  const cards = [
    { icon: Phone, tag: "Call", value: company.phoneDisplay, note: "Speak to the SDC office", href: `tel:${company.phone}` },
    {
      icon: MessageCircle,
      tag: "WhatsApp",
      value: company.phoneDisplay,
      note: "Message us any time",
      href: whatsappLink("Hello SDC, I would like to discuss security services for my site."),
    },
    { icon: Mail, tag: "Email", value: company.email, note: "For enquiries and documents", href: `mailto:${company.email}` },
    { icon: MapPin, tag: "Office", value: "Mariyappana Palya, Bengaluru", note: "Open in Google Maps", href: mapsUrl },
  ];
  return (
    <>
      <PageHero
        crumbs={[{ label: "Contact" }]}
        eyebrow="Let’s build a safer tomorrow"
        title={
          <>
            Your peace of mind. <Accent>Our next mission.</Accent>
          </>
        }
        lead="Start with a conversation. We will understand your site, your people and what better protection looks like for you."
        actions={
          <>
            <ButtonLink href="#survey">Book a free site survey</ButtonLink>
            <ButtonLink href={`tel:${company.phone}`} variant="ghost" icon="phone">
              Call {company.phoneDisplay}
            </ButtonLink>
          </>
        }
      />

      <Section tone="light" labelledBy="ct-reach">
        <h2 className="v2-sr" id="ct-reach">
          Ways to reach us
        </h2>
        <ul className="v2-contact-cards">
          {cards.map((c) => {
            const external = c.href.startsWith("http");
            return (
              <li key={c.tag}>
                <a
                  className="v2-contact-card"
                  href={c.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <span className="v2-icon-bubble" aria-hidden="true">
                    <c.icon size={22} strokeWidth={1.7} />
                  </span>
                  <span className="v2-tag">{c.tag}</span>
                  <strong>{c.value}</strong>
                  <small>
                    {c.note}
                    {external && <span className="v2-sr"> (opens in a new tab)</span>}
                  </small>
                </a>
              </li>
            );
          })}
        </ul>
        <div className="v2-split v2-split--top" style={{ marginTop: 48 }}>
          <div>
            <Eyebrow>Registered office</Eyebrow>
            <h2 className="v2-h3">SDC Security &amp; Facility Services Pvt. Ltd.</h2>
            <address className="v2-lead" style={{ marginTop: 14 }}>
              {addressLines.map((l) => (
                <span key={l} className="v2-block">
                  {l}
                </span>
              ))}
            </address>
            <p className="v2-fineprint">Landmark: near St. Philomena’s School, Mariyappana Palya.</p>
            <div className="v2-actions">
              <ButtonLink href={mapsUrl} variant="navy" icon="up">
                Get directions
              </ButtonLink>
            </div>
          </div>
          <div className="v2-note">
            <strong>Serving Bengaluru and across Karnataka.</strong> Hospitals, colleges, offices, plants, construction
            sites and apartment communities. If you are outside Bengaluru, call us and we will tell you how we can cover
            your site.
          </div>
        </div>
      </Section>

      <Section tone="white" id="survey" className="v2-survey" labelledBy="ct-survey">
        <div className="v2-split v2-split--top">
          <div>
            <Eyebrow>Book a free site survey</Eyebrow>
            <h2 className="v2-h2" id="ct-survey">
              We walk your site. <Accent>You get a written plan.</Accent>
            </h2>
            <p className="v2-lead">
              We walk your site, assess gates, blocks, parking and night routes, and give you a written post plan for
              your site. There is no charge for the survey.
            </p>
            <div className="v2-feature-grid" style={{ gridTemplateColumns: "1fr", marginTop: 24 }}>
              <div className="v2-feature">
                <Route size={22} aria-hidden="true" />
                <h3>What we look at</h3>
                <p>Gates, blocks, parking, night routes, women’s posts and the risks particular to your site.</p>
              </div>
              <div className="v2-feature">
                <ClipboardList size={22} aria-hidden="true" />
                <h3>What you receive</h3>
                <p>A written post plan: posts, shifts, headcount and post orders, for you to review.</p>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <CheckList
                items={[
                  "Ex-servicemen-led team",
                  "PSARA licensed · ISO 9001:2015 certified",
                  "EPF and ESI paid for every employee",
                ]}
              />
            </div>
          </div>
          <div>
            <h3 className="v2-h3" style={{ marginTop: 0, marginBottom: 16 }}>
              Tell us about your site
            </h3>
            <EnquiryForm />
          </div>
        </div>
      </Section>

      <Section tone="light" labelledBy="ct-steps">
        <SectionHead
          id="ct-steps"
          eyebrow="What happens next"
          title={
            <>
              From first visit to full cover, <Accent>in five steps.</Accent>
            </>
          }
          lead="Timelines depend on site size, and we commit to them in writing after the survey."
        />
        <StepFlow steps={onboarding} label="How SDC takes over a site" />
      </Section>
    </>
  );
}
