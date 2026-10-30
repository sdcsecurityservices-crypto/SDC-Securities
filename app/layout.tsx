import type { Metadata } from "next";
import "./globals.css";
import { KeepNavigation } from "@/components/runtime/keep-navigation";
import { SITE_URL } from "@/lib/site";

// Every web font the app and website use, as one stylesheet link. (A CSS
// @import of these is dropped by the Turbopack build Vercel runs.)
const FONTS =
  "https://fonts.googleapis.com/css2?family=Michroma&family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap";

const description =
  "SDC Security & Facility Services is an ex-servicemen-led, PSARA-licensed and ISO 9001:2015-certified security agency in Bengaluru, providing security guards, facility management, housekeeping and manpower across Karnataka.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="antialiased">
        <KeepNavigation />
        {children}
      </body>
    </html>
  );
}
