-- Additive acceptance fixes and employee account linking. Existing data retained.
alter table public.employee_postings add column shift_id uuid,add column supervisor_id uuid,add column replacement_for_id uuid,
 add foreign key(tenant_id,shift_id) references public.shift_templates(tenant_id,id),
 add foreign key(tenant_id,supervisor_id) references public.employees(tenant_id,id),
 add foreign key(tenant_id,replacement_for_id) references public.employees(tenant_id,id);
create index employee_posting_shift on public.employee_postings(tenant_id,shift_id);
create index employee_posting_supervisor on public.employee_postings(tenant_id,supervisor_id);
create index employee_posting_replacement on public.employee_postings(tenant_id,replacement_for_id);

create function public.employee_link_account(p_tenant uuid,p_employee uuid,p_email text) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid;mid uuid;existing_role text;
begin
 if auth.uid() is null or not sdc_private.is_admin(p_tenant) then raise exception 'Administrator access required' using errcode='42501';end if;
 if not exists(select 1 from public.employees where tenant_id=p_tenant and id=p_employee and deleted_at is null and status<>'exited') then raise exception 'Active employee record required';end if;
 select id into uid from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null;
 if uid is null then raise exception 'The employee must first activate their Supabase invitation. Use Authentication > Users > Invite in your Supabase project, then link their verified email here.';end if;
 select id,role into mid,existing_role from public.memberships where tenant_id=p_tenant and user_id=uid;
 if mid is not null and existing_role<>'employee' then raise exception 'This account already holds a different workspace role';end if;
 if exists(select 1 from public.employees where tenant_id=p_tenant and membership_id=mid and id<>p_employee) then raise exception 'This account is already linked to another employee';end if;
 if mid is null then insert into public.memberships(tenant_id,user_id,display_name,role) select p_tenant,uid,full_name,'employee' from public.employees where tenant_id=p_tenant and id=p_employee returning id into mid;end if;
 update public.employees set membership_id=mid,row_version=row_version+1 where tenant_id=p_tenant and id=p_employee;
end $$;
revoke all on function public.employee_link_account(uuid,uuid,text) from public,anon;
grant execute on function public.employee_link_account(uuid,uuid,text) to authenticated;

-- Merge equivalent permissive policies without broadening their predicates.
drop policy hr_clients on public.clients;alter policy clients_read on public.clients using(sdc_private.can_client(tenant_id,id) or sdc_private.is_hr(tenant_id));
drop policy hr_sites on public.sites;alter policy sites_read on public.sites using(sdc_private.can_site(tenant_id,id) or sdc_private.is_hr(tenant_id));
drop policy hr_posts on public.posts;alter policy posts_read on public.posts using(sdc_private.can_site(tenant_id,site_id) or sdc_private.is_hr(tenant_id));
drop policy hr_grades on public.grades;alter policy grades_read on public.grades using(sdc_private.foundation_member(tenant_id) or sdc_private.is_hr(tenant_id));
drop policy hr_shifts on public.shift_templates;alter policy shift_templates_read on public.shift_templates using(sdc_private.foundation_member(tenant_id) or sdc_private.is_hr(tenant_id));
drop policy hr_employee_audit on public.audit_events;alter policy audit_read on public.audit_events using(sdc_private.is_operator(tenant_id) or (sdc_private.is_hr(tenant_id) and entity_type like 'employee%'));
drop policy employee_selfie_metadata on public.employee_documents;alter policy employee_insert on public.employee_documents with check(sdc_private.is_hr(tenant_id) or (category='selfie' and previous_id is null and version=1 and mime_type in ('image/png','image/jpeg') and sdc_private.is_employee_self(tenant_id,employee_id)));
drop policy leave_self_create on public.employee_leave_requests;alter policy employee_insert on public.employee_leave_requests with check(sdc_private.employee_manager(tenant_id,employee_id) or (sdc_private.is_employee_self(tenant_id,employee_id) and status='requested' and decision_note=''));

