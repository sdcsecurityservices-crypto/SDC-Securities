"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Menu, Phone, X } from "lucide-react";
import { BASE, SURVEY_URL, company, nav } from "./data";

function isCurrent(pathname: string, href?: string) {
  if (!href) return false;
  const path = href.split("#")[0];
  if (path === BASE) return pathname === BASE || pathname === `${BASE}/`;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function Wordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link className={`v2-brand v2-brand--${tone}`} href={BASE} aria-label="SDC Security & Facility Services, home">
      <img className="v2-brand-crest" src="/brand/sdc-logo.png" alt="" width={64} height={64} />
      <span className="v2-brand-word" aria-hidden="true">
        <span className="v2-bw-main">
          SDC Security &amp;
          <br />
          Facility Services
        </span>
        <span className="v2-bw-tag">An ex-servicemen enterprise</span>
      </span>
    </Link>
  );
}

function Dropdown({ item, pathname }: { item: (typeof nav)[number]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const id = `v2-menu-${item.label.toLowerCase()}`;
  const ref = useRef<HTMLLIElement>(null);
  const hoverOpened = useRef(false);
  const active = item.children?.some((c) => isCurrent(pathname, c.href)) || isCurrent(pathname, item.href);

  // Close when the route changes (adjusting state during render, not in an effect).
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }
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

  return (
    <li
      ref={ref}
      className={`v2-nav-item v2-nav-item--menu${open ? " is-open" : ""}`}
      onMouseEnter={() => {
        hoverOpened.current = true;
        setOpen(true);
        window.setTimeout(() => (hoverOpened.current = false), 400);
      }}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        className={`v2-nav-link${active ? " is-active" : ""}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => setOpen((o) => (e.detail === 0 ? !o : hoverOpened.current ? true : !o))}
      >
        {item.label}
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      <div className="v2-menu" id={id} hidden={!open}>
        <ul>
          {item.children!.map((c) => {
            const current = c.href.split("#")[0] === pathname && !c.href.includes("#");
            return (
              <li key={c.href}>
                <Link href={c.href} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}>
                  <strong>{c.label}</strong>
                  {c.note && <small>{c.note}</small>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}

export function SiteHeader() {
  const pathname = usePathname() || BASE;
  const [mobile, setMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setMobile(false);
  }
  useEffect(() => {
    if (!mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobile(false);
        buttonRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth > 1180) setMobile(false);
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
    <header className="v2-header">
      <div className="v2-header-inner">
        <Wordmark />
        <nav className="v2-nav" aria-label="Main">
          <ul>
            {nav.map((item) =>
              item.children ? (
                <Dropdown key={item.label} item={item} pathname={pathname} />
              ) : (
                <li key={item.label} className="v2-nav-item">
                  <Link
                    className={`v2-nav-link${isCurrent(pathname, item.href) ? " is-active" : ""}`}
                    href={item.href!}
                    aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
        <div className="v2-header-actions">
          <a className="v2-header-phone" href={`tel:${company.phone}`}>
            <Phone size={16} aria-hidden="true" />
            <span>{company.phoneDisplay}</span>
          </a>
          <Link className="v2-btn v2-btn--gold v2-btn--sm" href={SURVEY_URL}>
            <span>Book a site survey</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
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
      <div className="v2-mobile-nav" id="v2-mobile-nav" hidden={!mobile}>
        <nav aria-label="Main (mobile)">
          {nav.map((item) => (
            <div key={item.label} className="v2-mobile-group">
              {item.children ? (
                <>
                  <p className="v2-mobile-label">{item.label}</p>
                  <ul>
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          aria-current={c.href === pathname ? "page" : undefined}
                          onClick={() => setMobile(false)}
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link
                  className="v2-mobile-top"
                  href={item.href!}
                  aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                  onClick={() => setMobile(false)}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
          <div className="v2-mobile-cta">
            <Link className="v2-btn v2-btn--gold" href={SURVEY_URL} onClick={() => setMobile(false)}>
              <span>Book a site survey</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <a className="v2-btn v2-btn--outline" href={`tel:${company.phone}`}>
              <Phone size={16} aria-hidden="true" />
              <span>Call {company.phoneDisplay}</span>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
