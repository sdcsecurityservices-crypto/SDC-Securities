import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { BASE, services } from "@/components/v2/data";

// The public pages of the website, at the public web address.
const pages: [path: string, freq: "weekly" | "monthly" | "yearly", priority: number][] = [
  [BASE || "/", "weekly", 1],
  [`${BASE}/services`, "monthly", 0.9],
  ...services.map((s) => [`${BASE}/services/${s.slug}`, "monthly", 0.8] as [string, "monthly", number]),
  [`${BASE}/industries`, "monthly", 0.8],
  [`${BASE}/clients`, "monthly", 0.8],
  [`${BASE}/about`, "monthly", 0.8],
  [`${BASE}/technology`, "monthly", 0.7],
  [`${BASE}/training`, "monthly", 0.7],
  [`${BASE}/compliance`, "monthly", 0.7],
  [`${BASE}/contact`, "monthly", 0.8],
  [`${BASE}/careers`, "weekly", 0.8],
  [`${BASE}/privacy`, "yearly", 0.3],
  [`${BASE}/terms`, "yearly", 0.3],
  [`${BASE}/grievance`, "yearly", 0.3],
  [`${BASE}/accessibility`, "yearly", 0.3],
  [`${BASE}/legal`, "yearly", 0.3],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pages.map(([path, changeFrequency, priority]) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority }));
}
