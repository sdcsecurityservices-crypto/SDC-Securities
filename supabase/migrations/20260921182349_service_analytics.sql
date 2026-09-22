create function public.service_analytics(p_tenant uuid,p_from date,p_to date,p_site uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$declare result jsonb;begin
 if auth.uid() is null or not sdc_private.is_member(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 if p_to<p_from or p_to-p_from>31 then raise exception 'Choose a reporting period up to 31 days';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from(select s.id,s.name,
 (select coalesce(sum(r.headcount),0) from public.staffing_requirements r join public.posts p on p.tenant_id=r.tenant_id and p.id=r.post_id cross join generate_series(p_from,p_to,interval '1 day') d where r.tenant_id=p_tenant and p.site_id=s.id and p.deleted_at is null and r.deleted_at is null and d::date>=r.effective_from and (r.effective_to is null or d::date<=r.effective_to) and extract(isodow from d)::int=any(r.weekdays)) as required,
 (select count(*) from public.roster_live r where r.tenant_id=p_tenant and r.site_id=s.id and r.work_date between p_from and p_to) as rostered,
 (select count(*) from public.employee_attendance a where a.tenant_id=p_tenant and a.site_id=s.id and a.work_date between p_from and p_to and a.deleted_at is null and a.approval='approved' and a.status='present') as present,
 (select count(*) from public.employee_attendance a where a.tenant_id=p_tenant and a.site_id=s.id and a.work_date between p_from and p_to and a.deleted_at is null and a.approval='approved' and a.status in ('present','absent')) as approved_days,
 (select count(*) from public.field_incidents i where i.tenant_id=p_tenant and i.site_id=s.id and i.deleted_at is null and (i.occurred_at at time zone 'Asia/Kolkata')::date between p_from and p_to) as incidents,
 (select round(avg(extract(epoch from i.acknowledged_at-i.created_at)/60),1) from public.field_incidents i where i.tenant_id=p_tenant and i.site_id=s.id and i.deleted_at is null and (i.occurred_at at time zone 'Asia/Kolkata')::date between p_from and p_to and i.acknowledged_at is not null) as response_minutes,
 (public.site_security_score(p_tenant,s.id)->>'score')::integer as security_score,
 (select round(avg(a.score),1) from public.field_audits a where a.tenant_id=p_tenant and a.site_id=s.id and a.deleted_at is null and a.audited_at::date between p_from and p_to) as audit_score,
 (select coalesce(jsonb_agg(to_jsonb(h)),'[]') from(select recorded_at,score from public.site_score_history where tenant_id=p_tenant and site_id=s.id and recorded_at::date between p_from and p_to order by recorded_at desc limit 90)h) as score_history,
 (select coalesce(jsonb_agg(to_jsonb(c)),'[]') from(select c.id,c.title,c.latitude,c.longitude,(select count(*) from public.patrol_scans p where p.tenant_id=p_tenant and p.checkpoint_id=c.id and p.scanned_at::date between p_from and p_to) as scans from public.field_checkpoints c where c.tenant_id=p_tenant and c.site_id=s.id and c.deleted_at is null order by c.title limit 100)c) as patrol_checkpoints
 from public.sites s where s.tenant_id=p_tenant and s.deleted_at is null and (p_site is null or s.id=p_site) and sdc_private.can_site(p_tenant,s.id) order by s.name limit 500)x;
 return jsonb_build_object('sites',result,'from',p_from,'to',p_to);
end $$;
revoke all on function public.service_analytics(uuid,date,date,uuid) from public,anon;grant execute on function public.service_analytics(uuid,date,date,uuid) to authenticated;
