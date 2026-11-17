import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.45.4";
const url=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"content-type,authorization,apikey,x-levelup-staff-token","Content-Type":"application/json"};
const json=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:cors});
const norm=(v:unknown)=>String(v??"").trim().toLowerCase();
async function authorized(req:Request){
  const staff=req.headers.get("X-Levelup-Staff-Token")||"";
  const jwt=req.headers.get("Authorization")||"";
  if(!staff&&!jwt)return null;
  const headers:Record<string,string>={"content-type":"application/json"};
  const body:Record<string,string>=staff?{action:"staff_resume",staff_token:staff}:{action:"coach_roster"};
  if(staff)headers["X-Levelup-Staff-Token"]=staff;
  else headers["Authorization"]=jwt;
  const response=await fetch(url+"/functions/v1/levelup-facilitated",{method:"POST",headers,body:JSON.stringify(body)});
  if(!response.ok)return null;
  const data=await response.json().catch(()=>null);
  return data?.staff||data?.coach||null;
}
function score(n:unknown){const v=Number(n);return Number.isInteger(v)&&v>=1&&v<=5?v:null}
function sessionModel(s:any){
  const completed=s.status==="completed"&&s.evidence_complete===true&&s.feedback_ready===true&&!["participant_ended","early_termination","participant_exit"].includes(norm(s.ending_reason));
  const feedback=completed&&s.feedback_json?.source==="nova_ai"?s.feedback_json:null;
  const questions=Array.isArray(feedback?.questions)?feedback.questions:[];
  const scores=questions.map((q:any)=>score(q.score)).filter((v:any)=>v!==null);
  const average=scores.length?Math.round(scores.reduce((a:number,b:number)=>a+b,0)/scores.length*100)/100:null;
  const dimensions=questions.map((q:any)=>q.developmental_dimensions||null).filter((q:any)=>q&&typeof q==="object");
  const metric=(key:string)=>{
    const values=dimensions.map((d:any)=>score(d[key])).filter((v:any)=>v!==null);
    return values.length?Math.round(values.reduce((a:number,b:number)=>a+b,0)/values.length*100)/100:null;
  };
  const turns=Array.isArray(s.transcript_json)?s.transcript_json:[];
  const words={user:0,assistant:0};
  for(const t of turns){
    const role=t.role==="user"?"user":t.role==="assistant"?"assistant":null;
    if(role)words[role]+=String(t.text||"").trim().split(/\s+/).filter(Boolean).length;
  }
  const total=words.user+words.assistant;
  return {
    id:s.id,
    created_at:s.created_at,started_at:s.started_at,completed_at:s.completed_at,ended_at:s.ended_at,
    occupation:s.occupation,source_module:s.source_module||"unspecified",
    status:s.status,ending_reason:s.ending_reason,
    verified:completed,
    feedback_ready:Boolean(s.feedback_ready),feedback_generated:Boolean(feedback),
    question_count:Array.isArray(s.required_questions)?s.required_questions.length:0,
    average_answer_quality:average,
    dimensions:{
      situation:metric("situation"),action:metric("action"),result:metric("result"),
      specificity:metric("specificity"),individual_contribution:metric("individual_contribution"),
      communication:metric("communication")
    },
    conversation_balance:total?{participant_percent:Math.round(words.user/total*100),interviewer_percent:Math.round(words.assistant/total*100),measurement:"word_count_proxy"}:null,
    ...(feedback?{
      feedback,
      required_questions:s.required_questions||[],
      answer_evidence:s.answer_evidence||[]
    }:{})
  };
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  try{
    const staff=await authorized(req);
    if(!staff||!["admin","coach"].includes(staff.role))return json({error:"coach_access_required"},403);
    const body=await req.json().catch(()=>({}));
    const personKey=String(body.person_key||"");
    if(!/^auth:[0-9a-fA-F-]{36}$/.test(personKey))return json({error:"authenticated_participant_required"},400);
    if(staff.role!=="admin"){
      const {data:assignment,error}=await db.from("levelup_participant_assignments").select("person_key")
        .eq("person_key",personKey).eq("primary_staff_email",norm(staff.email)).maybeSingle();
      if(error)throw error;
      if(!assignment)return json({error:"not_assigned_to_coach"},403);
    }
    const userId=personKey.slice(5);
    const [{data:profile,error:profileError},{data:sessions,error:sessionError}]=await Promise.all([
      db.from("profiles").select("user_id,display_name,email").eq("user_id",userId).maybeSingle(),
      db.from("levelup_interview_sessions").select("id,created_at,started_at,completed_at,ended_at,occupation,source_module,status,ending_reason,evidence_complete,feedback_ready,feedback_json,required_questions,answer_evidence,transcript_json")
        .eq("participant_id",userId).order("created_at",{ascending:false}).limit(100)
    ]);
    if(profileError||sessionError)throw profileError||sessionError;
    if(!profile)return json({error:"participant_not_found"},404);
    const history=(sessions||[]).map(sessionModel);
    const complete=history.filter(x=>x.verified&&x.feedback_generated).slice().reverse();
    const first=complete[0]||null,last=complete[complete.length-1]||null;
    const comparable=complete.filter(s=>s.average_answer_quality!==null);
    const earliest=comparable[0]||null,latest=comparable[comparable.length-1]||null;
    const round=(v:number)=>Math.round(v*100)/100;
    const change=earliest&&latest&&earliest!==latest?round(latest.average_answer_quality!-earliest.average_answer_quality!):null;
    return json({participant:{display_name:profile.display_name||"Participant",person_key:personKey},
      sessions:history,history_count:history.length,verified_count:complete.length,
      comparison:{
        baseline_id:first?.id||null,latest_id:last?.id||null,
        average_answer_quality_delta:change,
        note:"Developmental indicators are not a hiring decision. Compare like-for-like roles and questions; different question sets limit direct comparability. Legacy dimensions are unavailable rather than retrospectively invented."
      }});
  }catch(e){console.error("interview-coach-history",e instanceof Error?e.message:"unavailable");return json({error:"history_unavailable"},500)}
});
