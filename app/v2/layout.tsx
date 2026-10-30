import type { Metadata } from "next";
import { SiteShell } from "@/components/v2/site-shell";

// Multi-page website, the public site at sdcsecurity.in.
export const metadata: Metadata = {
  title: {
    default: "SDC | Security & Facility Services in Bengaluru",
    template: "%s | SDC Security & Facility Services",
  },
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
