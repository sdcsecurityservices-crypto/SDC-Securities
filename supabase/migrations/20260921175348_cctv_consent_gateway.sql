create table public.cctv_consents(id uuid not null default gen_random_uuid(),tenant_id uuid not null,site_id uuid not null,title text not null,authorized_cameras text[] not null,permitted_roles text[] not null,purpose text not null,starts_on date not null,ends_on date not null,hour_from integer not null default 0,hour_to integer not null default 24,signed_document_id uuid not null,allow_recording boolean not null default false,revoked_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),foreign key(tenant_id,signed_document_id) references public.foundation_documents(tenant_id,id),check(ends_on>=starts_on),check(hour_from between 0 and 23 and hour_to between 1 and 24 and hour_to>hour_from),check(cardinality(authorized_cameras)>0),check(permitted_roles<@array['admin','operations_manager','senior_manager','site_lead','client_user']));
create table public.cctv_cameras(id uuid not null default gen_random_uuid(),tenant_id uuid not null,site_id uuid not null,consent_id uuid not null,title text not null,location text not null,stream_type text not null check(stream_type in ('mock','rtsp','onvif','hls','vendor')),encrypted_source text not null default '',post_ids uuid[] not null default '{}',latitude numeric,longitude numeric,field_of_view text not null default '',status text not null default 'online' check(status in ('online','offline','maintenance')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),created_by uuid,updated_by uuid,row_version integer not null default 0,deleted_at timestamptz,primary key(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id),foreign key(tenant_id,consent_id) references public.cctv_consents(tenant_id,id));
create table public.cctv_access_log(id uuid primary key default gen_random_uuid(),tenant_id uuid not null,site_id uuid not null,camera_id uuid not null,viewer_id uuid not null,viewer_name text not null,reason text not null,started_at timestamptz not null default now(),last_seen_at timestamptz not null default now(),ended_at timestamptz,foreign key(tenant_id,camera_id) references public.cctv_cameras(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id));
create index cctv_camera_site on public.cctv_cameras(tenant_id,site_id) where deleted_at is null;
create index cctv_access_site on public.cctv_access_log(tenant_id,site_id,started_at desc);
alter table public.cctv_consents enable row level security;alter table public.cctv_cameras enable row level security;alter table public.cctv_access_log enable row level security;
revoke all on public.cctv_consents,public.cctv_cameras,public.cctv_access_log from anon,authenticated;
grant select,insert,update on public.cctv_consents,public.cctv_cameras to authenticated;grant select on public.cctv_access_log to authenticated;
create policy consent_read on public.cctv_consents for select to authenticated using(sdc_private.can_site(tenant_id,site_id));
create policy consent_create on public.cctv_consents for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy consent_update on public.cctv_consents for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));
create policy camera_read on public.cctv_cameras for select to authenticated using(sdc_private.can_site(tenant_id,site_id));
create policy camera_create on public.cctv_cameras for insert to authenticated with check(sdc_private.is_operator(tenant_id));
create policy camera_update on public.cctv_cameras for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));
create policy access_read on public.cctv_access_log for select to authenticated using(sdc_private.can_site(tenant_id,site_id));
create trigger a_stamp before insert or update on public.cctv_consents for each row execute function sdc_private.stamp_change();
create trigger a_stamp before insert or update on public.cctv_cameras for each row execute function sdc_private.stamp_change();
create trigger z_audit after insert or update on public.cctv_consents for each row execute function sdc_private.audit_change();
create trigger z_audit after insert or update on public.cctv_cameras for each row execute function sdc_private.training_audit();
create function sdc_private.cctv_validate() returns trigger language plpgsql security definer set search_path='' as $$ declare c public.cctv_consents;p uuid;begin
 if TG_OP='UPDATE' and new.site_id<>old.site_id then raise exception 'Site ownership is immutable';end if;
 if TG_TABLE_NAME='cctv_consents' then
 if not exists(select 1 from public.foundation_documents d join public.sites s on s.tenant_id=d.tenant_id and s.client_id=d.client_id where d.tenant_id=new.tenant_id and d.id=new.signed_document_id and s.id=new.site_id and (d.site_id is null or d.site_id=s.id) and d.deleted_at is null) then raise exception 'Upload a signed consent document belonging to this client/site first';end if;
 else
 select * into c from public.cctv_consents where tenant_id=new.tenant_id and id=new.consent_id and site_id=new.site_id and deleted_at is null;
 if not found or c.revoked_at is not null or current_date not between c.starts_on and c.ends_on or not new.title=any(c.authorized_cameras) then raise exception 'Active written consent must explicitly cover this camera';end if;
 foreach p in array new.post_ids loop if not exists(select 1 from public.posts where tenant_id=new.tenant_id and id=p and site_id=new.site_id and deleted_at is null) then raise exception 'Mapped post must belong to this site';end if;end loop;
 end if;return new;end $$;
