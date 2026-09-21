-- Private foundation documents. Object bytes are never in a public bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('sdc-foundation','sdc-foundation',false,10485760,array['application/pdf','image/png','image/jpeg'])
on conflict(id) do nothing;
create function sdc_private.document_visible(t uuid,d uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.foundation_documents x where x.tenant_id=t and x.id=d and x.deleted_at is null and
 (sdc_private.is_operator(t) or (x.site_id is not null and x.category<>'contract' and sdc_private.can_site(t,x.site_id))))
$$;
revoke all on function sdc_private.document_visible(uuid,uuid) from public,anon;
grant execute on function sdc_private.document_visible(uuid,uuid) to authenticated;
create policy sdc_file_insert on storage.objects for insert to authenticated with check(
 bucket_id='sdc-foundation' and sdc_private.is_operator((storage.foldername(name))[1]::uuid)
);
create policy sdc_file_read on storage.objects for select to authenticated using(
 bucket_id='sdc-foundation' and (sdc_private.is_operator((storage.foldername(name))[1]::uuid)
 or exists(select 1 from public.foundation_documents d where d.object_path=name and d.deleted_at is null))
);
create policy sdc_orphan_remove on storage.objects for delete to authenticated using(
 bucket_id='sdc-foundation' and sdc_private.is_operator((storage.foldername(name))[1]::uuid)
 and not exists(select 1 from public.foundation_documents d where d.object_path=name)
);
-- Signed-link access is logged before issuance; clients cannot forge arbitrary events.
create function public.audit_document_access(p_tenant uuid,p_document uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not sdc_private.document_visible(p_tenant,p_document) then raise exception 'Document access denied' using errcode='42501'; end if;
 insert into public.audit_events(tenant_id,actor_user_id,action,entity_type,entity_id) values(p_tenant,auth.uid(),'download_link_issued','foundation_documents',p_document);
end $$;
revoke all on function public.audit_document_access(uuid,uuid) from public,anon;
grant execute on function public.audit_document_access(uuid,uuid) to authenticated;
