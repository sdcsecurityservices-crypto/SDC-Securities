create function sdc_private.field_staff(t uuid,s uuid) returns boolean language sql stable security definer set search_path='' as $$
select sdc_private.is_operator(t) or exists(select 1 from public.memberships m where m.tenant_id=t and m.user_id=auth.uid() and m.active and m.role='site_lead' and sdc_private.can_site(t,s)) $$;
create function sdc_private.field_guard(t uuid,s uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.employee_postings p where p.tenant_id=t and p.site_id=s and p.deleted_at is null and p.starts_on<=(now() at time zone 'Asia/Kolkata')::date and (p.ends_on is null or p.ends_on>=(now() at time zone 'Asia/Kolkata')::date) and sdc_private.is_employee_self(t,p.employee_id)) or exists(select 1 from public.roster_live r where r.tenant_id=t and r.site_id=s and r.status='published' and r.deleted_at is null and r.work_date=(now() at time zone 'Asia/Kolkata')::date and sdc_private.is_employee_self(t,r.employee_id)) $$;
revoke all on function sdc_private.field_staff(uuid,uuid),sdc_private.field_guard(uuid,uuid) from public,anon;
grant execute on function sdc_private.field_staff(uuid,uuid),sdc_private.field_guard(uuid,uuid) to authenticated;
create table public.field_surveys(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),title text not null, surveyed_on date not null, next_due date not null, template text not null, checklist jsonb not null default '{}', notes text not null default '',score integer not null default 100 check(score between 0 and 100),check(next_due>=surveyed_on));
alter table public.field_surveys enable row level security; revoke all on public.field_surveys from anon,authenticated; grant select,insert,update on public.field_surveys to authenticated;
create policy field_read on public.field_surveys for select to authenticated using(sdc_private.can_site(tenant_id,site_id));
create policy field_create on public.field_surveys for insert to authenticated with check(sdc_private.field_staff(tenant_id,site_id));
create policy field_update on public.field_surveys for update to authenticated using(sdc_private.field_staff(tenant_id,site_id)) with check(sdc_private.field_staff(tenant_id,site_id));
create trigger a_stamp before insert or update on public.field_surveys for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.field_surveys for each row execute function sdc_private.audit_change();
create index field_surveys_site on public.field_surveys(tenant_id,site_id,created_at desc,id) where deleted_at is null;
create table public.field_findings(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),survey_id uuid,kind text not null check(kind in ('strength','weakness')),category text not null,title text not null,description text not null,location text not null default '',latitude numeric,longitude numeric,severity text not null check(severity in ('critical','high','medium','low')),likelihood integer not null check(likelihood between 1 and 5),remedy text not null,effort text not null default '',responsible_party text not null check(responsible_party in ('client','agency')),target_date date not null,status text not null default 'identified' check(status in ('identified','flagged','acknowledged','in_progress','resolved','verified','closed','risk_accepted')),signoff_name text not null default '',acknowledged_at timestamptz,acknowledged_ip text,foreign key(tenant_id,survey_id) references public.field_surveys(tenant_id,id),check(latitude is null or latitude between -90 and 90),check(longitude is null or longitude between -180 and 180));
alter table public.field_findings enable row level security; revoke all on public.field_findings from anon,authenticated; grant select,insert,update on public.field_findings to authenticated;
create policy field_read on public.field_findings for select to authenticated using(sdc_private.can_site(tenant_id,site_id));
create policy field_create on public.field_findings for insert to authenticated with check(sdc_private.field_staff(tenant_id,site_id));
create policy field_update on public.field_findings for update to authenticated using(sdc_private.field_staff(tenant_id,site_id)) with check(sdc_private.field_staff(tenant_id,site_id));
create trigger a_stamp before insert or update on public.field_findings for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.field_findings for each row execute function sdc_private.audit_change();
create index field_findings_site on public.field_findings(tenant_id,site_id,created_at desc,id) where deleted_at is null;
create table public.field_incidents(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),title text not null,category text not null,severity text not null check(severity in ('critical','high','medium','low')),description text not null,occurred_at timestamptz not null default now(),post_id uuid,employee_id uuid,status text not null default 'reported' check(status in ('reported','acknowledged','investigating','resolved','closed')),sop_checklist jsonb not null default '{}',investigation text not null default '',resolution text not null default '',acknowledged_at timestamptz,closed_at timestamptz,foreign key(tenant_id,site_id,post_id) references public.posts(tenant_id,site_id,id),foreign key(tenant_id,employee_id) references public.employees(tenant_id,id));
alter table public.field_incidents enable row level security; revoke all on public.field_incidents from anon,authenticated; grant select,insert,update on public.field_incidents to authenticated;
create policy field_read on public.field_incidents for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_create on public.field_incidents for insert to authenticated with check(sdc_private.field_staff(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_update on public.field_incidents for update to authenticated using(sdc_private.field_staff(tenant_id,site_id)) with check(sdc_private.field_staff(tenant_id,site_id));
create trigger a_stamp before insert or update on public.field_incidents for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.field_incidents for each row execute function sdc_private.audit_change();
create index field_incidents_site on public.field_incidents(tenant_id,site_id,created_at desc,id) where deleted_at is null;
create table public.field_sos(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),title text not null default 'Emergency assistance requested',description text not null,latitude numeric not null check(latitude between -90 and 90),longitude numeric not null check(longitude between -180 and 180),status text not null default 'open' check(status in ('open','acknowledged','resolved')),acknowledged_at timestamptz,resolution text not null default '',closed_at timestamptz);
alter table public.field_sos enable row level security; revoke all on public.field_sos from anon,authenticated; grant select,insert,update on public.field_sos to authenticated;
create policy field_read on public.field_sos for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_create on public.field_sos for insert to authenticated with check(sdc_private.field_staff(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_update on public.field_sos for update to authenticated using(sdc_private.field_staff(tenant_id,site_id)) with check(sdc_private.field_staff(tenant_id,site_id));
create trigger a_stamp before insert or update on public.field_sos for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.field_sos for each row execute function sdc_private.audit_change();
create index field_sos_site on public.field_sos(tenant_id,site_id,created_at desc,id) where deleted_at is null;
create table public.field_handovers(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),title text not null,work_date date not null,shift_id uuid not null,notes text not null,keys_and_equipment text not null,pending_issues text not null default '',incoming_employee uuid,status text not null default 'open' check(status in ('open','acknowledged')),acknowledged_at timestamptz,foreign key(tenant_id,shift_id) references public.shift_templates(tenant_id,id),foreign key(tenant_id,incoming_employee) references public.employees(tenant_id,id));
alter table public.field_handovers enable row level security; revoke all on public.field_handovers from anon,authenticated; grant select,insert,update on public.field_handovers to authenticated;
create policy field_read on public.field_handovers for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_create on public.field_handovers for insert to authenticated with check(sdc_private.field_staff(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_update on public.field_handovers for update to authenticated using(sdc_private.field_staff(tenant_id,site_id)) with check(sdc_private.field_staff(tenant_id,site_id));
create trigger a_stamp before insert or update on public.field_handovers for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.field_handovers for each row execute function sdc_private.audit_change();
create index field_handovers_site on public.field_handovers(tenant_id,site_id,created_at desc,id) where deleted_at is null;
create table public.field_gate_passes(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),title text not null,kind text not null check(kind in ('visitor','vehicle','material')),purpose text not null,host_name text not null,vehicle_number text not null default '',items text not null default '',entered_at timestamptz not null default now(),exited_at timestamptz,status text not null default 'inside' check(status in ('inside','exited','denied')),check(exited_at is null or exited_at>=entered_at));
alter table public.field_gate_passes enable row level security; revoke all on public.field_gate_passes from anon,authenticated; grant select,insert,update on public.field_gate_passes to authenticated;
create policy field_read on public.field_gate_passes for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_create on public.field_gate_passes for insert to authenticated with check(sdc_private.field_staff(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_update on public.field_gate_passes for update to authenticated using(sdc_private.field_staff(tenant_id,site_id)) with check(sdc_private.field_staff(tenant_id,site_id));
create trigger a_stamp before insert or update on public.field_gate_passes for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.field_gate_passes for each row execute function sdc_private.audit_change();
create index field_gate_passes_site on public.field_gate_passes(tenant_id,site_id,created_at desc,id) where deleted_at is null;
create table public.field_audits(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),title text not null,audited_at timestamptz not null default now(),employee_id uuid,checklist jsonb not null default '{}',score integer not null check(score between 0 and 100),notes text not null,followup_on date,status text not null default 'open' check(status in ('open','closed')),foreign key(tenant_id,employee_id) references public.employees(tenant_id,id));
alter table public.field_audits enable row level security; revoke all on public.field_audits from anon,authenticated; grant select,insert,update on public.field_audits to authenticated;
create policy field_read on public.field_audits for select to authenticated using(sdc_private.can_site(tenant_id,site_id));
create policy field_create on public.field_audits for insert to authenticated with check(sdc_private.field_staff(tenant_id,site_id));
create policy field_update on public.field_audits for update to authenticated using(sdc_private.field_staff(tenant_id,site_id)) with check(sdc_private.field_staff(tenant_id,site_id));
create trigger a_stamp before insert or update on public.field_audits for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.field_audits for each row execute function sdc_private.audit_change();
create index field_audits_site on public.field_audits(tenant_id,site_id,created_at desc,id) where deleted_at is null;
create table public.field_checkpoints(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),title text not null,location text not null,latitude numeric not null check(latitude between -90 and 90),longitude numeric not null check(longitude between -180 and 180),radius_metres integer not null default 100 check(radius_metres between 10 and 1000),token uuid not null default gen_random_uuid() unique);
alter table public.field_checkpoints enable row level security; revoke all on public.field_checkpoints from anon,authenticated; grant select,insert,update on public.field_checkpoints to authenticated;
create policy field_read on public.field_checkpoints for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_create on public.field_checkpoints for insert to authenticated with check(sdc_private.field_staff(tenant_id,site_id));
create policy field_update on public.field_checkpoints for update to authenticated using(sdc_private.field_staff(tenant_id,site_id)) with check(sdc_private.field_staff(tenant_id,site_id));
create trigger a_stamp before insert or update on public.field_checkpoints for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.field_checkpoints for each row execute function sdc_private.audit_change();
create index field_checkpoints_site on public.field_checkpoints(tenant_id,site_id,created_at desc,id) where deleted_at is null;
create table public.field_patrols(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),title text not null,employee_id uuid not null,starts_at timestamptz not null,ends_at timestamptz not null,checkpoint_ids uuid[] not null,notes text not null default '',check(ends_at>starts_at),check(cardinality(checkpoint_ids)>0),foreign key(tenant_id,employee_id) references public.employees(tenant_id,id));
alter table public.field_patrols enable row level security; revoke all on public.field_patrols from anon,authenticated; grant select,insert,update on public.field_patrols to authenticated;
create policy field_read on public.field_patrols for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy field_create on public.field_patrols for insert to authenticated with check(sdc_private.field_staff(tenant_id,site_id));
create policy field_update on public.field_patrols for update to authenticated using(sdc_private.field_staff(tenant_id,site_id)) with check(sdc_private.field_staff(tenant_id,site_id));
create trigger a_stamp before insert or update on public.field_patrols for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.field_patrols for each row execute function sdc_private.audit_change();
create index field_patrols_site on public.field_patrols(tenant_id,site_id,created_at desc,id) where deleted_at is null;
create table public.field_events(id uuid primary key default gen_random_uuid(),tenant_id uuid not null,site_id uuid not null,entity_type text not null,entity_id uuid not null,action text not null,comment text not null,actor_user_id uuid not null,actor_name text not null,created_at timestamptz not null default now(),foreign key(tenant_id,site_id) references public.sites(tenant_id,id));
alter table public.field_events enable row level security;revoke all on public.field_events from anon,authenticated;grant select on public.field_events to authenticated;
create policy event_read on public.field_events for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create index field_event_entity on public.field_events(tenant_id,entity_type,entity_id,created_at);
create table public.field_evidence(id uuid not null default gen_random_uuid(),tenant_id uuid not null,site_id uuid not null,entity_type text not null,entity_id uuid not null,file_name text not null,mime_type text not null,size_bytes integer not null,object_path text not null unique,uploaded_by uuid not null default auth.uid(),created_at timestamptz not null default now(),primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id));
alter table public.field_evidence enable row level security;revoke all on public.field_evidence from anon,authenticated;grant select,insert on public.field_evidence to authenticated;
create policy evidence_read on public.field_evidence for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id));
create policy evidence_create on public.field_evidence for insert to authenticated with check((sdc_private.can_site(tenant_id,site_id) or sdc_private.field_guard(tenant_id,site_id)) and uploaded_by=auth.uid() and split_part(object_path,'/',1)=tenant_id::text and split_part(object_path,'/',2)=site_id::text and split_part(object_path,'/',3)=id::text);
create index field_evidence_entity on public.field_evidence(tenant_id,entity_type,entity_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('sdc-field','sdc-field',false,20000000,array['image/jpeg','image/png','application/pdf','video/mp4','audio/webm','audio/mpeg']);
create policy field_storage_read on storage.objects for select to authenticated using(bucket_id='sdc-field' and exists(select 1 from public.field_evidence f where f.object_path=name));
create policy field_storage_upload on storage.objects for insert to authenticated with check(bucket_id='sdc-field' and (sdc_private.can_site((storage.foldername(name))[1]::uuid,(storage.foldername(name))[2]::uuid) or sdc_private.field_guard((storage.foldername(name))[1]::uuid,(storage.foldername(name))[2]::uuid)));
create table public.patrol_scans(id uuid primary key default gen_random_uuid(),tenant_id uuid not null,patrol_id uuid not null,checkpoint_id uuid not null,latitude numeric not null,longitude numeric not null,accuracy numeric not null,scanned_at timestamptz not null default now(),actor_user_id uuid not null,foreign key(tenant_id,patrol_id) references public.field_patrols(tenant_id,id),foreign key(tenant_id,checkpoint_id) references public.field_checkpoints(tenant_id,id),unique(tenant_id,patrol_id,checkpoint_id));
alter table public.patrol_scans enable row level security;revoke all on public.patrol_scans from anon,authenticated;grant select on public.patrol_scans to authenticated;
create policy scan_read on public.patrol_scans for select to authenticated using(exists(select 1 from public.field_patrols p where p.tenant_id=patrol_scans.tenant_id and p.id=patrol_scans.patrol_id));
create function sdc_private.field_validate() returns trigger language plpgsql set search_path='' as $$ declare p uuid;begin
 if TG_OP='UPDATE' and new.site_id<>old.site_id then raise exception 'Site ownership is immutable';end if;
 if TG_TABLE_NAME='field_findings' then if new.survey_id is not null and not exists(select 1 from public.field_surveys where tenant_id=new.tenant_id and id=new.survey_id and site_id=new.site_id and deleted_at is null) then raise exception 'Survey must belong to this site';end if;end if;
 if current_user in ('authenticated','anon') and TG_TABLE_NAME in ('field_findings','field_incidents','field_sos','field_handovers','field_gate_passes','field_audits') then
 if TG_OP='INSERT' and (to_jsonb(new)->>'status')<>(case TG_TABLE_NAME when 'field_findings' then 'identified' when 'field_incidents' then 'reported' when 'field_gate_passes' then 'inside' else 'open' end) then raise exception 'Create the record in its initial state';end if;
 if TG_OP='UPDATE' and (to_jsonb(new)->>'status') is distinct from (to_jsonb(old)->>'status') then raise exception 'Use the workflow action to change status';end if;
 if (to_jsonb(new)->>'acknowledged_at') is distinct from (case when TG_OP='UPDATE' then to_jsonb(old)->>'acknowledged_at' else null end) or (to_jsonb(new)->>'closed_at') is distinct from (case when TG_OP='UPDATE' then to_jsonb(old)->>'closed_at' else null end) then raise exception 'Workflow timestamps are server controlled';end if;
 end if;
 if TG_TABLE_NAME='field_patrols' then
 foreach p in array new.checkpoint_ids loop if not exists(select 1 from public.field_checkpoints where tenant_id=new.tenant_id and id=p and site_id=new.site_id and deleted_at is null) then raise exception 'Checkpoint must belong to this site';end if;end loop;
 end if;
 return new;end $$;
create trigger b_validate before insert or update on public.field_surveys for each row execute function sdc_private.field_validate();
create trigger b_validate before insert or update on public.field_findings for each row execute function sdc_private.field_validate();
create trigger b_validate before insert or update on public.field_incidents for each row execute function sdc_private.field_validate();
create trigger b_validate before insert or update on public.field_sos for each row execute function sdc_private.field_validate();
create trigger b_validate before insert or update on public.field_handovers for each row execute function sdc_private.field_validate();
create trigger b_validate before insert or update on public.field_gate_passes for each row execute function sdc_private.field_validate();
create trigger b_validate before insert or update on public.field_audits for each row execute function sdc_private.field_validate();
create trigger b_validate before insert or update on public.field_checkpoints for each row execute function sdc_private.field_validate();
create trigger b_validate before insert or update on public.field_patrols for each row execute function sdc_private.field_validate();

create function public.field_transition(p_tenant uuid,p_kind text,p_id uuid,p_version integer,p_status text,p_comment text,p_signoff text default '',p_ip text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb; site uuid; member public.memberships; staff boolean; client boolean; allowed text[]; target text; result jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_kind not in ('findings','incidents','sos','handovers','gate_passes','audits') then raise exception 'Unknown workflow';end if;
 select * into member from public.memberships where tenant_id=p_tenant and user_id=auth.uid() and active;
 if not found then raise exception 'Access denied' using errcode='42501';end if;
 target='field_'||p_kind;
 execute format('select to_jsonb(r) from public.%I r where tenant_id=$1 and id=$2 and deleted_at is null for update',target) into r using p_tenant,p_id;
 if r is null then raise exception 'Record unavailable';end if;
 site=(r->>'site_id')::uuid;staff=sdc_private.field_staff(p_tenant,site);client=member.role='client_user' and sdc_private.can_site(p_tenant,site);
 if not (staff or client or sdc_private.field_guard(p_tenant,site)) then raise exception 'Access denied' using errcode='42501';end if;
 if (r->>'row_version')::integer<>p_version then raise exception 'Record changed. Reload' using errcode='40001';end if;
 if length(trim(p_comment))<3 or length(p_comment)>4000 then raise exception 'Add a meaningful comment';end if;
 if p_status='comment' then allowed=array['comment'];
 elsif p_kind='findings' then
 allowed=case r->>'status' when 'identified' then array['flagged'] when 'flagged' then array['acknowledged','risk_accepted'] when 'acknowledged' then array['in_progress','resolved','risk_accepted'] when 'in_progress' then array['resolved','risk_accepted'] when 'resolved' then array['verified','in_progress'] when 'verified' then array['closed'] else array[]::text[] end;
 if p_status in ('acknowledged','risk_accepted') and not client then raise exception 'The client must acknowledge or accept this risk' using errcode='42501';end if;
 if p_status in ('flagged','verified','closed') and not staff then raise exception 'Supervisor verification required' using errcode='42501';end if;
 if p_status in ('acknowledged','risk_accepted') and length(trim(p_signoff))<3 then raise exception 'Named client sign-off required';end if;
 if p_status in ('resolved','verified') and not exists(select 1 from public.field_evidence where tenant_id=p_tenant and entity_type=p_kind and entity_id=p_id) then raise exception 'Upload evidence before resolution or verification';end if;
 elsif p_kind='incidents' then
 if not staff then raise exception 'Supervisor action required' using errcode='42501';end if;
 allowed=case r->>'status' when 'reported' then array['acknowledged'] when 'acknowledged' then array['investigating'] when 'investigating' then array['resolved'] when 'resolved' then array['closed','investigating'] else array[]::text[] end;
 elsif p_kind='sos' then
 if not staff then raise exception 'Supervisor action required' using errcode='42501';end if;
 allowed=case r->>'status' when 'open' then array['acknowledged'] when 'acknowledged' then array['resolved'] else array[]::text[] end;
 elsif p_kind='handovers' then
 if not sdc_private.is_employee_self(p_tenant,(r->>'incoming_employee')::uuid) then raise exception 'Only the incoming employee can acknowledge this handover' using errcode='42501';end if;allowed=case r->>'status' when 'open' then array['acknowledged'] else array[]::text[] end;
 elsif p_kind='gate_passes' then
 if not (staff or sdc_private.field_guard(p_tenant,site)) then raise exception 'Site staff action required' using errcode='42501';end if;allowed=case r->>'status' when 'inside' then array['exited','denied'] else array[]::text[] end;
 else
 if not staff then raise exception 'Supervisor action required' using errcode='42501';end if;allowed=case r->>'status' when 'open' then array['closed'] else array[]::text[] end;
 end if;
 if not p_status=any(allowed) then raise exception 'This status transition is not allowed';end if;
 if p_status<>'comment' then
 execute format('update public.%I set status=$3,row_version=row_version+1 where tenant_id=$1 and id=$2 returning to_jsonb(%I)',target,target) into result using p_tenant,p_id,p_status;
 if p_kind='findings' and p_status in ('acknowledged','risk_accepted') then update public.field_findings set signoff_name=p_signoff,acknowledged_at=now(),acknowledged_ip=left(p_ip,200),row_version=row_version+1 where tenant_id=p_tenant and id=p_id;end if;
 if p_kind in ('incidents','sos') and p_status='acknowledged' then execute format('update public.%I set acknowledged_at=now(),row_version=row_version+1 where tenant_id=$1 and id=$2',target) using p_tenant,p_id;end if;
 if p_kind in ('incidents','sos') and p_status in ('resolved','closed') then execute format('update public.%I set closed_at=now(),resolution=$3,row_version=row_version+1 where tenant_id=$1 and id=$2',target) using p_tenant,p_id,p_comment;end if;
 if p_kind='gate_passes' and p_status='exited' then update public.field_gate_passes set exited_at=now(),row_version=row_version+1 where tenant_id=p_tenant and id=p_id;end if;
 if p_kind='handovers' then update public.field_handovers set acknowledged_at=now(),row_version=row_version+1 where tenant_id=p_tenant and id=p_id;end if;
 end if;
 insert into public.field_events(tenant_id,site_id,entity_type,entity_id,action,comment,actor_user_id,actor_name) values(p_tenant,site,p_kind,p_id,p_status,p_comment,auth.uid(),member.display_name);
 insert into public.workforce_notifications(tenant_id,membership_id,title,body,href) select p_tenant,m.id,'Site update: '||p_status,left(r->>'title',150)||' — '||left(p_comment,500),'/operations?view='||p_kind from public.memberships m where m.tenant_id=p_tenant and m.active and (m.role in ('admin','operations_manager') or (m.role='client_user' and p_kind='findings' and exists(select 1 from public.member_scopes g join public.sites s on s.tenant_id=g.tenant_id where g.tenant_id=p_tenant and g.membership_id=m.id and s.id=site and (g.site_id=site or g.client_id=s.client_id))));
 return coalesce(result,r);
end $$;
create function public.site_security_score(p_tenant uuid,p_site uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$ begin
 if auth.uid() is null or not sdc_private.can_site(p_tenant,p_site) then raise exception 'Access denied' using errcode='42501';end if;
 return (select jsonb_build_object('score',greatest(0,100-coalesce(sum((case severity when 'critical' then 5 when 'high' then 4 when 'medium' then 2 else 1 end)*likelihood) filter(where status not in ('closed','verified')),0)),'open',count(*) filter(where status not in ('closed','verified')),'overdue',count(*) filter(where status not in ('closed','verified') and target_date<current_date),'total',count(*)) from public.field_findings where tenant_id=p_tenant and site_id=p_site and kind='weakness' and deleted_at is null);end $$;
create function public.patrol_scan(p_tenant uuid,p_patrol uuid,p_token uuid,p_lat numeric,p_lon numeric,p_accuracy numeric) returns void language plpgsql security definer set search_path='' as $$
declare p public.field_patrols;c public.field_checkpoints;distance numeric;
begin
 select * into p from public.field_patrols where tenant_id=p_tenant and id=p_patrol and deleted_at is null;
 if auth.uid() is null or not found or not sdc_private.is_employee_self(p_tenant,p.employee_id) then raise exception 'Only the assigned guard can scan this patrol' using errcode='42501';end if;
 select * into c from public.field_checkpoints where tenant_id=p_tenant and token=p_token and site_id=p.site_id and deleted_at is null;
 if not found or not c.id=any(p.checkpoint_ids) then raise exception 'Checkpoint not part of this round';end if;
 if now()<p.starts_at or now()>p.ends_at then raise exception 'Outside the scheduled patrol window';end if;
 if p_lat not between -90 and 90 or p_lon not between -180 and 180 or p_accuracy not between 0 and 100 then raise exception 'Fresh accurate GPS required';end if;
 distance=6371000*2*asin(sqrt(power(sin(radians(p_lat-c.latitude)/2),2)+cos(radians(c.latitude))*cos(radians(p_lat))*power(sin(radians(p_lon-c.longitude)/2),2)));
 if distance>c.radius_metres then raise exception 'You are outside this checkpoint radius';end if;
 insert into public.patrol_scans(tenant_id,patrol_id,checkpoint_id,latitude,longitude,accuracy,actor_user_id) values(p_tenant,p.id,c.id,p_lat,p_lon,p_accuracy,auth.uid());
end $$;
revoke all on function public.field_transition(uuid,text,uuid,integer,text,text,text,text),public.site_security_score(uuid,uuid),public.patrol_scan(uuid,uuid,uuid,numeric,numeric,numeric) from public,anon,authenticated;
grant execute on function public.field_transition(uuid,text,uuid,integer,text,text,text,text),public.site_security_score(uuid,uuid),public.patrol_scan(uuid,uuid,uuid,numeric,numeric,numeric) to authenticated;
create function public.field_context(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not sdc_private.is_member(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 return jsonb_build_object('sites',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'latitude',latitude,'longitude',longitude,'site_type',site_type)) from public.sites where tenant_id=p_tenant and deleted_at is null and (sdc_private.can_site(p_tenant,id) or sdc_private.field_guard(p_tenant,id))),'[]'),'shift_templates',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name)) from public.shift_templates where tenant_id=p_tenant and deleted_at is null),'[]'));end $$;
create function public.field_people(p_tenant uuid,p_site uuid,p_query text default '') returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not (sdc_private.field_staff(p_tenant,p_site) or sdc_private.field_guard(p_tenant,p_site)) then raise exception 'Access denied' using errcode='42501';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from(select e.id,e.full_name,e.employee_code from public.employees e where e.tenant_id=p_tenant and e.deleted_at is null and e.status='active' and (sdc_private.is_operator(p_tenant) or exists(select 1 from public.employee_postings p where p.tenant_id=e.tenant_id and p.employee_id=e.id and p.site_id=p_site and p.deleted_at is null and p.starts_on<=current_date and (p.ends_on is null or p.ends_on>=current_date))) and (e.full_name ilike '%'||left(p_query,80)||'%' or e.employee_code ilike '%'||left(p_query,80)||'%') order by e.employee_code limit 50)x),'[]');end $$;
revoke all on function public.field_context(uuid),public.field_people(uuid,uuid,text) from public,anon,authenticated;grant execute on function public.field_context(uuid),public.field_people(uuid,uuid,text) to authenticated;
-- Validate evidence parent server-side even if a user bypasses the application API.
create function sdc_private.field_evidence_validate() returns trigger language plpgsql security definer set search_path='' as $$ declare s uuid;begin
 if new.entity_type not in ('surveys','findings','incidents','sos','handovers','gate_passes','audits','checkpoints','patrols') then raise exception 'Invalid evidence resource';end if;
 execute format('select site_id from public.%I where tenant_id=$1 and id=$2 and deleted_at is null','field_'||new.entity_type) into s using new.tenant_id,new.entity_id;
 if s is distinct from new.site_id then raise exception 'Evidence must belong to an accessible record at this site';end if;return new;end $$;
create trigger evidence_validate before insert on public.field_evidence for each row execute function sdc_private.field_evidence_validate();
revoke all on function sdc_private.field_evidence_validate() from public,anon,authenticated;
