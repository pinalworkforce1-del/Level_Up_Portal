const PAGE_PARAMS=new URLSearchParams(location.search);
const LIVE_ROOM=(PAGE_PARAMS.get('room')||'').toUpperCase().replace(/[^A-Z2-9]/g,'');
const FROM_FIRST_DAY=PAGE_PARAMS.get('from')==='first-day-challenge';
const STORAGE_KEY=LIVE_ROOM.length>=8?'level-up-first30-live-'+LIVE_ROOM:'level-up-first30-v1';
const SCENES=[
 {id:'d01_morning',day:1,title:'The Morning Choice',prompt:'Your first shift starts at 9:00 AM. You planned to leave at 8:10, but you stayed up late and hit snooze twice. It is 7:55. You still need to get dressed, eat something, and make your bus.',image:'./assets/images/first30_d01_morning_scene.webp',audio:'./assets/audio/first30_d01_morning_narration.mp3',captions:'./assets/captions/first30_d01_morning_captions.vtt',reflection:'What are you protecting most right now: time, energy, or money?',choices:[
  {text:'Skip breakfast and get moving.',why:'Protect time now.',outcome:'You make the bus. You are on schedule—but by midmorning, your energy is already dropping.',impact:{Time:10,Energy:-15,Reliability:5}},
  {text:'Make a quick breakfast and take the next bus.',why:'Protect energy now.',outcome:'You feel better physically, but now there is almost no room for a transportation delay.',impact:{Energy:10,Time:-10,Reliability:-5}},
  {text:'Call for a rideshare.',why:'Protect arrival time by spending money.',outcome:'You arrive ready to go—but your transportation budget just got tighter.',impact:{Time:10,Energy:5,Money:-15,Reliability:5}}
 ]},
 {id:'d03_bus_delay',day:3,title:'The Bus Does Not Come',prompt:'You are at the bus stop on time. Ten minutes pass. Then fifteen. The transit app now says the bus is delayed another 25 minutes. Your shift starts in 35 minutes.',image:'./assets/images/first30_d03_bus_delay_scene.webp',audio:'./assets/audio/first30_d03_bus_delay_narration.mp3',captions:'./assets/captions/first30_d03_bus_delay_captions.vtt',reflection:'The delay is not your fault. Which part of the response is still yours to manage?',choices:[
  {text:'Text your supervisor now and explain the delay.',why:'Protect communication and trust.',outcome:'Maya appreciates the heads-up. You may still arrive late, but she is not wondering where you are.',impact:{Reliability:10,Support:5}},
  {text:'Wait and hope the bus catches up.',why:'Avoid acting until you know more.',outcome:'The bus eventually arrives, but you walk in late without having contacted anyone.',impact:{Time:-15,Reliability:-10}},
  {text:'Use another transportation option.',why:'Protect the shift by spending money.',outcome:'You get to work on time, but this is the second unexpected transportation expense this week.',impact:{Money:-20,Time:10,Reliability:5}}
 ]},
 {id:'d05_extra_shift',day:5,title:'Can You Stay?',prompt:'It is almost the end of your shift. A coworker called out, and Maya asks whether you can stay two extra hours.',image:'./assets/images/first30_d05_extra_shift_scene.webp',audio:'./assets/audio/first30_d05_extra_shift_narration.mp3',captions:'./assets/captions/first30_d05_extra_shift_captions.vtt',reflection:'Reliability does not mean saying yes to everything. What can you realistically commit to?',choices:[
  {text:'Stay for the full two hours.',why:'Protect income and team coverage.',outcome:'The extra hours help your paycheck, and your supervisor notices that you stepped up. But you leave exhausted.',impact:{Money:20,Reliability:10,Energy:-20}},
  {text:'Explain that you can stay for one hour.',why:'Help without overcommitting.',outcome:'You help without overcommitting. Maya knows what you can realistically do.',impact:{Money:10,Reliability:5,Energy:-10,Support:5}},
  {text:'Say no—you already have plans.',why:'Protect your existing commitment and energy.',outcome:'You leave on time. Saying no to an unscheduled shift does not make you unreliable—but repeated availability choices may affect how often extra hours come your way.',impact:{Energy:10}}
 ]},
 {id:'d08_ask_for_help',day:8,title:'You Do Not Know What They Mean',prompt:'Jordan tells you to finish a task using a process everyone else seems to understand. You are new and are not completely sure what to do.',image:'./assets/images/first30_d08_ask_for_help_scene.webp',audio:'./assets/audio/first30_d08_ask_for_help_narration.mp3',captions:'./assets/captions/first30_d08_ask_for_help_captions.vtt',reflection:'Not knowing something is normal. What turns uncertainty into a learning moment?',choices:[
  {text:'Ask Jordan to show you the first step again.',why:'Use support before the mistake.',outcome:'Jordan walks you through it. It takes a few extra minutes now, but you know how to do it correctly next time.',impact:{Support:10,Reliability:5,Energy:5}},
  {text:'Try to figure it out without asking.',why:'Protect independence.',outcome:'You work through it, but it costs you energy and creates some uncertainty.',impact:{Energy:-10}},
  {text:'Leave the task for someone else.',why:'Avoid the risk of doing it wrong.',outcome:'The task is discovered later. Jordan is not upset that you did not know how—he is frustrated that nobody knew you needed help.',impact:{Reliability:-15,Support:-5}}
 ]},
 {id:'d12_payday',day:12,title:'Payday Meets Real Life',prompt:'After taxes, $684 hits your account. Your phone bill is due, you need transportation to work, you agreed to help with food at home, you owe $40 you borrowed last week, and your friends have plans this weekend.',image:'./assets/images/first30_d12_payday_scene.webp',audio:'./assets/audio/first30_d12_payday_narration.mp3',captions:'./assets/captions/first30_d12_payday_captions.vtt',reflection:'There is no choice that makes every priority disappear. What do you want this paycheck to protect first?',choices:[
  {text:'Pay required expenses and protect transportation first.',why:'Protect the ability to keep getting to work.',outcome:'You do not have as much spending money left, but your ride to work is protected.',impact:{Money:15,Reliability:5}},
  {text:'Pay the bills and go out Saturday. Figure transportation out later.',why:'Protect some enjoyment now.',outcome:'You have a good night and enjoy having money from your first paycheck. But your transportation cushion is now thin.',impact:{Energy:10,Money:-15}},
  {text:'Pay everything—including the money you borrowed—and stay home this weekend.',why:'Protect obligations and trust.',outcome:'You are financially safer, and you kept your word—but it feels like your paycheck disappeared almost immediately.',impact:{Money:10,Support:10,Energy:-5}}
 ]},
 {id:'d15_schedule_change',day:15,title:'The Schedule Changes',prompt:'A new schedule is posted. An upcoming shift now conflicts with an important responsibility outside work. You have time to address it, but the shift still needs coverage.',image:'./assets/images/first30_d15_schedule_change_scene.webp',audio:'./assets/audio/first30_d15_schedule_change_narration.mp3',captions:'./assets/captions/first30_d15_schedule_change.vtt',reflection:'How early can you raise a conflict, and what workable options can you bring?',choices:[
  {text:'Tell Maya now and ask about a shift swap.',why:'Protect communication and coverage.',outcome:'Maya has time to plan. A swap may be possible, and she knows you are taking responsibility for the conflict.',impact:{Reliability:10,Support:10,Time:-5}},
  {text:'Ask a coworker to trade, then tell Maya if they agree.',why:'Look for a solution first.',outcome:'You find a possible trade, but the schedule is not settled until Maya approves it. You follow up with her before assuming you are covered.',impact:{Time:-10,Support:5,Reliability:5}},
  {text:'Wait until the shift is closer to decide.',why:'Avoid a difficult conversation today.',outcome:'The conflict is still there. With less notice, Maya has fewer ways to cover the shift and you feel more pressure.',impact:{Time:-15,Energy:-10,Reliability:-10}}
 ]},
 {id:'d18_feedback',day:18,title:'Feedback You Did Not Expect',prompt:'Maya pulls you aside and says that one part of your work needs to improve. Her feedback is direct, and you did not realize there was a problem.',image:'./assets/images/first30_d18_feedback_scene.webp',audio:'./assets/audio/first30_d18_feedback_narration.mp3',captions:'./assets/captions/first30_d18_feedback.vtt',reflection:'What would help you turn feedback into a specific next step?',choices:[
  {text:'Ask for an example and what good work looks like.',why:'Make the feedback actionable.',outcome:'Maya gives you a concrete example. You leave knowing what to practice and when she will check back in.',impact:{Support:10,Reliability:10,Energy:-5}},
  {text:'Listen, thank her, and think it through later.',why:'Give yourself time to process.',outcome:'You stay open to the feedback, but you still need to clarify exactly what to change before the next shift.',impact:{Support:5,Energy:5}},
  {text:'Explain why the problem was not your fault.',why:'Protect your side of the story.',outcome:'Maya hears your context, but the conversation ends without a clear improvement plan. You can still return and ask what to do differently.',impact:{Support:-5,Reliability:-5,Energy:-10}}
 ]},
 {id:'d21_coworker_shortcut',day:21,title:'Everyone Does It',prompt:'A coworker shows you a faster way to finish a task and says everyone does it. You are unsure whether the shortcut follows the process you were taught.',image:'./assets/images/first30_d21_coworker_shortcut_scene.webp',audio:'./assets/audio/first30_d21_coworker_shortcut_narration.mp3',captions:'./assets/captions/first30_d21_coworker_shortcut.vtt',reflection:'When speed and the right process seem to conflict, where can you check?',choices:[
  {text:'Ask Maya whether the shortcut is approved.',why:'Check quality and safety first.',outcome:'You confirm the standard before changing your process. It costs a little time now and protects trust in your work.',impact:{Time:-5,Reliability:10,Support:5}},
  {text:'Stick with the process you were taught.',why:'Protect consistency.',outcome:'Your task takes longer, but you know it meets the standard. You can ask later whether there is an approved faster method.',impact:{Time:-10,Reliability:10,Energy:-5}},
  {text:'Use the shortcut because the coworker knows the job.',why:'Save time and keep up.',outcome:'You finish faster, but you have not checked whether a quality or safety step was skipped. That uncertainty follows you into the next task.',impact:{Time:10,Reliability:-15,Energy:-5}}
 ]},
 {id:'d25_running_on_empty',day:25,title:'Running on Empty',prompt:'You have kept showing up, but work, transportation, money, and life outside the job are adding up. Your energy is low and you notice small mistakes creeping in.',image:'./assets/images/first30_d25_running_on_empty_scene.webp',audio:'./assets/audio/first30_d25_running_on_empty_narration.mp3',captions:'./assets/captions/first30_d25_running_on_empty.vtt',reflection:'Which small change could help you recover before stress turns into a bigger problem?',choices:[
  {text:'Tell Maya what is happening and ask about available support.',why:'Address pressure early.',outcome:'You identify a manageable adjustment and learn what support is available. The conversation gives you room to recover.',impact:{Support:15,Energy:10,Reliability:5}},
  {text:'Protect rest tonight and plan tomorrow’s transportation.',why:'Make a practical recovery plan.',outcome:'You give yourself time to recharge and reduce one source of tomorrow’s stress. The other pressures still need attention.',impact:{Energy:15,Time:5,Money:-5}},
  {text:'Keep pushing and hope things settle down.',why:'Avoid another conversation or expense.',outcome:'You finish the shift, but the strain carries into the next day. Small mistakes become harder to catch when you have no recovery time.',impact:{Energy:-20,Reliability:-10,Time:-5}}
 ]},
 {id:'d30_check_in',day:30,title:'The Thirty Day Check In',prompt:'Maya asks how your first month has gone, what you have learned, and what support would help you keep growing. You have had wins and hard moments.',image:'./assets/images/first30_d30_check_in_scene.webp',audio:'./assets/audio/first30_d30_check_in_narration.mp3',captions:'./assets/captions/first30_d30_check_in.vtt',reflection:'What is one strength you can name, and one next step you want to work on?',choices:[
  {text:'Share a win, a challenge, and one goal for next month.',why:'Show growth and make a plan.',outcome:'Maya sees that you can recognize progress and take ownership of what comes next. Together you agree on a clear next step.',impact:{Reliability:10,Support:10,Energy:5}},
  {text:'Ask Maya what she has noticed and where to focus.',why:'Use feedback to set direction.',outcome:'Maya names a strength you may have overlooked and an area to practice. You leave with a clearer picture of your next month.',impact:{Support:15,Reliability:5}},
  {text:'Say everything is fine and keep the conversation short.',why:'Avoid revisiting the hard parts.',outcome:'The check-in ends quickly. You have made it through the month, but Maya does not yet know what support or growth opportunity would help you.',impact:{Energy:5,Support:-10}}
 ]}
];
const INITIAL={sceneIndex:0,stats:{Time:70,Energy:70,Money:70,Reliability:70,Support:70},captionsEnabled:true,history:[],started:false,complete:false,startedAt:null,completedAt:null,savedAt:null};
const ACCESS_KEY='level-up-accessibility-v1';
const ACCESS_DEFAULTS={auto:true,captions:true,reduce:false,large:false,playbackRate:1};
const SUPABASE_URL='https://dnijrzotfyvmmnmueknk.supabase.co';
const SUPABASE_KEY='sb_publishable_qSEo4iczJBozMaSIvTKisw_BsJy-iPc';
const CLOUD_MODULE_ID='first30';
const BRIDGE_KEY='level-up-supabase-session-v1';
const FIRST_DAY_STORAGE_KEY='level-up-first-day-challenge-v1';
function loadAccess(){try{return {...ACCESS_DEFAULTS,...JSON.parse(localStorage.getItem(ACCESS_KEY)||'{}')}}catch{return {...ACCESS_DEFAULTS}}}
function saveAccess(){localStorage.setItem(ACCESS_KEY,JSON.stringify(access))}
let access=loadAccess();
let state=load(),cues=[],choiceLocked=false,captionRequest=0;
let cloud={status:'local',user:null,token:null},cloudTimer=null,cloudReady=false,firstDayStateCloud=null;
state.captionsEnabled=!!access.captions;
const $=id=>document.getElementById(id),audio=$('sceneAudio');

