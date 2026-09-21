# Phase 2 — existing-system audit

> Historical review: the later user-approved Railway/Supabase architecture supersedes the hosting, database and identity recommendations here. See [Foundation implementation](FOUNDATION-IMPLEMENTATION.md).

Status: review only. Audited on 21 September 2026. No feature code, migration, production data change or deployment is part of this step.

## Scope and evidence

Inspected the application source, package manifest, Drizzle schema/migration, local SQLite schema, auth adapter, development auth middleware, operations API, deployment rules, UI and tests in `/Users/kishorraj/Developer/SDC`. This is a source and local-schema audit, not a penetration test or an inspection of live personnel records. Production table contents were not queried. The supplied Phase 2 brief is the instruction for this work; older brochures and screenshots remain reference material.

## Stack to retain

| Layer | Current implementation | Phase 2 treatment |
|---|---|---|
| Application | React 19.2.6, TypeScript 5.9.3; Next-compatible App Router through Vinext 1.0.0-beta.5 and Vite 8.0.13; Next package 16.3.4 | Retain framework, routing and Worker target |
| Hosting | Existing private Sites project, Cloudflare Worker build; `.openai/hosting.json` | Retain; do not expose real personnel records by changing site sharing |
| Database | Cloudflare D1, SQLite semantics, binding `DB` | Propose normalized tables in the existing database |
| Database access | `lib/db.ts` exposes raw D1; `db/index.ts` also has Drizzle D1 wrapper; Drizzle ORM 0.45.2 and Kit 0.31.10 installed | Consolidate production access behind one authorized repository layer using the existing Drizzle stack |
| Authentication | Sites Sign in with ChatGPT, identity read by `app/chatgpt-auth.ts` from trusted hosting headers | Keep identity provider; add server-owned memberships and permissions, not a second login system |
| UI | Existing shadcn components; Radix/Base UI dependencies; Tailwind CSS 4.2.1; custom CSS; Lucide icons; Sonner notifications | Reuse existing components and SDC navy/yellow branding |
| Validation | Zod 3.25.76 API input schemas, TypeScript strict mode | Extend per-resource request/response schemas |
| Forms and charts | React Hook Form, Recharts and date-fns installed; current forms mostly controlled React state | Reuse when needed; no new UI kit |
| Persistence | One owner-scoped JSON state row with optimistic integer version | Preserve as legacy source while introducing normalized records |
| Assets | Files under `public/`; supplied SDC crest in `public/brand/sdc-logo.png`; `r2: null` | Add private object storage only after schema approval; no KYC in `public/` |
| Integrations | No configured SMS, WhatsApp, CCTV gateway, payroll bank API, map service or OCR | Explicit adapter contracts and working mocks for their respective modules |

Versions above are from this checkout's package manifest, not claims about latest upstream versions.

## Folder and naming conventions

| Full path | Current responsibility |
|---|---|
| `/Users/kishorraj/Developer/SDC/app/page.tsx` | Public marketing website |
| `/Users/kishorraj/Developer/SDC/app/layout.tsx` | Shared metadata and global stylesheet |
| `/Users/kishorraj/Developer/SDC/app/globals.css` | Public and command-centre styling; navy/yellow brand |
| `/Users/kishorraj/Developer/SDC/app/chatgpt-auth.ts` | Existing identity adapter, sign-in/out URLs and safe return paths |
| `/Users/kishorraj/Developer/SDC/app/command/page.tsx` | Authenticated command route |
| `/Users/kishorraj/Developer/SDC/app/command/workspace.tsx` | Navigation, role previews, employees, duties, attendance, incidents, leave and reports |
| `/Users/kishorraj/Developer/SDC/app/command/deployment-board.tsx` | Weekly planner, personnel pool, moves/swaps, gaps and publication history |
| `/Users/kishorraj/Developer/SDC/app/api/operations/route.ts` | Current GET/POST demo API, input validation, preview-role mutation rules, version checks |
| `/Users/kishorraj/Developer/SDC/lib/demo.ts` | Domain types and fictional seed data |
| `/Users/kishorraj/Developer/SDC/lib/deployment.ts` | Draft/publication and scheduling validation |
| `/Users/kishorraj/Developer/SDC/lib/db.ts` | Active raw D1 accessor |
| `/Users/kishorraj/Developer/SDC/db/index.ts` | Installed Drizzle accessor |
| `/Users/kishorraj/Developer/SDC/db/schema.ts` | One application table definition |
| `/Users/kishorraj/Developer/SDC/drizzle/0000_moaning_whirlwind.sql` | Existing initial migration |
| `/Users/kishorraj/Developer/SDC/components/ui/` | Existing shared UI components |
| `/Users/kishorraj/Developer/SDC/hooks/` | Shared hooks |
| `/Users/kishorraj/Developer/SDC/tests/` | Node assertion tests for operations and deployment |
| `/Users/kishorraj/Developer/SDC/docs/CLIENT-WALKTHROUGH.md` | Existing client demonstration and limitations |
| `/Users/kishorraj/Developer/SDC/build/sites-vite-plugin.ts` | Local development auth shim and Sites integration |
| `/Users/kishorraj/Developer/SDC/.openai/hosting.json` | Existing project and runtime binding manifest |
| `/Users/kishorraj/Developer/SDC/examples/` | Starter examples, excluded from TS application compilation; not deployed business modules |

