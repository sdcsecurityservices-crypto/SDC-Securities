import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
// The website is all public. The staff app lives on app.sdcsecurity.in, which
// sends its own noindex header (vercel.json), so nothing else is blocked here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
