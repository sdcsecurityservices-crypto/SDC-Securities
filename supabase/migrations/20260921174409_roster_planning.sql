-- Production roster, immutable publication history and in-app delivery.
create table public.roster_policy(tenant_id uuid primary key references public.tenants(id),minimum_rest_hours integer not null default 8 check(minimum_rest_hours between 0 and 24),maximum_weekly_hours integer not null default 48 check(maximum_weekly_hours between 8 and 84),no_show_minutes integer not null default 15 check(no_show_minutes between 0 and 180));
create table public.roster_assignments(id uuid not null default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),employee_id uuid not null,site_id uuid not null,post_id uuid not null,shift_id uuid not null,work_date date not null,slot integer not null default 1 check(slot between 1 and 100),starts_at timestamptz not null,ends_at timestamptz not null,status text not null default 'draft' check(status in ('draft','published')),acknowledged_at timestamptz,reason text not null,override_reason text not null default '',row_version integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),foreign key(tenant_id,site_id,post_id) references public.posts(tenant_id,site_id,id),foreign key(tenant_id,shift_id) references public.shift_templates(tenant_id,id),check(ends_at>starts_at));
create unique index roster_slot on public.roster_assignments(tenant_id,post_id,shift_id,work_date,slot) where deleted_at is null;
create index roster_person_date on public.roster_assignments(tenant_id,employee_id,starts_at,ends_at) where deleted_at is null;
create index roster_site_date on public.roster_assignments(tenant_id,site_id,work_date) where deleted_at is null;
create table public.roster_publications(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),site_id uuid not null,week_start date not null,revision integer not null,snapshot jsonb not null,published_by uuid not null,published_at timestamptz not null default now(),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),unique(tenant_id,site_id,week_start,revision));
create table public.workforce_notifications(id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),membership_id uuid not null,title text not null,body text not null,href text not null default '/deployment',created_at timestamptz not null default now(),read_at timestamptz,foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id));
create index notification_recipient on public.workforce_notifications(tenant_id,membership_id,created_at desc);
create table public.employee_client_restrictions(id uuid primary key default gen_random_uuid(),tenant_id uuid not null,employee_id uuid not null,client_id uuid not null,reason text not null,starts_on date not null,ends_on date,foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),foreign key(tenant_id,client_id) references public.clients(tenant_id,id),check(ends_on is null or ends_on>=starts_on));
alter table public.roster_policy enable row level security;
alter table public.roster_assignments enable row level security;
alter table public.roster_publications enable row level security;
alter table public.workforce_notifications enable row level security;
alter table public.employee_client_restrictions enable row level security;
revoke all on public.roster_policy,public.roster_assignments,public.roster_publications,public.workforce_notifications,public.employee_client_restrictions from anon,authenticated;
grant select on public.roster_policy,public.roster_assignments,public.roster_publications,public.workforce_notifications,public.employee_client_restrictions to authenticated;
grant insert,update on public.roster_policy,public.employee_client_restrictions to authenticated;
create policy policy_read on public.roster_policy for select to authenticated using(sdc_private.is_member(tenant_id));
create policy policy_write on public.roster_policy for all to authenticated using(sdc_private.is_admin(tenant_id)) with check(sdc_private.is_admin(tenant_id));
create policy roster_read on public.roster_assignments for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or (status='published' and sdc_private.is_employee_self(tenant_id,employee_id)));
create policy publication_read on public.roster_publications for select to authenticated using(sdc_private.can_site(tenant_id,site_id));
create policy notification_read on public.workforce_notifications for select to authenticated using(exists(select 1 from public.memberships m where m.tenant_id=workforce_notifications.tenant_id and m.id=workforce_notifications.membership_id and m.active and m.user_id=auth.uid()));
create policy restrictions_read on public.employee_client_restrictions for select to authenticated using(sdc_private.is_operator(tenant_id));
create policy restrictions_write on public.employee_client_restrictions for all to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));
create trigger a_stamp before insert or update on public.roster_assignments for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.roster_assignments for each row execute function sdc_private.audit_change();

