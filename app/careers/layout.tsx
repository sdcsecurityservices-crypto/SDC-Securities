import { SiteShell } from "@/components/v2/site-shell";
import "./careers.css";

// Careers pages wear the website's header and footer, so they read as part of sdcsecurity.in.
export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
