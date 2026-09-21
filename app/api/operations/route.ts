import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database } from '@/lib/db';
import {seed,sites,shifts,type State,type Role} from '@/lib/demo';
import {z} from 'zod';
export const dynamic='force-dynamic';
const text=z.string().trim().min(2).max(100);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().startsWith(v),'Invalid date');
const site=z.enum(['Northstar Hospital','Oakridge College','Horizon Tech Park']);
const duty=z.object({employeeId:z.string().max(30),site,post:text,shift:z.enum(['06:00 – 14:00','14:00 – 22:00','22:00 – 06:00']),date});
const requestSchema=z.object({version:z.number().int().nonnegative(),role:z.enum(['Admin','Operations Manager','Site Lead','Employee']),action:z.discriminatedUnion('type',[
 z.object({type:z.literal('employee'),name:text,designation:z.enum(['Security Officer','Site Supervisor','Facility Associate']),site}),
 z.object({type:z.literal('assign'),duties:z.array(duty).min(1).max(100)}),
 z.object({type:z.literal('attendance'),id:z.string(),status:z.enum(['Present','Absent'])}),
 z.object({type:z.literal('incident'),site,title:text,priority:z.enum(['High','Medium','Low'])}),
 z.object({type:z.literal('resolve'),id:z.string()}),
 z.object({type:z.literal('leave'),id:z.string(),status:z.enum(['Approved','Declined'])})
])});
function response(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
async function read(owner:string){const db=database();await db.prepare('INSERT OR IGNORE INTO demo_workspaces (owner,state,version) VALUES (?,?,0)').bind(owner,JSON.stringify(seed())).run();return await db.prepare('SELECT state,version FROM demo_workspaces WHERE owner = ?').bind(owner).first<{state:string;version:number}>();}
export async function GET(){try{const user=await getChatGPTUser();if(!user)return response({error:'Please sign in to open the demonstration.'},401);const row=await read(user.userId);if(!row)throw Error('Missing workspace');return response({state:JSON.parse(row.state),version:row.version});}catch(e){console.error('Operations read failed',e);return response({error:'We could not load your demo. Please try again.'},503)}}
export async function POST(req:Request){try{
 const user=await getChatGPTUser();if(!user)return response({error:'Please sign in again.'},401);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return response({error:'Invalid request origin.'},403);
 const raw=await req.text();if(raw.length>40000)return response({error:'Request is too large.'},413);
 let body;try{body=requestSchema.parse(JSON.parse(raw))}catch{return response({error:'Please check all fields and try again.'},400)}
 const {role,action,version}=body;
 // Role selection is an explicit owner-only demo capability, not production staff authentication.
 const permissions:Record<Role,string[]>={Admin:['employee','assign','attendance','incident','resolve','leave'],'Operations Manager':['assign','attendance','incident','resolve','leave'],'Site Lead':['attendance','incident','resolve'],Employee:[]};
 if(!permissions[role].includes(action.type))return response({error:'This action is not available in the selected role preview.'},403);
 const row=await read(user.userId);if(!row)throw Error('Missing workspace');if(row.version!==version)return response({error:'The roster changed in another window. Refresh and try again.'},409);
 const state:State=JSON.parse(row.state);const now=new Date().toISOString();let summary='';
 if(action.type==='employee'){const id=`SDC-${Math.max(...state.employees.map(e=>Number(e.id.split('-')[1])))+1}`;state.employees.push({id,name:action.name,designation:action.designation,site:action.site,status:'Active',joined:now.slice(0,10),training:'Refresher due'});summary=`Employee added · ${action.name}`;}
 if(action.type==='assign'){
  const seen=new Set<string>();for(const item of action.duties){const e=state.employees.find(e=>e.id===item.employeeId);if(!e||e.status!=='Active')return response({error:'Select an active employee for every assignment.'},400);if(e.site!==item.site)return response({error:`${e.name} is assigned to ${e.site}. Select that deployment site.`},400);if(state.leaves.some(l=>l.employeeId===e.id&&l.status==='Approved'&&item.date>=l.from&&item.date<=l.to))return response({error:`${e.name} has approved leave on ${item.date}.`},409);const k=item.employeeId+item.date;if(seen.has(k)||state.duties.some(d=>d.employeeId===item.employeeId&&d.date===item.date))return response({error:`${e.name} already has a duty on ${item.date}. Choose another day or employee.`},409);seen.add(k)}
  for(const d of action.duties)state.duties.push({...d,id:crypto.randomUUID(),attendance:'Scheduled',publishedAt:now});summary=`Duty roster published · ${action.duties.length} assignment${action.duties.length===1?'':'s'}`;
 }
 if(action.type==='attendance'){const d=state.duties.find(d=>d.id===action.id);if(!d)return response({error:'Duty not found.'},404);if(role==='Site Lead'&&d.site!==sites[1])return response({error:'Site leads can update only their assigned site.'},403);d.attendance=action.status;summary=`${action.status} · ${state.employees.find(e=>e.id===d.employeeId)?.name}`;}
 if(action.type==='incident'){if(role==='Site Lead'&&action.site!==sites[1])return response({error:'Select your assigned site.'},403);state.incidents.unshift({id:`INC-${Date.now().toString().slice(-6)}`,site:action.site,title:action.title,priority:action.priority,status:'Open',time:now});summary=`Incident reported · ${action.title}`;}
 if(action.type==='resolve'){const i=state.incidents.find(i=>i.id===action.id);if(!i)return response({error:'Incident not found.'},404);if(role==='Site Lead'&&i.site!==sites[1])return response({error:'Select an incident from your assigned site.'},403);i.status='Resolved';summary=`Incident resolved · ${i.title}`;}
 if(action.type==='leave'){const l=state.leaves.find(l=>l.id===action.id);if(!l)return response({error:'Request not found.'},404);if(l.status!=='Pending')return response({error:'This request has already been reviewed.'},409);if(action.status==='Approved'&&state.duties.some(d=>d.employeeId===l.employeeId&&d.date>=l.from&&d.date<=l.to))return response({error:'This employee has a duty during the requested leave. Review the roster first.'},409);l.status=action.status;summary=`Leave ${action.status.toLowerCase()} · ${state.employees.find(e=>e.id===l.employeeId)?.name}`;}
 state.audit.unshift({id:crypto.randomUUID(),action:summary,time:now,role});
 const saved=await database().prepare('UPDATE demo_workspaces SET state=?,version=version+1 WHERE owner=? AND version=?').bind(JSON.stringify(state),user.userId,version).run();if(saved.meta.changes!==1)return response({error:'Another update arrived first. Refresh and try again.'},409);
 return response({state,version:version+1,message:summary});
 }catch(e){console.error('Operations save failed',e);return response({error:'Your changes could not be saved. Please try again.'},503)}}
