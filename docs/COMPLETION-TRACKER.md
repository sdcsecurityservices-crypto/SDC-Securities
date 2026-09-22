# SDC Command release tracker — 22 September 2026

Latest authorization: build all remaining requested features through readiness, without the earlier per-module pauses. Keep the existing React/Vinext, Supabase Auth/Postgres/Storage and Railway architecture.

## Current release state

The multi-tenant React/Vinext application is implemented on Supabase Postgres/Auth/Storage and Railway. New modules use database scopes and role checks; the demo tenant is explicitly fictional.

Implemented roles: Super Admin/Admin, Operations Manager/Senior Manager, HR/Payroll, Trainer, Site Lead/Field Supervisor, Guard/Employee and Client User. Their scoped screens cover command centre, clients/sites, people, training, deployment, field operations, cameras, finance, analytics, access administration and self-service attendance.

Training, roster publication, site risk and field operations, consent-gated CCTV, employee/payroll foundation, billing/compliance/recruitment, notifications, offline attendance, settings/access, service analytics, shared PDFs and QR verification are implemented. The local PostgreSQL suite covers tenant isolation, role access, concurrency, grading, publication, evidence, CCTV revocation and billing controls. Signed-in HTTP smoke tests cover new routes and role boundaries. The production build succeeds. Production migrations through `20260921182636` are applied to Supabase.

## Launch dependencies

Live email/SMS/WhatsApp delivery needs a provider endpoint/key. Live CCTV needs the client’s HTTPS media gateway. Camera fixtures are synthetic canvas streams with consent PDFs labelled demonstration documents. Face matching, device attestation, NFC and native anti-spoofing require a reviewed mobile provider; the PWA records GPS/selfie evidence and manager approval without claiming biometric verification. Invoice issuance needs the real legal name, GSTIN, billing address and SAC/rate policy in Workspace Settings.

## Build sequence and release gates

- Foundation and employee modules: existing, regression checks required.
- Training: in progress — catalogue, sessions, practical attendance, randomized assessments, awards/verification/PDF, compliance matrix, prerequisites and post requirements.
- Availability and deployment: pending — normalized roster, conflicts/rest/weekly hours/leave/training checks, drag/drop, replacements, publish/copy, calendar, notifications/muster.
- Site risk/client portal: pending — surveys, workflow/sign-off, evidence, scoring, reports.
- CCTV: pending — written consent, encrypted registry, mapped posts, signed view sessions, access audit, mock gateway.
- Field operations: pending — offline attendance, patrol, incidents, SOS, occurrence book, gate passes.
- Finance/compliance: pending — approved-muster invoicing, credit notes, payments/ageing, compliance due dates/documents.
- Management: pending — SLA reports, site audits, recruitment conversion, performance, notifications, command map, access administration/audit/retention.
- External integrations: explicit mock vs configured modes; never claim delivery, face verification or camera connectivity without configured providers and an acceptance check.
- Final gate: database isolation/concurrency, HTTP workflows, mobile/desktop, production build, dependency audit and live deployment.

## Schema continuation

The earlier comprehensive logical proposal is retained; PostgreSQL replaces its historical D1 types. New tables use existing UUID tenant composite foreign keys, existing role keys, RLS and audit functions. Training adds courses, sessions, enrollments, private question bank/attempts, issued awards, post requirements. Later migrations add roster/publications, risk surveys/findings/events, CCTV consent/cameras/view sessions, field-operation ledgers, billing/compliance/recruitment and notification outbox. No employee sensitive data is copied to public modules.
