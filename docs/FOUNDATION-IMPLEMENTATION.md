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

Foundation code is prepared locally. Production Supabase migration, owner bootstrap and authenticated acceptance remain blocked by project access. GitHub push remains blocked while kishorraj-rgb has pull-only repository access. Railway release status is recorded separately after deployment verification. No later Phase 2 module should start until Foundation is demonstrated and accepted.
