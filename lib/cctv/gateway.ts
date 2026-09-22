import { unseal } from "@/lib/employees/crypto";
export type CameraSession = {
  session_id: string;
  camera: string;
  site_id: string;
  title: string;
  stream_type: string;
  encrypted_source: string;
  viewer: string;
  expires_at: string;
};
export async function openGateway(tenant: string, session: CameraSession) {
  if (session.stream_type === "mock")
    return { mode: "mock", playback_url: null };
  const origin = process.env.CCTV_GATEWAY_ORIGIN,
    key = process.env.CCTV_GATEWAY_API_KEY;
  if (!origin || !key)
    throw Error(
      "A media gateway is not configured. Set CCTV_GATEWAY_ORIGIN and CCTV_GATEWAY_API_KEY to connect real cameras.",
    );
  const base = new URL(origin);
  if (base.protocol !== "https:" || base.username || base.password)
    throw Error("Gateway must use HTTPS");
  const source = unseal(
    session.encrypted_source,
    `${tenant}:camera:${session.camera}`,
  );
  const r = await fetch(new URL("/v1/view-sessions", base), {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: session.session_id,
      camera_id: session.camera,
      source,
      expires_at: session.expires_at,
      record: false,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw Error("The media gateway could not start this stream");
  const d = (await r.json()) as { playback_url: string };
  const playback = new URL(d.playback_url);
  if (playback.origin !== base.origin || playback.username || playback.password)
    throw Error("Gateway returned an invalid playback address");
  return { mode: "live", playback_url: playback.href };
}
