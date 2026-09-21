-- SDC foundation: additive PostgreSQL schema. Legacy D1 remains untouched.
create schema if not exists sdc_private;
revoke all on schema sdc_private from public;
grant usage on schema sdc_private to authenticated;

create table public.tenants (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 150),
 code text not null unique, timezone text not null default 'Asia/Kolkata' check(timezone='Asia/Kolkata'),
 is_demo boolean not null default true, created_at timestamptz not null default now()
);
create table public.memberships (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 user_id uuid not null references auth.users(id), display_name text not null,
 role text not null check(role in ('admin','operations_manager','senior_manager','site_lead','employee','hr_payroll','trainer','client_user')),
 active boolean not null default true, created_at timestamptz not null default now(),
 unique(tenant_id,user_id), unique(tenant_id,id)
);
create table public.audit_events (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 actor_user_id uuid, action text not null, entity_type text not null, entity_id uuid,
 before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
create index audit_tenant_time on public.audit_events(tenant_id,created_at desc,id);
create index audit_subject on public.audit_events(tenant_id,entity_type,entity_id,created_at desc);

create table public.clients (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 code text not null check(length(code) between 2 and 30), name text not null check(length(name) between 2 and 150),
 legal_name text not null default '', gstin text not null default '' check(gstin='' or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
 billing_address text not null default '', billing_cycle text not null default 'monthly' check(billing_cycle in ('monthly','fortnightly','quarterly')),
 contact_name text not null default '', contact_email text not null default '', contact_phone text not null default '', notes text not null default ''
);

create table public.grades (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 code text not null, name text not null, rank integer not null default 1 check(rank>0)
);

create table public.sites (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 client_id uuid not null, code text not null, name text not null check(length(name) between 2 and 150),
 site_type text not null check(site_type in ('IT park','Residential','Hospital','Factory','Bank','School','Event','Warehouse','College')),
 address text not null default '', latitude numeric check(latitude between -90 and 90), longitude numeric check(longitude between -180 and 180),
 geofence_radius integer not null default 150 check(geofence_radius between 10 and 5000),
 emergency_contacts jsonb not null default '[]' check(jsonb_typeof(emergency_contacts)='array'),
 sop_notes text not null default '', starts_on date not null default current_date, ends_on date,
 check(ends_on is null or ends_on>=starts_on), check((latitude is null)=(longitude is null)),
 foreign key(tenant_id,client_id) references public.clients(tenant_id,id), unique(tenant_id,client_id,id)
);

create table public.posts (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 site_id uuid not null, code text not null, name text not null check(length(name) between 2 and 150),
 grade_id uuid not null, location_notes text not null default '',
 foreign key(tenant_id,site_id) references public.sites(tenant_id,id),
 foreign key(tenant_id,grade_id) references public.grades(tenant_id,id), unique(tenant_id,site_id,id)
);

create table public.shift_templates (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 code text not null, name text not null, starts_at time not null, duration_minutes integer not null check(duration_minutes in (480,720)),
 break_minutes integer not null default 0 check(break_minutes>=0 and break_minutes<duration_minutes)
);

create table public.staffing_requirements (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 post_id uuid not null, shift_id uuid not null, headcount integer not null check(headcount between 1 and 100),
 weekdays integer[] not null default array[1,2,3,4,5,6,7] check(cardinality(weekdays)>0 and weekdays <@ array[1,2,3,4,5,6,7]),
 effective_from date not null, effective_to date, check(effective_to is null or effective_to>=effective_from),
 foreign key(tenant_id,post_id) references public.posts(tenant_id,id),
 foreign key(tenant_id,shift_id) references public.shift_templates(tenant_id,id)
);

create table public.contracts (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 client_id uuid not null, number text not null, starts_on date not null, ends_on date not null check(ends_on>=starts_on),
 sla_terms text not null default '', penalty_terms text not null default '', escalation_matrix jsonb not null default '[]' check(jsonb_typeof(escalation_matrix)='array'),
 foreign key(tenant_id,client_id) references public.clients(tenant_id,id)
);

create table public.rate_card_lines (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 contract_id uuid not null, grade_id uuid not null, monthly_rate_paise bigint not null check(monthly_rate_paise>=0),
 overtime_hour_paise bigint not null default 0 check(overtime_hour_paise>=0),
 foreign key(tenant_id,contract_id) references public.contracts(tenant_id,id), foreign key(tenant_id,grade_id) references public.grades(tenant_id,id)
);

create table public.foundation_documents (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 client_id uuid not null, site_id uuid, category text not null check(category in ('contract','floor_plan','sop')),
 file_name text not null, object_path text not null unique, mime_type text not null, size_bytes integer not null check(size_bytes between 1 and 10485760),
 revision integer not null default 1 check(revision>0), replaces_id uuid,
 foreign key(tenant_id,client_id) references public.clients(tenant_id,id),
 foreign key(tenant_id,client_id,site_id) references public.sites(tenant_id,client_id,id),
 foreign key(tenant_id,replaces_id) references public.foundation_documents(tenant_id,id)
);

create table public.member_scopes (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null,
 membership_id uuid not null, client_id uuid, site_id uuid,
 check((client_id is null)<>(site_id is null)),
 foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id),
 foreign key(tenant_id,client_id) references public.clients(tenant_id,id),
 foreign key(tenant_id,site_id) references public.sites(tenant_id,id)
);
create unique index scope_client_unique on public.member_scopes(membership_id,client_id) where client_id is not null;
create unique index scope_site_unique on public.member_scopes(membership_id,site_id) where site_id is not null;
create index membership_identity on public.memberships(user_id,active,tenant_id);
create index scopes_lookup on public.member_scopes(tenant_id,membership_id,client_id,site_id);
create unique index client_code on public.clients(tenant_id,code);
create unique index grade_code on public.grades(tenant_id,code);
create unique index site_code on public.sites(tenant_id,client_id,code);
create unique index post_code on public.posts(tenant_id,site_id,code);
create unique index shift_code on public.shift_templates(tenant_id,code);
create unique index contract_number on public.contracts(tenant_id,client_id,number);
create unique index rate_grade on public.rate_card_lines(tenant_id,contract_id,grade_id) where deleted_at is null;
create index clients_list on public.clients(tenant_id,created_at desc,id) where deleted_at is null;
create index grades_list on public.grades(tenant_id,created_at desc,id) where deleted_at is null;
create index sites_list on public.sites(tenant_id,created_at desc,id) where deleted_at is null;
create index posts_list on public.posts(tenant_id,created_at desc,id) where deleted_at is null;
create index shift_templates_list on public.shift_templates(tenant_id,created_at desc,id) where deleted_at is null;
create index staffing_requirements_list on public.staffing_requirements(tenant_id,created_at desc,id) where deleted_at is null;
create index contracts_list on public.contracts(tenant_id,created_at desc,id) where deleted_at is null;
create index rate_card_lines_list on public.rate_card_lines(tenant_id,created_at desc,id) where deleted_at is null;
create index foundation_documents_list on public.foundation_documents(tenant_id,created_at desc,id) where deleted_at is null;
create index sites_client_id on public.sites(tenant_id,client_id);
create index posts_site_id on public.posts(tenant_id,site_id);
create index posts_grade_id on public.posts(tenant_id,grade_id);
create index staffing_requirements_post_id on public.staffing_requirements(tenant_id,post_id);
create index staffing_requirements_shift_id on public.staffing_requirements(tenant_id,shift_id);
create index contracts_client_id on public.contracts(tenant_id,client_id);
create index rate_card_lines_contract_id on public.rate_card_lines(tenant_id,contract_id);
create index rate_card_lines_grade_id on public.rate_card_lines(tenant_id,grade_id);
create index foundation_documents_client_id on public.foundation_documents(tenant_id,client_id);
create index foundation_documents_site_id on public.foundation_documents(tenant_id,site_id);

-- Narrow SECURITY DEFINER predicates avoid membership-policy recursion. They
-- return booleans only, pin search_path, and bind all checks to auth.uid().
create function sdc_private.is_operator(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships m where m.tenant_id=t and m.user_id=auth.uid() and m.active and m.role in ('admin','operations_manager','senior_manager'))
$$;
create function sdc_private.is_admin(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships m where m.tenant_id=t and m.user_id=auth.uid() and m.active and m.role='admin')
$$;
create function sdc_private.is_member(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships m where m.tenant_id=t and m.user_id=auth.uid() and m.active)
$$;
create function sdc_private.can_site(t uuid,s uuid) returns boolean language sql stable security definer set search_path='' as $$
 select sdc_private.is_operator(t) or exists(
 select 1 from public.memberships m join public.member_scopes g on g.tenant_id=m.tenant_id and g.membership_id=m.id
 join public.sites x on x.tenant_id=t and x.id=s
 where m.tenant_id=t and m.user_id=auth.uid() and m.active and m.role in ('site_lead','client_user')
 and (g.site_id=s or (m.role='client_user' and g.client_id=x.client_id)))
$$;
create function sdc_private.can_client(t uuid,c uuid) returns boolean language sql stable security definer set search_path='' as $$
 select sdc_private.is_operator(t) or exists(
 select 1 from public.memberships m join public.member_scopes g on g.tenant_id=m.tenant_id and g.membership_id=m.id
 where m.tenant_id=t and m.user_id=auth.uid() and m.active and m.role in ('site_lead','client_user')
 and ((m.role='client_user' and g.client_id=c) or exists(select 1 from public.sites s where s.tenant_id=t and s.id=g.site_id and s.client_id=c)))
$$;
create function sdc_private.can_post(t uuid,p uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.posts x where x.tenant_id=t and x.id=p and sdc_private.can_site(t,x.site_id))
$$;
create function sdc_private.can_contract(t uuid,c uuid) returns boolean language sql stable security definer set search_path='' as $$
 select sdc_private.is_operator(t) or exists(select 1 from public.contracts x join public.memberships m on m.tenant_id=x.tenant_id join public.member_scopes g on g.membership_id=m.id and g.tenant_id=m.tenant_id
 where x.tenant_id=t and x.id=c and m.user_id=auth.uid() and m.active and m.role='client_user' and g.client_id=x.client_id)
$$;
create function sdc_private.foundation_member(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships where tenant_id=t and user_id=auth.uid() and active and role in ('admin','operations_manager','senior_manager','site_lead','client_user'))
$$;
revoke all on all functions in schema sdc_private from public, anon;
grant execute on all functions in schema sdc_private to authenticated;

alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.member_scopes enable row level security;
alter table public.audit_events enable row level security;
create policy tenant_read on public.tenants for select to authenticated using(sdc_private.is_member(id));
create policy member_read on public.memberships for select to authenticated using((user_id=auth.uid() and active) or sdc_private.is_admin(tenant_id));
create policy scope_read on public.member_scopes for select to authenticated using(exists(select 1 from public.memberships m where m.id=membership_id and m.tenant_id=member_scopes.tenant_id and m.user_id=auth.uid() and m.active) or sdc_private.is_admin(tenant_id));
create policy audit_read on public.audit_events for select to authenticated using(sdc_private.is_operator(tenant_id));

alter table public.clients enable row level security;
create policy clients_read on public.clients for select to authenticated using(sdc_private.can_client(tenant_id,id));
create policy clients_create on public.clients for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy clients_update on public.clients for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));

