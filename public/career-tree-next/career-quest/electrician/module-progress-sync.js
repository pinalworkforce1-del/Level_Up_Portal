(() => {
  'use strict';

  const MODULE_ID='career-quest:electrician';
  const HUB_KEY='level-up-career-quest-hub-v1';
  const TOTAL_DAYS=10;
  let last='';

  function parse(raw){
    try{return JSON.parse(raw)}catch{return null}
  }

  function readHub(){
    const hub=parse(localStorage.getItem(HUB_KEY)||'{}')||{};
    return hub.electrician&&typeof hub.electrician==='object'?hub.electrician:{};
  }

  function collectQuestState(){
    const state={};
    for(let i=0;i<localStorage.length;i+=1){
      const key=localStorage.key(i);
      if(!key||key==='sb-dnijrzotfyvmmnmueknk-auth-token')continue;
      if(!/(career.?quest|electrician|jobsite)/i.test(key))continue;
      const raw=localStorage.getItem(key);
      if(raw==null||raw.length>150000)continue;
      const parsed=parse(raw);
      state[key]=parsed===null?raw:parsed;
    }
    return state;
  }

  function firstNumber(source,names){
    if(!source||typeof source!=='object')return null;
    for(const name of names){
      const value=source[name];
      if(value!==''&&value!==null&&value!==undefined&&Number.isFinite(Number(value)))return Number(value);
    }
    for(const value of Object.values(source)){
      if(value&&typeof value==='object'){
        const found=firstNumber(value,names);
        if(found!==null)return found;
      }
    }
    return null;
  }

  function firstValue(source,names){
    if(!source||typeof source!=='object')return null;
    for(const name of names){
      if(source[name]!==undefined&&source[name]!==null&&source[name]!=='')return source[name];
    }
    for(const value of Object.values(source)){
      if(value&&typeof value==='object'){
        const found=firstValue(value,names);
        if(found!==null)return found;
      }
    }
    return null;
  }

  function normalize(){
    const hub=readHub();
    const experienceState=collectQuestState();
    const source={hub,experienceState};

    let day=firstNumber(hub,['day','currentDay','current_day']);
    if(day===null)day=firstNumber(experienceState,['day','currentDay','current_day']);
    if(day!==null)day=Math.max(1,Math.min(TOTAL_DAYS,Math.round(day)));

    const complete=Boolean(hub.complete||firstValue(experienceState,['complete','isComplete','completed'])===true);
    const earningsEarned=firstNumber(source,['earnings','earningsEarned','earned','wagesEarned','wages_earned','totalEarned','total_earned']);
    const earningsPossible=firstNumber(source,['earningsPossible','possibleEarnings','maxEarnings','maximumEarnings','totalPossibleEarnings','earnings_target','earningsTarget']);
    const completedDays=complete?TOTAL_DAYS:(day?Math.max(0,day-1):0);
    const completedAt=firstValue(source,['completedAt','completed_at','completionTimestamp','completion_timestamp']);

    return {
      progress:{
        status:complete?'complete':(day?'in_progress':'not_started'),
        current_day:day,
        completed_days:completedDays,
        total_days:TOTAL_DAYS,
        earnings_earned:earningsEarned,
        earnings_possible:earningsPossible
      },
      occupation:{key:'electrician',label:'Electrician'},
      quest_state:hub,
      experience_state:experienceState,
      completion_timestamp:complete?(completedAt||null):null
    };
  }

  function sync(){
    const data=normalize();
    const isComplete=data.progress.status==='complete';
    const fingerprint=JSON.stringify({data,isComplete});
    if(fingerprint===last)return;
    last=fingerprint;
    void window.LevelUpCareerTreeSync?.save(MODULE_ID,data,{
      xp:0,
      isComplete,
      completedAt:isComplete?(data.completion_timestamp||new Date().toISOString()):null
    });
  }

  const frame=document.getElementById('experience');
  frame?.addEventListener('load',()=>{
    try{
      const path=frame.contentWindow?.location?.pathname||'';
      if(path&&!/\/career-skill-tree\/career-quest\/electrician\/?(?:index\.html)?$/.test(path)){
        window.location.href='../../';
        return;
      }
    }catch(_){}
    sync();
  });

  sync();
  setInterval(sync,700);
  window.addEventListener('storage',sync);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sync();});
})();
