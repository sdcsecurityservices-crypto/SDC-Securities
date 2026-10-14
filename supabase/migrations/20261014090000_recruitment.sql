-- Recruitment, phase 1 (14 Oct 2026)
-- A public careers page lets job seekers apply with a CV or certificate photo.
-- Applicants never read anything back: the anonymous role may only upload
-- files under pending/<application-uuid>/ and call one validating function.
-- HR (admin, hr_payroll) and operators read and move applications; every
-- change is written to job_application_events. Personal data is kept for
-- 12 months unless the person joins (DPDP Act 2023).

-- Openings shown on /careers. Titles are kept in all three site languages.
create table public.job_openings (
 id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid, updated_by uuid, row_version integer not null default 0,
 deleted_at timestamptz, primary key(tenant_id,id),
 role text not null check(role in ('security_guard','lady_guard','supervisor','housekeeping','facility_staff','driver','other')),
 title_en text not null check(length(title_en) between 2 and 120),
 title_kn text not null default '' check(length(title_kn)<=120),
 title_hi text not null default '' check(length(title_hi)<=120),
 area text not null default '' check(length(area)<=120),
 shift text not null default '' check(length(shift)<=80),
 gender_requirement text not null default 'any' check(gender_requirement in ('any','female','male')),
 openings integer not null default 1 check(openings between 1 and 500),
 status text not null default 'open' check(status in ('open','paused','closed')),
 notes text not null default '' check(length(notes)<=1000)
);
create index job_openings_list on public.job_openings(tenant_id,status,created_at desc) where deleted_at is null;

create table public.job_applications (
 id uuid not null, tenant_id uuid not null references public.tenants(id),
 reference_code text not null unique check(reference_code ~ '^SDC-APP-[A-Z0-9]{6}$'),
 opening_id uuid,
 role text not null check(role in ('security_guard','lady_guard','supervisor','housekeeping','facility_staff','driver','other')),
 full_name text not null check(length(full_name) between 2 and 100),
 phone text not null check(phone ~ '^\+91[6-9][0-9]{9}$'),
 whatsapp_same boolean not null default true,
 whatsapp_phone text check(whatsapp_phone is null or whatsapp_phone ~ '^\+91[6-9][0-9]{9}$'),
 gender text not null check(gender in ('female','male','other','undisclosed')),
 date_of_birth date not null,
 home_area text not null check(length(home_area) between 2 and 120),
 home_district text not null default '' check(length(home_district)<=80),
 preferred_work_area text not null default '' check(length(preferred_work_area)<=120),
 languages text[] not null default '{}' check(cardinality(languages)<=8 and languages <@ array['kannada','hindi','english','tamil','telugu','malayalam','marathi','other']),
 education text not null check(education in ('below_10th','10th','12th','diploma','graduate','postgraduate')),
 experience_years integer not null default 0 check(experience_years between 0 and 45),
 last_employer text not null default '' check(length(last_employer)<=120),
 ex_serviceman boolean not null default false,
 service_branch text not null default '' check(service_branch in ('','army','navy','air_force','paramilitary','police','other')),
 rank text not null default '' check(length(rank)<=60),
 service_years integer check(service_years is null or service_years between 0 and 45),
 psara_trained boolean not null default false,
 available_from date,
 heard_from text not null default '' check(heard_from in ('','friend','employee','whatsapp','facebook','instagram','youtube','newspaper','poster','website','job_portal','other')),
 applicant_language text not null default 'en' check(applicant_language in ('en','kn','hi')),
 consent_at timestamptz not null, consent_version text not null check(length(consent_version) between 1 and 40),
 status text not null default 'new' check(status in ('new','screening','interview','verification','offered','joined','on_hold','not_selected')),
 duplicate_of uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 retention_until timestamptz not null default (now()+interval '12 months'),
 primary key(tenant_id,id), unique(id),
 foreign key(tenant_id,opening_id) references public.job_openings(tenant_id,id),
 foreign key(tenant_id,duplicate_of) references public.job_applications(tenant_id,id) on delete set null (duplicate_of)
);
create index job_applications_list on public.job_applications(tenant_id,created_at desc,id);
create index job_applications_status on public.job_applications(tenant_id,status,created_at desc);
create index job_applications_phone on public.job_applications(tenant_id,phone,created_at desc);
create index job_applications_retention on public.job_applications(retention_until) where status<>'joined';
create index job_applications_opening on public.job_applications(tenant_id,opening_id);
create index job_applications_duplicate on public.job_applications(tenant_id,duplicate_of);

