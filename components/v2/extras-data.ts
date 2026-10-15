// Content added after comparing with SIS India (Oct 2026). Items that SDC still
// has to confirm are switched off here and render nothing until filled in.
import { company } from "./data";

/** Guard helpline: for SDC's own guards and staff. Uses the office number until SDC
 *  gives a dedicated line; set `confirmed: true` once they approve the number. */
export const guardHelpline = {
  phone: company.phone,
  phoneDisplay: company.phoneDisplay,
  hours: "Monday to Saturday, 9 am to 7 pm",
  confirmed: false,
};

/** Founder's one-line credo for the About page. null = section hidden.
 *  Options proposed to SDC (pick one, or Lokesh writes his own):
 *   - "Look after the guard, and the guard will look after your site."
 *   - "Discipline is not a slogan. It is what happens at 3 am when nobody is watching."
 *   - "Every post is a promise. We keep it, shift after shift."
 *   - "I served the nation in uniform. Now I make sure every SDC uniform serves our clients with the same honour." */
export const founderCredo: string | null = null;

/** Security equipment SDC supplies or manages. Hidden until SDC confirms each item.
 *  Set `show: true` and remove any line SDC does not actually provide. */
export const equipment = {
  show: false,
  groups: [
    { title: "Surveillance", items: ["CCTV cameras and recording", "Body-worn cameras for guards", "Monitoring from a control room"] },
    { title: "Access control", items: ["Boom barriers and flap barriers", "Visitor management", "Biometric and card access"] },
    { title: "Screening", items: ["Handheld metal detectors", "Door-frame metal detectors", "Baggage scanners"] },
    { title: "Communication", items: ["Digital walkie-talkies", "Public address systems", "Panic buttons and SOS"] },
    { title: "Fire safety", items: ["Extinguishers and refills", "Fire alarm checks", "Fire drills and evacuation plans"] },
    { title: "Patrol tools", items: ["QR checkpoints on SDC Command", "Guard tour logs", "Torches, batons and rain gear"] },
  ],
};

/** Third director. `photo` picks which approved portrait is used site-wide. */
export const soundarya = {
  name: "Soundarya CV",
  role: "Director",
  photo: "suit" as "saree" | "suit",
  photos: {
    saree: { src: "/images/v2/director-soundarya-saree.png", w: 533, h: 993 },
    suit: { src: "/images/v2/director-soundarya-suit.png", w: 458, h: 995 },
  },
  line: "10+ years in data analytics at leading technology companies.",
  record: [
    ["10+ yrs", "Data analytics"],
    ["Tech", "Leading companies"],
    ["B.Sc.", "Graduate"],
  ] as [string, string][],
};

/** Face position in each leader cut-out (image pixels): eye line, eye-to-mouth
 *  distance and face centre. Used to place every portrait so heads are level and
 *  the same size across the leadership cards and About portraits. */
export type FaceFit = { w: number; eye: number; em: number; cx: number };
export const faceFit: Record<string, FaceFit> = {
  "/images/founder-lokesh.png": { w: 449, eye: 100, em: 50, cx: 218 },
  "/images/director-vijay.png": { w: 560, eye: 148, em: 74, cx: 239 },
  "/images/v2/director-soundarya-suit.png": { w: 458, eye: 155, em: 70, cx: 228 },
  "/images/v2/director-soundarya-saree.png": { w: 533, eye: 152, em: 70, cx: 239 },
};
/** CSS variables that place a portrait by its face. Units are "per unit of the
 *  frame": --fw width, --ft top, --fl left offset of the face centre. */
export function faceVars(src: string, eyeAt: number, faceSize: number) {
  const f = faceFit[src];
  if (!f) return {};
  const k = faceSize / f.em;
  return {
    ["--fw" as string]: String(f.w * k),
    ["--ft" as string]: String(eyeAt - f.eye * k),
    ["--fl" as string]: String(-f.cx * k),
  } as React.CSSProperties;
}
