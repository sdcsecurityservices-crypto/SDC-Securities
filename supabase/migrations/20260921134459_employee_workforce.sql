-- Employee module. Additive migration; no existing records are replaced.
create table public.employees (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id),
 employee_code text not null check(employee_code ~ '^[A-Z0-9_-]{2,30}$'), full_name text not null check(length(full_name) between 2 and 150),
 grade_id uuid not null, category text not null check(category in ('trainee','full_time','reliever','contract')),
 status text not null default 'active' check(status in ('active','on_leave','suspended','exited')),
 joined_on date not null, exited_on date, supervisor_id uuid, membership_id uuid,
 photo_url text not null default '', notes text not null default '',
 foreign key(tenant_id,grade_id) references public.grades(tenant_id,id),
 foreign key(tenant_id,supervisor_id) references public.employees(tenant_id,id),
 foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id),
 unique(tenant_id,employee_code), unique(tenant_id,membership_id),
 check((status='exited')=(exited_on is not null)), check(exited_on is null or exited_on>=joined_on),check(supervisor_id is distinct from id)
);
create table public.employee_private_profiles (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 ciphertext text not null, masked jsonb not null default '{}' check(jsonb_typeof(masked)='object'), unique(tenant_id,employee_id)
);
create index employee_private_profiles_employee on public.employee_private_profiles(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_verifications (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 kind text not null check(kind in ('police','address','reference','medical','arms')), status text not null check(status in ('pending','verified','rejected','expired')), checked_on date, expires_on date, issuer text not null default '', reference_mask text not null default '', notes text not null default '', check(expires_on is null or checked_on is null or expires_on>=checked_on)
);
create index employee_verifications_employee on public.employee_verifications(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_events (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 kind text not null check(kind in ('joined','confirmed','promoted','transferred','warning','commendation','exit','settlement')), effective_on date not null, title text not null, notes text not null default ''
);
create index employee_events_employee on public.employee_events(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_postings (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 site_id uuid not null, post_id uuid not null, starts_on date not null, ends_on date, reason text not null, feedback text not null default '', rating integer check(rating between 1 and 5), foreign key(tenant_id,site_id) references public.sites(tenant_id,id), foreign key(tenant_id,post_id) references public.posts(tenant_id,id),check(ends_on is null or ends_on>=starts_on)
);
create index employee_postings_employee on public.employee_postings(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_attendance (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 work_date date not null, check_in timestamptz, check_out timestamptz, status text not null check(status in ('present','absent','weekly_off','paid_leave','unpaid_leave')), approval text not null default 'pending' check(approval in ('pending','approved')), overtime_minutes integer not null default 0 check(overtime_minutes between 0 and 720), source text not null default 'manual' check(source in ('manual','gps')), site_id uuid, evidence_document_id uuid, notes text not null default '', foreign key(tenant_id,site_id) references public.sites(tenant_id,id), check(check_out is null or check_in is not null and check_out>=check_in), unique(tenant_id,employee_id,work_date)
);
create index employee_attendance_employee on public.employee_attendance(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_leave_balances (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 leave_type text not null check(leave_type in ('annual','sick','casual')), entitled_days numeric(6,1) not null check(entitled_days>=0), year integer not null check(year between 2020 and 2100), unique(tenant_id,employee_id,leave_type,year)
);
create index employee_leave_balances_employee on public.employee_leave_balances(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_leave_requests (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 leave_type text not null check(leave_type in ('annual','sick','casual','unpaid')), starts_on date not null, ends_on date not null, reason text not null, status text not null default 'requested' check(status in ('requested','approved','rejected','cancelled')), decision_note text not null default '',check(ends_on>=starts_on), check(ends_on-starts_on<=90)
);
create index employee_leave_requests_employee on public.employee_leave_requests(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_salary_structures (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 starts_on date not null, ends_on date, basic_paise integer not null check(basic_paise>=0), da_paise integer not null default 0 check(da_paise>=0), hra_paise integer not null default 0 check(hra_paise>=0), conveyance_paise integer not null default 0 check(conveyance_paise>=0), washing_paise integer not null default 0 check(washing_paise>=0), special_paise integer not null default 0 check(special_paise>=0), site_allowance_paise integer not null default 0 check(site_allowance_paise>=0), overtime_hour_paise integer not null default 0 check(overtime_hour_paise>=0), pf_basis_points integer not null default 0 check(pf_basis_points between 0 and 10000), esi_basis_points integer not null default 0 check(esi_basis_points between 0 and 10000), pf_ceiling_paise integer not null default 0 check(pf_ceiling_paise>=0), pt_paise integer not null default 0 check(pt_paise>=0), lwf_paise integer not null default 0 check(lwf_paise>=0), tds_paise integer not null default 0 check(tds_paise>=0), other_deduction_paise integer not null default 0 check(other_deduction_paise>=0), minimum_wage_paise integer not null default 0 check(minimum_wage_paise>=0), rule_source text not null, rule_approved boolean not null default false, notes text not null default '',check(ends_on is null or ends_on>=starts_on)
);
create index employee_salary_structures_employee on public.employee_salary_structures(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_payslips (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 month date not null check(extract(day from month)=1), revision integer not null check(revision>0), status text not null default 'draft' check(status in ('draft','released','superseded')), salary_id uuid not null, paid_days integer not null check(paid_days between 0 and 31), overtime_minutes integer not null default 0, gross_paise integer not null check(gross_paise>=0), deduction_paise integer not null check(deduction_paise>=0), net_paise integer not null check(net_paise>=0), breakdown jsonb not null, released_at timestamptz, correction_reason text not null default '', foreign key(tenant_id,salary_id) references public.employee_salary_structures(tenant_id,id), unique(tenant_id,employee_id,month,revision),check(net_paise=gross_paise-deduction_paise)
);
create index employee_payslips_employee on public.employee_payslips(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_payments (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 payslip_id uuid, kind text not null check(kind in ('salary','advance','bonus','arrears','gratuity','settlement','recovery')), amount_paise integer not null check(amount_paise>0), paid_on date not null, mode text not null check(mode in ('bank','upi','cheque','cash')), reference text not null default '', status text not null check(status in ('pending','paid','failed','on_hold')), reconciled boolean not null default false, notes text not null default '', foreign key(tenant_id,payslip_id) references public.employee_payslips(tenant_id,id),check(status<>'paid' or length(reference)>0),check(not reconciled or status='paid'),check(kind<>'salary' or payslip_id is not null)
);
create index employee_payments_employee on public.employee_payments(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_assets (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 asset_type text not null check(asset_type in ('uniform','shoes','baton','torch','radio','id_card','arms','other')), serial text not null default '', quantity integer not null check(quantity between 1 and 100), issued_on date not null, returned_on date, condition text not null check(condition in ('new','good','worn','damaged','lost')), recovery_paise integer not null default 0 check(recovery_paise>=0), notes text not null default '',check(returned_on is null or returned_on>=issued_on)
);
create index employee_assets_employee on public.employee_assets(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_certificates (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 course_title text not null, certificate_number text not null, issued_on date not null, expires_on date, status text not null check(status in ('assigned','in_progress','passed','failed','revoked')), provider text not null default '', hours integer not null default 0 check(hours between 0 and 5000), notes text not null default '',check(expires_on is null or expires_on>=issued_on)
);
create index employee_certificates_employee on public.employee_certificates(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_documents (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 category text not null check(category in ('photo','kyc','verification','education','offer','form_11','form_2','nomination','cctv_acknowledgement','selfie','other')), title text not null, file_name text not null, mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg')), size_bytes integer not null check(size_bytes between 1 and 10485760), object_path text not null unique, version integer not null check(version>0), expires_on date, previous_id uuid, foreign key(tenant_id,previous_id) references public.employee_documents(tenant_id,id),check(object_path like tenant_id::text||'/'||employee_id::text||'/'||id::text||'/%')
);
create index employee_documents_employee on public.employee_documents(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create table public.employee_id_cards (
id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0, deleted_at timestamptz,
 primary key(tenant_id,id), employee_id uuid not null, foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 serial text not null unique, token uuid not null default gen_random_uuid() unique, valid_from date not null, valid_until date not null, revoked_at timestamptz, issuer text not null, blood_group text not null default '', emergency_phone text not null default '', photo_data text not null default '', notes text not null default '',check(valid_until>=valid_from),check(length(photo_data)<400000)
);
create index employee_id_cards_employee on public.employee_id_cards(tenant_id,employee_id,created_at desc,id) where deleted_at is null;
create index employees_directory on public.employees(tenant_id,full_name,id) where deleted_at is null;
create index employees_grade on public.employees(tenant_id,grade_id);
create index employees_supervisor on public.employees(tenant_id,supervisor_id);
create index employee_postings_site on public.employee_postings(tenant_id,site_id,starts_on,ends_on);
create index employee_postings_post on public.employee_postings(tenant_id,post_id);
create index employee_attendance_site on public.employee_attendance(tenant_id,site_id);
create index employee_verification_expiry on public.employee_verifications(tenant_id,expires_on) where deleted_at is null;
create index employee_document_expiry on public.employee_documents(tenant_id,expires_on) where deleted_at is null;
create index employee_payment_slip on public.employee_payments(tenant_id,payslip_id);
create index employee_slip_salary on public.employee_payslips(tenant_id,salary_id);
create unique index employee_document_previous on public.employee_documents(tenant_id,previous_id) where previous_id is not null;
create unique index employee_active_card on public.employee_id_cards(tenant_id,employee_id) where revoked_at is null and deleted_at is null;
create unique index employee_released_payslip on public.employee_payslips(tenant_id,employee_id,month) where status='released' and deleted_at is null;
create unique index employee_payment_reference on public.employee_payments(tenant_id,reference) where reference<>'' and status='paid' and deleted_at is null;
create function sdc_private.is_hr(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships where tenant_id=t and user_id=auth.uid() and active and role in ('admin','hr_payroll'))
$$;
create function sdc_private.is_employee_self(t uuid,e uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.employees x join public.memberships m on m.tenant_id=x.tenant_id and m.id=x.membership_id where x.tenant_id=t and x.id=e and x.deleted_at is null and x.status<>'exited' and m.user_id=auth.uid() and m.active)
$$;
create function sdc_private.can_employee(t uuid,e uuid) returns boolean language sql stable security definer set search_path='' as $$
 select sdc_private.is_hr(t) or sdc_private.is_operator(t) or sdc_private.is_employee_self(t,e) or exists(
 select 1 from public.memberships m join public.member_scopes g on g.tenant_id=m.tenant_id and g.membership_id=m.id
 join public.employee_postings p on p.tenant_id=m.tenant_id and p.site_id=g.site_id
 where m.tenant_id=t and m.user_id=auth.uid() and m.active and m.role='site_lead' and p.employee_id=e and p.deleted_at is null and p.starts_on<=current_date and (p.ends_on is null or p.ends_on>=current_date))
$$;
create function sdc_private.employee_manager(t uuid,e uuid) returns boolean language sql stable security definer set search_path='' as $$
 select sdc_private.is_hr(t) or sdc_private.is_operator(t) or (sdc_private.can_employee(t,e) and exists(select 1 from public.memberships where tenant_id=t and user_id=auth.uid() and active and role='site_lead'))
$$;
revoke all on function sdc_private.is_hr(uuid),sdc_private.is_employee_self(uuid,uuid),sdc_private.can_employee(uuid,uuid),sdc_private.employee_manager(uuid,uuid) from public,anon;
grant execute on function sdc_private.is_hr(uuid),sdc_private.is_employee_self(uuid,uuid),sdc_private.can_employee(uuid,uuid),sdc_private.employee_manager(uuid,uuid) to authenticated;
-- HR can read foundation reference data without gaining client-management writes.
create policy hr_grades on public.grades for select to authenticated using(sdc_private.is_hr(tenant_id));
create policy hr_sites on public.sites for select to authenticated using(sdc_private.is_hr(tenant_id));
create policy hr_posts on public.posts for select to authenticated using(sdc_private.is_hr(tenant_id));
create policy hr_shifts on public.shift_templates for select to authenticated using(sdc_private.is_hr(tenant_id));
create policy hr_clients on public.clients for select to authenticated using(sdc_private.is_hr(tenant_id));
-- Detailed foundation audit contains operational values; employee audit redacts private/pay data.
create policy hr_employee_audit on public.audit_events for select to authenticated using(sdc_private.is_hr(tenant_id) and entity_type like 'employee%');
alter table public.employees enable row level security;
revoke all on public.employees from anon,authenticated;
grant select,insert,update on public.employees to authenticated;
create policy employee_read on public.employees for select to authenticated using(sdc_private.can_employee(tenant_id,id));
create policy employee_insert on public.employees for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_update on public.employees for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employees for each row execute function sdc_private.stamp_change();
alter table public.employee_private_profiles enable row level security;
revoke all on public.employee_private_profiles from anon,authenticated;
grant select,insert,update on public.employee_private_profiles to authenticated;
create policy employee_read on public.employee_private_profiles for select to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id)));
create policy employee_insert on public.employee_private_profiles for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_update on public.employee_private_profiles for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employee_private_profiles for each row execute function sdc_private.stamp_change();
alter table public.employee_verifications enable row level security;
revoke all on public.employee_verifications from anon,authenticated;
grant select,insert,update on public.employee_verifications to authenticated;
create policy employee_read on public.employee_verifications for select to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id)));
create policy employee_insert on public.employee_verifications for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_update on public.employee_verifications for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employee_verifications for each row execute function sdc_private.stamp_change();
alter table public.employee_events enable row level security;
revoke all on public.employee_events from anon,authenticated;
grant select,insert,update on public.employee_events to authenticated;
create policy employee_read on public.employee_events for select to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id)));
create policy employee_insert on public.employee_events for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_update on public.employee_events for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employee_events for each row execute function sdc_private.stamp_change();
alter table public.employee_postings enable row level security;
revoke all on public.employee_postings from anon,authenticated;
grant select,insert,update on public.employee_postings to authenticated;
create policy employee_read on public.employee_postings for select to authenticated using(sdc_private.can_employee(tenant_id,employee_id));
create policy employee_insert on public.employee_postings for insert to authenticated with check((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id)));
create policy employee_update on public.employee_postings for update to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id))) with check((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id)));
create trigger a_stamp before insert or update on public.employee_postings for each row execute function sdc_private.stamp_change();
alter table public.employee_attendance enable row level security;
revoke all on public.employee_attendance from anon,authenticated;
grant select,insert,update on public.employee_attendance to authenticated;
create policy employee_read on public.employee_attendance for select to authenticated using(sdc_private.can_employee(tenant_id,employee_id));
create policy employee_insert on public.employee_attendance for insert to authenticated with check(sdc_private.employee_manager(tenant_id,employee_id));
create policy employee_update on public.employee_attendance for update to authenticated using(sdc_private.employee_manager(tenant_id,employee_id)) with check(sdc_private.employee_manager(tenant_id,employee_id));
create trigger a_stamp before insert or update on public.employee_attendance for each row execute function sdc_private.stamp_change();
alter table public.employee_leave_balances enable row level security;
revoke all on public.employee_leave_balances from anon,authenticated;
grant select,insert,update on public.employee_leave_balances to authenticated;
create policy employee_read on public.employee_leave_balances for select to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id)));
create policy employee_insert on public.employee_leave_balances for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_update on public.employee_leave_balances for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employee_leave_balances for each row execute function sdc_private.stamp_change();
alter table public.employee_leave_requests enable row level security;
revoke all on public.employee_leave_requests from anon,authenticated;
grant select,insert,update on public.employee_leave_requests to authenticated;
create policy employee_read on public.employee_leave_requests for select to authenticated using(sdc_private.can_employee(tenant_id,employee_id));
create policy employee_insert on public.employee_leave_requests for insert to authenticated with check(sdc_private.employee_manager(tenant_id,employee_id));
create policy employee_update on public.employee_leave_requests for update to authenticated using(sdc_private.employee_manager(tenant_id,employee_id)) with check(sdc_private.employee_manager(tenant_id,employee_id));
create trigger a_stamp before insert or update on public.employee_leave_requests for each row execute function sdc_private.stamp_change();
alter table public.employee_salary_structures enable row level security;
revoke all on public.employee_salary_structures from anon,authenticated;
grant select,insert,update on public.employee_salary_structures to authenticated;
create policy employee_read on public.employee_salary_structures for select to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id)));
create policy employee_insert on public.employee_salary_structures for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_update on public.employee_salary_structures for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employee_salary_structures for each row execute function sdc_private.stamp_change();
alter table public.employee_payslips enable row level security;
revoke all on public.employee_payslips from anon,authenticated;
grant select,insert,update on public.employee_payslips to authenticated;
create policy employee_read on public.employee_payslips for select to authenticated using((sdc_private.is_hr(tenant_id) or (sdc_private.is_employee_self(tenant_id,employee_id) and status='released')));
create policy employee_insert on public.employee_payslips for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_update on public.employee_payslips for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employee_payslips for each row execute function sdc_private.stamp_change();
alter table public.employee_payments enable row level security;
revoke all on public.employee_payments from anon,authenticated;
grant select,insert,update on public.employee_payments to authenticated;
create policy employee_read on public.employee_payments for select to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id)));
create policy employee_insert on public.employee_payments for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_update on public.employee_payments for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employee_payments for each row execute function sdc_private.stamp_change();
alter table public.employee_assets enable row level security;
revoke all on public.employee_assets from anon,authenticated;
grant select,insert,update on public.employee_assets to authenticated;
create policy employee_read on public.employee_assets for select to authenticated using(sdc_private.can_employee(tenant_id,employee_id));
create policy employee_insert on public.employee_assets for insert to authenticated with check((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id)));
create policy employee_update on public.employee_assets for update to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id))) with check((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id)));
create trigger a_stamp before insert or update on public.employee_assets for each row execute function sdc_private.stamp_change();
alter table public.employee_certificates enable row level security;
revoke all on public.employee_certificates from anon,authenticated;
grant select,insert,update on public.employee_certificates to authenticated;
create policy employee_read on public.employee_certificates for select to authenticated using(sdc_private.can_employee(tenant_id,employee_id));
create policy employee_insert on public.employee_certificates for insert to authenticated with check((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id)));
create policy employee_update on public.employee_certificates for update to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id))) with check((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id)));
create trigger a_stamp before insert or update on public.employee_certificates for each row execute function sdc_private.stamp_change();
alter table public.employee_documents enable row level security;
revoke all on public.employee_documents from anon,authenticated;
grant select,insert,update on public.employee_documents to authenticated;
create policy employee_read on public.employee_documents for select to authenticated using(((category='photo' and sdc_private.can_employee(tenant_id,employee_id)) or sdc_private.is_hr(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id)));
create policy employee_insert on public.employee_documents for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_update on public.employee_documents for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employee_documents for each row execute function sdc_private.stamp_change();
alter table public.employee_id_cards enable row level security;
revoke all on public.employee_id_cards from anon,authenticated;
grant select,insert,update on public.employee_id_cards to authenticated;
create policy employee_read on public.employee_id_cards for select to authenticated using(sdc_private.can_employee(tenant_id,employee_id));
create policy employee_insert on public.employee_id_cards for insert to authenticated with check((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id)));
create policy employee_update on public.employee_id_cards for update to authenticated using((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id))) with check((sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id)));
create trigger a_stamp before insert or update on public.employee_id_cards for each row execute function sdc_private.stamp_change();

