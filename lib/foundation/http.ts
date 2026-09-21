import {supabase,configured} from '@/lib/supabase/server';
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !!origin&&origin===(process.env.APP_URL||new URL(req.url).origin)}
export async function identity(){if(!configured())return {error:json({error:'The workspace is awaiting its Supabase connection.',code:'NOT_CONFIGURED'},503)};const db=await supabase();const {data:{user},error}=await db.auth.getUser();if(error||!user)return {error:json({error:'Sign in to continue.'},401)};return {db,user};}
export function databaseError(error:{code?:string;message:string}){
 if(error.code==='23505')return json({error:'This code or record already exists. Use a unique value.'},409);
 if(error.code==='42501')return json({error:'Your role does not allow this action.'},403);
 if(['23503','23514','P0001','40001'].includes(error.code||''))return json({error:error.code==='23503'?'The linked record is unavailable or belongs to another workspace.':error.message},409);
 console.error('Foundation request failed',{code:error.code});return json({error:'The request could not be completed. Please try again.'},500);
}