create table public.job_application_files (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, application_id uuid not null,
 kind text not null check(kind in ('cv','certificate','photo','other')),
 storage_path text not null unique check(storage_path ~ '^pending/[0-9a-f-]{36}/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$'),
 file_name text not null default '' check(length(file_name)<=120),
 mime text not null check(mime in ('application/pdf','image/jpeg','image/png','image/webp','image/heic')),
 size_bytes integer not null check(size_bytes between 1 and 5242880),
 created_at timestamptz not null default now(),
 foreign key(tenant_id,application_id) references public.job_applications(tenant_id,id) on delete cascade,
 check(storage_path like 'pending/'||application_id::text||'/%')
);
create index job_application_files_app on public.job_application_files(tenant_id,application_id);

create table public.job_application_events (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, application_id uuid not null,
 actor_user_id uuid, actor_name text not null default '',
 action text not null check(action in ('submitted','status_changed','note','file_viewed')),
 from_status text, to_status text, note text not null default '' check(length(note)<=1000),
 created_at timestamptz not null default now(),
 foreign key(tenant_id,application_id) references public.job_applications(tenant_id,id) on delete cascade
);
create index job_application_events_app on public.job_application_events(tenant_id,application_id,created_at);

-- Storage objects whose application has been deleted (retention) or which
-- were uploaded but never submitted. SQL may not delete storage bytes, so an
-- HR session removes them through the Storage API (see careers_purge_paths).
create table sdc_private.careers_storage_purge (
 path text primary key, tenant_id uuid, queued_at timestamptz not null default now()
);
-- Optional extra gate: when a row exists for a workspace, submissions must
-- carry the matching token (set as CAREERS_GATE_TOKEN on the server) so the
-- public function cannot be called directly around the captcha.
create table sdc_private.careers_gates (
 tenant_id uuid primary key references public.tenants(id), token_hash text not null, created_at timestamptz not null default now()
);
revoke all on sdc_private.careers_storage_purge,sdc_private.careers_gates from public,anon,authenticated;

create function sdc_private.can_recruit(t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships m where m.tenant_id=t and m.user_id=auth.uid() and m.active and m.role in ('admin','hr_payroll','operations_manager','senior_manager'))
$$;
revoke all on function sdc_private.can_recruit(uuid) from public,anon;
grant execute on function sdc_private.can_recruit(uuid) to authenticated;

alter table public.job_openings enable row level security;
alter table public.job_applications enable row level security;
alter table public.job_application_files enable row level security;
alter table public.job_application_events enable row level security;
create policy job_openings_read on public.job_openings for select to authenticated using(sdc_private.can_recruit(tenant_id));
create policy job_openings_create on public.job_openings for insert to authenticated with check(sdc_private.can_recruit(tenant_id));
create policy job_openings_update on public.job_openings for update to authenticated using(sdc_private.can_recruit(tenant_id)) with check(sdc_private.can_recruit(tenant_id));
create policy job_applications_read on public.job_applications for select to authenticated using(sdc_private.can_recruit(tenant_id));
create policy job_application_files_read on public.job_application_files for select to authenticated using(sdc_private.can_recruit(tenant_id));
create policy job_application_events_read on public.job_application_events for select to authenticated using(sdc_private.can_recruit(tenant_id));
-- Applications, files and events change only through the functions below.
revoke all on public.job_openings,public.job_applications,public.job_application_files,public.job_application_events from anon,authenticated;
grant select,insert,update on public.job_openings to authenticated;
grant select on public.job_applications,public.job_application_files,public.job_application_events to authenticated;
create trigger a_stamp before insert or update on public.job_openings for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.job_openings for each row execute function sdc_private.audit_change();

