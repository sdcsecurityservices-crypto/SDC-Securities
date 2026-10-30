// Search and link-preview details for the website pages: one place to set a
// page's title, description, canonical address and preview card.
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { BASE, HOME, company } from "./data";

const SITE_NAME = "SDC Security & Facility Services";

/**
 * Metadata for a website page. `path` is the page's public path without BASE
 * ("/about", or "" for the home page); `title` is the full title as it should
 * appear in Google, so it carries the page's search words, not the template.
 */
export function pageMeta(path: string, title: string, description: string): Metadata {
  const url = path ? `${BASE}${path}` : HOME;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      title,
      description,
      url,
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og.jpg"] },
  };
}

/** The business as Google should understand it: a Bengaluru security services company. */
export function businessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${SITE_URL}/#business`,
    name: SITE_NAME,
    legalName: company.name,
    alternateName: ["SDC Security", "SDC Security Services", "SDC Security Services Pvt. Ltd."],
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/brand/sdc-logo.png`,
    image: `${SITE_URL}/og.jpg`,
    description:
      "Ex-servicemen-led, PSARA-licensed and ISO 9001:2015-certified security agency in Bengaluru providing security guards, lady guards, facility management, housekeeping and manpower across Karnataka.",
    telephone: company.phone,
    email: company.email,
    foundingDate: "2017",
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address.street,
      addressLocality: company.address.locality,
      addressRegion: company.address.region,
      postalCode: company.address.postalCode,
      addressCountry: company.address.country,
    },
    areaServed: [
      { "@type": "City", name: "Bengaluru" },
      { "@type": "State", name: "Karnataka" },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: company.phone,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Kannada", "Hindi"],
    },
    hasCredential: [
      { "@type": "EducationalOccupationalCredential", name: `PSARA licence ${company.psara}` },
      { "@type": "EducationalOccupationalCredential", name: "ISO 9001:2015, certificate QMS24221266" },
    ],
    knowsAbout: ["Security guard services", "Lady guards", "Facility management", "Housekeeping", "Manpower supply", "Payroll and statutory compliance"],
  };
}

/** A service offered by the business, for a service page. */
export function serviceSchema(path: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType: name,
    description,
    url: `${SITE_URL}${BASE}${path}`,
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: [
      { "@type": "City", name: "Bengaluru" },
      { "@type": "State", name: "Karnataka" },
    ],
  };
}

/** Breadcrumb trail in Google's format; hrefs are site paths as used in links. */
export function breadcrumbSchema(items: { label: string; href?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href === "/" ? "/" : c.href}` } : {}),
    })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
