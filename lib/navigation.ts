import {
  Activity,
  BarChart3,
  Building2,
  CalendarRange,
  Cctv,
  Fingerprint,
  GraduationCap,
  LayoutDashboard,
  Landmark,
  Route,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

// One navigation model for every app screen. Hiding an item is presentation
// only; each API still enforces the caller's role and scopes.
export type Role =
  | "admin"
  | "operations_manager"
  | "senior_manager"
  | "site_lead"
  | "employee"
  | "hr_payroll"
  | "trainer"
  | "client_user";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Overview" | "Operations" | "People" | "Business";
  roles?: Role[];
  /** Label override for specific roles, e.g. a guard's roster. */
  labels?: Partial<Record<Role, string>>;
};

const managers: Role[] = ["admin", "operations_manager", "senior_manager"];

export const navItems: NavItem[] = [
  { href: "/control", label: "Command centre", icon: LayoutDashboard, group: "Overview", roles: [...managers, "site_lead", "hr_payroll", "trainer"] },
  { href: "/client-portal", label: "Client portal", icon: Landmark, group: "Overview", roles: ["client_user"] },
  { href: "/attendance", label: "My attendance", icon: Fingerprint, group: "Overview", roles: ["employee"] },
  { href: "/analytics", label: "Service analytics", icon: BarChart3, group: "Overview", roles: [...managers, "site_lead", "client_user"] },
  { href: "/deployment", label: "Deployment planner", icon: CalendarRange, group: "Operations", labels: { employee: "My roster" } },
  { href: "/operations", label: "Site operations", icon: Route, group: "Operations", labels: { employee: "Patrols & reports" } },
  { href: "/cctv", label: "Camera operations", icon: Cctv, group: "Operations", roles: [...managers, "site_lead", "client_user"] },
  { href: "/workspace", label: "Clients & sites", icon: Building2, group: "Operations", roles: [...managers, "site_lead", "hr_payroll", "client_user"] },
  { href: "/employees", label: "People & workforce", icon: Users, group: "People", roles: [...managers, "site_lead", "hr_payroll", "trainer", "employee"], labels: { employee: "My profile & leave" } },
  { href: "/training", label: "Training academy", icon: GraduationCap, group: "People" },
  { href: "/business", label: "Finance & compliance", icon: Activity, group: "Business", roles: ["admin", "hr_payroll", "client_user"] },
  { href: "/settings", label: "Settings & access", icon: Settings, group: "Business" },
];

export const navGroups = ["Overview", "Operations", "People", "Business"] as const;

export function navFor(role?: string) {
  return navItems
    .filter((n) => !n.roles || (role && n.roles.includes(role as Role)))
    .map((n) => ({ ...n, label: n.labels?.[role as Role] ?? n.label }));
}

/** Where each role lands after signing in. */
export function homeFor(role?: string) {
  switch (role) {
    case "employee":
      return "/attendance";
    case "client_user":
      return "/client-portal";
    case "trainer":
      return "/training";
    case "hr_payroll":
      return "/employees";
    default:
      return "/control";
  }
}

/** Accept only same-site relative paths as post-login destinations. */
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null;
}

export const roleLabels: Record<string, string> = {
  admin: "Super Admin",
  operations_manager: "Ops Manager",
  senior_manager: "Senior Manager",
  site_lead: "Field Supervisor",
  employee: "Guard / Employee",
  hr_payroll: "HR / Payroll",
  trainer: "Trainer",
  client_user: "Client User",
};