-- Private bucket. 5 MB per file; PDFs and photos only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('sdc-careers','sdc-careers',false,5242880,array['application/pdf','image/jpeg','image/png','image/webp','image/heic'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Anonymous upload check lives in its own schema so the anon role does not
-- need access to sdc_private. Booleans only; nothing is readable.
create schema if not exists sdc_careers;
revoke all on schema sdc_careers from public;
grant usage on schema sdc_careers to anon,authenticated;
create function sdc_careers.upload_allowed(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select p_name ~ '^pending/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$'
 and not exists(select 1 from public.job_applications a where a.id=(split_part(p_name,'/',2))::uuid)
 and (select count(*) from storage.objects o where o.bucket_id='sdc-careers' and o.name like 'pending/'||split_part(p_name,'/',2)||'/%')<4
 and (select count(*) from storage.objects o where o.bucket_id='sdc-careers' and o.name like 'pending/%' and o.created_at>now()-interval '1 hour')<600
$$;
revoke all on function sdc_careers.upload_allowed(text) from public;
grant execute on function sdc_careers.upload_allowed(text) to anon,authenticated;
create function sdc_private.careers_file_visible(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.job_application_files f where f.storage_path=p_name and sdc_private.can_recruit(f.tenant_id))
 or exists(select 1 from sdc_private.careers_storage_purge q where q.path=p_name and (q.tenant_id is null and exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.active and m.role in ('admin','hr_payroll','operations_manager','senior_manager')) or q.tenant_id is not null and sdc_private.can_recruit(q.tenant_id)))
$$;
create function sdc_private.careers_purgeable(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from sdc_private.careers_storage_purge q where q.path=p_name and (q.tenant_id is null and exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.active and m.role in ('admin','hr_payroll','operations_manager','senior_manager')) or q.tenant_id is not null and sdc_private.can_recruit(q.tenant_id)))
$$;
revoke all on function sdc_private.careers_file_visible(text),sdc_private.careers_purgeable(text) from public,anon;
grant execute on function sdc_private.careers_file_visible(text),sdc_private.careers_purgeable(text) to authenticated;
create policy careers_anon_upload on storage.objects for insert to anon with check(
 bucket_id='sdc-careers' and sdc_careers.upload_allowed(name)
);
-- Read is needed to issue short-lived signed links; there is no public URL.
create policy careers_staff_read on storage.objects for select to authenticated using(
 bucket_id='sdc-careers' and sdc_private.careers_file_visible(name)
);
create policy careers_staff_purge on storage.objects for delete to authenticated using(
 bucket_id='sdc-careers' and sdc_private.careers_purgeable(name)
);

create function sdc_private.careers_actor_name(t uuid) returns text language sql stable security definer set search_path='' as $$
 select coalesce((select m.display_name from public.memberships m where m.tenant_id=t and m.user_id=auth.uid() and m.active limit 1),'')
$$;
revoke all on function sdc_private.careers_actor_name(uuid) from public,anon,authenticated;

-- Public: open positions only, without internal notes or authorship.
create function public.careers_open_positions(p_tenant uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'role',o.role,'title_en',o.title_en,'title_kn',o.title_kn,'title_hi',o.title_hi,'area',o.area,'shift',o.shift,'gender_requirement',o.gender_requirement,'openings',o.openings) order by o.created_at desc),'[]'::jsonb)
 from (select * from public.job_openings where tenant_id=p_tenant and status='open' and deleted_at is null order by created_at desc limit 50) o
$$;
revoke all on function public.careers_open_positions(uuid) from public;
grant execute on function public.careers_open_positions(uuid) to anon,authenticated;