alter table public.sites enable row level security;
create policy sites_read on public.sites for select to authenticated using(sdc_private.can_site(tenant_id,id));
create policy sites_create on public.sites for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy sites_update on public.sites for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));

alter table public.posts enable row level security;
create policy posts_read on public.posts for select to authenticated using(sdc_private.can_site(tenant_id,site_id));
create policy posts_create on public.posts for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy posts_update on public.posts for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));

alter table public.grades enable row level security;
create policy grades_read on public.grades for select to authenticated using(sdc_private.foundation_member(tenant_id));
create policy grades_create on public.grades for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy grades_update on public.grades for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));

alter table public.shift_templates enable row level security;
create policy shift_templates_read on public.shift_templates for select to authenticated using(sdc_private.foundation_member(tenant_id));
create policy shift_templates_create on public.shift_templates for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy shift_templates_update on public.shift_templates for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));

alter table public.staffing_requirements enable row level security;
create policy staffing_requirements_read on public.staffing_requirements for select to authenticated using(sdc_private.can_post(tenant_id,post_id));
create policy staffing_requirements_create on public.staffing_requirements for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy staffing_requirements_update on public.staffing_requirements for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));

alter table public.contracts enable row level security;
create policy contracts_read on public.contracts for select to authenticated using(sdc_private.can_contract(tenant_id,id));
create policy contracts_create on public.contracts for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy contracts_update on public.contracts for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));