function cloneInitial(){return JSON.parse(JSON.stringify(INITIAL))}
function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'),initial=cloneInitial(),history=Array.isArray(saved.history)?saved.history:[];const complete=history.length===SCENES.length&&Boolean(saved.complete);return{...initial,...saved,stats:{...initial.stats,...saved.stats},history,complete,sceneIndex:saved.complete&&!complete?Math.min(history.length,SCENES.length-1):Math.max(0,Math.min(SCENES.length-1,Number(saved.sceneIndex)||0))}}catch{return cloneInitial()}}
function save(){state.savedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(state));if(cloudReady)scheduleCloudSync()}
function notifyRoom(){if(LIVE_ROOM.length<8||window.parent===window)return;window.parent.postMessage({type:'levelup-first30-progress',room:LIVE_ROOM,checkpoint:Math.max(1,Math.min(SCENES.length,state.history.length)),complete:state.complete},location.origin)}
function clamp(v){return Math.max(0,Math.min(100,v))}
function fmt(sec){if(!Number.isFinite(sec))return'--:--';sec=Math.max(0,Math.floor(sec));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function currentSceneDescription(){
 const s=SCENES[state.sceneIndex];
 if(!s)return {label:'The First 30',text:'Workplace readiness scene.'};
 return {label:'Day '+s.day+' · '+s.title,text:s.prompt+' Decision point: '+s.choices.map(c=>c.text).join(' ')};
}
function applyAccess(){
 document.body.classList.toggle('first30-large-text',!!access.large);
 document.body.classList.toggle('first30-reduce-motion',!!access.reduce);
 audio.playbackRate=Number(access.playbackRate||1);
 state.captionsEnabled=!!access.captions;
 updateCC();
 if(!state.captionsEnabled){$('captionOverlay').classList.add('hidden');$('captionOverlay').textContent=''}
}
function syncAccessDialog(){
 const d=$('first30Accessibility');if(!d)return;
 $('accessAuto').checked=!!access.auto;
 $('accessCaptions').checked=!!access.captions;
 $('accessLargeText').checked=!!access.large;
 $('accessReduceMotion').checked=!!access.reduce;
 const info=currentSceneDescription();
 $('accessSceneLabel').textContent=info.label;
 $('accessSceneDescription').textContent=info.text;
 d.querySelectorAll('[data-rate]').forEach(b=>{const selected=Number(b.dataset.rate)===Number(access.playbackRate||1);b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected?'true':'false')});
}

