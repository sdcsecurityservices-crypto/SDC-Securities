'use client';

import {useEffect,useMemo,useRef,useState,type DragEvent,type PointerEvent as ReactPointerEvent} from 'react';
import {ArrowLeftRight,ArrowRight,CalendarDays,Check,CheckCircle2,ChevronLeft,ChevronRight,GripVertical,History,LockKeyhole,MapPin,Plus,RotateCcw,Search,ShieldCheck,TriangleAlert,Trash2,Users,X} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {toast} from 'sonner';
import {sites,shifts,type State,type Role} from '@/lib/demo';
import {addDays,weekStart,weekDuties,boardPosts,placementKey,samePlacement,rosterFingerprint,validatePlan,planChanges,type Placement} from '@/lib/deployment';

interface Props {state:State;role:Role;day:string;site:string;busy:boolean;mutate:(action:unknown)=>Promise<boolean>;onRoster:(site:string,date:string)=>void}
type DragPayload={employeeId:string;origin?:string};
type Target={date:string;post:string};
const labelDate=(day:string,opts:Intl.DateTimeFormatOptions={day:'numeric',month:'short'})=>new Date(day+'T12:00:00Z').toLocaleDateString('en-IN',{...opts,timeZone:'Asia/Kolkata'});
const initials=(name:string)=>name.split(' ').map(x=>x[0]).slice(0,2).join('');
const stamp=(value:string)=>new Date(value).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'});

