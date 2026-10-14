import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, MapPinned, ShieldCheck } from "lucide-react";
import "./auth.css";

/** Shared split layout for sign-in, activation and public verification pages. */
export function AuthLayout({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <aside className="auth-brand-panel">
        <Link href="/" className="auth-brand auth-brand--grand" aria-label="SDC Security & Facility Services, SDC Command">
          <img src="/brand/sdc-logo.png" alt="" width={132} height={132} />
          <span className="auth-word" aria-hidden="true">
            <span className="auth-word-main">
              SDC Security &amp;
              <br />
              Facility Services
            </span>
            <span className="auth-word-tag">An ex-servicemen enterprise</span>
            <span className="auth-word-app">SDC Command</span>
          </span>
        </Link>
        <div className="auth-pitch">
          <h2>
            Every site. Every shift.
            <br />
            <em>Accounted for.</em>
          </h2>
          <ul>
            <li>
              <ShieldCheck size={18} aria-hidden /> Role-based access for every
              team member
            </li>
            <li>
              <MapPinned size={18} aria-hidden /> GPS and selfie-verified
              attendance
            </li>
            <li>
              <BadgeCheck size={18} aria-hidden /> A complete audit trail behind
              every action
            </li>
          </ul>
        </div>
        <p className="auth-legal">
          SDC Security &amp; Facility Services Pvt. Ltd. · PSARA licensed ·
          Bengaluru
        </p>
      </aside>
      <section className="auth-form-panel">
        <Link href="/" className="auth-brand auth-brand-mobile" aria-label="SDC Security & Facility Services, SDC Command">
          <img src="/brand/sdc-logo.png" alt="" width={52} height={52} />
          <span className="auth-word" aria-hidden="true">
            <span className="auth-word-main">
              SDC Security &amp;
              <br />
              Facility Services
            </span>
            <span className="auth-word-tag">An ex-servicemen enterprise</span>
            <span className="auth-word-app">SDC Command</span>
          </span>
        </Link>
        <div className="auth-card">
          <span className="auth-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {lead && <p className="auth-lead">{lead}</p>}
          {children}
        </div>
      </section>
    </main>
  );
}
