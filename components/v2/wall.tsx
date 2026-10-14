"use client";

// "Wall of honour": an asymmetric wall of client plaques on deep navy.
// Every plaque is in the server HTML. Sector chips filter it in place, using
// a view transition for the re-layout where the browser supports it.
import { useState } from "react";
import { flushSync } from "react-dom";
import { clientFilters, clients, type Client, type ClientFilter } from "./data";

function Plaque({ c, i }: { c: Client; i: number }) {
  const label = [c.sector, c.place].filter(Boolean).join(" · ");
  return (
    <li
      className={`v2-plaque v2-plaque--${c.marquee ? "major" : "minor"} v2-plaque--${c.shape}${c.span ? " v2-plaque--span" : ""}`}
      data-seal=""
      style={{ ["--i" as string]: i % 8, viewTransitionName: `v2-plaque-${i}` }}
    >
      <div className="v2-plaque-mark">
        {c.logo ? (
          <img src={c.logo} alt={`${c.name} logo`} loading="lazy" decoding="async" />
        ) : (
          <span className="v2-plaque-type" aria-hidden="true">
            <b>{c.name.split(" ")[0]}</b>
            <small>{c.name.split(" ").slice(1).join(" ")}</small>
          </span>
        )}
      </div>
      <div className="v2-plaque-foot">
        <strong>{c.name}</strong>
        <span className="v2-mono-cap">{label}</span>
      </div>
    </li>
  );
}

export function WallOfHonour({ mode = "full" }: { mode?: "full" | "condensed" }) {
  const [filter, setFilter] = useState<ClientFilter | "all">("all");
  const list =
    mode === "condensed"
      ? clients.filter((c, i) => c.marquee || clients.slice(0, i).filter((x) => !x.marquee).length < 12)
      : clients;
  const choose = (f: ClientFilter | "all") => {
    type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (doc.startViewTransition && !reduce && !document.hidden) {
      const t = doc.startViewTransition(() => flushSync(() => setFilter(f)));
      const ignore = () => undefined;
      t.ready.catch(ignore);
      t.finished.catch(ignore);
      t.updateCallbackDone.catch(ignore);
    } else setFilter(f);
  };
  return (
    <div className={`v2-wall v2-wall--${mode}`}>
      {mode === "full" && (
        <div className="v2-chips" role="group" aria-label="Filter clients by sector">
          {clientFilters.map((f) => {
            const count = f.id === "all" ? clients.length : clients.filter((c) => c.filter === f.id).length;
            return (
              <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => choose(f.id)}>
                {f.label}
                <span className="v2-mono">{count}</span>
              </button>
            );
          })}
        </div>
      )}
      <ul className="v2-wall-grid" aria-label="Client organisations">
        {list.map((c, i) => (filter === "all" || c.filter === filter ? <Plaque key={c.name} c={c} i={i} /> : null))}
      </ul>
    </div>
  );
}
