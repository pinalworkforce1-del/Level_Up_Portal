import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { AccessToken } from "npm:livekit-server-sdk@2.19.1";
import { RoomAgentDispatch, RoomConfiguration } from "npm:@livekit/protocol@1.39.1";
const URL="wss://level-up-interview-intelligence-xo0xql5c.livekit.cloud";
const PILOT_QUESTIONS=[{id:"q1",text:"What interests you about this position and what experience would help you succeed?"},{id:"q2",text:"What workplace responsibilities have best prepared you to work with a team?"},{id:"q3",text:"What would you do if you encountered a customer or coworker who needed assistance while you were busy?"}];
const EARLY_CAREER_BANK={"version":"early-career-v1","core":[{"id":"q1","text":"Tell me about yourself.","theme":"Self-awareness and communication"},{"id":"q2","text":"Tell me about a time you worked with someone else to accomplish something.","theme":"Teamwork and cooperation"},{"id":"q3","text":"Tell me about a time you had several responsibilities or deadlines. How did you manage them?","theme":"Time management and dependability"},{"id":"q5","text":"Tell me about a time you learned something new or received feedback. What did you do with it?","theme":"Learning and adaptability"}],"roles":{"first_job":{"label":"My First Job","scenario":"Imagine you are busy with a task and someone asks for help. What would you do?"},"food_service":{"label":"Fast Food & Food Service","scenario":"Imagine the restaurant is busy and a customer tells you their order is wrong. What would you do?"},"retail":{"label":"Retail Associate","scenario":"Imagine you are stocking shelves when a customer asks for help finding something. What would you do?"},"customer_service":{"label":"Customer Service","scenario":"Imagine a customer is frustrated because something did not go as expected. How would you respond?"},"wex":{"label":"Work Experience (WEX)","scenario":"Imagine your supervisor gives you a task you have never done before. How would you make sure you understand what to do?"},"electrician":{"label":"Electrician (Entry Level)","scenario":"Imagine a teammate needs help while you are finishing an important task. How would you communicate and decide what to do safely?"},"nursing_assistant":{"label":"Nursing Assistant (Entry Level)","scenario":"Imagine someone needs help while you are already busy. How would you communicate and follow workplace directions?"},"manufacturing":{"label":"Manufacturing / Team Assembler","scenario":"Imagine a team member is falling behind on a task. How would you help while keeping your own work and safety in mind?"},"cdl_driver":{"label":"Commercial Driver (Entry Level)","scenario":"Imagine you are running behind schedule and someone needs an update. How would you communicate and handle the situation safely?"}},"aliases":{"general":"first_job"},"scenario_theme":"Customer service and problem-solving"};
const EARLY_CAREER_ROLES=EARLY_CAREER_BANK.roles;
function interviewQuestionsFor(rawRole:string){
 const role=EARLY_CAREER_BANK.aliases[rawRole]||rawRole;
 const selected=EARLY_CAREER_ROLES[role];
 if(!selected)return null;
 const core=EARLY_CAREER_BANK.core;
 return [...core.slice(0,3),{id:"q4",text:selected.scenario,theme:EARLY_CAREER_BANK.scenario_theme},core[3]].map(q=>({id:q.id,text:q.text,theme:q.theme}));
}
const origins=new Set(["https://pinalworkforce1-del.github.io"]);
function response(body:unknown,status=200,origin=""){const headers:Record<string,string>={"content-type":"application/json","cache-control":"no-store","vary":"Origin"};if(origins.has(origin))headers["access-control-allow-origin"]=origin;return new Response(JSON.stringify(body),{status,headers})}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 if(req.method==="OPTIONS"){if(!origins.has(origin))return new Response(null,{status:403});return new Response(null,{status:204,headers:{"access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"authorization,apikey,content-type","access-control-max-age":"600"}})}
 if(req.method!=="POST")return response({error:"method_not_allowed"},405,origin);
 if(!origins.has(origin))return response({error:"origin_not_allowed"},403,origin);
 const auth=req.headers.get("authorization")||"";
 if(!auth.startsWith("Bearer "))return response({error:"authentication_required"},401,origin);
 const supa=Deno.env.get("SUPABASE_URL")||"https://dnijrzotfyvmmnmueknk.supabase.co";
 const service=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
 if(!service)return response({error:"supabase_not_configured"},503,origin);
 const verified=await fetch(supa+"/auth/v1/user",{headers:{"Authorization":auth,"apikey":service}}).catch(()=>null);
 if(!verified?.ok)return response({error:"authentication_failed"},401,origin);
 const user=await verified.json().catch(()=>null);
 if(!user?.id||user?.is_anonymous)return response({error:"signed_in_participant_required"},403,origin);
 const key=Deno.env.get("LIVEKIT_API_KEY"),secret=Deno.env.get("LIVEKIT_API_SECRET");
 if(!key||!secret)return response({error:"livekit_credentials_not_configured",message:"Configure LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Supabase Edge Function secrets."},503,origin);
 const request=await req.json().catch(()=>({}));
 if(request?.mode==="avatar_status"){
  const synthesiaKey=Deno.env.get("SYNTHESIA_API_KEY");
  if(!synthesiaKey)return response({error:"synthesia_key_not_configured"},503,origin);
  const sourceId="e14b3be2-12a9-4883-b80a-006f5214bcc7";
  let result:Response;
  try{result=await fetch("https://developers.synthesia.io/api/interactive-avatars/avatars",{method:"POST",headers:{"Authorization":synthesiaKey,"Accept":"application/json","Content-Type":"application/json"},body:JSON.stringify({sourceId,regenerate:false}),signal:AbortSignal.timeout(15000)})}catch{return response({error:"synthesia_unreachable"},502,origin)}
  const payload=await result.json().catch(()=>({}));
  return response({upstreamStatus:result.status,status:payload?.status||null,done:payload?.done??null,interactiveId:payload?.id||null,errorCode:payload?.code||payload?.error||null,message:typeof payload?.detail==="string"?payload.detail:null,requestId:result.headers.get("Request-Id")},result.ok?200:502,origin);
 }
 if(request?.mode==="readiness")return response({livekit_credentials_configured:!!(key&&secret),synthesia_credentials_configured:!!Deno.env.get("SYNTHESIA_API_KEY"),livekit_url:URL,avatar_session_started:false},200,origin);
 const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 const ledgerHeaders={"apikey":serviceKey,"authorization":"Bearer "+serviceKey,"content-type":"application/json","Prefer":"return=minimal"};
 if(request?.mode==="session_status"){
  const room=String(request?.room_name||"");
  if(!/^levelup-interview-pilot-[a-f0-9-]{36}$/.test(room))return response({error:"invalid_room"},400,origin);
  if(!serviceKey)return response({error:"ledger_unavailable"},503,origin);
  const url=supa+"/rest/v1/levelup_interview_sessions?participant_id=eq."+encodeURIComponent(user.id)+"&room_name=eq."+encodeURIComponent(room)+"&select=status,feedback_status,ended_at,estimated_total_usd,ending_reason,feedback_ready,evidence_complete,feedback_json,required_questions,answer_evidence,transcript_json";
  const result=await fetch(url,{headers:ledgerHeaders}).catch(()=>null);
  const rows=result?.ok?await result.json().catch(()=>[]):[];
  if(!result?.ok||!rows.length)return response({error:"session_not_found"},404,origin);
  const record=rows[0];const turns=Array.isArray(record.transcript_json)?record.transcript_json:[];
  let pw=0,iw=0;
  for(const turn of turns){const n=String(turn.text||"").trim().split(/\s+/).filter(Boolean).length;if(turn.role==="user")pw+=n;else if(turn.role==="assistant")iw+=n}
  const total=pw+iw;
  const conversation_balance=total?{participant_percent:Math.round(pw/total*100),interviewer_percent:Math.round(iw/total*100),measurement:"word_count_proxy",target_participant_percent:80}:null;
  delete record.transcript_json;
  return response({...record,conversation_balance},200,origin);
 }
 if(request?.mode==="latest_completed"){
  if(!serviceKey)return response({error:"ledger_unavailable"},503,origin);
  const url=supa+"/rest/v1/levelup_interview_sessions?participant_id=eq."+encodeURIComponent(user.id)+"&status=eq.completed&evidence_complete=eq.true&feedback_ready=eq.true&select=room_name,completed_at,feedback_status&order=completed_at.desc&limit=1";
  const result=await fetch(url,{headers:ledgerHeaders}).catch(()=>null);
  if(!result?.ok)return response({error:"ledger_unavailable"},502,origin);
  const rows=await result.json().catch(()=>[]);
  return response({room_name:rows[0]?.room_name||null,completed_at:rows[0]?.completed_at||null,feedback_status:rows[0]?.feedback_status||null},200,origin);
 }
 if(request?.mode==="end"){
  const room=String(request?.room_name||"");
  if(!/^levelup-interview-pilot-[a-f0-9-]{36}$/.test(room))return response({error:"invalid_room"},400,origin);
  if(!serviceKey)return response({error:"ledger_unavailable"},503,origin);
  const ownership=await fetch(supa+"/rest/v1/levelup_interview_sessions?select=id&participant_id=eq."+encodeURIComponent(user.id)+"&room_name=eq."+encodeURIComponent(room),{headers:ledgerHeaders}).catch(()=>null);
  const owned=ownership?.ok?await ownership.json().catch(()=>[]):[];
  if(owned.length!==1)return response({error:"session_not_found"},404,origin);
  const finalized=await fetch(supa+"/rest/v1/rpc/levelup_interview_finalize",{method:"POST",headers:ledgerHeaders,body:JSON.stringify({p_room:room,p_reason:request?.reason==="connection_lost"?"connection_lost":"participant_ended"})}).catch(()=>null);
  const result=finalized?.ok?await finalized.json().catch(()=>null):null;
  return response(result||{error:"finalization_unavailable"},result?.ok?200:502,origin);
 }
 if(request?.mode!=="pilot")return response({error:"pilot_only"},400,origin);
 if(!serviceKey)return response({error:"ledger_unavailable"},503,origin);
 const room="levelup-interview-pilot-"+crypto.randomUUID();
 const occupation=String(request?.occupation||"first_job").slice(0,64);
 const questions=interviewQuestionsFor(occupation);
 if(!questions)return response({error:"unsupported_interview_role"},400,origin);
 const reservation=await fetch(supa+"/rest/v1/rpc/levelup_interview_reserve",{method:"POST",headers:ledgerHeaders,body:JSON.stringify({p_participant:user.id,p_room:room,p_occupation:occupation})}).catch(()=>null);
 if(!reservation?.ok)return response({error:"reservation_unavailable"},503,origin);
 const reserved=await reservation.json().catch(()=>({ok:false}));
 if(!reserved.ok)return response({error:reserved.error||"session_not_available",remaining:reserved.remaining??null},429,origin);
 try {
  const token=new AccessToken(key,secret,{identity:"participant-"+user.id,ttl:"9m"});
  token.addGrant({roomJoin:true,room,canPublish:true,canPublishData:true,canSubscribe:true});
  token.roomConfig=new RoomConfiguration({agents:[new RoomAgentDispatch({agentName:"levelup-interview-pilot",metadata:JSON.stringify({question_bank:EARLY_CAREER_BANK.version,role:occupation})})]});
  const participantToken=await token.toJwt();
  const tracked=await fetch(supa+"/rest/v1/levelup_interview_sessions?room_name=eq."+encodeURIComponent(room),{method:"PATCH",headers:ledgerHeaders,body:JSON.stringify({status:"active",required_questions:questions})});
  if(!tracked.ok)throw Error("Unable to record interview configuration");
  return response({server_url:URL,participant_token:participantToken,room_name:room,avatar_session_started:false,mode:"pilot",ledger_recorded:true,remaining_sessions:reserved.remaining,maximum_seconds:reserved.maximum_seconds,question_count:questions.length,interview_role:occupation,interview_label:EARLY_CAREER_ROLES[EARLY_CAREER_BANK.aliases[occupation]||occupation]?.label||"First Job",question_bank:EARLY_CAREER_BANK.version},201,origin);
 } catch {
  await fetch(supa+"/rest/v1/levelup_interview_sessions?room_name=eq."+encodeURIComponent(room),{method:"PATCH",headers:ledgerHeaders,body:JSON.stringify({status:"failed",ended_at:new Date().toISOString(),ending_reason:"token_creation_failed"})});
  return response({error:"token_creation_failed"},503,origin);
 }
});
