import {identity,json,sameOrigin,databaseError} from '@/lib/foundation/http';
import {tenantId,operatorRoles} from '@/lib/foundation/validation';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 const auth=await identity();if(auth.error)return auth.error;const {db}=auth;const u=new URL(req.url);const tenant=tenantId.safeParse(u.searchParams.get('tenant'));if(!tenant.success)return json({error:'Invalid workspace.'},400);
 const download=u.searchParams.get('download');if(download){if(!tenantId.safeParse(download).success)return json({error:'Invalid document.'},400);
 const {data:doc,error}=await db.from('foundation_documents').select('id,object_path,file_name').eq('tenant_id',tenant.data).eq('id',download).is('deleted_at',null).maybeSingle();if(error)return databaseError(error);if(!doc)return json({error:'Document not found.'},404);
 const {error:logged}=await db.rpc('audit_document_access',{p_tenant:tenant.data,p_document:doc.id});if(logged)return databaseError(logged);
 const {data,error:signError}=await db.storage.from('sdc-foundation').createSignedUrl(doc.object_path,60,{download:doc.file_name});if(signError)return json({error:'Download unavailable.'},503);return json({url:data.signedUrl});}
 const client=tenantId.safeParse(u.searchParams.get('client'));if(!client.success)return json({error:'Invalid client.'},400);
 let query=db.from('foundation_documents').select('id,file_name,category,size_bytes,created_at,revision').eq('tenant_id',tenant.data).eq('client_id',client.data).is('deleted_at',null).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(51);
 const site=u.searchParams.get('site');if(site){if(!tenantId.safeParse(site).success)return json({error:'Invalid site.'},400);query=query.eq('site_id',site)}else query=query.is('site_id',null);
 const cursor=u.searchParams.get('cursor');if(cursor){let c;try{c=JSON.parse(Buffer.from(cursor,'base64url').toString())}catch{return json({error:'Invalid page cursor.'},400)}
 if(!tenantId.safeParse(c.id).success||!/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|\+00:00)$/.test(c.at))return json({error:'Invalid page cursor.'},400);
 query=query.or(`created_at.lt.${c.at},and(created_at.eq.${c.at},id.lt.${c.id})`);}
 const {data,error}=await query;if(error)return databaseError(error);const rows=(data||[]).slice(0,50),last=rows.at(-1);return json({rows,nextCursor:(data?.length||0)>50&&last?Buffer.from(JSON.stringify({at:last.created_at,id:last.id})).toString('base64url'):null});
 }catch{return json({error:'Documents are temporarily unavailable.'},503)}}
export async function POST(req:Request){try{
 if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);const auth=await identity();if(auth.error)return auth.error;const {db,user}=auth;
 if(Number(req.headers.get('content-length'))>11000000)return json({error:'Maximum file size is 10 MB.'},413);
 const f=await req.formData();const tenant=tenantId.safeParse(f.get('tenant')),client=tenantId.safeParse(f.get('client'));if(!tenant.success||!client.success)return json({error:'Invalid workspace or client.'},400);
 const site=f.get('site')?tenantId.safeParse(f.get('site')):null;if(site&&!site.success)return json({error:'Invalid site.'},400);
 const category=String(f.get('category'));if(!(site?['sop','floor_plan']:['contract']).includes(category))return json({error:'Invalid document category.'},400);
 const {data:member}=await db.from('memberships').select('role').eq('tenant_id',tenant.data).eq('user_id',user.id).eq('active',true).maybeSingle();if(!member||!operatorRoles.includes(member.role))return json({error:'Document upload is not available for your role.'},403);
 const file=f.get('file');if(!(file instanceof File)||file.size<1||file.size>10485760||!['application/pdf','image/jpeg','image/png'].includes(file.type))return json({error:'Choose a PDF, PNG or JPEG up to 10 MB.'},400);
 const bytes=new Uint8Array(await file.arrayBuffer());const valid=file.type==='application/pdf'?Buffer.from(bytes.slice(0,5)).toString()==='%PDF-':file.type==='image/png'?Buffer.from(bytes.slice(0,8)).toString('hex')==='89504e470d0a1a0a':bytes[0]===255&&bytes[1]===216&&bytes[2]===255;if(!valid)return json({error:'File content does not match its type.'},400);
 const id=crypto.randomUUID(),path=`${tenant.data}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-150)}`;
 const {error:uploaded}=await db.storage.from('sdc-foundation').upload(path,bytes,{contentType:file.type,upsert:false});if(uploaded)return json({error:'Upload failed. Check that the private storage migration is applied.'},503);
 const {error}=await db.from('foundation_documents').insert({id,tenant_id:tenant.data,client_id:client.data,site_id:site?.success?site.data:null,category,file_name:file.name.slice(0,150),mime_type:file.type,size_bytes:file.size,object_path:path});
 if(error){await db.storage.from('sdc-foundation').remove([path]);return databaseError(error)}return json({id},201);
 }catch{return json({error:'The document could not be uploaded.'},503)}}