create function sdc_private.employee_validate() returns trigger language plpgsql set search_path='' as $$
declare e uuid; collision boolean; paid bigint; payable bigint; available numeric; taken numeric;
begin
 if TG_TABLE_NAME='employees' then
  if not exists(select 1 from public.grades where tenant_id=new.tenant_id and id=new.grade_id and deleted_at is null) then raise exception 'Choose an active grade';end if;
  if new.photo_url<>'' and new.photo_url !~ '^/api/employees/photo\?' then raise exception 'Photos must use the private employee document service';end if;
  if TG_OP='UPDATE' and new.status='exited' and old.status<>'exited' then
   update public.employee_id_cards set revoked_at=now(),row_version=row_version+1 where tenant_id=new.tenant_id and employee_id=new.id and revoked_at is null and deleted_at is null;
   update public.employee_postings set ends_on=greatest(starts_on,new.exited_on),deleted_at=case when starts_on>new.exited_on then now() else null end,row_version=row_version+1 where tenant_id=new.tenant_id and employee_id=new.id and deleted_at is null and (ends_on is null or ends_on>new.exited_on);
  end if;
  return new;
 end if;
 e=new.employee_id;
 if TG_OP='UPDATE' and (new.employee_id<>old.employee_id) then raise exception 'Employee ownership is immutable';end if;
 perform pg_advisory_xact_lock(hashtextextended(new.tenant_id::text||e::text,0));
 if not exists(select 1 from public.employees where tenant_id=new.tenant_id and id=e and deleted_at is null) then raise exception 'Employee unavailable';end if;
 if TG_TABLE_NAME in ('employee_postings','employee_salary_structures') and new.deleted_at is null then
  if TG_TABLE_NAME='employee_postings' then
   if not exists(select 1 from public.posts where tenant_id=new.tenant_id and id=new.post_id and site_id=new.site_id and deleted_at is null) then raise exception 'The post does not belong to this active site';end if;
   if exists(select 1 from public.employees where tenant_id=new.tenant_id and id=e and (status in ('exited','suspended') or joined_on>new.starts_on)) then raise exception 'Employee is not eligible for this posting';end if;
   select exists(select 1 from public.employee_postings x where x.tenant_id=new.tenant_id and x.employee_id=e and x.id<>new.id and x.deleted_at is null and daterange(x.starts_on,x.ends_on,'[]') && daterange(new.starts_on,new.ends_on,'[]')) into collision;
  else
   select exists(select 1 from public.employee_salary_structures x where x.tenant_id=new.tenant_id and x.employee_id=e and x.id<>new.id and x.deleted_at is null and daterange(x.starts_on,x.ends_on,'[]') && daterange(new.starts_on,new.ends_on,'[]')) into collision;
  end if;
  if collision then raise exception 'An effective record already covers these dates';end if;
 end if;
 if TG_TABLE_NAME='employee_leave_requests' then
 if new.status='approved' and new.deleted_at is null then
  if extract(year from new.starts_on)<>extract(year from new.ends_on) then raise exception 'Split leave requests at the year boundary';end if;
  if exists(select 1 from public.employee_leave_requests x where x.tenant_id=new.tenant_id and x.employee_id=e and x.id<>new.id and x.status='approved' and x.deleted_at is null and daterange(x.starts_on,x.ends_on,'[]') && daterange(new.starts_on,new.ends_on,'[]')) then raise exception 'Approved leave already covers these dates';end if;
  if new.leave_type<>'unpaid' then
   select entitled_days into available from public.employee_leave_balances where tenant_id=new.tenant_id and employee_id=e and leave_type=new.leave_type and year=extract(year from new.starts_on) and deleted_at is null;
   select coalesce(sum(ends_on-starts_on+1),0) into taken from public.employee_leave_requests where tenant_id=new.tenant_id and employee_id=e and leave_type=new.leave_type and status='approved' and deleted_at is null and id<>new.id and extract(year from starts_on)=extract(year from new.starts_on);
   if coalesce(available,0)-taken<new.ends_on-new.starts_on+1 then raise exception 'Insufficient leave balance';end if;
  end if;
 end if;
 end if;
 if TG_TABLE_NAME='employee_payments' then
 if TG_OP='UPDATE' and exists(select 1 from public.employee_advances where tenant_id=new.tenant_id and payment_id=new.id) and (new.amount_paise<>old.amount_paise or new.status<>old.status or new.kind<>old.kind or new.deleted_at is distinct from old.deleted_at) then raise exception 'A payment linked to a repayment schedule cannot be changed';end if;
 if new.payslip_id is not null then
  select net_paise into payable from public.employee_payslips where tenant_id=new.tenant_id and id=new.payslip_id and employee_id=e and status='released' and deleted_at is null;
  if payable is null then raise exception 'Choose a released payslip for this employee';end if;
  if new.status='paid' and new.deleted_at is null then
   select coalesce(sum(amount_paise),0) into paid from public.employee_payments where tenant_id=new.tenant_id and payslip_id=new.payslip_id and status='paid' and deleted_at is null and id<>new.id;
   if paid+new.amount_paise>payable then raise exception 'Payment exceeds the remaining payslip balance';end if;
  end if;
 end if;
 end if;
 if TG_TABLE_NAME='employee_advances' then
  if not exists(select 1 from public.employee_payments where tenant_id=new.tenant_id and employee_id=e and id=new.payment_id and kind='advance' and status='paid' and deleted_at is null and amount_paise=new.principal_paise) then raise exception 'Link the paid advance payment with the same principal amount';end if;
  if TG_OP='UPDATE' and exists(select 1 from public.employee_payslips where tenant_id=new.tenant_id and employee_id=e and status='released' and breakdown->'advance_recoveries' @> jsonb_build_array(jsonb_build_object('advance_id',new.id::text))) and (new.principal_paise<>old.principal_paise or new.payment_id<>old.payment_id or new.installment_paise<>old.installment_paise or new.starts_on<>old.starts_on) then raise exception 'An advance schedule used in released payroll is immutable';end if;
 end if;
 if TG_TABLE_NAME='employee_documents' then
  if TG_OP='UPDATE' and (new.object_path<>old.object_path or new.version<>old.version or new.previous_id is distinct from old.previous_id) then raise exception 'Upload a new document version instead of replacing its content';end if;
  if new.previous_id is not null and not exists(select 1 from public.employee_documents where tenant_id=new.tenant_id and id=new.previous_id and employee_id=e and category=new.category and version=new.version-1) then raise exception 'Invalid document revision';end if;
  if new.previous_id is null and new.version<>1 then raise exception 'The first document version must be 1';end if;
 end if;
 if TG_TABLE_NAME='employee_id_cards' then
  if TG_OP='UPDATE' and (new.token<>old.token or new.serial<>old.serial or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at)) then raise exception 'Issued card identity and revocation are immutable';end if;
  if exists(select 1 from public.employees where tenant_id=new.tenant_id and id=e and status<>'active') and new.revoked_at is null then raise exception 'Identity cards require active employment';end if;
  if new.photo_data<>'' and new.photo_data !~ '^data:image/(png|jpeg);base64,[A-Za-z0-9+/=]+$' then raise exception 'Invalid card photo';end if;
 end if;
 return new;
