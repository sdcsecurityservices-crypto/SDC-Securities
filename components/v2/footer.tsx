import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { BASE, DEMO_URL, addressLines, company, industries, mapsUrl, services, whatsappLink } from "./data";
import { Wordmark } from "./header";
import { Rings } from "./ui";

export function SiteFooter() {
  const columns = [
    {
      title: "Services",
      links: [
        { label: "All services", href: `${BASE}/services` },
        ...services.map((s) => ({ label: s.name, href: `${BASE}/services/${s.slug}` })),
      ],
    },
    {
      title: "Industries",
      links: industries.map((i) => ({ label: i.name, href: `${BASE}/industries#${i.slug}` })),
    },
    {
      title: "Company",
      links: [
        { label: "About SDC", href: `${BASE}/about` },
        { label: "Clients", href: `${BASE}/clients` },
        { label: "Compliance", href: `${BASE}/compliance` },
        { label: "Careers", href: `${BASE}/careers` },
        { label: "Contact", href: `${BASE}/contact` },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Training academy", href: `${BASE}/training` },
        { label: "SDC Command", href: `${BASE}/technology` },
        { label: "Interactive demo", href: DEMO_URL },
        { label: "Book a site survey", href: `${BASE}/contact#survey` },
      ],
    },
  ];
  return (
    <footer className="v2-footer">
      <Rings className="v2-rings--footer" />
      <div className="v2-container">
        <div className="v2-footer-top">
          <div className="v2-footer-brand">
            <Wordmark tone="light" />
            <p>
              Security, facility management, housekeeping and manpower for Karnataka, run with military discipline and
              our own technology.
            </p>
            <address className="v2-footer-contact">
              <a href={`tel:${company.phone}`}>
                <Phone size={16} aria-hidden="true" />
                {company.phoneDisplay}
              </a>
              <a
                href={whatsappLink("Hello SDC, I would like to discuss security services for my site.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={16} aria-hidden="true" />
                WhatsApp<span className="v2-sr"> (opens in a new tab)</span>
              </a>
              <a href={`mailto:${company.email}`}>
                <Mail size={16} aria-hidden="true" />
                {company.email}
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin size={16} aria-hidden="true" />
                <span>
                  {addressLines.map((l) => (
                    <span key={l} className="v2-block">
                      {l}
                    </span>
                  ))}
                </span>
                <span className="v2-sr"> (opens Google Maps in a new tab)</span>
              </a>
            </address>
          </div>
          <div className="v2-footer-cols">
            {columns.map((c) => (
              <nav key={c.title} aria-label={`Footer: ${c.title}`}>
                <h2>{c.title}</h2>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="v2-footer-creds">
          <span>PSARA licence {company.psara}</span>
          <span>ISO 9001:2015 · QMS24221266</span>
          <span>CIN {company.cin}</span>
          <span>EPF · ESI · GST registered</span>
        </div>
        <div className="v2-footer-bottom">
          <span>© 2026 SDC Security &amp; Facility Services Pvt. Ltd.</span>
          <Link href="/">
            View the one-page site <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
