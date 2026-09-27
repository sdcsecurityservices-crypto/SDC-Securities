-- Security hardening (27 Sep 2026)
-- 1. Attendance selfies are single-use; offline selfies must be uploaded after
--    the capture they evidence, so an old selfie cannot back-fill attendance.
-- 2. Patrol checkpoint tokens (the proof a guard was physically present) are
--    no longer readable by guards; QR generation goes through a staff-only
--    function.

-- 1a. Offline attendance: fresh, single-use selfie and a visible receipt delay.
create or replace function public.offline_attendance_sync(p_tenant uuid,p_event uuid,p_employee uuid,p_site uuid,p_action text,p_captured timestamptz,p_lat numeric,p_lon numeric,p_accuracy numeric,p_document uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.sites;r public.roster_live;a public.employee_attendance;workday date;distance numeric;delay_minutes integer;
begin
 if auth.uid() is null or not sdc_private.is_employee_self(p_tenant,p_employee) then raise exception 'Only your attendance may be submitted' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text||p_employee::text,0));
 if exists(select 1 from public.offline_attendance_events where tenant_id=p_tenant and id=p_event and employee_id=p_employee) then return jsonb_build_object('synced',true,'duplicate',true);end if;
 if p_action not in ('check_in','check_out') or p_captured>now()+interval '1 minute' or p_captured<now()-interval '24 hours' or p_lat not between -90 and 90 or p_lon not between -180 and 180 or p_accuracy not between 0 and 100 then raise exception 'Capture must be within 24 hours with accurate GPS';end if;
 select * into s from public.sites where tenant_id=p_tenant and id=p_site and deleted_at is null;
 if not found or s.latitude is null then raise exception 'Site geofence required';end if;
 distance=6371000*2*asin(sqrt(least(1.0,power(sin(radians(p_lat-s.latitude)/2),2)+cos(radians(s.latitude))*cos(radians(p_lat))*power(sin(radians(p_lon-s.longitude)/2),2))));
 if distance+p_accuracy>s.geofence_radius then raise exception 'Captured location falls outside the site geofence';end if;
 delay_minutes=greatest(0,round(extract(epoch from now()-p_captured)/60))::integer;
 if p_action='check_in' then
 select * into r from public.roster_live where tenant_id=p_tenant and employee_id=p_employee and site_id=p_site and status='published' and deleted_at is null and starts_at<=p_captured+interval '1 hour' and ends_at>p_captured order by starts_at limit 1;
 workday=coalesce(r.work_date,(p_captured at time zone 'Asia/Kolkata')::date);
 if r.id is null and not exists(select 1 from public.employee_postings where tenant_id=p_tenant and employee_id=p_employee and site_id=p_site and starts_on<=workday and (ends_on is null or ends_on>=workday) and deleted_at is null) then raise exception 'No duty or posting at this site for the captured time';end if;
 if not exists(select 1 from public.employee_documents where tenant_id=p_tenant and employee_id=p_employee and id=p_document and category='selfie' and created_by=auth.uid() and deleted_at is null and created_at>=p_captured-interval '5 minutes') then raise exception 'A selfie taken for this check-in is required';end if;
 if exists(select 1 from public.employee_attendance where tenant_id=p_tenant and evidence_document_id=p_document) then raise exception 'This selfie has already been used for attendance';end if;
 insert into public.employee_attendance(tenant_id,employee_id,site_id,work_date,check_in,status,approval,source,evidence_document_id,latitude,longitude,accuracy_metres,notes) values(p_tenant,p_employee,p_site,workday,p_captured,'present','pending','gps',p_document,p_lat,p_lon,p_accuracy,'Offline/device-timestamp submission received '||delay_minutes||' min after capture. Manager must review selfie, location and timing evidence before approval. No automated face-match claim.') returning * into a;
 else
 select * into a from public.employee_attendance where tenant_id=p_tenant and employee_id=p_employee and site_id=p_site and check_in<=p_captured and check_in>p_captured-interval '24 hours' and check_out is null and deleted_at is null for update;
 if not found or a.approval='approved' then raise exception 'No open unapproved check-in';end if;
 update public.employee_attendance set check_out=p_captured,row_version=row_version+1,notes=notes||' Offline check-out received '||delay_minutes||' min after capture; pending review.' where tenant_id=p_tenant and id=a.id;
 end if;
 insert into public.offline_attendance_events(id,tenant_id,employee_id,site_id,action,captured_at,latitude,longitude,accuracy,document_id) values(p_event,p_tenant,p_employee,p_site,p_action,p_captured,p_lat,p_lon,p_accuracy,p_document);
 return jsonb_build_object('synced',true,'attendance_id',a.id,'approval','pending');end $$;

