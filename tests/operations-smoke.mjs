// Localhost only; requires seeded demo. Mutates fictional demo data.
import assert from 'node:assert/strict';
const base='http://localhost:5173';
const headers={'Cookie':'__sites_local_auth=1','Content-Type':'application/json','Origin':base};
const request=async(action,version,role='Admin')=>{const r=await fetch(base+'/api/operations',{method:'POST',headers,body:JSON.stringify({action,version,role})});return {status:r.status,body:await r.json()}};
const read=async()=>{const r=await fetch(base+'/api/operations',{headers});assert.equal(r.status,200);return r.json()};
const anonymous=await fetch(base+'/api/operations');assert.equal(anonymous.status,401);
let data=await read();assert(data.state.duties.length>=10,'Seeded roster is available');
let r=await request({type:'employee',name:'Test Officer',designation:'Security Officer',site:'Northstar Hospital'},data.version,'Site Lead');assert.equal(r.status,403);
r=await request({type:'attendance',id:'D-7',status:'Present'},data.version,'Site Lead');assert.equal(r.status,403);
r=await request({type:'assign',duties:[{employeeId:'SDC-0101',site:'Northstar Hospital',post:'Main entrance',shift:'06:00 – 14:00',date:'2026-09-21'}]},data.version);assert.equal(r.status,409);
r=await request({type:'attendance',id:'D-7',status:'Present'},data.version-1);assert.equal(r.status,409);
r=await request({type:'assign',duties:[{employeeId:'SDC-0101',site:'Northstar Hospital',post:'Main entrance',shift:'06:00 – 14:00',date:'2026-02-30'}]},data.version);assert.equal(r.status,400);
r=await request({type:'incident',site:'Northstar Hospital',title:'Training exercise — access inspection',priority:'Low'},data.version,'Site Lead');assert.equal(r.status,200);data=r.body;const incident=data.state.incidents[0];
r=await request({type:'resolve',id:incident.id},data.version,'Site Lead');assert.equal(r.status,200);data=r.body;assert.equal(data.state.incidents[0].status,'Resolved');
r=await request({type:'attendance',id:'D-7',status:'Present'},data.version,'Operations Manager');assert.equal(r.status,200);data=r.body;assert.equal(data.state.duties.find(d=>d.id==='D-7').attendance,'Present');
if(data.state.leaves.find(l=>l.id==='L-1').status==='Pending'){r=await request({type:'leave',id:'L-1',status:'Approved'},data.version);assert.equal(r.status,200);data=r.body;}
r=await request({type:'assign',duties:[{employeeId:'SDC-0103',site:'Northstar Hospital',post:'Main entrance',shift:'06:00 – 14:00',date:'2026-09-24'}]},data.version);assert.equal(r.status,409);
const reread=await read();assert.equal(reread.version,data.version);assert.equal(reread.state.audit[0].action,data.state.audit[0].action);
console.log('PASS: anonymous rejection, role action restrictions, site scoping, duplicate prevention, invalid date, stale version, approved-leave conflict, incident workflow, attendance, leave approval, persistence, audit trail.');
