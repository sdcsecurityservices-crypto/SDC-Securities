import type { MetadataRoute } from "next";
const base = process.env.APP_URL || "https://sdc-command-production-ec49.up.railway.app";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/careers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/careers/apply`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