end $$;
create function sdc_private.employee_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,before_data,after_data)
 values(new.tenant_id,auth.uid(),case when TG_OP='INSERT' then 'created' when new.deleted_at is not null then 'archived' else 'updated' end,TG_TABLE_NAME,new.id,
 case when TG_OP='UPDATE' then jsonb_build_object('row_version',old.row_version) end,
 jsonb_build_object('row_version',new.row_version,'employee_id',coalesce(to_jsonb(new)->'employee_id',to_jsonb(new)->'id')));
 return new;
end $$;
revoke all on function sdc_private.employee_validate(),sdc_private.employee_audit() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['employees','employee_private_profiles','employee_verifications','employee_events','employee_postings','employee_attendance','employee_leave_balances','employee_leave_requests','employee_salary_structures','employee_payslips','employee_payments','employee_assets','employee_certificates','employee_documents','employee_id_cards'] loop
  execute format('create trigger b_employee_validate before insert or update on public.%I for each row execute function sdc_private.employee_validate()',t);
  execute format('create trigger z_employee_audit after insert or update on public.%I for each row execute function sdc_private.employee_audit()',t);
 end loop;
end $$;

create function public.employee_access_audit(p_tenant uuid,p_employee uuid,p_action text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not sdc_private.can_employee(p_tenant,p_employee) then raise exception 'Access denied' using errcode='42501';end if;
 if p_action not in ('private_reveal','document_download','id_card_download','payslip_download','profile_export') or length(trim(p_reason))<5 or length(p_reason)>300 then raise exception 'A valid reason is required';end if;
 if p_action in ('private_reveal','payslip_download') and not (sdc_private.is_hr(p_tenant) or sdc_private.is_employee_self(p_tenant,p_employee)) then raise exception 'Access denied' using errcode='42501';end if;
 insert into public.audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,after_data) values(p_tenant,auth.uid(),p_action,'employees',p_employee,jsonb_build_object('reason',p_reason));
