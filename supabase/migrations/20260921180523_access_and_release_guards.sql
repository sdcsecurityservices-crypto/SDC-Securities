create table public.business_settings(tenant_id uuid primary key references public.tenants(id),legal_name text not null default '',gstin text not null default '' check(gstin='' or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),billing_address text not null default '',sac_code text not null default '',bank_instructions text not null default '',retention_days integer not null default 2555 check(retention_days between 365 and 3650),external_notifications_enabled boolean not null default false);
alter table public.business_settings enable row level security;revoke all on public.business_settings from anon,authenticated;grant select,insert,update on public.business_settings to authenticated;
create policy business_settings_read on public.business_settings for select to authenticated using(sdc_private.is_hr(tenant_id) or sdc_private.is_operator(tenant_id));
create policy business_settings_write on public.business_settings for all to authenticated using(sdc_private.is_admin(tenant_id)) with check(sdc_private.is_admin(tenant_id));
create function sdc_private.invoice_issuer() returns trigger language plpgsql security definer set search_path='' as $$ declare s public.business_settings;begin
 select * into s from public.business_settings where tenant_id=new.tenant_id;
 if TG_OP='INSERT' then new.snapshot=new.snapshot||jsonb_build_object('issuer',jsonb_build_object('legal_name',s.legal_name,'gstin',s.gstin,'billing_address',s.billing_address,'sac_code',s.sac_code,'bank_instructions',s.bank_instructions));end if;
 if new.status='issued' and (coalesce(length(new.snapshot->'issuer'->>'gstin'),0)<>15 or coalesce(length(new.snapshot->'issuer'->>'legal_name'),0)<3 or coalesce(length(new.snapshot->'issuer'->>'billing_address'),0)<5 or coalesce(length(new.snapshot->'issuer'->>'sac_code'),0)<4) then raise exception 'Configure the company GSTIN, legal name, billing address and SAC before generating an issuable invoice';end if;
 return new;end $$;
create trigger invoice_issuer before insert or update on public.billing_invoices for each row execute function sdc_private.invoice_issuer();
revoke all on function sdc_private.invoice_issuer() from public,anon,authenticated;
create function public.workspace_grant(p_tenant uuid,p_email text,p_name text,p_role text,p_active boolean,p_sites uuid[] default '{}',p_clients uuid[] default '{}') returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid;m public.memberships;sid uuid;cid uuid;begin
 if auth.uid() is null or not sdc_private.is_admin(p_tenant) then raise exception 'Administrator access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
 if p_role not in ('admin','operations_manager','senior_manager','site_lead','employee','hr_payroll','trainer','client_user') or length(trim(p_name))<2 then raise exception 'Valid role and display name required';end if;
 select id into u from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null;
 if u is null then raise exception 'The person must register and verify this email address first';end if;
 if u=auth.uid() and (p_role<>'admin' or not p_active) and (select count(*) from public.memberships where tenant_id=p_tenant and role='admin' and active)<2 then raise exception 'The final active administrator cannot remove their own access';end if;
 foreach sid in array p_sites loop if not exists(select 1 from public.sites where tenant_id=p_tenant and id=sid and deleted_at is null) then raise exception 'Site is not in this workspace';end if;end loop;
 foreach cid in array p_clients loop if not exists(select 1 from public.clients where tenant_id=p_tenant and id=cid and deleted_at is null) then raise exception 'Client is not in this workspace';end if;end loop;
 if p_role='site_lead' and cardinality(p_sites)=0 or p_role='client_user' and cardinality(p_sites)+cardinality(p_clients)=0 then raise exception 'Scoped roles require at least one site or client';end if;
 insert into public.memberships(tenant_id,user_id,display_name,role,active) values(p_tenant,u,p_name,p_role,p_active) on conflict(tenant_id,user_id) do update set display_name=excluded.display_name,role=excluded.role,active=excluded.active returning * into m;
 delete from public.member_scopes where tenant_id=p_tenant and membership_id=m.id;
 if p_role in ('site_lead','client_user') then foreach sid in array p_sites loop insert into public.member_scopes(tenant_id,membership_id,site_id) values(p_tenant,m.id,sid);end loop;end if;
 if p_role='client_user' then foreach cid in array p_clients loop insert into public.member_scopes(tenant_id,membership_id,client_id) values(p_tenant,m.id,cid);end loop;end if;
 return m.id;end $$;
