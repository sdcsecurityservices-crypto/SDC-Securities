// Facts used by the legal and compliance pages (/v2/privacy, /v2/terms,
// /v2/grievance, /v2/accessibility, /v2/legal). Values that SDC still has to
// supply are null here; the pages render them as a highlighted [placeholder]
// so they are easy to find. Fill them in here and they update everywhere.
import { BASE } from "./data";

export const legalLinks = [
  { label: "Privacy", href: `${BASE}/privacy` },
  { label: "Terms", href: `${BASE}/terms` },
  { label: "Grievance", href: `${BASE}/grievance` },
  { label: "Accessibility", href: `${BASE}/accessibility` },
  { label: "Legal & disclosures", href: `${BASE}/legal` },
];

export const legal = {
  /** Draft date shown as "Last updated". Replace when the reviewed text is published. */
  lastUpdated: "14 October 2026",
  /** Set to false once a lawyer has reviewed the pages; hides the "Draft" badges and notices. */
  draft: true,

  // Grievance Officer (DPDP Act 2023 s.8(10); IT Rules 2011 r.5(9)). To be supplied by SDC.
  grievanceOfficer: {
    name: null as string | null,
    designation: null as string | null,
    email: null as string | null,
    phone: null as string | null,
  },
  /** Contact for data protection requests. Same as the Grievance Officer unless SDC says otherwise. */
  dataProtectionContact: null as string | null,

  /** Default proposed by the drafter; SDC's lawyer to confirm. */
  governingLaw: "the laws of India",
  jurisdiction: "the courts at Bengaluru, Karnataka",

  /** Confirmed from the Supabase project settings on 14 Oct 2026: AWS ap-south-1. */
  databaseRegion: "Mumbai, India (AWS ap-south-1)",
  /** Railway and Vercel serve the website; their server regions are still to be confirmed. */
  webServerRegion: null as string | null,

  /**
   * Annual return (Form MGT-7A) for FY 2025–26. Keep this null until SDC supplies
   * the filed MGT-7A PDF. The "Annual return" item on /v2/legal renders only when
   * a URL is set, so nothing about it shows publicly before then.
   */
  annualReturnUrl: null as string | null,
  annualReturnLabel: "Annual return (Form MGT-7A) for FY 2025–26",
};

export type TocItem = { id: string; label: string };