alter table public.rate_card_lines enable row level security;
create policy rate_card_lines_read on public.rate_card_lines for select to authenticated using(sdc_private.can_contract(tenant_id,contract_id));
create policy rate_card_lines_create on public.rate_card_lines for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy rate_card_lines_update on public.rate_card_lines for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));

alter table public.foundation_documents enable row level security;
create policy foundation_documents_read on public.foundation_documents for select to authenticated using(((site_id is not null and sdc_private.can_site(tenant_id,site_id) and category<>'contract') or sdc_private.is_operator(tenant_id)));
create policy foundation_documents_create on public.foundation_documents for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy foundation_documents_update on public.foundation_documents for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));

-- No direct membership, scope, audit or physical-delete writes from app users.
revoke all on public.tenants,public.memberships,public.member_scopes,public.audit_events from anon,authenticated;
grant select on public.tenants,public.memberships,public.member_scopes,public.audit_events to authenticated;
revoke all on public.clients from anon,authenticated;
grant select,insert,update on public.clients to authenticated;
revoke all on public.grades from anon,authenticated;
grant select,insert,update on public.grades to authenticated;
revoke all on public.sites from anon,authenticated;
grant select,insert,update on public.sites to authenticated;
revoke all on public.posts from anon,authenticated;
grant select,insert,update on public.posts to authenticated;
revoke all on public.shift_templates from anon,authenticated;
grant select,insert,update on public.shift_templates to authenticated;
revoke all on public.staffing_requirements from anon,authenticated;
grant select,insert,update on public.staffing_requirements to authenticated;
revoke all on public.contracts from anon,authenticated;
grant select,insert,update on public.contracts to authenticated;
revoke all on public.rate_card_lines from anon,authenticated;
grant select,insert,update on public.rate_card_lines to authenticated;
revoke all on public.foundation_documents from anon,authenticated;
grant select,insert,update on public.foundation_documents to authenticated;

