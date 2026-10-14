import type { Metadata } from "next";
import "./v2.css";
import { SiteHeader } from "@/components/v2/header";
import { SiteFooter } from "@/components/v2/footer";

// Preview of the multi-page website. Kept out of search results until approved.
export const metadata: Metadata = {
  title: {
    default: "SDC | Security & Facility Services in Bengaluru",
    template: "%s | SDC Security & Facility Services",
  },
  robots: { index: false, follow: false },
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v2">
      <a className="v2-skip" href="#v2-main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="v2-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
