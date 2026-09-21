import type {State, Duty, Role} from './demo';

export type Placement = Pick<Duty, 'employeeId'|'site'|'post'|'shift'|'date'>;
export type DeploymentDraft = {site:string;week:string;placements:Placement[];baseFingerprint:string;savedAt:string;savedBy:Role};
export type Publication = {id:string;site:string;week:string;publishedAt:string;publishedBy:Role;before:Duty[];after:Duty[];gaps:number};
export const DEFAULT_POSTS = ['Main entrance','Emergency block','Visitor reception'];
export const SHIFT_HOURS:Record<string,number>={'06:00 – 14:00':6,'14:00 – 22:00':14,'22:00 – 06:00':22};
export function addDays(day:string,n:number){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
export function weekStart(day:string){const d=new Date(day+'T12:00:00Z');return addDays(day,-((d.getUTCDay()+6)%7))}
export function inWeek(day:string,week:string){return day>=week&&day<=addDays(week,6)}
export function placementKey(p:Pick<Placement,'date'|'shift'|'post'>){return `${p.date}|${p.shift}|${p.post}`}
export function samePlacement(a:Placement,b:Placement){return a.employeeId===b.employeeId&&a.site===b.site&&placementKey(a)===placementKey(b)}
export function weekDuties(state:State,site:string,week:string){return state.duties.filter(d=>d.site===site&&inWeek(d.date,week))}
export function rosterFingerprint(duties:Duty[]){return JSON.stringify([...duties].sort((a,b)=>a.id.localeCompare(b.id)).map(d=>[d.id,d.employeeId,d.site,d.post,d.date,d.shift,d.attendance]))}
export function boardPosts(state:State,site:string,week:string){return [...new Set([...DEFAULT_POSTS,...weekDuties(state,site,week).map(d=>d.post),...(state.deploymentDrafts||[]).filter(d=>d.site===site&&d.week===week).flatMap(d=>d.placements.map(p=>p.post))])].sort((a,b)=>{const ai=DEFAULT_POSTS.indexOf(a),bi=DEFAULT_POSTS.indexOf(b);return (ai<0?99:ai)-(bi<0?99:bi)||a.localeCompare(b)})}
export function intervalsOverlapOrShortRest(a:Placement,b:Placement){const start=(p:Placement)=>Date.parse(p.date+'T00:00:00Z')+SHIFT_HOURS[p.shift]*3600000;const aStart=start(a),bStart=start(b);const gap=Math.max(aStart,bStart)-Math.min(aStart,bStart)-8*3600000;return gap<8*3600000}
export function validatePlan(state:State,site:string,week:string,placements:Placement[]):string[]{
 const issues:string[]=[];
 if(weekStart(week)!==week)return ['Select a week beginning on Monday.'];
 const original=weekDuties(state,site,week);
 const outside=state.duties.filter(d=>!(d.site===site&&inWeek(d.date,week)));
 const posts=boardPosts(state,site,week);
 const names=(id:string)=>state.employees.find(e=>e.id===id)?.name||id;
 const seen=new Set<string>();
 for(const p of placements){
  const employee=state.employees.find(e=>e.id===p.employeeId);
  const retained=original.some(d=>samePlacement(d,p));
  if(p.site!==site||!inWeek(p.date,week)||!posts.includes(p.post)||!(p.shift in SHIFT_HOURS)){issues.push('A placement is outside this board’s site, week, posts or shifts.');continue}
  const key=placementKey(p);if(seen.has(key))issues.push(`Two people occupy ${p.post} on ${p.date}.`);seen.add(key);
  if(!employee){issues.push(`Unknown employee ${p.employeeId}.`);continue}
  if(employee.status!=='Active'&&!retained)issues.push(`${employee.name} is on leave and cannot be assigned.`);
  if(state.leaves.some(l=>l.employeeId===p.employeeId&&l.status==='Approved'&&p.date>=l.from&&p.date<=l.to))issues.push(`${employee.name} has approved leave on ${p.date}.`);
 }
 for(const locked of original.filter(d=>d.attendance!=='Scheduled'))if(!placements.some(p=>samePlacement(locked,p)))issues.push(`${names(locked.employeeId)} has recorded attendance on ${locked.date}; that duty is locked.`);
 for(let i=0;i<placements.length;i++){
  const p=placements[i];
  for(const other of [...placements.slice(i+1),...outside]){
   if(p.employeeId!==other.employeeId)continue;
   if(p.date===other.date)issues.push(`${names(p.employeeId)} already has a duty on ${p.date}; one shift per day is allowed.`);
   else if(intervalsOverlapOrShortRest(p,other))issues.push(`${names(p.employeeId)} needs at least 8 hours between duties on ${p.date} and ${other.date}.`);
  }
 }
 return [...new Set(issues)];
}
export function planChanges(before:Placement[],after:Placement[]){return {added:after.filter(p=>!before.some(d=>samePlacement(d,p))).length,removed:before.filter(d=>!after.some(p=>samePlacement(d,p))).length}}
export function savePlan(state:State,site:string,week:string,placements:Placement[],role:Role,now:string){
 const errors=validatePlan(state,site,week,placements);if(errors.length)throw Error(errors[0]);
 const current=weekDuties(state,site,week);const draft=state.deploymentDrafts?.find(d=>d.site===site&&d.week===week);
 if(draft&&draft.baseFingerprint!==rosterFingerprint(current))throw Error('The published roster or attendance changed. Discard this draft and start from the latest roster.');
 const next:DeploymentDraft={site,week,placements,baseFingerprint:draft?.baseFingerprint||rosterFingerprint(current),savedAt:now,savedBy:role};
 state.deploymentDrafts=[...(state.deploymentDrafts||[]).filter(d=>d.site!==site||d.week!==week),next];
}
export function publishPlan(state:State,site:string,week:string,role:Role,now:string,id:()=>string){
 const draft=state.deploymentDrafts?.find(d=>d.site===site&&d.week===week);if(!draft)throw Error('There is no saved draft to publish.');
 const before=weekDuties(state,site,week);
 if(draft.baseFingerprint!==rosterFingerprint(before))throw Error('The published roster or attendance changed. Discard this draft and start from the latest roster.');
 const errors=validatePlan(state,site,week,draft.placements);if(errors.length)throw Error(errors[0]);
 const changes=planChanges(before,draft.placements);if(!changes.added&&!changes.removed)throw Error('There are no changes to publish.');
 const after:Duty[]=draft.placements.map(p=>before.find(d=>samePlacement(d,p))||{...p,id:id(),attendance:'Scheduled',publishedAt:now});
 const gaps=boardPosts(state,site,week).length*7*3-after.length;
 state.rosterPublications=[{id:id(),site,week,publishedAt:now,publishedBy:role,before:structuredClone(before),after:structuredClone(after),gaps},...(state.rosterPublications||[])];
 state.duties=[...state.duties.filter(d=>!(d.site===site&&inWeek(d.date,week))),...after];
 state.deploymentDrafts=(state.deploymentDrafts||[]).filter(d=>d!==draft);
 return {changes,gaps};
}