create function sdc_private.stamp_change() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
   new.created_by=auth.uid(); new.updated_by=auth.uid(); new.row_version=0;
   new.created_at=now(); new.updated_at=now();
 else
   if new.id<>old.id or new.tenant_id<>old.tenant_id then raise exception 'Record ownership is immutable'; end if;
   if new.row_version<>old.row_version+1 then raise exception 'Stale revision: reload this record' using errcode='40001'; end if;
   if old.deleted_at is not null then raise exception 'Archived records are read only'; end if;
   new.created_by=old.created_by; new.created_at=old.created_at;
   new.updated_by=auth.uid(); new.updated_at=now();
 end if;
 return new;
end $$;
create function sdc_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,before_data,after_data)
 values(new.tenant_id,auth.uid(),case when TG_OP='INSERT' then 'created' when new.deleted_at is not null then 'archived' else 'updated' end,TG_TABLE_NAME,new.id,case when TG_OP='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 return new;
end $$;
create function sdc_private.validate_foundation() returns trigger language plpgsql set search_path='' as $$
declare conflict_found boolean;
begin
 if TG_OP='UPDATE' then
  if TG_TABLE_NAME='sites' and ((to_jsonb(new)->>'client_id')::uuid)<>((to_jsonb(old)->>'client_id')::uuid) then raise exception 'A site cannot change client'; end if;
  if TG_TABLE_NAME='posts' and ((to_jsonb(new)->>'site_id')::uuid)<>((to_jsonb(old)->>'site_id')::uuid) then raise exception 'A post cannot change site'; end if;
  if TG_TABLE_NAME='contracts' and ((to_jsonb(new)->>'client_id')::uuid)<>((to_jsonb(old)->>'client_id')::uuid) then raise exception 'A contract cannot change client'; end if;
 end if;
 if new.deleted_at is null then
  if TG_TABLE_NAME in ('sites','contracts','foundation_documents') then
   perform 1 from public.clients where tenant_id=new.tenant_id and id=((to_jsonb(new)->>'client_id')::uuid) and deleted_at is null for share;
   if not found then raise exception 'Choose an active client'; end if;
  end if;
  if TG_TABLE_NAME='posts' or (TG_TABLE_NAME='foundation_documents' and to_jsonb(new)->>'site_id' is not null) then
   perform 1 from public.sites where tenant_id=new.tenant_id and id=((to_jsonb(new)->>'site_id')::uuid) and deleted_at is null for share;
   if not found then raise exception 'Choose an active site'; end if;
  end if;
  if TG_TABLE_NAME in ('posts','rate_card_lines') then
   perform 1 from public.grades where tenant_id=new.tenant_id and id=((to_jsonb(new)->>'grade_id')::uuid) and deleted_at is null for share;
   if not found then raise exception 'Choose an active grade'; end if;
  end if;
  if TG_TABLE_NAME='rate_card_lines' then
   perform 1 from public.contracts where tenant_id=new.tenant_id and id=((to_jsonb(new)->>'contract_id')::uuid) and deleted_at is null for share;
   if not found then raise exception 'Choose an active contract'; end if;
  end if;
  if TG_TABLE_NAME='staffing_requirements' then
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(((to_jsonb(new)->>'post_id')::uuid)::text||((to_jsonb(new)->>'shift_id')::uuid)::text,0));
   perform 1 from public.posts where tenant_id=new.tenant_id and id=((to_jsonb(new)->>'post_id')::uuid) and deleted_at is null for share;
   if not found then raise exception 'Choose an active post'; end if;
   perform 1 from public.shift_templates where tenant_id=new.tenant_id and id=((to_jsonb(new)->>'shift_id')::uuid) and deleted_at is null for share;
   if not found then raise exception 'Choose an active shift'; end if;
   select exists(select 1 from public.staffing_requirements r where r.tenant_id=new.tenant_id and r.post_id=((to_jsonb(new)->>'post_id')::uuid) and r.shift_id=((to_jsonb(new)->>'shift_id')::uuid) and r.id<>new.id and r.deleted_at is null and r.weekdays && ARRAY(select jsonb_array_elements_text(to_jsonb(new)->'weekdays')::integer) and daterange(r.effective_from,r.effective_to,'[]') && daterange(((to_jsonb(new)->>'effective_from')::date),((to_jsonb(new)->>'effective_to')::date),'[]')) into conflict_found;
   if conflict_found then raise exception 'This post and shift already have a requirement on overlapping dates'; end if;
  end if;
 elsif TG_OP='UPDATE' then
  if TG_TABLE_NAME='clients' and (exists(select 1 from public.sites where tenant_id=new.tenant_id and client_id=new.id and deleted_at is null) or exists(select 1 from public.contracts where tenant_id=new.tenant_id and client_id=new.id and deleted_at is null)) then raise exception 'Archive the client sites and contracts first'; end if;
  if TG_TABLE_NAME='sites' and exists(select 1 from public.posts where tenant_id=new.tenant_id and site_id=new.id and deleted_at is null) then raise exception 'Archive the site posts first'; end if;
  if TG_TABLE_NAME='posts' and exists(select 1 from public.staffing_requirements where tenant_id=new.tenant_id and post_id=new.id and deleted_at is null) then raise exception 'Archive the post requirements first'; end if;
  if TG_TABLE_NAME='contracts' and exists(select 1 from public.rate_card_lines where tenant_id=new.tenant_id and contract_id=new.id and deleted_at is null) then raise exception 'Archive the contract rates first'; end if;
  if TG_TABLE_NAME='grades' and (exists(select 1 from public.posts where tenant_id=new.tenant_id and grade_id=new.id and deleted_at is null) or exists(select 1 from public.rate_card_lines where tenant_id=new.tenant_id and grade_id=new.id and deleted_at is null)) then raise exception 'This grade is used by active posts or rates'; end if;
  if TG_TABLE_NAME='shift_templates' and exists(select 1 from public.staffing_requirements where tenant_id=new.tenant_id and shift_id=new.id and deleted_at is null) then raise exception 'Archive the shift requirements first'; end if;
 end if;
 return new;