end $$;
revoke all on function public.employee_access_audit(uuid,uuid,text,text) from public,anon;
grant execute on function public.employee_access_audit(uuid,uuid,text,text) to authenticated;

create function public.verify_employee_card(p_token uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',e.full_name,'photo',c.photo_data,'status',case when c.revoked_at is not null or c.deleted_at is not null or e.status<>'active' or e.deleted_at is not null then 'revoked' when current_date>c.valid_until then 'expired' when current_date<c.valid_from then 'not_yet_valid' else 'valid' end,'valid_from',c.valid_from,'valid_until',c.valid_until)
 from public.employee_id_cards c join public.employees e on e.tenant_id=c.tenant_id and e.id=c.employee_id where c.token=p_token
$$;
revoke all on function public.verify_employee_card(uuid) from public;
grant execute on function public.verify_employee_card(uuid) to anon,authenticated;

-- Self-service leave has a separate, narrowly authorized insertion path.
create policy leave_self_create on public.employee_leave_requests for insert to authenticated with check(sdc_private.is_employee_self(tenant_id,employee_id) and status='requested' and decision_note='');

-- Private documents: immutable object names, no public bucket and no upserts.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('sdc-employees','sdc-employees',false,10485760,array['application/pdf','image/png','image/jpeg']) on conflict(id) do nothing;
create policy employee_file_insert on storage.objects for insert to authenticated with check(bucket_id='sdc-employees' and sdc_private.is_hr((storage.foldername(name))[1]::uuid));
create policy employee_file_read on storage.objects for select to authenticated using(bucket_id='sdc-employees' and (sdc_private.is_hr((storage.foldername(name))[1]::uuid) or exists(select 1 from public.employee_documents d where d.object_path=name and d.deleted_at is null)));
create policy employee_file_orphan_delete on storage.objects for delete to authenticated using(bucket_id='sdc-employees' and sdc_private.is_hr((storage.foldername(name))[1]::uuid) and not exists(select 1 from public.employee_documents d where d.object_path=name));


create table public.employee_advances (
 id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),employee_id uuid not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,
 primary key(tenant_id,id),foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),
 payment_id uuid not null,principal_paise integer not null check(principal_paise>0),installment_paise integer not null check(installment_paise>0 and installment_paise<=principal_paise),
 starts_on date not null check(extract(day from starts_on)=1),status text not null default 'active' check(status in ('active','closed')),notes text not null default '',
 foreign key(tenant_id,payment_id) references public.employee_payments(tenant_id,id),unique(tenant_id,payment_id)
);
create index employee_advances_history on public.employee_advances(tenant_id,employee_id,created_at desc,id desc);
alter table public.employee_advances enable row level security;
revoke all on public.employee_advances from public,anon,authenticated;
grant select,insert,update on public.employee_advances to authenticated;
create policy employee_advance_read on public.employee_advances for select to authenticated using(sdc_private.is_hr(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id));
create policy employee_advance_insert on public.employee_advances for insert to authenticated with check(sdc_private.is_hr(tenant_id));
create policy employee_advance_update on public.employee_advances for update to authenticated using(sdc_private.is_hr(tenant_id)) with check(sdc_private.is_hr(tenant_id));
create trigger a_stamp before insert or update on public.employee_advances for each row execute function sdc_private.stamp_change();
create trigger b_employee_validate before insert or update on public.employee_advances for each row execute function sdc_private.employee_validate();
create trigger z_employee_audit after insert or update on public.employee_advances for each row execute function sdc_private.employee_audit();

