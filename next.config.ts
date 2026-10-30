import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "pdfkit", "sharp", "qrcode", "pdf-lib"],
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  ...(process.env.SDC_RUNTIME !== "sites"
    ? {
        // Vercel packages the app itself; the standalone server is for Docker.
        ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
        // The legacy Cloudflare D1 demo only exists in the "sites" runtime.
        turbopack: { resolveAlias: { "cloudflare:workers": "./lib/no-cloudflare.ts" } },
      }
    : {}),
};

export default nextConfig;
