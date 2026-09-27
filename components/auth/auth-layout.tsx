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
        <Link href="/" className="auth-brand">
          <img src="/brand/sdc-logo.png" alt="" width={48} height={48} />
          <span>
            SDC <b>Command</b>
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
        <Link href="/" className="auth-brand auth-brand-mobile">
          <img src="/brand/sdc-logo.png" alt="" width={40} height={40} />
          <span>
            SDC <b>Command</b>
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
