-- Only operators can read working drafts, including through direct REST access.
drop policy roster_read on public.roster_assignments;
create policy roster_read on public.roster_assignments for select to authenticated using(sdc_private.is_operator(tenant_id));
create or replace function public.roster_publish(p_tenant uuid,p_site uuid,p_week date) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.roster_assignments; reasons jsonb; revision integer; result public.roster_publications; rest_hours integer;
begin
 if auth.uid() is null or not sdc_private.is_operator(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
 select coalesce(minimum_rest_hours,8) into rest_hours from public.roster_policy where tenant_id=p_tenant;
 rest_hours=coalesce(rest_hours,8);
 for a in select * from public.roster_assignments where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7 and deleted_at is null loop
 if exists(select 1 from public.roster_live l where l.tenant_id=p_tenant and l.employee_id=a.employee_id and not(l.site_id=p_site and l.work_date>=p_week and l.work_date<p_week+7) and tstzrange(l.starts_at-make_interval(hours=>rest_hours),l.ends_at+make_interval(hours=>rest_hours),'[)')&&tstzrange(a.starts_at,a.ends_at,'[)')) then raise exception 'A published assignment elsewhere conflicts with this duty. Publish its removal first.';end if;
 reasons=sdc_private.roster_reasons(p_tenant,a.employee_id,a.post_id,a.shift_id,a.work_date,a.id);
 if jsonb_array_length(reasons)>0 and (length(a.override_reason)<10 or exists(select 1 from jsonb_array_elements_text(reasons) r where r not like 'Missing certification:%')) then raise exception 'Publish blocked: %',reasons;end if;
 end loop;
 update public.roster_assignments set status='published',row_version=row_version+1 where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7 and deleted_at is null;
 insert into public.workforce_notifications(tenant_id,membership_id,title,body)
 select distinct p_tenant,e.membership_id,'Duty roster revised','Your previously published duty for the week of '||p_week||' has changed. Review your current published roster.'
 from public.roster_live l join public.employees e on e.tenant_id=l.tenant_id and e.id=l.employee_id
 where l.tenant_id=p_tenant and l.site_id=p_site and l.work_date>=p_week and l.work_date<p_week+7 and e.membership_id is not null
 and not exists(select 1 from public.roster_assignments r where r.tenant_id=p_tenant and r.id=l.id and r.employee_id=l.employee_id and r.starts_at=l.starts_at and r.post_id=l.post_id and r.deleted_at is null);
 delete from public.roster_live where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7;
 insert into public.roster_live select * from public.roster_assignments where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7 and deleted_at is null;
 select coalesce(max(r.revision),0)+1 into revision from public.roster_publications r where tenant_id=p_tenant and site_id=p_site and week_start=p_week;
 insert into public.roster_publications(tenant_id,site_id,week_start,revision,snapshot,published_by) select p_tenant,p_site,p_week,revision,coalesce(jsonb_agg(to_jsonb(r)),'[]'),auth.uid() from public.roster_assignments r where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7 and deleted_at is null returning * into result;
 insert into public.workforce_notifications(tenant_id,membership_id,title,body) select distinct p_tenant,e.membership_id,'Duty roster published','Your duty roster for the week of '||p_week||' is ready. Open Deployment to review.' from public.roster_assignments r join public.employees e on e.tenant_id=r.tenant_id and e.id=r.employee_id where r.tenant_id=p_tenant and r.site_id=p_site and r.work_date>=p_week and r.work_date<p_week+7 and r.deleted_at is null and e.membership_id is not null;
 return jsonb_build_object('id',result.id,'revision',revision);
end $$;
