"use client";

// The same enquiry mechanism as the one-page site: the form builds a message and
// opens the visitor's email app or WhatsApp. Nothing is sent by the website.
import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { company, whatsappLink } from "./data";

const enquiryText = (f: FormData) =>
  `Hello SDC,\n\nI would like to discuss a site assessment.\n\nName: ${f.get("name")}\nOrganisation: ${f.get("company")}\nContact: ${f.get("contact")}\nRequirement: ${f.get("message")}\n`;

export function EnquiryForm() {
  const [opened, setOpened] = useState(false);
  return (
    <form
      className="v2-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = enquiryText(f);
        if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "whatsapp") {
          window.open(whatsappLink(body), "_blank", "noopener,noreferrer");
          setOpened(true);
          return;
        }
        window.location.href = `mailto:${company.email}?subject=${encodeURIComponent("Site assessment enquiry")}&body=${encodeURIComponent(body)}`;
        setOpened(true);
      }}
    >
      <div className="v2-form-grid">
        <label>
          <span>Your name</span>
          <input name="name" placeholder="Full name" required maxLength={100} autoComplete="name" />
        </label>
        <label>
          <span>Organisation</span>
          <input name="company" placeholder="Company or property name" required maxLength={100} autoComplete="organization" />
        </label>
        <label className="v2-form-wide">
          <span>Email or phone</span>
          <input name="contact" placeholder="How can the team reach you?" required maxLength={120} />
        </label>
        <label className="v2-form-wide">
          <span>Your requirement</span>
          <textarea name="message" placeholder="Location, services and approximate team size" rows={4} required maxLength={1000} />
        </label>
      </div>
      <p className="v2-form-help">
        Choose how to send it. Your email app or WhatsApp opens with the message ready, and you review it before it goes.
      </p>
      <div className="v2-form-actions">
        <button className="v2-btn v2-btn--navy" type="submit" value="email">
          <Mail size={17} aria-hidden="true" />
          <span>Send by email</span>
        </button>
        <button className="v2-btn v2-btn--whatsapp" type="submit" value="whatsapp">
          <MessageCircle size={17} aria-hidden="true" />
          <span>Send on WhatsApp</span>
        </button>
      </div>
      {opened && (
        <p role="status" className="v2-form-note">
          If nothing opened, contact {company.email} or call {company.phoneDisplay}. This website does not send messages
          itself.
        </p>
      )}
    </form>
  );
}
