import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const COACH_ENDPOINT=SUPABASE_URL+"/functions/v1/levelup-facilitated";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type, authorization, x-client-info, apikey, x-levelup-staff-token","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const norm=(v:unknown)=>String(v??"").trim().toLowerCase();
const dataOf=(r:any)=>r?.journey_state?.data&&typeof r.journey_state.data==="object"?r.journey_state.data:{};
function levelInfo(d:any){const raw=norm(d?.selected_wage_level);if(raw==="median"||raw==="typical")return{key:"median",label:"Typical local pay",hourly:Number(d?.selected_occupation?.medianHourly||0)};if(raw==="higher"||raw==="experienced")return{key:"higher",label:"Higher-end potential",hourly:Number(d?.selected_occupation?.experiencedHourly||0)};return{key:"entry",label:"Estimated entry pay",hourly:Number(d?.selected_occupation?.entryHourly||0)}}
function affordability(d:any){const l=levelInfo(d),plan=Number(d?.monthly_plan?.total||0),take=Math.round(l.hourly*(40*52/12)*.78*100)/100,gap=Math.round((plan-take)*100)/100;return{selected_hourly_wage:l.hourly,estimated_take_home_monthly:take,monthly_gap:gap,gap_status:gap>.5?"shortfall":gap<-.5?"surplus":"meets",annual_gap_equivalent:Math.round(gap*12*100)/100,take_home_rate_assumption:.78}}
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
function planReadiness(d:any,row:any){
 const prompts=[["direction","Career direction","What career direction feels most interesting right now?"],["strengths","Strengths and interests","Which strengths could help you explore your goal?"],["goal","Specific goal","What would success with this goal look like?"],["action","First action","What is one small action you could take next?"],["timeframe","Time frame","When would be a realistic time to begin?"]];
 const p=d?.planResponses&&typeof d.planResponses==="object"?d.planResponses:{};
 const measures=prompts.map(([key,label,question])=>{
   const raw=p[key],value=Number.isInteger(raw)&&raw>=0&&raw<=2?raw:null;
   return {key,label,value,max:2,talking_point:question};
 });
 const complete=measures.every(m=>m.value!==null);
 const score=complete?measures.reduce((sum,m)=>sum+m.value,0):null;
 const self=Number.isInteger(d?.readiness)&&d.readiness>=0&&d.readiness<=10?d.readiness:null;
 const category=score===null?"Insufficient information":score<=3?"Exploring direction":score<=6?"Building momentum":"Action plan defined";
 const supports=Array.isArray(d?.readinessSupports)?d.readinessSupports.filter((v:any)=>["career_info","action_plan","training","coach","ready"].includes(v)):[];
 const gap=score!==null&&self!==null?score-self:null;
 const interpretation=score===null?"Planning reflection is incomplete; use the available answers to begin a conversation.":gap!==null&&gap>=2?"The participant's plan appears more developed than their own readiness rating. Explore confidence and desired support.":gap!==null&&gap<=-2?"The participant feels ready but may benefit from making their plan more specific.":score>=7?"A next-step plan is taking shape. Discuss timing and follow-through.":score>=4?"Several planning elements are emerging. Identify one useful next step.":"Explore career possibilities and build an achievable first step together.";
 const topics=measures.filter(m=>m.value!==2).slice(0,3).map(m=>m.talking_point);
 if(supports.includes("coach"))topics.unshift("What would you like support from your Career Coach with?");
 if(d?.coachConversation===true)topics.unshift("You asked for a private conversation. What would you like to discuss today?");
 return {
  self_reported_readiness:self,plan_readiness:score,category,interpretation,
  scored_dimensions:measures,answered_dimensions:measures.filter(m=>m.value!==null).length,
  readiness_gap:gap,requested_support:supports,private_conversation_requested:d?.coachConversation===true,
  coach_talking_points:topics.slice(0,4),history:Array.isArray(d?.readinessHistory)?d.readinessHistory.slice(-20).map((v:any)=>({
   at:typeof v?.at==="string"?v.at:null,self_reported_readiness:Number.isInteger(v?.selfRating)&&v.selfRating>=0&&v.selfRating<=10?v.selfRating:null,
   plan_readiness:prompts.every(([key])=>Number.isInteger(v?.planResponses?.[key])&&v.planResponses[key]>=0&&v.planResponses[key]<=2)?prompts.reduce((n,[key])=>n+v.planResponses[key],0):null
  })).filter((x:any)=>x.at):[],
  fields:{nextChapter:String(d?.fields?.nextChapter||"").slice(0,700),strengths:String(d?.fields?.strengths||"").slice(0,700),goal:String(d?.fields?.goal||"").slice(0,700),nextStep:String(d?.fields?.nextStep||"").slice(0,700),target:String(d?.fields?.target||"").slice(0,120)},
  completed_at:row?.completed_at||null,updated_at:row?.updated_at||null,is_complete:Boolean(row?.is_complete)
 };
}

