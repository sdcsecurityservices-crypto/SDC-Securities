create function sdc_private.run_scheduled_checks() returns void language plpgsql security definer set search_path='' as $$ declare t uuid;begin
 for t in select id from public.tenants loop
  begin perform sdc_private.operational_checks(t);exception when others then raise warning 'Operational checks failed for workspace %: %',t,sqlstate;end;
 end loop;
end $$;
revoke all on function sdc_private.run_scheduled_checks() from public,anon,authenticated;
-- SOS is delivered in-app in the same transaction; the scheduler handles reminders.
create function sdc_private.notify_sos() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.workforce_notifications(tenant_id,membership_id,title,body,href,dedupe_key)
 select new.tenant_id,m.id,'SOS awaiting response',new.title||' · Immediate supervisor response required.','/operations?view=sos&site='||new.site_id,'sos:'||new.id
 from public.memberships m where m.tenant_id=new.tenant_id and m.active and (m.role in ('admin','operations_manager','senior_manager') or m.role='site_lead' and exists(select 1 from public.member_scopes g where g.tenant_id=new.tenant_id and g.membership_id=m.id and g.site_id=new.site_id))
 on conflict(tenant_id,membership_id,dedupe_key) where dedupe_key is not null do nothing;
 return new;
end $$;
revoke all on function sdc_private.notify_sos() from public,anon,authenticated;
create trigger sos_immediate_notification after insert on public.field_sos for each row execute function sdc_private.notify_sos();
-- Supabase supplies pg_cron. Local regression PostgreSQL may not have it installed.
do $$begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') then
  create extension if not exists pg_cron;
  perform cron.schedule('sdc-operational-alerts','* * * * *','select sdc_private.run_scheduled_checks()');
 end if;
end $$;
