import {supabase,configured} from '@/lib/supabase/server';
import {ZodError} from 'zod';
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !!origin&&origin===(process.env.APP_URL||new URL(req.url).origin)}
export async function identity(){if(!configured())return {error:json({error:'The workspace is awaiting its Supabase connection.',code:'NOT_CONFIGURED'},503)};const db=await supabase();const {data:{user},error}=await db.auth.getUser();if(error||!user)return {error:json({error:'Sign in to continue.'},401)};return {db,user};}
export function databaseError(error:{code?:string;message:string}){
 if(error.code==='PGRST116')return json({error:'Record not found.'},404);
 if(error.code==='23505')return json({error:'This code or record already exists. Use a unique value.'},409);
 if(error.code==='42501')return json({error:'Your role does not allow this action.'},403);
 if(['23503','23514','P0001','40001'].includes(error.code||''))return json({error:error.code==='23503'?'The linked record is unavailable or belongs to another workspace.':error.message},409);
 console.error('Foundation request failed',{code:error.code});return json({error:'The request could not be completed. Please try again.'},500);
}

/** Bad input (validation/JSON) is a 400; anything else is a temporary 503 so clients retry. */
export function failure(e:unknown,message:string){
 if(e instanceof ZodError||e instanceof SyntaxError)return json({error:message},400);
 console.error('Request failed',{name:(e as Error)?.name});
 return json({error:'The service is temporarily unavailable. Please try again.'},503);
}

/** Client address as seen by the hosting proxy. The left-most X-Forwarded-For
 *  entry is client-controlled, so use the proxy-set X-Real-IP or the last hop. */
export function clientIp(req:Request){
 const real=req.headers.get('x-real-ip')?.trim();if(real)return real.slice(0,64);
 const hops=(req.headers.get('x-forwarded-for')||'').split(',').map(h=>h.trim()).filter(Boolean);
 return hops.length?hops[hops.length-1].slice(0,64):'unavailable';
}
