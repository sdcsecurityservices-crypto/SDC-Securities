import {resources,writeRequest,tenantId,operatorRoles,type Resource} from '@/lib/foundation/validation';
import {identity,json,databaseError,sameOrigin} from '@/lib/foundation/http';
export const dynamic='force-dynamic';
type Context={params:Promise<{resource:string}>};
export async function GET(req:Request,{params}:Context){
 try{
 const auth=await identity();if(auth.error)return auth.error;const {db,user}=auth;
 const {resource}=await params;const url=new URL(req.url);
 if(resource==='context'){
  const {data,error}=await db.from('memberships').select('id,tenant_id,display_name,role,tenants(name,is_demo)').eq('user_id',user.id).eq('active',true);
  if(error)return databaseError(error);return json({memberships:data,email:user.email});
 }
 const tenant=tenantId.safeParse(url.searchParams.get('tenant'));if(!tenant.success)return json({error:'Choose a workspace.'},400);
 if(resource==='audit'){
  let q=db.from('audit_events').select('id,action,entity_type,entity_id,created_at,actor_user_id,before_data,after_data').eq('tenant_id',tenant.data).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(51);
  if(url.searchParams.get('entity')){const id=tenantId.safeParse(url.searchParams.get('entity'));if(!id.success)return json({error:'Invalid record.'},400);q=q.eq('entity_id',id.data)}
  const cursor=url.searchParams.get('cursor');if(cursor){let c;try{c=JSON.parse(Buffer.from(cursor,'base64url').toString())}catch{return json({error:'Invalid page cursor.'},400)}
  if(!tenantId.safeParse(c.id).success||!/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|\+00:00)$/.test(c.at))return json({error:'Invalid page cursor.'},400);
  q=q.or(`created_at.lt.${c.at},and(created_at.eq.${c.at},id.lt.${c.id})`);}
  const {data,error}=await q;if(error)return databaseError(error);const rows=(data||[]).slice(0,50),last=rows.at(-1);return json({rows,nextCursor:(data?.length||0)>50&&last?Buffer.from(JSON.stringify({at:last.created_at,id:last.id})).toString('base64url'):null});
 }
 if(!(resource in resources))return json({error:'Unknown resource.'},404);
 const config=resources[resource as Resource];const limit=Math.min(Math.max(Number(url.searchParams.get('limit'))||50,1),100);
 const joins:Record<string,string>={sites:'*,clients(name)',posts:'*,sites(name),grades(name)',staffing_requirements:'*,posts(name),shift_templates(name)',contracts:'*,clients(name)',rate_card_lines:'*,contracts(number),grades(name)'};
 let query=db.from(resource).select(joins[resource]||'*',{count:'exact'}).eq('tenant_id',tenant.data).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(limit+1);
 query=url.searchParams.get('archived')==='true'?query.not('deleted_at','is',null):query.is('deleted_at',null);
 const recordId=url.searchParams.get('id');if(recordId){if(!tenantId.safeParse(recordId).success)return json({error:'Invalid record.'},400);query=query.eq('id',recordId)}
 const q=url.searchParams.get('q')?.trim();if(q&&config.search)query=query.ilike(config.search,`%${q.slice(0,100).replace(/[\\%_]/g,'\\$&')}%`);
 const parent=url.searchParams.get('parent');const filter={sites:'client_id',posts:'site_id',staffing_requirements:'post_id',contracts:'client_id',rate_card_lines:'contract_id'}[resource];
 if(parent&&filter){const p=tenantId.safeParse(parent);if(!p.success)return json({error:'Invalid parent filter.'},400);query=query.eq(filter,p.data)}
 const cursor=url.searchParams.get('cursor');if(cursor){let c;try{c=JSON.parse(Buffer.from(cursor,'base64url').toString())}catch{return json({error:'Invalid page cursor.'},400)}
 if(!tenantId.safeParse(c.id).success||!/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|\+00:00)$/.test(c.at))return json({error:'Invalid page cursor.'},400);
 query=query.or(`created_at.lt.${c.at},and(created_at.eq.${c.at},id.lt.${c.id})`);}
 const {data,error,count}=await query;if(error)return databaseError(error);
 const rows=((data||[]) as unknown as Array<{id:string;created_at:string}>).slice(0,limit),last=rows.at(-1);return json({rows,total:count,nextCursor:(data?.length||0)>limit&&last?Buffer.from(JSON.stringify({at:last.created_at,id:last.id})).toString('base64url'):null});
 }catch{return json({error:'The workspace is temporarily unavailable.'},503)}
}
export async function POST(req:Request,{params}:Context){
 try{
 if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);
 const auth=await identity();if(auth.error)return auth.error;const {db,user}=auth;const {resource}=await params;
 if(!(resource in resources))return json({error:'Unknown resource.'},404);
 const raw=await req.text();if(raw.length>25000)return json({error:'Request is too large.'},413);
 let payload;try{payload=writeRequest.parse(JSON.parse(raw))}catch{return json({error:'Invalid request.'},400)}
 const {data:membership}=await db.from('memberships').select('role').eq('tenant_id',payload.tenant_id).eq('user_id',user.id).eq('active',true).maybeSingle();
 if(!membership||!operatorRoles.includes(membership.role))return json({error:'Only an authorized operations manager can change these records.'},403);
 let values:Record<string,unknown>;
 if(payload.archive){if(!payload.id)return json({error:'Choose a record to archive.'},400);values={deleted_at:new Date().toISOString()}}
 else {const parsed=resources[resource as Resource].schema.safeParse(payload.data);if(!parsed.success)return json({error:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join(' · ')},400);values=parsed.data;}
 if(payload.id){if(payload.row_version===undefined)return json({error:'A record revision is required.'},400);
 const {data,error}=await db.from(resource).update({...values,row_version:payload.row_version+1}).eq('tenant_id',payload.tenant_id).eq('id',payload.id).eq('row_version',payload.row_version).is('deleted_at',null).select().maybeSingle();
 if(error)return databaseError(error);if(!data)return json({error:'This record changed or is no longer available. Refresh and try again.'},409);return json({record:data});}
 const {data,error}=await db.from(resource).insert({...values,tenant_id:payload.tenant_id}).select().single();if(error)return databaseError(error);return json({record:data},201);
 }catch{return json({error:'Your changes could not be saved.'},503)}
}
