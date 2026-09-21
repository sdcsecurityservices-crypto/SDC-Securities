-- Self service needs the names of its own grade and postings, without granting
-- access to full site, client or commercial foundation records.
create function public.employee_self_labels(p_tenant uuid,p_employee uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare labels jsonb;
begin
 if auth.uid() is null or not sdc_private.is_employee_self(p_tenant,p_employee) then raise exception 'Own employee record required' using errcode='42501';end if;
 select jsonb_build_object('grade',g.name,'postings',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'site',s.name,'post',po.name)) from public.employee_postings p join public.sites s on s.tenant_id=p.tenant_id and s.id=p.site_id join public.posts po on po.tenant_id=p.tenant_id and po.id=p.post_id where p.tenant_id=p_tenant and p.employee_id=p_employee and p.deleted_at is null),'[]'::jsonb)) into labels from public.employees e join public.grades g on g.tenant_id=e.tenant_id and g.id=e.grade_id where e.tenant_id=p_tenant and e.id=p_employee;
 return labels;
end $$;
revoke all on function public.employee_self_labels(uuid,uuid) from public,anon;
grant execute on function public.employee_self_labels(uuid,uuid) to authenticated;
