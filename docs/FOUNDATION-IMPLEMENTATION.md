# Foundation implementation — 21 September 2026

## Accepted architecture

The user's Railway + Supabase + GitHub selection supersedes the hosting, database and authentication recommendations in the earlier Phase 2 proposal. React/TypeScript and the existing SDC visual identity are retained. Railway runs the standalone Node server; Supabase provides PostgreSQL, Auth and private Storage. GitHub is the intended source repository: sdcsecurityservices-crypto/SDC-Securities.

The browser calls same-origin API handlers. Handlers verify Supabase identity and use the caller's JWT for database/storage access, so row-level security remains active. No service-role key is used by the application. Roles and scopes are stored in database memberships rather than user-editable metadata. Cookie sessions are HTTP-only; production cookies are secure. Write endpoints check Origin. Railway needs APP_URL, SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. Do not commit credentials.

## Implemented scope

Foundation only: client, site, post, shift template, grade, staffing requirement, contract and rate-card forms. Includes geography and emergency contacts, search, pagination, detail views, archive dependency checks, optimistic concurrency, scoped access, audit events and private client/site documents. Admins, operations managers and senior managers can edit; client and site access follows assigned scopes. Foundation does not provision employee accounts or implement the later employee/training/roster modules.

`supabase/migrations/` is the canonical PostgreSQL schema and access-policy history. Existing `db/schema.ts`, `drizzle.config.ts` and `drizzle/` describe only the legacy Sites/D1 demo; do not use `db:generate` to change PostgreSQL. Legacy Sites builds require SDC_RUNTIME=sites. The Railway runtime disables the old ChatGPT-header identity adapter.

## Setup sequence

1. Obtain access to the exact Supabase project habxdzjfefvwxuyqngqr. Inspect existing tables and migration history before applying the two additive migration files; stop on conflicting existing objects rather than dropping them.
2. Apply Foundation then Foundation Storage migrations. Run Supabase security advisors and resolve relevant findings. The storage bucket is private.
3. Configure the Railway service's Supabase publishable key through its environment variable store. Confirm Supabase Auth site/redirect URLs match the deployed origin. Disable public signup unless subsequently required.
4. Create a verified first administrator identity through the approved Supabase Auth onboarding flow. There is no automatic first-user-admin path and no shared default password.
5. To create the fictional demonstration workspace, run `npm run seed:foundation` with DATABASE_URL and SDC_BOOTSTRAP_EMAIL supplied securely. The email must already belong to a verified Auth user. The idempotent seed creates 3 fictional clients, 8 sites, 40 posts, 120 requirements and illustrative contracts/rates. It does not import staff or payroll records.
6. Verify real sign-in/out, refresh, role-scoped CRUD, uploads/downloads and concurrent edits against Supabase before operational use.

## Verification completed locally

- TypeScript checking and standalone production build.
- Disposable PostgreSQL tests: seed counts and idempotency, client/site/employee/outsider row isolation, cross-tenant foreign keys, denied role escalation, immutable audit, archive dependencies, duplicate staffing requirements, stale revisions, simultaneous updates and revoked memberships.
- Browser check of branded sign-in page; health and missing-configuration API behavior.

Tests use a local auth fixture, not live Supabase Auth. Storage policies require verification against Supabase's actual storage service. Full authenticated browser acceptance is pending account access. Uploads validate size, MIME type and signature; malware scanning and document revision workflows are not implemented. The health endpoint is process liveness, not a claim that database configuration is complete.

## Release status

Foundation is deployed and connected to the specified Supabase project. GitHub main is pushed and connected as the Railway deployment source. The SDC administrator invitation has been prepared locally for sdc.securityservices@gmail.com; the account holder must choose a password through the private activation link. No later Phase 2 module should start until Foundation is demonstrated and accepted.

Local storage policy fixture testing also passed: unscoped users cannot read/write objects, and an operator can clean up an upload whose metadata insertion failed. Cross-origin login submission returns 403. See tests/foundation/README.md for reproducible database checks.

## Railway release

Release `8a37011e-d8a2-4a8f-a228-f4c3bb90b8c1` reached SUCCESS in Singapore on 21 September 2026. Public URL: https://sdc-command-production-ec49.up.railway.app . Project: a8de7007-fb58-4fa1-8861-2d3ca230061e; production environment: c41618c9-6833-4f73-8bbc-8cdad07398a2; service: b7adb2bc-8882-487a-8123-3715c791b092. The release contains foundation code at commit 7d028e6. Subsequent commits only add verification/release documentation.

This release deliberately returns NOT_CONFIGURED for workspace APIs until the Supabase publishable key and database migrations are in place. Deployment success is not Foundation operational acceptance.

## Connected release and live acceptance — 21 September 2026

Railway deployment `2cb48907-1dc7-4096-abe2-45bbc8f3fb04` reached SUCCESS from GitHub commit `33907c21d284561ef64b2937edb64902b73e28bc`. Three Supabase migrations are applied; all 13 public foundation tables have RLS. The private document bucket is configured. Seeded 3 fictional clients, 8 sites, 40 posts, 4 shift templates and 120 staffing requirements. `supabase/seed.sql` supports data seeding through project-scoped MCP without database passwords.

Live acceptance passed: real Supabase password login, HTTP-only session cookies, logout, membership loading, administrator/client/employee data isolation, employee write rejection, joined site queries, client creation/update, stale-write rejection, audit entries, private PDF upload and signed download. Single-use invitation activation succeeded and replay was rejected. The authenticated workspace rendered in a real browser without recorded JavaScript errors. Temporary test users, memberships, client and document were removed; their audit history remains.

The administrator invitation is in ignored local `outputs/SDC-admin-activation.html` with owner-only filesystem permissions. Its token is in a URL fragment and is removed from browser history on page load. It is never committed, emailed automatically or stored in Railway variables. Only the Supabase publishable key is configured in the application runtime. Server administration credentials were used in memory for setup/tests.

### Remaining Auth hardening before real personnel rollout

Supabase's security advisor reports leaked-password protection disabled. Its authenticated SECURITY DEFINER warning for `audit_document_access` is intentional: this narrow function verifies auth.uid and document visibility before recording a download-link event; ordinary clients cannot insert arbitrary audit records. Supabase's bootstrap event-trigger execute grants were restricted in migration 3.

The OAuth grant can administer database and keys but the Auth-configuration API rejects requests for lack of `auth_config_read`; therefore public-signup and project-level password policy settings were not changed or verified. Application activation requires at least 12 characters, exposes no self-signup form and grants no workspace membership to new unaffiliated Auth users. Configure invitation-only signup, the production Auth site URL and leaked-password protection in Supabase before live staff onboarding. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .

Earlier sections recording pending integration describe the initial release; this connected-release section supersedes those status notes.
