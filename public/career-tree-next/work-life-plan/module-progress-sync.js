(() => {
  'use strict';
  const PLAN_KEY='levelup_career_tree_life_plan_v1';
  const LEGACY_KEY='level-up-career-skill-tree-v1';
  const MODULE_ID='work-life-plan';
  const TAKE_HOME_RATE=0.78;
  const HOURS_PER_MONTH=40*52/12;
  const PENDING_LENS_KEY='levelup_work_life_pending_lens_v1';
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
      pathway:plan.lens||'',
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

  function hasModuleProgress(){
    const plan=read(PLAN_KEY);
    const legacy=read(LEGACY_KEY);
    return Boolean(plan?.savedAt||legacy.lifePlan||legacy.tree?.lifePlan||legacy.tree?.complete);
  }
  function currentLens(doc){
    const plan=read(PLAN_KEY);
    if(plan?.lens)return plan.lens;
    if(doc?.getElementById('workLens')?.getAttribute('aria-pressed')==='true')return 'work';
    if(doc?.getElementById('lifeLens')?.getAttribute('aria-pressed')==='true')return 'life';
    return '';
  }
  function clearLocalModule(){
    localStorage.removeItem(PLAN_KEY);
    const legacy=read(LEGACY_KEY);
    if(legacy&&typeof legacy==='object'){
      delete legacy.lifePlan;
      if(legacy.tree&&typeof legacy.tree==='object'){
        delete legacy.tree.lifePlan;
        delete legacy.tree.complete;
        delete legacy.tree.completedAt;
      }
      localStorage.setItem(LEGACY_KEY,JSON.stringify(legacy));
    }
    last='';
  }
  async function resetModule(nextLens=''){
    const now=new Date().toISOString();
    clearLocalModule();
    if(nextLens)sessionStorage.setItem(PENDING_LENS_KEY,nextLens);
    else sessionStorage.removeItem(PENDING_LENS_KEY);
    await window.LevelUpCareerTreeSync?.save(MODULE_ID,{
      progress:{status:'not_started',activity_complete:false},
      pathway:nextLens||'',
      reset_at:now
    },{xp:0,isComplete:false,completedAt:null,updatedAt:now});
    const frame=document.getElementById('experience');
    frame?.contentWindow?.location.reload();
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
  function injectOpportunityAssumptionNote(doc){
    if(!doc)return;
    const workActive=doc.getElementById('workLens')?.getAttribute('aria-pressed')==='true';
    let note=doc.getElementById('opportunityAssumptionNote');
    if(!workActive){
      note?.remove();
      return;
    }
    if(note)return;
    const description=doc.getElementById('lensDescription');
    if(!description)return;
    note=doc.createElement('div');
    note.id='opportunityAssumptionNote';
    note.setAttribute('role','note');
    note.style.cssText='margin:0 0 14px;padding:10px 13px;border-left:3px solid #ffc96b;border-radius:8px;background:#0a1831;color:#d2ddf2;font-size:13px;line-height:1.45';
    note.innerHTML='<strong style="color:#ffc96b">Planning note:</strong> Some life-related expenses are estimated to give you a starting point. You can adjust housing, transportation, and budget choices based on your personal preferences and goals as this activity progresses.';
    description.insertAdjacentElement('afterend',note);
  }
  function injectClearButton(doc){
    const tools=doc?.querySelector('.topline-tools');
    if(!tools||doc.getElementById('careerTreeClearModule'))return;
    const button=doc.createElement('button');
    button.id='careerTreeClearModule';
    button.type='button';
    button.textContent='Clear Module / Start Over';
    button.style.cssText='border:1px solid #704c61;background:#331e36;color:#ffe8ef;border-radius:999px;padding:8px 12px;font:inherit;font-size:13px;font-weight:800;cursor:pointer';
    button.addEventListener('click',async()=>{
      if(!hasModuleProgress())return;
      const ok=window.confirm('Clear Work + Life Plan and start over? This will remove all responses in this module. Your Discover Me, Explore Careers, Career Quest, and core Level Up progress will not be affected.');
      if(ok)await resetModule('');
    });
    tools.insertBefore(button,tools.lastElementChild||null);
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
      injectClearButton(doc);
      injectOpportunityAssumptionNote(doc);
      observer?.disconnect();
      if(doc?.body){
        observer=new MutationObserver(()=>{
          relabelSaveActions(doc);
          injectClearButton(doc);
          injectOpportunityAssumptionNote(doc);
        });
        observer.observe(doc.body,{childList:true,subtree:true});
        doc.addEventListener('click',event=>{
          const el=event.target?.closest?.('button,input[type="button"],input[type="submit"],a');
          if(!el)return;
          const targetLens=el.id==='lifeLens'?'life':el.id==='workLens'?'work':'';
          if(targetLens){
            const active=currentLens(doc);
            if(hasModuleProgress()&&active&&targetLens!==active){
              event.preventDefault();
              event.stopImmediatePropagation();
              const fromLabel=active==='life'?'Life I want':'Available opportunities';
              const toLabel=targetLens==='life'?'Life I want':'Available opportunities';
              const ok=window.confirm(`Switch pathways? You are currently using “${fromLabel}”. Switching to “${toLabel}” will clear all responses in Work + Life Plan and start this module over. Your other Career Tree activities will not be affected.`);
              if(ok)void resetModule(targetLens);
              return;
            }
            setTimeout(()=>injectOpportunityAssumptionNote(doc),0);
          }
          const text=buttonText(el).toLowerCase();
          if(text==='save progress'||text==='complete & save my plan')scheduleSync();
        },true);
      }
      win?.addEventListener('career-tree-life-plan-updated',scheduleSync);

      const pending=sessionStorage.getItem(PENDING_LENS_KEY);
      if(pending){
        sessionStorage.removeItem(PENDING_LENS_KEY);
        setTimeout(()=>doc.getElementById(pending==='work'?'workLens':'lifeLens')?.click(),50);
      }
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
