-- Invited members (5 Oct 2026)
-- An administrator can assign a role to someone who has been sent an invitation
-- but has not yet chosen a password, so access is ready when they activate.
-- The member list shows which people have not activated their account yet.

create or replace function public.workspace_grant(p_tenant uuid,p_email text,p_name text,p_role text,p_active boolean,p_sites uuid[] default '{}',p_clients uuid[] default '{}') returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid;m public.memberships;sid uuid;cid uuid;begin
 if auth.uid() is null or not sdc_private.is_admin(p_tenant) then raise exception 'Administrator access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_tenant::text,0));
 if p_role not in ('admin','operations_manager','senior_manager','site_lead','employee','hr_payroll','trainer','client_user') or length(trim(p_name))<2 then raise exception 'Valid role and display name required';end if;
 select id into u from auth.users where lower(email)=lower(trim(p_email)) and (email_confirmed_at is not null or invited_at is not null);
 if u is null then raise exception 'Send this person an invitation first, or ask them to verify this email address';end if;
 if u=auth.uid() and (p_role<>'admin' or not p_active) and (select count(*) from public.memberships where tenant_id=p_tenant and role='admin' and active)<2 then raise exception 'The final active administrator cannot remove their own access';end if;
 foreach sid in array p_sites loop if not exists(select 1 from public.sites where tenant_id=p_tenant and id=sid and deleted_at is null) then raise exception 'Site is not in this workspace';end if;end loop;
 foreach cid in array p_clients loop if not exists(select 1 from public.clients where tenant_id=p_tenant and id=cid and deleted_at is null) then raise exception 'Client is not in this workspace';end if;end loop;
 if p_role='site_lead' and cardinality(p_sites)=0 or p_role='client_user' and cardinality(p_sites)+cardinality(p_clients)=0 then raise exception 'Scoped roles require at least one site or client';end if;
 insert into public.memberships(tenant_id,user_id,display_name,role,active) values(p_tenant,u,p_name,p_role,p_active) on conflict(tenant_id,user_id) do update set display_name=excluded.display_name,role=excluded.role,active=excluded.active returning * into m;
 delete from public.member_scopes where tenant_id=p_tenant and membership_id=m.id;
 if p_role in ('site_lead','client_user') then foreach sid in array p_sites loop insert into public.member_scopes(tenant_id,membership_id,site_id) values(p_tenant,m.id,sid);end loop;end if;
 if p_role='client_user' then foreach cid in array p_clients loop insert into public.member_scopes(tenant_id,membership_id,client_id) values(p_tenant,m.id,cid);end loop;end if;
 return m.id;end $$;

create or replace function public.workspace_members(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not sdc_private.is_admin(p_tenant) then raise exception 'Administrator access required' using errcode='42501';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from (select m.id,m.display_name,m.role,m.active,u.email,u.email_confirmed_at is null as pending,u.invited_at,coalesce((select jsonb_agg(jsonb_build_object('site_id',g.site_id,'client_id',g.client_id)) from public.member_scopes g where g.tenant_id=p_tenant and g.membership_id=m.id),'[]') as scopes from public.memberships m join auth.users u on u.id=m.user_id where m.tenant_id=p_tenant order by m.display_name limit 300)x),'[]');end $$;

revoke all on function public.workspace_grant(uuid,text,text,text,boolean,uuid[],uuid[]),public.workspace_members(uuid) from public,anon,authenticated;
grant execute on function public.workspace_grant(uuid,text,text,text,boolean,uuid[],uuid[]),public.workspace_members(uuid) to authenticated;
