(() => {
  'use strict';
  const PLAN_KEY='levelup_career_tree_life_plan_v1';
  const LEGACY_KEY='level-up-career-skill-tree-v1';
  const EXPLORE_KEY='level-up-career-tree-next-v1';
  const MODULE_ID='work-life-plan';
  const TAKE_HOME_RATE=0.78;
  const HOURS_PER_MONTH=40*52/12;
  const PENDING_LENS_KEY='levelup_work_life_pending_lens_v1';
  let last='';
  let observer=null;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
  function roundMoney(value){return Math.round((Number(value)||0)*100)/100}
  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function money(value){const n=Number(value);return Number.isFinite(n)?`$${n.toFixed(2)}/hr`:'Not available'}
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

  function exploredCareers(){
    const state=read(EXPLORE_KEY);
    const raw=state?.exploreCareers?.reflections;
    if(!raw||typeof raw!=='object')return [];
    return Object.values(raw)
      .filter(record=>record&&record.code&&record.title&&record.savedAt)
      .sort((a,b)=>String(b.savedAt).localeCompare(String(a.savedAt)))
      .slice(0,5);
  }
  function occupationStep(doc){
    const text=String(doc?.getElementById('stepContent')?.textContent||'').replace(/\s+/g,' ').toUpperCase();
    if(!text.includes('OCCUPATION'))return null;
    const work=doc.getElementById('workLens')?.getAttribute('aria-pressed')==='true';
    const life=doc.getElementById('lifeLens')?.getAttribute('aria-pressed')==='true';
    if(work&&text.includes('STEP 1 OF 5'))return 'work';
    if(life&&text.includes('STEP 4 OF 5'))return 'life';
    return null;
  }
  function targetHourly(doc){
    const text=String(doc?.getElementById('targetWage')?.textContent||'');
    const match=text.match(/\$([\d,.]+(?:\.\d+)?)/);
    return match?Number(match[1].replace(/,/g,''))||0:0;
  }
  function reflectionSignal(record){
    const a=record?.answers||{};
    if(a.picture==='yes')return 'You said you could see yourself doing this work.';
    if(a.picture==='maybe')return 'You said this career might be worth considering.';
    if(a.opportunity==='more')return 'Local opportunity increased your interest.';
    if(record.fitLabel)return record.fitLabel;
    return 'Previously explored in Explore Careers.';
  }
  function ensureExploredStyles(doc){
    if(!doc||doc.getElementById('workLifeExploredStyles'))return;
    const style=doc.createElement('style');
    style.id='workLifeExploredStyles';
    style.textContent=`
      .explored-careers-handoff{margin:14px 0 18px;padding:15px;border:1px solid #477091;border-radius:16px;background:linear-gradient(145deg,#102747,#0a1932)}
      .explored-careers-handoff h3{margin:0 0 5px;font-size:18px}.explored-careers-handoff>p{margin:0 0 12px;color:#b9c9e2;font-size:13px}
      .explored-career-list{display:grid;gap:10px}.explored-career-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;align-items:center;border:1px solid #345276;border-radius:13px;background:#091832;padding:12px 13px}
      .explored-career-card h4{margin:0 0 3px;font-size:15px}.explored-career-meta{color:#9fb3cf;font-size:12px}.explored-career-signal{color:#61e1d0;font-size:12px;font-weight:750;margin-top:4px}
      .explored-career-wages{display:flex;gap:12px;flex-wrap:wrap;margin-top:7px;font-size:12px;color:#c9d8ef}.explored-career-wages b{color:#ffc96b}
      .explored-career-gap{margin-top:7px;font-size:12px;font-weight:800}.explored-career-gap.short{color:#ffd08c}.explored-career-gap.good{color:#8bf0cf}
      .explored-career-action{border:1px solid #4d6d94;background:#132c50;color:#f0f6ff;border-radius:11px;padding:10px 13px;font-weight:850;cursor:pointer;white-space:nowrap}
      @media(max-width:620px){.explored-career-card{grid-template-columns:1fr}.explored-career-action{width:100%}}
    `;
    doc.head.appendChild(style);
  }
  function handoffHtml(records,mode,target){
    const intro=mode==='work'
      ?'These are careers you previously reflected on in Explore Careers. You can compare one here or keep browsing the local options below.'
      :'You already explored these careers. Compare them with the hourly target created by your lifestyle choices, then choose the work direction you want to carry forward.';
    return `<section class="explored-careers-handoff" id="exploredCareersHandoff"><h3>Careers You Already Explored</h3><p>${esc(intro)}</p><div class="explored-career-list">${records.map((record,index)=>{
      const s=record.snapshot||{};
      const entry=Number(s.entryHourly);
      let gap='';
      if(mode==='life'&&target>0&&Number.isFinite(entry)){
        const diff=entry-target;
        gap=diff>=0
          ?`<div class="explored-career-gap good">Entry estimate is $${diff.toFixed(2)}/hr above your lifestyle target.</div>`
          :`<div class="explored-career-gap short">Entry estimate is $${Math.abs(diff).toFixed(2)}/hr below your lifestyle target.</div>`;
      }
      return `<article class="explored-career-card"><div><h4>${esc(record.title)}</h4><div class="explored-career-meta">${esc(record.geographyLabel||'Earlier exploration')} · ${esc(record.code)}</div><div class="explored-career-signal">${esc(reflectionSignal(record))}</div><div class="explored-career-wages"><span>Entry <b>${esc(money(s.entryHourly))}</b></span><span>Typical <b>${esc(money(s.medianHourly))}</b></span><span>Higher-end <b>${esc(money(s.experiencedHourly))}</b></span></div>${gap}</div><button type="button" class="explored-career-action" data-explored-index="${index}">Compare in Work + Life Plan</button></article>`;
    }).join('')}</div></section>`;
  }
  function findOccupationButton(doc,code){
    return [...doc.querySelectorAll('[data-job]')].find(el=>String(el.dataset.job||'')===String(code))||null;
  }
  function selectExploredCareer(doc,record){
    const direct=findOccupationButton(doc,record.code);
    if(direct){direct.click();return;}
    const explorer=doc.getElementById('explorerToggle');
    if(explorer)explorer.click();
    setTimeout(()=>{
      const search=doc.getElementById('jobSearch');
      if(search){
        search.value=record.code||record.title||'';
        const EventCtor=doc.defaultView?.Event||Event;
        search.dispatchEvent(new EventCtor('input',{bubbles:true}));
      }
      setTimeout(()=>{
        const button=findOccupationButton(doc,record.code);
        if(button){button.click();return;}
        doc.defaultView?.alert?.('This career is still saved in Explore Careers, but it is not available in the current county occupation list. Choose another explored career or use Search any occupation.');
      },80);
    },50);
  }
  function injectExploredCareers(doc){
    if(!doc)return;
    const mode=occupationStep(doc);
    const existing=doc.getElementById('exploredCareersHandoff');
    if(!mode){existing?.remove();return;}
    const records=exploredCareers();
    if(!records.length){existing?.remove();return;}
    ensureExploredStyles(doc);
    const target=targetHourly(doc);
    const signature=JSON.stringify({mode,target:mode==='life'?target:0,ids:records.map(r=>`${r.code}:${r.savedAt}`)});
    if(existing?.dataset.signature===signature)return;
    existing?.remove();
    const toolbar=doc.querySelector('.occupation-toolbar');
    const host=doc.getElementById('stepContent');
    if(!host)return;
    const wrap=doc.createElement('div');
    wrap.innerHTML=handoffHtml(records,mode,target);
    const section=wrap.firstElementChild;
    section.dataset.signature=signature;
    if(toolbar)toolbar.insertAdjacentElement('beforebegin',section);else host.prepend(section);
    section.querySelectorAll('[data-explored-index]').forEach(button=>{
      button.addEventListener('click',()=>selectExploredCareer(doc,records[Number(button.dataset.exploredIndex)]));
    });
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
  function enhanceFrame(doc){
    relabelSaveActions(doc);
    injectClearButton(doc);
    injectOpportunityAssumptionNote(doc);
    injectExploredCareers(doc);
  }
  function wireFrame(){
    const frame=document.getElementById('experience');
    if(!frame)return;
    try{
      const win=frame.contentWindow;
      const doc=win?.document;
      enhanceFrame(doc);
      observer?.disconnect();
      if(doc?.body){
        observer=new MutationObserver(()=>enhanceFrame(doc));
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
            setTimeout(()=>enhanceFrame(doc),0);
          }
          const text=buttonText(el).toLowerCase();
          if(text==='save progress'||text==='complete & save my plan')scheduleSync();
          setTimeout(()=>injectExploredCareers(doc),0);
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
  window.addEventListener('storage',()=>{sync();try{injectExploredCareers(document.getElementById('experience')?.contentWindow?.document)}catch(_){}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sync();});
})();
