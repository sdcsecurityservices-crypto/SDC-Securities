"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, MessageCircle, Phone, ShieldCheck, X } from "lucide-react";
import { BASE, CAREERS_KN_URL, DEMO_URL, PORTAL_URL, SURVEY_URL, company, iso, nav, services, whatsappLink } from "./data";
import { serviceIcons } from "./ui";

function isCurrent(pathname: string, href?: string) {
  if (!href) return false;
  const path = href.split("#")[0];
  if (path === BASE) return pathname === BASE || pathname === `${BASE}/`;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function Wordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <a className={`v2-brand v2-brand--${tone}`} href={BASE} aria-label="SDC Security & Facility Services, home">
      <img className="v2-brand-crest" src="/brand/sdc-logo.png" alt="" width={64} height={64} />
      <span className="v2-brand-word" aria-hidden="true">
        <span className="v2-bw-main">
          SDC Security &amp;
          <br />
          Facility Services
        </span>
        <span className="v2-bw-tag">An ex-servicemen enterprise</span>
      </span>
    </a>
  );
}

const WA = whatsappLink("Hello SDC, I would like to discuss security services for my site.");

function UtilityBar() {
  return (
    <div className="v2-utility">
      <div className="v2-utility-inner">
        <p className="v2-mono-cap">
          <ShieldCheck size={13} aria-hidden="true" /> PSARA {company.psara} · ISO 9001:2015 {iso.number}
        </p>
        <ul>
          <li>
            <a href={`tel:${company.phone}`}>
              <Phone size={13} aria-hidden="true" /> {company.phoneDisplay}
            </a>
          </li>
          <li>
            <a href={WA} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={13} aria-hidden="true" /> WhatsApp<span className="v2-sr"> (opens in a new tab)</span>
            </a>
          </li>
          <li>
            <a href={PORTAL_URL}>Client portal</a>
          </li>
          <li className="v2-lang-toggle">
            <span aria-current="true" lang="en">
              EN
            </span>
            <a href={CAREERS_KN_URL} lang="kn" hrefLang="kn" aria-label="ಕನ್ನಡದಲ್ಲಿ ಉದ್ಯೋಗಗಳು (Careers in Kannada)">
              ಕನ್ನಡ
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

function Dropdown({ item, pathname }: { item: (typeof nav)[number]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = `v2-menu-${item.label.toLowerCase()}`;
  const active = item.children?.some((c) => isCurrent(pathname, c.href));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const mega = item.kind === "mega";
  return (
    <li
      ref={ref}
      className={`v2-nav-item${open ? " is-open" : ""}`}
      onMouseEnter={() => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setOpen(true), 150);
      }}
      onMouseLeave={() => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setOpen(false), 120);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        className={`v2-nav-link${active ? " is-active" : ""}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          window.clearTimeout(timer.current);
          setOpen((o) => !o);
        }}
      >
        {item.label}
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      <div className={`v2-menu${mega ? " v2-menu--mega" : ""}`} id={id} hidden={!open}>
        <ul className="v2-menu-list">
          {item.children!.map((c, i) => {
            const Icon = mega && i < services.length ? serviceIcons[services[i].icon] : null;
            return (
              <li key={c.href}>
                <a href={c.href} aria-current={c.href === pathname ? "page" : undefined}>
                  {Icon && (
                    <span className="v2-menu-icon" aria-hidden="true">
                      <Icon size={20} strokeWidth={1.6} />
                    </span>
                  )}
                  <span>
                    <strong>{c.label}</strong>
                    {c.note && <small>{c.note}</small>}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        {mega && (
          <a className="v2-menu-promo v2-dark" href={`${BASE}/technology`}>
            <span className="v2-mono-cap">SDC Command</span>
            <strong>See the guard app and client portal</strong>
            <img src="/images/v2/command-centre.jpg" alt="" width={1600} height={752} loading="lazy" />
            <span className="v2-link">
              How it works <ArrowRight size={15} aria-hidden="true" />
            </span>
          </a>
        )}
      </div>
    </li>
  );
}

export function SiteHeader() {
  const pathname = usePathname() || BASE;
  const [mobile, setMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobile) return;
    // The sheet opens directly under the header, wherever the header sits: below the
    // utility bar at the top of the page, or pinned to the top once scrolled.
    const place = () => {
      const bottom = headerRef.current?.getBoundingClientRect().bottom;
      if (bottom) headerRef.current!.style.setProperty("--sheet-top", `${Math.round(bottom)}px`);
    };
    place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobile(false);
        buttonRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth > 1180) setMobile(false);
      else place();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    document.documentElement.classList.add("v2-lock");
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.documentElement.classList.remove("v2-lock");
    };
  }, [mobile]);

  return (
    <>
      <UtilityBar />
      <header className="v2-header" ref={headerRef}>
        <div className="v2-header-inner">
          <Wordmark />
          <nav className="v2-nav" aria-label="Main">
            <ul>
              {nav.map((item) =>
                item.children ? (
                  <Dropdown key={item.label} item={item} pathname={pathname} />
                ) : (
                  <li key={item.label} className="v2-nav-item">
                    <a
                      className={`v2-nav-link${isCurrent(pathname, item.href) ? " is-active" : ""}`}
                      href={item.href!}
                      aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </nav>
          <div className="v2-header-actions">
            <a className="v2-icon-btn" href={`tel:${company.phone}`} aria-label={`Call ${company.phoneDisplay}`}>
              <Phone size={18} aria-hidden="true" />
            </a>
            <a className="v2-btn v2-btn--primary v2-btn--sm" href={SURVEY_URL}>
              <span>Request a site survey</span>
              <ArrowRight size={16} aria-hidden="true" className="v2-btn-arrow" />
            </a>
          </div>
          <button
            ref={buttonRef}
            type="button"
            className="v2-menu-toggle"
            aria-expanded={mobile}
            aria-controls="v2-mobile-nav"
            onClick={() => setMobile((m) => !m)}
          >
            {mobile ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            <span className="v2-sr">{mobile ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
        <div className="v2-sheet" id="v2-mobile-nav" hidden={!mobile}>
          <nav aria-label="Main (mobile)">
            {nav.map((item) =>
              item.children ? (
                <details key={item.label} className="v2-sheet-group" open={item.children.some((c) => isCurrent(pathname, c.href))}>
                  <summary>
                    {item.label}
                    <ChevronDown size={18} aria-hidden="true" />
                  </summary>
                  <ul>
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <a href={c.href} aria-current={c.href === pathname ? "page" : undefined} onClick={() => setMobile(false)}>
                          {c.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <a
                  key={item.label}
                  className="v2-sheet-top"
                  href={item.href!}
                  aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                  onClick={() => setMobile(false)}
                >
                  {item.label}
                </a>
              ),
            )}
            <div className="v2-sheet-extra">
              <a href={PORTAL_URL}>Client portal</a>
              <a href={DEMO_URL}>Interactive demo</a>
              <a href={CAREERS_KN_URL} lang="kn" hrefLang="kn">
                ಕನ್ನಡ · Careers in Kannada
              </a>
            </div>
            <a className="v2-btn v2-btn--primary" href={SURVEY_URL} onClick={() => setMobile(false)}>
              <span>Request a site survey</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>
      <nav className="v2-bottom-bar" aria-label="Quick contact">
        <a href={`tel:${company.phone}`}>
          <Phone size={18} aria-hidden="true" />
          Call
        </a>
        <a href={WA} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={18} aria-hidden="true" />
          WhatsApp<span className="v2-sr"> (opens in a new tab)</span>
        </a>
        <a href={SURVEY_URL} className="is-primary">
          <ArrowRight size={18} aria-hidden="true" />
          Survey
        </a>
      </nav>
    </>
  );
}