const FDC_LABELS={
 'loadoutPlan':'Preparation plan','route':'Arrival planning','punctuality':'Punctuality','orientation':'Orientation',
 'team':'Team connection','connections':'Professional relationships','rush':'Working under pressure','help':'Asking for help',
 'teamwork':'Teamwork','customer':'Customer service','initiative':'Initiative','gossip':'Workplace trust','feedback':'Receiving feedback',
 'growth':'Growth mindset','clocktower':'Time planning','missedShiftRecovery':'Recovery after a missed shift','lateRecovery':'Recovery after lateness',
 'reflection':'First-day reflection'
};
function protectionProfile(source=state){
 const positive={Time:0,Energy:0,Money:0,Reliability:0,Support:0},pressure={Time:0,Energy:0,Money:0,Reliability:0,Support:0};
 for(const h of source.history||[])for(const [k,v] of Object.entries(h.impact||{})){const n=Number(v)||0;if(n>0)positive[k]=(positive[k]||0)+n;if(n<0)pressure[k]=(pressure[k]||0)+Math.abs(n)}
 const rank=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1]);
 const protectedRank=rank(positive),pressureRank=rank(pressure);
 const top=protectedRank.filter(([,v])=>v>0).slice(0,2).map(([k])=>k);
 const pressed=pressureRank.filter(([,v])=>v>0).slice(0,2).map(([k])=>k);
 const topText=top.length?top.join(' and '):'your available resources';
 const pressureText=pressed.length?pressed.join(' and '):'no single resource';
 return {
   protection_scores:positive,pressure_scores:pressure,top_protections:top,pressure_points:pressed,
   final_resources:{...(source.stats||{})},completed_checkpoints:(source.history||[]).length,
   analysis:'In these simulations, your decisions most often protected '+topText+'. The biggest tradeoffs showed up around '+pressureText+'. This is not a grade or personality label—it is a snapshot of the choices you made when priorities competed.',
   coaching_prompt:top.length?'What helps you keep protecting '+top[0].toLowerCase()+' without letting '+(pressed[0]||'another priority').toLowerCase()+' run too low?':'Which resource do you want to protect more intentionally during your next month of work?'
 };
}
function readFirstDayState(){
 try{const local=JSON.parse(localStorage.getItem(FIRST_DAY_STORAGE_KEY)||'null');return local||firstDayStateCloud||null}catch{return firstDayStateCloud||null}
}
function combinedReviewData(){
 const fdc=readFirstDayState()||{},completed=Array.isArray(fdc.completed)?fdc.completed:[],profile=protectionProfile();
 const readiness=[...new Set(completed.map(x=>FDC_LABELS[x]).filter(Boolean))];
 return {
   first_day:{xp:Number(fdc.xp||0),completed_count:completed.length,readiness_areas:readiness},
   first30:profile,
   combined_analysis:readiness.length
     ?'Your First Day Challenge built practice around '+readiness.slice(0,4).join(', ')+(readiness.length>4?', and other first-day skills.':'.')+' In The First 30, your decisions then showed how you balanced those skills against real-world pressures.'
     :'The First 30 shows how you balanced workplace reliability, support, time, energy, and money across realistic early-employment decisions.'
 };
}
function renderCombinedReview(){
 const el=$('combinedReview');if(!el)return;const r=combinedReviewData(),f=r.first_day,p=r.first30;
 const resources=Object.entries(p.final_resources||{}).map(([k,v])=>'<div class="reviewResource"><b>'+esc(k)+'</b><span>'+esc(v)+'</span></div>').join('');
 const areas=f.readiness_areas.length?f.readiness_areas.map(x=>'<span class="reviewTag">'+esc(x)+'</span>').join(''):'<span class="reviewMuted">First Day Challenge details will appear here when available.</span>';
 el.innerHTML='<div class="reviewCallout"><b>What your choices protected</b><p>'+esc(p.analysis)+'</p></div>'+
   '<div class="reviewBlock"><b>First Day Challenge readiness</b><p>'+esc(f.xp)+' XP · '+esc(f.completed_count)+' activities completed</p><div class="reviewTags">'+areas+'</div></div>'+
   '<div class="reviewBlock"><b>First 30 resource picture</b><div class="reviewResources">'+resources+'</div></div>'+
   '<div class="reviewBlock"><b>Bring this question to your coach</b><p>'+esc(p.coaching_prompt)+'</p></div>'+
   '<p class="reviewNote">'+esc(r.combined_analysis)+' This review is saved and will appear again when you return to The First 30.</p>';
}
function cloudSession(){
 try{const bridge=JSON.parse(sessionStorage.getItem(BRIDGE_KEY)||'null');if(bridge?.access_token&&bridge?.user)return bridge}catch{}
 try{const raw=localStorage.getItem('sb-dnijrzotfyvmmnmueknk-auth-token');if(!raw)return null;const parsed=JSON.parse(raw);return parsed?.access_token?parsed:parsed?.currentSession||null}catch{return null}
}
function cloudJourney(){return {...state,summary:protectionProfile(state)}}
function scheduleCloudSync(){if(!cloud.user||!cloud.token)return;clearTimeout(cloudTimer);cloudTimer=setTimeout(syncCloud,650)}
async function syncCloud(){
 if(!cloud.user||!cloud.token)return;cloud.status='syncing';
 const body={user_id:cloud.user.id,module_id:CLOUD_MODULE_ID,journey_state:cloudJourney(),xp:0,is_complete:!!state.complete,completed_at:state.complete?(state.completedAt||new Date().toISOString()):null,updated_at:new Date().toISOString()};
 try{
   const res=await fetch(SUPABASE_URL+'/rest/v1/module_progress?on_conflict=user_id,module_id',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+cloud.token,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)});
   cloud.status=res.ok?'synced':'offline';if(res.ok)window.LevelUpOfflineProgress?.markSynced(CLOUD_MODULE_ID)
 }catch{cloud.status='offline'}
}
async function initCloud(){
 const session=cloudSession();if(!session?.access_token||!session?.user){cloudReady=true;return}
 cloud={status:'syncing',user:session.user,token:session.access_token};
 const headers={apikey:SUPABASE_KEY,Authorization:'Bearer '+cloud.token};
 try{
   const [first30Res,fdcRes]=await Promise.all([
     fetch(SUPABASE_URL+'/rest/v1/module_progress?select=journey_state,updated_at&user_id=eq.'+session.user.id+'&module_id=eq.first30',{headers}),
     fetch(SUPABASE_URL+'/rest/v1/module_progress?select=journey_state,updated_at&user_id=eq.'+session.user.id+'&module_id=eq.first-day-challenge',{headers})
   ]);
   if(fdcRes.ok){const rows=await fdcRes.json();firstDayStateCloud=rows[0]?.journey_state||null}
   if(first30Res.ok){
     const rows=await first30Res.json(),remote=rows[0]?.journey_state;
     const remoteNewer=remote&&new Date(remote.savedAt||rows[0]?.updated_at||0)>new Date(state.savedAt||0);
     if(remoteNewer){state={...cloneInitial(),...remote,stats:{...cloneInitial().stats,...remote.stats},history:Array.isArray(remote.history)?remote.history:[]};state.captionsEnabled=!!access.captions}
   }
   cloud.status='synced'
 }catch{cloud.status='offline'}
 cloudReady=true;
 if(state.complete)showSummary();else if(state.started){$('introScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');renderScene()}
 scheduleCloudSync()
}
function start(){if(!state.startedAt)state.startedAt=new Date().toISOString();state.started=true;save();$('introScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');renderScene()}
function renderScene(){
 const s=SCENES[state.sceneIndex],prior=state.history.find(h=>h.scene===s.id);choiceLocked=Boolean(prior);
 $('dayTop').textContent='DAY '+s.day;$('progressTop').textContent='Checkpoint '+(state.sceneIndex+1)+' of '+SCENES.length;
 $('dayLabel').textContent='Day '+s.day;$('sceneTitle').textContent=s.title;$('scenePrompt').textContent=s.prompt;$('sceneImage').src=s.image;$('sceneImage').alt='Day '+s.day+' • '+s.title;
 $('sceneProgress').innerHTML=SCENES.map((_,i)=>'<i class="'+(i<state.sceneIndex?'done':i===state.sceneIndex?'active':'')+'"></i>').join('');
 $('choices').innerHTML=s.choices.map((c,i)=>'<button class="choiceBtn" data-i="'+i+'">'+esc(c.text)+'<span>'+esc(c.why)+'</span></button>').join('');
 document.querySelectorAll('.choiceBtn').forEach(b=>b.onclick=()=>choose(Number(b.dataset.i)));
 $('decisionPanel').classList.toggle('hidden',choiceLocked);$('outcomePanel').classList.toggle('hidden',!choiceLocked);
 if(prior){$('outcomeText').textContent=prior.outcome;$('impactList').innerHTML=Object.entries(prior.impact||{}).map(([k,d])=>'<span class="impact '+(d>=0?'good':'bad')+'">'+icon(k)+' '+k+' '+(d>=0?'+':'')+d+'</span>').join('');$('reflectionPrompt').textContent=s.reflection}
 audio.pause();audio.src=s.audio;audio.load();audio.playbackRate=Number(access.playbackRate||1);$('playBtn').textContent='▶ Play';$('audioTimer').textContent='0:00 / --:--';$('captionOverlay').classList.add('hidden');$('captionOverlay').textContent='';loadCaptions(s.captions);renderStats();applyAccess();save();notifyRoom();syncAccessDialog();
 if(access.auto)setTimeout(()=>audio.play().catch(()=>{}),120)
}
function renderStats(target='stats'){
 const el=$(target);el.innerHTML=Object.entries(state.stats).map(([k,v])=>'<div class="stat '+(v<=35?'low':v>=80?'high':'')+'"><div class="statLine"><span>'+icon(k)+' '+k+'</span><span>'+v+'</span></div><div class="bar"><div class="fill" style="width:'+v+'%"></div></div></div>').join('')
}
function icon(k){return({Time:'⏱',Energy:'⚡',Money:'💵',Reliability:'✓',Support:'🤝'}[k]||'•')}
function choose(i){
 if(choiceLocked)return;choiceLocked=true;const s=SCENES[state.sceneIndex],c=s.choices[i];
 Object.entries(c.impact).forEach(([k,d])=>state.stats[k]=clamp((state.stats[k]||0)+d));
 state.history=state.history.filter(x=>x.scene!==s.id);state.history.push({scene:s.id,day:s.day,title:s.title,choice:c.text,why:c.why,outcome:c.outcome,impact:c.impact});
 save();notifyRoom();renderStats();$('outcomeText').textContent=c.outcome;$('impactList').innerHTML=Object.entries(c.impact).map(([k,d])=>'<span class="impact '+(d>=0?'good':'bad')+'">'+icon(k)+' '+k+' '+(d>=0?'+':'')+d+'</span>').join('');$('reflectionPrompt').textContent=s.reflection;$('decisionPanel').classList.add('hidden');$('outcomePanel').classList.remove('hidden')
}
function next(){
 if(state.sceneIndex<SCENES.length-1){state.sceneIndex++;renderScene();window.scrollTo({top:0,behavior:access.reduce?'auto':'smooth'})}else{state.complete=true;state.completedAt=state.completedAt||new Date().toISOString();save();syncCloud();showSummary()}
}
function showSummary(){
 audio.pause();notifyRoom();$('gameScreen').classList.add('hidden');$('introScreen').classList.add('hidden');$('summaryScreen').classList.remove('hidden');$('dayTop').textContent='FIRST MONTH COMPLETE';$('progressTop').textContent=SCENES.length+' of '+SCENES.length+' checkpoints';renderStats('summaryStats');
 const profile=protectionProfile();
 $('summaryText').textContent=profile.analysis;
 $('choiceHistory').innerHTML=state.history.map(h=>'<div class="historyItem"><b>Day '+h.day+' • '+esc(h.title)+'</b><span>'+esc(h.choice)+'</span></div>').join('');
 renderCombinedReview();
 const returnBtn=$('returnPortalBtn');if(returnBtn)returnBtn.classList.toggle('hidden',!!LIVE_ROOM||!FROM_FIRST_DAY)
}
function reset(){if(!confirm('Reset The First 30 and start again?'))return;state=cloneInitial();state.startedAt=new Date().toISOString();save();audio.pause();$('summaryScreen').classList.add('hidden');$('gameScreen').classList.add('hidden');$('introScreen').classList.remove('hidden');$('dayTop').textContent='THE FIRST 30';$('progressTop').textContent='Checkpoint 0 of '+SCENES.length}
function replay(){audio.currentTime=0;audio.play().catch(()=>{});}
function updateCC(){$('ccBtn').textContent=state.captionsEnabled?'CC On':'CC Off';if(!state.captionsEnabled){$('captionOverlay').classList.add('hidden');$('captionOverlay').textContent=''}}
function toggleCC(){state.captionsEnabled=!state.captionsEnabled;access.captions=state.captionsEnabled;saveAccess();save();updateCC();updateCaption();syncAccessDialog()}
async function loadCaptions(url){const request=++captionRequest;cues=[];try{const response=await fetch(url);if(!response.ok)throw Error('Captions unavailable');const parsed=parseVtt(await response.text());if(request===captionRequest)cues=parsed}catch{}if(request===captionRequest)updateCaption()}
function parseVtt(vtt){
 const out=[],lines=vtt.split(/\r?\n/);let i=0;
 while(i<lines.length){if(lines[i].includes('-->')){const [a,b]=lines[i].split('-->');i++;let text='';while(i<lines.length&&lines[i].trim()!==''){text+=(text?' ':'')+lines[i].trim();i++}out.push({start:tc(a),end:tc(b),text})}i++}return out
}
function tc(t){const p=t.trim().replace(',','.').split(':');return Number(p[0])*3600+Number(p[1])*60+Number(p[2])}
function updateCaption(){
 if(!state.captionsEnabled)return;const now=audio.currentTime||0,c=cues.find(x=>now>=x.start&&now<=x.end),el=$('captionOverlay');if(c){el.textContent=c.text;el.classList.remove('hidden')}else{el.textContent='';el.classList.add('hidden')}
}
audio.addEventListener('loadedmetadata',()=>{$('audioTimer').textContent=fmt(audio.currentTime)+' / '+fmt(audio.duration)});
audio.addEventListener('durationchange',()=>{$('audioTimer').textContent=fmt(audio.currentTime)+' / '+fmt(audio.duration)});
audio.addEventListener('timeupdate',()=>{$('audioTimer').textContent=fmt(audio.currentTime)+' / '+fmt(audio.duration);updateCaption()});
audio.addEventListener('play',()=>{$('playBtn').textContent='❚❚ Pause'});
audio.addEventListener('pause',()=>{if(!audio.ended)$('playBtn').textContent='▶ Play'});
audio.addEventListener('ended',()=>{$('playBtn').textContent='▶ Play';$('captionOverlay').classList.add('hidden')});
$('startBtn').onclick=start;$('playBtn').onclick=()=>audio.paused?audio.play().catch(()=>{}):audio.pause();
const accessDialog=$('first30Accessibility');
$('accessibilityBtn').onclick=()=>{syncAccessDialog();accessDialog.showModal()};
$('closeAccessibility').onclick=()=>accessDialog.close();
$('accessAuto').onchange=()=>{access.auto=$('accessAuto').checked;saveAccess()};
$('accessCaptions').onchange=()=>{access.captions=$('accessCaptions').checked;applyAccess();saveAccess();save();updateCaption();syncAccessDialog()};
$('accessLargeText').onchange=()=>{access.large=$('accessLargeText').checked;applyAccess();saveAccess()};
$('accessReduceMotion').onchange=()=>{access.reduce=$('accessReduceMotion').checked;applyAccess();saveAccess()};
accessDialog.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{access.playbackRate=Number(b.dataset.rate)||1;applyAccess();saveAccess();syncAccessDialog()});
audio.addEventListener('loadedmetadata',()=>{audio.playbackRate=Number(access.playbackRate||1)});
const returnPortalBtn=$('returnPortalBtn');if(returnPortalBtn)returnPortalBtn.onclick=()=>{location.href='../?completed=first-day-challenge'};$('replayBtn').onclick=replay;$('ccBtn').onclick=toggleCC;$('continueBtn').onclick=next;$('resetBtn').onclick=reset;$('restartBtn').onclick=()=>{state=cloneInitial();state.started=true;save();$('summaryScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');renderScene();window.scrollTo(0,0)};
applyAccess();syncAccessDialog();if(state.complete)showSummary();else if(state.started){$('introScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');renderScene()}initCloud();
