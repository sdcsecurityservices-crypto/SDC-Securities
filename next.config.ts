import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "pdfkit", "sharp", "qrcode", "pdf-lib"],
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  ...(process.env.SDC_RUNTIME !== "sites"
    ? { output: "standalone" as const }
    : {}),
};

export default nextConfig;
