"use client";

// Home: a large service selector. Hovering, focusing or tapping a service swaps
// the big photo and its details. Each service is also a plain link to its page.
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { BASE, photos, services } from "./data";

const icons = ["01", "02", "03", "04", "05"];

export function ServiceSelector() {
  const [active, setActive] = useState(0);
  return (
    <div className="v2-selector">
      <ol className="v2-selector-list">
        {services.map((s, i) => (
          <li key={s.slug}>
            <a
              href={`${BASE}/services/${s.slug}`}
              className={i === active ? "is-active" : undefined}
              aria-current={i === active ? "true" : undefined}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
            >
              <span className="v2-mono v2-selector-num" aria-hidden="true">
                {icons[i]}
              </span>
              <span className="v2-selector-name">
                <strong>{s.name}</strong>
                <small>
                  {s.headline[0]} {s.headline[1]}
                </small>
              </span>
              <ArrowRight size={20} aria-hidden="true" className="v2-btn-arrow" />
            </a>
          </li>
        ))}
      </ol>
      <div className="v2-selector-stage" aria-live="polite">
        {services.map((s, i) => {
          const p = photos[s.photo] as { src: string; w: number; h: number; alt: string; sizes?: number[] };
          return (
            <figure key={s.slug} className={`v2-selector-panel${i === active ? " is-active" : ""}`} aria-hidden={i !== active}>
              <img
                src={`${p.src}-1600.jpg`}
                srcSet={p.sizes?.map((w) => `${p.src}-${w}.jpg ${w}w`).join(", ")}
                sizes="(min-width: 1024px) 60vw, 100vw"
                width={p.w}
                height={p.h}
                alt={p.alt}
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <p className="v2-mono-cap">{s.name}</p>
                <p className="v2-selector-summary">{s.summary}</p>
                <ul>
                  {s.highlights.map((h) => (
                    <li key={h}>
                      <Check size={15} strokeWidth={2.5} aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
