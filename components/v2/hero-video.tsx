"use client";

// A short, silent ambient loop with a poster and a visible pause control.
// Under reduced motion it does not autoplay; the poster frame shows instead.
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function HeroVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      v.pause();
      return;
    }
    v.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, []);
  return (
    <>
      <video ref={ref} muted playsInline loop preload="metadata" poster={poster} aria-label={label} width={1920} height={1080}>
        <source src={src} type="video/mp4" />
      </video>
      <button
        type="button"
        className="v2-video-toggle"
        onClick={() => {
          const v = ref.current;
          if (!v) return;
          if (v.paused) {
            v.play().then(() => setPlaying(true)).catch(() => undefined);
          } else {
            v.pause();
            setPlaying(false);
          }
        }}
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {playing ? "Pause video" : "Play video"}
      </button>
    </>
  );
}
