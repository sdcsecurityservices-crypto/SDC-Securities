import postgres from 'postgres';
import {pathToFileURL} from 'node:url';
export async function seedFoundation(sql,{ownerId,code='SDC-DEMO'}={}){
 return sql.begin(async tx=>{
  const [tenant]=await tx`insert into public.tenants(name,code,is_demo) values('SDC demonstration',${code},true) on conflict(code) do update set code=excluded.code returning *`;
  if(ownerId)await tx`insert into public.memberships(tenant_id,user_id,display_name,role) values(${tenant.id},${ownerId},'SDC Administrator','admin') on conflict(tenant_id,user_id) do nothing`;
  const create=async(table,values,where)=>{const existing=await tx`select * from ${tx('public.'+table)} where tenant_id=${tenant.id} and ${tx(where.key)}=${where.value} limit 1`;if(existing.length)return existing[0];const [row]=await tx`insert into ${tx('public.'+table)} ${tx({tenant_id:tenant.id,...values})} returning *`;return row};
  const grades=[];for(const [code,name,rank] of [['GUARD','Security Officer',1],['HEAD','Head Guard',2],['SUP','Site Supervisor',3]])grades.push(await create('grades',{code,name,rank},{key:'code',value:code}));
  const shifts=[];for(const [code,name,starts_at,duration_minutes] of [['MORNING','Morning watch','06:00',480],['AFTERNOON','Afternoon watch','14:00',480],['NIGHT','Night watch','22:00',480],['DAY12','Extended day','06:00',720]])shifts.push(await create('shift_templates',{code,name,starts_at,duration_minutes,break_minutes:0},{key:'code',value:code}));
  const clientSpecs=[['NORTHSTAR','Northstar Healthcare','Northstar Healthcare Services (Fictional)'],['OAKRIDGE','Oakridge Education','Oakridge Education Trust (Fictional)'],['HORIZON','Horizon Workspaces','Horizon Workspaces (Fictional)']];
  const clients=[];for(const [code,name,legal_name] of clientSpecs)clients.push(await create('clients',{code,name,legal_name,billing_address:'Bengaluru, Karnataka · fictional demonstration',billing_cycle:'monthly',notes:'Fictional demonstration record. No live client contract.'},{key:'code',value:code}));
  const siteSpecs=[[0,'NS-MAIN','Northstar Hospital','Hospital','Hebbal'],[0,'NS-EAST','Northstar East Clinic','Hospital','Whitefield'],[0,'NS-SOUTH','Northstar South Care','Hospital','Jayanagar'],[1,'OR-COL','Oakridge College','College','Yelahanka'],[1,'OR-SCHOOL','Oakridge School','School','Hennur'],[2,'HZ-TECH','Horizon Tech Park','IT park','Whitefield'],[2,'HZ-WEST','Horizon Business Centre','IT park','Rajajinagar'],[2,'HZ-LOG','Horizon Logistics Hub','Warehouse','Peenya']];
  const today=new Date().toISOString().slice(0,7)+'-01';const sites=[],posts=[];
  for(const [ci,code,name,site_type,area] of siteSpecs){const site=await create('sites',{client_id:clients[ci].id,code,name,site_type,address:`${area}, Bengaluru · illustrative location`,geofence_radius:150,starts_on:today,sop_notes:'Confirm visitor authorization, maintain the occurrence book, and escalate exceptions to the site supervisor.'},{key:'code',value:code});sites.push(site);
   for(const [index,label] of ['Main entrance','Visitor reception','Control room','Perimeter patrol','Service gate'].entries()){
    const postCode=code+'-P'+(index+1);const post=await create('posts',{site_id:site.id,code:postCode,name:label,grade_id:grades[index===2?2:0].id,location_notes:'Position to be confirmed during site induction.'},{key:'code',value:postCode});posts.push(post);
    for(const shift of shifts.slice(0,3)){const exists=await tx`select id from public.staffing_requirements where tenant_id=${tenant.id} and post_id=${post.id} and shift_id=${shift.id}`;if(!exists.length)await tx`insert into public.staffing_requirements(tenant_id,post_id,shift_id,headcount,effective_from) values(${tenant.id},${post.id},${shift.id},${index===0?2:1},${today})`;}
   }
  }
  for(const client of clients){const contract=await create('contracts',{client_id:client.id,number:'DEMO-'+client.code,starts_on:today,ends_on:'2027-12-31',sla_terms:'Illustrative: maintain contracted strength and document all exceptions.',penalty_terms:'No commercial terms apply to this fictional contract.'},{key:'number',value:'DEMO-'+client.code});for(const grade of grades){const exists=await tx`select id from public.rate_card_lines where tenant_id=${tenant.id} and contract_id=${contract.id} and grade_id=${grade.id}`;if(!exists.length)await tx`insert into public.rate_card_lines(tenant_id,contract_id,grade_id,monthly_rate_paise,overtime_hour_paise) values(${tenant.id},${contract.id},${grade.id},${(25000+grade.rank*3000)*100},${15000+grade.rank*1000})`;}}
  return {tenant,clients,sites,posts,grades,shifts};
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL through your secret environment.');
 if(!process.env.SDC_BOOTSTRAP_EMAIL)throw Error('Set SDC_BOOTSTRAP_EMAIL to the verified Supabase user who should administer this demo.');
 const sql=postgres(process.env.DATABASE_URL,{max:1});try{
 const [owner]=await sql`select id from auth.users where lower(email)=lower(${process.env.SDC_BOOTSTRAP_EMAIL}) and email_confirmed_at is not null`;
 if(!owner)throw Error('Create and verify the intended Supabase Auth user before bootstrapping access.');
 const result=await seedFoundation(sql,{ownerId:owner.id});console.log(`Seed ready: ${result.clients.length} clients, ${result.sites.length} sites, ${result.posts.length} posts. Existing records preserved.`);
 }finally{await sql.end()}
}