Files use kebab-case, React components and TypeScript types PascalCase, JS properties camelCase, SQL tables/columns snake_case, and `@/` imports rooted at the project. IDs include human-readable employee codes (`SDC-0101`) and generated UUIDs for newer operational records. Phase 2 will keep human codes as business identifiers and use immutable UUID keys for relations. UI currently uses English labels and mixed date formatting; uniform DD-MM-YYYY is new work.

## Actual database today

Only one application table is declared in source and present in the inspected local database:

| Table | Columns | Keys/indexes |
|---|---|---|
| `demo_workspaces` | `owner TEXT NOT NULL`, `state TEXT NOT NULL`, `version INTEGER NOT NULL DEFAULT 0` | Primary key `owner`; no application secondary indexes or foreign keys |

The local database also has Cloudflare's `_cf_METADATA` infrastructure table. It is not an application table and will not be modified.

`state` is JSON containing employees, duties, incidents, leaves, audit events, deployment drafts and roster publications. These are arrays, not independent SQL tables. Sites and shifts are constants; posts are three defaults plus names found in duties. There is no Client entity or explicit staffing requirement. Existing coverage gaps assume one person per post per shift, three shifts and seven days.

The source seed contains 12 fictional employees, three sites, ten duties on 21 September 2026, three incidents and two pending leave requests. It is not the requested 150-person monthly dataset. Mutable demo workspaces may differ from the seed.

## Roles and identity today

| Current preview | Implemented access | Proposed identity-preserving mapping |
|---|---|---|
| Admin | Employee creation and all demo operational mutations | Super Admin display label, stable `admin` role key |
| Operations Manager | Roster, deployment, attendance, incidents and leave | Ops Manager label, stable `operations_manager` key |
| Senior Manager | Similar operational preview; no employee creation | Retain `senior_manager` with approved operational permissions; do not silently promote to Super Admin |
| Site Lead | Attendance/incident mutations restricted to the hard-coded Northstar site; deployment view-only | Field Supervisor label, stable `site_lead` key; actual assigned-site scope |
| Employee | Hard-coded self-service demonstration for SDC-0101 | Guard / Employee label, stable `employee` key and verified identity-to-employee link |
| Not present | No HR, Trainer or Client roles | Add `hr_payroll`, `trainer`, `client_user` |

The browser sends the selected preview role to the API. That is intentional for an owner-private demo, but it is not production authorization. GET returns the entire owner's state. Site and employee visibility are primarily filtered in the UI; a preview role does not limit the returned data.

Owner separation is currently enforced by the authenticated `userId` in the database key. The production auth adapter assumes hosting supplies trusted identity headers. Local development middleware strips incoming identity headers and supports a loopback-only mock sign-in cookie. Phase 2 must preserve this boundary, deny unmapped/inactive memberships and never accept a browser-supplied role or tenant as authority. No employee password table or shared password exists in this checkout.

## Working features to preserve

- Public website and supplied branding.
- Saved demo employees, roster assignments and reviewed CSV imports.
- Attendance status, incident report/resolve, leave approval/decline and CSV reports.
- Weekly deployment by site and shift, personnel selection and drag/drop, assignment moves/swaps, gap queue, persistent drafts, publication snapshots and discard.
- Deployment checks for occupied slots, one duty per employee/date, eight-hour rest, approved leave and attendance locks; publication rejects stale roster fingerprints.
- Anonymous API rejection, selected-role mutation restrictions, site-lead mutation scoping and optimistic version checks.

## Material gaps before Phase 2

1. Normalized, indexed records and stable client/site/post/shift IDs are absent. Loading and rewriting all state will not meet the intended 5,000-employee / 300-site usage pattern.
2. Staff memberships, per-client/site read scopes, field permissions and individual identity links are absent. Client and payroll access must not be added to the existing whole-state GET.
3. Generic assignment/CSV paths have fewer checks than deployment publication. All future assignment entry points need the same policy engine and atomic conflict protection.
4. Draft changes, sensitive reads and exports do not have complete audit coverage. Existing audit entries generally identify a preview role rather than a real staff actor.
5. Employee records are minimal; training is a label, not certifications. Payroll, payments, documents, risk surveys, CCTV consent, geofencing and notifications are not implemented.
6. Lists filter in the browser without server pagination. No current scale benchmark establishes the target capacity.
7. There is no private upload vault, encrypted sensitive-field design, document expiry workflow, scheduler or delivery outbox.
8. Existing employee self-service always selects the fictional SDC-0101 identity. It must become membership-linked before multi-user use.

## Baseline validation and boundaries

The existing pure deployment tests and TypeScript checks were run for this audit. No API tests that mutate fictional data were rerun, no migration was applied and no source feature changes were made. The Phase 2 proposal includes new isolation, migration and scale acceptance tests; passing today's demo tests does not establish production readiness.

The next deliverable, after approval, is the Clients → Sites → Posts → Shifts foundation plus the access/audit/storage primitives needed to make that module safe. Employee/payroll, training and later module implementations each retain a separate review gate.
