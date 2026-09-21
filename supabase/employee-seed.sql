-- Explicitly fictional data, only in the existing SDC-DEMO tenant.
-- Safe to repeat: existing employees and their records are not overwritten.
do $$
declare t uuid; e uuid; g uuid; p record; i integer; day date; month_start date=date_trunc('month',current_date)::date;
 first_names text[]=array['Arjun','Ravi','Kiran','Suresh','Meena','Prakash','Lakshmi','Vijay','Divya','Naveen','Anita','Manoj','Priya','Harish','Deepa'];
 last_names text[]=array['Kumar','Gowda','Rao','Shetty','Naik','Patil','Reddy','Sharma','Nair','Das'];
 employee_category text;employee_status text;
begin
 select id into t from public.tenants where code='SDC-DEMO' and is_demo;
 if t is null then raise exception 'Create the SDC-DEMO foundation first. This seed never writes to live tenants.';end if;
 for i in 1..150 loop
  if exists(select 1 from public.employees where tenant_id=t and employee_code='DEMO-'||lpad(i::text,4,'0')) then continue;end if;
  select id into g from public.grades where tenant_id=t and code=case when i%20=0 then 'SUP' when i%10=0 then 'HEAD' else 'GUARD' end;
  employee_category=case when i>130 then 'trainee' when i%9=0 then 'reliever' when i%13=0 then 'contract' else 'full_time' end;
  employee_status=case when i in(22,55,77,111) then 'on_leave' when i=99 then 'suspended' else 'active' end;
  insert into public.employees(tenant_id,employee_code,full_name,grade_id,category,status,joined_on,notes)
  values(t,'DEMO-'||lpad(i::text,4,'0'),first_names[(i-1)%15+1]||' '||last_names[(i-1)/15+1],g,employee_category,employee_status,month_start-interval '6 months','Fictional employee for demonstration. No real identity or bank details.') returning id into e;
  insert into public.employee_events(tenant_id,employee_id,kind,effective_on,title,notes) values(t,e,'joined',month_start-interval '6 months','Joined SDC demonstration workforce','Fictional onboarding event.');
  if employee_category<>'trainee' and employee_status<>'suspended' then
   select id,site_id into p from public.posts where tenant_id=t and deleted_at is null order by code offset ((i-1)%40) limit 1;
   insert into public.employee_postings(tenant_id,employee_id,site_id,post_id,starts_on,reason) values(t,e,p.site_id,p.id,month_start,'Demonstration assignment');
  end if;
  insert into public.employee_salary_structures(tenant_id,employee_id,starts_on,basic_paise,da_paise,hra_paise,conveyance_paise,washing_paise,overtime_hour_paise,minimum_wage_paise,rule_source,rule_approved,notes)
  values(t,e,month_start-interval '6 months',1800000+(i%5)*100000,200000,250000,100000,50000,15000,2000000,'FICTIONAL DEMO — HR must configure and verify applicable statutory rates before any real payroll.',false,'Illustrative amounts only. No statutory rates are asserted.');
  for day in select generate_series(month_start-interval '1 month',current_date,interval '1 day')::date loop
   insert into public.employee_attendance(tenant_id,employee_id,work_date,status,approval,overtime_minutes,site_id,notes)
   values(t,e,day,case when extract(isodow from day)=7 then 'weekly_off' when i%17=0 and extract(day from day)=10 then 'absent' else 'present' end,'approved',case when i%11=0 and extract(isodow from day)=5 then 60 else 0 end,case when employee_category<>'trainee' and employee_status<>'suspended' then p.site_id end,'Fictional attendance for workflow demonstration.');
  end loop;
  insert into public.employee_leave_balances(tenant_id,employee_id,leave_type,year,entitled_days) select t,e,k,extract(year from current_date),case when k='annual' then 12 else 6 end from unnest(array['annual','sick','casual']) k;
  insert into public.employee_verifications(tenant_id,employee_id,kind,status,checked_on,expires_on,issuer,reference_mask,notes) values(t,e,'police',case when employee_category='trainee' then 'pending' else 'verified' end,month_start-30,month_start+335,'Demonstration record only','DEMO','Fictional verification; not proof of an actual police check.');
  insert into public.employee_certificates(tenant_id,employee_id,course_title,certificate_number,issued_on,expires_on,status,provider,hours,notes) values(t,e,'Fire safety and evacuation','DEMO-CERT-'||i,month_start-90,case when i%19=0 then month_start-1 else month_start+275 end,case when employee_category='trainee' then 'assigned' else 'passed' end,'SDC demonstration academy',8,'Fictional course record; not an actual qualification.');
  insert into public.employee_assets(tenant_id,employee_id,asset_type,serial,quantity,issued_on,condition,notes) values(t,e,'uniform','DEMO-U-'||i,2,month_start-30,'good','Fictional issue record.');
 end loop;
end $$;
