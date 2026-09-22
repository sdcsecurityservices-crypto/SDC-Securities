create or replace function public.field_context(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not sdc_private.is_member(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 return jsonb_build_object('sites',coalesce((select jsonb_agg(jsonb_build_object('id',id,'client_id',client_id,'name',name,'latitude',latitude,'longitude',longitude,'site_type',site_type)) from public.sites where tenant_id=p_tenant and deleted_at is null and (sdc_private.can_site(p_tenant,id) or sdc_private.field_guard(p_tenant,id))),'[]'),'shift_templates',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name)) from public.shift_templates where tenant_id=p_tenant and deleted_at is null),'[]'));
end $$;
create function public.camera_post_context(p_tenant uuid,p_site uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid() is null or not sdc_private.can_site(p_tenant,p_site) then raise exception 'Access denied' using errcode='42501';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from(select p.id,p.name,
 coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.full_name,'checked_in',exists(select 1 from public.employee_attendance a where a.tenant_id=p_tenant and a.employee_id=e.id and a.site_id=p_site and a.work_date=r.work_date and a.check_in is not null and a.check_out is null and a.deleted_at is null))) from public.roster_live r join public.employees e on e.tenant_id=r.tenant_id and e.id=r.employee_id where r.tenant_id=p_tenant and r.post_id=p.id and r.starts_at<=now() and r.ends_at>now()),'[]') as guards
 from public.posts p where p.tenant_id=p_tenant and p.site_id=p_site and p.deleted_at is null order by p.name)x),'[]');
end $$;
revoke all on function public.camera_post_context(uuid,uuid) from public,anon;grant execute on function public.camera_post_context(uuid,uuid) to authenticated;
create table public.site_score_history(id uuid primary key default gen_random_uuid(),tenant_id uuid not null,site_id uuid not null,score integer not null,open_risks integer not null,recorded_at timestamptz not null default now(),foreign key(tenant_id,site_id) references public.sites(tenant_id,id));
alter table public.site_score_history enable row level security;revoke all on public.site_score_history from anon,authenticated;grant select on public.site_score_history to authenticated;
create policy score_scope on public.site_score_history for select to authenticated using(sdc_private.can_site(tenant_id,site_id));
create index score_site_history on public.site_score_history(tenant_id,site_id,recorded_at desc);
create function sdc_private.capture_site_score() returns trigger language plpgsql security definer set search_path='' as $$declare score integer;risks integer;begin
 select greatest(0,100-coalesce(sum((case severity when 'critical' then 5 when 'high' then 4 when 'medium' then 2 else 1 end)*likelihood),0)),count(*) into score,risks from public.field_findings where tenant_id=new.tenant_id and site_id=new.site_id and kind='weakness' and deleted_at is null and status not in ('closed','verified');
 insert into public.site_score_history(tenant_id,site_id,score,open_risks) values(new.tenant_id,new.site_id,score,risks);return new;
end $$;
revoke all on function sdc_private.capture_site_score() from public,anon,authenticated;
create trigger score_history after insert or update of severity,likelihood,status,deleted_at on public.field_findings for each row execute function sdc_private.capture_site_score();