-- 1b. Online attendance: the fresh selfie must also be unused.
create or replace function public.employee_check_attendance(p_tenant uuid,p_employee uuid,p_action text,p_latitude double precision,p_longitude double precision,p_accuracy numeric,p_document uuid default null)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare duty public.roster_live; assignment public.employee_postings; location public.sites; attendance public.employee_attendance; distance_m double precision;workday date=(now() at time zone 'Asia/Kolkata')::date;
begin
 if auth.uid() is null or not sdc_private.is_employee_self(p_tenant,p_employee) then raise exception 'Only your own attendance can be submitted' using errcode='42501';end if;
 if p_action is null or p_action not in ('check_in','check_out') or p_latitude is null or p_longitude is null or p_accuracy is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 or p_accuracy not between 0 and 100 then raise exception 'A GPS fix with accuracy within 100 metres is required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text||p_employee::text,0));
 if p_action='check_out' then
  select * into attendance from public.employee_attendance where tenant_id=p_tenant and employee_id=p_employee and check_in is not null and check_out is null and check_in>now()-interval '24 hours' and source='gps' and deleted_at is null order by check_in desc limit 1;
  if not found then raise exception 'No open check-in in the past 24 hours';end if;
  select * into location from public.sites where tenant_id=p_tenant and id=attendance.site_id and deleted_at is null;
 else
  select * into duty from public.roster_live where tenant_id=p_tenant and employee_id=p_employee and status='published' and deleted_at is null and starts_at<=now()+interval '1 hour' and ends_at>=now() order by starts_at limit 1;
  if found then
    workday=duty.work_date;
    select * into location from public.sites where tenant_id=p_tenant and id=duty.site_id and deleted_at is null;
  else
    select * into assignment from public.employee_postings where tenant_id=p_tenant and employee_id=p_employee and starts_on<=workday and (ends_on is null or ends_on>=workday) and deleted_at is null;
    if not found then raise exception 'A published duty or current site posting is required';end if;
    select * into location from public.sites where tenant_id=p_tenant and id=assignment.site_id and deleted_at is null;
  end if;
 end if;
 if location.id is null or location.latitude is null or location.longitude is null then raise exception 'The site needs a configured GPS geofence';end if;
 distance_m=6371000*2*asin(sqrt(least(1.0,power(sin(radians(p_latitude-location.latitude)/2),2)+cos(radians(location.latitude))*cos(radians(p_latitude))*power(sin(radians(p_longitude-location.longitude)/2),2))));
 if distance_m+p_accuracy>location.geofence_radius then raise exception 'Your GPS position and accuracy must fall inside the site geofence';end if;
 if p_action='check_out' then
  if attendance.approval='approved' then raise exception 'Approved attendance must be corrected by a manager';end if;
  update public.employee_attendance set check_out=now(),row_version=row_version+1 where tenant_id=p_tenant and id=attendance.id returning * into attendance;
 else
  if not exists(select 1 from public.employee_documents where tenant_id=p_tenant and employee_id=p_employee and id=p_document and category='selfie' and created_at>now()-interval '10 minutes' and created_by=auth.uid() and deleted_at is null) then raise exception 'Upload a fresh selfie before checking in';end if;
  if exists(select 1 from public.employee_attendance where tenant_id=p_tenant and evidence_document_id=p_document) then raise exception 'This selfie has already been used for attendance';end if;
  insert into public.employee_attendance(tenant_id,employee_id,work_date,check_in,status,approval,source,site_id,evidence_document_id,latitude,longitude,accuracy_metres)
  values(p_tenant,p_employee,workday,now(),'present','pending','gps',location.id,p_document,p_latitude,p_longitude,p_accuracy) returning * into attendance;
 end if;
 return jsonb_build_object('id',attendance.id,'check_in',attendance.check_in,'check_out',attendance.check_out,'approval',attendance.approval);
end $$;

-- 2. Checkpoint tokens: readable only through a staff-only function.
revoke select on public.field_checkpoints from authenticated;
grant select (id,tenant_id,site_id,created_at,updated_at,created_by,updated_by,row_version,deleted_at,title,location,latitude,longitude,radius_metres) on public.field_checkpoints to authenticated;

create function public.checkpoint_qr_token(p_tenant uuid,p_id uuid) returns uuid language plpgsql stable security definer set search_path='' as $$
declare c public.field_checkpoints;
begin
 select * into c from public.field_checkpoints where tenant_id=p_tenant and id=p_id and deleted_at is null;
 if auth.uid() is null or not found or not sdc_private.field_staff(p_tenant,c.site_id) then raise exception 'Access denied' using errcode='42501';end if;
 return c.token;
end $$;
revoke all on function public.checkpoint_qr_token(uuid,uuid) from public,anon;
grant execute on function public.checkpoint_qr_token(uuid,uuid) to authenticated;
