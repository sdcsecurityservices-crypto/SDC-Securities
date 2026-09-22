create view public.billing_summary with(security_invoker=true) as select i.*,coalesce((select sum(r.amount_paise+r.tds_paise) from public.billing_receipts r where r.tenant_id=i.tenant_id and r.invoice_id=i.id),0) as received_paise,i.total_paise-coalesce((select sum(r.amount_paise+r.tds_paise) from public.billing_receipts r where r.tenant_id=i.tenant_id and r.invoice_id=i.id),0) as balance_paise from public.billing_invoices i;
revoke all on public.billing_summary from public,anon;grant select on public.billing_summary to authenticated;
create function sdc_private.business_validate() returns trigger language plpgsql set search_path='' as $$ begin
 if TG_TABLE_NAME='compliance_items' then
 if new.status='verified' and new.document_id is null then raise exception 'Attach supporting documentation before verifying compliance';end if;
 else
 if current_user in ('authenticated','anon') then
 if new.status='converted' or new.employee_id is not null then raise exception 'Use the verified candidate conversion action';end if;
 if TG_OP='UPDATE' and old.status='converted' then raise exception 'Converted candidates are read only';end if;
 end if;
 end if;return new;end $$;
create trigger b_validate before insert or update on public.compliance_items for each row execute function sdc_private.business_validate();
create trigger b_validate before insert or update on public.recruitment_candidates for each row execute function sdc_private.business_validate();
alter table public.workforce_notifications add column dedupe_key text;
create unique index notification_dedupe on public.workforce_notifications(tenant_id,membership_id,dedupe_key) where dedupe_key is not null;
create table public.notification_preferences(tenant_id uuid not null,membership_id uuid not null,language text not null default 'English' check(language in ('English','Kannada','Hindi')),email boolean not null default false,sms boolean not null default false,whatsapp boolean not null default false,primary key(tenant_id,membership_id),foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id));
alter table public.notification_preferences enable row level security;revoke all on public.notification_preferences from anon,authenticated;grant select,insert,update on public.notification_preferences to authenticated;
create policy preference_own on public.notification_preferences for all to authenticated using(exists(select 1 from public.memberships m where m.tenant_id=notification_preferences.tenant_id and m.id=notification_preferences.membership_id and m.user_id=auth.uid() and m.active)) with check(exists(select 1 from public.memberships m where m.tenant_id=notification_preferences.tenant_id and m.id=notification_preferences.membership_id and m.user_id=auth.uid() and m.active));
create table sdc_private.job_tokens(tenant_id uuid primary key references public.tenants(id),token_hash text not null,created_at timestamptz not null default now());
revoke all on sdc_private.job_tokens from public,anon,authenticated;
create function sdc_private.operational_checks(t uuid) returns integer language plpgsql security definer set search_path='' as $$ declare added integer=0;n integer;begin
 -- Dedupe makes scheduled retries safe. No private data is sent outside the workspace.
 insert into public.workforce_notifications(tenant_id,membership_id,title,body,href,dedupe_key)
 select t,m.id,'Duty check-in overdue',e.full_name||' has not checked in for '||s.name||'. Contact the site supervisor.','/deployment','no-show:'||r.id
 from public.roster_live r join public.employees e on e.tenant_id=r.tenant_id and e.id=r.employee_id join public.sites s on s.tenant_id=r.tenant_id and s.id=r.site_id join public.memberships m on m.tenant_id=t and m.active and (m.role in ('admin','operations_manager') or (m.role='site_lead' and exists(select 1 from public.member_scopes g where g.tenant_id=t and g.membership_id=m.id and g.site_id=r.site_id)))
 left join public.roster_policy policy on policy.tenant_id=t
 where r.tenant_id=t and r.deleted_at is null and r.status='published' and r.starts_at+make_interval(mins=>coalesce(policy.no_show_minutes,15))<now() and r.ends_at>now() and not exists(select 1 from public.employee_attendance a where a.tenant_id=t and a.employee_id=r.employee_id and a.site_id=r.site_id and a.work_date=r.work_date and a.deleted_at is null and a.check_in is not null)
 on conflict(tenant_id,membership_id,dedupe_key) where dedupe_key is not null do nothing;
 get diagnostics n=row_count;added=added+n;
 insert into public.workforce_notifications(tenant_id,membership_id,title,body,href,dedupe_key)
 select t,m.id,'Training renewal due',e.full_name||': '||c.title||' expires on '||a.expires_on,'/training','training:'||a.id||':'||(a.expires_on-current_date)
 from public.training_awards a join public.employees e on e.tenant_id=a.tenant_id and e.id=a.employee_id join public.training_courses c on c.tenant_id=a.tenant_id and c.id=a.course_id join public.memberships m on m.tenant_id=t and m.active and (m.role in ('admin','hr_payroll','trainer') or m.id=e.membership_id) where a.tenant_id=t and a.revoked_at is null and a.expires_on-current_date in (60,30,7,0) on conflict(tenant_id,membership_id,dedupe_key) where dedupe_key is not null do nothing;
 get diagnostics n=row_count;added=added+n;
 insert into public.workforce_notifications(tenant_id,membership_id,title,body,href,dedupe_key)
 select t,m.id,'Site risk requires attention',f.title||' · Target '||f.target_date,'/operations?view=findings','risk:'||f.id||':'||current_date from public.field_findings f join public.memberships m on m.tenant_id=t and m.active and (m.role in ('admin','operations_manager') or (m.role='client_user' and exists(select 1 from public.member_scopes g join public.sites s on s.tenant_id=g.tenant_id and s.id=f.site_id where g.tenant_id=t and g.membership_id=m.id and (g.site_id=f.site_id or g.client_id=s.client_id)))) where f.tenant_id=t and f.deleted_at is null and f.kind='weakness' and f.status not in ('closed','verified') and (f.target_date<current_date or f.status='flagged' and f.updated_at<now()-interval '1 day') on conflict(tenant_id,membership_id,dedupe_key) where dedupe_key is not null do nothing;
 get diagnostics n=row_count;added=added+n;
 insert into public.workforce_notifications(tenant_id,membership_id,title,body,href,dedupe_key)
 select t,m.id,'SOS awaiting response',s.title||' · Immediate supervisor response required.','/operations?view=sos','sos:'||s.id from public.field_sos s join public.memberships m on m.tenant_id=t and m.active and m.role in ('admin','operations_manager','senior_manager') where s.tenant_id=t and s.status='open' and s.deleted_at is null and s.created_at<now()-interval '1 minute' on conflict(tenant_id,membership_id,dedupe_key) where dedupe_key is not null do nothing;
 get diagnostics n=row_count;added=added+n;
 insert into public.workforce_notifications(tenant_id,membership_id,title,body,href,dedupe_key)
 select t,m.id,'Compliance deadline',c.title||' is due on '||c.due_on,'/business','compliance:'||c.id||':'||current_date from public.compliance_items c join public.memberships m on m.tenant_id=t and m.active and m.role in ('admin','hr_payroll') where c.tenant_id=t and c.deleted_at is null and c.status<>'verified' and c.due_on<=current_date+7 on conflict(tenant_id,membership_id,dedupe_key) where dedupe_key is not null do nothing;
 get diagnostics n=row_count;added=added+n;
 insert into public.workforce_notifications(tenant_id,membership_id,title,body,href,dedupe_key)
 select t,m.id,'Patrol round incomplete',p.title||' finished with missed checkpoints.','/operations?view=patrols','patrol:'||p.id from public.field_patrols p join public.memberships m on m.tenant_id=t and m.active and (m.role in ('admin','operations_manager') or m.role='site_lead' and exists(select 1 from public.member_scopes g where g.tenant_id=t and g.membership_id=m.id and g.site_id=p.site_id)) where p.tenant_id=t and p.deleted_at is null and p.ends_at<now() and p.ends_at>now()-interval '1 day' and cardinality(p.checkpoint_ids)>(select count(*) from public.patrol_scans s where s.tenant_id=t and s.patrol_id=p.id) on conflict(tenant_id,membership_id,dedupe_key) where dedupe_key is not null do nothing;
 get diagnostics n=row_count;return added+n;
