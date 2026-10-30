import "@/app/v2/v2.css";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";
import { Motion } from "./motion";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Kannada:wght@400;600&display=swap";

/** The public website's frame: fonts, header, footer and motion. Used by the
 *  website pages and by the careers pages, so both look like one site. */
export function SiteShell({ children }: { children: React.ReactNode }) {
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