create or replace function public.employee_run_payroll(p_tenant uuid,p_employees uuid[],p_month date,p_release boolean default false,p_reason text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare eid uuid; emp public.employees; a public.employee_attendance; salary public.employee_salary_structures; d date; last_day date; nd integer;
 advance public.employee_advances; recovered bigint; installment bigint; recoveries bigint; recovery_lines jsonb;
 paid integer; ot integer; gross numeric; deductions numeric; basic numeric; da numeric; hra numeric; allow numeric; otpay numeric; pf numeric; esi numeric; fixed numeric;
 minimum_ok boolean; rules_ok boolean; rev integer; sid uuid; previous public.employee_payslips; result jsonb='[]'; item public.employee_payslips; snapshots jsonb;
begin
 if auth.uid() is null or not sdc_private.is_hr(p_tenant) then raise exception 'Payroll is restricted to HR and administrators' using errcode='42501';end if;
 if extract(day from p_month)<>1 or p_month>date_trunc('month',current_date)::date or coalesce(array_length(p_employees,1),0) not between 1 and 200 then raise exception 'Choose a valid month and 1–200 employees';end if;
 last_day=(p_month+interval '1 month - 1 day')::date;nd=extract(day from last_day);
 for eid in select distinct unnest(p_employees) loop
  perform pg_advisory_xact_lock(hashtextextended(p_tenant::text||eid::text,0));
  select * into emp from public.employees where tenant_id=p_tenant and id=eid and deleted_at is null;
  if not found then raise exception 'Employee not found in this workspace';end if;
  if emp.joined_on>last_day or emp.exited_on<p_month then raise exception 'Employee was not employed during this month';end if;
  select * into previous from public.employee_payslips where tenant_id=p_tenant and employee_id=eid and month=p_month and status='released' and deleted_at is null;
  if found then
   if length(trim(p_reason))<5 then raise exception 'Provide a reason for correcting a released payslip';end if;
   if exists(select 1 from public.employee_payments where tenant_id=p_tenant and payslip_id=previous.id and status='paid' and deleted_at is null) then raise exception 'Paid payslips cannot be replaced. Record the adjustment in a later period';end if;
  end if;
  paid=0;ot=0;basic=0;da=0;hra=0;allow=0;otpay=0;pf=0;esi=0;fixed=0;minimum_ok=true;rules_ok=true;snapshots='[]';sid=null;
  for d in select generate_series(greatest(p_month,emp.joined_on),least(last_day,coalesce(emp.exited_on,last_day)),interval '1 day')::date loop
   select * into a from public.employee_attendance where tenant_id=p_tenant and employee_id=eid and work_date=d and approval='approved' and deleted_at is null;
   if not found then raise exception 'Approve attendance for every employed day before running payroll (% on %)',emp.employee_code,d;end if;
   select * into salary from public.employee_salary_structures where tenant_id=p_tenant and employee_id=eid and starts_on<=d and (ends_on is null or ends_on>=d) and deleted_at is null;
   if not found then raise exception 'Missing effective salary for % on %',emp.employee_code,d;end if;
   sid=salary.id;rules_ok=rules_ok and salary.rule_approved and length(trim(salary.rule_source))>=5;
   minimum_ok=minimum_ok and salary.basic_paise+salary.da_paise>=salary.minimum_wage_paise;
   fixed=salary.pt_paise+salary.lwf_paise+salary.tds_paise+salary.other_deduction_paise;
   snapshots=snapshots||jsonb_build_array(jsonb_build_object('date',d,'attendance_id',a.id,'attendance_revision',a.row_version,'salary_id',salary.id,'salary_revision',salary.row_version,'salary_values',to_jsonb(salary)-'created_by'-'updated_by','status',a.status,'overtime_minutes',a.overtime_minutes,'rule_source',salary.rule_source));
   if a.status in ('present','weekly_off','paid_leave') then
    paid=paid+1;basic=basic+salary.basic_paise::numeric/nd;da=da+salary.da_paise::numeric/nd;hra=hra+salary.hra_paise::numeric/nd;
    allow=allow+(salary.conveyance_paise::numeric+salary.washing_paise+salary.special_paise+salary.site_allowance_paise)/nd;
    pf=pf+(case when salary.pf_ceiling_paise>0 then least(salary.basic_paise+salary.da_paise,salary.pf_ceiling_paise) else salary.basic_paise+salary.da_paise end)::numeric/nd*salary.pf_basis_points/10000;
    esi=esi+(salary.basic_paise::numeric+salary.da_paise+salary.hra_paise+salary.conveyance_paise+salary.washing_paise+salary.special_paise+salary.site_allowance_paise)/nd*salary.esi_basis_points/10000;
   end if;
   if a.status='present' then ot=ot+a.overtime_minutes;otpay=otpay+a.overtime_minutes::numeric*salary.overtime_hour_paise/60;esi=esi+a.overtime_minutes::numeric*salary.overtime_hour_paise/60*salary.esi_basis_points/10000;end if;
  end loop;
  if p_release and (not minimum_ok or not rules_ok) then raise exception 'Release blocked: review the minimum wage and approve every effective salary rule';end if;
  recoveries=0;recovery_lines='[]';
  if exists(select 1 from public.employee_advances where tenant_id=p_tenant and employee_id=eid and status='active' and deleted_at is null) and exists(select 1 from public.employee_payslips where tenant_id=p_tenant and employee_id=eid and month>p_month and status='released' and deleted_at is null) then raise exception 'Employees with advance recovery must run payroll in chronological month order';end if;
  for advance in select * from public.employee_advances where tenant_id=p_tenant and employee_id=eid and status='active' and starts_on<=p_month and deleted_at is null loop
   select coalesce(sum((line->>'amount_paise')::bigint),0) into recovered from public.employee_payslips ps cross join lateral jsonb_array_elements(coalesce(ps.breakdown->'advance_recoveries','[]')) line where ps.tenant_id=p_tenant and ps.employee_id=eid and ps.status='released' and ps.deleted_at is null and ps.month<>p_month and line->>'advance_id'=advance.id::text;
   installment=least(advance.installment_paise,greatest(0,advance.principal_paise-recovered));recoveries=recoveries+installment;
   if installment>0 then recovery_lines=recovery_lines||jsonb_build_array(jsonb_build_object('advance_id',advance.id,'amount_paise',installment,'principal_paise',advance.principal_paise));end if;
  end loop;
  basic=round(basic);da=round(da);hra=round(hra);allow=round(allow);otpay=round(otpay);pf=round(pf);esi=round(esi);gross=basic+da+hra+allow+otpay;deductions=pf+esi+fixed+recoveries;
  if deductions>gross then raise exception 'Deductions exceed gross pay for %',emp.employee_code;end if;
  select coalesce(max(revision),0)+1 into rev from public.employee_payslips where tenant_id=p_tenant and employee_id=eid and month=p_month;
  if p_release and previous.id is not null then update public.employee_payslips set status='superseded',row_version=row_version+1 where tenant_id=p_tenant and id=previous.id;end if;
  insert into public.employee_payslips(tenant_id,employee_id,month,revision,status,salary_id,paid_days,overtime_minutes,gross_paise,deduction_paise,net_paise,breakdown,released_at,correction_reason)
  values(p_tenant,eid,p_month,rev,case when p_release then 'released' else 'draft' end,sid,paid,ot,gross,deductions,gross-deductions,jsonb_build_object('basic',basic,'da',da,'hra',hra,'allowances',allow,'overtime',otpay,'pf',pf,'esi',esi,'fixed_deductions',fixed,'advance_deductions',recoveries,'advance_recoveries',recovery_lines,'calendar_days',nd,'minimum_wage_ok',minimum_ok,'rules_approved',rules_ok,'snapshots',snapshots),case when p_release then now() end,p_reason) returning * into item;
  result=result||jsonb_build_array(jsonb_build_object('id',item.id,'employee_id',eid,'net_paise',item.net_paise,'status',item.status,'revision',item.revision));
 end loop;
 return result;
end $$;