-- Payroll amounts can only be created/released by this transactional calculator.
revoke insert,update on public.employee_payslips from authenticated;
create function public.employee_run_payroll(p_tenant uuid,p_employees uuid[],p_month date,p_release boolean default false,p_reason text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare eid uuid; emp public.employees; a public.employee_attendance; salary public.employee_salary_structures; d date; last_day date; nd integer;
 advance public.employee_advances; recovered bigint; installment bigint; recoveries bigint; recovery_lines jsonb;
 paid integer; ot integer; gross numeric; deductions numeric; basic numeric; da numeric; hra numeric; allow numeric; otpay numeric; pf numeric; esi numeric; fixed numeric;
 minimum_ok boolean; rules_ok boolean; rev integer; sid uuid; previous public.employee_payslips; result jsonb='[]'; item public.employee_payslips; snapshots jsonb;
begin
 if auth.uid() is null or not sdc_private.is_hr(p_tenant) then raise exception 'Payroll is restricted to HR and administrators' using errcode='42501';end if;
 if extract(day from p_month)<>1 or p_month>date_trunc('month',current_date)::date or coalesce(array_length(p_employees,1),0) not between 1 and 200 then raise exception 'Choose a valid month and 1–200 employees';end if;
 last_day=(p_month+interval '1 month - 1 day')::date;nd=extract(day from last_day);
 for eid in select distinct unnest(p_employees) loop
  perform pg_advisory_xact_lock(hashtextextended(p_tenant::text||eid::text,0));
  select * into emp from public.employees where tenant_id=p_tenant and id=eid and deleted_at is null;
  if not found then raise exception 'Employee not found in this workspace';end if;
  if emp.joined_on>last_day or emp.exited_on<p_month then raise exception 'Employee was not employed during this month';end if;
  select * into previous from public.employee_payslips where tenant_id=p_tenant and employee_id=eid and month=p_month and status='released' and deleted_at is null;
  if found then
   if length(trim(p_reason))<5 then raise exception 'Provide a reason for correcting a released payslip';end if;
   if exists(select 1 from public.employee_payments where tenant_id=p_tenant and payslip_id=previous.id and status='paid' and deleted_at is null) then raise exception 'Paid payslips cannot be replaced. Record the adjustment in a later period';end if;
  end if;
  paid=0;ot=0;basic=0;da=0;hra=0;allow=0;otpay=0;pf=0;esi=0;fixed=0;minimum_ok=true;rules_ok=true;snapshots='[]';sid=null;
  for d in select generate_series(greatest(p_month,emp.joined_on),least(last_day,coalesce(emp.exited_on,last_day)),interval '1 day')::date loop
   select * into a from public.employee_attendance where tenant_id=p_tenant and employee_id=eid and work_date=d and approval='approved' and deleted_at is null;
   if not found then raise exception 'Approve attendance for every employed day before running payroll (% on %)',emp.employee_code,d;end if;
   select * into salary from public.employee_salary_structures where tenant_id=p_tenant and employee_id=eid and starts_on<=d and (ends_on is null or ends_on>=d) and deleted_at is null;
   if not found then raise exception 'Missing effective salary for % on %',emp.employee_code,d;end if;
   sid=salary.id;rules_ok=rules_ok and salary.rule_approved and length(trim(salary.rule_source))>=5;
   minimum_ok=minimum_ok and salary.basic_paise+salary.da_paise>=salary.minimum_wage_paise;
   fixed=salary.pt_paise+salary.lwf_paise+salary.tds_paise+salary.other_deduction_paise;
   snapshots=snapshots||jsonb_build_array(jsonb_build_object('date',d,'attendance_id',a.id,'attendance_revision',a.row_version,'salary_id',salary.id,'salary_revision',salary.row_version,'salary_values',to_jsonb(salary)-'created_by'-'updated_by','status',a.status,'overtime_minutes',a.overtime_minutes,'rule_source',salary.rule_source));
   if a.status in ('present','weekly_off','paid_leave') then
    paid=paid+1;basic=basic+salary.basic_paise::numeric/nd;da=da+salary.da_paise::numeric/nd;hra=hra+salary.hra_paise::numeric/nd;
    allow=allow+(salary.conveyance_paise::numeric+salary.washing_paise+salary.special_paise+salary.site_allowance_paise)/nd;
    pf=pf+(case when salary.pf_ceiling_paise>0 then least(salary.basic_paise+salary.da_paise,salary.pf_ceiling_paise) else salary.basic_paise+salary.da_paise end)::numeric/nd*salary.pf_basis_points/10000;
    esi=esi+(salary.basic_paise::numeric+salary.da_paise+salary.hra_paise+salary.conveyance_paise+salary.washing_paise+salary.special_paise+salary.site_allowance_paise)/nd*salary.esi_basis_points/10000;
   end if;
   if a.status='present' then ot=ot+a.overtime_minutes;otpay=otpay+a.overtime_minutes::numeric*salary.overtime_hour_paise/60;esi=esi+a.overtime_minutes::numeric*salary.overtime_hour_paise/60*salary.esi_basis_points/10000;end if;
  end loop;
  if p_release and (not minimum_ok or not rules_ok) then raise exception 'Release blocked: review the minimum wage and approve every effective salary rule';end if;
  recoveries=0;recovery_lines='[]';
  if exists(select 1 from public.employee_advances where tenant_id=p_tenant and employee_id=eid and status='active' and deleted_at is null) and exists(select 1 from public.employee_payslips where tenant_id=p_tenant and employee_id=eid and month>p_month and status='released' and deleted_at is null) then raise exception 'Employees with advance recovery must run payroll in chronological month order';end if;
  for advance in select * from public.employee_advances where tenant_id=p_tenant and employee_id=eid and status='active' and starts_on<=p_month and deleted_at is null loop
   select coalesce(sum((line->>'amount_paise')::bigint),0) into recovered from public.employee_payslips ps cross join lateral jsonb_array_elements(coalesce(ps.breakdown->'advance_recoveries','[]')) line where ps.tenant_id=p_tenant and ps.employee_id=eid and ps.status='released' and ps.deleted_at is null and ps.month<>p_month and line->>'advance_id'=advance.id::text;
   installment=least(advance.installment_paise,greatest(0,advance.principal_paise-recovered));recoveries=recoveries+installment;
   if installment>0 then recovery_lines=recovery_lines||jsonb_build_array(jsonb_build_object('advance_id',advance.id,'amount_paise',installment,'principal_paise',advance.principal_paise));end if;
  end loop;
  basic=round(basic);da=round(da);hra=round(hra);allow=round(allow);otpay=round(otpay);pf=round(pf);esi=round(esi);gross=basic+da+hra+allow+otpay;deductions=pf+esi+fixed+recoveries;
  if deductions>gross then raise exception 'Deductions exceed gross pay for %',emp.employee_code;end if;
  select coalesce(max(revision),0)+1 into rev from public.employee_payslips where tenant_id=p_tenant and employee_id=eid and month=p_month;
  if p_release and previous.id is not null then update public.employee_payslips set status='superseded',row_version=row_version+1 where tenant_id=p_tenant and id=previous.id;end if;
  insert into public.employee_payslips(tenant_id,employee_id,month,revision,status,salary_id,paid_days,overtime_minutes,gross_paise,deduction_paise,net_paise,breakdown,released_at,correction_reason)
  values(p_tenant,eid,p_month,rev,case when p_release then 'released' else 'draft' end,sid,paid,ot,gross,deductions,gross-deductions,jsonb_build_object('basic',basic,'da',da,'hra',hra,'allowances',allow,'overtime',otpay,'pf',pf,'esi',esi,'fixed_deductions',fixed,'advance_deductions',recoveries,'advance_recoveries',recovery_lines,'calendar_days',nd,'minimum_wage_ok',minimum_ok,'rules_approved',rules_ok,'snapshots',snapshots),case when p_release then now() end,p_reason) returning * into item;
  result=result||jsonb_build_array(jsonb_build_object('id',item.id,'employee_id',eid,'net_paise',item.net_paise,'status',item.status,'revision',item.revision));
 end loop;
 return result;
end $$;
revoke all on function public.employee_run_payroll(uuid,uuid[],date,boolean,text) from public,anon;
grant execute on function public.employee_run_payroll(uuid,uuid[],date,boolean,text) to authenticated;

-- Preserve full revisions in a separate HR-only history; general operations audit
-- carries metadata only. Encrypted personal fields stay encrypted in revisions.
create table public.employee_record_history (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,employee_id uuid not null,
 entity_type text not null,entity_id uuid not null,created_at timestamptz not null default now(),
 actor_user_id uuid,action text not null,before_data jsonb,after_data jsonb not null,
 foreign key(tenant_id,employee_id) references public.employees(tenant_id,id)
);
create index employee_record_history_lookup on public.employee_record_history(tenant_id,employee_id,created_at desc,id desc);
alter table public.employee_record_history enable row level security;
revoke all on public.employee_record_history from public,anon,authenticated;
grant select on public.employee_record_history to authenticated;
create policy employee_history_read on public.employee_record_history for select to authenticated using(sdc_private.is_hr(tenant_id));
create or replace function sdc_private.employee_audit() returns trigger language plpgsql security definer set search_path='' as $$
declare eid uuid; verb text;
begin
 eid=coalesce((to_jsonb(new)->>'employee_id')::uuid,new.id);
 verb=case when TG_OP='INSERT' then 'created' when new.deleted_at is not null then 'archived' else 'updated' end;
 insert into public.audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,before_data,after_data)
 values(new.tenant_id,auth.uid(),verb,TG_TABLE_NAME,new.id,case when TG_OP='UPDATE' then jsonb_build_object('row_version',old.row_version) end,jsonb_build_object('row_version',new.row_version,'employee_id',eid));
 insert into public.employee_record_history(tenant_id,employee_id,entity_type,entity_id,actor_user_id,action,before_data,after_data)
 values(new.tenant_id,eid,TG_TABLE_NAME,new.id,auth.uid(),verb,case when TG_OP='UPDATE' then to_jsonb(old) end,to_jsonb(new));
 return new;