-- Public submission. Validates every field again (the web route validates
-- first), links uploaded files, flags repeat phone numbers, throttles, audits
-- and alerts HR in-app. Returns only the reference code.
create function public.careers_submit_application(p_tenant uuid,p_payload jsonb,p_files jsonb,p_gate text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 app_id uuid; ref text; v_phone text; wa text; dob date; prior uuid; f jsonb; obj record; opening uuid; role_key text;
 langs text[]; avail date; n integer; alphabet text='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; attempt integer=0;
 svc_years integer; exp_years integer; v_name text;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or p_files is null or jsonb_typeof(p_files)<>'array' then raise exception 'Invalid application' using errcode='22023';end if;
 if not exists(select 1 from public.tenants where id=p_tenant) then raise exception 'Invalid application' using errcode='22023';end if;
 if exists(select 1 from sdc_private.careers_gates g where g.tenant_id=p_tenant) and not exists(select 1 from sdc_private.careers_gates g where g.tenant_id=p_tenant and g.token_hash=encode(sha256(convert_to(coalesce(p_gate,''),'UTF8')),'hex')) then raise exception 'Submission not authorised' using errcode='42501';end if;
 begin app_id=(p_payload->>'id')::uuid; exception when others then raise exception 'Invalid application id' using errcode='22023'; end;
 if app_id is null then raise exception 'Invalid application id' using errcode='22023';end if;
 if exists(select 1 from public.job_applications where id=app_id) then raise exception 'This application was already submitted' using errcode='23505';end if;

 v_name=btrim(regexp_replace(coalesce(p_payload->>'full_name',''),'\s+',' ','g'));
 if length(v_name) not between 2 and 100 or v_name ~ '[<>{}\[\]\\/@#$%^*=_|~`0-9]' then raise exception 'Enter your full name' using errcode='22023';end if;
 v_phone=coalesce(p_payload->>'phone','');
 if v_phone !~ '^\+91[6-9][0-9]{9}$' then raise exception 'Enter a valid 10-digit Indian mobile number' using errcode='22023';end if;
 wa=nullif(p_payload->>'whatsapp_phone','');
 if coalesce((p_payload->>'whatsapp_same')::boolean,true) then wa=null;
 elsif wa is null or wa !~ '^\+91[6-9][0-9]{9}$' then raise exception 'Enter a valid WhatsApp number' using errcode='22023';end if;
 role_key=coalesce(p_payload->>'role','');
 if role_key not in ('security_guard','lady_guard','supervisor','housekeeping','facility_staff','driver','other') then raise exception 'Choose the job you want' using errcode='22023';end if;
 if coalesce(p_payload->>'gender','') not in ('female','male','other','undisclosed') then raise exception 'Choose your gender' using errcode='22023';end if;
 begin dob=(p_payload->>'date_of_birth')::date; exception when others then raise exception 'Enter your date of birth' using errcode='22023'; end;
 if dob is null or dob>(current_date-interval '18 years')::date or dob<=(current_date-interval '61 years')::date then raise exception 'Applicants must be between 18 and 60 years old' using errcode='22023';end if;
 if length(btrim(coalesce(p_payload->>'home_area',''))) not between 2 and 120 then raise exception 'Enter where you live' using errcode='22023';end if;
 if length(coalesce(p_payload->>'home_district',''))>80 or length(coalesce(p_payload->>'preferred_work_area',''))>120 or length(coalesce(p_payload->>'last_employer',''))>120 or length(coalesce(p_payload->>'rank',''))>60 then raise exception 'One of the answers is too long' using errcode='22023';end if;
 if coalesce(p_payload->>'education','') not in ('below_10th','10th','12th','diploma','graduate','postgraduate') then raise exception 'Choose your education' using errcode='22023';end if;
 begin exp_years=coalesce((p_payload->>'experience_years')::integer,0); svc_years=(p_payload->>'service_years')::integer; exception when others then raise exception 'Enter years as a number' using errcode='22023'; end;
 if exp_years not between 0 and 45 or (svc_years is not null and svc_years not between 0 and 45) then raise exception 'Enter years between 0 and 45' using errcode='22023';end if;
 if coalesce(p_payload->>'service_branch','') not in ('','army','navy','air_force','paramilitary','police','other') then raise exception 'Choose your service branch' using errcode='22023';end if;
 if coalesce(p_payload->>'heard_from','') not in ('','friend','employee','whatsapp','facebook','instagram','youtube','newspaper','poster','website','job_portal','other') then raise exception 'Choose how you heard about us' using errcode='22023';end if;
 if coalesce(p_payload->>'applicant_language','en') not in ('en','kn','hi') then raise exception 'Invalid language' using errcode='22023';end if;
 if jsonb_typeof(coalesce(p_payload->'languages','[]'::jsonb))<>'array' then raise exception 'Choose the languages you speak' using errcode='22023';end if;
 select coalesce(array_agg(distinct x),'{}') into langs from jsonb_array_elements_text(coalesce(p_payload->'languages','[]'::jsonb)) x;
 if cardinality(langs)>8 or not langs <@ array['kannada','hindi','english','tamil','telugu','malayalam','marathi','other'] then raise exception 'Choose the languages you speak' using errcode='22023';end if;
 begin avail=nullif(p_payload->>'available_from','')::date; exception when others then raise exception 'Enter a valid joining date' using errcode='22023'; end;
 if avail is not null and (avail<current_date-1 or avail>current_date+365) then raise exception 'Joining date must be within the next year' using errcode='22023';end if;
 if coalesce((p_payload->>'consent')::boolean,false) is not true or length(coalesce(p_payload->>'consent_version',''))not between 1 and 40 then raise exception 'Consent is required to apply' using errcode='22023';end if;
 if nullif(p_payload->>'opening_id','') is not null then
  begin opening=(p_payload->>'opening_id')::uuid; exception when others then raise exception 'Invalid opening' using errcode='22023'; end;
  if not exists(select 1 from public.job_openings where tenant_id=p_tenant and id=opening and status='open' and deleted_at is null) then raise exception 'This opening is no longer available' using errcode='22023';end if;
 end if;
 if jsonb_array_length(p_files)>4 then raise exception 'Attach up to 4 files' using errcode='22023';end if;

 -- Throttles: per phone (3 per 24 hours) and per workspace (200 per hour).
 perform pg_advisory_xact_lock(hashtextextended('careers:'||p_tenant::text||v_phone,0));
 select count(*) into n from public.job_applications where tenant_id=p_tenant and phone=v_phone and created_at>now()-interval '24 hours';
 if n>=3 then raise exception 'You have already applied. We will call you soon.' using errcode='P0001', hint='throttled';end if;
 select count(*) into n from public.job_applications where tenant_id=p_tenant and created_at>now()-interval '1 hour';
 if n>=200 then raise exception 'We are receiving many applications. Please try again in an hour.' using errcode='P0001', hint='throttled';end if;

 select id into prior from public.job_applications where tenant_id=p_tenant and phone=v_phone order by created_at desc limit 1;
 loop
  attempt=attempt+1;
  ref='SDC-APP-'||(select string_agg(substr(alphabet,1+floor(random()*length(alphabet))::integer,1),'') from generate_series(1,6));
  exit when not exists(select 1 from public.job_applications where reference_code=ref);
  if attempt>10 then raise exception 'Please try again' using errcode='40001';end if;
 end loop;

 insert into public.job_applications(id,tenant_id,reference_code,opening_id,role,full_name,phone,whatsapp_same,whatsapp_phone,gender,date_of_birth,home_area,home_district,preferred_work_area,languages,education,experience_years,last_employer,ex_serviceman,service_branch,rank,service_years,psara_trained,available_from,heard_from,applicant_language,consent_at,consent_version,duplicate_of)
 values(app_id,p_tenant,ref,opening,role_key,v_name,v_phone,wa is null,wa,p_payload->>'gender',dob,btrim(p_payload->>'home_area'),btrim(coalesce(p_payload->>'home_district','')),btrim(coalesce(p_payload->>'preferred_work_area','')),langs,p_payload->>'education',exp_years,btrim(coalesce(p_payload->>'last_employer','')),
  coalesce((p_payload->>'ex_serviceman')::boolean,false),
  case when coalesce((p_payload->>'ex_serviceman')::boolean,false) then coalesce(p_payload->>'service_branch','') else '' end,
  case when coalesce((p_payload->>'ex_serviceman')::boolean,false) then btrim(coalesce(p_payload->>'rank','')) else '' end,
  case when coalesce((p_payload->>'ex_serviceman')::boolean,false) then svc_years end,
  coalesce((p_payload->>'psara_trained')::boolean,false),avail,coalesce(p_payload->>'heard_from',''),coalesce(p_payload->>'applicant_language','en'),now(),p_payload->>'consent_version',prior);

 for f in select * from jsonb_array_elements(p_files) loop
  if jsonb_typeof(f)<>'object' or coalesce(f->>'kind','') not in ('cv','certificate','photo','other') then raise exception 'Invalid file' using errcode='22023';end if;
  if coalesce(f->>'path','') not like 'pending/'||app_id::text||'/%' then raise exception 'Invalid file' using errcode='22023';end if;
  select o.name,o.metadata into obj from storage.objects o where o.bucket_id='sdc-careers' and o.name=f->>'path';
  if not found then raise exception 'A file did not finish uploading. Please attach it again.' using errcode='22023';end if;
  insert into public.job_application_files(tenant_id,application_id,kind,storage_path,file_name,mime,size_bytes)
  values(p_tenant,app_id,f->>'kind',obj.name,left(regexp_replace(coalesce(f->>'name',''),'[^A-Za-z0-9 ._()-]','','g'),120),coalesce(obj.metadata->>'mimetype',''),coalesce((obj.metadata->>'size')::integer,0));
 end loop;

 insert into public.job_application_events(tenant_id,application_id,action,to_status,note)
 values(p_tenant,app_id,'submitted','new',case when prior is not null then 'Same phone number applied before.' else '' end);

 -- In-app alert for HR and administrators (the notification bell).
 insert into public.workforce_notifications(tenant_id,membership_id,title,body,href,dedupe_key)
 select p_tenant,m.id,'New job application',v_name||' · '||replace(initcap(replace(role_key,'_',' ')),'Lady Guard','Lady guard')||' · '||btrim(p_payload->>'home_area')||case when prior is not null then ' · applied before' else '' end,'/recruitment?application='||app_id,'application:'||app_id
 from public.memberships m where m.tenant_id=p_tenant and m.active and m.role in ('admin','hr_payroll')
 on conflict(tenant_id,membership_id,dedupe_key) where dedupe_key is not null do nothing;

 return jsonb_build_object('reference',ref);
end $$;
revoke all on function public.careers_submit_application(uuid,jsonb,jsonb,text) from public;
grant execute on function public.careers_submit_application(uuid,jsonb,jsonb,text) to anon,authenticated;

-- HR moves an application between stages with an optional note.
create function public.careers_set_status(p_tenant uuid,p_application uuid,p_status text,p_note text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.job_applications;
begin
 if auth.uid() is null or not sdc_private.can_recruit(p_tenant) then raise exception 'Your role does not allow this action' using errcode='42501';end if;
 if p_status not in ('new','screening','interview','verification','offered','joined','on_hold','not_selected') then raise exception 'Choose a valid stage';end if;
 if length(coalesce(p_note,''))>1000 then raise exception 'Keep the note under 1000 characters';end if;
 select * into a from public.job_applications where tenant_id=p_tenant and id=p_application for update;
 if not found then raise exception 'Application not found' using errcode='P0002';end if;
 if a.status=p_status then
  if btrim(coalesce(p_note,''))='' then raise exception 'Choose a different stage or add a note';end if;
  insert into public.job_application_events(tenant_id,application_id,actor_user_id,actor_name,action,note) values(p_tenant,p_application,auth.uid(),sdc_private.careers_actor_name(p_tenant),'note',btrim(p_note));
 else
  update public.job_applications set status=p_status,updated_at=now() where tenant_id=p_tenant and id=p_application;
  insert into public.job_application_events(tenant_id,application_id,actor_user_id,actor_name,action,from_status,to_status,note) values(p_tenant,p_application,auth.uid(),sdc_private.careers_actor_name(p_tenant),'status_changed',a.status,p_status,btrim(coalesce(p_note,'')));
 end if;
 return jsonb_build_object('status',p_status);
end $$;

-- Every signed link to an applicant document is logged before it is issued.
create function public.careers_log_file_access(p_tenant uuid,p_file uuid) returns text
language plpgsql security definer set search_path='' as $$
declare f public.job_application_files;
begin
 if auth.uid() is null or not sdc_private.can_recruit(p_tenant) then raise exception 'Document access denied' using errcode='42501';end if;
 select * into f from public.job_application_files where tenant_id=p_tenant and id=p_file;
 if not found then raise exception 'Document access denied' using errcode='42501';end if;
 insert into public.job_application_events(tenant_id,application_id,actor_user_id,actor_name,action,note) values(p_tenant,f.application_id,auth.uid(),sdc_private.careers_actor_name(p_tenant),'file_viewed',f.kind||': '||f.file_name);
 return f.storage_path;
end $$;

-- Retention: applications past retention_until (12 months) that did not
-- lead to joining are deleted with their files, events and alerts. Unsubmitted
-- uploads older than two days are also queued. Storage bytes are removed by
-- the Storage API from an HR session (careers_purge_paths + /api/recruitment).
create function sdc_private.careers_retention() returns integer language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into sdc_private.careers_storage_purge(path,tenant_id)
 select f.storage_path,f.tenant_id from public.job_application_files f join public.job_applications a on a.tenant_id=f.tenant_id and a.id=f.application_id
 where a.retention_until<now() and a.status<>'joined' on conflict(path) do nothing;
 delete from public.notification_deliveries d using public.workforce_notifications w, public.job_applications a
 where d.notification_id=w.id and w.dedupe_key='application:'||a.id and w.tenant_id=a.tenant_id and a.retention_until<now() and a.status<>'joined';
 delete from public.workforce_notifications w using public.job_applications a
 where w.dedupe_key='application:'||a.id and w.tenant_id=a.tenant_id and a.retention_until<now() and a.status<>'joined';
 delete from public.job_applications where retention_until<now() and status<>'joined';
 get diagnostics n=row_count;
 insert into sdc_private.careers_storage_purge(path,tenant_id)
 select o.name,null from storage.objects o where o.bucket_id='sdc-careers' and o.name like 'pending/%' and o.created_at<now()-interval '2 days'
 and not exists(select 1 from public.job_application_files f where f.storage_path=o.name) on conflict(path) do nothing;
 delete from sdc_private.careers_storage_purge q where not exists(select 1 from storage.objects o where o.bucket_id='sdc-careers' and o.name=q.path);
 return n;
end $$;
revoke all on function sdc_private.careers_retention() from public,anon,authenticated;

create function public.careers_purge_paths(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not sdc_private.can_recruit(p_tenant) then raise exception 'Your role does not allow this action' using errcode='42501';end if;
 delete from sdc_private.careers_storage_purge q where not exists(select 1 from storage.objects o where o.bucket_id='sdc-careers' and o.name=q.path);
 return coalesce((select jsonb_agg(path) from (select path from sdc_private.careers_storage_purge where tenant_id=p_tenant or tenant_id is null order by queued_at limit 100) x),'[]'::jsonb);
end $$;
revoke all on function public.careers_set_status(uuid,uuid,text,text),public.careers_log_file_access(uuid,uuid),public.careers_purge_paths(uuid) from public,anon,authenticated;
grant execute on function public.careers_set_status(uuid,uuid,text,text),public.careers_log_file_access(uuid,uuid),public.careers_purge_paths(uuid) to authenticated;

do $$begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') then
  create extension if not exists pg_cron;
  perform cron.schedule('sdc-careers-retention','25 21 * * *','select sdc_private.careers_retention()');
 end if;
end $$;