function summarize(moduleId:string,row:any){
  if(!row)return{status:"not_started",is_complete:false};
  const d=dataOf(row),base:any={status:row.is_complete?"complete":"in_progress",is_complete:Boolean(row.is_complete),completed_at:row.completed_at||null,updated_at:row.updated_at||null};
  if(moduleId==="discover-me")return{...base,answered_count:Number(d.answered_count??d.progress?.answered??0),total_questions:Number(d.progress?.total_questions??30),top_3:Array.isArray(d.top_3)?d.top_3:[],riasec_scores:d.riasec_scores||{}};
  if(moduleId==="explore-careers")return{...base,geography:d.geography||null,preferences:d.preferences||{},interest_context:d.interest_context||{},occupations_reflected:Number(d.progress?.occupations_reflected??0),careers_saved:Number(d.progress?.careers_saved??0),occupation_reflections:Array.isArray(d.occupation_reflections)?d.occupation_reflections:[],saved_careers:Array.isArray(d.saved_careers)?d.saved_careers:[]};
  if(moduleId==="work-life-plan"){const l=levelInfo(d);return{...base,pathway:d.pathway||null,county:d.county||null,selected_occupation:d.selected_occupation||null,selected_wage_level:l.key,selected_wage_label:d.selected_wage_label||l.label,selected_wage_hourly:l.hourly,target_hourly_wage:Number(d.target_hourly_wage||0),monthly_plan:d.monthly_plan||null,affordability:affordability(d),housing:d.housing||null,transportation:d.transportation||null,reflections:d.reflections||{}}}
  return base;
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{headers:cors});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const body=await req.json().catch(()=>({}));
    const personKey=String(body?.person_key||"");
    if(!/^auth:[0-9a-fA-F-]{36}$/.test(personKey))return json({error:"Authenticated participant key is required."},400);
    const coach=await validateCoach(req);
    if(!coach)return json({error:"Coach access required."},403);
    const userId=personKey.slice(5);
    if(coach.role!=="admin"){
      const {data:a,error:aErr}=await db.from("levelup_participant_assignments").select("person_key").eq("person_key",personKey).eq("primary_staff_email",norm(coach.email)).maybeSingle();
      if(aErr)throw aErr;
      if(!a)return json({error:"This participant is not assigned to this coach."},403);
    }
    const [{data:profile,error:pErr},{data:rows,error:rErr}]=await Promise.all([
      db.from("profiles").select("user_id,email,display_name,county").eq("user_id",userId).single(),
      db.from("module_progress").select("module_id,journey_state,is_complete,completed_at,updated_at").eq("user_id",userId).in("module_id",["discover-me","explore-careers","work-life-plan","my-path-forward"])
    ]);
    if(pErr)throw pErr;if(rErr)throw rErr;
    const [softSkillsResult,resumeScenariosResult,resumeProfileResult,resumeVersionsResult,interviewResult,interviewScenariosResult]=await Promise.all([
      db.from("module_progress").select("journey_state,is_complete,completed_at,updated_at").eq("user_id",userId).eq("module_id","ready2work-soft-skills").maybeSingle(),
      db.from("module_progress").select("journey_state,is_complete,completed_at,updated_at").eq("user_id",userId).eq("module_id","ready2work-resume-scenarios").maybeSingle(),
      db.from("resume_profiles").select("master_data,updated_at").eq("user_id",userId).maybeSingle(),
      db.from("resume_versions").select("id,version_name,target_role,occupation_code,version_data,created_at,updated_at").eq("user_id",userId).order("updated_at",{ascending:false}).limit(20),
      db.from("levelup_interview_sessions").select("id,status,occupation,required_questions,answer_evidence,evidence_complete,feedback_ready,feedback_json,feedback_status,ended_at,ending_reason,completed_at,started_at,avatar_seconds,agent_seconds,transcript_json").eq("participant_id",userId).order("created_at",{ascending:false}).limit(20),
      db.from("module_progress").select("journey_state,is_complete,completed_at,updated_at").eq("user_id",userId).eq("module_id","ready2work-interview-scenarios").maybeSingle()
    ]);
    if(softSkillsResult.error)throw softSkillsResult.error;
    if(resumeScenariosResult.error)throw resumeScenariosResult.error;
    if(resumeProfileResult.error)throw resumeProfileResult.error;
    if(resumeVersionsResult.error)throw resumeVersionsResult.error;
    if(interviewResult.error)throw interviewResult.error;
    if(interviewScenariosResult.error)throw interviewScenariosResult.error;
    const softRow=softSkillsResult.data,sd=softRow?.journey_state?.data||{};
    const soft_skills=softRow?{status:softRow.is_complete?"complete":"in_progress",completion_verified:Boolean(softRow.is_complete),completed_scenes:Number(sd.completed_scenes||0),total_scenes:Number(sd.total_scenes||0),skill_scores:sd.skill_scores||{},scene_selections:sd.scene_selections||{},updated_at:softRow.updated_at||null}:{status:"no_cloud_evidence",completion_verified:false,completed_scenes:0,total_scenes:0,skill_scores:{},scene_selections:{}};
    const rr=resumeScenariosResult.data,rd=rr?.journey_state?.data||{};
    const resume_scenarios={completion_verified:Boolean(rr?.is_complete),completed_scenes:Number(rd.completed_scenes||0),total_scenes:Number(rd.total_scenes||5),scene_selections:rd.scene_selections||{},choice_version:Number(rd.choice_version||1),completed_at:rr?.completed_at||null,updated_at:rr?.updated_at||null};
    const versions=resumeVersionsResult.data||[];
    const profileData=resumeProfileResult.data?.master_data||null;
    const resumeActive=Boolean(profileData||versions.length);
    const resume={scenarios:resume_scenarios,status:versions.length?"versions_saved":resumeActive?"in_progress":"no_cloud_evidence",completion_verified:Boolean(resume_scenarios.completion_verified&&versions.length),has_profile:Boolean(profileData),last_updated:resumeProfileResult.data?.updated_at||versions[0]?.updated_at||null,versions:versions.map((v:any)=>({id:v.id,name:v.version_name||"Saved résumé",target_role:v.target_role||null,occupation_code:v.occupation_code||null,updated_at:v.updated_at||null,evidence:v.version_data||null})),master_data:profileData};
    const sessions=interviewResult.data||[];
    const eligible=(v:any)=>v.status==="completed"&&v.evidence_complete===true&&v.feedback_ready===true&&!["participant_ended","early_termination","participant_exit"].includes(norm(v.ending_reason));
    const chosen=sessions.find(eligible)||sessions[0]||null;
    const ir=interviewScenariosResult.data, idata=ir?.journey_state?.data||{};
    const scenario_evidence={completed_scenes:Number(idata.completed_scenes||0),total_scenes:Number(idata.total_scenes||5),scene_selections:idata.scene_selections||{},completion_verified:Boolean(ir?.is_complete),completed_at:ir?.completed_at||null};
    const interview={scenarios:scenario_evidence,status:sessions.some(eligible)?"complete":sessions.length?"not_verified":"no_cloud_evidence",completion_verified:sessions.some(eligible),session_count:sessions.length,session:chosen?{id:chosen.id,occupation:chosen.occupation,status:chosen.status,ended_at:chosen.ended_at,ending_reason:chosen.ending_reason,evidence_complete:chosen.evidence_complete,feedback_ready:chosen.feedback_ready,feedback_status:chosen.feedback_status,required_questions:chosen.required_questions,answer_evidence:chosen.answer_evidence,feedback:eligible(chosen)?chosen.feedback_json:null,conversation_balance:chosen.transcript_json&&Array.isArray(chosen.transcript_json)?(()=>{const t=chosen.transcript_json;let participant=0,interviewer=0;for(const turn of t){const n=String(turn.text||"").trim().split(/\s+/).filter(Boolean).length;if(turn.role==="user")participant+=n;if(turn.role==="assistant")interviewer+=n;}const total=participant+interviewer;return total?{participant_percent:Math.round(participant/total*100),interviewer_percent:Math.round(interviewer/total*100),measurement:"word_count_proxy",participant_words:participant,interviewer_words:interviewer,target_participant_percent:80}:null})():null}:null};
    const map=new Map((rows||[]).map((r:any)=>[r.module_id,r]));
    return json({participant:{person_key:personKey,user_id:profile.user_id,display_name:profile.display_name||String(profile.email||"").split("@")[0]||"Participant",email:profile.email||null,county:profile.county||null},career_tree:{discover_me:summarize("discover-me",map.get("discover-me")),explore_careers:summarize("explore-careers",map.get("explore-careers")),work_life_plan:summarize("work-life-plan",map.get("work-life-plan")),my_path_forward:map.get("my-path-forward")?planReadiness(dataOf(map.get("my-path-forward")),map.get("my-path-forward")):null},ready_2_work:{soft_skills,resume,interview}});
  }catch(err){console.error(err);return json({error:"Career Tree detail unavailable."},500)}
});