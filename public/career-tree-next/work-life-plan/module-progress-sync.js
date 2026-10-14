(() => {
  'use strict';
  const PLAN_KEY='levelup_career_tree_life_plan_v1';
  const LEGACY_KEY='level-up-career-skill-tree-v1';
  const MODULE_ID='work-life-plan';
  let last='';

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
  function normalize(plan){
    return {
      area:plan.area||'',
      county:{key:plan.county||'',label:plan.countyLabel||''},
      housing:{selection:plan.housing||'',monthly:Number(plan.housingMonthly||0)},
      transportation:{selection:plan.transport||'',monthly:Number(plan.transportMonthly||0)},
      monthly_plan:{
        total:Number(plan.monthlyLivingPlan||0),
        housing:Number(plan.housingMonthly||0),
        transportation:Number(plan.transportMonthly||0)
      },
      selected_occupation:plan.job||null,
      selected_wage_level:plan.selectedWageLevel||'',
      target_hourly_wage:Number(plan.targetHourlyGross||0),
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
    const data=normalize(plan);
    const fingerprint=JSON.stringify({data,isComplete,completedAt});
    if(fingerprint===last)return;
    last=fingerprint;
    void window.LevelUpCareerTreeSync?.save(MODULE_ID,data,{isComplete,completedAt});
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
    sync();
  });
  sync();
  setInterval(sync,700);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sync();});
})();
