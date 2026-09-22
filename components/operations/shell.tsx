"use client";
import Link from "next/link";
import { Notifications } from "./notifications";
import {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  CalendarDays,
  Building2,
  Menu,
  ArrowUpRight,
} from "lucide-react";
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
export async function request(path: string, body?: unknown) {
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  // Resource-specific APIs validate every response field before mutations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (await r.json()) as Record<string, any>;
  if (!r.ok) throw Error(d.error || "Request failed");
  return d;
}
export function OperationsShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [members, setMembers] = useState<Membership[]>([]),
    [tenant, setTenant] = useState(""),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false);
  useEffect(() => {
    request("/api/foundation/context")
      .then((d) => {
        setMembers(d.memberships);
        setTenant(d.memberships[0]?.tenant_id || "");
        if (!d.memberships.length)
          setError("Your account needs a workspace assignment.");
      })
      .catch((e) => setError(e.message));
  }, []);
  const member = members.find((m) => m.tenant_id === tenant);
  return (
    <div className="ops-app">
      <aside className={open ? "ops-sidebar is-open" : "ops-sidebar"}>
        <Link className="ops-brand" href="/">
          <img src="/brand/sdc-logo.png" alt="SDC" />
          <span>
            SDC <b>COMMAND</b>
            <small>CONNECTED OPERATIONS</small>
          </span>
        </Link>
        <div className="ops-workspace">
          <span>WORKSPACE</span>
          <select
            aria-label="Workspace"
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.tenant_id}>
                {m.tenants.name}
              </option>
            ))}
          </select>
        </div>
        <nav>
          {[
            { href: "/control", label: "Command centre", icon: ShieldCheck },
            { href: "/client-portal", label: "Client portal", icon: Building2 },
            {
              href: "/analytics",
              label: "Service analytics",
              icon: ShieldCheck,
            },
            { href: "/workspace", label: "Clients & sites", icon: Building2 },
            { href: "/employees", label: "People & workforce", icon: Users },
            { href: "/attendance", label: "My attendance", icon: CalendarDays },
            {
              href: "/training",
              label: "Training academy",
              icon: GraduationCap,
            },
            {
              href: "/deployment",
              label: "Deployment planner",
              icon: CalendarDays,
            },
            {
              href: "/operations",
              label: "Site operations",
              icon: ShieldCheck,
            },
            { href: "/cctv", label: "Camera operations", icon: ShieldCheck },
            {
              href: "/business",
              label: "Finance & compliance",
              icon: Building2,
            },
            {
              href: "/settings",
              label: "Settings & access",
              icon: ShieldCheck,
            },
          ]
            .filter((n) => {
              const role = member?.role;
              if (n.href === "/attendance") return role === "employee";
              if (n.href === "/business")
                return ["admin", "hr_payroll", "client_user"].includes(
                  role || "",
                );
              if (n.href === "/cctv")
                return [
                  "admin",
                  "operations_manager",
                  "senior_manager",
                  "site_lead",
                  "client_user",
                ].includes(role || "");
              if (n.href === "/client-portal") return role === "client_user";
              if (n.href === "/workspace")
                return role !== "employee" && role !== "trainer";
              return true;
            })
            .map((n) => (
              <a
                key={n.href}
                href={n.href}
                aria-current={
                  typeof window !== "undefined" &&
                  window.location.pathname === n.href
                    ? "page"
                    : undefined
                }
              >
                <n.icon size={20} />
                {n.label}
              </a>
            ))}
        </nav>
        <footer>
          <ShieldCheck size={23} />
          <strong>{member?.display_name || "SDC Command"}</strong>
          <span>{member?.role.replaceAll("_", " ")}</span>
          <a href="/workspace">
            Account & workspace <ArrowUpRight size={15} />
          </a>
        </footer>
      </aside>
      <div className="ops-content">
        <header className="ops-topbar">
          <button aria-label="Toggle navigation" onClick={() => setOpen(!open)}>
            <Menu size={22} />
          </button>
          <span>
            Workspace <b>/</b> {title}
          </span>
          {tenant && <Notifications tenant={tenant} />}
          <span className="ops-role">{member?.role.replaceAll("_", " ")}</span>
        </header>
        <main>
          <div className="ops-heading">
            <div>
              <p className="ops-eyebrow">SDC COMMAND / CONNECTED OPERATIONS</p>
              <h1>
                {title}
                <em>.</em>
              </h1>
              <p>{subtitle}</p>
            </div>
            {member?.tenants.is_demo && (
              <span className="ops-demo">FICTIONAL DEMONSTRATION</span>
            )}
          </div>
          {error ? (
            <div role="alert" className="ops-error">
              {error} <a href="/login">Sign in</a>
            </div>
          ) : member ? (
            <Context.Provider value={member}>{children}</Context.Provider>
          ) : (
            <p role="status">Loading your workspace…</p>
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
