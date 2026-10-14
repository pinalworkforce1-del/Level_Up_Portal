(() => {
  'use strict';
  const PLAN_KEY='levelup_career_tree_life_plan_v1';
  const LEGACY_KEY='level-up-career-skill-tree-v1';
  const MODULE_ID='work-life-plan';
  const TAKE_HOME_RATE=0.78;
  const HOURS_PER_MONTH=40*52/12;
  let last='';
  let observer=null;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
  function roundMoney(value){return Math.round((Number(value)||0)*100)/100}
  function selectedHourly(plan){
    const job=plan.job||{};
    switch(plan.selectedWageLevel){
      case 'median': return Number(job.medianHourly||0);
      case 'experienced': return Number(job.experiencedHourly||0);
      case 'entry':
      default: return Number(job.entryHourly||0);
    }
  }
  function normalize(plan,isComplete){
    const monthlyPlan=Number(plan.monthlyLivingPlan||0);
    const hourly=selectedHourly(plan);
    const estimatedTakeHome=hourly>0?roundMoney(hourly*HOURS_PER_MONTH*TAKE_HOME_RATE):0;
    const monthlyGap=roundMoney(monthlyPlan-estimatedTakeHome);
    const gapStatus=monthlyGap>0.5?'shortfall':monthlyGap<-0.5?'surplus':'meets';
    return {
      progress:{status:isComplete?'complete':'in_progress',activity_complete:Boolean(isComplete)},
      area:plan.area||'',
      county:{key:plan.county||'',label:plan.countyLabel||''},
      housing:{selection:plan.housing||'',monthly:Number(plan.housingMonthly||0)},
      transportation:{selection:plan.transport||'',monthly:Number(plan.transportMonthly||0)},
      monthly_plan:{
        total:monthlyPlan,
        housing:Number(plan.housingMonthly||0),
        transportation:Number(plan.transportMonthly||0)
      },
      selected_occupation:plan.job||null,
      selected_wage_level:plan.selectedWageLevel||'',
      target_hourly_wage:Number(plan.targetHourlyGross||0),
      affordability:{
        selected_hourly_wage:hourly,
        estimated_take_home_monthly:estimatedTakeHome,
        monthly_gap:monthlyGap,
        gap_status:gapStatus,
        annual_gap_equivalent:roundMoney(monthlyGap*12),
        take_home_rate_assumption:TAKE_HOME_RATE
      },
      reflections:plan.reflection||{},
      saved_at:plan.savedAt||null
    };
  }
  function sync(){
    const plan=read(PLAN_KEY);
    if(!plan?.savedAt)return;
    const legacy=read(LEGACY_KEY);
    const isComplete=Boolean(legacy.tree?.complete);
    const completedAt=isComplete?(legacy.tree?.completedAt||plan.savedAt):null;
    const data=normalize(plan,isComplete);
    const fingerprint=JSON.stringify({data,isComplete,completedAt});
    if(fingerprint===last)return;
    last=fingerprint;
    void window.LevelUpCareerTreeSync?.save(MODULE_ID,data,{xp:0,isComplete,completedAt});
  }

  function buttonText(el){return String(el?.textContent||el?.value||'').trim().replace(/\s+/g,' ')}
  function setButtonText(el,text){
    if(!el)return;
    if(el.tagName==='INPUT')el.value=text;
    else el.textContent=text;
    el.setAttribute('aria-label',text);
    el.setAttribute('title',text);
  }
  function relabelSaveActions(doc){
    if(!doc)return;
    doc.querySelectorAll('button,input[type="button"],input[type="submit"],a').forEach(el=>{
      const text=buttonText(el).toLowerCase();
      if(text==='save this plan')setButtonText(el,'Save progress');
      if(text==='save my plan')setButtonText(el,'Complete & Save My Plan');
    });
  }
  function scheduleSync(){
    sync();
    setTimeout(sync,100);
    setTimeout(sync,500);
  }
  function wireFrame(){
    const frame=document.getElementById('experience');
    if(!frame)return;
    try{
      const win=frame.contentWindow;
      const doc=win?.document;
      relabelSaveActions(doc);
      observer?.disconnect();
      if(doc?.body){
        observer=new MutationObserver(()=>relabelSaveActions(doc));
        observer.observe(doc.body,{childList:true,subtree:true});
        doc.addEventListener('click',event=>{
          const el=event.target?.closest?.('button,input[type="button"],input[type="submit"],a');
          const text=buttonText(el).toLowerCase();
          if(text==='save progress'||text==='complete & save my plan')scheduleSync();
        },true);
      }
      win?.addEventListener('career-tree-life-plan-updated',scheduleSync);
    }catch(_){}
  }

  const frame=document.getElementById('experience');
  frame?.addEventListener('load',()=>{
    try{
      const path=frame.contentWindow?.location?.pathname||'';
      if(path&&!path.endsWith('/career-skill-tree/life-plan-completion.html')){
        window.location.href='../';
        return;
      }
    }catch(_){}
    wireFrame();
    scheduleSync();
  });
  wireFrame();
  sync();
  setInterval(sync,700);
  window.addEventListener('storage',sync);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sync();});
})();
