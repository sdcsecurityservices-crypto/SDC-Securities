"use client";

// Home hero: a slow crossfading slideshow carried over from the one-page site,
// restyled. Slide 1 is fully rendered on the server; the rest are layered behind it.
// Under reduced motion only the first slide shows and nothing advances by itself.
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Radar, Check } from "lucide-react";
import { DEMO_URL, SURVEY_URL, photos, type PhotoKey } from "./data";

const slides: {
  label: string;
  eyebrow: string;
  title: string;
  accent: string;
  text: string;
  link: { href: string; label: string };
  photo: PhotoKey;
  pos: string;
  card: string;
}[] = [
  {
    label: "Security that sees more",
    eyebrow: "Veteran led · Technology enabled",
    title: "Human vigilance.",
    accent: "Machine intelligence.",
    text: "Exceptional people. Connected systems. Complete peace of mind. Security and facility services for Karnataka, run with military discipline and our own technology.",
    link: { href: "/v2/technology", label: "See how SDC Command works" },
    photo: "campus",
    pos: "62% 50%",
    card: "One connected operation",
  },
  {
    label: "People you can count on",
    eyebrow: "Discipline in every deployment",
    title: "The right people.",
    accent: "Where it matters.",
    text: "From your front gate to your busiest shift: trained guards and lady guards, dependable facility teams and supervisors who answer for every post.",
    link: { href: "/v2/services", label: "Explore our services" },
    photo: "lineup",
    pos: "50% 40%",
    card: "Built around your site",
  },
  {
    label: "Connected operations",
    eyebrow: "Meet SDC Command",
    title: "Every person.",
    accent: "A clearer picture.",
    text: "Postings, attendance, patrols and payroll in one connected system, with a client portal that shows you what you are paying for.",
    link: { href: DEMO_URL, label: "Explore the Command demo" },
    photo: "academyBatch",
    pos: "50% 45%",
    card: "Explore SDC Command",
  },
];

const HOLD = 6500;

function SlideImage({ photo, pos, first }: { photo: PhotoKey; pos: string; first: boolean }) {
  const p = photos[photo] as { src: string; w: number; h: number; alt: string; sizes?: number[]; ext?: string };
  const srcSet = p.sizes ? p.sizes.map((w) => `${p.src}-${w}.jpg ${w}w`).join(", ") : `${p.src}.webp 1672w`;
  const src = p.sizes ? `${p.src}-1600.jpg` : `${p.src}.${p.ext ?? "jpg"}`;
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes="100vw"
      width={p.w}
      height={p.h}
      alt={p.alt}
      style={{ objectPosition: pos }}
      loading={first ? "eager" : "lazy"}
      decoding={first ? "sync" : "async"}
      {...(first ? { fetchPriority: "high" as const } : {})}
    />
  );
}

