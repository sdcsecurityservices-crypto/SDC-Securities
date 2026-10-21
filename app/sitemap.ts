import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { services } from "@/components/v2/data";

// The public pages of the website, at the public web address.
const pages: [path: string, freq: "weekly" | "monthly" | "yearly", priority: number][] = [
  ["/v2", "weekly", 1],
  ["/v2/services", "monthly", 0.9],
  ...services.map((s) => [`/v2/services/${s.slug}`, "monthly", 0.8] as [string, "monthly", number]),
  ["/v2/industries", "monthly", 0.8],
  ["/v2/clients", "monthly", 0.8],
  ["/v2/about", "monthly", 0.8],
  ["/v2/technology", "monthly", 0.7],
  ["/v2/training", "monthly", 0.7],
  ["/v2/compliance", "monthly", 0.7],
  ["/v2/contact", "monthly", 0.8],
  ["/v2/careers", "weekly", 0.8],
  ["/careers", "weekly", 0.7],
  ["/careers/apply", "monthly", 0.6],
  ["/v2/privacy", "yearly", 0.3],
  ["/v2/terms", "yearly", 0.3],
  ["/v2/grievance", "yearly", 0.3],
  ["/v2/accessibility", "yearly", 0.3],
  ["/v2/legal", "yearly", 0.3],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(([path, changeFrequency, priority]) => ({ url: `${SITE_URL}${path}`, changeFrequency, priority }));
}
