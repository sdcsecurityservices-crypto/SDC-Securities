// Reusable building blocks for the multi-page site. Every class is prefixed
// `v2-` and styled in app/v2/v2.css, so a restyle is a CSS change.
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  Factory,
  HeartPulse,
  House,
  MessageCircle,
  Phone,
  School,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  BASE,
  SURVEY_URL,
  company,
  services,
  whatsappLink,
  type ClientLogo,
  type Industry,
  type Service,
} from "./data";

export const serviceIcons = {
  shield: ShieldCheck,
  building: Building2,
  sparkles: Sparkles,
  users: Users,
  clipboard: ClipboardCheck,
} as const;

export const industryIcons = {
  heart: HeartPulse,
  school: School,
  briefcase: Briefcase,
  factory: Factory,
  home: House,
} as const;

type Tone = "light" | "white" | "navy" | "deep" | "gold";

/** Thin concentric gold rings with one stronger arc, used as decoration. */
export function Rings({ className = "", tone = "gold" }: { className?: string; tone?: "gold" | "navy" }) {
  return (
    <svg className={`v2-rings v2-rings--${tone} ${className}`} viewBox="0 0 600 600" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor">
        <circle cx="300" cy="300" r="120" strokeOpacity=".34" strokeWidth="1.5" />
        <circle cx="300" cy="300" r="185" strokeOpacity=".24" strokeWidth="1.2" />
        <circle cx="300" cy="300" r="250" strokeOpacity=".15" strokeWidth="1.2" />
        <circle cx="300" cy="300" r="295" strokeOpacity=".08" strokeWidth="1" />
        <path d="M300 115 A185 185 0 0 1 485 300" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Eyebrow({ children, as: Tag = "p" }: { children: ReactNode; as?: "p" | "span" }) {
  return <Tag className="v2-eyebrow">{children}</Tag>;
}

/** Highlighted phrase inside a headline. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="v2-accent">{children}</span>;
}

export function Section({
  tone = "white",
  id,
  children,
  className = "",
  labelledBy,
  rings,
}: {
  tone?: Tone;
  id?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  rings?: "left" | "right";
}) {
  return (
    <section id={id} className={`v2-section v2-section--${tone} ${className}`} aria-labelledby={labelledBy}>
      {rings && <Rings className={`v2-rings--${rings}`} tone={tone === "gold" ? "navy" : "gold"} />}
      <div className="v2-container">{children}</div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  id,
  align = "split",
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
  align?: "split" | "stack" | "center";
  children?: ReactNode;
}) {
  return (
    <header className={`v2-head v2-head--${align}`}>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="v2-h2" id={id}>
          {title}
        </h2>
      </div>
      {(lead || children) && (
        <div className="v2-head-side">
          {lead && <p className="v2-lead">{lead}</p>}
          {children}
        </div>
      )}
    </header>
  );
}

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: BASE }, ...items];
  return (
    <nav className="v2-crumbs" aria-label="Breadcrumb">
      <ol>
        {all.map((c, i) => (
          <li key={c.label}>
            {c.href && i < all.length - 1 ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span aria-current={i === all.length - 1 ? "page" : undefined}>{c.label}</span>
            )}
            {i < all.length - 1 && <ChevronRight size={14} aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The navy band at the top of every inner page. */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  lead,
  actions,
  aside,
  image,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  image?: { src: string; alt: string; width: number; height: number };
}) {
  return (
    <section className={`v2-pagehero${image ? " v2-pagehero--image" : ""}`} aria-labelledby="v2-page-title">
      {image && (
        <img className="v2-pagehero-bg" src={image.src} alt={image.alt} width={image.width} height={image.height} />
      )}
      <Rings className="v2-rings--hero" />
      <div className="v2-container v2-pagehero-inner">
        <div className="v2-pagehero-copy">
          <Breadcrumbs items={crumbs} />
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 id="v2-page-title" className="v2-h1">
            {title}
          </h1>
          <p className="v2-pagehero-lead">{lead}</p>
          {actions && <div className="v2-actions">{actions}</div>}
        </div>
        {aside && <div className="v2-pagehero-aside">{aside}</div>}
      </div>
    </section>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "gold",
  external,
  icon = "arrow",
}: {
  href: string;
  children: ReactNode;
  variant?: "gold" | "navy" | "ghost" | "outline" | "light";
  external?: boolean;
  icon?: "arrow" | "up" | "none" | "phone" | "whatsapp";
}) {
  const Icon =
    icon === "arrow" ? ArrowRight : icon === "up" ? ArrowUpRight : icon === "phone" ? Phone : icon === "whatsapp" ? MessageCircle : null;
  const cls = `v2-btn v2-btn--${variant}`;
  const inner = (
    <>
      {(icon === "phone" || icon === "whatsapp") && Icon && <Icon size={18} aria-hidden="true" />}
      <span>{children}</span>
      {(icon === "arrow" || icon === "up") && Icon && <Icon size={18} aria-hidden="true" />}
    </>
  );
  if (external || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) {
    const newTab = href.startsWith("http");
    return (
      <a className={cls} href={href} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {inner}
        {newTab && <span className="v2-sr">(opens in a new tab)</span>}
      </a>
    );
  }
  return (
    <Link className={cls} href={href}>
      {inner}
    </Link>
  );
}

