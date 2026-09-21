# Employee workspace release

The employee workspace is implemented on the existing React/Vinext application, Supabase PostgreSQL/Auth/Storage and Railway deployment. It is reachable at `/employees` through **People & workforce** in the signed-in workspace.

## Implemented

- Paginated employee directory, name/ID search, status/category/site/client/grade filters, valid/expired certificate filters and a no-current-posting filter. The latter is a posting filter, not a shift-level availability guarantee.
- Thirteen profile sections: overview, personal/KYC, verification, identity cards, employment, deployments, attendance/leave, compensation, payslips, payments, training records, assets, documents.
- Encrypted personal/KYC and bank details using AES-256-GCM, masked reads and reason-required audited reveal. Protected values clear from the profile after two minutes.
- Verification records with expiry dates, employment events, effective postings with shift/supervisor/replacement references and feedback, equipment issue/return/recovery records, course/certificate outcomes.
- CR80 front/back ID-card PDFs, photo thumbnail, QR public verification, bulk card printing, revocation/reissue history. Exiting an employee revokes their cards, ends their postings and removes self-service access.
- Monthly attendance calendar, manual manager approval and overtime; annual leave entitlements and approved-leave balance checks. Online employee GPS/selfie check-in requires a current posting, configured site coordinates, a fresh own selfie and GPS position/accuracy inside the geofence. Check-out supports an open GPS check-in in the prior 24 hours. Managers approve records before payroll.
- Effective-dated compensation with wage floor checks and explicit reviewed deduction parameters. Payroll requires approved attendance for every employed day, prorates effective salary revisions by calendar days, snapshots salary and attendance values, calculates overtime and configured deductions, and versions corrections. Paid payslips cannot be replaced. Release requires reviewed rules and a completed month.
- Password-protected payslip PDFs, employee download and audited password retrieval, bulk payroll release, payment ledger/reconciliation flags, advance installment recovery, generic bank-advice Excel export. The export deducts amounts already paid and requires complete protected bank details; it does not submit a transfer to a bank.
- Private PDF/JPEG/PNG files up to 10 MB, immutable storage paths, retained document versions and expiry dates. Appointment letters use HR-entered reviewed terms and are saved in the document vault. Form 11, Form 2 and nomination records have dedicated upload categories; the UI links to the official EPFO Form 11 source.
- Excel template, validation preview and atomic new-employee import; no silent overwrite. Directory export excludes KYC and bank details.
- Admin linking of individually verified accounts to employee profiles. New account invitations are currently issued in Supabase Authentication, then activated and linked through the profile. No common guard password is introduced.
- 150 explicitly fictional employees with demonstration attendance, postings, salary records, verification, equipment and training records. The seed is idempotent and only writes to `SDC-DEMO`.

## Security and operational boundaries

Seventeen new tables use tenant-composite ownership, RLS and explicit grants. HR/Admin access protects personal, compensation and payment records. Operations roles cannot reveal KYC or read salaries. Site leads see attendance only for their own sites. Public card verification exposes only name, photograph, status and validity, behind a random card token. General operations audit stores revision metadata; a separate HR-only history retains full record revisions, with KYC remaining encrypted.

`SDC_EMPLOYEE_ENCRYPTION_KEY` is configured in Railway and never exposed to the browser or committed. Preserve this key in the company's secret backup process: changing it without a migration would make existing protected profiles and payslip passwords unreadable. The application runtime continues to use the Supabase publishable key with verified user sessions and RLS, not a service-role key.

Statutory rules are configurable inputs, not an asserted or automatically maintained Karnataka compliance engine. Demo rates are deliberately not approved for release. HR must supply applicable wage floors, deduction rates/amounts and source references. PT/LWF/TDS amounts are entered for the applicable effective period; automatic tax-slab maintenance and statutory filing are not included in this release.

