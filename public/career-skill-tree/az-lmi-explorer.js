(() => {
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const GEO_KEY='level-up-career-tree-geography-v1';
  const DATA_URL='data/lightcast-lmi.json';
  const MAX_SAVED=5;
  let lmiData=null;
  let occupations=[];
  let state=null;
  let mode='available';
  let query='';
  let activeIndex=0;

  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
  function writeState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(err){console.warn('Career Tree LMI progress could not be saved.',err)}}
  function ensureState(){
    state=readState();
    state.alignment=state.alignment||{};
    state.alignment.selected=Array.isArray(state.alignment.selected)?state.alignment.selected:[];
    state.lmi=state.lmi||{};
    state.lmi.evidence=state.lmi.evidence||{};
    state.lmi.explorer=state.lmi.explorer||{};
    state.lmi.explorer.saved=Array.isArray(state.lmi.explorer.saved)?state.lmi.explorer.saved:[];
    state.lmi.explorer.viewed=Array.isArray(state.lmi.explorer.viewed)?state.lmi.explorer.viewed:[];
  }

  function getOcc(code){const row=lmiData?.catalog?.[code]||{};return {code,title:row.title||code,interests:Array.isArray(row.interests)?row.interests:[]}}
  function codeByTitle(title){const t=String(title||'').trim().toLowerCase();return occupations.find(o=>o.title.trim().toLowerCase()===t)?.code||''}
  function metric(code,geo){return lmiData?.geographies?.[geo]?.occupations?.[code]||{}}
  function represented(code,geo){const m=metric(code,geo);return [m.employment,m.annualOpenings,m.recentHires].some(v=>Number(v)>0)}
  function fmtNumber(v){const n=Number(v);return Number.isFinite(n)?Math.round(n).toLocaleString():'Not available'}
  function fmtWage(v){const n=Number(v);return Number.isFinite(n)?`$${n.toFixed(2)}/hr`:'Not available'}
  function fmtGrowth(v){const n=Number(v);return Number.isFinite(n)?`${n>0?'+':''}${n.toFixed(1)}%`:'Not available'}
  function prepSummary(m){const e=String(m.typicalEducation||'').trim(),o=String(m.typicalOjt||'').trim();return [e,o&&o!=='None'?o:''].filter(Boolean).join(' + ')||'Preparation varies'}
  function prepRank(m){
    const e=String(m.typicalEducation||'').toLowerCase(),o=String(m.typicalOjt||'').toLowerCase();
    const er=/no formal/.test(e)?0:/high school|secondary school/.test(e)?1:/postsecondary nondegree|certificate/.test(e)?2:/some college/.test(e)?3:/associate/.test(e)?4:/bachelor/.test(e)?5:/master/.test(e)?6:/doctoral|professional degree/.test(e)?7:4;
    const or=!o||o==='none'?0:/short-term/.test(o)?.2:/moderate-term/.test(o)?.5:/long-term|apprentice/.test(o)?1:.4;
    return er+or;
  }
  function currentGeo(){
    const keyed=String(localStorage.getItem(GEO_KEY)||'').trim();
    if(keyed&&lmiData?.geographies?.[keyed])return keyed;
    const saved=state.alignment?.geography||state.lmi?.explorer?.geography||'';
    if(saved&&lmiData?.geographies?.[saved])return saved;
    return Object.keys(lmiData?.geographies||{})[0]||'';
  }
  function geoLabel(geo){return lmiData?.geographies?.[geo]?.label||geo}
  function directVideoUrl(code){return `https://cdn.careeronestop.org/OccVids/OccupationVideos/${encodeURIComponent(code)}.00.mp4`}
  function careerOneStopProfileUrl(code,title){const onet=String(code||'').replace(/\D/g,'')+'00';return `https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=${encodeURIComponent(title)}&lang=en&location=US&onetcode=${encodeURIComponent(onet)}`}
  function onetUrl(code){return `https://www.onetonline.org/link/summary/${encodeURIComponent(code)}`}

  function explorationFor(title){
    const e=state.lmi.evidence[title]||{};
    e.exploration=e.exploration||{pay:'',opportunity:'',preparation:'',picture:'',reason:'',videoOpened:false,complete:false,completedAt:null};
    state.lmi.evidence[title]=e;
    return e.exploration;
  }
  function explorationComplete(ex={}){return Boolean(ex.pay&&ex.opportunity&&ex.preparation&&ex.picture&&String(ex.reason||'').trim().length>=12)}
  function evidenceFor(code,geo,existing={}){
    const m=metric(code,geo),g=lmiData.geographies[geo]||{};
    return {...existing,soc:code,geography:geo,geographyLabel:g.label||geo,employment:fmtNumber(m.employment),entry:fmtWage(m.entryHourly),median:fmtWage(m.medianHourly),average:fmtWage(m.averageHourly),experienced:fmtWage(m.experiencedHourly),outlook:`${fmtGrowth(m.growthPct)} growth • ${g.projectionPeriod||lmiData.projectionPeriod||'2026–2035'}`,openings:fmtNumber(m.annualOpenings),recentHires:fmtNumber(m.recentHires),prep:prepSummary(m),education:m.typicalEducation||'Not available',ojt:m.typicalOjt||'Not available',workExperience:m.workExperience||'Not available',source:g.sourceLabel||`Lightcast ${lmiData.datarun||''} • ${g.label||geo}`,takeaway:existing.takeaway||'',exploration:existing.exploration||{pay:'',opportunity:'',preparation:'',picture:'',reason:'',videoOpened:false,complete:false,completedAt:null}};
  }
  function syncEvidence(){
    const geo=currentGeo();
    state.alignment.geography=geo;
    state.alignment.geographyLabel=geoLabel(geo);
    state.lmi.explorer.geography=geo;
    state.alignment.selected.forEach(title=>{const code=codeByTitle(title);if(code)state.lmi.evidence[title]=evidenceFor(code,geo,state.lmi.evidence[title]||{})});
  }
  function carriedCodes(){const geo=currentGeo();return state.alignment.selected.map(codeByTitle).filter(Boolean).filter(code=>represented(code,geo)).slice(0,MAX_SAVED)}
  function availableCodes(){
    const geo=currentGeo();
    return occupations.map(o=>o.code).filter(code=>represented(code,geo)).sort((a,b)=>Number(metric(b,geo).annualOpenings||0)-Number(metric(a,geo).annualOpenings||0)||Number(metric(b,geo).employment||0)-Number(metric(a,geo).employment||0)||getOcc(a).title.localeCompare(getOcc(b).title));
  }

  function dashboard(){
    const geo=currentGeo(),codes=carriedCodes();
    if(!codes.length)return'';
    const max=field=>codes.reduce((best,code)=>Number(metric(code,geo)[field]||0)>Number(metric(best,geo)[field]||0)?code:best,codes[0]);
    const lower=max('entryHourly'),higher=max('experiencedHourly'),open=max('annualOpenings'),growth=max('growthPct'),short=codes.reduce((best,code)=>prepRank(metric(code,geo))<prepRank(metric(best,geo))?code:best,codes[0]);
    const items=[
      ['Highest lower wage range',lower,fmtWage(metric(lower,geo).entryHourly)],
      ['Most earnings potential',higher,fmtWage(metric(higher,geo).experiencedHourly)],
      ['Most local openings',open,`${fmtNumber(metric(open,geo).annualOpenings)} / year`],
      ['Shortest typical preparation',short,prepSummary(metric(short,geo))],
      ['Fastest projected growth',growth,fmtGrowth(metric(growth,geo).growthPct)]
    ];
    return `<section class="lmi-dashboard"><div class="lmi-dashboard-head"><div><span class="eyebrow">QUICK COMPARISON</span><h3>What stands out across your careers?</h3></div><span>${esc(geoLabel(geo))}</span></div><div class="lmi-dashboard-grid">${items.map(([label,code,value])=>`<article><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(getOcc(code).title)}</span></article>`).join('')}</div></section>`;
  }

  function answerButtons(field,value,options){return `<div class="lmi-answer-row">${options.map(([v,label])=>`<button type="button" class="lmi-answer ${value===v?'selected':''}" data-answer-field="${esc(field)}" data-answer-value="${esc(v)}">${esc(label)}</button>`).join('')}</div>`}

  function workspace(code,index,total){
    const geo=currentGeo(),o=getOcc(code),m=metric(code,geo),g=lmiData.geographies[geo]||{};
    state.lmi.evidence[o.title]=evidenceFor(code,geo,state.lmi.evidence[o.title]||{});
    const ex=explorationFor(o.title),complete=explorationComplete(ex);
    const completedCount=state.alignment.selected.filter(t=>explorationComplete(state.lmi.evidence[t]?.exploration||{})).length;
    return `<section class="lmi-workspace" data-active-code="${esc(code)}">
      <div class="lmi-workspace-status"><div><span class="eyebrow">CAREER ${index+1} OF ${total}</span><strong>${complete?'Explored ✓':'Exploration in progress'}</strong></div><span>${completedCount} explored</span></div>
      <div class="lmi-workspace-grid">
        <article class="lmi-data-card">
          <div class="lmi-title"><div><span class="eyebrow">${esc(g.label||geo)} • LIGHTCAST</span><h2>${esc(o.title)}</h2><p>${esc(code)}</p></div><div class="lmi-inline-employment"><small>Local employment</small><strong>${esc(fmtNumber(m.employment))}</strong></div></div>
          <div class="lmi-metrics">
            <div><small>Lower wage range</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div><div><small>Typical / median wage</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div><div><small>Higher wage range</small><strong>${esc(fmtWage(m.experiencedHourly))}</strong></div><div><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div><div><small>Projected growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div><div><small>Recent hires</small><strong>${esc(fmtNumber(m.recentHires))}</strong></div>
          </div>
          <p class="lmi-wage-note">Wage ranges show lower, middle, and higher points in the local wage distribution. They are not guaranteed starting or future pay.</p>
          <div class="lmi-prep"><span class="eyebrow">TYPICAL PREPARATION</span><div><b>Entry education</b><span>${esc(m.typicalEducation||'Not available')}</span></div><div><b>Work experience</b><span>${esc(m.workExperience||'None reported')}</span></div><div><b>On-the-job training</b><span>${esc(m.typicalOjt||'None reported')}</span></div></div>
          <div class="lmi-links"><a href="${esc(directVideoUrl(code))}" target="_blank" rel="noopener noreferrer" data-video-code="${esc(code)}">▶ Watch CareerOneStop career video ↗</a><a href="${esc(onetUrl(code))}" target="_blank" rel="noopener noreferrer">View O*NET occupation profile ↗</a></div>
          <div class="lmi-link-note">${ex.videoOpened?'Career video opened ✓':'Career video is recommended before Question 4.'} <a href="${esc(careerOneStopProfileUrl(code,o.title))}" target="_blank" rel="noopener noreferrer">CareerOneStop occupation profile ↗</a></div>
          <div class="az-source">${esc(g.sourceLabel||'Lightcast')} • projection period ${esc(g.projectionPeriod||lmiData.projectionPeriod||'2026–2035')}</div>
        </article>
        <article class="lmi-question-card">
          <span class="eyebrow">EXPLORE • DON'T JUST LOOK</span><h2>What does this evidence mean for you?</h2><p>Use the data and career video to decide whether this occupation deserves to stay on your Career Tree.</p>
          <div class="lmi-question"><b>1. Does the local pay range work for what you need or want right now?</b><small>Lower ${esc(fmtWage(m.entryHourly))} • Typical/median ${esc(fmtWage(m.medianHourly))} • Higher ${esc(fmtWage(m.experiencedHourly))}</small>${answerButtons('pay',ex.pay,[['yes','Yes'],['maybe','Maybe'],['no','No']])}</div>
          <div class="lmi-question"><b>2. Does the local opportunity level make you comfortable continuing to explore this career?</b><small>${esc(fmtNumber(m.employment))} local jobs • ${esc(fmtNumber(m.annualOpenings))} annual openings</small>${answerButtons('opportunity',ex.opportunity,[['strong','Strong opportunity'],['enough','Enough to keep exploring'],['concern','Concerned']])}</div>
          <div class="lmi-question"><b>3. Does the typical preparation feel realistic for you?</b><small>${esc(prepSummary(m))}</small>${answerButtons('preparation',ex.preparation,[['yes','Yes'],['maybe','Maybe'],['no','No']])}</div>
          <div class="lmi-question"><b>4. After learning what the work is actually like, can you picture yourself doing it?</b><small>The CareerOneStop video can help you answer this one.</small>${answerButtons('picture',ex.picture,[['yes','Yes'],['maybe','Maybe'],['no','No']])}</div>
          <label class="lmi-reason"><b>5. What is the biggest reason you would keep—or remove—this career from consideration?</b><textarea id="lmiReason" placeholder="Example: The pay and apprenticeship path work for me, but I want to know more about the schedule.">${esc(ex.reason||'')}</textarea><small id="lmiReasonStatus">${String(ex.reason||'').trim().length>=12?'Saved ✓':'Write at least a short sentence.'}</small></label>
          <div class="lmi-complete ${complete?'complete':''}" id="lmiCompleteStatus">${complete?'✓ Career explored':'Complete all five questions to mark this career explored.'}</div>
        </article>
      </div>
      <div class="lmi-nav"><button type="button" data-nav="prev" class="secondary-btn" ${index===0?'disabled':''}>← Previous Career</button><span>${index+1} of ${total}</span><button type="button" data-nav="next" class="primary-btn" ${index>=total-1||!complete?'disabled':''}>${index>=total-1?'Last Career':'Explore Next Career →'}</button></div>
    </section>`;
  }

  function availableBrowser(){
    const geo=currentGeo(),saved=new Set(state.alignment.selected),q=query.trim().toLowerCase();
    let codes=availableCodes();
    if(q)codes=codes.filter(code=>`${getOcc(code).title} ${code}`.toLowerCase().includes(q));
    codes=codes.slice(0,60);
    return `<section class="lmi-available"><div class="az-lmi-results-head"><h3>Occupations represented in ${esc(geoLabel(geo))}</h3><span>${codes.length} shown • ranked by local openings</span></div><div class="lmi-search"><input id="lmiSearch" value="${esc(query)}" placeholder="Search occupation or SOC"></div><div class="lmi-local-grid">${codes.map(code=>{const o=getOcc(code),m=metric(code,geo),inSet=saved.has(o.title);return `<article class="az-occ-card ${inSet?'saved':''}"><div class="az-occ-code"><span>${esc(code)}</span><span>${esc(fmtNumber(m.annualOpenings))} openings</span></div><h4>${esc(o.title)}</h4><p>Lower wage range ${esc(fmtWage(m.entryHourly))} • Typical/median ${esc(fmtWage(m.medianHourly))} • ${esc(fmtGrowth(m.growthPct))} growth</p><div class="az-occ-actions"><a class="az-preview" href="${esc(directVideoUrl(code))}" target="_blank" rel="noopener noreferrer">Career video ↗</a><button class="az-save ${inSet?'saved':''}" type="button" data-add-code="${esc(code)}">${inSet?'✓ In my careers':'Add to my careers'}</button></div></article>`}).join('')}</div></section>`;
  }

  function updateQuestionUi(code){
    const o=getOcc(code),ex=explorationFor(o.title),complete=explorationComplete(ex);
    const status=$('#lmiCompleteStatus'),next=document.querySelector('[data-nav="next"]');
    if(status){status.classList.toggle('complete',complete);status.textContent=complete?'✓ Career explored':'Complete all five questions to mark this career explored.'}
    if(next&&activeIndex<carriedCodes().length-1)next.disabled=!complete;
    const reasonStatus=$('#lmiReasonStatus');if(reasonStatus)reasonStatus.textContent=String(ex.reason||'').trim().length>=12?'Saved ✓':'Write at least a short sentence.';
  }

  function render(){
    const host=$('#azLmiExplorer');if(!host||!lmiData)return;
    ensureState();syncEvidence();writeState();
    const geo=currentGeo(),codes=carriedCodes();
    if(activeIndex>=codes.length)activeIndex=Math.max(0,codes.length-1);
    const explored=state.alignment.selected.filter(t=>explorationComplete(state.lmi.evidence[t]?.exploration||{})).length;
    const required=Math.min(3,codes.length);
    if(!codes.length)mode='available';
    host.innerHTML=`<div class="az-lmi-head"><div><span class="eyebrow">STAGE 3 • LMI LAB</span><h2>Investigate careers. Build evidence. Decide what stays.</h2><p>Explore occupations represented in your chosen labor market, select up to five, and investigate the evidence behind each choice.</p></div><div class="az-lmi-xp">${explored} explored • 200 XP</div></div>
      <div class="lmi-context"><span>📍 Labor market: <strong>${esc(geoLabel(geo))}</strong></span><button type="button" id="lmiChangeGeo">Change in Career Alignment</button></div>
      ${dashboard()}
      <div class="az-lmi-controls lmi-modebar"><div class="az-lmi-control"><span class="label">LMI Lab</span><div class="az-lmi-mode-row"><button class="az-lmi-mode ${mode==='carried'?'active':''}" type="button" data-mode="carried">Explore My Careers (${codes.length})</button><button class="az-lmi-mode ${mode==='available'?'active':''}" type="button" data-mode="available">Browse Available in ${esc(geoLabel(geo))}</button></div></div><div class="az-lmi-control lmi-progress"><span>Exploration progress</span><strong>${explored} of ${codes.length}</strong><small>${required?`Explore at least ${required} ${required===1?'career':'careers'} to continue.`:'Add careers to begin exploring.'}</small></div></div>
      <div class="az-lmi-saved"><div class="az-lmi-saved-head"><strong>My careers</strong><span>${state.alignment.selected.length} / ${MAX_SAVED}</span></div><div class="az-lmi-saved-list">${state.alignment.selected.length?state.alignment.selected.map(title=>`<span class="az-lmi-chip ${explorationComplete(state.lmi.evidence[title]?.exploration||{})?'explored':''}">${explorationComplete(state.lmi.evidence[title]?.exploration||{})?'✓ ':''}${esc(title)}<button type="button" data-remove-title="${esc(title)}" aria-label="Remove ${esc(title)}">×</button></span>`).join(''):'<span style="color:#9fb0ca">No careers carried forward yet.</span>'}</div></div>
      ${mode==='carried'?(codes.length?workspace(codes[activeIndex],activeIndex,codes.length):'<div class="lmi-empty"><strong>No careers selected yet.</strong><p>Browse locally represented occupations to choose careers for exploration.</p></div>'):availableBrowser()}
      <div class="lmi-gate ${required&&explored>=required?'ready':''}"><span class="eyebrow">LMI LAB PROGRESS</span><strong>${required&&explored>=required?'Exploration requirement met ✓':`${explored} of ${required||3} required careers explored`}</strong><p>${required&&explored>=required?'You have enough completed exploration to move forward. You can keep exploring or continue when ready.':'Complete all five questions for the required careers before moving to the Work + Life Simulator.'}</p></div>`;
    const continueBtn=$('#lmiContinue');
    if(continueBtn){continueBtn.textContent='Continue to Work + Life Simulator →';continueBtn.disabled=!(required&&explored>=required)}
  }

  function handleClick(event){
    const host=$('#azLmiExplorer');if(!host||!host.contains(event.target))return;
    const modeBtn=event.target.closest('[data-mode]');
    if(modeBtn){mode=modeBtn.dataset.mode;query='';activeIndex=0;render();return}
    const answer=event.target.closest('[data-answer-field]');
    if(answer){
      const code=host.querySelector('.lmi-workspace')?.dataset.activeCode;if(!code)return;
      const o=getOcc(code);state.lmi.evidence[o.title]=evidenceFor(code,currentGeo(),state.lmi.evidence[o.title]||{});
      const ex=explorationFor(o.title);ex[answer.dataset.answerField]=answer.dataset.answerValue;ex.complete=explorationComplete(ex);if(ex.complete&&!ex.completedAt)ex.completedAt=new Date().toISOString();writeState();render();return;
    }
    const nav=event.target.closest('[data-nav]');
    if(nav){activeIndex=Math.max(0,Math.min(carriedCodes().length-1,activeIndex+(nav.dataset.nav==='next'?1:-1)));render();host.scrollIntoView({behavior:'smooth',block:'start'});return}
    const add=event.target.closest('[data-add-code]');
    if(add){const code=add.dataset.addCode,o=getOcc(code);if(!state.alignment.selected.includes(o.title)){if(state.alignment.selected.length>=MAX_SAVED){alert('Keep Career Tree focused: save up to five careers.');return}state.alignment.selected.push(o.title)}state.lmi.evidence[o.title]=evidenceFor(code,currentGeo(),state.lmi.evidence[o.title]||{});writeState();mode='carried';activeIndex=Math.max(0,carriedCodes().indexOf(code));render();return}
    const remove=event.target.closest('[data-remove-title]');
    if(remove){const title=remove.dataset.removeTitle;state.alignment.selected=state.alignment.selected.filter(t=>t!==title);state.lmi.explorer.saved=(state.lmi.explorer.saved||[]).filter(t=>t!==title);delete state.lmi.evidence[title];writeState();activeIndex=0;render();return}
    const video=event.target.closest('[data-video-code]');
    if(video){const code=video.dataset.videoCode,o=getOcc(code),ex=explorationFor(o.title);ex.videoOpened=true;writeState();}
    if(event.target.id==='lmiChangeGeo'){location.hash='#alignment';}
  }

  function handleInput(event){
    const host=$('#azLmiExplorer');if(!host||!host.contains(event.target))return;
    if(event.target.id==='lmiSearch'){query=event.target.value;render();return}
    if(event.target.id==='lmiReason'){
      const code=host.querySelector('.lmi-workspace')?.dataset.activeCode;if(!code)return;
      const o=getOcc(code),ex=explorationFor(o.title);ex.reason=event.target.value;ex.complete=explorationComplete(ex);if(ex.complete&&!ex.completedAt)ex.completedAt=new Date().toISOString();if(!ex.complete)ex.completedAt=null;state.lmi.evidence[o.title].takeaway=String(ex.reason||'').trim();writeState();updateQuestionUi(code);
    }
  }

  function addStyles(){
    if($('#guided-lmi-styles'))return;
    const style=document.createElement('style');style.id='guided-lmi-styles';style.textContent=`
      .lmi-context{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:14px 0;padding:12px 14px;border:1px solid rgba(85,214,255,.25);border-radius:14px;background:rgba(85,214,255,.06);color:#bdd0e9}.lmi-context strong{color:#72dfff}.lmi-context button{border:0;background:transparent;color:#83e3ff;font-weight:900;cursor:pointer}
      .lmi-dashboard{margin:18px 0;padding:18px;border:1px solid rgba(107,220,255,.25);border-radius:20px;background:linear-gradient(145deg,rgba(18,45,76,.7),rgba(8,20,44,.9))}.lmi-dashboard-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:12px}.lmi-dashboard-head h3{margin:.25rem 0 0}.lmi-dashboard-head>span{color:#8fcdea;font-size:.85rem}.lmi-dashboard-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.lmi-dashboard-grid article{padding:14px;border:1px solid rgba(124,151,210,.2);border-radius:14px;background:#0a1731;min-height:118px}.lmi-dashboard-grid small{display:block;color:#7edcff;font-weight:900;text-transform:uppercase;letter-spacing:.05em;font-size:.68rem}.lmi-dashboard-grid strong{display:block;margin:8px 0 5px;color:#fff}.lmi-dashboard-grid span{color:#b8c7df;font-size:.78rem}
      .lmi-modebar{margin-top:16px}.lmi-progress{display:grid!important;align-content:center;gap:4px}.lmi-progress strong{font-size:1.35rem;color:#fff}.lmi-progress span,.lmi-progress small{color:#9fb0ca}.az-lmi-chip.explored{border-color:rgba(84,215,155,.45);background:rgba(84,215,155,.08)}
      .lmi-workspace{margin-top:18px}.lmi-workspace-status{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.lmi-workspace-status>div{display:grid;gap:3px}.lmi-workspace-status strong{color:#fff}.lmi-workspace-status>span{color:#9fb0ca}.lmi-workspace-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:18px}.lmi-data-card,.lmi-question-card{border:1px solid rgba(100,145,210,.28);border-radius:22px;background:#09162f;padding:22px}.lmi-data-card{border-color:rgba(82,213,255,.3)}.lmi-question-card{border-color:rgba(123,237,178,.25)}
      .lmi-title{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.lmi-title h2{margin:.35rem 0 .25rem;font-size:clamp(1.4rem,2.3vw,2rem)}.lmi-title p{margin:0;color:#8fa7c9}.lmi-inline-employment{text-align:right;min-width:120px}.lmi-inline-employment small{display:block;color:#8fa7c9}.lmi-inline-employment strong{display:block;color:#fff;font-size:1.25rem;margin-top:3px}
      .lmi-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:20px 0}.lmi-metrics>div{padding:14px;border-radius:14px;background:#0e203f;border:1px solid rgba(119,148,205,.18)}.lmi-metrics small{display:block;color:#95aacb;margin-bottom:5px}.lmi-metrics strong{color:#fff}.lmi-wage-note{color:#8fa7c9;font-size:.82rem}.lmi-prep{display:grid;gap:9px;padding:16px;border-radius:16px;background:rgba(255,255,255,.025);border:1px solid rgba(120,148,201,.16)}.lmi-prep>div{display:grid;grid-template-columns:140px 1fr;gap:10px}.lmi-prep b{color:#a6b8d3}.lmi-prep span{color:#fff}.lmi-links{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.lmi-links a{display:flex;align-items:center;justify-content:center;min-height:48px;padding:10px 12px;border-radius:13px;border:1px solid rgba(85,214,255,.3);background:rgba(85,214,255,.08);color:#9be8ff;text-decoration:none;font-weight:900;text-align:center}.lmi-link-note{margin-top:8px;color:#8fa5c5;font-size:.76rem}.lmi-link-note a{color:#8fdfff}
      .lmi-question-card h2{margin:.3rem 0 .4rem}.lmi-question-card>p{color:#aebfd8;margin:0 0 14px}.lmi-question{display:grid;gap:5px;padding:14px 0;border-top:1px solid rgba(125,153,204,.15)}.lmi-question b{color:#fff}.lmi-question small{color:#8fa5c5}.lmi-answer-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:7px}.lmi-answer{padding:8px 11px;border-radius:999px;border:1px solid #365075;background:#0c1c38;color:#c8d6ea;cursor:pointer;font-size:.82rem;font-weight:800}.lmi-answer.selected{border-color:#54d79b;background:rgba(84,215,155,.16);color:#dfffee}.lmi-reason{display:grid;gap:7px;padding-top:14px;border-top:1px solid rgba(125,153,204,.15)}.lmi-reason textarea{min-height:105px;resize:vertical;border:1px solid #38547b;border-radius:13px;background:#061329;color:#fff;padding:12px;font:inherit}.lmi-reason small{color:#8fa5c5}.lmi-complete{margin-top:14px;padding:11px 12px;border-radius:12px;background:rgba(255,193,85,.07);border:1px solid rgba(255,193,85,.22);color:#e8c47c;font-weight:800}.lmi-complete.complete{background:rgba(84,215,155,.08);border-color:rgba(84,215,155,.3);color:#79e8b5}.lmi-nav{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;margin-top:14px}.lmi-nav>span{text-align:center;color:#9eb0ca}.lmi-nav button:disabled{opacity:.45;cursor:not-allowed}
      .lmi-search{margin:10px 0}.lmi-search input{width:100%;padding:12px;border-radius:12px;border:1px solid #38547b;background:#07152c;color:#fff}.lmi-local-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.lmi-local-grid .az-preview{text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.lmi-empty{padding:18px;border:1px dashed rgba(120,155,215,.35);border-radius:14px;color:#dce8fa}.lmi-empty p{margin:.35rem 0 0;color:#9fb0ca}.lmi-gate{margin:20px 0 0;padding:16px 18px;border:1px solid rgba(255,193,85,.22);border-radius:16px;background:rgba(255,193,85,.06);display:grid;gap:4px}.lmi-gate strong{color:#f0d292}.lmi-gate p{margin:0;color:#aab9cf}.lmi-gate.ready{border-color:rgba(84,215,155,.32);background:rgba(84,215,155,.07)}.lmi-gate.ready strong{color:#7ce8b8}
      @media(max-width:1100px){.lmi-dashboard-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.lmi-workspace-grid{grid-template-columns:1fr}.lmi-local-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.lmi-context,.lmi-dashboard-head{align-items:flex-start;flex-direction:column}.lmi-dashboard-grid,.lmi-local-grid{grid-template-columns:1fr}.lmi-metrics{grid-template-columns:1fr 1fr}.lmi-links{grid-template-columns:1fr}.lmi-prep>div{grid-template-columns:1fr}.lmi-nav{grid-template-columns:1fr}.lmi-nav>span{order:-1}.lmi-nav button{width:100%}.lmi-title{flex-direction:column}.lmi-inline-employment{text-align:left}}
    `;document.head.appendChild(style);
  }

  async function init(){
    const host=$('#azLmiExplorer');if(!host)return;
    host.innerHTML='<div class="az-lmi-note"><b>Loading guided LMI Lab…</b><br>Preparing your careers and local labor-market evidence.</div>';
    addStyles();ensureState();
    try{
      const response=await fetch(DATA_URL,{cache:'no-store'});if(!response.ok)throw new Error(`Lightcast data request failed: ${response.status}`);
      lmiData=await response.json();if(lmiData.sourceStatus!=='loaded')throw new Error('Lightcast snapshot is incomplete');
      occupations=Object.entries(lmiData.catalog||{}).map(([code,row])=>({code,title:row.title||code,interests:row.interests||[]}));
      render();
      host.addEventListener('click',handleClick);
      host.addEventListener('input',handleInput);
      window.addEventListener('hashchange',()=>{if(location.hash==='#lmi')setTimeout(render,40)});
    }catch(err){console.error(err);host.innerHTML='<div class="az-lmi-note"><b>LMI Lab could not load.</b><br>Please refresh once. If this continues, tell your facilitator rather than using substitute labor-market data.</div>'}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();