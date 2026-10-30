import "@/app/v2/v2.css";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { Motion } from "./motion";

/** The public website's frame: header, footer and motion (fonts load in the root layout). Used by the
 *  website pages and by the careers pages, so both look like one site. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="v2">
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
