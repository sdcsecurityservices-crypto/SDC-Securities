import type { Metadata } from "next";
import "./globals.css";
import { KeepNavigation } from "@/components/runtime/keep-navigation";

const base = process.env.APP_URL || "https://sdc-command-production-ec49.up.railway.app";
const description =
  "SDC Security & Facility Services is an ex-servicemen-led, PSARA-licensed and ISO 9001:2015-certified security agency in Bengaluru, providing security guards, facility management, housekeeping and manpower across Karnataka.";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: "SDC | Security & Facility Services in Bengaluru",
  description,
  keywords: [
    "security services Bengaluru",
    "security guards Bangalore",
    "security agency Karnataka",
    "facility management",
    "housekeeping services",
    "manpower supply",
    "ex-servicemen security",
    "PSARA licensed",
    "ISO 9001:2015 certified",
  ],
  icons: {
    icon: "/brand/sdc-logo.png",
    shortcut: "/brand/sdc-logo.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "SDC Security & Facility Services",
    title: "SDC | The right people. Where it matters.",
    description,
    url: "/",
    locale: "en_IN",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "SDC Security & Facility Services" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SDC | Security & Facility Services",
    description,
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className="antialiased">
        <KeepNavigation />
        {children}
      </body>
    </html>
  );
}
