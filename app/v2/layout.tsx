import type { Metadata } from "next";
import "./v2.css";
import { SiteHeader } from "@/components/v2/header";
import { SiteFooter } from "@/components/v2/footer";
import { Motion } from "@/components/v2/motion";

// Multi-page website. Kept out of search results until approved.
export const metadata: Metadata = {
  title: {
    default: "SDC | Security & Facility Services in Bengaluru",
    template: "%s | SDC Security & Facility Services",
  },
  robots: { index: false, follow: false },
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Kannada:wght@400;600&display=swap";

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v2">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS} />
      <a className="v2-skip" href="#v2-main">
        Skip to content
      </a>
      <div className="v2-patrol" aria-hidden="true">
        <span className="v2-patrol-fill" />
        <span className="v2-patrol-dot" />
      </div>
      <div className="v2-shutter" aria-hidden="true" />
      <SiteHeader />
      <main id="v2-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <Motion />
    </div>
  );
}