create table public.roster_live (like public.roster_assignments including defaults including constraints);
alter table public.roster_live add primary key(tenant_id,id);
alter table public.roster_live add foreign key(tenant_id,employee_id) references public.employees(tenant_id,id);
alter table public.roster_live add foreign key(tenant_id,site_id,post_id) references public.posts(tenant_id,site_id,id);
alter table public.roster_live add foreign key(tenant_id,shift_id) references public.shift_templates(tenant_id,id);
create index roster_live_site_date on public.roster_live(tenant_id,site_id,work_date);
create index roster_live_employee on public.roster_live(tenant_id,employee_id,starts_at,ends_at);
alter table public.roster_live enable row level security;revoke all on public.roster_live from anon,authenticated;grant select on public.roster_live to authenticated;
create policy live_read on public.roster_live for select to authenticated using(sdc_private.can_site(tenant_id,site_id) or sdc_private.is_employee_self(tenant_id,employee_id));
create function sdc_private.roster_reasons(t uuid,e uuid,p uuid,sh uuid,d date,ignore_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare person public.employees; post public.posts; site public.sites; shift public.shift_templates; policy public.roster_policy; st timestamptz; en timestamptz; reasons jsonb='[]'; training jsonb; hours numeric;
begin
 select * into person from public.employees where tenant_id=t and id=e and deleted_at is null;
 if not found or person.status<>'active' or person.joined_on>d or person.exited_on<=d then reasons=reasons||jsonb_build_array('Employee is not active on this date'); end if;
 select * into post from public.posts where tenant_id=t and id=p and deleted_at is null;
 select * into site from public.sites where tenant_id=t and id=post.site_id and deleted_at is null;
 select * into shift from public.shift_templates where tenant_id=t and id=sh and deleted_at is null;
 if post.id is null or site.id is null or shift.id is null or site.starts_on>d or site.ends_on<d then return reasons||jsonb_build_array('Site, post or shift is unavailable on this date');end if;
 if person.grade_id<>post.grade_id then reasons=reasons||jsonb_build_array('Required grade does not match'); end if;
 select * into policy from public.roster_policy where tenant_id=t;
 st=(d+shift.starts_at) at time zone 'Asia/Kolkata';en=st+make_interval(mins=>shift.duration_minutes);
 if exists(select 1 from public.employee_leave_requests where tenant_id=t and employee_id=e and deleted_at is null and status='approved' and starts_on<=d and ends_on>=d) then reasons=reasons||jsonb_build_array('Approved leave'); end if;
 if exists(select 1 from public.employee_client_restrictions where tenant_id=t and employee_id=e and client_id=site.client_id and starts_on<=d and (ends_on is null or ends_on>=d)) then reasons=reasons||jsonb_build_array('Client restriction'); end if;
 if exists(select 1 from public.roster_assignments r where r.tenant_id=t and r.employee_id=e and r.deleted_at is null and r.id is distinct from ignore_id and tstzrange(r.starts_at-make_interval(hours=>coalesce(policy.minimum_rest_hours,8)),r.ends_at+make_interval(hours=>coalesce(policy.minimum_rest_hours,8)),'[)')&&tstzrange(st,en,'[)')) then reasons=reasons||jsonb_build_array('Shift overlaps or minimum rest is not met'); end if;
 select coalesce(sum(extract(epoch from ends_at-starts_at)/3600),0)+shift.duration_minutes/60.0 into hours from public.roster_assignments where tenant_id=t and employee_id=e and deleted_at is null and id is distinct from ignore_id and work_date>=date_trunc('week',d)::date and work_date<date_trunc('week',d)::date+7;
 if hours>coalesce(policy.maximum_weekly_hours,48) then reasons=reasons||jsonb_build_array('Maximum weekly hours exceeded'); end if;
 if exists(select 1 from public.training_enrollments x join public.training_sessions s on s.tenant_id=x.tenant_id and s.id=x.session_id where x.tenant_id=t and x.employee_id=e and x.deleted_at is null and s.deleted_at is null and s.status<>'cancelled' and tstzrange(s.starts_at,s.ends_at,'[)')&&tstzrange(st,en,'[)')) then reasons=reasons||jsonb_build_array('Employee is in training'); end if;
 for training in select jsonb_build_object('title',c.title) from public.training_courses c left join public.training_requirements r on r.tenant_id=c.tenant_id and r.course_id=c.id and r.post_id=p and r.deleted_at is null where c.tenant_id=t and c.deleted_at is null and (person.category=any(c.mandatory_for) or r.enforcement='block') and not exists(select 1 from public.training_awards a where a.tenant_id=t and a.employee_id=e and a.course_id=c.id and a.revoked_at is null and a.deleted_at is null and a.issued_on<=d and (a.expires_on is null or a.expires_on>=d)) loop reasons=reasons||jsonb_build_array('Missing certification: '||(training->>'title'));end loop;
 return reasons;
end $$;
revoke all on function sdc_private.roster_reasons(uuid,uuid,uuid,uuid,date,uuid) from public,anon,authenticated;

create function public.roster_assign(p_tenant uuid,p_employee uuid,p_post uuid,p_shift uuid,p_date date,p_slot integer,p_reason text,p_id uuid default null,p_version integer default null,p_override text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare post public.posts; shift public.shift_templates; a public.roster_assignments; reasons jsonb; required integer;
begin
 if auth.uid() is null or not sdc_private.is_operator(p_tenant) then raise exception 'Only operations managers can plan deployments' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
 if length(trim(p_reason))<3 then raise exception 'Assignment reason required';end if;
 select * into post from public.posts where tenant_id=p_tenant and id=p_post and deleted_at is null;
 select * into shift from public.shift_templates where tenant_id=p_tenant and id=p_shift and deleted_at is null;
 if post.id is null or shift.id is null then raise exception 'Post or shift unavailable';end if;
 select headcount into required from public.staffing_requirements where tenant_id=p_tenant and post_id=p_post and shift_id=p_shift and deleted_at is null and effective_from<=p_date and (effective_to is null or effective_to>=p_date) and extract(isodow from p_date)::int=any(weekdays);
 if required is null or p_slot<1 or p_slot>required then raise exception 'No staffing requirement exists for this slot';end if;
 if p_id is not null then
 select * into a from public.roster_assignments where tenant_id=p_tenant and id=p_id and deleted_at is null for update;
 if not found or a.row_version is distinct from p_version then raise exception 'Roster changed. Reload before moving' using errcode='40001';end if;
 if exists(select 1 from public.employee_attendance where tenant_id=p_tenant and employee_id=a.employee_id and work_date=a.work_date and deleted_at is null and (check_in is not null or approval='approved')) then raise exception 'Attendance has locked this assignment';end if;
 end if;
 reasons=sdc_private.roster_reasons(p_tenant,p_employee,p_post,p_shift,p_date,p_id);
 if jsonb_array_length(reasons)>0 then
 if not sdc_private.is_admin(p_tenant) or length(trim(p_override))<10 or exists(select 1 from jsonb_array_elements_text(reasons) r where r not like 'Missing certification:%') then raise exception '%',array_to_string(array(select jsonb_array_elements_text(reasons)),'; ');end if;
 end if;
 if p_id is null then
 insert into public.roster_assignments(tenant_id,employee_id,site_id,post_id,shift_id,work_date,slot,starts_at,ends_at,reason,override_reason) values(p_tenant,p_employee,post.site_id,p_post,p_shift,p_date,p_slot,(p_date+shift.starts_at) at time zone 'Asia/Kolkata',((p_date+shift.starts_at) at time zone 'Asia/Kolkata')+make_interval(mins=>shift.duration_minutes),p_reason,p_override) returning * into a;
 else
 update public.roster_assignments set employee_id=p_employee,site_id=post.site_id,post_id=p_post,shift_id=p_shift,work_date=p_date,slot=p_slot,starts_at=(p_date+shift.starts_at) at time zone 'Asia/Kolkata',ends_at=((p_date+shift.starts_at) at time zone 'Asia/Kolkata')+make_interval(mins=>shift.duration_minutes),reason=p_reason,override_reason=p_override,status='draft',acknowledged_at=null,row_version=row_version+1 where tenant_id=p_tenant and id=p_id returning * into a;
 end if;
 return to_jsonb(a);
end $$;
create function public.roster_remove(p_tenant uuid,p_id uuid,p_version integer,p_reason text) returns void language plpgsql security definer set search_path='' as $$ declare a public.roster_assignments;begin
 if auth.uid() is null or not sdc_private.is_operator(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
 select * into a from public.roster_assignments where tenant_id=p_tenant and id=p_id and deleted_at is null for update;
 if not found or a.row_version<>p_version then raise exception 'Roster changed. Reload' using errcode='40001';end if;
 if length(trim(p_reason))<3 then raise exception 'Reason required';end if;
 if exists(select 1 from public.employee_attendance where tenant_id=p_tenant and employee_id=a.employee_id and work_date=a.work_date and deleted_at is null and (check_in is not null or approval='approved')) then raise exception 'Attendance has locked this assignment';end if;
 update public.roster_assignments set deleted_at=now(),reason=p_reason,row_version=row_version+1 where tenant_id=p_tenant and id=p_id;
 end $$;
create function public.roster_publish(p_tenant uuid,p_site uuid,p_week date) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.roster_assignments; reasons jsonb; revision integer; result public.roster_publications;
begin
 if auth.uid() is null or not sdc_private.is_operator(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
 for a in select * from public.roster_assignments where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7 and deleted_at is null loop
 reasons=sdc_private.roster_reasons(p_tenant,a.employee_id,a.post_id,a.shift_id,a.work_date,a.id);
 if jsonb_array_length(reasons)>0 and (length(a.override_reason)<10 or exists(select 1 from jsonb_array_elements_text(reasons) r where r not like 'Missing certification:%')) then raise exception 'Publish blocked: %',reasons;end if;
 end loop;
 update public.roster_assignments set status='published',row_version=row_version+1 where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7 and deleted_at is null;
 delete from public.roster_live where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7;
 insert into public.roster_live select * from public.roster_assignments where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7 and deleted_at is null;
 select coalesce(max(r.revision),0)+1 into revision from public.roster_publications r where tenant_id=p_tenant and site_id=p_site and week_start=p_week;
 insert into public.roster_publications(tenant_id,site_id,week_start,revision,snapshot,published_by) select p_tenant,p_site,p_week,revision,coalesce(jsonb_agg(to_jsonb(r)),'[]'),auth.uid() from public.roster_assignments r where tenant_id=p_tenant and site_id=p_site and work_date>=p_week and work_date<p_week+7 and deleted_at is null returning * into result;
 insert into public.workforce_notifications(tenant_id,membership_id,title,body) select distinct p_tenant,e.membership_id,'Duty roster published','Your duty roster for the week of '||p_week||' is ready. Open Deployment to review.' from public.roster_assignments r join public.employees e on e.tenant_id=r.tenant_id and e.id=r.employee_id where r.tenant_id=p_tenant and r.site_id=p_site and r.work_date>=p_week and r.work_date<p_week+7 and r.deleted_at is null and e.membership_id is not null;
 return jsonb_build_object('id',result.id,'revision',revision);
end $$;
create function public.roster_acknowledge(p_tenant uuid,p_id uuid) returns void language plpgsql security definer set search_path='' as $$ declare a public.roster_live;begin
 select * into a from public.roster_live where tenant_id=p_tenant and id=p_id and deleted_at is null;
 if auth.uid() is null or not found or not sdc_private.is_employee_self(p_tenant,a.employee_id) or a.status<>'published' then raise exception 'Access denied' using errcode='42501';end if;
 update public.roster_live set acknowledged_at=now(),row_version=row_version+1 where tenant_id=p_tenant and id=p_id; end $$;
create function public.roster_candidates(p_tenant uuid,p_post uuid,p_shift uuid,p_date date,p_query text default '',p_offset integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not sdc_private.is_operator(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from (select e.id,e.full_name,e.employee_code,e.category,sdc_private.roster_reasons(p_tenant,e.id,p_post,p_shift,p_date) as reasons,(select count(*) from public.roster_assignments r join public.posts p on p.tenant_id=r.tenant_id and p.id=p_post where r.tenant_id=p_tenant and r.employee_id=e.id and r.site_id=p.site_id and r.deleted_at is null) as previous_shifts from public.employees e where e.tenant_id=p_tenant and e.deleted_at is null and e.status='active' and (e.full_name ilike '%'||left(p_query,80)||'%' or e.employee_code ilike '%'||left(p_query,80)||'%') order by e.employee_code,e.id limit 50 offset greatest(0,least(p_offset,100000))) x),'[]');end $$;
revoke all on function public.roster_assign(uuid,uuid,uuid,uuid,date,integer,text,uuid,integer,text),public.roster_remove(uuid,uuid,integer,text),public.roster_publish(uuid,uuid,date),public.roster_acknowledge(uuid,uuid),public.roster_candidates(uuid,uuid,uuid,date,text,integer) from public,anon,authenticated;
grant execute on function public.roster_assign(uuid,uuid,uuid,uuid,date,integer,text,uuid,integer,text),public.roster_remove(uuid,uuid,integer,text),public.roster_publish(uuid,uuid,date),public.roster_acknowledge(uuid,uuid),public.roster_candidates(uuid,uuid,uuid,date,text,integer) to authenticated;
create function public.roster_board(p_tenant uuid,p_site uuid,p_from date,p_days integer default 7) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not sdc_private.is_member(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 if p_days not between 1 and 31 then raise exception 'Choose up to 31 days';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from(select r.*,e.full_name,e.employee_code,p.name as post_name,s.name as site_name,sh.name as shift_name,(select a.status from public.employee_attendance a where a.tenant_id=r.tenant_id and a.employee_id=r.employee_id and a.site_id=r.site_id and a.work_date=r.work_date and a.deleted_at is null limit 1) as attendance from (select * from public.roster_assignments where sdc_private.is_operator(p_tenant) union all select * from public.roster_live where not sdc_private.is_operator(p_tenant)) r join public.employees e on e.tenant_id=r.tenant_id and e.id=r.employee_id join public.posts p on p.tenant_id=r.tenant_id and p.id=r.post_id join public.sites s on s.tenant_id=r.tenant_id and s.id=r.site_id join public.shift_templates sh on sh.tenant_id=r.tenant_id and sh.id=r.shift_id where r.tenant_id=p_tenant and (p_site is null or r.site_id=p_site) and r.work_date>=p_from and r.work_date<p_from+p_days and r.deleted_at is null and ((sdc_private.is_operator(p_tenant) or (sdc_private.can_site(p_tenant,r.site_id) and r.status='published')) or (r.status='published' and sdc_private.is_employee_self(p_tenant,r.employee_id))) order by r.work_date,r.starts_at,r.slot) x),'[]');
end $$;
create function public.roster_copy(p_tenant uuid,p_site uuid,p_from date,p_to date) returns integer language plpgsql security definer set search_path='' as $$ declare a public.roster_assignments; n integer=0;begin
 if auth.uid() is null or not sdc_private.is_operator(p_tenant) then raise exception 'Access denied' using errcode='42501';end if;
 if abs(p_to-p_from)<7 then raise exception 'Choose a different non-overlapping week';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
 for a in select * from public.roster_assignments where tenant_id=p_tenant and site_id=p_site and work_date>=p_from and work_date<p_from+7 and deleted_at is null order by work_date,starts_at loop
 perform public.roster_assign(p_tenant,a.employee_id,a.post_id,a.shift_id,a.work_date+(p_to-p_from),a.slot,'Copied from week '||p_from);n=n+1;
 end loop;return n;end $$;
create function public.notification_read(p_tenant uuid,p_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Access denied' using errcode='42501';end if;
 update public.workforce_notifications n set read_at=now() where n.tenant_id=p_tenant and n.id=p_id and exists(select 1 from public.memberships m where m.tenant_id=n.tenant_id and m.id=n.membership_id and m.active and m.user_id=auth.uid());end $$;
revoke all on function public.roster_board(uuid,uuid,date,integer),public.roster_copy(uuid,uuid,date,date),public.notification_read(uuid,uuid) from public,anon,authenticated;
grant execute on function public.roster_board(uuid,uuid,date,integer),public.roster_copy(uuid,uuid,date,date),public.notification_read(uuid,uuid) to authenticated;
