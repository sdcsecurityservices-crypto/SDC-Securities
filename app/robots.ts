import type { MetadataRoute } from "next";
const base = process.env.APP_URL || "https://sdc-command-production-ec49.up.railway.app";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/control", "/workspace", "/employees", "/attendance", "/deployment", "/operations", "/cctv", "/business", "/settings", "/training", "/analytics", "/client-portal", "/activate", "/verify", "/verify-training"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