export function CheckList({ items, columns = 1, tone }: { items: readonly string[]; columns?: 1 | 2 | 3; tone?: "dark" }) {
  return (
    <ul className={`v2-checklist v2-checklist--cols-${columns}${tone ? " v2-checklist--dark" : ""}`}>
      {items.map((t) => (
        <li key={t}>
          <span className="v2-check" aria-hidden="true">
            <Check size={14} strokeWidth={3} />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Numbered horizontal flow with arrows between steps. */
export function StepFlow({
  steps,
  label,
  tone = "light",
}: {
  steps: { title: string; text: string }[];
  label: string;
  tone?: "light" | "dark";
}) {
  return (
    <ol className={`v2-steps v2-steps--${tone} v2-steps--n${steps.length}`} aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.title} className="v2-step">
          <span className="v2-step-num" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function StatBand({ items, tone = "deep" }: { items: { value: string; label: string; note?: string }[]; tone?: "deep" | "light" }) {
  return (
    <dl className={`v2-stats v2-stats--${tone}`}>
      {items.map((s) => (
        <div key={s.label} className="v2-stat">
          <dt>{s.label}</dt>
          <dd>
            <strong>{s.value}</strong>
            {s.note && <span>{s.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Photo({
  src,
  alt,
  caption,
  width,
  height,
  className = "",
  eager,
}: {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  className?: string;
  eager?: boolean;
}) {
  return (
    <figure className={`v2-photo ${className}`}>
      <img src={src} alt={alt} width={width} height={height} loading={eager ? "eager" : "lazy"} decoding="async" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** A screenshot of SDC Command in a simple browser frame. */
export function Screen({
  src,
  alt,
  width,
  height,
  label,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
  caption?: string;
}) {
  return (
    <figure className="v2-screen">
      <div className="v2-screen-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>{label}</span>
        <b>Demo data</b>
      </div>
      <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function ServiceCard({ service, index }: { service: Service; index: number }) {
  const Icon = serviceIcons[service.icon];
  return (
    <article className="v2-card v2-service-card">
      <div className="v2-card-top">
        <span className="v2-icon-bubble" aria-hidden="true">
          <Icon size={22} strokeWidth={1.7} />
        </span>
        <span className="v2-card-index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <p className="v2-tag">{service.name}</p>
      <h3>
        <Link className="v2-stretched" href={`${BASE}/services/${service.slug}`}>
          {service.headline[0]} {service.headline[1]}
        </Link>
      </h3>
      <p>{service.summary}</p>
      <ul className="v2-mini-list">
        {service.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <span className="v2-card-more" aria-hidden="true">
        Explore {service.short.toLowerCase()} <ArrowRight size={16} />
      </span>
    </article>
  );
}

export function IndustryCard({ industry }: { industry: Industry }) {
  const Icon = industryIcons[industry.icon];
  return (
    <article className="v2-card v2-industry-card">
      <span className="v2-icon-bubble" aria-hidden="true">
        <Icon size={22} strokeWidth={1.7} />
      </span>
      <p className="v2-tag">{industry.name}</p>
      <h3>
        <Link className="v2-stretched" href={`${BASE}/industries#${industry.slug}`}>
          {industry.line}
        </Link>
      </h3>
      <p>{industry.text}</p>
      <span className="v2-card-more" aria-hidden="true">
        How we serve {industry.name.split(" ")[0].toLowerCase()} <ArrowRight size={16} />
      </span>
    </article>
  );
}

export function LogoTile({ client }: { client: ClientLogo }) {
  return (
    <li className="v2-logo">
      <div className="v2-logo-mark">
        {client.file ? (
          <img src={`/clients/${client.file}`} alt={`${client.name} logo`} width={160} height={76} loading="lazy" decoding="async" />
        ) : (
          <span className="v2-logo-monogram" aria-hidden="true">
            {client.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </span>
        )}
      </div>
      <span className="v2-logo-name">{client.name}</span>
    </li>
  );
}

export function CredentialsStrip({ tone = "light" }: { tone?: "light" | "deep" }) {
  const items = [
    ["PSARA licence", company.psara],
    ["ISO 9001:2015", "QMS24221266"],
    ["Incorporated 2017", `CIN ${company.cin}`],
    ["Registered", "EPF · ESI · GST"],
  ];
  return (
    <ul className={`v2-creds v2-creds--${tone}`} aria-label="Company credentials">
      {items.map(([a, b]) => (
        <li key={a}>
          <ShieldCheck size={20} aria-hidden="true" />
          <span>
            <strong>{a}</strong>
            <small>{b}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Closing call to action used at the bottom of most pages. */
export function CtaBand({
  title = (
    <>
      Your peace of mind. <Accent>Our next mission.</Accent>
    </>
  ),
  text = "Next step: a free site survey, followed by a written post plan for your site.",
  eyebrow = "Let’s build a safer tomorrow",
  children,
}: {
  title?: ReactNode;
  text?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <section className="v2-cta" aria-labelledby="v2-cta-title">
      <Rings className="v2-rings--cta" />
      <div className="v2-container v2-cta-inner">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="v2-h2" id="v2-cta-title">
            {title}
          </h2>
          <p className="v2-lead">{text}</p>
        </div>
        <div className="v2-cta-actions">
          {children}
          <ButtonLink href={SURVEY_URL} variant={children ? "ghost" : "gold"}>
            Book a free site survey
          </ButtonLink>
          <ButtonLink href={`tel:${company.phone}`} variant="ghost" icon="phone">
            Call {company.phoneDisplay}
          </ButtonLink>
          <ButtonLink
            href={whatsappLink("Hello SDC, I would like to discuss security services for my site.")}
            variant="ghost"
            icon="whatsapp"
          >
            WhatsApp us
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function RelatedServices({ slugs, heading = "Related services" }: { slugs: string[]; heading?: string }) {
  const list = services.filter((s) => slugs.includes(s.slug));
  return (
    <div className="v2-related">
      <h2 className="v2-h3" id="v2-related-title">{heading}</h2>
      <ul>
        {list.map((s) => {
          const Icon = serviceIcons[s.icon];
          return (
            <li key={s.slug}>
              <Link href={`${BASE}/services/${s.slug}`}>
                <Icon size={20} aria-hidden="true" />
                <span>
                  <strong>{s.name}</strong>
                  <small>
                    {s.headline[0]} {s.headline[1]}
                  </small>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
