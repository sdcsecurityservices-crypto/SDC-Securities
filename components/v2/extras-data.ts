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