end $$;

-- A site lead can only inspect or amend attendance for their own sites.
drop policy employee_read on public.employee_attendance;
drop policy employee_insert on public.employee_attendance;
drop policy employee_update on public.employee_attendance;
create policy employee_read on public.employee_attendance for select to authenticated using(
 sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id)
 or (sdc_private.employee_manager(tenant_id,employee_id) and sdc_private.can_site(tenant_id,site_id)));
create policy employee_insert on public.employee_attendance for insert to authenticated with check(
 sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id) or (sdc_private.employee_manager(tenant_id,employee_id) and sdc_private.can_site(tenant_id,site_id)));
create policy employee_update on public.employee_attendance for update to authenticated using(
 sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id) or (sdc_private.employee_manager(tenant_id,employee_id) and sdc_private.can_site(tenant_id,site_id))) with check(
 sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id) or (sdc_private.employee_manager(tenant_id,employee_id) and sdc_private.can_site(tenant_id,site_id)));
drop policy employee_read on public.employee_postings;
create policy employee_read on public.employee_postings for select to authenticated using(
 sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id) or sdc_private.is_employee_self(tenant_id,employee_id)
 or (sdc_private.employee_manager(tenant_id,employee_id) and sdc_private.can_site(tenant_id,site_id)));

-- Online self-service check-in. Device coordinates are treated as evidence;
-- manager approval remains mandatory before attendance is used in payroll.
alter table public.employee_attendance add column latitude double precision,
 add column longitude double precision,add column accuracy_metres numeric,
 add constraint employee_attendance_evidence foreign key(tenant_id,evidence_document_id) references public.employee_documents(tenant_id,id);
