import Link from "next/link";
import { AlertTriangle, ArrowUpRight, BadgeCheck, FileCheck2, Landmark, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { BASE, CAREERS_KN_URL, DEMO_URL, PORTAL_URL, addressLines, company, industries, iso, mapsUrl, services, whatsappLink, CAREERS_APPLY_URL } from "./data";
import { Wordmark } from "./header";
import { Rings } from "./ui";

export function SiteFooter() {
  const columns = [
    {
      title: "Services",
      links: [...services.map((s) => ({ label: s.name, href: `${BASE}/services/${s.slug}` })), { label: "All services", href: `${BASE}/services` }],
    },
    {
      title: "Industries",
      links: [...industries.map((i) => ({ label: i.name, href: `${BASE}/industries#${i.slug}` })), { label: "Women’s safety", href: `${BASE}/industries#womens-safety` }],
    },
    {
      title: "Company",
      links: [
        { label: "About SDC", href: `${BASE}/about` },
        { label: "Training", href: `${BASE}/training` },
        { label: "SDC Command", href: `${BASE}/technology` },
        { label: "Clients", href: `${BASE}/clients` },
        { label: "Compliance", href: `${BASE}/compliance` },
        { label: "Careers", href: `${BASE}/careers` },
        { label: "Open positions", href: "/careers" },
        { label: "Apply online", href: CAREERS_APPLY_URL },
        { label: "Client portal", href: PORTAL_URL },
        { label: "Interactive demo", href: DEMO_URL },
      ],
    },
  ];
  return (
    <footer className="v2-footer v2-dark">
      <Rings className="v2-rings--footer" />
      <div className="v2-wrap">
        <div className="v2-footer-top">
          <div className="v2-footer-brand">
            <Wordmark tone="light" />
            <p>
              Security, facility management, housekeeping and manpower for Karnataka. Founded and led by
              ex-servicemen.
            </p>
            <p className="v2-footer-veteran">
              <span className="v2-red-mark" aria-hidden="true" /> Veteran-led since 2017
            </p>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={`Footer: ${c.title}`} className="v2-footer-col">
              <h2>{c.title}</h2>
              <ul>
                {c.links.map((l) => (
                  <li key={l.href + l.label}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="v2-footer-col">
            <h2>Contact</h2>
            <address className="v2-footer-contact">
              <a href={`tel:${company.phone}`}>
                <Phone size={15} aria-hidden="true" />
                {company.phoneDisplay}
              </a>
              <a href={whatsappLink("Hello SDC, I would like to discuss security services for my site.")} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} aria-hidden="true" />
                WhatsApp<span className="v2-sr"> (opens in a new tab)</span>
              </a>
              <a href={`mailto:${company.email}`}>
                <Mail size={15} aria-hidden="true" />
                {company.email}
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin size={15} aria-hidden="true" />
                <span>
                  {addressLines.map((l) => (
                    <span key={l} className="v2-block">
                      {l}
                    </span>
                  ))}
                </span>
                <span className="v2-sr"> (opens Google Maps in a new tab)</span>
              </a>
              <a href={CAREERS_KN_URL} lang="kn" hrefLang="kn">
                ಕನ್ನಡ · Careers in Kannada
              </a>
            </address>
          </div>
        </div>
        <ul className="v2-footer-creds" aria-label="Licences and registrations">
          <li>
            <ShieldCheck size={20} aria-hidden="true" />
            <span className="v2-fcred-label">PSARA licence</span>
            <span className="v2-fcred-value">{company.psara}</span>
            <span className="v2-fcred-note">Private security agency, Karnataka</span>
          </li>
          <li>
            <BadgeCheck size={20} aria-hidden="true" />
            <span className="v2-fcred-label">ISO 9001:2015</span>
            <span className="v2-fcred-value">{iso.number}</span>
            <span className="v2-fcred-note">
              {iso.body} · valid to {iso.validTo}
            </span>
          </li>
          <li>
            <Landmark size={20} aria-hidden="true" />
            <span className="v2-fcred-label">Company (CIN)</span>
            <span className="v2-fcred-value">{company.cin}</span>
            <span className="v2-fcred-note">Private limited, incorporated 2017</span>
          </li>
          <li>
            <FileCheck2 size={20} aria-hidden="true" />
            <span className="v2-fcred-label">Statutory</span>
            <span className="v2-fcred-value">EPF · ESI · GST</span>
            <span className="v2-fcred-note">Registered, paid for every employee</span>
          </li>
        </ul>
        <p className="v2-scam">
          <AlertTriangle size={17} aria-hidden="true" />
          <span>
            <strong>SDC never charges a fee for jobs.</strong> If anyone asks you to pay for a job, training or a
            uniform in SDC’s name, do not pay, and call us on {company.phoneDisplay}.
          </span>
        </p>
        <div className="v2-footer-bottom">
          <span>© 2026 SDC Security &amp; Facility Services Pvt. Ltd.</span>
          <span>The night scene of a guard outside an office building is illustrative imagery. All other photos are of SDC’s own people.</span>
          <Link href="/">
            One-page site <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