end $$;
create trigger a_stamp before insert or update on public.clients for each row execute function sdc_private.stamp_change();
create trigger b_validate before insert or update on public.clients for each row execute function sdc_private.validate_foundation();
create trigger z_audit after insert or update on public.clients for each row execute function sdc_private.audit_change();
create trigger a_stamp before insert or update on public.grades for each row execute function sdc_private.stamp_change();
create trigger b_validate before insert or update on public.grades for each row execute function sdc_private.validate_foundation();
create trigger z_audit after insert or update on public.grades for each row execute function sdc_private.audit_change();
create trigger a_stamp before insert or update on public.sites for each row execute function sdc_private.stamp_change();
create trigger b_validate before insert or update on public.sites for each row execute function sdc_private.validate_foundation();
create trigger z_audit after insert or update on public.sites for each row execute function sdc_private.audit_change();
create trigger a_stamp before insert or update on public.posts for each row execute function sdc_private.stamp_change();
create trigger b_validate before insert or update on public.posts for each row execute function sdc_private.validate_foundation();
create trigger z_audit after insert or update on public.posts for each row execute function sdc_private.audit_change();
create trigger a_stamp before insert or update on public.shift_templates for each row execute function sdc_private.stamp_change();
create trigger b_validate before insert or update on public.shift_templates for each row execute function sdc_private.validate_foundation();
create trigger z_audit after insert or update on public.shift_templates for each row execute function sdc_private.audit_change();
create trigger a_stamp before insert or update on public.staffing_requirements for each row execute function sdc_private.stamp_change();
create trigger b_validate before insert or update on public.staffing_requirements for each row execute function sdc_private.validate_foundation();
create trigger z_audit after insert or update on public.staffing_requirements for each row execute function sdc_private.audit_change();
create trigger a_stamp before insert or update on public.contracts for each row execute function sdc_private.stamp_change();
create trigger b_validate before insert or update on public.contracts for each row execute function sdc_private.validate_foundation();
create trigger z_audit after insert or update on public.contracts for each row execute function sdc_private.audit_change();
create trigger a_stamp before insert or update on public.rate_card_lines for each row execute function sdc_private.stamp_change();
create trigger b_validate before insert or update on public.rate_card_lines for each row execute function sdc_private.validate_foundation();
create trigger z_audit after insert or update on public.rate_card_lines for each row execute function sdc_private.audit_change();
create trigger a_stamp before insert or update on public.foundation_documents for each row execute function sdc_private.stamp_change();
create trigger b_validate before insert or update on public.foundation_documents for each row execute function sdc_private.validate_foundation();
create trigger z_audit after insert or update on public.foundation_documents for each row execute function sdc_private.audit_change();

revoke all on function sdc_private.stamp_change(),sdc_private.validate_foundation(),sdc_private.audit_change() from public,anon,authenticated;
-- Storage configuration/policies are in the following migration so this schema
-- is independently testable on plain PostgreSQL as well as Supabase.

-- A metadata record may only point to its own tenant/document storage prefix.
alter table public.foundation_documents add constraint document_owned_path check(object_path like tenant_id::text||'/'||id::text||'/%');

create function sdc_private.audit_access_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,before_data,after_data)
 values(coalesce(new.tenant_id,old.tenant_id),auth.uid(),lower(TG_OP),TG_TABLE_NAME,coalesce(new.id,old.id),case when TG_OP<>'INSERT' then to_jsonb(old) end,case when TG_OP<>'DELETE' then to_jsonb(new) end);
 return coalesce(new,old);
end $$;
revoke all on function sdc_private.audit_access_change() from public,anon,authenticated;
create trigger membership_audit after insert or update or delete on public.memberships for each row execute function sdc_private.audit_access_change();
create trigger scope_audit after insert or update or delete on public.member_scopes for each row execute function sdc_private.audit_access_change();
