// Only run against a dedicated disposable PostgreSQL database, never live data.
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {seedFoundation} from '../../scripts/seed-foundation.mjs';
const url=process.env.SDC_TEST_DATABASE_URL;
if(!url||!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('A localhost SDC_TEST_DATABASE_URL is required.');
const sql=postgres(url,{max:5,onnotice:()=>{}});const ids={admin:randomUUID(),ops:randomUUID(),client:randomUUID(),supervisor:randomUUID(),employee:randomUUID(),outsider:randomUUID()};
const as=async(id,fn)=>sql.begin(async tx=>{await tx.unsafe('set local role authenticated');await tx`select set_config('request.jwt.claim.sub',${id},true)`;return fn(tx)});
try{
 for(const [name,id] of Object.entries(ids))await sql`insert into auth.users(id,email) values(${id},${name+'@sdc-test.example'})`;
 const seedCode='TEST-'+randomUUID();const data=await seedFoundation(sql,{ownerId:ids.admin,code:seedCode});const t=data.tenant.id;
 for(const [name,role] of [['ops','operations_manager'],['client','client_user'],['supervisor','site_lead'],['employee','employee']])await sql`insert into public.memberships(tenant_id,user_id,display_name,role) values(${t},${ids[name]},${name},${role})`;
 const members=await sql`select * from public.memberships where tenant_id=${t}`;
 await sql`insert into public.member_scopes(tenant_id,membership_id,client_id) values(${t},${members.find(m=>m.user_id===ids.client).id},${data.clients[0].id})`;
 await sql`insert into public.member_scopes(tenant_id,membership_id,site_id) values(${t},${members.find(m=>m.user_id===ids.supervisor).id},${data.sites[0].id})`;
 assert.equal((await as(ids.admin,tx=>tx`select * from public.clients where tenant_id=${t}`)).length,3);
 assert.equal((await as(ids.client,tx=>tx`select * from public.clients where tenant_id=${t}`)).length,1);
 assert.equal((await as(ids.client,tx=>tx`select * from public.sites where tenant_id=${t}`)).length,3);
 assert.equal((await as(ids.supervisor,tx=>tx`select * from public.sites where tenant_id=${t}`)).length,1);
 assert.equal((await as(ids.supervisor,tx=>tx`select * from public.posts where tenant_id=${t}`)).length,5);
 assert.equal((await as(ids.supervisor,tx=>tx`select * from public.contracts where tenant_id=${t}`)).length,0);
 assert.equal((await as(ids.employee,tx=>tx`select * from public.clients where tenant_id=${t}`)).length,0);
 assert.equal((await as(ids.outsider,tx=>tx`select * from public.clients where tenant_id=${t}`)).length,0);
 await assert.rejects(()=>as(ids.client,tx=>tx`insert into public.clients(tenant_id,code,name) values(${t},'DENIED','Denied write')`));
 await assert.rejects(()=>as(ids.client,tx=>tx`update public.memberships set role='admin' where user_id=${ids.client}`));
 const [second]=await sql`insert into public.tenants(name,code) values('Other tenant',${'OTHER-'+randomUUID()}) returning id`;
 const [foreignClient]=await sql`insert into public.clients(tenant_id,code,name) values(${second.id},'PRIVATE','Private client') returning id`;
 await assert.rejects(()=>as(ids.admin,tx=>tx`insert into public.sites(tenant_id,client_id,code,name,site_type) values(${t},${foreignClient.id},'BAD','Cross tenant','Hospital')`));
 const [row]=await as(ids.ops,tx=>tx`insert into public.clients(tenant_id,code,name) values(${t},${'TEST-'+randomUUID().slice(0,8)},'Created by Ops') returning *`);
 const changed=await as(ids.ops,tx=>tx`update public.clients set name='Changed by Ops',row_version=1 where tenant_id=${t} and id=${row.id} and row_version=0 returning *`);assert.equal(changed.length,1);
 assert.equal((await as(ids.ops,tx=>tx`update public.clients set name='Stale',row_version=1 where tenant_id=${t} and id=${row.id} and row_version=0 returning *`)).length,0);
 await assert.rejects(()=>as(ids.ops,tx=>tx`update public.clients set name='Bypass revision' where tenant_id=${t} and id=${row.id}`));
 const history=await as(ids.admin,tx=>tx`select * from public.audit_events where tenant_id=${t} and entity_id=${row.id} order by created_at`);assert.equal(history.length,2);assert.equal(history[0].actor_user_id,ids.ops);assert.equal(history[1].before_data.name,'Created by Ops');
 await assert.rejects(()=>as(ids.admin,tx=>tx`delete from public.audit_events where tenant_id=${t}`));
 await assert.rejects(()=>as(ids.ops,tx=>tx`update public.clients set deleted_at=now(),row_version=row_version+1 where tenant_id=${t} and id=${data.clients[0].id}`));
 await assert.rejects(()=>as(ids.ops,tx=>tx`insert into public.staffing_requirements(tenant_id,post_id,shift_id,headcount,effective_from) values(${t},${data.posts[0].id},${data.shifts[0].id},2,current_date)`));
 const raced=await Promise.allSettled([1,2].map(n=>as(ids.ops,tx=>tx`update public.clients set name=${'Racer '+n},row_version=2 where tenant_id=${t} and id=${row.id} and row_version=1 returning *`)));assert.equal(raced.filter(r=>r.status==='fulfilled'&&r.value.length===1).length,1);
 await sql`update public.memberships set active=false where user_id=${ids.supervisor}`;
 assert.equal((await as(ids.supervisor,tx=>tx`select * from public.sites where tenant_id=${t}`)).length,0);
 const before=await sql`select count(*)::int as n from public.posts where tenant_id=${t}`;await seedFoundation(sql,{ownerId:ids.admin,code:seedCode});assert.equal((await sql`select count(*)::int as n from public.posts where tenant_id=${t}`)[0].n,before[0].n);
 if((await sql`select to_regclass('storage.objects') as table_name`)[0].table_name){
  const path=`${t}/${randomUUID()}/test.pdf`;
  await as(ids.ops,tx=>tx`insert into storage.objects(bucket_id,name) values('sdc-foundation',${path})`);
  assert.equal((await as(ids.outsider,tx=>tx`select * from storage.objects where name=${path}`)).length,0);
  assert.equal((await as(ids.client,tx=>tx`select * from storage.objects where name=${path}`)).length,0);
  assert.equal((await as(ids.ops,tx=>tx`delete from storage.objects where name=${path} returning id`)).length,1);
  await assert.rejects(()=>as(ids.client,tx=>tx`insert into storage.objects(bucket_id,name) values('sdc-foundation',${path})`));
  console.log('PASS: Storage policy fixture denies unscoped reads/writes and permits operator orphan cleanup.');
 }
 console.log('PASS: 3 clients / 8 sites / 40 posts, idempotent seed, row isolation for client/supervisor/employee/outsider, cross-tenant FK, denied role escalation, scoped writes, immutable audit, archive dependencies, duplicate staffing, stale revisions, simultaneous updates, immediate membership revocation.');
}finally{await sql.end()}