export function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const [moved, setMoved] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(m.matches);
    const vis = () => setVisible(!document.hidden);
    sync();
    m.addEventListener("change", sync);
    document.addEventListener("visibilitychange", vis);
    return () => {
      m.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const rotating = !paused && !hold && !reduced && visible;
  useEffect(() => {
    if (!rotating) return;
    const t = window.setTimeout(() => {
      setMoved(true);
      setActive((i) => (i + 1) % slides.length);
    }, HOLD);
    return () => window.clearTimeout(t);
  }, [active, rotating]);

  const go = (i: number) => {
    setMoved(true);
    setActive((i + slides.length) % slides.length);
  };
  const s = slides[active];

  return (
    <section
      ref={root}
      className={`v2-home-hero v2-dark${rotating ? " is-rotating" : ""}${moved ? " has-moved" : ""}`}
      aria-roledescription="carousel"
      aria-label="SDC at a glance"
      data-torch=""
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node)) setHold(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        if (e.key === "ArrowLeft") go(active - 1);
      }}
    >
      <div className="v2-home-hero-media">
        {slides.map((sl, i) => (
          <div key={sl.label} className={`v2-slide-img${i === active ? " is-active" : ""}`} aria-hidden={i !== active}>
            <SlideImage photo={sl.photo} pos={sl.pos} first={i === 0} />
          </div>
        ))}
      </div>
      <div className="v2-hero-shade" aria-hidden="true" />
      <div className="v2-torch" aria-hidden="true" />

      <div className="v2-wrap v2-home-hero-grid">
        <div className="v2-home-hero-copy" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
          <div key={active} className="v2-slide-copy" role="group" aria-roledescription="slide" aria-label={`${active + 1} of ${slides.length}: ${s.label}`}>
            <span className="v2-rule" aria-hidden="true" />
            <p className="v2-eyebrow">{s.eyebrow}</p>
            <h1 className="v2-display">
              {s.title}{" "}
              <br />
              <span className="v2-accent">{s.accent}</span>
            </h1>
            <p className="v2-hero-lead">{s.text}</p>
            <div className="v2-actions">
              <a className="v2-btn v2-btn--primary" href={SURVEY_URL}>
                <span>Request a site survey</span>
                <ArrowRight size={18} aria-hidden="true" className="v2-btn-arrow" />
              </a>
              <a className="v2-btn v2-btn--ghost" href={s.link.href}>
                <span>{s.link.label}</span>
                <ArrowUpRight size={18} aria-hidden="true" className="v2-btn-arrow" />
              </a>
            </div>
          </div>
        </div>

        <aside className="v2-demo-card" aria-label="SDC Command demo preview">
          <p className="v2-demo-card-title">
            <Radar size={17} aria-hidden="true" />
            SDC Command
            <span className="v2-mono-cap">Demo preview</span>
          </p>
          <p className="v2-demo-card-row">
            <span>{s.card}</span>
            <Check size={16} aria-hidden="true" />
          </p>
          <dl className="v2-demo-card-data">
            <div>
              <dt>On duty</dt>
              <dd className="v2-mono">34</dd>
            </div>
            <div>
              <dt>Present</dt>
              <dd className="v2-mono">68</dd>
            </div>
            <div>
              <dt>Open incidents</dt>
              <dd className="v2-mono">4</dd>
            </div>
          </dl>
          <a href={DEMO_URL}>
            Step inside the command centre <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <p className="v2-demo-card-note">Sample figures from the demonstration workspace.</p>
        </aside>
      </div>

      <div className="v2-wrap v2-slide-controls">
        <div className="v2-slide-picker" role="group" aria-label="Choose a slide">
          {slides.map((sl, i) => (
            <button
              key={sl.label}
              type="button"
              aria-label={`Show slide ${i + 1}: ${sl.label}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => {
                setPaused(true);
                go(i);
              }}
            >
              <span className="v2-slide-track">
                <span key={`${active}-${rotating}`} />
              </span>
              <span className="v2-slide-label">
                <b className="v2-mono">{String(i + 1).padStart(2, "0")}</b>
                {sl.label}
              </span>
            </button>
          ))}
        </div>
        <div className="v2-slide-buttons">
          <span className="v2-mono v2-slide-count" aria-hidden="true">
            {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <button type="button" aria-label="Previous slide" onClick={() => { setPaused(true); go(active - 1); }}>
            <ArrowLeft size={18} />
          </button>
          <button type="button" aria-label="Next slide" onClick={() => { setPaused(true); go(active + 1); }}>
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            aria-label={paused || reduced ? "Play slideshow" : "Pause slideshow"}
            onClick={() => {
              if (reduced) setReduced(false);
              setPaused(!(paused || reduced));
            }}
          >
            {paused || reduced ? <Play size={17} /> : <Pause size={17} />}
          </button>
        </div>
      </div>

      <ul className="v2-wrap v2-hero-creds" aria-label="Credentials">
        <li>
          <span className="v2-mono">PSARA</span> ISD/PSA-64/2019
        </li>
        <li>
          <span className="v2-mono">ISO</span> 9001:2015
        </li>
        <li>
          <span className="v2-red-mark" aria-hidden="true" /> Veteran-led
        </li>
        <li>
          <span className="v2-mono">1000+</span> deployed
        </li>
      </ul>
    </section>
  );
}