create function public.workspace_members(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not sdc_private.is_admin(p_tenant) then raise exception 'Administrator access required' using errcode='42501';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from (select m.id,m.display_name,m.role,m.active,u.email,coalesce((select jsonb_agg(jsonb_build_object('site_id',g.site_id,'client_id',g.client_id)) from public.member_scopes g where g.tenant_id=p_tenant and g.membership_id=m.id),'[]') as scopes from public.memberships m join auth.users u on u.id=m.user_id where m.tenant_id=p_tenant order by m.display_name limit 100)x),'[]');end $$;
create function public.operation_access_audit(p_tenant uuid,p_resource text,p_action text,p_site uuid default null) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not sdc_private.is_member(p_tenant) or (p_site is not null and not (sdc_private.can_site(p_tenant,p_site) or sdc_private.field_guard(p_tenant,p_site))) then raise exception 'Access denied' using errcode='42501';end if;
 if p_resource not in ('roster','risk','invoice','training','evidence','compliance','audit') or p_action not in ('export','download') then raise exception 'Invalid audit action';end if;
 insert into public.audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,after_data) values(p_tenant,auth.uid(),p_action,p_resource,p_site,jsonb_build_object('scope','authorized projection'));end $$;
revoke all on function public.workspace_grant(uuid,text,text,text,boolean,uuid[],uuid[]),public.workspace_members(uuid),public.operation_access_audit(uuid,text,text,uuid) from public,anon,authenticated;grant execute on function public.workspace_grant(uuid,text,text,text,boolean,uuid[],uuid[]),public.workspace_members(uuid),public.operation_access_audit(uuid,text,text,uuid) to authenticated;
-- Composite indexes support scheduled checks and bounded site/date reads.
create index attendance_site_date on public.employee_attendance(tenant_id,site_id,work_date) where deleted_at is null;
create index finding_due on public.field_findings(tenant_id,status,target_date) where deleted_at is null;
create index sos_open on public.field_sos(tenant_id,status,created_at) where deleted_at is null;
create index training_expiry on public.training_awards(tenant_id,expires_on) where revoked_at is null;
create index patrol_due on public.field_patrols(tenant_id,ends_at) where deleted_at is null;
create policy hr_contract_read on public.contracts for select to authenticated using(sdc_private.is_hr(tenant_id));
create policy hr_client_read on public.clients for select to authenticated using(sdc_private.is_hr(tenant_id));
create policy hr_site_read on public.sites for select to authenticated using(sdc_private.is_hr(tenant_id));
create function public.roster_forecast(p_tenant uuid,p_site uuid,p_from date) returns jsonb language plpgsql stable security definer set search_path='' as $$ begin
 if auth.uid() is null or not sdc_private.can_site(p_tenant,p_site) then raise exception 'Site access required' using errcode='42501';end if;
 return (select jsonb_agg(to_jsonb(x)) from (select d::date as date,
 (select coalesce(sum(r.headcount),0) from public.staffing_requirements r join public.posts p on p.tenant_id=r.tenant_id and p.id=r.post_id where r.tenant_id=p_tenant and p.site_id=p_site and p.deleted_at is null and r.deleted_at is null and r.effective_from<=d::date and (r.effective_to is null or r.effective_to>=d::date) and extract(isodow from d)::int=any(r.weekdays)) as required,
 (select count(*) from public.roster_live r where r.tenant_id=p_tenant and r.site_id=p_site and r.work_date=d::date) as rostered,
 (select count(*) from public.roster_live r where r.tenant_id=p_tenant and r.site_id=p_site and r.work_date=d::date and jsonb_array_length(sdc_private.roster_reasons(p_tenant,r.employee_id,r.post_id,r.shift_id,r.work_date,r.id))>0) as at_risk
 from generate_series(p_from::timestamp,p_from::timestamp+interval '13 days',interval '1 day') d)x);end $$;
revoke all on function public.roster_forecast(uuid,uuid,date) from public,anon,authenticated;grant execute on function public.roster_forecast(uuid,uuid,date) to authenticated;
