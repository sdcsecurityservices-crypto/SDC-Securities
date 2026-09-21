# Phase 2 — consolidated schema proposal for approval

> Historical review: the later user-approved Railway/Supabase architecture supersedes the hosting, database and identity recommendations here. See [Foundation implementation](FOUNDATION-IMPLEMENTATION.md).

Status: PROPOSED, NOT APPLIED. Date: 21 September 2026.

This is a single logical schema diff covering all requested core modules and the additional features. It is not an executable migration and contains no feature implementation. After approval, each module gets complete executable migrations, backend, UI, seeds and tests, then stops for review. Future-module tables described here are introduced with their module, not all at once.

Companion audit: `/Users/kishorraj/Developer/SDC/docs/PHASE-2-AUDIT.md`.

## 1. Architecture decisions proposed for approval

1. Retain React/Vinext/TypeScript, existing shadcn components, Cloudflare D1 and Drizzle. Replace JSON operational storage incrementally with normalized, indexed tables. Keep `demo_workspaces` unchanged as a migration source and recovery record.
2. Retain Sign in with ChatGPT. Add server-owned users, tenant memberships, roles and scopes. No parallel password/OTP authentication. Staff and clients will need identities supported by the existing sign-in method; a different workforce login experience would require a separately approved auth decision.
3. One tenant represents the security agency, not a client. Clients and sites belong to the agency. Client users receive explicit client/site grants. Supervisors receive explicit site grants. This permits cross-client agency deployment while keeping client visibility separate.
4. Preserve existing role keys through label mappings described below. The current demo owner becomes the initial Super Admin only through explicit bootstrap mapping, never through a request's chosen preview role.
5. Use a mandatory server-side authorization/repository policy layer for every query, download, aggregate, search, background task and export. Use database foreign keys, constraints and triggers for relational integrity. This is **not native database row-level security**: the existing SQLite/D1 connection has broad access. If the requirement means the database itself must restrict every SELECT even from arbitrary application SQL, approve a database architecture change before implementation. This proposal interprets “database/policy layer” as a mandatory server policy layer, not UI filtering.
6. Add a private object-store binding for encrypted documents and generated files, with authorized delivery. Add a durable notification/job outbox; mock external delivery during demonstrations. Live integrations are enabled only after credentials and acceptance tests.
7. Payroll/statutory rules are jurisdiction-specific, effective-dated, versioned and approved configuration. Do not hard-code current PF/ESI/PT/LWF/minimum-wage values from memory or treat a draft ruleset as legally approved.