GPS evidence from a browser is not proof against spoofing; this release does not perform face matching, device attestation or offline sync. Background expiry notifications, the training catalogue/assessment engine, certification-based roster blocking, live drag-and-drop roster/replacement planning, incident counts, risk portal and CCTV modules remain outside this employee release. Signed statutory forms are uploaded; they are not represented as electronically filed or signed by the app.

The Supabase security advisor flags the intentionally callable, authorization-checked RPC functions and the intentionally public minimal card-verification function. Existing Auth leaked-password protection remains an account-setting follow-up documented in the foundation release.

## Files

- `supabase/migrations/20260921134459_employee_workforce.sql`: employee schema, constraints, RLS, storage, history, payroll and online check-in.
- `supabase/migrations/20260921161838_employee_access_and_payroll_guards.sql`: posting references, verified account linking, consolidated policies and payroll release/lock ordering.
- `supabase/migrations/20260921162049_employee_self_service_labels.sql`: minimal own-grade and posting names without granting broad foundation access.
- `supabase/employee-seed.sql`: fictional employee seed.
- `app/employees/workforce.tsx`, `workforce.css`: responsive employee workspace.
- `app/api/employees/[resource]/route.ts`: employee records and transactional actions.
- `app/api/employee-files`, `employee-print`, `employee-exchange`, `employee-bulk`, `employee-letter`: documents/PDFs/import/export.
- `lib/employees`: schemas, field descriptors, encryption and PDF templates.
- `tests/employees/database.mjs`: database behavior and permission tests.

## Validation performed

- TypeScript compilation and production standalone build, followed by the same HTTP acceptance suite against the packaged production server.
- Runtime dependency audit: zero reported vulnerabilities after compatible transitive fixes. The build preserves nested runtime dependencies omitted by the current Vinext standalone copier.
- Employee-module ESLint: zero errors; framework recommendations for direct private images/full-page auth navigation remain warnings.
- Disposable PostgreSQL tests: client/outsider/self/HR/Ops/site-lead isolation, denied privilege changes, masked audit, protected history, own-site attendance, self-leave approval denial, leave entitlement, posting/salary overlaps, concurrent conflicting postings, complete-attendance requirement, exact payroll arithmetic, reviewed-rule release, immutable payslips/salary snapshots, no overpayment, paid-correction rejection, automatic card revocation, installment deduction/schedule immutability, GPS distance/ownership and fresh-selfie checks.
- Real connected HTTP tests using isolated disposable acceptance tenants: 150-person pagination/search; KYC encryption/reveal; photo upload; two-page card PDF; appointment PDF in Storage; 31-day payroll; encrypted payslip/password; bank-advice workbook; Excel preview/import; card-history preservation; linked employee self-service and cross-tenant denial.
- Browser checks at desktop and 390px mobile widths: authenticated directory, employee profile, attendance calendar, actions and responsive layout.

## How to review

1. Sign in as **Super Admin**, open **People & workforce**, search `DEMO-0001`, and inspect the profile tabs. All demonstration data is labelled fictional.
2. As **HR/Payroll**, edit protected details with a reason, upload a photograph, issue an ID card, download it and open its QR verification link. Revoke the card and confirm the public status changes.
3. In **Compensation**, use an approved policy appropriate to the intended test. August demo attendance is complete; generate a draft first. Release is blocked until rules are explicitly reviewed. Inspect the versioned payslip, password retrieval and payment ledger.
4. As **Operations Manager**, inspect postings, attendance, cards and assets. KYC/compensation/payment access is denied by the database, not just hidden controls.
5. As a linked **Employee**, view only the own profile/released payslips and request leave. With a real configured posting/geofence, take a selfie and check in; verify the record remains pending manager approval.

Database test command (disposable localhost DB only):

```sh
SDC_TEST_DATABASE_URL=postgres://sdc_test@127.0.0.1:55439/sdc_employees_v4 npm run test:employees
```

Create a fresh database with the foundation auth/storage fixtures and apply migrations in order before running it. Never run fixture SQL against Supabase.
