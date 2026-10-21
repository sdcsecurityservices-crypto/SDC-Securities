import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/control", "/workspace", "/employees", "/attendance", "/deployment", "/operations", "/cctv", "/business", "/settings", "/training", "/analytics", "/client-portal", "/activate", "/verify", "/verify-training", "/recruitment"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
