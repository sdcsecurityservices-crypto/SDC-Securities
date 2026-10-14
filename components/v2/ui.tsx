// Building blocks for the multi-page site (/v2). Styling lives in app/v2/v2.css.
// Motion hooks are data attributes (data-scan, data-seal, data-tick) that
// components/v2/motion.tsx enhances; everything is visible without JavaScript.
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  Factory,
  FileBadge,
  HeartPulse,
  House,
  Landmark,
  MessageCircle,
  Phone,
  ReceiptIndianRupee,
  School,
  ShieldCheck,
  SprayCan,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  BASE,
  SURVEY_URL,
  company,
  iso,
  photos,
  whatsappLink,
  type Industry,
  type PhotoKey,
  type Service,
} from "./data";

export const serviceIcons = {
  shield: ShieldCheck,
  building: Building2,
  sparkles: SprayCan,
  users: Users,
  clipboard: ReceiptIndianRupee,
} as const;

export const industryIcons = {
  heart: HeartPulse,
  school: School,
  briefcase: Briefcase,
  factory: Factory,
  home: House,
} as const;

/* ---------- photography ---------- */

export function Pic({
  photo,
  sizes = "100vw",
  className = "",
  priority,
  scan = true,
  alt,
}: {
  photo: PhotoKey;
  sizes?: string;
  className?: string;
  priority?: boolean;
  scan?: boolean;
  alt?: string;
}) {
  const p = photos[photo] as { src: string; w: number; h: number; alt: string; sizes?: number[]; ext?: string };
  const src = p.sizes ? `${p.src}-1600.jpg` : `${p.src}.${p.ext ?? "jpg"}`;
  const srcSet = p.sizes ? p.sizes.map((w) => `${p.src}-${w}.jpg ${w}w`).join(", ") : undefined;
  return (
    <img
      className={className}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      width={p.w}
      height={p.h}
      alt={alt ?? p.alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      {...(scan && !priority ? { "data-scan": "" } : {})}
    />
  );
}

/* ---------- type and structure ---------- */

/** The 40×2px gold rule that marks a section intro: a checkpoint on the patrol route. */
export function Rule() {
  return <span className="v2-rule" aria-hidden="true" />;
}

export function Accent({ children }: { children: ReactNode }) {
  return <span className="v2-accent">{children}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="v2-eyebrow">{children}</p>;
}

export function Intro({
  eyebrow,
  title,
  lead,
  id,
  align = "left",
  size = "l",
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
  align?: "left" | "split" | "center";
  size?: "l" | "xl";
  children?: ReactNode;
}) {
  return (
    <header className={`v2-intro v2-intro--${align}`}>
      <div>
        <Rule />
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className={size === "xl" ? "v2-h2 v2-h2--xl" : "v2-h2"} id={id}>
          {title}
        </h2>
      </div>
      {(lead || children) && (
        <div className="v2-intro-side">
          {lead && <p className="v2-lead">{lead}</p>}
          {children}
        </div>
      )}
    </header>
  );
}

type Tone = "canvas" | "stone" | "paper" | "navy" | "deep";

export function Chapter({
  tone = "canvas",
  id,
  labelledBy,
  className = "",
  children,
  wide,
  rings,
}: {
  tone?: Tone;
  id?: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
  wide?: boolean;
  rings?: boolean;
}) {
  const dark = tone === "navy" || tone === "deep";
  return (
    <section
      id={id}
      className={`v2-ch v2-ch--${tone}${dark ? " v2-dark" : ""} ${className}`}
      aria-labelledby={labelledBy}
    >
      {rings && <Rings className="v2-rings--ch" />}
      <div className={wide ? "v2-wrap v2-wrap--wide" : "v2-wrap"}>{children}</div>
    </section>
  );
}

/** Thin concentric rings with one stronger arc; the arc sweeps slowly like radar. */
export function Rings({ className = "" }: { className?: string }) {
  return (
    <svg className={`v2-rings ${className}`} viewBox="0 0 600 600" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor">
        <circle cx="300" cy="300" r="120" strokeOpacity=".3" strokeWidth="1.2" />
        <circle cx="300" cy="300" r="185" strokeOpacity=".2" strokeWidth="1" />
        <circle cx="300" cy="300" r="250" strokeOpacity=".13" strokeWidth="1" />
        <circle cx="300" cy="300" r="295" strokeOpacity=".07" strokeWidth="1" />
      </g>
      <g className="v2-rings-sweep" fill="none" stroke="currentColor">
        <path d="M300 115 A185 185 0 0 1 485 300" strokeOpacity=".75" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M300 50 A250 250 0 0 1 516 175" strokeOpacity=".35" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: BASE }, ...items];
  return (
    <nav className="v2-crumbs" aria-label="Breadcrumb">
      <ol>
        {all.map((c, i) => (
          <li key={c.label + i}>
            {c.href && i < all.length - 1 ? (
              <a href={c.href}>{c.label}</a>
            ) : (
              <span aria-current={i === all.length - 1 ? "page" : undefined}>{c.label}</span>
            )}
            {i < all.length - 1 && <ChevronRight size={13} aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------- buttons and lists ---------- */

export function Btn({
  href,
  children,
  variant = "primary",
  icon = "arrow",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  icon?: "arrow" | "up" | "none" | "phone" | "whatsapp";
  className?: string;
}) {
  const external = href.startsWith("http");
  const Lead = icon === "phone" ? Phone : icon === "whatsapp" ? MessageCircle : null;
  const Trail = icon === "arrow" ? ArrowRight : icon === "up" ? ArrowUpRight : null;
  return (
    <a
      className={`v2-btn v2-btn--${variant} ${className}`}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {Lead && <Lead size={18} aria-hidden="true" />}
      <span>{children}</span>
      {Trail && <Trail size={18} aria-hidden="true" className="v2-btn-arrow" />}
      {external && <span className="v2-sr"> (opens in a new tab)</span>}
    </a>
  );
}

/** The one primary call to action, used everywhere. */
export function SurveyBtn({ children = "Request a site survey", className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <Btn href={SURVEY_URL} className={className}>
      {children}
    </Btn>
  );
}

export function Ticks({ items, cols = 1 }: { items: readonly string[]; cols?: 1 | 2 }) {
  return (
    <ul className={`v2-ticks v2-ticks--${cols}`}>
      {items.map((t) => (
        <li key={t}>
          <Check size={16} strokeWidth={2.5} aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** A numeral that "roster-ticks" in, character by character. The value is always in the HTML. */
export function Numeral({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span className={`v2-num ${className}`} data-tick="">
      <span className="v2-sr">{value}</span>
      {[...value].map((ch, i) => (
        <span key={i} className="v2-num-ch" style={{ ["--i" as string]: i }} aria-hidden="true">
          {ch}
        </span>
      ))}
    </span>
  );
}

export function StatBand({ items }: { items: { value: string; label: string; note?: string }[] }) {
  return (
    <dl className="v2-stats">
      {items.map((s) => (
        <div key={s.label} className="v2-stat">
          <dt>{s.label}</dt>
          <dd>
            <Numeral value={s.value} />
            {s.note && <span className="v2-mono-cap">{s.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Patrol-route stepper: numbered checkpoints on one line. Vertical on mobile. */
export function Route({ steps, label }: { steps: { title: string; text: string; tag?: string }[]; label: string }) {
  return (
    <ol className={`v2-route v2-route--n${steps.length}`} aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.title} className="v2-route-step">
          <span className="v2-route-mark" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
          {s.tag && <span className="v2-chip">{s.tag}</span>}
        </li>
      ))}
    </ol>
  );
}

/** A vertical "chain of command": big mono numbers joined by a rule. */
export function Chain({ items, label }: { items: { title: string; text: string; href?: string; link?: string }[]; label: string }) {
  return (
    <ol className="v2-chain" aria-label={label}>
      {items.map((it, i) => (
        <li key={it.title}>
          <span className="v2-chain-num" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3>{it.title}</h3>
            <p>{it.text}</p>
            {it.href && (
              <a className="v2-link" href={it.href}>
                {it.link} <ArrowRight size={15} aria-hidden="true" />
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- credentials ---------- */

export const credentialList = [
  { icon: ShieldCheck, name: "PSARA licence", value: company.psara, note: "Granted 2019" },
  { icon: FileBadge, name: "ISO 9001:2015", value: iso.number, note: `${iso.body} · valid to ${iso.validTo}` },
  { icon: Landmark, name: "Incorporated 2017", value: `CIN ${company.cin}`, note: "Private limited, Bengaluru" },
  { icon: BadgeCheck, name: "EPF · ESI · GST", value: "Registered", note: "Statutory dues paid for every employee" },
];

export function Seals({ compact }: { compact?: boolean }) {
  return (
    <ul className={`v2-seals${compact ? " v2-seals--compact" : ""}`} aria-label="Company credentials">
      {credentialList.map((c, i) => (
        <li key={c.name} className="v2-seal" data-seal="" style={{ ["--i" as string]: i }}>
          <span className="v2-seal-icon" aria-hidden="true">
            <c.icon size={22} strokeWidth={1.6} />
          </span>
          <span className="v2-seal-body">
            <strong>{c.name}</strong>
            <span className="v2-seal-value">{c.value}</span>
            {!compact && <span className="v2-seal-note">{c.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- heroes ---------- */

export function HeroCompact({
  crumbs,
  eyebrow,
  title,
  lead,
  actions,
  aside,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="v2-hero-compact" aria-labelledby="v2-page-title">
      <div className="v2-wrap v2-hero-compact-grid">
        <div>
          <Breadcrumbs items={crumbs} />
          <Rule />
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 id="v2-page-title" className="v2-h1">
            {title}
          </h1>
          <p className="v2-hero-lead">{lead}</p>
          {actions && <div className="v2-actions">{actions}</div>}
        </div>
        {aside && <div className="v2-hero-compact-aside">{aside}</div>}
      </div>
    </section>
  );
}

/** Text on the left, a large photo bleeding off the right edge. */
export function HeroSplit({
  crumbs,
  eyebrow,
  title,
  lead,
  ticks,
  photo,
  actions,
  caption,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  ticks?: readonly string[];
  photo: PhotoKey;
  actions?: ReactNode;
  caption?: string;
}) {
  return (
    <section className="v2-hero-split" aria-labelledby="v2-page-title">
      <div className="v2-hero-split-copy">
        <Breadcrumbs items={crumbs} />
        <Rule />
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 id="v2-page-title" className="v2-h1">
          {title}
        </h1>
        <p className="v2-hero-lead">{lead}</p>
        {ticks && <Ticks items={ticks} />}
        <div className="v2-actions">{actions ?? <SurveyBtn />}</div>
      </div>
      <figure className="v2-hero-split-media">
        <Pic photo={photo} priority sizes="(min-width: 1024px) 50vw, 100vw" />
        {caption && <figcaption className="v2-mono-cap">{caption}</figcaption>}
      </figure>
    </section>
  );
}

/** Full-bleed dark photo hero with the torch beam. */
export function HeroPhoto({
  crumbs,
  eyebrow,
  title,
  lead,
  photo,
  actions,
  children,
  position = "center 35%",
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  photo?: PhotoKey;
  actions?: ReactNode;
  children?: ReactNode;
  position?: string;
}) {
  return (
    <section className="v2-hero-photo v2-dark" aria-labelledby="v2-page-title" data-torch="">
      <div className="v2-hero-photo-media" style={{ ["--pos" as string]: position }}>
        {children ?? (photo && <Pic photo={photo} priority sizes="100vw" />)}
      </div>
      <div className="v2-hero-shade" aria-hidden="true" />
      <div className="v2-torch" aria-hidden="true" />
      <div className="v2-wrap v2-hero-photo-copy">
        <Breadcrumbs items={crumbs} />
        <Rule />
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 id="v2-page-title" className="v2-h1 v2-h1--xl">
          {title}
        </h1>
        <p className="v2-hero-lead">{lead}</p>
        {actions && <div className="v2-actions">{actions}</div>}
      </div>
    </section>
  );
}

/* ---------- media ---------- */

export function Screen({
  src,
  alt,
  width,
  height,
  label,
  callouts,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
  callouts?: { x: number; y: number; n: number }[];
}) {
  return (
    <figure className="v2-screen">
      <div className="v2-screen-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>{label}</span>
      </div>
      <div className="v2-screen-img">
        <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" data-scan="" />
        {callouts?.map((c) => (
          <span key={c.n} className="v2-callout" style={{ left: `${c.x}%`, top: `${c.y}%` }} aria-hidden="true">
            {c.n}
          </span>
        ))}
      </div>
      <figcaption>
        <span className="v2-demo-tag">Demo data</span> Screen from the SDC Command demonstration workspace.
      </figcaption>
    </figure>
  );
}

/* ---------- cards ---------- */

export function IndustryCard({ industry, index }: { industry: Industry; index: number }) {
  const Icon = industryIcons[industry.icon];
  return (
    <li className="v2-ind-card">
      <a href={`${BASE}/industries#${industry.slug}`}>
        <span className="v2-ind-index v2-mono-cap" aria-hidden="true">
          {String(index + 1).padStart(2, "0")} / 05
        </span>
        <Icon size={30} strokeWidth={1.4} aria-hidden="true" />
        <strong>{industry.name}</strong>
        <span className="v2-ind-line">{industry.line}</span>
        <span className="v2-ind-go" aria-hidden="true">
          <ArrowRight size={18} />
        </span>
      </a>
    </li>
  );
}

export function ServiceLinks({ list, heading = "Related services" }: { list: Service[]; heading?: string }) {
  return (
    <nav className="v2-related" aria-label={heading}>
      {list.map((s) => {
        const Icon = serviceIcons[s.icon];
        return (
          <a key={s.slug} href={`${BASE}/services/${s.slug}`}>
            <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
            <span>
              <strong>{s.name}</strong>
              <small>
                {s.headline[0]} {s.headline[1]}
              </small>
            </span>
            <ArrowRight size={18} aria-hidden="true" className="v2-btn-arrow" />
          </a>
        );
      })}
    </nav>
  );
}

/* ---------- FAQ ---------- */

export function Faq({ items, id = "faq-title" }: { items: { q: string; a: string }[]; id?: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <div className="v2-faq">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <h2 className="v2-sr" id={id}>
        Frequently asked questions
      </h2>
      {items.map((i, n) => (
        <details key={i.q} className="v2-faq-item">
          <summary>
            <span className="v2-mono-cap">{String(n + 1).padStart(2, "0")}</span>
            <span>{i.q}</span>
          </summary>
          <p>{i.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ---------- CTA band ---------- */

export function CtaBand({
  title = (
    <>
      Let’s walk <Accent>your site.</Accent>
    </>
  ),
  text = "A free site survey, then a written post plan for your site. Phone and WhatsApp work just as well.",
  eyebrow = "Next step",
  children,
}: {
  title?: ReactNode;
  text?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <section className="v2-cta v2-dark" aria-labelledby="v2-cta-title">
      <Rings className="v2-rings--cta" />
      <div className="v2-wrap v2-cta-grid">
        <div>
          <Rule />
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="v2-h2 v2-h2--xl" id="v2-cta-title">
            {title}
          </h2>
          <p className="v2-lead">{text}</p>
        </div>
        <div className="v2-cta-actions">
          {children ?? <SurveyBtn />}
          <Btn href={`tel:${company.phone}`} variant="secondary" icon="phone">
            Call {company.phoneDisplay}
          </Btn>
          <Btn
            href={whatsappLink("Hello SDC, I would like to discuss security services for my site.")}
            variant="ghost"
            icon="whatsapp"
          >
            WhatsApp us
          </Btn>
        </div>
      </div>
    </section>
  );
}
