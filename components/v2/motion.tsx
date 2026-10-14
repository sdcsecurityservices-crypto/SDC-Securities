"use client";

// The /v2 motion system. Everything starts visible; this only "arms" elements
// that are still below the fold, then plays a one-time effect when they arrive.
//  - checkpoints: section rules light up as the patrol line reaches them
//  - scan: images reveal through a single scan line
//  - seal: credential badges and client plaques settle with a stamp press
//  - tick: mono numerals flip character by character (value always in the HTML)
//  - torch: a soft light follows the pointer on dark heroes (fine pointers only)
//  - patrol line progress fallback where CSS scroll timelines are unsupported
//  - header condenses after scrolling
// Nothing runs under prefers-reduced-motion.
import { useEffect } from "react";

const SELECTOR = ".v2-rule, [data-scan], [data-seal], [data-tick]";

export function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector<HTMLElement>(".v2-header");
    const onScrollHeader = () => header?.classList.toggle("is-condensed", window.scrollY > 48);
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });

    // Hash links on first load: the router can reset scroll after hydration,
    // so land on the target ourselves (scroll-margin keeps it below the header).
    const jumpToHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (el) el.scrollIntoView({ block: "start", behavior: "auto" });
    };
    if (window.location.hash) {
      requestAnimationFrame(jumpToHash);
      window.setTimeout(jumpToHash, 350);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      return () => window.removeEventListener("scroll", onScrollHeader);
    }
    root.classList.add("v2-motion");

    // Patrol line fallback: drive --patrol from scroll position.
    let raf = 0;
    const supportsTimeline = CSS.supports("animation-timeline: scroll()");
    const onScrollPatrol = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        root.style.setProperty("--patrol", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
      });
    };
    if (!supportsTimeline) {
      onScrollPatrol();
      window.addEventListener("scroll", onScrollPatrol, { passive: true });
    }

    // Arm everything below the fold; elements already on screen stay as they are,
    // except checkpoints, which clock straight away.
    const fold = window.innerHeight;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.dataset.on = "";
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.01 },
    );
    const arm = (el: HTMLElement) => {
      if (el.dataset.armed !== undefined || el.dataset.on !== undefined) return;
      const top = el.getBoundingClientRect().top;
      if (top < fold * 0.95 && !el.classList.contains("v2-rule")) return;
      el.dataset.armed = "";
      io.observe(el);
    };
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach(arm);
    // Elements added later (filters, slideshow) are left static.

    // Torch beam on dark heroes.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups: (() => void)[] = [];
    if (fine) {
      document.querySelectorAll<HTMLElement>("[data-torch]").forEach((hero) => {
        let r = 0;
        const move = (ev: PointerEvent) => {
          if (r) return;
          r = requestAnimationFrame(() => {
            r = 0;
            const b = hero.getBoundingClientRect();
            hero.style.setProperty("--tx", `${ev.clientX - b.left}px`);
            hero.style.setProperty("--ty", `${ev.clientY - b.top}px`);
          });
        };
        const enter = () => hero.classList.add("is-lit");
        const leave = () => hero.classList.remove("is-lit");
        hero.addEventListener("pointermove", move);
        hero.addEventListener("pointerenter", enter);
        hero.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerenter", enter);
          hero.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScrollHeader);
      window.removeEventListener("scroll", onScrollPatrol);
      cleanups.forEach((c) => c());
      root.classList.remove("v2-motion");
    };
  }, []);
  return null;
}
