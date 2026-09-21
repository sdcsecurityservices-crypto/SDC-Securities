import {supabase,configured} from '@/lib/supabase/server';
import {json,sameOrigin} from '@/lib/foundation/http';
import {z} from 'zod';
export async function POST(req:Request,{params}:{params:Promise<{action:string}>}){
 if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);
 if(!configured())return json({error:'The workspace connection is not configured yet.'},503);
 const {action}=await params;const db=await supabase();
 if(action==='logout'){const {error}=await db.auth.signOut();return error?json({error:'Could not sign out.'},503):json({ok:true})}
 if(action==='activate'){
  const raw=await req.text();if(raw.length>2000)return json({error:'Invalid activation request.'},400);
  let input;try{input=z.object({token_hash:z.string().min(20).max(256),password:z.string().min(12).max(256)}).strict().parse(JSON.parse(raw))}catch{return json({error:'Use a valid activation link and a password of at least 12 characters.'},400)}
  const {error:verification}=await db.auth.verifyOtp({token_hash:input.token_hash,type:'invite'});
  if(verification)return json({error:'This activation link has expired or has already been used. Request a new link from your administrator.'},401);
  const {error}=await db.auth.updateUser({password:input.password});
  if(error){await db.auth.signOut();return json({error:'Password could not be set. Request a fresh activation link and try again.'},400)}
  return json({ok:true});
 }
 if(action!=='login')return json({error:'Unknown action.'},404);
 const raw=await req.text();if(raw.length>2000)return json({error:'Invalid credentials.'},400);
 let input;try{input=z.object({email:z.string().email(),password:z.string().min(1).max(256)}).strict().parse(JSON.parse(raw))}catch{return json({error:'Enter your email and password.'},400)}
 const {error}=await db.auth.signInWithPassword(input);if(error)return json({error:'Sign-in failed. Check your credentials or contact your administrator.'},401);
 return json({ok:true});
}
