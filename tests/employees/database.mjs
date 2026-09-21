import assert from 'node:assert/strict';import postgres from 'postgres';import {randomUUID} from 'node:crypto';import {seedFoundation} from '../../scripts/seed-foundation.mjs';
const url=process.env.SDC_TEST_DATABASE_URL;if(!url||!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Use a disposable localhost database.');
const sql=postgres(url,{max:5,onnotice:()=>{}});const ids=Object.fromEntries(['admin','hr','ops','supervisor','self','client','outsider'].map(k=>[k,randomUUID()]));const as=(user,fn)=>sql.begin(async tx=>{await tx.unsafe('set local role authenticated');await tx`select set_config('request.jwt.claim.sub',${ids[user]},true)`;return fn(tx)});const fail=async(fn,pattern)=>assert.rejects(fn,pattern);
try{
 for(const [k,id] of Object.entries(ids))await sql`insert into auth.users(id,email) values(${id},${k+'@example.test'})`;
 const foundation=await seedFoundation(sql,{ownerId:ids.admin,code:'TEST-'+randomUUID()});const t=foundation.tenant.id,grade=foundation.grades[0].id,site=foundation.sites[0].id,post=foundation.posts[0].id;
 for(const [key,role] of [['hr','hr_payroll'],['ops','operations_manager'],['supervisor','site_lead'],['self','employee'],['client','client_user']])await sql`insert into memberships(tenant_id,user_id,display_name,role) values(${t},${ids[key]},${key},${role})`;
 const [self]=await sql`select id from memberships where user_id=${ids.self}`;const [supervisor]=await sql`select id from memberships where user_id=${ids.supervisor}`;
 await sql`insert into member_scopes(tenant_id,membership_id,site_id) values(${t},${supervisor.id},${site})`;
 const [e]=await as('hr',tx=>tx`insert into employees(tenant_id,employee_code,full_name,grade_id,category,joined_on,membership_id) values(${t},'EMP-01','Fictional Test Employee',${grade},'full_time','2025-01-01',${self.id}) returning *`);
 const [other]=await as('hr',tx=>tx`insert into employees(tenant_id,employee_code,full_name,grade_id,category,joined_on) values(${t},'EMP-02','Another Employee',${grade},'full_time','2025-01-01') returning *`);
 assert.equal((await as('self',tx=>tx`select * from employees where tenant_id=${t}`)).length,1);assert.equal((await as('client',tx=>tx`select * from employees where tenant_id=${t}`)).length,0);assert.equal((await as('outsider',tx=>tx`select * from employees where tenant_id=${t}`)).length,0);
 await fail(()=>as('ops',tx=>tx`insert into employees(tenant_id,employee_code,full_name,grade_id,category,joined_on) values(${t},'NO','No rights',${grade},'full_time',current_date)`),/row-level security/);
 const [posting]=await as('ops',tx=>tx`insert into employee_postings(tenant_id,employee_id,site_id,post_id,starts_on,reason) values(${t},${e.id},${site},${post},'2025-01-01','Test assignment') returning *`);
 await fail(()=>as('ops',tx=>tx`insert into employee_postings(tenant_id,employee_id,site_id,post_id,starts_on,reason) values(${t},${e.id},${site},${post},current_date,'Overlapping')`),/already covers/);
 assert.equal((await as('supervisor',tx=>tx`select * from employees where tenant_id=${t}`)).length,1);
 await as('hr',tx=>tx`insert into employee_private_profiles(tenant_id,employee_id,ciphertext,masked) values(${t},${e.id},'encrypted-example',${sql.json({aadhaar:'********1234'})})`);
 assert.equal((await as('ops',tx=>tx`select * from employee_private_profiles where tenant_id=${t}`)).length,0);assert.equal((await as('self',tx=>tx`select * from employee_private_profiles where tenant_id=${t}`)).length,1);
 await fail(()=>as('ops',tx=>tx`select employee_access_audit(${t},${e.id},'private_reveal','Unauthorized test')`),/Access denied/);
 await as('hr',tx=>tx`select employee_access_audit(${t},${e.id},'private_reveal','Onboarding verification')`);
 const audits=await as('ops',tx=>tx`select * from audit_events where tenant_id=${t}`);assert(!JSON.stringify(audits).includes('encrypted-example'));assert(!JSON.stringify(audits).includes('********1234'));
 assert.equal((await as('ops',tx=>tx`select * from employee_record_history where tenant_id=${t}`)).length,0);
 await as('hr',tx=>tx`insert into employee_leave_balances(tenant_id,employee_id,leave_type,year,entitled_days) values(${t},${e.id},'annual',2026,2)`);
 await as('self',tx=>tx`insert into employee_leave_requests(tenant_id,employee_id,leave_type,starts_on,ends_on,reason) values(${t},${e.id},'annual','2026-10-01','2026-10-02','Personal request')`);
 await fail(()=>as('self',tx=>tx`insert into employee_leave_requests(tenant_id,employee_id,leave_type,starts_on,ends_on,reason,status) values(${t},${e.id},'annual','2026-10-01','2026-10-02','Self approval','approved')`),/row-level security/);
 await fail(()=>as('hr',tx=>tx`insert into employee_leave_requests(tenant_id,employee_id,leave_type,starts_on,ends_on,reason,status) values(${t},${e.id},'annual','2026-10-01','2026-10-03','Too many','approved')`),/Insufficient/);
 await as('hr',tx=>tx`insert into employee_leave_requests(tenant_id,employee_id,leave_type,starts_on,ends_on,reason,status) values(${t},${e.id},'annual','2026-10-01','2026-10-02','Within entitlement','approved')`);
 const [salary]=await as('hr',tx=>tx`insert into employee_salary_structures(tenant_id,employee_id,starts_on,basic_paise,hra_paise,pf_basis_points,pf_ceiling_paise,minimum_wage_paise,rule_source,rule_approved) values(${t},${e.id},'2025-01-01',2000000,400000,1200,1500000,2000000,'Fictional test policy',false) returning *`);
 await fail(()=>as('hr',tx=>tx`insert into employee_salary_structures(tenant_id,employee_id,starts_on,basic_paise,rule_source) values(${t},${e.id},'2026-01-01',2100000,'Overlap test')`),/already covers/);
 await fail(()=>as('hr',tx=>tx`select employee_run_payroll(${t},${[e.id]}::uuid[],'2026-08-01',false,'')`),/Approve attendance/);
 await as('hr',tx=>tx`insert into employee_attendance(tenant_id,employee_id,work_date,status,approval,site_id) select ${t},${e.id},d,'present','approved',${site} from generate_series('2026-08-01'::date,'2026-08-31',interval '1 day') d`);
 // Historical attendance from another site remains invisible to a scoped supervisor.
 await as('hr',tx=>tx`insert into employee_attendance(tenant_id,employee_id,work_date,status,approval,site_id) values(${t},${e.id},'2026-07-31','present','approved',${foundation.sites[1].id})`);
 assert.equal((await as('supervisor',tx=>tx`select * from employee_attendance where tenant_id=${t}`)).length,31);
 const draft=await as('hr',tx=>tx`select employee_run_payroll(${t},${[e.id]}::uuid[],'2026-08-01',false,'') as result`);assert.equal(draft[0].result[0].net_paise,2220000);
 assert.equal((await as('self',tx=>tx`select * from employee_payslips where tenant_id=${t}`)).length,0);
 await fail(()=>as('hr',tx=>tx`select employee_run_payroll(${t},${[e.id]}::uuid[],'2026-08-01',true,'')`),/Release blocked/);
 await as('hr',tx=>tx`update employee_salary_structures set rule_approved=true,row_version=row_version+1 where tenant_id=${t} and id=${salary.id}`);
 const result=await as('hr',tx=>tx`select employee_run_payroll(${t},${[e.id]}::uuid[],'2026-08-01',true,'') as result`);const slip=result[0].result[0];
 assert.equal((await as('self',tx=>tx`select * from employee_payslips where tenant_id=${t}`)).length,1);
 await fail(()=>as('hr',tx=>tx`update employee_payslips set net_paise=1 where tenant_id=${t}`),/permission denied/);
 const [snap]=await as('hr',tx=>tx`select breakdown from employee_payslips where tenant_id=${t} and id=${slip.id}`);assert.equal(snap.breakdown.snapshots[0].salary_values.basic_paise,2000000);
 await fail(()=>as('hr',tx=>tx`select employee_run_payroll(${t},${[e.id]}::uuid[],'2026-08-01',true,'')`),/reason/);
 await as('hr',tx=>tx`insert into employee_payments(tenant_id,employee_id,payslip_id,kind,amount_paise,paid_on,mode,reference,status) values(${t},${e.id},${slip.id},'salary',2220000,current_date,'bank','TEST-UTR-1','paid')`);
 await fail(()=>as('hr',tx=>tx`insert into employee_payments(tenant_id,employee_id,payslip_id,kind,amount_paise,paid_on,mode,reference,status) values(${t},${e.id},${slip.id},'salary',1,current_date,'bank','TEST-UTR-2','paid')`),/exceeds/);
 await fail(()=>as('hr',tx=>tx`select employee_run_payroll(${t},${[e.id]}::uuid[],'2026-08-01',true,'Corrected attendance')`),/Paid payslips/);

 // A paid advance can be scheduled, and release recovers exactly one installment.
 const [advancePayment]=await as('hr',tx=>tx`insert into employee_payments(tenant_id,employee_id,kind,amount_paise,paid_on,mode,reference,status) values(${t},${other.id},'advance',600000,'2026-07-01','bank','ADVANCE-001','paid') returning *`);
 const [advance]=await as('hr',tx=>tx`insert into employee_advances(tenant_id,employee_id,payment_id,principal_paise,installment_paise,starts_on) values(${t},${other.id},${advancePayment.id},600000,200000,'2026-08-01') returning *`);
 await as('hr',tx=>tx`insert into employee_salary_structures(tenant_id,employee_id,starts_on,basic_paise,minimum_wage_paise,rule_source,rule_approved) values(${t},${other.id},'2025-01-01',2000000,2000000,'Fictional test policy',true)`);
 await as('hr',tx=>tx`insert into employee_attendance(tenant_id,employee_id,work_date,status,approval) select ${t},${other.id},d,'present','approved' from generate_series('2026-08-01'::date,'2026-08-31',interval '1 day') d`);
 const withAdvance=await as('hr',tx=>tx`select employee_run_payroll(${t},${[other.id]}::uuid[],'2026-08-01',true,'') as result`);assert.equal(withAdvance[0].result[0].net_paise,1800000);
 await fail(()=>as('hr',tx=>tx`update employee_advances set installment_paise=300000,row_version=row_version+1 where tenant_id=${t} and id=${advance.id}`),/immutable/);
 await fail(()=>as('hr',tx=>tx`update employee_payments set amount_paise=1,row_version=row_version+1 where tenant_id=${t} and id=${advancePayment.id}`),/cannot be changed/);
 // Online GPS check-in requires current self assignment, accurate location and a fresh own selfie.
 await as('admin',tx=>tx`update sites set latitude=12.9716,longitude=77.5946,geofence_radius=150,row_version=row_version+1 where tenant_id=${t} and id=${site}`);
 const docid=randomUUID();await as('self',tx=>tx`insert into employee_documents(id,tenant_id,employee_id,category,title,file_name,mime_type,size_bytes,object_path,version) values(${docid},${t},${e.id},'selfie','Test selfie','selfie.jpg','image/jpeg',100,${t+'/'+e.id+'/'+docid+'/selfie/selfie.jpg'},1)`);
 await fail(()=>as('self',tx=>tx`select employee_check_attendance(${t},${e.id},'check_in',13.9716,77.5946,10,${docid})`),/geofence/);
 await fail(()=>as('self',tx=>tx`select employee_check_attendance(${t},${other.id},'check_in',12.9716,77.5946,10,${docid})`),/Only your own/);
 const gps=await as('self',tx=>tx`select employee_check_attendance(${t},${e.id},'check_in',12.9716,77.5946,10,${docid}) as result`);assert.equal(gps[0].result.approval,'pending');
 const checkout=await as('self',tx=>tx`select employee_check_attendance(${t},${e.id},'check_out',12.9716,77.5946,10,null) as result`);assert(checkout[0].result.check_out);
 const [card]=await as('ops',tx=>tx`insert into employee_id_cards(tenant_id,employee_id,serial,valid_from,valid_until,issuer) values(${t},${e.id},${randomUUID()},current_date,current_date+365,'SDC Test') returning *`);
 const anon=fn=>sql.begin(async tx=>{await tx.unsafe('set local role anon');return fn(tx)});
 assert.equal((await anon(tx=>tx`select verify_employee_card(${card.token}) as card`))[0].card.status,'valid');
 const pub=(await anon(tx=>tx`select verify_employee_card(${card.token}) as card`))[0].card;assert.deepEqual(Object.keys(pub).sort(),['name','photo','status','valid_from','valid_until']);
 await as('hr',tx=>tx`update employees set status='exited',exited_on=current_date,row_version=row_version+1 where tenant_id=${t} and id=${e.id}`);
 assert.equal((await anon(tx=>tx`select verify_employee_card(${card.token}) as card`))[0].card.status,'revoked');assert.equal((await as('self',tx=>tx`select * from employees where tenant_id=${t}`)).length,0);
 assert.equal((await as('hr',tx=>tx`select ends_on::text from employee_postings where tenant_id=${t} and id=${posting.id}`))[0].ends_on,new Date().toISOString().slice(0,10));
 const history=await as('hr',tx=>tx`select * from employee_record_history where tenant_id=${t} and entity_id=${e.id}`);assert.equal(history.length,2);assert.equal(history.find(h=>h.before_data).before_data.status,'active');

 const [raceEmployee]=await as('hr',tx=>tx`insert into employees(tenant_id,employee_code,full_name,grade_id,category,joined_on) values(${t},'RACE-01','Concurrent Assignment Test',${grade},'full_time','2025-01-01') returning *`);
 const race=await Promise.allSettled([1,2].map(i=>as('ops',tx=>tx`insert into employee_postings(tenant_id,employee_id,site_id,post_id,starts_on,reason) values(${t},${raceEmployee.id},${site},${post},current_date,${'Concurrent '+i}) returning id`)));
 assert.equal(race.filter(r=>r.status==='fulfilled').length,1);assert.equal(race.filter(r=>r.status==='rejected').length,1);
 console.log('PASS: Employee role isolation, HR-only KYC, redacted operations audit, protected immutable revisions, own-site attendance, self leave restrictions, leave entitlement, non-overlapping postings/salary, complete attendance prerequisite, exact payroll arithmetic, reviewed-rate release, self-only released slips, immutable payroll, retained salary snapshots, no overpayment, paid correction denial, minimal public verification, automatic exit revocation and access removal, installment deduction and schedule immutability, GPS distance and ownership checks, fresh-selfie check-in and check-out.');
}finally{await sql.end()}
