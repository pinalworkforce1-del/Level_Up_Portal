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

  function readFrameSnapshot(){
    const frame=document.getElementById('experience');
    try{
      const text=(frame?.contentDocument?.body?.innerText||'').replace(/\s+/g,' ').trim();
      if(!text)return {};
      const dayMatch=text.match(/day\s*(\d{1,2})\s*(?:of|\/)?\s*10/i);
      const earningsMatch=text.match(/(?:earnings?|wages?|earned|payday)[^$\d]{0,30}\$?([\d,]+(?:\.\d{1,2})?)[^$\d]{0,20}(?:of|\/|out of)[^$\d]{0,20}\$?([\d,]+(?:\.\d{1,2})?)/i);
      const genericMoneyMatch=text.match(/\$([\d,]+(?:\.\d{1,2})?)\s*(?:of|\/|out of)\s*\$([\d,]+(?:\.\d{1,2})?)/i);
      const money=earningsMatch||genericMoneyMatch;
      return {
        current_day:dayMatch?Number(dayMatch[1]):null,
        earnings_earned:money?Number(money[1].replace(/,/g,'')):null,
        earnings_possible:money?Number(money[2].replace(/,/g,'')):null,
        visible_complete:/quest\s+complete|completed\s+quest|day\s*10\s*(?:complete|completed)/i.test(text)
      };
    }catch(_){
      return {};
    }
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
    const visible=readFrameSnapshot();
    const source={hub,experienceState};

    let day=firstNumber(hub,['day','currentDay','current_day']);
    if(day===null)day=firstNumber(experienceState,['day','currentDay','current_day']);
    if(day===null&&Number.isFinite(Number(visible.current_day)))day=Number(visible.current_day);
    if(day!==null)day=Math.max(1,Math.min(TOTAL_DAYS,Math.round(day)));

    const complete=Boolean(hub.complete||firstValue(experienceState,['complete','isComplete','completed'])===true||visible.visible_complete);
    let earningsEarned=firstNumber(source,['earnings','earningsEarned','earned','wagesEarned','wages_earned','totalEarned','total_earned']);
    let earningsPossible=firstNumber(source,['earningsPossible','possibleEarnings','maxEarnings','maximumEarnings','totalPossibleEarnings','earnings_target','earningsTarget']);
    if(earningsEarned===null&&Number.isFinite(Number(visible.earnings_earned)))earningsEarned=Number(visible.earnings_earned);
    if(earningsPossible===null&&Number.isFinite(Number(visible.earnings_possible)))earningsPossible=Number(visible.earnings_possible);
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
      visible_progress:visible,
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