export default function DeploymentBoard({state,role,day,site,busy,mutate,onRoster}:Props){
 const [boardSite,setBoardSite]=useState(site==='All sites'?sites[1]:site);
 const [week,setWeek]=useState(weekStart(day));
 const [shift,setShift]=useState(shifts[0]);
 const [focusDay,setFocusDay]=useState(day);
 const [search,setSearch]=useState('');
 const [availabilityOnly,setAvailabilityOnly]=useState(false);
 const [selected,setSelected]=useState<DragPayload|null>(null);
 const [hover,setHover]=useState('');
 const [live,setLive]=useState('');
 const [target,setTarget]=useState<Target|null>(null);
 const [review,setReview]=useState(false);
 const [discard,setDiscard]=useState(false);
 const [panel,setPanel]=useState<'gaps'|'history'|null>(null);
 const [ghost,setGhost]=useState<{x:number;y:number;name:string}|null>(null);
 const dragRef=useRef<DragPayload|null>(null);
 const pointerCleanup=useRef<(()=>void)|null>(null);
  useEffect(()=>()=>{pointerCleanup.current?.()},[]);
 const canEdit=['Admin','Operations Manager','Senior Manager'].includes(role);
 const effectiveSite=role==='Site Lead'?sites[1]:boardSite;
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 const draft=state.deploymentDrafts?.find(d=>d.site===effectiveSite&&d.week===week);
 const published=weekDuties(state,effectiveSite,week);
 const plan:Placement[]=draft?.placements||published;
 const posts=boardPosts(state,effectiveSite,week);
 const current=plan.filter(p=>p.shift===shift);
 const byCell=new Map(current.map(p=>[placementKey(p),p]));
 const changes=planChanges(published,plan);
 const dirty=changes.added+changes.removed>0;
 const stale=!!draft&&draft.baseFingerprint!==rosterFingerprint(published);
 const conflicts=validatePlan(state,effectiveSite,week,plan);
 const visibleGaps=posts.flatMap(post=>days.filter(date=>!byCell.has(placementKey({post,date,shift}))).map(date=>({post,date})));
 const allGaps=posts.length*7*3-plan.length;
 const publications=(state.rosterPublications||[]).filter(p=>p.site===effectiveSite&&p.week===week);
 const nameOf=(id:string)=>state.employees.find(e=>e.id===id)?.name||id;
 const locked=(p:Placement)=>published.some(d=>samePlacement(d,p)&&d.attendance!=='Scheduled');
 const recorded=(p:Placement)=>published.find(d=>samePlacement(d,p));
 function changeWeek(w:string){setWeek(w);setFocusDay(w);setSelected(null);setTarget(null)}
 function announce(message:string,error=false){setLive(message);if(error)toast.error(message)}
 async function save(next:Placement[],message:string){
  if(!canEdit||busy)return false;
  const errors=validatePlan(state,effectiveSite,week,next);
  if(errors.length){announce(errors[0],true);return false}
  const success=await mutate({type:'save-deployment',site:effectiveSite,week,placements:next});
  if(success){announce(message);setSelected(null)}return success;
 }
 async function place(payload:DragPayload,destination:Target,replace=false){
  if(!canEdit||busy||stale)return;
  const nextPlacement:Placement={employeeId:payload.employeeId,site:effectiveSite,post:destination.post,date:destination.date,shift};
  const key=placementKey(nextPlacement);
  const original=payload.origin?plan.find(p=>placementKey(p)===payload.origin):undefined;
  const occupied=plan.find(p=>placementKey(p)===key);
  if(original&&locked(original)){announce('Attendance is recorded. This duty cannot be moved.',true);return}
  if(occupied&&locked(occupied)){announce('Attendance is recorded. This duty cannot be replaced.',true);return}
  if(original&&placementKey(original)===key)return;
  if(occupied&&!original&&!replace){setSelected(payload);setTarget(destination);return}
  let next=plan.filter(p=>placementKey(p)!==key&&(!original||placementKey(p)!==placementKey(original)));
  next.push(nextPlacement);
  if(occupied&&original)next.push({...original,employeeId:occupied.employeeId});
  if(await save(next,`${nameOf(payload.employeeId)} assigned to ${destination.post}, ${labelDate(destination.date)}. Draft saved.`))setTarget(null);
 }
 async function remove(p:Placement){if(locked(p)){announce('Attendance is recorded. This duty cannot be removed.',true);return}if(await save(plan.filter(x=>placementKey(x)!==placementKey(p)),`Duty removed. ${p.post} is now a gap on ${labelDate(p.date)}.`))setTarget(null)}
 function dragStart(e:DragEvent,payload:DragPayload){if(!canEdit||busy||stale){e.preventDefault();return}dragRef.current=payload;e.dataTransfer.setData('application/x-sdc-person',JSON.stringify(payload));e.dataTransfer.effectAllowed=payload.origin?'move':'copy';setSelected(payload)}
 function dragEnd(){dragRef.current=null;setHover('')}
 function drop(e:DragEvent,t:Target){e.preventDefault();setHover('');const payload=dragRef.current;if(payload)void place(payload,t);dragRef.current=null}
 function pointerStart(e:ReactPointerEvent,payload:DragPayload){
  if(!canEdit||busy||stale)return;
  e.preventDefault();e.stopPropagation();pointerCleanup.current?.();
  let moved=false;const start={x:e.clientX,y:e.clientY};
  const controller=new AbortController();pointerCleanup.current=()=>controller.abort();
  const locate=(ev:globalThis.PointerEvent)=>document.elementFromPoint(ev.clientX,ev.clientY)?.closest<HTMLElement>('[data-deployment-date]');
  window.addEventListener('pointermove',ev=>{if(Math.hypot(ev.clientX-start.x,ev.clientY-start.y)>7)moved=true;if(!moved)return;ev.preventDefault();setGhost({x:ev.clientX,y:ev.clientY,name:nameOf(payload.employeeId)});const el=locate(ev);setHover(el?.dataset.slotKey||'')},{signal:controller.signal,passive:false});
  window.addEventListener('pointerup',ev=>{const el=locate(ev);setGhost(null);setHover('');controller.abort();if(moved&&el?.dataset.deploymentDate&&el.dataset.deploymentPost)void place(payload,{date:el.dataset.deploymentDate,post:el.dataset.deploymentPost});else setSelected(payload)},{signal:controller.signal,once:true});
  window.addEventListener('pointercancel',()=>{setGhost(null);setHover('');controller.abort()},{signal:controller.signal,once:true});
 }
 function candidate(id:string,t:Target){
  const existing=plan.find(p=>p.employeeId===id&&p.date===t.date);
  const destination:Placement={employeeId:id,site:effectiveSite,date:t.date,post:t.post,shift};
  const without=plan.filter(p=>placementKey(p)!==placementKey(destination));
  const reasons=validatePlan(state,effectiveSite,week,[...without,destination]);
  return {reason:reasons[0]||'',existing};
 }
 function availability(id:string){const e=state.employees.find(e=>e.id===id);if(e?.status!=='Active')return 'On leave';if(state.leaves.some(l=>l.employeeId===id&&l.status==='Approved'&&focusDay>=l.from&&focusDay<=l.to))return 'Approved leave';const assigned=[...plan,...state.duties.filter(d=>!(d.site===effectiveSite&&d.date>=week&&d.date<=addDays(week,6)))].find(d=>d.employeeId===id&&d.date===focusDay);return assigned?`Assigned · ${assigned.site}`:''}
 const visiblePeople=state.employees.filter(e=>(e.name+' '+e.id+' '+e.site).toLowerCase().includes(search.toLowerCase())).filter(e=>!availabilityOnly||!availability(e.id));
 const activePeople=state.employees.filter(e=>e.status==='Active').length;
 return <section className="deployment-workspace" aria-label="Weekly deployment planner">
  <div className="deployment-hero"><div><span className="deployment-kicker"><span/> CONNECTED DEPLOYMENT</span><h1>Deployment planner.</h1><p>Build the week together. Every post covered, every change accounted for.</p></div><div className="deployment-hero-mark"><ShieldCheck size={42} strokeWidth={1}/><span>PEOPLE → POSTS → PEACE OF MIND</span></div></div>
  <div className="deployment-toolbar"><div className="deployment-location"><MapPin size={17}/><Select value={effectiveSite} onValueChange={s=>{setBoardSite(s);setSelected(null)}} disabled={role==='Site Lead'||busy}><SelectTrigger aria-label="Deployment board site"><SelectValue/></SelectTrigger><SelectContent>{sites.slice(1).map(s=><SelectItem value={s} key={s}>{s}</SelectItem>)}</SelectContent></Select></div><div className="deployment-week"><button aria-label="Previous deployment week" disabled={busy} onClick={()=>changeWeek(addDays(week,-7))}><ChevronLeft size={18}/></button><label><CalendarDays size={16}/><span>{labelDate(week)} – {labelDate(addDays(week,6),{day:'numeric',month:'short',year:'numeric'})}</span><input aria-label="Choose deployment week" type="date" value={week} disabled={busy} onChange={e=>{if(e.target.value)changeWeek(weekStart(e.target.value))}}/></label><button aria-label="Next deployment week" disabled={busy} onClick={()=>changeWeek(addDays(week,7))}><ChevronRight size={18}/></button></div><div className="deployment-publish"><span className={'draft-status '+(draft?'has-draft':'')}><span/>{busy?'Saving…':draft?'Draft saved':'Published roster'}</span>{canEdit&&<button className="button brand-navy compact" disabled={!dirty||busy||stale||conflicts.length>0} onClick={()=>setReview(true)}>Review & publish <ArrowRight size={16}/></button>}</div></div>
  <div className="deployment-metrics"><div><span className="deployment-metric-icon"><Users size={19}/></span><div><strong>{plan.length}<small> / {posts.length*21}</small></strong><span>Weekly slots assigned</span></div></div><div><span className="deployment-metric-icon gold"><TriangleAlert size={19}/></span><div><strong>{allGaps}</strong><span>Coverage gaps · all shifts</span></div></div><div><span className="deployment-metric-icon"><ArrowLeftRight size={19}/></span><div><strong>{changes.added+changes.removed}</strong><span>Unpublished slot changes</span></div></div><div><span className="deployment-metric-icon"><ShieldCheck size={19}/></span><div><strong>{Math.round(plan.length/(posts.length*21)*100)}<small>%</small></strong><span>Weekly coverage</span></div></div></div>
  {stale&&<div className="deployment-alert" role="alert"><TriangleAlert size={19}/><p>The roster or attendance changed after this draft was created. Discard the draft to load the latest published duties.</p></div>}
  {!stale&&conflicts.length>0&&<div className="deployment-alert" role="alert"><TriangleAlert size={19}/><p>{conflicts[0]}{conflicts.length>1?` Plus ${conflicts.length-1} other conflicts.`:''}</p></div>}
  <div className="deployment-layout"><aside className="personnel-pool"><div className="pool-heading"><span className="pool-icon"><Users size={19}/></span><div><h3>Personnel pool</h3><p>{activePeople} active team members</p></div></div><div className="pool-search"><Search size={16}/><input aria-label="Search deployment personnel" placeholder="Search name, ID or site" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="pool-date"><span>Availability for</span><strong>{labelDate(focusDay,{weekday:'short',day:'numeric',month:'short'})}</strong></div><Tabs value={availabilityOnly?'available':'all'} onValueChange={v=>setAvailabilityOnly(v==='available')}><TabsList className="pool-tabs"><TabsTrigger value="all">All people</TabsTrigger><TabsTrigger value="available">Available</TabsTrigger></TabsList></Tabs><div className="pool-list">{visiblePeople.map(e=>{const reason=availability(e.id);const off=e.status!=='Active';const active=selected?.employeeId===e.id&&!selected.origin;return <div className={'pool-person '+(active?'selected ':'')+(off?'unavailable':'')} key={e.id} draggable={canEdit&&!busy&&!off&&!stale} onDragStart={event=>dragStart(event,{employeeId:e.id})} onDragEnd={dragEnd}><button className="drag-grip" aria-label={`Drag ${e.name}`} disabled={!canEdit||off||busy||stale} onPointerDown={event=>pointerStart(event,{employeeId:e.id})}><GripVertical size={16}/></button><button className="pool-person-select" disabled={!canEdit||off||busy||stale} onClick={()=>{setSelected(active?null:{employeeId:e.id});announce(active?'Selection cleared':`${e.name} selected. Choose a roster slot.`)}} aria-pressed={active}><span className="pool-avatar">{initials(e.name)}</span><span><strong>{e.name}</strong><small>{e.designation==='Site Supervisor'?'Supervisor':'Security officer'} · {e.id}</small><span className={'pool-availability '+(reason?'occupied':'available')}>{off?'On leave':reason?'Assigned / on leave':'Available'}</span></span></button></div>})}{visiblePeople.length===0&&<p className="pool-empty">No matching personnel. Try another date or search.</p>}</div><div className="pool-help"><GripVertical size={16}/><p>{canEdit?'Drag a person onto a slot, or select a person and tap a slot.':'View-only access. A manager can edit and publish deployments.'}</p></div></aside>
   <div className="deployment-board-panel"><div className="board-topline"><Tabs value={shift} onValueChange={s=>{setShift(s);setSelected(null)}}><TabsList className="shift-tabs">{shifts.map((s,i)=><TabsTrigger key={s} value={s}>{['Morning','Afternoon','Night'][i]}<small>{s}</small></TabsTrigger>)}</TabsList></Tabs><button className="board-utility" onClick={()=>setPanel('gaps')}><TriangleAlert size={15}/> Gaps <b>{visibleGaps.length}</b></button><button className="board-utility history" onClick={()=>setPanel('history')}><History size={16}/><span>History</span></button></div>
    {selected&&<div className="selection-banner"><span><Users size={15}/><strong>{nameOf(selected.employeeId)}</strong> selected · choose a slot{selected.origin?' to move or swap':''}</span><button onClick={()=>setSelected(null)} aria-label="Clear selected personnel"><X size={16}/></button></div>}
    <div className="roster-grid-scroll"><div className="deployment-grid" style={{gridTemplateColumns:`155px repeat(7,minmax(125px,1fr))`}}><div className="grid-corner"><span>POST / LOCATION</span><small>{posts.length} posts · {current.length} assigned</small></div>{days.map(date=><button className={'grid-day '+(date===focusDay?'focused':'')} key={date} onClick={()=>setFocusDay(date)} aria-pressed={date===focusDay}><span>{labelDate(date,{weekday:'short'})}</span><strong>{labelDate(date,{day:'numeric'})}</strong><small>{labelDate(date,{month:'short'})}</small></button>)}
    {posts.map((post,index)=><div className="deployment-grid-row" key={post}><div className="grid-post"><span className="post-number">0{index+1}</span><strong>{post}</strong><small><ShieldCheck size={12}/> Security officer</small><span className="post-coverage">{current.filter(p=>p.post===post).length}/7 days covered</span></div>{days.map(date=>{const key=placementKey({date,post,shift});const assignment=byCell.get(key);const isLocked=assignment&&locked(assignment);const changed=assignment&&!published.some(d=>samePlacement(d,assignment));const absent=assignment&&recorded(assignment)?.attendance==='Absent';return <div key={key} className={'deployment-cell '+(assignment?'filled':'gap')+(hover===key?' drop-hover':'')+(date===focusDay?' focus-column':'')+(changed?' changed':'')} data-slot-key={key} data-deployment-date={date} data-deployment-post={post} onDragOver={e=>{if(canEdit&&!busy&&!stale&&!isLocked){e.preventDefault();e.dataTransfer.dropEffect=dragRef.current?.origin?'move':'copy';setHover(key)}}} onDragLeave={()=>setHover('')} onDrop={e=>drop(e,{date,post})}>
    {assignment?<div className={'duty-tile '+(isLocked?'locked':'')} draggable={canEdit&&!busy&&!isLocked&&!stale} onDragStart={e=>dragStart(e,{employeeId:assignment.employeeId,origin:key})} onDragEnd={dragEnd}><div className="tile-top"><span className="tile-avatar">{initials(nameOf(assignment.employeeId))}</span>{isLocked?<LockKeyhole size={12}/>:<button className="drag-grip" aria-label={`Move ${nameOf(assignment.employeeId)} on ${date}`} disabled={!canEdit||busy||stale} onClick={()=>setSelected({employeeId:assignment.employeeId,origin:key})} onPointerDown={e=>pointerStart(e,{employeeId:assignment.employeeId,origin:key})}><GripVertical size={14}/></button>}</div><button className="tile-details" aria-label={`${nameOf(assignment.employeeId)}, ${post}, ${date}, ${shift}${isLocked?', attendance locked':''}`} onClick={()=>{if(selected)void place(selected,{date,post});else setTarget({date,post})}}><strong>{nameOf(assignment.employeeId)}</strong><small>{assignment.employeeId}</small><span className={'tile-state '+(changed?'draft':absent?'absent':'')}><span/>{changed?'Draft':absent?'Absent':isLocked?'Checked in':'Published'}</span></button></div>:<button className="empty-slot" disabled={!canEdit||busy||stale} aria-label={`Assign ${post}, ${date}, ${shift}`} onClick={()=>{setFocusDay(date);if(selected)void place(selected,{date,post});else setTarget({date,post})}}><span><Plus size={17}/></span><strong>Open slot</strong><small>{selected?'Place selected person':'Drop person here'}</small></button>}
    </div>})}</div>)}
    </div></div><div className="board-legend"><span><i className="published"/> Published</span><span><i className="draft"/> Draft change</span><span><i className="gap"/> Coverage gap</span><span><LockKeyhole size={12}/> Attendance locked</span><span className="board-zone">All times IST</span></div><div className="board-save-strip"><span><CheckCircle2 size={15}/>{draft?`Draft saved ${stamp(draft.savedAt)} IST`:'Showing the current published roster'}</span>{draft&&canEdit&&<button disabled={busy} onClick={()=>setDiscard(true)}><RotateCcw size={14}/> Discard draft</button>}</div>
   </div>
  </div>
  <div className="deployment-bottom"><span><ShieldCheck size={17}/> One shift per person per day · 8-hour minimum rest · Approved leave respected</span><button onClick={()=>onRoster(effectiveSite,week)}>View published duty roster <ArrowRight size={15}/></button></div>
  <p className="sr-only" role="status" aria-live="polite">{live}</p>
  {ghost&&<div className="deployment-drag-ghost" style={{left:ghost.x+12,top:ghost.y+12}}><Users size={16}/>{ghost.name}</div>}
  <Dialog open={target!==null} onOpenChange={o=>{if(!busy&&!o){setTarget(null);setSelected(null)}}}><DialogContent className="sdc-dialog deployment-dialog"><DialogHeader><div className="dialog-icon"><CalendarDays/></div><DialogTitle>{target?.post}</DialogTitle><DialogDescription>{target&&labelDate(target.date,{weekday:'long',day:'numeric',month:'long'})} · {shift} IST<br/>Choose a person to fill this post. Unavailable personnel show why.</DialogDescription></DialogHeader>{target&&(()=>{const existing=plan.find(p=>placementKey(p)===placementKey({...target,shift}));const isLocked=existing&&locked(existing);return <>{existing&&<div className="current-assignment"><span className="pool-avatar">{initials(nameOf(existing.employeeId))}</span><div><strong>{nameOf(existing.employeeId)}</strong><small>{isLocked?'Attendance recorded · assignment locked':'Currently assigned to this slot'}</small></div>{canEdit&&!isLocked&&<button aria-label="Remove assignment from draft" disabled={busy} onClick={()=>remove(existing)}><Trash2 size={17}/></button>}</div>}{!canEdit?<p className="deployment-readonly">Only Admin, Operations Manager and Senior Manager previews can change the deployment plan.</p>:isLocked?<p className="deployment-readonly">This assignment is locked to preserve the attendance record. Plan a different date or post.</p>:<div className="assignment-candidates">{state.employees.map(e=>{const check=candidate(e.id,target);const already=existing?.employeeId===e.id;return <button key={e.id} disabled={!!check.reason||busy||already||stale} onClick={()=>place({employeeId:e.id},target,true)}><span className="pool-avatar">{initials(e.name)}</span><span><strong>{e.name}</strong><small>{already?'Currently assigned':check.reason||`${e.site} · Available`}</small></span>{already?<Check size={17}/>:check.reason?<LockKeyhole size={14}/>:<Plus size={17}/>}</button>})}</div>}</>})()}</DialogContent></Dialog>
  <Dialog open={review} onOpenChange={v=>{if(!busy)setReview(v)}}><DialogContent className="sdc-dialog deployment-dialog"><DialogHeader><div className="dialog-icon"><ShieldCheck/></div><DialogTitle>Ready to put the plan in motion?</DialogTitle><DialogDescription>{effectiveSite} · {labelDate(week)} – {labelDate(addDays(week,6))}<br/>Publishing updates the duty roster, attendance list and employee duty views together.</DialogDescription></DialogHeader><div className="publish-summary"><div><strong>{changes.added}</strong><span>New placements</span></div><div><strong>{changes.removed}</strong><span>Replaced / removed</span></div><div><strong>{plan.length}</strong><span>Weekly assignments</span></div></div>{allGaps>0&&<div className="publish-gap-note"><TriangleAlert size={20}/><p><strong>{allGaps} coverage gaps remain across all shifts.</strong> You can publish a partial roster. These gaps will stay visible on the board and in the gap queue.</p></div>}<p className="publish-history-note"><History size={16}/> A dated snapshot preserves the roster before and after publication.</p><button className="button brand-navy" disabled={busy||stale||conflicts.length>0||!dirty} onClick={async()=>{if(await mutate({type:'publish-deployment',site:effectiveSite,week})){setReview(false);setSelected(null);announce('Week published. The operational roster has been updated.')}}}>{busy?'Publishing…':allGaps>0?'Publish week with gaps':'Publish week'}<ArrowRight size={17}/></button></DialogContent></Dialog>
  <Dialog open={discard} onOpenChange={o=>{if(!busy)setDiscard(o)}}><DialogContent className="sdc-dialog"><DialogHeader><DialogTitle>Discard this week’s draft?</DialogTitle><DialogDescription>The board will return to the latest published roster. Published duties and attendance will remain intact.</DialogDescription></DialogHeader><div className="discard-actions"><button className="button outline" onClick={()=>setDiscard(false)}>Keep editing</button><button className="button brand-navy" disabled={busy} onClick={async()=>{if(await mutate({type:'discard-deployment',site:effectiveSite,week})){setDiscard(false);setSelected(null)}}}>Discard draft</button></div></DialogContent></Dialog>
  <Sheet open={panel!==null} onOpenChange={v=>{if(!v)setPanel(null)}}><SheetContent className="deployment-sheet"><SheetHeader><SheetTitle>{panel==='gaps'?'Coverage gaps':'Publication history'}</SheetTitle><SheetDescription>{effectiveSite} · Week of {labelDate(week)}{panel==='gaps'?` · ${['Morning','Afternoon','Night'][shifts.indexOf(shift)]} shift`:''}</SheetDescription></SheetHeader><div className="deployment-sheet-body">{panel==='gaps'?<><div className="gap-queue-summary"><strong>{visibleGaps.length}</strong><span>open slots in this shift</span></div>{visibleGaps.map(g=><div className="gap-queue-item" key={g.date+g.post}><div><strong>{g.post}</strong><span>{labelDate(g.date,{weekday:'short',day:'numeric',month:'short'})} · {shift}</span></div><button disabled={!canEdit||busy||stale} onClick={()=>{setPanel(null);setFocusDay(g.date);setTarget(g)}}>Fill <Plus size={14}/></button></div>)}{!visibleGaps.length&&<div className="queue-empty"><CheckCircle2/><h3>Every post is covered.</h3><p>All slots in this shift have an assignment.</p></div>}</>:<>{publications.map(p=><article className="publication-card" key={p.id}><span><CheckCircle2 size={17}/> Published</span><h3>{stamp(p.publishedAt)} IST</h3><p>{p.publishedBy} · {p.after.length} assignments · {p.gaps} gaps</p><details><summary>View roster changes</summary><div>{p.after.filter(a=>!p.before.some(b=>samePlacement(a,b))).map((a,i)=><p key={'a'+i}><b>Added</b> {nameOf(a.employeeId)} · {a.post}<small>{a.date} · {a.shift}</small></p>)}{p.before.filter(b=>!p.after.some(a=>samePlacement(a,b))).map((b,i)=><p key={'b'+i}><b>Removed</b> {nameOf(b.employeeId)} · {b.post}<small>{b.date} · {b.shift}</small></p>)}</div></details></article>)}{!publications.length&&<div className="queue-empty"><History/><h3>No publications yet.</h3><p>Publish a deployment draft to start the version history for this week. Existing roster entries remain available in Duty roster.</p></div>}</>}</div></SheetContent></Sheet>
 </section>
}
