(() => {
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const GEO_KEY='level-up-career-tree-geography-v1';
  const DATA_URL='data/lightcast-lmi.json';
  const MAX_SAVED=5;
  let data=null;
  let mode='carried';
  let query='';
  let activeIndex=0;
  let installing=false;

  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const readState=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}};
  const writeState=state=>{
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(err){console.warn('Career Tree LMI state could not be saved.',err)}
    window.dispatchEvent(new CustomEvent('career-tree-lmi-updated'));
  };
  const geoKey=()=>String(localStorage.getItem(GEO_KEY)||'').trim();

  function ensureState(state){
    state.alignment=state.alignment||{};
    state.alignment.selected=Array.isArray(state.alignment.selected)?state.alignment.selected:[];
    state.lmi=state.lmi||{};
    state.lmi.evidence=state.lmi.evidence||{};
    state.lmi.explorer=state.lmi.explorer||{};
    state.lmi.explorer.saved=Array.isArray(state.lmi.explorer.saved)?state.lmi.explorer.saved:[];
    state.lmi.explorer.viewed=Array.isArray(state.lmi.explorer.viewed)?state.lmi.explorer.viewed:[];
    return state;
  }

  function currentGeo(state){
    const keyed=geoKey();
    if(keyed&&data?.geographies?.[keyed])return keyed;
    const saved=state.alignment?.geography||state.lmi?.explorer?.geography||'';
    if(saved&&data?.geographies?.[saved])return saved;
    return Object.keys(data?.geographies||{})[0]||'';
  }

  function occupation(code){
    const row=data?.catalog?.[code]||{};
    return {code,title:row.title||code,interests:Array.isArray(row.interests)?row.interests:[]};
  }

  function codeByTitle(title){
    const target=String(title||'').trim().toLowerCase();
    return Object.keys(data?.catalog||{}).find(code=>String(data.catalog[code]?.title||'').trim().toLowerCase()===target)||'';
  }

  function metrics(code,geo){return data?.geographies?.[geo]?.occupations?.[code]||{}};
  function represented(code,geo){
    const m=metrics(code,geo);
    return [m.employment,m.annualOpenings,m.recentHires].some(v=>Number(v)>0);
  }
  function fmtNumber(v){const n=Number(v);return Number.isFinite(n)?Math.round(n).toLocaleString():'Not available'}
  function fmtWage(v){const n=Number(v);return Number.isFinite(n)?`$${n.toFixed(2)}/hr`:'Not available'}
  function fmtGrowth(v){const n=Number(v);return Number.isFinite(n)?`${n>0?'+':''}${n.toFixed(1)}%`:'Not available'}
  function prepText(m){return [m.typicalEducation?`Education: ${m.typicalEducation}`:'',m.workExperience&&m.workExperience!=='None'?`Experience: ${m.workExperience}`:'',m.typicalOjt&&m.typicalOjt!=='None'?`OJT: ${m.typicalOjt}`:''].filter(Boolean).join(' • ')||'No preparation detail reported'}
  function careerVideoUrl(o){return `https://www.careeronestop.org/Videos/CareerVideos/career-videos.aspx?keyword=${encodeURIComponent(o.title)}`}
  function onetUrl(o){return `https://www.onetonline.org/link/summary/${encodeURIComponent(o.code)}`}

  function prepSummary(m){
    const education=String(m.typicalEducation||'').trim();
    const ojt=String(m.typicalOjt||'').trim();
    if(education&&ojt&&ojt!=='None')return `${education} + ${ojt}`;
    return education||ojt||'Preparation varies';
  }

  function prepRank(m){
    const education=String(m.typicalEducation||'').toLowerCase();
    const ojt=String(m.typicalOjt||'').toLowerCase();
    const educationRank=
      /no formal/.test(education)?0:
      /high school|secondary school/.test(education)?1:
      /postsecondary nondegree|certificate/.test(education)?2:
      /some college/.test(education)?3:
      /associate/.test(education)?4:
      /bachelor/.test(education)?5:
      /master/.test(education)?6:
      /doctoral|professional degree/.test(education)?7:4;
    const ojtRank=
      !ojt||ojt==='none'?0:
      /short-term/.test(ojt)?0.2:
      /moderate-term/.test(ojt)?0.5:
      /long-term|apprentice/.test(ojt)?1:0.4;
    return educationRank+ojtRank;
  }

  function evidenceFor(code,geo,existing={}){
    const m=metrics(code,geo),g=data.geographies[geo]||{};
    return {
      ...existing,
      soc:code,
      geography:geo,
      geographyLabel:g.label||geo,
      employment:fmtNumber(m.employment),
      entry:fmtWage(m.entryHourly),
      median:fmtWage(m.medianHourly),
      average:fmtWage(m.averageHourly),
      experienced:fmtWage(m.experiencedHourly),
      outlook:`${fmtGrowth(m.growthPct)} growth • ${g.projectionPeriod||data.projectionPeriod||'2026–2035'}`,
      openings:fmtNumber(m.annualOpenings),
      recentHires:fmtNumber(m.recentHires),
      prep:prepText(m),
      education:m.typicalEducation||'Not available',
      ojt:m.typicalOjt||'Not available',
      workExperience:m.workExperience||'Not available',
      source:g.sourceLabel||`Lightcast ${data.datarun||''} • ${g.label||geo}`,
      takeaway:existing.takeaway||'',
      exploration:existing.exploration||{pay:'',opportunity:'',preparation:'',picture:'',reason:'',videoOpened:false,complete:false,completedAt:null}
    };
  }

  function explorationComplete(exploration={}){
    return Boolean(exploration.pay&&exploration.opportunity&&exploration.preparation&&exploration.picture&&String(exploration.reason||'').trim().length>=12);
  }

  function refreshEvidence(state,geo){
    state.alignment.selected.forEach(title=>{
      const code=codeByTitle(title);
      if(code)state.lmi.evidence[title]=evidenceFor(code,geo,state.lmi.evidence[title]||{});
    });
    state.lmi.explorer.geography=geo;
    state.alignment.geography=geo;
    state.alignment.geographyLabel=data.geographies?.[geo]?.label||geo;
  }

  function carriedCodes(state,geo){
    return state.alignment.selected.map(codeByTitle).filter(Boolean).filter(code=>represented(code,geo));
  }

  function availableCodes(geo){
    return Object.keys(data.catalog||{}).filter(code=>represented(code,geo)).sort((a,b)=>{
      const am=metrics(a,geo),bm=metrics(b,geo);
      return Number(bm.annualOpenings||0)-Number(am.annualOpenings||0)||Number(bm.employment||0)-Number(am.employment||0)||occupation(a).title.localeCompare(occupation(b).title);
    });
  }

  function comparisonItems(state,geo){
    const codes=carriedCodes(state,geo);
    if(!codes.length)return [];
    const byMax=(field)=>codes.reduce((best,code)=>Number(metrics(code,geo)[field]||0)>Number(metrics(best,geo)[field]||0)?code:best,codes[0]);
    const highestStart=byMax('entryHourly');
    const highestPotential=byMax('experiencedHourly');
    const mostOpenings=byMax('annualOpenings');
    const fastestGrowth=byMax('growthPct');
    const shortest=codes.reduce((best,code)=>prepRank(metrics(code,geo))<prepRank(metrics(best,geo))?code:best,codes[0]);
    return [
      {label:'Highest starting pay',code:highestStart,value:fmtWage(metrics(highestStart,geo).entryHourly)},
      {label:'Most earnings potential',code:highestPotential,value:fmtWage(metrics(highestPotential,geo).experiencedHourly)},
      {label:'Most local openings',code:mostOpenings,value:`${fmtNumber(metrics(mostOpenings,geo).annualOpenings)} / year`},
      {label:'Shortest typical preparation',code:shortest,value:prepSummary(metrics(shortest,geo))},
      {label:'Fastest projected growth',code:fastestGrowth,value:fmtGrowth(metrics(fastestGrowth,geo).growthPct)}
    ];
  }

  function comparisonDashboard(state,geo){
    const items=comparisonItems(state,geo);
    if(!items.length)return '';
    return `<section class="career-lmi-dashboard"><div class="career-lmi-dashboard-head"><div><span class="eyebrow">QUICK COMPARISON</span><h3>What stands out across your careers?</h3></div><span>${esc(data.geographies[geo]?.label||geo)}</span></div><div class="career-lmi-dashboard-grid">${items.map(item=>`<article><small>${esc(item.label)}</small><strong>${esc(item.value)}</strong><span>${esc(occupation(item.code).title)}</span></article>`).join('')}</div></section>`;
  }

  function questionButtons(name,value,options){
    return `<div class="career-question-options">${options.map(([v,label])=>`<label class="career-question-choice ${value===v?'selected':''}"><input type="radio" name="${esc(name)}" value="${esc(v)}" ${value===v?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div>`;
  }

  function workspace(code,state,geo,index,total){
    const o=occupation(code),m=metrics(code,geo),g=data.geographies[geo]||{};
    const evidence=state.lmi.evidence[o.title]||evidenceFor(code,geo,{});
    const ex=evidence.exploration||{};
    const complete=explorationComplete(ex);
    const videoStatus=ex.videoOpened?'Video opened ✓':'Optional but recommended';
    return `<section class="career-explore-workspace">
      <div class="career-explore-status"><div><span class="eyebrow">CAREER ${index+1} OF ${total}</span><strong>${complete?'Explored ✓':'Exploration in progress'}</strong></div><div class="career-explore-dots">${Array.from({length:total},(_,i)=>`<span class="${i===index?'active':''} ${i<total&&explorationComplete((state.lmi.evidence[occupation(carriedCodes(state,geo)[i])?.title]||{}).exploration||{})?'done':''}"></span>`).join('')}</div></div>
      <div class="career-explore-grid">
        <article class="career-data-card">
          <div class="career-data-head"><div><span class="eyebrow">${esc(g.label||geo)} • LIGHTCAST</span><h2>${esc(o.title)}</h2><p>${esc(code)}</p></div><span class="career-data-badge">${esc(fmtNumber(m.employment))} local jobs</span></div>
          <div class="career-data-metrics">
            <div><small>Starting / P25</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div>
            <div><small>Median</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div>
            <div><small>Earnings potential / P75</small><strong>${esc(fmtWage(m.experiencedHourly))}</strong></div>
            <div><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div>
            <div><small>Projected growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div>
            <div><small>Recent hires</small><strong>${esc(fmtNumber(m.recentHires))}</strong></div>
          </div>
          <div class="career-prep-block"><span class="eyebrow">TYPICAL PREPARATION</span><div><b>Entry education</b><span>${esc(m.typicalEducation||'Not available')}</span></div><div><b>Work experience</b><span>${esc(m.workExperience||'None reported')}</span></div><div><b>On-the-job training</b><span>${esc(m.typicalOjt||'None reported')}</span></div></div>
          <div class="career-media-links"><a data-career-video="${esc(code)}" href="${esc(careerVideoUrl(o))}" target="_blank" rel="noopener">▶ Watch Day-in-the-Life / Career Video ↗</a><a href="${esc(onetUrl(o))}" target="_blank" rel="noopener">View O*NET occupation profile ↗</a></div>
          <div class="career-video-status">${esc(videoStatus)}</div>
          <div class="az-source">${esc(g.sourceLabel||'Lightcast')} • projection period ${esc(g.projectionPeriod||data.projectionPeriod||'2026–2035')}</div>
        </article>
        <article class="career-question-card">
          <span class="eyebrow">EXPLORE • DON'T JUST LOOK</span><h2>What does this evidence mean for you?</h2><p class="career-question-intro">Use the data and career video to decide whether this occupation deserves to stay on your Career Tree.</p>
          <div class="career-question"><div><b>1. Does the pay work for what you need or want right now?</b><small>Starting ${esc(fmtWage(m.entryHourly))} • Median ${esc(fmtWage(m.medianHourly))}</small></div>${questionButtons('pay',ex.pay,[['yes','Yes'],['maybe','Maybe'],['no','No']])}</div>
          <div class="career-question"><div><b>2. Does the local opportunity level make you comfortable continuing to explore this career?</b><small>${esc(fmtNumber(m.employment))} jobs • ${esc(fmtNumber(m.annualOpenings))} annual openings</small></div>${questionButtons('opportunity',ex.opportunity,[['strong','Strong opportunity'],['enough','Enough to keep exploring'],['concern','Concerned']])}</div>
          <div class="career-question"><div><b>3. Does the typical preparation feel realistic for you?</b><small>${esc(prepSummary(m))}</small></div>${questionButtons('preparation',ex.preparation,[['yes','Yes'],['maybe','Maybe'],['no','No']])}</div>
          <div class="career-question"><div><b>4. After learning what the work is actually like, can you picture yourself doing it?</b><small>The career video can help you answer this one.</small></div>${questionButtons('picture',ex.picture,[['yes','Yes'],['maybe','Maybe'],['no','No']])}</div>
          <label class="career-reason"><b>5. What is the biggest reason you would keep—or remove—this career from consideration?</b><textarea id="careerExplorationReason" placeholder="Example: The pay and apprenticeship path work for me, but I want to know more about the schedule.">${esc(ex.reason||'')}</textarea><small id="careerReasonStatus">${String(ex.reason||'').trim().length>=12?'Saved ✓':'Write at least a short sentence.'}</small></label>
          <div class="career-explore-complete ${complete?'complete':''}">${complete?'✓ Career explored':'Complete all five questions to mark this career explored.'}</div>
        </article>
      </div>
      <div class="career-explore-nav"><button id="careerExplorePrev" class="secondary-btn" type="button" ${index===0?'disabled':''}>← Previous Career</button><span>${index+1} of ${total} • ${state.alignment.selected.filter(title=>explorationComplete(state.lmi.evidence[title]?.exploration||{})).length} explored</span><button id="careerExploreNext" class="primary-btn" type="button" ${index>=total-1||!complete?'disabled':''}>${index>=total-1?'Last Career':'Explore Next Career →'}</button></div>
    </section>`;
  }

  function availableBrowser(state,geo){
    let codes=availableCodes(geo);
    const q=query.trim().toLowerCase();
    if(q)codes=codes.filter(code=>`${occupation(code).title} ${code}`.toLowerCase().includes(q));
    codes=codes.slice(0,60);
    return `<section class="career-local-browser"><div class="az-lmi-results-head"><h3>Occupations represented in ${esc(data.geographies[geo]?.label||geo)}</h3><span>${codes.length} shown • ranked by local openings</span></div><div class="career-local-grid">${codes.map(code=>{
      const o=occupation(code),m=metrics(code,geo),saved=state.alignment.selected.includes(o.title);
      return `<article class="az-occ-card ${saved?'saved':''}"><div class="az-occ-code"><span>${esc(code)}</span><span>${esc(fmtNumber(m.annualOpenings))} openings</span></div><h4>${esc(o.title)}</h4><p>${esc(fmtWage(m.entryHourly))} starting • ${esc(fmtWage(m.medianHourly))} median • ${esc(fmtGrowth(m.growthPct))} growth</p><div class="az-occ-actions"><a class="az-preview" href="${esc(careerVideoUrl(o))}" target="_blank" rel="noopener">Career Video ↗</a><button class="az-save ${saved?'saved':''}" data-lmi-add="${esc(code)}" type="button">${saved?'✓ In my careers':'Add to my careers'}</button></div></article>`;
    }).join('')}</div></section>`;
  }

  function updateProgress(){
    const visible=[['interest','viewInterest'],['alignment','viewAlignment'],['lmi','viewLmi'],['tree','viewTree']].find(([,id])=>{const el=document.getElementById(id);return el&&!el.hidden;});
    const key=visible?.[0]||location.hash.replace('#','');
    document.querySelectorAll('.career-progress-strip').forEach(strip=>strip.querySelectorAll('[data-career-progress]').forEach(btn=>btn.classList.toggle('current',btn.dataset.careerProgress===key)));
  }

  function updateExploration(code,field,value){
    const state=ensureState(readState()),geo=currentGeo(state),o=occupation(code);
    state.lmi.evidence[o.title]=evidenceFor(code,geo,state.lmi.evidence[o.title]||{});
    const ex=state.lmi.evidence[o.title].exploration;
    ex[field]=value;
    ex.complete=explorationComplete(ex);
    if(ex.complete&&!ex.completedAt)ex.completedAt=new Date().toISOString();
    if(!ex.complete)ex.completedAt=null;
    state.lmi.evidence[o.title].takeaway=String(ex.reason||'').trim();
    writeState(state);
  }

  function bindWorkspace(state,geo,codes){
    const code=codes[activeIndex];if(!code)return;
    document.querySelectorAll('.career-question-card input[type="radio"]').forEach(input=>input.onchange=e=>{updateExploration(code,e.target.name,e.target.value);render()});
    const reason=$('#careerExplorationReason');
    if(reason)reason.oninput=e=>{
      updateExploration(code,'reason',e.target.value);
      const status=$('#careerReasonStatus');if(status)status.textContent=e.target.value.trim().length>=12?'Saved ✓':'Write at least a short sentence.';
      const fresh=ensureState(readState()),ex=fresh.lmi.evidence[occupation(code).title]?.exploration||{};
      const complete=explorationComplete(ex),completeBox=$('.career-explore-complete'),next=$('#careerExploreNext');
      if(completeBox){completeBox.classList.toggle('complete',complete);completeBox.textContent=complete?'✓ Career explored':'Complete all five questions to mark this career explored.'}
      if(next&&activeIndex<codes.length-1)next.disabled=!complete;
    };
    document.querySelectorAll('[data-career-video]').forEach(link=>link.onclick=()=>{updateExploration(link.dataset.careerVideo,'videoOpened',true)});
    const prev=$('#careerExplorePrev');if(prev)prev.onclick=()=>{activeIndex=Math.max(0,activeIndex-1);render();window.scrollTo({top:$('#careerLmiLab')?.offsetTop||0,behavior:'smooth'})};
    const next=$('#careerExploreNext');if(next)next.onclick=()=>{activeIndex=Math.min(codes.length-1,activeIndex+1);render();window.scrollTo({top:$('#careerLmiLab')?.offsetTop||0,behavior:'smooth'})};
  }

  function bindCommon(state,geo){
    document.querySelectorAll('[data-lmi-mode]').forEach(btn=>btn.onclick=()=>{mode=btn.dataset.lmiMode;query='';activeIndex=0;render()});
    const search=$('#careerLmiSearch');if(search)search.oninput=e=>{query=e.target.value;render()};
    document.querySelectorAll('[data-lmi-remove]').forEach(btn=>btn.onclick=()=>{
      const fresh=ensureState(readState()),title=btn.dataset.lmiRemove;
      fresh.alignment.selected=fresh.alignment.selected.filter(t=>t!==title);
      fresh.lmi.explorer.saved=fresh.lmi.explorer.saved.filter(t=>t!==title);
      delete fresh.lmi.evidence[title];
      writeState(fresh);activeIndex=0;render();
    });
    document.querySelectorAll('[data-lmi-add]').forEach(btn=>btn.onclick=()=>{
      const fresh=ensureState(readState()),code=btn.dataset.lmiAdd,o=occupation(code);
      if(!fresh.alignment.selected.includes(o.title)){
        if(fresh.alignment.selected.length>=MAX_SAVED){alert('You already have five careers. Remove one before adding another.');return;}
        fresh.alignment.selected.push(o.title);
      }
      fresh.lmi.explorer.saved=[...new Set([...(fresh.lmi.explorer.saved||[]),o.title])];
      fresh.lmi.evidence[o.title]=evidenceFor(code,geo,fresh.lmi.evidence[o.title]||{});
      writeState(fresh);mode='carried';activeIndex=Math.max(0,fresh.alignment.selected.indexOf(o.title));query='';render();
    });
    $('#careerLmiChangeGeo')?.addEventListener('click',()=>{location.hash='#alignment';setTimeout(updateProgress,25)});
  }

  function render(){
    if(!data)return;
    const view=$('#viewLmi'),old=$('#azLmiExplorer');
    if(!view||!old)return;
    updateProgress();
    const state=ensureState(readState()),geo=currentGeo(state),g=data.geographies[geo]||{};
    refreshEvidence(state,geo);writeState(state);
    let host=$('#careerLmiLab');
    if(!host){host=document.createElement('div');host.id='careerLmiLab';host.className='az-lmi-explorer career-lmi-lab';old.insertAdjacentElement('beforebegin',host)}
    old.hidden=true;
    const saved=state.alignment.selected.slice(0,MAX_SAVED),carried=carriedCodes(state,geo),label=g.label||geo;
    if(activeIndex>=carried.length)activeIndex=Math.max(0,carried.length-1);
    const explored=saved.filter(title=>explorationComplete(state.lmi.evidence[title]?.exploration||{})).length;
    const required=Math.min(3,saved.length);
    host.innerHTML=`<div class="az-lmi-head"><div><span class="eyebrow">STAGE 3 • LMI LAB</span><h2>Investigate careers. Build evidence. Decide what stays.</h2><p>You brought <b>${saved.length}</b> ${saved.length===1?'career':'careers'} from Career Alignment. Explore each one using local market data, preparation requirements, a CareerOneStop video, and your own reactions.</p></div><div class="az-lmi-xp">${explored} explored • 200 XP</div></div>
      <div class="career-lmi-context"><span>📍 Labor market: <strong>${esc(label)}</strong></span><button type="button" id="careerLmiChangeGeo">Change in Career Alignment</button></div>
      ${comparisonDashboard(state,geo)}
      <div class="az-lmi-controls career-lmi-modebar"><div class="az-lmi-control"><span class="label">LMI Lab</span><div class="az-lmi-mode-row"><button class="az-lmi-mode ${mode==='carried'?'active':''}" data-lmi-mode="carried" type="button">Explore My Careers (${saved.length})</button><button class="az-lmi-mode ${mode==='available'?'active':''}" data-lmi-mode="available" type="button">Browse Available in ${esc(label)}</button></div></div>${mode==='available'?`<div class="az-lmi-control"><label for="careerLmiSearch">Search local occupations</label><input id="careerLmiSearch" value="${esc(query)}" placeholder="Occupation or SOC"></div>`:`<div class="az-lmi-control career-progress-summary"><span>Exploration progress</span><strong>${explored} of ${saved.length}</strong><small>${explored>=required&&required>0?'Ready for the next stage once you are satisfied with your choices.':`Explore at least ${required||3} careers to continue.`}</small></div>`}</div>
      <div class="az-lmi-saved"><div class="az-lmi-saved-head"><strong>My careers</strong><span>${saved.length} / ${MAX_SAVED}</span></div><div class="az-lmi-saved-list">${saved.length?saved.map(t=>{const done=explorationComplete(state.lmi.evidence[t]?.exploration||{});return `<span class="az-lmi-chip ${done?'explored':''}">${done?'✓ ':''}${esc(t)}<button type="button" data-lmi-remove="${esc(t)}" aria-label="Remove ${esc(t)}">×</button></span>`}).join(''):'<span style="color:#9fb0ca">No careers carried forward yet. Browse the local market and add careers you want to investigate.</span>'}</div></div>
      ${mode==='carried'?(carried.length?workspace(carried[activeIndex],state,geo,activeIndex,carried.length):'<div class="career-lmi-empty"><strong>No carried careers are represented in this labor market.</strong><p>Return to Career Alignment or browse available occupations here.</p></div>'):availableBrowser(state,geo)}
      <div class="career-lmi-stage-gate ${explored>=required&&required>0?'ready':''}"><div><span class="eyebrow">LMI LAB PROGRESS</span><strong>${explored>=required&&required>0?'Exploration requirement met ✓':`${explored} of ${required||3} required careers explored`}</strong><p>${explored>=required&&required>0?'You have enough completed exploration to move forward. You can keep exploring or continue when ready.':'Complete all five questions for at least three careers before moving to the Work + Life Simulator.'}</p></div></div>`;
    const continueBtn=$('#lmiContinue');
    if(continueBtn){continueBtn.textContent='Continue to Work + Life Simulator →';continueBtn.disabled=!(explored>=required&&required>0)}
    bindCommon(state,geo);
    if(mode==='carried'&&carried.length)bindWorkspace(state,geo,carried);
  }

  function addStyles(){
    if($('#career-lmi-lab-styles'))return;
    const style=document.createElement('style');style.id='career-lmi-lab-styles';style.textContent=`
      .career-lmi-context{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0;padding:12px 14px;border:1px solid rgba(85,214,255,.22);border-radius:14px;background:rgba(85,214,255,.06);color:#bcd0eb}.career-lmi-context strong{color:#6bdcff}.career-lmi-context button{border:0;background:transparent;color:#82dcff;font-weight:800;cursor:pointer}
      .career-lmi-dashboard{margin:18px 0;padding:18px;border:1px solid rgba(107,220,255,.24);border-radius:20px;background:linear-gradient(145deg,rgba(18,45,76,.7),rgba(8,20,44,.9))}.career-lmi-dashboard-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:12px}.career-lmi-dashboard-head h3{margin:.25rem 0 0}.career-lmi-dashboard-head>span{color:#8fcdea;font-size:.85rem}.career-lmi-dashboard-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.career-lmi-dashboard-grid article{padding:14px;border:1px solid rgba(124,151,210,.2);border-radius:14px;background:#0a1731;min-height:118px}.career-lmi-dashboard-grid small{display:block;color:#7edcff;font-weight:900;text-transform:uppercase;letter-spacing:.05em;font-size:.68rem}.career-lmi-dashboard-grid strong{display:block;margin:8px 0 5px;color:#fff;font-size:1.02rem}.career-lmi-dashboard-grid span{color:#b8c7df;font-size:.78rem;line-height:1.3}
      .career-lmi-modebar{margin-top:16px}.career-progress-summary{display:grid!important;align-content:center;gap:4px}.career-progress-summary span,.career-progress-summary small{color:#9fb0ca}.career-progress-summary strong{font-size:1.35rem;color:#fff}
      .career-explore-workspace{margin-top:18px}.career-explore-status{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:10px}.career-explore-status>div:first-child{display:grid;gap:3px}.career-explore-status strong{color:#fff}.career-explore-dots{display:flex;gap:6px}.career-explore-dots span{width:10px;height:10px;border-radius:50%;background:#243653}.career-explore-dots span.active{background:#63d9ff;box-shadow:0 0 0 4px rgba(99,217,255,.12)}.career-explore-dots span.done{background:#56d49c}
      .career-explore-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:18px;align-items:stretch}.career-data-card,.career-question-card{border:1px solid rgba(100,145,210,.28);border-radius:22px;background:#09162f;padding:22px;box-shadow:0 18px 60px rgba(0,0,0,.18)}.career-data-card{border-color:rgba(82,213,255,.3)}.career-question-card{border-color:rgba(123,237,178,.25)}
      .career-data-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.career-data-head h2{margin:.35rem 0 .25rem;font-size:clamp(1.4rem,2.3vw,2rem)}.career-data-head p{margin:0;color:#8fa7c9}.career-data-badge{padding:8px 10px;border-radius:999px;background:rgba(88,215,255,.1);border:1px solid rgba(88,215,255,.28);color:#8fe6ff;font-weight:800;white-space:nowrap}.career-data-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:20px 0}.career-data-metrics>div{padding:14px;border-radius:14px;background:#0e203f;border:1px solid rgba(119,148,205,.18)}.career-data-metrics small{display:block;color:#95aacb;margin-bottom:5px}.career-data-metrics strong{color:#fff;font-size:1.05rem}.career-prep-block{display:grid;gap:9px;padding:16px;border-radius:16px;background:rgba(255,255,255,.025);border:1px solid rgba(120,148,201,.16)}.career-prep-block>div{display:grid;grid-template-columns:140px 1fr;gap:10px}.career-prep-block b{color:#a6b8d3}.career-prep-block span{color:#fff}.career-media-links{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.career-media-links a{display:flex;align-items:center;justify-content:center;min-height:48px;padding:10px 12px;border-radius:13px;border:1px solid rgba(85,214,255,.3);background:rgba(85,214,255,.08);color:#9be8ff;text-decoration:none;font-weight:900;text-align:center}.career-video-status{margin-top:7px;color:#8da3c5;font-size:.76rem}
      .career-question-card h2{margin:.3rem 0 .4rem}.career-question-intro{color:#aebfd8;margin:0 0 14px}.career-question{padding:14px 0;border-top:1px solid rgba(125,153,204,.15)}.career-question>div:first-child{display:grid;gap:4px}.career-question b{color:#fff}.career-question small{color:#8fa5c5}.career-question-options{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.career-question-choice input{position:absolute;opacity:0;pointer-events:none}.career-question-choice span{display:block;padding:8px 11px;border-radius:999px;border:1px solid #365075;background:#0c1c38;color:#c8d6ea;cursor:pointer;font-size:.82rem;font-weight:800}.career-question-choice.selected span,.career-question-choice:has(input:checked) span{border-color:#54d79b;background:rgba(84,215,155,.16);color:#dfffee}.career-reason{display:grid;gap:7px;padding-top:14px;border-top:1px solid rgba(125,153,204,.15)}.career-reason textarea{min-height:105px;resize:vertical;border:1px solid #38547b;border-radius:13px;background:#061329;color:#fff;padding:12px;font:inherit}.career-reason small{color:#8fa5c5}.career-explore-complete{margin-top:14px;padding:11px 12px;border-radius:12px;background:rgba(255,193,85,.07);border:1px solid rgba(255,193,85,.22);color:#e8c47c;font-weight:800}.career-explore-complete.complete{background:rgba(84,215,155,.08);border-color:rgba(84,215,155,.3);color:#79e8b5}
      .career-explore-nav{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;margin-top:14px}.career-explore-nav>span{text-align:center;color:#9eb0ca}.career-explore-nav button:disabled{opacity:.45;cursor:not-allowed}.az-lmi-chip.explored{border-color:rgba(84,215,155,.45);background:rgba(84,215,155,.08)}
      .career-local-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.career-local-grid .az-preview{text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.career-lmi-empty{padding:18px;border:1px dashed rgba(120,155,215,.35);border-radius:14px;color:#dce8fa}.career-lmi-empty p{margin:.35rem 0 0;color:#9fb0ca}.career-lmi-stage-gate{margin:20px 0 0;padding:16px 18px;border:1px solid rgba(255,193,85,.22);border-radius:16px;background:rgba(255,193,85,.06)}.career-lmi-stage-gate>div{display:grid;gap:4px}.career-lmi-stage-gate strong{color:#f0d292}.career-lmi-stage-gate p{margin:0;color:#aab9cf}.career-lmi-stage-gate.ready{border-color:rgba(84,215,155,.32);background:rgba(84,215,155,.07)}.career-lmi-stage-gate.ready strong{color:#7ce8b8}.career-progress-step.current{border-color:#55d6ff!important;box-shadow:0 0 0 1px rgba(85,214,255,.22)}
      @media(max-width:1100px){.career-lmi-dashboard-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.career-explore-grid{grid-template-columns:1fr}.career-local-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:700px){.career-lmi-context,.career-lmi-dashboard-head{align-items:flex-start;flex-direction:column}.career-lmi-dashboard-grid,.career-local-grid{grid-template-columns:1fr}.career-data-metrics{grid-template-columns:1fr 1fr}.career-media-links{grid-template-columns:1fr}.career-prep-block>div{grid-template-columns:1fr}.career-explore-nav{grid-template-columns:1fr}.career-explore-nav>span{order:-1}.career-explore-nav button{width:100%}}
    `;document.head.appendChild(style);
  }

  async function init(){
    if(installing)return;installing=true;
    try{
      addStyles();
      const response=await fetch(DATA_URL,{cache:'no-store'});if(!response.ok)throw new Error(`LMI data request failed: ${response.status}`);
      data=await response.json();if(data.sourceStatus!=='loaded')throw new Error('LMI snapshot incomplete');
      render();
      window.addEventListener('hashchange',()=>setTimeout(()=>{updateProgress();if(location.hash==='#lmi')render()},60));
      window.addEventListener('career-tree-geography-updated',()=>setTimeout(render,50));
      const viewObserver=new MutationObserver(()=>{updateProgress();if(!$('#viewLmi')?.hidden)render()});
      ['#viewInterest','#viewAlignment','#viewLmi','#viewTree'].forEach(sel=>{const el=$(sel);if(el)viewObserver.observe(el,{attributes:true,attributeFilter:['hidden']})});
    }catch(err){console.error('Career Tree LMI Lab enhancement failed.',err)}finally{installing=false}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();