create index employee_attendance_evidence on public.employee_attendance(tenant_id,evidence_document_id);
create policy employee_selfie_metadata on public.employee_documents for insert to authenticated with check(category='selfie' and previous_id is null and version=1 and mime_type in ('image/png','image/jpeg') and sdc_private.is_employee_self(tenant_id,employee_id));
create policy employee_selfie_upload on storage.objects for insert to authenticated with check(bucket_id='sdc-employees' and (storage.foldername(name))[4]='selfie' and sdc_private.is_employee_self((storage.foldername(name))[1]::uuid,(storage.foldername(name))[2]::uuid));
create policy employee_selfie_orphan_cleanup on storage.objects for delete to authenticated using(bucket_id='sdc-employees' and (storage.foldername(name))[4]='selfie' and sdc_private.is_employee_self((storage.foldername(name))[1]::uuid,(storage.foldername(name))[2]::uuid) and not exists(select 1 from public.employee_documents where object_path=name));
create function public.employee_check_attendance(p_tenant uuid,p_employee uuid,p_action text,p_latitude double precision,p_longitude double precision,p_accuracy numeric,p_document uuid default null)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare assignment public.employee_postings; location public.sites; attendance public.employee_attendance; distance_m double precision;workday date=(now() at time zone 'Asia/Kolkata')::date;
begin
 if auth.uid() is null or not sdc_private.is_employee_self(p_tenant,p_employee) then raise exception 'Only your own attendance can be submitted' using errcode='42501';end if;
 if p_action is null or p_action not in ('check_in','check_out') or p_latitude is null or p_longitude is null or p_accuracy is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 or p_accuracy not between 0 and 100 then raise exception 'A GPS fix with accuracy within 100 metres is required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text||p_employee::text,0));
 if p_action='check_out' then
  select * into attendance from public.employee_attendance where tenant_id=p_tenant and employee_id=p_employee and check_in is not null and check_out is null and check_in>now()-interval '24 hours' and source='gps' and deleted_at is null order by check_in desc limit 1;
  if not found then raise exception 'No open check-in in the past 24 hours';end if;
  select * into location from public.sites where tenant_id=p_tenant and id=attendance.site_id and deleted_at is null;
 else
  select * into assignment from public.employee_postings where tenant_id=p_tenant and employee_id=p_employee and starts_on<=workday and (ends_on is null or ends_on>=workday) and deleted_at is null;
  if not found then raise exception 'A current site posting is required';end if;
  select * into location from public.sites where tenant_id=p_tenant and id=assignment.site_id and deleted_at is null;
 end if;
 if location.id is null or location.latitude is null or location.longitude is null then raise exception 'The site needs a configured GPS geofence';end if;
 distance_m=6371000*2*asin(sqrt(least(1.0,power(sin(radians(p_latitude-location.latitude)/2),2)+cos(radians(location.latitude))*cos(radians(p_latitude))*power(sin(radians(p_longitude-location.longitude)/2),2))));
 if distance_m+p_accuracy>location.geofence_radius then raise exception 'Your GPS position and accuracy must fall inside the site geofence';end if;
 if p_action='check_out' then
  if attendance.approval='approved' then raise exception 'Approved attendance must be corrected by a manager';end if;
  update public.employee_attendance set check_out=now(),row_version=row_version+1 where tenant_id=p_tenant and id=attendance.id returning * into attendance;
 else
  if not exists(select 1 from public.employee_documents where tenant_id=p_tenant and employee_id=p_employee and id=p_document and category='selfie' and created_at>now()-interval '10 minutes' and created_by=auth.uid() and deleted_at is null) then raise exception 'Upload a fresh selfie before checking in';end if;
  insert into public.employee_attendance(tenant_id,employee_id,work_date,check_in,status,approval,source,site_id,evidence_document_id,latitude,longitude,accuracy_metres)
  values(p_tenant,p_employee,workday,now(),'present','pending','gps',location.id,p_document,p_latitude,p_longitude,p_accuracy) returning * into attendance;
 end if;
 return jsonb_build_object('id',attendance.id,'check_in',attendance.check_in,'check_out',attendance.check_out,'approval',attendance.approval);
end $$;
revoke all on function public.employee_check_attendance(uuid,uuid,text,double precision,double precision,numeric,uuid) from public,anon;
grant execute on function public.employee_check_attendance(uuid,uuid,text,double precision,double precision,numeric,uuid) to authenticated;