end $$;
revoke all on function sdc_private.operational_checks(uuid) from public,anon,authenticated;
create function public.run_operational_checks(p_tenant uuid,p_token text default '') returns jsonb language plpgsql security definer set search_path='' as $$begin
 if not (auth.uid() is not null and sdc_private.is_operator(p_tenant)) and not exists(select 1 from sdc_private.job_tokens where tenant_id=p_tenant and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')) then raise exception 'Invalid job authorization' using errcode='42501';end if;
 return jsonb_build_object('notifications_created',sdc_private.operational_checks(p_tenant));end $$;
revoke all on function public.run_operational_checks(uuid,text) from public,anon,authenticated;grant execute on function public.run_operational_checks(uuid,text) to anon,authenticated;
create function public.command_summary(p_tenant uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$ declare result jsonb;begin
 if auth.uid() is null or not sdc_private.is_member(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from(select s.id,s.name,s.latitude,s.longitude,s.site_type,
 (select count(*) from public.roster_live r where r.tenant_id=p_tenant and r.site_id=s.id and r.deleted_at is null and r.status='published' and now()>=r.starts_at and now()<r.ends_at) as on_duty,
 (select count(*) from public.field_incidents i where i.tenant_id=p_tenant and i.site_id=s.id and i.deleted_at is null and i.status<>'closed') as open_incidents,
 (select count(*) from public.field_sos a where a.tenant_id=p_tenant and a.site_id=s.id and a.deleted_at is null and a.status<>'resolved') as sos,
 (select count(*) from public.field_findings f where f.tenant_id=p_tenant and f.site_id=s.id and f.deleted_at is null and f.kind='weakness' and f.status not in ('closed','verified')) as risks,
 (select count(*) from public.cctv_cameras c where c.tenant_id=p_tenant and c.site_id=s.id and c.deleted_at is null and c.status<>'online') as offline_cameras,
 (select count(*) from public.employee_attendance a where a.tenant_id=p_tenant and a.site_id=s.id and a.work_date=(now() at time zone 'Asia/Kolkata')::date and a.deleted_at is null and a.status='present') as present_today
 from public.sites s where s.tenant_id=p_tenant and s.deleted_at is null and sdc_private.can_site(p_tenant,s.id) order by s.name)x;
 return jsonb_build_object('sites',result,'generated_at',now());end $$;
create function public.guard_performance(p_tenant uuid,p_from date,p_to date) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid() is null or not sdc_private.is_member(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 if p_to<p_from or p_to-p_from>366 then raise exception 'Choose a period up to one year';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from(select e.id,e.full_name,e.employee_code,
 (select round(100.0*count(*) filter(where a.status='present')/nullif(count(*) filter(where a.status in ('present','absent')),0),1) from public.employee_attendance a where a.tenant_id=p_tenant and a.employee_id=e.id and a.work_date between p_from and p_to and a.approval='approved' and a.deleted_at is null) as attendance_percent,
 (select round(avg(a.score),1) from public.field_audits a where a.tenant_id=p_tenant and a.employee_id=e.id and a.audited_at::date between p_from and p_to and a.deleted_at is null) as audit_score,
 (select count(*) from public.training_awards a where a.tenant_id=p_tenant and a.employee_id=e.id and a.revoked_at is null and (a.expires_on is null or a.expires_on>=current_date)) as valid_certificates,
 (select round(avg(p.rating),1) from public.employee_postings p where p.tenant_id=p_tenant and p.employee_id=e.id and p.deleted_at is null and p.starts_on<=p_to and (p.ends_on is null or p.ends_on>=p_from)) as client_rating
 from public.employees e where e.tenant_id=p_tenant and e.deleted_at is null and sdc_private.can_employee(p_tenant,e.id) order by e.employee_code limit 100)x),'[]');end $$;
revoke all on function public.command_summary(uuid),public.guard_performance(uuid,date,date) from public,anon,authenticated;grant execute on function public.command_summary(uuid),public.guard_performance(uuid,date,date) to authenticated;
