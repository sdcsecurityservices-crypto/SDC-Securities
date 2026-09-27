// Only run against a dedicated disposable PostgreSQL database, never live data.
// Covers 20260927120000_security_hardening.sql.
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {seedFoundation} from '../../scripts/seed-foundation.mjs';
const url=process.env.SDC_TEST_DATABASE_URL;
if(!url||!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('A localhost SDC_TEST_DATABASE_URL is required.');
const sql=postgres(url,{max:5,onnotice:()=>{}});
const ids=Object.fromEntries(['admin','hr','ops','guard'].map(k=>[k,randomUUID()]));
const as=(user,fn)=>sql.begin(async tx=>{await tx.unsafe('set local role authenticated');await tx`select set_config('request.jwt.claim.sub',${ids[user]},true)`;return fn(tx)});
const LAT=12.9716,LON=77.5946;
try{
 for(const [k,id] of Object.entries(ids))await sql`insert into auth.users(id,email) values(${id},${k+'@security.test'})`;
 const f=await seedFoundation(sql,{ownerId:ids.admin,code:'SEC-'+randomUUID()});const t=f.tenant.id,grade=f.grades[0].id,site=f.sites[0].id,post=f.posts[0].id;
 for(const [k,role] of [['hr','hr_payroll'],['ops','operations_manager'],['guard','employee']])await sql`insert into memberships(tenant_id,user_id,display_name,role) values(${t},${ids[k]},${k},${role})`;
 const [gm]=await sql`select id from memberships where user_id=${ids.guard}`;
 const [e]=await as('hr',tx=>tx`insert into employees(tenant_id,employee_code,full_name,grade_id,category,joined_on,membership_id) values(${t},'SEC-01','Fictional Guard',${grade},'full_time','2025-01-01',${gm.id}) returning *`);
 await as('ops',tx=>tx`insert into employee_postings(tenant_id,employee_id,site_id,post_id,starts_on,reason) values(${t},${e.id},${site},${post},'2025-01-01','Test posting')`);
 await as('admin',tx=>tx`update sites set latitude=${LAT},longitude=${LON},geofence_radius=150,row_version=row_version+1 where tenant_id=${t} and id=${site}`);
 const selfie=async()=>{const id=randomUUID();await as('guard',tx=>tx`insert into employee_documents(id,tenant_id,employee_id,category,title,file_name,mime_type,size_bytes,object_path,version) values(${id},${t},${e.id},'selfie','Selfie','selfie.jpg','image/jpeg',100,${t+'/'+e.id+'/'+id+'/selfie/selfie.jpg'},1)`);return id};

 // Online: a fresh selfie works once; reusing it is rejected.
 const a=await selfie();
 await as('guard',tx=>tx`select employee_check_attendance(${t},${e.id},'check_in',${LAT},${LON},10,${a})`);
 await as('guard',tx=>tx`select employee_check_attendance(${t},${e.id},'check_out',${LAT},${LON},10,null)`);
 await assert.rejects(()=>as('guard',tx=>tx`select employee_check_attendance(${t},${e.id},'check_in',${LAT},${LON},10,${a})`),/already been used/);

 // Offline: a selfie uploaded before the capture it claims to evidence is rejected.
 const old=await selfie();
 await sql`alter table public.employee_documents disable trigger user`;
 await sql`update public.employee_documents set created_at=now()-interval '22 hours' where tenant_id=${t} and id=${old}`;
 await sql`alter table public.employee_documents enable trigger user`;
 // Captured 20 hours ago (a different work day from the online check-in above).
 const captured=new Date(Date.now()-20*3600000).toISOString();
 const offline=(event,doc,action='check_in',at=captured)=>as('guard',tx=>tx`select offline_attendance_sync(${t},${event},${e.id},${site},${action},${at},${LAT},${LON},10,${doc}) as result`);
 await assert.rejects(()=>offline(randomUUID(),old),/selfie taken for this check-in/);
 // A selfie uploaded after capture (at sync time) is accepted, records the delay, and is single-use.
 const b=await selfie();
 const [ok]=await offline(randomUUID(),b);assert.equal(ok.result.approval,'pending');
 const [row]=await sql`select notes from employee_attendance where tenant_id=${t} and id=${ok.result.attendance_id}`;assert.match(row.notes,/received 1200 min after capture/);
 await offline(randomUUID(),null,'check_out',new Date(Date.now()-19*3600000).toISOString());
 await assert.rejects(()=>offline(randomUUID(),b,'check_in',new Date(Date.now()-2*60000).toISOString()),/already been used/);

 // Checkpoint tokens: guards can list checkpoints but not read tokens; staff get tokens via the function.
 const [cp]=await as('admin',tx=>tx`insert into field_checkpoints(tenant_id,site_id,title,location,latitude,longitude,radius_metres) values(${t},${site},'Gate 1','Main gate',${LAT},${LON},100) returning id`);
 const listed=await as('guard',tx=>tx`select id,title,location from field_checkpoints where tenant_id=${t}`);assert.equal(listed.length,1);
 await assert.rejects(()=>as('guard',tx=>tx`select token from field_checkpoints where tenant_id=${t}`),/permission denied/);
 await assert.rejects(()=>as('guard',tx=>tx`select * from field_checkpoints where tenant_id=${t}`),/permission denied/);
 await assert.rejects(()=>as('guard',tx=>tx`select checkpoint_qr_token(${t},${cp.id})`),/Access denied/);
 const [tk]=await as('admin',tx=>tx`select checkpoint_qr_token(${t},${cp.id}) as token`);assert.match(tk.token,/^[0-9a-f-]{36}$/);
 // Staff can still update checkpoints; guards can still scan with the physical QR token.
 await as('admin',tx=>tx`update field_checkpoints set title='Gate 1A',row_version=row_version+1 where tenant_id=${t} and id=${cp.id}`);
 const [patrol]=await as('admin',tx=>tx`insert into field_patrols(tenant_id,site_id,title,employee_id,starts_at,ends_at,checkpoint_ids,notes) values(${t},${site},'Night round',${e.id},now()-interval '5 minutes',now()+interval '1 hour',${[cp.id]},'') returning id`);
 await as('guard',tx=>tx`select patrol_scan(${t},${patrol.id},${tk.token},${LAT},${LON},10)`);
 await assert.rejects(()=>as('guard',tx=>tx`select patrol_scan(${t},${patrol.id},${tk.token},${LAT},${LON},10)`),/duplicate|unique/i);
 console.log('PASS security: single-use online selfie, offline selfie must postdate capture, receipt delay noted, offline reuse blocked, checkpoint tokens hidden from guards, staff-only QR token, scans still work and are deduplicated.');
}finally{await sql.end()}