D1 uses SQLite semantics, supports enforced foreign keys, and provides transactional statement batches. These are the basis of the proposal, not a claim that D1 supports PostgreSQL-style policies. Sources: [D1 overview](https://developers.cloudflare.com/d1/), [foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/), [transactional batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/), [SQLite authorization limitations](https://www.sqlite.org/omitted.html).

## 2. Schema conventions shared by every module

The table dictionaries below list business columns. `?` means nullable; other nullability is resolved by the stated lifecycle (for example, an unissued document has no issued timestamp). Global `users` and the tenant root are exceptions to tenant-owned keys. Membership `user_id` references the global user key; every business actor references a tenant membership. The following common columns, relations and indexes are part of the proposal, not omitted implementation work.

- Ordinary tenant entities: `id TEXT` UUID, `tenant_id TEXT`, `created_at TEXT` UTC instant, `created_by TEXT` membership ID, `updated_at TEXT`, `updated_by TEXT`, `row_version INTEGER DEFAULT 0`, `deleted_at TEXT NULL`, `deleted_by TEXT NULL`. Composite primary key `(tenant_id,id)`; FK `tenant_id → tenants.id`; actor FKs remain within the same tenant. Bootstrap actors may be null with an explicit system origin.
- Append-only events, ledgers, published versions, acknowledgements and audit rows: UUID, tenant, timestamp and actor; no user-editable update/delete. Correction is a new event or reversal. Retention deletion is a separate audited policy process, not a UI soft-delete that rewrites history.
- All business relations use `(tenant_id,parent_id)` composite foreign keys, with `ON DELETE RESTRICT`. Every FK has an index beginning with tenant and foreign-key columns. Join tables use unique `(tenant_id,left_id,right_id)` unless effective dates or versioning are part of the key.
- Where a child repeats `client_id`, `site_id` or `employee_id` for scope or performance, a composite FK references the corresponding unique parent tuple, preventing mismatched ownership. Example: `(tenant_id,client_id,site_id)` references `sites(tenant_id,client_id,id)`. Tenant matching alone does not prove site/client matching.
- `TEXT` is used for IDs, codes, strings, ISO dates and UTC instants. `INTEGER` for booleans (CHECK 0/1), counts, minutes, money in paise and ratios in basis points. `REAL` only for coordinates/physical measurements, never payroll money. Date fields are strict ISO `YYYY-MM-DD`; schedules resolve to UTC instants with a retained IANA zone, default `Asia/Kolkata`. Display DD-MM-YYYY and Indian INR grouping.
- State/category columns have CHECK constraints matching approved enums. `end > start`, nonnegative counts/money where appropriate, validity bounds and percentage ranges are checked. Effective intervals are half-open `[from,to)` with nullable `to`; overlapping active versions are rejected transactionally.
- A `J` column in the dictionary is validated JSON TEXT with `json_valid` CHECK: versioned configuration, answers, geometry or immutable snapshots only. Repeated searchable operational facts get rows, not JSON arrays.
- An `E` column is an encrypted envelope: ciphertext, nonce, key version, algorithm and authenticated context; it may be stored as validated JSON, but is never exposed in list DTOs. AES-GCM envelopes use fresh nonces and tenant/entity/field-bound associated data. Keys are in managed secrets/KMS, never database rows; rotation is versioned. Masked display values are stored separately only when needed. Reveal events log field names and reason, never plaintext.
- Active human codes get partial unique indexes `WHERE deleted_at IS NULL`; do not reuse employee, certificate, invoice or identity-card serial numbers after deactivation. Every list supports bounded keyset pagination (default 50, maximum 100), deterministic ID tie-breakers and scoped search.
- A generic business `record_registry(tenant_id,id,kind,client_id?,site_id?,employee_id?)` is proposed for audited subjects, attachments and notifications. Each registered subject has a matching module row; creation is atomic. Subtype mismatches are rejected by policy and integrity checks. This avoids dangling free-form attachment IDs. Access to a registry row alone does not authorize its subject.
- Published operational and financial history retains its reference to the exact requirement/course/pay/consent/rule version used at the time.

## 3. Consolidated additions — access, documents and shared infrastructure

| Proposed table | Business columns and relations | Specific keys/indexes/invariants |
|---|---|---|
| `tenants` | `id`, agency legal/display name, timezone, currency, status, bootstrap owner subject, created/updated timestamps | Unique agency code; default IST/INR; own-table PK exception |
| `users` | `id`, auth provider, provider subject, display name, email, status, last sign-in | Unique `(auth_provider,provider_subject)`; global identity only, no employee KYC |
| `memberships` | user → users, status, effective from/to, revoked at, authorization version | Unique active tenant/user; no implicit membership from matching email |
| `roles`, `permissions`, `role_permissions` | Stable role key/display name; permission key; role→permission link | Unique tenant/key; deny unspecified actions |
| `member_role_grants` | membership, role, scope kind (`agency/client/site/self`), client/site/employee targets, effective from/to | CHECK exactly one valid target shape; indexed membership/active dates; server assigned |
| `invitations` | invited email, target role/scope, token hash, expiry, redeemed user/time, revoked at | Unique token hash; one-time claim matched to verified identity; no password storage |
| `record_registry` | Subject kind and scope columns described above | PK tenant/id; indexes client/kind and site/kind |
| `audit_events` | actor, action, subject registry ID, request ID, timestamp, result, reason, redacted before/after J, trusted source-IP envelope E, origin (`human/system/import`) | Index tenant/time/id; subject/time; actor/time. Append-only; privileged reveals and denied accesses included |
| `documents` | registry subject, category, classification, current version, expiry, retention class, legal hold, status | Subject/category; expiry/status; download reauthorizes subject |
| `document_versions` | document, revision, private object key, MIME, bytes, SHA-256, upload actor, malware-scan status, encryption key version | Unique document/revision; only clean versions served; prior versions immutable |
| `document_templates` | kind, revision, language, SDC brand asset version, validated template definition J, page size, status | Unique kind/revision/language; one shared renderer for CR80 cards, certificates, payslips, risk reports and invoices |
| `generated_documents` | subject, template/version, immutable input hash, source revision, private output document-version ID, issued/revoked at | Idempotency key per tenant; never regenerate history from mutable present-day fields |
| `public_verification_tokens` | subject, token hash, purpose (`employee_card/certificate`), expiry, revoked at, allowed projection version | Unique opaque token; minimal public projection only; no sequential-ID enumeration |
| `outbox_events` | subject, event type, payload J with minimum necessary data, dedupe key, available at, attempts, state, lease owner/until | Unique dedupe key; state/available-at index; committed with domain mutation |
| `scheduled_jobs` | kind, subject, due at, timezone, unique occurrence key, lease, attempts, state, last error code | Unique occurrence; due/state; reminder/escalation processing is retry-safe |
| `notification_templates`, `notification_preferences` | Event/channel/language/version/body; membership/event/channel enabled and quiet hours | Unique template key/version and preference tuple; required emergency channels cannot be silently disabled |
| `notification_deliveries` | outbox event, recipient membership/contact, channel, template version, provider reference, status, sent/delivered/failed time, retry count, mock flag | Unique event/recipient/channel; no mock labelled delivered by a real provider |
| `policy_versions` | policy kind, jurisdiction, revision, effective from/to, schema version, settings J, source document, approval actor/time | Unique kind/jurisdiction/revision; no executable code in policy JSON; historical versions retained |
| `retention_policies`, `privacy_requests` | Data class, retention/anonymisation/legal-hold rules; requester, request type, affected subject, workflow/deadlines | Policy class/effective dates; request status/due date |
| `import_jobs`, `import_rows`, `export_jobs` | Format, private input/output document, idempotency key, counters, errors; staged row number/payload E or J/validation errors; export scope snapshot and expiry | Unique import/row; dedupe import key; bounded chunk processing; exports are authorized and audited |
| `legacy_import_runs`, `legacy_id_map` | Source owner/version/hash, status/counts; old collection/key → new registry ID, revision | Unique source owner/version; unique owner/collection/old-key; preserve source identifiers |

Roles retain current keys with new display names: `admin` → Super Admin, `operations_manager` → Ops Manager, `site_lead` → Field Supervisor, `employee` → Guard / Employee. Keep `senior_manager`. Add `hr_payroll`, `trainer`, `client_user`. No duplicate `super_admin` or `ops_manager` role is introduced alongside equivalent existing keys.

Membership and role reads occur before every policy-controlled operation. Super Admin is agency-wide, not cross-tenant. HR can reveal/payroll only with explicit permission; Ops sees deployment-safe employee fields. Trainers get assigned learners and assessments, not bank/KYC data. Field Supervisors see assigned sites only. Employee self-service resolves employee ID from server-owned grants. Client users get approved site summaries, findings, incidents and invoices, never agency payroll or unrelated staff profiles.

## 4. Foundation — Clients → Sites → Posts → Shifts

| Proposed table | Business columns and relations | Specific keys/indexes/invariants |
|---|---|---|
| `clients` | code, legal/trade name, GSTIN/PAN encrypted with masked display, billing address J, billing cycle, status | Unique code; legal-name search key/status/id |
| `client_contacts` | client, name, job title, email, encrypted phone, escalation priority, portal membership if invited | Client/priority; membership does not itself imply site access |
| `contracts`, `contract_versions` | client, contract number; effective from/to, signed document version, billing cycle, SLA J, penalty J, approval | Unique client/number; version/effective indexes; executed versions immutable |
| `grades` | code, name, rank, description, active | Unique code; role rank is separate from access role |
| `rate_card_lines` | contract version, grade, site optional, charge unit, amount paise, overtime/holiday amounts, tax classification, effective from/to | Contract/site/grade/effective range; no ambiguous overlapping lines |
| `escalation_rules` | client/site, event class, sequence, delay minutes, contact/member, channel, effective range | Unique scope/event/sequence/version; positive escalation delay |
| `sites` | client, contract, code/name/type, address J, latitude/longitude, geofence metres, timezone, status, start/end dates | Unique client/code; unique client/id composite; client/status/name indexes; geofence > 0 |
| `site_floor_plans` | site, document version, label, floor, revision, coordinate-system metadata J | Site/floor/revision; camera and finding pins reference an exact version |
| `site_contacts` | site, type (`police/fire/hospital/emergency`), name, encrypted phone, address J, coordinates | Site/type; emergency display permission separated from KYC |
| `site_sop_versions` | site, revision, document version, effective dates, required acknowledgement | Unique site/revision; acknowledgement references exact version |
| `posts` | site, code/name, description, required grade, location lat/lon or floor-plan/x/y, active from/to | Unique site/code; site/active indexes; floor-plan belongs to same site |
| `shift_templates` | code/name, local start time, duration minutes, unpaid break minutes, overnight flag, effective dates | Unique code/version; configurable 8h/12h without assuming 12h is legally approved |
| `staffing_requirements` | post, shift template, grade, headcount, weekday mask, effective from/to, holiday calendar, requirement version | Post/shift/effective indexes; no overlapping requirement versions for the same staffing band |
| `requirement_exceptions` | staffing requirement, service date, headcount override, reason, approval | Unique requirement/date; explicit zero requirement distinguishes closed/no-service days |
| `holiday_calendars`, `holiday_dates` | jurisdiction/client calendar; date, holiday kind, pay/billing policy reference | Unique calendar/date/kind; holiday overrides are versioned |

Post course requirements arrive with Training, referencing these stable post IDs. Contract files, floor plans and SOPs use shared private documents. The foundation seeds the requested three fictional clients, eight sites and forty posts; the remaining seed modules are added only at their approved build step.

## 5. Employees, attendance, compensation, payslips and payments

| Proposed table | Business columns and relations | Specific keys/indexes/invariants |
|---|---|---|
| `employees` | employee code, full/display name, photo document, grade, category (`trainee/full_time/reliever/contract`), status, joined/exited dates, reporting employee, home-base site, linked membership | Unique code; unique active linked membership; name search/status/grade; site is not the historical posting source |
| `employee_private_profiles` | employee, DOB, blood group, physical measurements, current/permanent address, languages, education, ex-service details and nominee/family details E | One per employee; restricted HR/self DTOs, reason-required reveal; coordinates E for replacement distance |
| `employee_identifiers` | employee, identifier type (Aadhaar/PAN/UAN/ESIC), value E, masked suffix, verification status, supporting document | Unique active employee/type; no searchable plaintext full identifiers; restricted collection configuration |
| `employee_contacts` | employee, kind/emergency relation, name/phone/address E, priority, permission to contact | Employee/kind/priority; emergency-only role projection |
| `employee_bank_accounts` | employee, holder/account/IFSC E, masked suffix, verified at, effective range | One primary account at any instant; employee/effective dates |
| `employee_verifications` | employee, type (`police/address/reference/medical/arms`), status, verifier, checked/expiry dates, number E, weapon type, document version, remarks E | Employee/type/expiry; valid arms licence required for armed assignment |
| `employee_events` | employee, event kind (join/confirm/promote/transfer/warning/commend/exit/F&F), effective date, source/target grade/site, reason E, supporting document | Employee/effective date/id; append-only; reverse by linked correction event |
| `employment_terms` | employee, grade, employment category, contract end, supervisor, effective from/to, policy version | Nonoverlapping employee intervals; covers employee terms, distinct from client contract |
| `employee_acknowledgements` | employee, exact notice/SOP/document version, type (CCTV/onboarding/SOP), accepted timestamp, language, trusted IP envelope, evidence | Unique employee/document/version/type; immutable acceptance, later revocation event where applicable |
| `employee_id_cards` | employee, serial, valid from/to, issuing authority/signature asset, generated-document ID, verification token, replaced card, revoked at/reason | Unique serial; one active issued card; exit revokes cards/tokens atomically |
| `employee_postings` | employee, client/site/post, supervisor, effective from/to, reason, previous posting, feedback/rating | Employee/date and site/date indexes; immutable completed posting intervals; client/site consistency FKs |
| `attendance_events` | employee, assignment/shift instance, event kind, captured/received timestamps, geo E, accuracy, selfie document, device, offline event ID, risk result J, source | Unique device/offline-event ID; assignment/time index; immutable raw events, replay safe |
| `attendance_records` | assignment, actual start/end, worked/late/OT/break minutes, status, approval, source-event range, revision | Unique assignment/current revision; correction history retained; minutes cannot be negative |
| `leave_types`, `leave_requests`, `leave_ledger` | Type/accrual policy; employee/from/to/units/reason E/status/approver; dated debit/credit adjustments and request reference | Employee/date/status; immutable balance ledger; reject overlapping approved absences |
| `employee_work_patterns`, `work_pattern_days` | Employee/effective range/rotation length; cycle day/weekly-off/shift-template | Nonoverlapping employee patterns; unique pattern/cycle day |
| `overtime_approvals` | employee/assignment, requested/approved minutes, reason, approver, rate-policy version | Assignment/status; payroll uses approved OT only |
| `pay_components` | code, earning/deduction/employer-cost category, amount or formula type, tax/PF/ESI applicability flags, rounding policy | Unique code; formula is a safe typed expression, never arbitrary JS/SQL |
| `salary_structures`, `salary_structure_lines` | employee/effective interval/approved revision; component, fixed paise/rate basis points/formula J, optional site allowance scope | Nonoverlapping employee pay versions; unique structure/component/site scope |
| `statutory_rules`, `statutory_rule_bands` | jurisdiction/employment category/zone/rule type/version/effective dates/source/approval; threshold lower/upper, amount/rate, ceiling, qualifying criteria J | Covers minimum wage, PF, ESI, PT, LWF, bonus, TDS, gratuity rules; sorted nonoverlapping bands |
| `advances`, `recovery_instalments` | employee, amount, approved/disbursed dates, terms, outstanding; due month, due/recovered amount, payroll/payment reference | Employee/status; advance/due month; over-recovery blocked |
| `payroll_runs` | payroll month, scope, revision, previous run, draft/validated/approved/released/superseded status, attendance cutoff, rule snapshot hash, approver, totals paise | Unique scope/month/revision; one released current revision; locks validated input versions |
| `payroll_items`, `payroll_item_lines` | run/employee, paid days/minutes, gross/deductions/net/employer cost; component, quantity/rate/result, source/version | Unique run/employee and item/component/sequence; all amounts reconcile; never overwrite released slips |
| `payslips` | payroll item, serial/revision, generated-document ID, released/revoked at, password-policy version, delivery status | One document per payroll-item revision; password generated transiently, not plaintext stored |
| `payment_batches`, `payments`, `payment_allocations` | bank-advice export/approval/total; beneficiary employee, encrypted bank snapshot, mode, UTR/reference, amount, date/status; allocation to payroll item/advance/settlement | Unique provider transaction key; partial payments allowed; total allocation cannot exceed payment or liability |
| `payment_events`, `reconciliation_lines` | status transition/evidence/provider ref; imported bank row hash/matched payment/amount/status/reviewer | Append-only payment trail; unique bank import/row hash; failed retry cannot duplicate paid transaction |
| `settlements`, `settlement_lines` | employee exit, version/status/approval; arrears/bonus/gratuity/recovery/payroll liability source and amount | Revisioned; links existing liabilities to prevent paying them twice |
| `asset_catalogue`, `asset_units`, `asset_issues` | Type/specification; serial/status; employee/quantity/issued/returned/condition/recovery/approval | Unique serialized asset; only one open issue per unit; bulk uniform quantities supported |

All thirteen profile tabs map to these tables or shared documents/training. Offer letters and Form 11/Form 2/nomination documents use versioned shared templates. Compensation below the approved effective wage rule is flagged, and payroll cannot release against an unapproved rule version. Proposed payslip password convention is a random per-employee document passphrase, available only in authenticated self-service and rotated on reissue; avoid predictable DOB or identifier-derived passwords. The exact convention is a payroll-module review decision. Actual current Karnataka slabs and rates will be verified in the Employee module before seeding approved rules; none are invented here.

## 6. Training and site skill requirements

| Proposed table | Business columns and relations | Specific keys/indexes/invariants |
|---|---|---|
| `courses`, `course_versions` | code/title/category/status; revision, duration/classroom/field minutes, working days, mode, validity months, pass mark, reattempt policy, language, syllabus J, practical rubric J | Unique course/revision/language; published versions immutable |
| `course_prerequisites` | course version, prerequisite course, required validity | Unique pair; cycles rejected |
| `training_requirements` | course, target employee category/grade/site type, mandatory flag, recurrence months, trigger (`annual/site_change/promotion`), effective dates, policy version | Target/effective indexes; supersession preserves past decisions |
| `training_batches`, `training_sessions` | course version, trainer membership, venue/site, start/end/capacity/status; session date/time/mode/location, duration, QR token hash/expiry | Batch/time; trainer/time; capacity and schedule overlaps checked |
| `training_enrolments`, `training_session_attendance` | employee/batch/status/enrolled/completed; session/enrolment/present minutes/method/marked by/evidence | Unique batch/employee and session/enrolment; QR single-use scope and expiry checks |
| `training_questions`, `training_question_versions` | course, type, tags/difficulty/status; question text/options J, correct answer E, marks, language, revision | Course/language/type; answer keys never returned to learner APIs |
| `assessment_attempts`, `assessment_responses` | enrolment, attempt number, randomized question-version set J, time limit/start/submit, score/result/evaluator; question version, response E, awarded points, practical rubric marks J | Unique enrolment/attempt and attempt/question; retained selected questions enable reproducibility |
| `certificates` | employee, course version, passing attempt, serial, issued/expiry, generated document, verification token, revoked/replaced certificate, issuer | Unique serial; employee/course/expiry indexes; no certificate without validated pass/approved import evidence |
| `trainee_progress_events` | employee, from/to stage, evidence reference, actor, reason, timestamp | Append-only; current stage derived, not manually typed as certified |
| `post_skill_requirements` | post, course, minimum grade, enforcement (`block/warn`), valid-through requirement, effective dates | Post/course/effective index; trainee induction always blocks unless valid override |
| `deployment_overrides` | employee, exact site/post/shift window, failed requirement references J, reason, Super Admin actor, approved/expiry/revoked timestamps | Employee/window; never blanket permanent exemption; cannot override expired CCTV consent |

Catalogue seeds cover every named induction, specialist and recurring course in the brief, with separate editable courses for armed guarding, suspicious objects, disaster response, medical response, firearm safety, women's safety, hospital security, industrial safety, front office and supervisor leadership. Mode/language and prerequisites remain editable versioned data. Annual core refresher, six-month fire drill and two-year first-aid renewal are seeded as the requested configurable business policies. Site induction is triggered by new posting, not merely by a calendar expiry.

For the PSARA course, proposed **unapproved model defaults** are 100 classroom hours + 60 field hours over at least 20 working days; condensed ex-service/former-police track 40 + 16 hours over at least seven working days. These are Central Model Rules patterns, not a finding that they are the currently applicable Karnataka requirements. Store jurisdiction, source and approval state; require Karnataka alignment before production enforcement. Sources: [MHA training SOP](https://www.mha.gov.in/sites/default/files/2023-05/sop_03052023_0.pdf), [Central Model Rules 2020, Rule 8](https://thc.nic.in/Central%20Governmental%20Rules/Private%20Security%20Agencies%20Central%20Model%20Rules%202020.pdf).

Reminders at 60/30/7 days use deduplicated scheduled jobs. Certification status is computed for the proposed duty date and shift end, not just today's date. Training sessions also reserve employee time so the replacement engine cannot assign a person into a training conflict. Dashboards calculate training hours, pass rates, compliance and trainer utilization from sessions/attempts, with clearly defined date windows.

## 7. Availability calendar, roster and replacement engine

| Proposed table | Business columns and relations | Specific keys/indexes/invariants |
|---|---|---|
| `shift_instances` | site/post, staffing requirement version, service date, start/end UTC, headcount, grade, status | Unique requirement/date; site/date and post/start; explicit overnight endpoints |
| `roster_plans` | client/site, week/date range, draft/published state, base schedule revision, owner, current publication | Site/week/status; drafts never counted as published coverage |
| `roster_plan_slots` | plan, shift instance, seat number, employee optional, change reason, replaced assignment | Unique plan/shift/seat; seat between 1 and required headcount; null employee is a gap |
| `roster_publications`, `roster_publication_items` | plan/revision/publisher/time/source fingerprint; immutable slot, employee, start/end and requirement-version snapshots | Unique plan/revision; immutable before/after references; rollback is a new publication |
| `assignments` | shift instance, seat number, employee, posting, publication, status, reliever flag, accepted/rejected time, reason | Unique active shift/seat; employee/start/end; approved-training/leave and work-policy eligibility validated |
| `schedule_revisions` | Scope (`tenant` initially), revision, last mutation | Unique scope; serializes competing availability-affecting changes during atomic publication |
| `employee_time_blocks` | employee, kind (`duty/training/leave/off`), start/end, source subject, status | Employee/start/end; index future time; overlap/rest checks include cross-site blocks |
| `replacement_requests`, `replacement_decisions` | gap/assignment, requested skills/grade, reason/status; chosen employee, eligibility/ranking explanation J, policy version, approval and resulting assignment | Gap/status; decision idempotency key; score is explainable and not authorization |
| `client_employee_restrictions` | client, employee, restriction type, effective dates, reason E, evidence and approver | Client/employee/effective; blacklist visible only to authorized managers |
| `assignment_events` | assignment, published/notified/accepted/rejected/replaced/cancelled/no-show event, actor, reason, timestamp | Assignment/time; receipt distinct from publication and notification |
| `coverage_daily` | client/site/post/service date/shift, required/rostered/present/reliever/OT counts, revision, computed at | Unique site/post/date/shift; indexed client/date; derived cache, rebuildable |
| `shortfall_forecasts` | site/post/shift/date, expected shortfall, contributing causes J, source revision, computed at | Site/date; 14-day bounded horizon; freshness displayed |

One shared eligibility engine handles drag/drop, direct assignment, CSV/Excel import, copy-week, replacement and publish. It evaluates the actual interval, approved leave/off/training, contract validity, grade, licences, certificate validity, rest hours, weekly-hour limits, client restrictions and existing assignments across every site. Existing one-shift-per-day/eight-hour-rest logic is the starting policy, not silently treated as statutory law. 12-hour and rotating templates require an approved work-policy configuration.

Atomic publication must not be “read → validate → unguarded write.” Proposed D1 design: read the schedule revision and necessary eligibility inputs; in one transactional batch, acquire a conditional revision update whose failure aborts through a database guard, then write assignments, time blocks, immutable history, audit and outbox. All availability-affecting changes (leave approval, training booking, employment/skill restrictions and attendance locks) increment that revision. Zero-row CAS by itself is not an SQL failure: a guard must turn a stale revision into a real transaction failure. Per-tenant serialization starts simple; partitioning is only introduced after measured contention. Database triggers also reject active employee duty overlaps and out-of-range seats. Foreign keys and unique slot constraints are a second line of defence.

Calendar semantics: `staffing_shortfall = max(required - rostered,0)` and `attendance_shortfall = max(required - present,0)` are separate. Before shift start show staffing shortfall; during/after shift show actual attendance shortfall. Display the selected basis explicitly, so future shifts do not appear absent. With Required 12, Rostered 11, Present 10, live Short is 2 and staffing shortage is 1. Grey means no requirement, not zero assignments. Amber means covered using relievers/approved OT. Matrix and calendar endpoints return only a bounded viewport and paginated employees.

Replacement ranking first excludes ineligible people; then scores grade fit, certification coverage, known distance, remaining rest, approved OT cost and previous site experience with versioned weights. Unknown distance is labelled unknown, not zero. Location is used only with a permitted source. A one-click assignment revalidates eligibility at commit, records a reason and queues guard/supervisor notification. No-show detection uses grace minutes from policy and idempotent escalation jobs. Copy-week creates a draft and reports new conflicts instead of copying attendance or past acknowledgements.

## 8. Site security surveys, risks and client portal

| Proposed table | Business columns and relations | Specific keys/indexes/invariants |
|---|---|---|
| `survey_templates`, `survey_template_items` | Site type/revision/name/status; category/prompt/scoring weight/order/evidence requirements | Unique type/revision; template/order |
| `site_surveys`, `survey_responses` | site/template version/surveyor/date/previous survey/next due/state; checklist item/result/comment/evidence document | Site/date; unique survey/item; finalized response revisions immutable |
| `risk_findings` | survey/site, strength-or-weakness, category, description, location/floor-plan version/pin, severity, likelihood, risk score, remedy, effort, owner party, responsible contact/member, target date, state | Site/state/severity; client via scoped site; target/status; scores tied to policy version |
| `risk_finding_events` | finding, from/to state, actor/reason, evidence document, timestamp | Finding/time; allowed transitions and actor permissions enforced |
| `risk_comments` | finding, actor, text, visibility (`internal/client`), document reference | Finding/time; internal comments excluded from client projection |
| `risk_acknowledgements` | finding/revision, named client membership/contact, displayed statement hash, acknowledged time, trusted source IP E | Unique finding/revision/actor/action; immutable; server timestamp |
| `risk_acceptances` | finding/revision, named authorized client signatory, residual-risk statement, evidence/signature document, signed/expiry/revoked dates | Finding/effective; acceptance is separate from resolved/verified/closed |
| `site_score_snapshots` | site, survey, scoring-policy version, score 0–100, weighted totals/explanation J, computed at | Site/time; immutable trend points; no fabricated historical scores |
| `risk_report_issues` | site/survey, report version/generated document, recipient scope, issued time, notification event | Site/issued; exact published findings preserved |

Workflow: Identified → Flagged to client → Acknowledged → In progress → Resolved pending verification → Verified → Closed. Client users can acknowledge, comment and submit resolution evidence for their own sites. Only the assigned authorized supervisor verifies with evidence. Verification may reject and return an item to In progress. Acceptance requires a named client sign-off and does not erase the finding or imply legal immunity. Reopening and acceptance expiry are recorded events.

Proposed configurable scoring: severity weights Low=1, Medium=2, High=4, Critical=5, multiplied by likelihood 1–5; score normalized against the survey template's weighted assessed controls, clamped 0–100. Unassessed sites show “Not assessed,” not 100. Accepted unresolved risks retain residual contribution; closure decreases it. A closed finding's evidence/history remains. A new survey has a versioned denominator and comparison warning when the template changed. Reminders and escalation reuse the shared jobs/outbox. Email/WhatsApp link recipients must authenticate before viewing detailed findings.

## 9. CCTV consent, registry, mapping and viewing

| Proposed table | Business columns and relations | Specific keys/indexes/invariants |
|---|---|---|
| `cctv_consents` | client/site, signed document version, purpose, valid from/to, timezone, state, approved by, revoked at/reason, live/record/snapshot flags, consent revision | Site/status/validity; no registration or viewing without active scope |
| `cctv_consent_scopes` | consent, client-authorized camera reference/name/location from signed schedule | Unique consent/reference; pre-registration scope avoids a camera/consent creation cycle |
| `cctv_consent_roles`, `cctv_consent_windows` | consent + allowed role; weekday/start/end local permitted times | Unique role grant; overnight windows resolved in site timezone; role permission AND consent both required |
| `cameras` | site, consent-scope entry, client camera reference, name/location/FOV, type (`RTSP/ONVIF/HLS/vendor`), lat/lon or floor-plan/x/y, health status, approved gateway route reference | Unique site/reference; server validates scope before creation; route has no browser-visible camera credentials |
| `camera_secrets` | camera, origin endpoint/username/password/vendor secret E, encryption key version, rotated at | One active secret version per camera; separate restricted repository |
| `camera_post_mappings` | camera, post, priority, effective from/to | Same-site composite relations; unique post/priority/effective period |
| `camera_health_events` | camera, state, measured time, failure category | Camera/time; aggregation retention separate from detailed event retention |
| `camera_view_sessions` | camera/consent revision, viewer membership, reason, requested/start/last-heartbeat/end times, termination reason, observed duration, token hash/JTI/expiry, viewer watermark identity | Camera/time and viewer/time; server-side audit before issuing access |
| `camera_evidence_exports` | camera/session/incident, explicit permitted operation, consent revision, authorized purpose, document version, actor/time | Feature disabled by default; record/snapshot request denied unless consent expressly permits |

Registration first records signed authorisation and its camera scope, then attaches registry entries to authorized scope rows. Viewing checks agency policy, site/client grant, consent scope, permitted role/hour, validity/revocation and guard CCTV onboarding acknowledgement where the view links a guard. Patrol proximity uses a fresh permitted location, otherwise the mapped post camera; “nearest” is not guessed from stale GPS.

A server-side media gateway adapter creates short-lived relay sessions. The browser receives only the relay endpoint/session token, never camera origin IPs, RTSP URLs or credentials. Revocation stops active sessions through gateway revocation plus short token renewal; checking consent only when opening a feed is insufficient. Permission windows must also terminate or deny renewal of an already-open stream. Watermark viewer/time is preferably burned into the relay; a UI watermark alone is removable. No snapshots, recording buffers retained as evidence or downloads by default. Viewing duration uses server heartbeats and expires abandoned sessions; it is an observed duration, not a claim that a viewer watched every second.

A working generated test stream will exercise the adapter in development and be clearly labelled mock. Camera access logs are exposed to the correct client through scoped projections. Camera incidents reference the session, post, on-duty assignment and event timestamp, without silently taking a snapshot. Consent records support the requested privacy controls; this schema alone does not establish DPDP compliance.

## 10. Section 6 extensions — consolidated future schema

These tables are part of the complete relationship plan. They are not authorization to start these modules before the user chooses their order after the core build. They reuse the shared employees, assignments, documents, notifications and audit model.

| Requested feature | Proposed tables and business columns | Relations and key indexes |
|---|---|---|
| Offline PWA attendance | `devices` (membership, enrollment key, revoked time); `sync_batches` (device, client batch ID, received time, status); `attendance_verification_results` (event, method, score, provider, rule version, reviewer decision) | Unique device/batch; uses immutable `attendance_events` for replay-safe uploads. Browser-only mock-location/face signals are not presented as conclusive anti-spoofing; stronger verification needs a supported provider/device interface |
| Patrol verification | `patrol_routes` (site, version, schedule); `patrol_checkpoints` (site, floor/pin, QR/NFC token hash); `patrol_route_stops` (route, checkpoint, sequence, tolerance); `patrol_rounds` (assignment, route version, start/end/status); `patrol_visits` (round, checkpoint, captured/received time, location E, evidence, result) | Unique route/sequence and replay ID; site/time and round/sequence; rotating/signed checkpoint tokens and missed-stop jobs |
| Incident expansion | `incidents` (site/post/assignment/camera session, category, severity, state, reported/response/closed time, description E); `incident_events` (incident, transition/note, visibility, actor); `incident_sop_versions` (type, revision, steps J); `incident_step_results` (incident, step, outcome); `incident_evidence` (incident, document version, capture/hash/custody); `incident_reports` (incident, revision, generated document) | Site/state/reported time; immutable custody/event trail; same-site composite relations; client-visible content explicitly approved |
| SOS | `sos_alerts` (employee, assignment/site, captured time, position E, state, acknowledged actor/time); `sos_events` (alert, escalation/acknowledgement/resolve, actor/time) | Site/state/time; unique trigger idempotency key; location history retained only under policy; emergency delivery not represented by a toast |
| Occurrence book/handover | `occurrence_entries` (site/post/shift, sequence, category, note E, visibility); `handover_records` (outgoing/incoming assignment, pending items J, keys/assets references, status); `handover_acknowledgements` (handover revision, incoming employee, time, evidence) | Site/service date/sequence; acknowledged versions immutable; same post/site continuity |
| Visitor/vehicle/material passes | `gate_passes` (site/type, person/contact or vehicle details E, purpose, host, validity, status); `gate_pass_items` (pass, material description/quantity/unit); `gate_pass_events` (pass, entry/exit/approval, officer, time) | Site/status/validity and pass/time; separate retention for visitor identities |
| Attendance-to-invoice billing | `musters`, `muster_lines` (client/site/month/approved revision; assignment, billable hours/grade/OT/shortfall); `invoices`, `invoice_lines` (client/contract/period/number/revision/tax-rule version/status; source muster/rate/quantity/amount/tax); `credit_notes`, `credit_note_lines`; `client_receipts`, `receipt_allocations`; `tds_receivables` | Unique tenant/financial-year/invoice-number; immutable issued invoices; credit lines reference original lines; client/due/status for ageing; allocation prevents duplicate settlement |
| Statutory compliance | `compliance_obligations` (type/state/site/client/frequency/due rule); `compliance_occurrences` (period/due/status/owner/evidence); `agency_licences` (state/licence type/number E/validity/document); `compliance_pack_issues` (client/period/document/source snapshot) | Unique obligation/period; due/status; licence/state/expiry; shared approved statutory-rule versions |
| SLA/client dashboards | `sla_definitions` (contract version/metric/target/window/penalty rule); `sla_measurements` (site/period/value/numerator/denominator/source revision); `client_report_issues` (client/period/template/document/revision) | Unique definition/site/period/revision; preserve metric formula version and data freshness |
| Supervisor audits | `audit_checklist_versions` (site type/revision/items J); `site_audits` (site/supervisor/checklist/scheduled/actual time/score/state); `site_audit_items` (audit/item/employee optional/result/photo document/finding reference) | Site/date; supervisor/date; unique audit/item/employee discriminator; risks can originate from audit findings |
| Recruitment | `candidates` (code/name/contact E/source/stage); `candidate_events` (stage transition/evidence/actor); `candidate_checks` (physical/documents/verification result); `candidate_conversions` (candidate/employee/time) | Unique candidate code; stage/date; unique conversion per candidate; converts to trainee without copying stale approvals |
| Performance/recognition | `performance_model_versions` (metric weights/eligibility/window); `performance_scores` (employee/period/model/source scores/explanation J); `recognitions` (employee/period/award/approver); `attrition_signals` (employee/model/inputs summary E/confidence/review) | Employee/period/version; no automatic disciplinary decisions from an inferred risk score |
| Notifications hub | Reuse templates, preferences, outbox and delivery tables; add `notification_inbox` (membership, delivery, read/dismissed time) | Unique member/delivery; unread/time; EN/KN/HI templates versioned |
| Command-centre map | `site_live_status` (site/current counts/incident/SOS/gap/camera aggregates/source revision/computed time) | Unique site; scoped cache projection only; no duplicate guard/incident master records |
| Global audit/data protection | Reuse audit, retention, encryption, privacy and document tables; add `privacy_access_reviews` (membership/scope/reviewer/outcome/time), `retention_runs` (policy/cutoff/counts/result/hold exclusions) | Audit subject/time and retention run/status; verified deletion excludes legal holds |
| Optional AI assists | `ai_runs` (actor/purpose/model/prompt-template version/input references/redacted result/review/cost); `ai_suggestions` (run/subject/type/explanation/status/approver) | Tenant/actor/time; permission-scoped retrieval; no KYC prompts by default; suggestions cannot bypass authorization or silently mutate rosters |

Every future table inherits the shared tenant keys, foreign-key indexes, history and privacy conventions. Statistical caches are rebuildable and never the authoritative source of payroll, permission or consent decisions.

## 11. Migration plan — preserve existing records

The current table and initial migration remain untouched. No migrations are generated or applied until approval. Proposed new migration groups (descriptive names; Drizzle assigns actual next sequence):

| Group / build gate | Additions | Legacy handling |
|---|---|---|
| Foundation | Tenant/user/grants, audit, record registry, private-document metadata, policy/outbox primitives; clients/sites/posts/shifts/contracts/requirements; migration tracking | Snapshot each owner's JSON/version/hash; establish isolated demo tenant and explicit owner membership; map site/post/shift constants and all encountered names |
| Employees | Employee/profile/verification/identity/assets, attendance/leave/work patterns, payroll/payment tables; minimal posting/assignment tables required to preserve duty history | Backfill employees, duties, attendance statuses, leave and legacy incidents/audit through explicit ID maps; unknown timestamps or identities stay unknown with `legacy_import` origin |
| Training | Catalogue/versions/batches/assessment/certificates/post requirements/overrides | Existing “training” labels are retained as legacy notes, never converted into fabricated certifications |
| Availability | Full planning, shift-instance/time-block/replacement/history/cache tables | Convert saved drafts/publication snapshots to normalized revisions; preserve original JSON; detect source conflicts before activation |
| Risk/client portal | Survey/risk/acknowledgement/score/report tables and client-specific API projections | New fictional data only; no invented historical client signatures |
| CCTV | Consent/scope/camera/secret/session/health tables | Mock registry only; no live endpoints or credentials imported from screenshots |
| Chosen extra modules | Only the chosen Section 6 table families | Separate migration/test/review per chosen module |

Foundation creates the shared registry and access keys first. Any employee-target grant FKs are introduced when the Employee table exists; self grants cannot be activated before then. Employee delivery creates the minimal shift-instance, assignment and publication tables it needs for deployment/attendance history; Availability later extends their planning and replacement behaviour without duplicating them. Existing incidents are migrated into the base incident/event tables when the legacy API is cut over; the later Incident module adds evidence, SOP and investigation workflows. Foundation may create minimal referenced employee or registry keys only where a real FK requires them; the Employee module then adds its columns/tables. Migration ordering will avoid forward foreign keys to absent tables. This does not authorize a hidden implementation of later modules.

Backfill and cutover procedure:

1. Take and verify a restorable source snapshot in the target environment. Record source row count, version and content hash. The production migration's first operation is not a destructive reset.
2. Add tables/indexes/checks without renaming or dropping `demo_workspaces`. Backfill in bounded, idempotent chunks, with legacy IDs and owner isolation preserved. A retry reuses mapped IDs.
3. Validate counts, required fields, same-tenant relations, attendance history, draft/publication history and selected totals. Quarantine conflicting/orphaned source records with a readable exception report; never discard them or silently invent assignments.
4. Unknown client relationships require an explicitly labelled migration holding client/site mapping pending review. Do not guess real legal/client names from a site label. Generated demo clients are explicitly fictional.
5. The source seed assumes one person per post/shift; normalize to explicit headcount-one requirements for its mapped periods. Do not turn a legacy JSON fingerprint into a fake employee acknowledgement, actual clock-in event or client approval.
6. Switch migrated module reads/writes together behind a per-tenant cutover flag only after reconciliation. No simultaneous independent writers to JSON and normalized data. Unmigrated modules remain in the clearly labelled isolated legacy demo, not available as an alternative production API.
7. Before accepting normalized writes, rollback can restore the old read path. After new writes, use a tested reverse reconciliation or forward fix; never roll back to stale JSON and lose newer records. Retain snapshots and normalized history through the retention window.
8. Lock down the legacy whole-state endpoint to legacy owner-demo contexts. A new client/supervisor/employee identity must never receive it, even if the new UI no longer calls it.

Generated SQL will run first against a restored local/staging copy and run `foreign_key_check`/integrity checks and reconciliation reports. D1-specific batch, migration and query limits will be verified during implementation; one giant transaction over an entire month is not the proposed import strategy.

## 12. Performance, policy and security acceptance criteria

- API handlers obtain authenticated identity once, resolve server-owned active tenant membership and explicit role scopes, then call policy-enforced repositories. No handler accepts a user-chosen effective role. Global support/administration does not imply access to employee secrets.
- D1 access is server-only. New module handlers cannot import a raw unrestricted DB accessor; architecture checks enforce the repository boundary. Scope filtering happens in the SQL query, including aggregates and existence checks, not after fetching rows. A leaked identifier cannot authorize a read.
- Every site-scoped read has tenant + allowed-client/site membership predicates. Shared employee details are projected for that purpose; deployment at a client does not expose private HR/payroll fields. Search, totals, PDFs, exports, object downloads, background jobs and websocket/polling feeds use the same policy.
- Composite FKs block cross-tenant and mismatched site/client writes. Field permissions and sensitive-read audit apply before decrypting. Audit delivery must succeed before returning a sensitive reveal; failures do not fall back to unaudited plaintext.
- List indexes: tenant/status/name/id for employees/clients; tenant/client/site/date for calendar; tenant/employee/course/expiry for matrix; tenant/site/state/date for incidents/risks; tenant/employee/month for payroll; tenant/state/due for jobs. Search gets bounded prefix/indexed fields initially; substring or full-text capability is added only after checking the target runtime.
- Test performance against 5,000 employees, 300 sites and a realistic month's assignments, separately from the small client demo. Proposed acceptance targets: p95 scoped list API <500ms and calendar/matrix viewport <1s after warm-up in a documented test region, with payload limits and query-plan inspection. These are targets to measure, not claimed results.
- Monthly summaries use derived aggregates with source revisions. Users see stale/as-of indicators if data has not refreshed. Sensitive response caching is private/no-store; no cross-role shared cache.
- Published financial, training and consent evidence is immutable; soft deletion applies to editable masters. Retention/legal holds govern eventual deletion/anonymisation. Public QR verification gives only the stated minimal fields and revocation state, rate-limited and unguessable. The current owner-private hosting gate cannot serve an anonymously accessible QR page: production needs an explicitly approved public verification surface that serves only this projection, while personnel APIs remain authenticated. Do not silently publish the entire demo to make QR links work.
- Default camera sessions are live-only; cannot promise prevention of a user's own screen recording. No camera origin leaks through player manifests or redirects. Signed links alone do not substitute for consent revocation checks.
- PWA offline capture records both capture and receipt times and marks verification pending. A browser cannot conclusively establish absence of GPS spoofing; risky events require review or stronger hardware/provider evidence.

## 13. Integration interfaces and configuration needed later

These are design contracts, not stubbed functions added to the repository. Each module must provide a working mock and complete implementation of its chosen adapter before it is accepted.

| Boundary | Working demonstration behaviour | Production configuration required |
|---|---|---|
| Private files | Upload/download against a local private object-store adapter with the same authorization and metadata flow | Private R2 binding/bucket, encryption key/KMS reference, malware scanning endpoint + credential, retention settings |
| Notification delivery | Persist queued/sent-mock/failed-mock receipts and render notification previews | Email provider endpoint/API key and verified sender; SMS provider credentials, sender and applicable approved template IDs; WhatsApp provider/Cloud API token, phone-number ID, approved template IDs and webhook verification secret |
| Background execution | Deterministic local scheduler invokes the same due-job/outbox runner | Approved periodic Worker/job runner invoking a signed internal endpoint; scheduler secret and retry/lease policy. No assumption Sites automatically supplies cron |
| Maps/distance | Test coordinates and deterministic geodesic distances; schematic floor-plan pins | Selected map provider/browser key restrictions, optional routing API server key, permitted location data source |
| Camera relay | Generated mock live stream; signed-session issue/renew/revoke and consent-expiry scenarios | Media gateway base URL, API credential, viewing-token signing key, allowed-origin/relay configuration and encrypted client camera/VMS credentials |
| PDF/QR | Deterministic branded outputs stored through the document adapter; verification routes | Approved brand/signature assets; tested Worker-compatible PDF renderer and fonts; public verification origin if external scanning is required |
| Bank/payroll | Bank-advice export and simulated reconciliation; no money sent | Bank-specific file layout/approval process, beneficiary validation; API credentials and signing certificates only if actual transfer is separately enabled |
| Face/device verification | Explicit simulated pass/review/fail results attached to attendance events | Chosen verification service endpoint/token, onboarding consent/policy, threshold and manual-review workflow; no invented browser attestation |
| Optional AI | Permission-scoped deterministic sample suggestions marked mock | Chosen model provider API key, approved data handling/retention policy and budget; separate approval before activation |

Secrets are set in the environment's managed secret store, never committed or pasted into source. The schema stores secret references or ciphertext only. The live mock/demo must clearly distinguish a notification queued from one actually delivered, and a mocked camera from client surveillance.

## 14. Seed plan and module delivery order

A deterministic seed creates a separate labelled demonstration tenant, not real people. Foundation: three clients, eight sites, forty posts with explicit headcounts and shift requirements. Employee module: 150 employees covering trainee/full-time/reliever/contract categories and appropriate verification/pay examples; no plausible unlabelled real Aadhaar or bank numbers. Training: valid, expiring, expired, not-taken, failed and reattempt scenarios. Availability: current IST month at seed time, leave, training, weekly offs, relievers and intentional gaps. Risks: 25 weaknesses across all stages plus strengths and survey history. CCTV: ten generated mock cameras with active/expired/revoked/limited-hour consent scenarios. Seed-generated sign-offs are labelled fictional.

Keep the original 21-09-2026 scenario and its data intact; do not silently reset it to today. Larger synthetic scale fixtures (5,000 employees / 300 sites) live in a separate test dataset. Seeds are opt-in and idempotent, never run destructively on application startup.

Build gates are exactly: schema approval → foundation → employees → training → availability/replacements → risk/client portal → CCTV → user-selected extras. Every module delivery includes full files with absolute paths, executable non-destructive SQL, complete API/UI, seed data, integration settings, tests, remaining assumptions and a stop for the next go-ahead.

## 15. Planned foundation API and file layout

These are proposed paths, not files created at this step. Preserve the existing command shell and component kit. Use resource-specific route handlers under `/Users/kishorraj/Developer/SDC/app/api/clients/`, `/Users/kishorraj/Developer/SDC/app/api/sites/`, `/Users/kishorraj/Developer/SDC/app/api/posts/` and `/Users/kishorraj/Developer/SDC/app/api/shift-templates/`, rather than extending the whole-state demo action endpoint indefinitely. Collection GETs return scoped cursor pages; POST creates; item GET/PATCH requires authorization and optimistic row version; archive is a named audited transition. Nested resources use the owning resource's permission and same-tenant relation checks.

Proposed implementation files: `/Users/kishorraj/Developer/SDC/lib/access.ts` for server identity/grant resolution, `/Users/kishorraj/Developer/SDC/lib/repositories/` for mandatory scoped data access, `/Users/kishorraj/Developer/SDC/lib/services/` for transactions/policy engines, `/Users/kishorraj/Developer/SDC/lib/integrations/` for working adapters, and `/Users/kishorraj/Developer/SDC/db/schema.ts` as the existing schema entrypoint importing module schemas when it grows. Keep current `app/command` navigation and split modules into focused components. Unit rules, API isolation, migration and scale fixtures belong in the existing `/Users/kishorraj/Developer/SDC/tests/` directory.

No server permission is inferred from a requested page, role label, client ID or hidden button. An internal controller determines which repository and response projection the authenticated principal can use.

## 16. How to test this proposal and the first approved module

This step has no new feature to log into. Review the audit against `db/schema.ts`, the initial migration, `app/chatgpt-auth.ts` and the operations route. The existing pure deployment tests and TypeScript check provide a baseline only.

For the first implementation gate, the acceptance checklist will be:

1. **Super Admin:** create/edit/archive a client, site, post and shift requirement; verify history, documents, code uniqueness and effective-date validation. Reload to verify persistence.
2. **Ops Manager / Senior Manager:** manage authorized operational records; verify attempts to change roles or reveal bank/KYC values are denied by the API.
3. **Field Supervisor:** see only assigned sites; request another site's object, count, search and export directly and receive no unauthorized data.
4. **Client User:** see only granted client/sites and approved projections; verify the legacy `/api/operations` endpoint does not expose the owner demo.
5. **Guard / Employee:** see only the linked employee record; changing a URL/body employee ID or preview-role value must not broaden access.
6. **Trainer / HR:** verify their distinct permission matrices, with no accidental operational or payroll permission inherited merely because a page is visible.
7. **Two independent tenants and users:** prove cross-tenant IDs fail on reads and writes; foreign keys reject mismatched site/client references; revoked grants take effect on the next request.
8. **Migration:** restore a copy, backfill twice, compare counts/hashes/history, exercise a conflicting/orphaned input, verify rollback/cutover rules, and retain every original row.
9. **Concurrency:** two simultaneous conflicting assignments/updates cannot both succeed. Repeat for leave/training changes racing publication.
10. **Mobile and scale:** keyboard/touch forms at phone width; scoped query plans and pagination under large synthetic data. No claim of completion until measured.

## 17. Assumptions and decisions requested

- SDC is the first agency tenant. Its paying clients are child entities; future agencies would be separate tenants.
- Retain D1 with a mandatory server policy layer plus database integrity constraints. Database-enforced SELECT-level RLS would require a revised architecture; it is not hidden in this approval.
- Keep the current ChatGPT sign-in and add authorization, not another auth provider. Guard/client onboarding feasibility must be accepted before live rollout.
- Map current role keys to the requested labels, retain Senior Manager with operational scope, and add HR/Payroll, Trainer and Client User. Owner bootstrap must be explicit; other preview roles create no real memberships automatically.
- Start with a private demo/staging implementation and fictional seeds; live payroll, notifications, identity verification, surveillance and public QR routes require their module's production settings and acceptance.
- The rules engine stores approved jurisdiction-specific policy versions. Legal/payroll settings, document retention, signature assets, gateway choice and delivery vendors are confirmed during their module, not guessed now.

**Approval requested:** approve this consolidated logical schema and the D1/server-policy, existing-sign-in and role-mapping decisions, then authorize only the Clients → Sites → Posts → Shifts foundation. The next module still requires a separate go-ahead after its delivery. No feature code or executable migration has been written at this step.
