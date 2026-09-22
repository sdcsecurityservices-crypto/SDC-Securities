"use client";
import { useEffect, useRef } from "react";
import type Hls from "hls.js";
export function LiveVideo({
  url,
  onError,
}: {
  url: string;
  onError: (message: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null),
    error = useRef(onError);
  useEffect(() => {
    error.current = onError;
  }, [onError]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let player: Hls | undefined,
      active = true;
    if (element.canPlayType("application/vnd.apple.mpegurl")) {
      element.src = url;
      void element
        .play()
        .catch(() => error.current("Tap to retry camera playback."));
    } else
      void import("hls.js")
        .then(({ default: Engine }) => {
          if (!active) return;
          if (!Engine.isSupported())
            throw Error("This browser cannot play the gateway stream.");
          player = new Engine({
            lowLatencyMode: true,
            backBufferLength: 0,
            maxBufferLength: 6,
            xhrSetup: (xhr, address) => {
              if (new URL(address, url).origin !== new URL(url).origin) {
                xhr.abort();
                throw Error(
                  "Gateway media must remain on its authorised origin.",
                );
              }
            },
          });
          player.on(Engine.Events.ERROR, (_event, data) => {
            if (data.fatal)
              error.current(
                "Camera stream interrupted. Reopen the view to reconnect.",
              );
          });
          player.loadSource(url);
          player.attachMedia(element);
          player.on(Engine.Events.MANIFEST_PARSED, () => {
            void element
              .play()
              .catch(() => error.current("Camera playback could not start."));
          });
        })
        .catch((e) => error.current(e.message));
    return () => {
      active = false;
      player?.destroy();
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [url]);
  return (
    <video
      ref={video}
      autoPlay
      muted
      playsInline
      controls={false}
      style={{ width: "100%", display: "block" }}
    />
  );
}
