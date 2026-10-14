"use client";

// Same mechanism as the one-page site: the form builds a message and opens the
// visitor's email app or WhatsApp. Nothing is sent by the website itself.
import { useEffect, useRef, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { company, services, whatsappLink } from "./data";

const headcounts = ["1 to 5 people", "6 to 20 people", "21 to 50 people", "More than 50 people", "Not sure yet"];

const enquiryText = (f: FormData) =>
  `Hello SDC,\n\nI would like to request a site survey.\n\nName: ${f.get("name")}\nPhone: ${f.get("phone")}\nOrganisation: ${f.get("company")}\nService: ${f.get("service")}\nSite location: ${f.get("location")}\nApprox. headcount: ${f.get("headcount")}\nMessage: ${f.get("message") || "-"}\n`;

export function EnquiryForm() {
  const [opened, setOpened] = useState(false);
  const serviceRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    // Preselect the service when arriving from a service page (?service=slug).
    const slug = new URLSearchParams(window.location.search).get("service");
    const match = services.find((s) => s.slug === slug);
    if (match && serviceRef.current) serviceRef.current.value = match.name;
  }, []);
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
        window.location.href = `mailto:${company.email}?subject=${encodeURIComponent("Site survey request")}&body=${encodeURIComponent(body)}`;
        setOpened(true);
      }}
    >
      <div className="v2-form-grid">
        <label>
          <span>Your name</span>
          <input name="name" required maxLength={100} autoComplete="name" />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" required maxLength={20} autoComplete="tel" inputMode="tel" />
        </label>
        <label className="v2-form-wide">
          <span>Company or property</span>
          <input name="company" required maxLength={100} autoComplete="organization" />
        </label>
        <label>
          <span>Service</span>
          <select name="service" ref={serviceRef} defaultValue="" required>
            <option value="" disabled>
              Choose a service
            </option>
            {services.map((s) => (
              <option key={s.slug}>{s.name}</option>
            ))}
            <option>More than one service</option>
          </select>
        </label>
        <label>
          <span>Approx. headcount</span>
          <select name="headcount" defaultValue="" required>
            <option value="" disabled>
              Choose a range
            </option>
            {headcounts.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <label className="v2-form-wide">
          <span>Site location</span>
          <input name="location" required maxLength={120} placeholder="Area and city, for example Whitefield, Bengaluru" />
        </label>
        <label className="v2-form-wide">
          <span>
            Message <small>(optional)</small>
          </span>
          <textarea name="message" rows={3} maxLength={1000} />
        </label>
      </div>
      <p className="v2-form-help">
        By sending, you agree that SDC may contact you about this request. Your email app or WhatsApp opens with the
        message ready, and you review it before it goes.
      </p>
      <div className="v2-form-actions">
        <button className="v2-btn v2-btn--primary" type="submit" value="email">
          <Mail size={17} aria-hidden="true" />
          <span>Request a site survey</span>
        </button>
        <button className="v2-btn v2-btn--secondary" type="submit" value="whatsapp">
          <MessageCircle size={17} aria-hidden="true" />
          <span>Send on WhatsApp instead</span>
        </button>
      </div>
      {opened && (
        <p role="status" className="v2-form-note">
          Your message is ready to send. If nothing opened, call {company.phoneDisplay} or email {company.email}. This
          website does not send messages itself.
        </p>
      )}
    </form>
  );
}