create trigger b_validate before insert or update on public.cctv_consents for each row execute function sdc_private.cctv_validate();
create trigger b_validate before insert or update on public.cctv_cameras for each row execute function sdc_private.cctv_validate();
revoke all on function sdc_private.cctv_validate() from public,anon,authenticated;
create function public.cctv_view(p_tenant uuid,p_camera uuid,p_reason text,p_session uuid default null,p_close boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare camera public.cctv_cameras;consent public.cctv_consents;member public.memberships;session public.cctv_access_log;local_clock timestamp=now() at time zone 'Asia/Kolkata';begin
 select * into member from public.memberships where tenant_id=p_tenant and user_id=auth.uid() and active;
 if auth.uid() is null or not found then raise exception 'Access denied' using errcode='42501';end if;
 select * into camera from public.cctv_cameras where tenant_id=p_tenant and id=p_camera and deleted_at is null;
 if not found or not sdc_private.can_site(p_tenant,camera.site_id) then raise exception 'Camera unavailable' using errcode='42501';end if;
 if p_close then
 update public.cctv_access_log set ended_at=now(),last_seen_at=now() where id=p_session and tenant_id=p_tenant and viewer_id=auth.uid() and camera_id=p_camera and ended_at is null;return jsonb_build_object('closed',true);
 end if;
 select * into consent from public.cctv_consents where tenant_id=p_tenant and id=camera.consent_id and site_id=camera.site_id and deleted_at is null;
 if not found or consent.revoked_at is not null or local_clock::date not between consent.starts_on and consent.ends_on or not member.role=any(consent.permitted_roles) or extract(hour from local_clock)<consent.hour_from or extract(hour from local_clock)>=consent.hour_to or not camera.title=any(consent.authorized_cameras) then raise exception 'CCTV consent is absent, expired, revoked or does not permit viewing now' using errcode='42501';end if;
 if camera.status<>'online' then raise exception 'Camera is offline or under maintenance';end if;
 if p_session is null then
 if length(trim(p_reason))<5 then raise exception 'A viewing reason is required';end if;
 insert into public.cctv_access_log(tenant_id,site_id,camera_id,viewer_id,viewer_name,reason) values(p_tenant,camera.site_id,p_camera,auth.uid(),member.display_name,p_reason) returning * into session;
 else
 update public.cctv_access_log set last_seen_at=now() where id=p_session and tenant_id=p_tenant and camera_id=p_camera and viewer_id=auth.uid() and ended_at is null and last_seen_at>now()-interval '90 seconds' returning * into session;
 if not found then raise exception 'Viewing session expired; reopen the feed';end if;
 end if;
 return jsonb_build_object('session_id',session.id,'camera',camera.id,'site_id',camera.site_id,'title',camera.title,'stream_type',camera.stream_type,'encrypted_source',camera.encrypted_source,'viewer',member.display_name,'expires_at',now()+interval '30 seconds');
end $$;
revoke all on function public.cctv_view(uuid,uuid,text,uuid,boolean) from public,anon,authenticated;grant execute on function public.cctv_view(uuid,uuid,text,uuid,boolean) to authenticated;
