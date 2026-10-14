// Shared building blocks for the legal pages: hero, draft notice, a sticky
// table of contents (collapsed into a disclosure on small screens), sections
// and visible [placeholders] for details SDC still has to supply.
import type { ReactNode } from "react";
import { FileWarning, ListTree } from "lucide-react";
import { BASE } from "./data";
import { legal, type TocItem } from "./legal-data";
import { HeroCompact, type Crumb } from "./ui";

/** A value SDC still has to supply or confirm. Highlighted so it is easy to find. */
export function Ph({ children }: { children: ReactNode }) {
  return <mark className="v2-ph">[{children}]</mark>;
}

/** Shows the value when set, otherwise a placeholder. */
export function Val({ value, ph }: { value: string | null | undefined; ph: string }) {
  return value ? <>{value}</> : <Ph>{ph}</Ph>;
}

export function LegalHero({
  crumb,
  eyebrow,
  title,
  lead,
  parent = true,
}: {
  crumb: string;
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  parent?: boolean;
}) {
  const crumbs: Crumb[] = parent ? [{ label: "Legal", href: `${BASE}/legal` }, { label: crumb }] : [{ label: crumb }];
  return (
    <HeroCompact
      crumbs={crumbs}
      eyebrow={eyebrow}
      title={title}
      lead={lead}
      aside={
        <dl className="v2-legal-meta">
          <div>
            <dt className="v2-mono-cap">Last updated</dt>
            <dd>
              {legal.lastUpdated}
              {legal.draft && <span className="v2-draft-badge">Draft</span>}
            </dd>
          </div>
          <div>
            <dt className="v2-mono-cap">Published by</dt>
            <dd>SDC Security &amp; Facility Services Pvt. Ltd.</dd>
          </div>
        </dl>
      }
    />
  );
}

export function DraftNotice() {
  if (!legal.draft) return null;
  return (
    <div className="v2-draft-notice" role="note">
      <FileWarning size={20} aria-hidden="true" />
      <p>
        <strong>Draft — pending legal review.</strong> This text is being reviewed by SDC’s legal adviser. Details shown
        in <mark className="v2-ph">[brackets]</mark> are still to be supplied or confirmed.
      </p>
    </div>
  );
}

function TocList({ items }: { items: TocItem[] }) {
  return (
    <ol>
      {items.map((t, i) => (
        <li key={t.id}>
          <a href={`#${t.id}`}>
            <span className="v2-toc-num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{t.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Two-column legal body: sticky contents on desktop, a collapsed disclosure on mobile. */
export function LegalBody({ toc, children }: { toc?: TocItem[]; children: ReactNode }) {
  return (
    <section className="v2-legal" aria-label="Page content">
      <div className="v2-wrap">
        <DraftNotice />
        <div className={toc ? "v2-legal-grid" : "v2-legal-grid v2-legal-grid--single"}>
          {toc && (
            <aside className="v2-toc-wrap">
              <details className="v2-toc v2-toc--mobile">
                <summary>
                  <ListTree size={18} aria-hidden="true" />
                  On this page
                </summary>
                <nav aria-label="On this page">
                  <TocList items={toc} />
                </nav>
              </details>
              <nav className="v2-toc v2-toc--desktop" aria-label="On this page">
                <p className="v2-mono-cap">On this page</p>
                <TocList items={toc} />
              </nav>
            </aside>
          )}
          <div className="v2-prose">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function Sec({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="v2-prose-sec" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      {children}
    </section>
  );
}

export function Summary({ title = "In short", children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="v2-legal-summary" aria-label={title}>
      <p className="v2-mono-cap">{title}</p>
      {children}
    </aside>
  );
}
