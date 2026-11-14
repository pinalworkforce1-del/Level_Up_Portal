import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const COACH_ENDPOINT=SUPABASE_URL+"/functions/v1/levelup-facilitated";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type, authorization, x-client-info, apikey, x-levelup-staff-token","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const norm=(v:unknown)=>String(v??"").trim().toLowerCase();
async function validateCoach(req:Request){
  const staffToken=req.headers.get("X-Levelup-Staff-Token")||"";
  const auth=req.headers.get("Authorization")||"";
  const headers:any={"Content-Type":"application/json"};
  let body:any={};
  if(staffToken){headers["X-Levelup-Staff-Token"]=staffToken;body={action:"staff_resume",staff_token:staffToken}}
  else if(auth){headers["Authorization"]=auth;body={action:"coach_roster"}}
  else return null;
  const res=await fetch(COACH_ENDPOINT,{method:"POST",headers,body:JSON.stringify(body)});
  if(!res.ok)return null;
  const payload=await res.json().catch(()=>null);
  return payload?.staff||payload?.coach||null;
}
function statusFor(row:any){return row?{status:row.is_complete?"complete":"in_progress",is_complete:Boolean(row.is_complete),completed_at:row.completed_at||null,updated_at:row.updated_at||null}:{status:"not_started",is_complete:false,completed_at:null,updated_at:null}}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{headers:cors});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const coach=await validateCoach(req);
    if(!coach)return json({error:"Coach access required."},403);
    let userIds:string[]|null=null;
    if(coach.role!=="admin"){
      const {data:assignments,error:aErr}=await db.from("levelup_participant_assignments").select("person_key").eq("primary_staff_email",norm(coach.email)).like("person_key","auth:%");
      if(aErr)throw aErr;
      userIds=(assignments||[]).map((a:any)=>String(a.person_key).slice(5)).filter(Boolean);
      if(!userIds.length)return json({coach,participants:[]});
    }
    let profileQuery=db.from("profiles").select("user_id,email,display_name,county,created_at").eq("role","participant");
    if(Array.isArray(userIds))profileQuery=profileQuery.in("user_id",userIds);
    const {data:profiles,error:pErr}=await profileQuery;
    if(pErr)throw pErr;
    const ids=(profiles||[]).map((p:any)=>p.user_id);
    let progress:any[]=[];
    if(ids.length){
      const {data,error}=await db.from("module_progress").select("user_id,module_id,is_complete,completed_at,updated_at").in("user_id",ids).in("module_id",["discover-me","explore-careers","work-life-plan","my-path-forward","ready2work-soft-skills","ready2work-resume-scenarios","ready2work-interview-scenarios"]);
      if(error)throw error;
      progress=data||[];
    }
    let interviews:any[]=[];
    if(ids.length){
      const {data,error}=await db.from("levelup_interview_sessions")
        .select("participant_id,status,evidence_complete,feedback_ready,completed_at,started_at")
        .in("participant_id",ids).order("started_at",{ascending:false}).limit(1000);
      if(error)throw error;
      interviews=data||[];
    }
    const interviewByUser=new Map<string,any>();
    for(const row of interviews){
      const prev=interviewByUser.get(row.participant_id)||{verified:false,last_at:null};
      const verified=row.status==="completed"&&row.evidence_complete===true&&row.feedback_ready===true;
      interviewByUser.set(row.participant_id,{
        verified:prev.verified||verified,
        last_at:verified&&(!prev.last_at||row.completed_at>prev.last_at)?row.completed_at:prev.last_at,
      });
    }
    const byUser=new Map<string,Map<string,any>>();
    for(const r of progress){if(!byUser.has(r.user_id))byUser.set(r.user_id,new Map());byUser.get(r.user_id)!.set(r.module_id,r)}
    const participants=(profiles||[]).map((p:any)=>{
      const m=byUser.get(p.user_id)||new Map();
      return {person_key:`auth:${p.user_id}`,user_id:p.user_id,display_name:p.display_name||(p.email?String(p.email).split("@")[0]:"Participant"),email:p.email||null,county:p.county||null,created_at:p.created_at||null,career_tree:{discover_me:statusFor(m.get("discover-me")),explore_careers:statusFor(m.get("explore-careers")),work_life_plan:statusFor(m.get("work-life-plan")),my_path_forward:statusFor(m.get("my-path-forward"))},
        ready_2_work:{
          soft_skills:statusFor(m.get("ready2work-soft-skills")),
          resume:statusFor(m.get("ready2work-resume-scenarios")),
          interview_scenarios:statusFor(m.get("ready2work-interview-scenarios")),
          interview_live:interviewByUser.get(p.user_id)||{verified:false,last_at:null}
        }};
    }).sort((a:any,b:any)=>String(a.display_name).localeCompare(String(b.display_name)));
    return json({coach,participants});
  }catch(err){console.error(err);return json({error:"Career Tree roster unavailable."},500)}
});