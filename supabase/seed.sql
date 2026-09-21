-- Idempotent, fictional demonstration data. Does not create users or grant access.
do $$
declare t uuid; c uuid; s uuid; p uuid; g uuid; ct uuid; x record; y record; z record;
begin
 insert into public.tenants(name,code,is_demo) values('SDC demonstration','SDC-DEMO',true) on conflict(code) do nothing;
 select id into t from public.tenants where code='SDC-DEMO';
 for x in select * from (values('GUARD','Security Officer',1),('HEAD','Head Guard',2),('SUP','Site Supervisor',3)) v(code,name,rank) loop
  insert into public.grades(tenant_id,code,name,rank) select t,x.code,x.name,x.rank where not exists(select 1 from public.grades where tenant_id=t and code=x.code);
 end loop;
 for x in select * from (values('MORNING','Morning watch','06:00',480),('AFTERNOON','Afternoon watch','14:00',480),('NIGHT','Night watch','22:00',480),('DAY12','Extended day','06:00',720)) v(code,name,starts_at,duration_minutes) loop
  insert into public.shift_templates(tenant_id,code,name,starts_at,duration_minutes) select t,x.code,x.name,x.starts_at::time,x.duration_minutes where not exists(select 1 from public.shift_templates where tenant_id=t and code=x.code);
 end loop;
 for x in select * from (values('NORTHSTAR','Northstar Healthcare'),('OAKRIDGE','Oakridge Education'),('HORIZON','Horizon Workspaces')) v(code,name) loop
  insert into public.clients(tenant_id,code,name,legal_name,billing_address,notes) select t,x.code,x.name,x.name||' (Fictional)','Bengaluru, Karnataka · fictional demonstration','Fictional demonstration record. No live client contract.' where not exists(select 1 from public.clients where tenant_id=t and code=x.code);
  select id into c from public.clients where tenant_id=t and code=x.code;
  insert into public.contracts(tenant_id,client_id,number,starts_on,ends_on,sla_terms,penalty_terms) select t,c,'DEMO-'||x.code,date_trunc('month',current_date)::date,(current_date+interval '1 year')::date,'Illustrative: maintain contracted strength and document exceptions.','No commercial terms apply to this fictional contract.' where not exists(select 1 from public.contracts where tenant_id=t and number='DEMO-'||x.code);
  select id into ct from public.contracts where tenant_id=t and number='DEMO-'||x.code;
  for y in select * from public.grades where tenant_id=t loop
   insert into public.rate_card_lines(tenant_id,contract_id,grade_id,monthly_rate_paise,overtime_hour_paise) select t,ct,y.id,(25000+y.rank*3000)*100,15000+y.rank*1000 where not exists(select 1 from public.rate_card_lines where tenant_id=t and contract_id=ct and grade_id=y.id);
  end loop;
 end loop;
 for x in select * from (values('NORTHSTAR','NS-MAIN','Northstar Hospital','Hospital','Hebbal'),('NORTHSTAR','NS-EAST','Northstar East Clinic','Hospital','Whitefield'),('NORTHSTAR','NS-SOUTH','Northstar South Care','Hospital','Jayanagar'),('OAKRIDGE','OR-COL','Oakridge College','College','Yelahanka'),('OAKRIDGE','OR-SCHOOL','Oakridge School','School','Hennur'),('HORIZON','HZ-TECH','Horizon Tech Park','IT park','Whitefield'),('HORIZON','HZ-WEST','Horizon Business Centre','IT park','Rajajinagar'),('HORIZON','HZ-LOG','Horizon Logistics Hub','Warehouse','Peenya')) v(client_code,code,name,site_type,area) loop
  select id into c from public.clients where tenant_id=t and code=x.client_code;
  insert into public.sites(tenant_id,client_id,code,name,site_type,address,starts_on,sop_notes) select t,c,x.code,x.name,x.site_type,x.area||', Bengaluru · illustrative location',date_trunc('month',current_date)::date,'Confirm visitor authorization and escalate exceptions to the site supervisor.' where not exists(select 1 from public.sites where tenant_id=t and code=x.code);
  select id into s from public.sites where tenant_id=t and code=x.code;
  for y in select * from (values(1,'Main entrance'),(2,'Visitor reception'),(3,'Control room'),(4,'Perimeter patrol'),(5,'Service gate')) v(n,name) loop
   select id into g from public.grades where tenant_id=t and code=case when y.n=3 then 'SUP' else 'GUARD' end;
   insert into public.posts(tenant_id,site_id,code,name,grade_id) select t,s,x.code||'-P'||y.n,y.name,g where not exists(select 1 from public.posts where tenant_id=t and code=x.code||'-P'||y.n);
   select id into p from public.posts where tenant_id=t and code=x.code||'-P'||y.n;
   for z in select id from public.shift_templates where tenant_id=t and code in ('MORNING','AFTERNOON','NIGHT') loop
    insert into public.staffing_requirements(tenant_id,post_id,shift_id,headcount,effective_from) select t,p,z.id,case when y.n=1 then 2 else 1 end,date_trunc('month',current_date)::date where not exists(select 1 from public.staffing_requirements where tenant_id=t and post_id=p and shift_id=z.id);
   end loop;
  end loop;
 end loop;
end $$;
