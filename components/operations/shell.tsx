"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Notifications } from "./notifications";
import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { ChevronsUpDown, LogOut, Menu, X } from "lucide-react";
import { homeFor, navFor, navGroups, navItems, roleLabels } from "@/lib/navigation";
import "./shell.css";
export type Membership = {
  id: string;
  tenant_id: string;
  role: string;
  display_name: string;
  tenants: { name: string; is_demo: boolean };
};
const Context = createContext<Membership | null>(null);
export const useWorkspace = () => useContext(Context)!;
const TENANT_KEY = "sdc.tenant";
export async function request(path: string, body?: unknown) {
  let r: Response;
  try {
    r = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Error("You appear to be offline. Check your connection and try again.");
  }
  // Resource-specific APIs validate every response field before mutations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let d: Record<string, any>;
  try {
    d = await r.json();
  } catch {
    throw Error(
      r.ok
        ? "The server sent an unexpected response."
        : `The service is unavailable right now (${r.status}). Please try again.`,
    );
  }
  if (!r.ok) throw Object.assign(Error(d.error || "Request failed"), { status: r.status });
  return d;
}
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "SD";
export function OperationsShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [members, setMembers] = useState<Membership[]>([]),
    [tenant, setTenant] = useState(""),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false),
    [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    request("/api/foundation/context")
      .then((d) => {
        const rows = d.memberships as Membership[];
        setMembers(rows);
        let saved = "";
        try {
          saved = localStorage.getItem(TENANT_KEY) || "";
        } catch {}
        setTenant(
          rows.find((m) => m.tenant_id === saved)?.tenant_id ||
            rows[0]?.tenant_id ||
            "",
        );
        if (!rows.length) setError("Your account needs a workspace assignment. Ask your administrator to add you.");
      })
      .catch((e: Error & { status?: number }) => {
        if (e.status === 401) {
          const next = window.location.pathname + window.location.search;
          window.location.replace("/login?next=" + encodeURIComponent(next));
          return;
        }
        setError(e.message);
      });
  }, []);
  const member = members.find((m) => m.tenant_id === tenant);
  const nav = navFor(member?.role);
  const current = navItems.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  );
  // Screens hidden from a role send that person to their own home screen.
  // Presentation only: every API still enforces the caller's role.
  const denied = !!member && !!current && !nav.some((n) => n.href === current.href);
  useEffect(() => {
    if (denied) window.location.replace(homeFor(member?.role));
  }, [denied, member?.role]);
  const chooseTenant = (id: string) => {
    setTenant(id);
    try {
      localStorage.setItem(TENANT_KEY, id);
    } catch {}
  };
  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      try {
        localStorage.removeItem(TENANT_KEY);
      } catch {}
      window.location.assign("/login");
    }
  };
  return (
    <div className="ops-app">
      <aside
        className={open ? "ops-sidebar is-open" : "ops-sidebar"}
        aria-label="Main navigation"
      >
        <div className="ops-sidebar-head">
          <Link className="ops-brand" href="/">
            <img src="/brand/sdc-logo.png" alt="" width={40} height={40} />
            <span>
              SDC <b>Command</b>
              <small>Connected operations</small>
            </span>
          </Link>
          <button
            className="ops-sidebar-close"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        {members.length > 1 ? (
          <label className="ops-workspace">
            <span>Workspace</span>
            <select
              value={tenant}
              onChange={(e) => chooseTenant(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.tenant_id}>
                  {m.tenants.name}
                </option>
              ))}
            </select>
            <ChevronsUpDown size={15} aria-hidden />
          </label>
        ) : (
          <div className="ops-workspace">
            <span>Workspace</span>
            <strong>{member?.tenants.name || " "}</strong>
          </div>
        )}
        <nav>
          {member
            ? navGroups.map((g) => {
                const items = nav.filter((n) => n.group === g);
                if (!items.length) return null;
                return (
                  <div className="ops-nav-group" key={g}>
                    <p>{g}</p>
                    {items.map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        onClick={() => setOpen(false)}
                        aria-current={current?.href === n.href ? "page" : undefined}
                      >
                        <n.icon size={18} strokeWidth={1.9} aria-hidden />
                        {n.label}
                      </Link>
                    ))}
                  </div>
                );
              })
            : Array.from({ length: 7 }, (_, i) => (
                <span key={i} className="ops-skeleton ops-nav-skeleton" />
              ))}
        </nav>
        <footer>
          <span className="ops-avatar" aria-hidden>
            {initials(member?.display_name || "")}
          </span>
          <div>
            <strong>{member?.display_name || " "}</strong>
            <small>{member ? roleLabels[member.role] || member.role : " "}</small>
          </div>
          <button
            className="ops-signout"
            onClick={signOut}
            disabled={signingOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </footer>
      </aside>
      {open && (
        <button
          className="ops-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="ops-content">
        <header className="ops-topbar">
          <button
            className="ops-menu"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <nav aria-label="Breadcrumb" className="ops-crumbs">
            <span>{current?.group || "Workspace"}</span>
            <b aria-hidden>/</b>
            <span aria-current="page">{title}</span>
          </nav>
          <div className="ops-topbar-actions">
            {member?.tenants.is_demo && (
              <span className="ops-demo">Demo data</span>
            )}
            {tenant && <Notifications tenant={tenant} />}
            {member && (
              <span className="ops-role">
                {roleLabels[member.role] || member.role}
              </span>
            )}
          </div>
        </header>
        <main id="main">
          <div className="ops-heading">
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {actions && <div className="ops-heading-actions">{actions}</div>}
          </div>
          {error ? (
            <div role="alert" className="ops-error">
              {error}
            </div>
          ) : member && !denied ? (
            <Context.Provider value={member}>{children}</Context.Provider>
          ) : (
            <div className="ops-loading" role="status" aria-label="Loading your workspace">
              <div className="ops-stats">
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={i} className="ops-skeleton" style={{ height: 104 }} />
                ))}
              </div>
              <span className="ops-skeleton" style={{ height: 320 }} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export const dateLabel = (v: string) =>
  v
    ? new Date(v.length === 10 ? v + "T00:00:00+05:30" : v).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        },
      )
    : "—";
