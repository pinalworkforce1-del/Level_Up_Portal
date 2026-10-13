(()=>{
  const LEGACY_KEY='level-up-career-skill-tree-v1';
  const GEO_KEY='level-up-career-tree-geography-v1';
  const NEXT_KEY='level-up-career-tree-next-v1';
  const DATA_URL='../../career-skill-tree/data/lightcast-lmi.json';
  const MAX_SAVED=5;
  const RIASEC={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};
  const envHints={active:['construction','installation','repair','maintenance','driver','labor','welder','mechanic','assembler','operator','technician'],indoor:['specialist','assistant','clerk','designer','accountant','support','representative','nurse','teacher'],variety:['manager','supervisor','technician','specialist','driver','sales','nurse','electrician']};
  const peopleHints={people:['service','teacher','nurse','assistant','counsel','sales','human resources','public relations','reception','support'],mix:['technician','specialist','manager','supervisor','electrician','mechanic','logistic'],solo:['driver','operator','welder','assembler','bookkeeping','programmer','analyst']};
  let data=null;
  let catalog=[];
  let state=loadState();
  let showAll=false;

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const fmtNumber=v=>num(v)===null?'Not available':Math.round(Number(v)).toLocaleString();
  const fmtWage=v=>num(v)===null?'Not available':`$${Number(v).toFixed(2)}/hr`;
  const fmtGrowth=v=>num(v)===null?'Not available':`${Number(v)>0?'+':''}${Number(v).toFixed(1)}%`;

  function loadState(){
    let legacy={};let next={};
    try{legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'{}')}catch{}
    try{next=JSON.parse(localStorage.getItem(NEXT_KEY)||'{}')}catch{}
    const saved=Array.isArray(next.exploreCareers?.saved)?next.exploreCareers.saved:(legacy.alignment?.selected||[]);
    return {
      interest:legacy.interest||{},
      profile:legacy.profile||{},
      activity:next.exploreCareers?.activity||legacy.alignment?.style||'',
      prep:next.exploreCareers?.prep||legacy.alignment?.training||'',
      environment:next.exploreCareers?.environment||legacy.alignment?.environment||'',
      people:next.exploreCareers?.people||legacy.alignment?.people||'',
      geography:next.exploreCareers?.geography||localStorage.getItem(GEO_KEY)||legacy.alignment?.geography||'',
      saved:[...new Set(saved)].slice(0,MAX_SAVED),
    };
  }

  function persist(){
    let next={};try{next=JSON.parse(localStorage.getItem(NEXT_KEY)||'{}')}catch{}
    next.exploreCareers={...(next.exploreCareers||{}),activity:state.activity,prep:state.prep,environment:state.environment,people:state.people,geography:state.geography,saved:state.saved,updatedAt:new Date().toISOString()};
    try{localStorage.setItem(NEXT_KEY,JSON.stringify(next));localStorage.setItem(GEO_KEY,state.geography||'')}catch{}
    try{
      const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'{}');
      legacy.alignment=legacy.alignment||{};
      legacy.alignment.geography=state.geography;
      legacy.alignment.geographyLabel=data?.geographies?.[state.geography]?.label||state.geography;
      legacy.alignment.selected=state.saved.slice();
      localStorage.setItem(LEGACY_KEY,JSON.stringify(legacy));
    }catch{}
  }

  function areaFromContext(){
    let legacy={};try{legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'{}')}catch{}
    const raw=String(localStorage.getItem('level-up-pending-county')||legacy?.profile?.county||'').trim();
    if(/pinal/i.test(raw))return 'Pinal';
    if(/northern|apache|coconino|navajo|gila/i.test(raw))return 'Northern';
    if(/eastern|ufo|new mexico|chaves|curry|de.?baca|eddy|guadalupe|harding|lea|lincoln|otero|quay|roosevelt|union/i.test(raw))return 'UFO - Eastern New Mexico';
    return '';
  }

  function allowedGeos(){
    const all=Object.keys(data?.geographies||{});
    if(showAll)return all;
    const area=areaFromContext();
    const scoped=area&&Array.isArray(data?.areas?.[area])?data.areas[area]:[];
    return scoped.length?scoped:all;
  }

  function defaultGeo(){
    const allowed=allowedGeos();
    if(state.geography&&allowed.includes(state.geography))return state.geography;
    const area=areaFromContext();
    if(area==='Pinal'&&allowed.includes('pinal'))return'pinal';
    if(area==='Northern'&&allowed.includes('coconino'))return'coconino';
    if(area==='UFO - Eastern New Mexico'&&allowed.includes('chaves'))return'chaves';
    return allowed.find(k=>data.geographies[k]?.type==='state')||allowed[0]||'';
  }

  function renderInterest(){
    const host=$('interestContent');
    const complete=Boolean(state.interest?.complete);
    const scores=state.interest?.scores||{};
    const top=Array.isArray(state.interest?.top)?state.interest.top:[];
    if(!complete||!top.length){
      host.innerHTML=`<div class="interest-empty"><strong>O*NET interest clues are optional here.</strong><p>You can continue with work preferences and geography now, or complete Discover Me first so those scores can help rank occupations.</p></div>`;
      return;
    }
    host.innerHTML=`<div class="interest-summary"><div class="interest-code"><span class="eyebrow">YOUR PROFILE</span><strong>${esc(top.join(''))} • ${esc(top.map(k=>RIASEC[k]||k).join(' + '))}</strong><p>These scores are clues, not commands. Explore Careers will combine them with your work preferences and labor market.</p></div><div class="riasec-bars">${Object.keys(RIASEC).map(k=>{const v=Math.max(0,Math.min(20,Number(scores[k]||0)));return`<div class="riasec-row"><strong>${k} • ${RIASEC[k]}</strong><div class="bar"><i style="width:${v/20*100}%"></i></div><span>${v}/20</span></div>`}).join('')}</div></div>`;
  }

  function syncForm(){
    ['activity','prep','environment','people'].forEach(name=>{const value=state[name];const input=document.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`);if(input)input.checked=true});
    $('preferencesForm').addEventListener('change',()=>{
      const fd=new FormData($('preferencesForm'));
      ['activity','prep','environment','people'].forEach(k=>state[k]=String(fd.get(k)||''));
      persist();renderResults();
    });
  }

  function renderGeo(){
    const select=$('geographySelect');
    const allowed=allowedGeos();
    state.geography=defaultGeo();
    const rows=allowed.map(k=>({key:k,label:data.geographies[k]?.label||k,state:data.geographies[k]?.state||''}));
    const groups=[...new Set(rows.map(r=>r.state).filter(Boolean))];
    select.innerHTML=groups.length>1?groups.map(group=>`<optgroup label="${esc(group)}">${rows.filter(r=>r.state===group).map(r=>`<option value="${esc(r.key)}" ${r.key===state.geography?'selected':''}>${esc(r.label)}</option>`).join('')}</optgroup>`).join(''):rows.map(r=>`<option value="${esc(r.key)}" ${r.key===state.geography?'selected':''}>${esc(r.label)}</option>`).join('');
    select.onchange=()=>{state.geography=select.value;persist();renderResults()};
    $('showAllGeographies').textContent=showAll?'Use my workforce area':'Show all available geographies';
    $('showAllGeographies').onclick=()=>{showAll=!showAll;renderGeo();persist();renderResults()};
    persist();
  }

  function preparationFit(meta){
    const prep=state.prep||'open';if(prep==='open')return 0.5;
    const text=`${meta.typicalEducation||''} ${meta.typicalOjt||''}`.toLowerCase();
    let rank=/no formal|high school|short-term/.test(text)?1:/postsecondary nondegree|certificate|moderate-term|associate/.test(text)?2:/bachelor|long-term|apprentice/.test(text)?3:/master|doctoral|professional/.test(text)?4:2;
    const target=prep==='short'?1:prep==='mid'?2:4;
    return Math.max(0,1-Math.abs(rank-target)/3);
  }

  function textSignal(title,map,key){
    if(!key||key==='open')return 0.5;
    const terms=map[key]||[];const lower=title.toLowerCase();
    return terms.some(t=>lower.includes(t))?1:0.35;
  }

  function interestScore(meta){
    const areas=Array.isArray(meta.interests)?meta.interests:[];
    const scores=state.interest?.scores||{};
    if(state.interest?.complete&&areas.length){
      return areas.reduce((sum,k)=>sum+Math.max(0,Math.min(20,Number(scores[k]||0))),0)/(areas.length*20);
    }
    if(state.activity&&areas.includes(state.activity))return 1;
    return state.activity?0.35:0.5;
  }

  function overall(meta){
    const title=meta.title||'';
    const parts=[interestScore(meta),preparationFit(meta),textSignal(title,envHints,state.environment),textSignal(title,peopleHints,state.people)];
    const weights=state.interest?.complete?[.5,.2,.15,.15]:[.35,.25,.2,.2];
    return parts.reduce((s,v,i)=>s+v*weights[i],0);
  }

  function fitLabel(score){return score>=.78?'Strong fit':score>=.62?'Good fit':score>=.48?'Possible fit':'Worth a look'}
  function metric(code){return data?.geographies?.[state.geography]?.occupations?.[code]||{}}
  function represented(code){const m=metric(code);return [m.employment,m.annualOpenings,m.recentHires].some(v=>Number(v)>0)}
  function prepSummary(m){return [m.typicalEducation,m.typicalOjt&&m.typicalOjt!=='None'?m.typicalOjt:''].filter(Boolean).join(' + ')||'Preparation varies'}
  function onetUrl(code){return`https://www.onetonline.org/link/summary/${encodeURIComponent(code)}`}
  function videoUrl(code){return`https://cdn.careeronestop.org/OccVids/OccupationVideos/${encodeURIComponent(code)}.00.mp4`}
  function careerOneStopProfile(code,title){const onet=String(code||'').replace(/\D/g,'')+'00';return`https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=${encodeURIComponent(title)}&lang=en&location=US&onetcode=${encodeURIComponent(onet)}`}

  function currentRows(){
    const q=$('careerSearch').value.trim().toLowerCase();
    let rows=catalog.filter(o=>represented(o.code));
    if(q)rows=rows.filter(o=>`${o.title} ${o.code}`.toLowerCase().includes(q));
    rows=rows.map(o=>({...o,fit:overall(o)})).sort((a,b)=>b.fit-a.fit||Number(metric(b.code).annualOpenings||0)-Number(metric(a.code).annualOpenings||0)||a.title.localeCompare(b.title));
    return rows.slice(0,q?80:24);
  }

  function renderResults(){
    if(!data)return;
    const geo=data.geographies[state.geography];
    const host=$('careerGrid');
    const rows=currentRows();
    $('resultsSummary').textContent=`Showing ${rows.length} occupations in ${geo?.label||state.geography}. Ranked by your clues, preferences, and local representation.`;
    host.innerHTML=rows.map(o=>{const m=metric(o.code),saved=state.saved.includes(o.title);return`<article class="career-card ${saved?'saved':''}"><span class="code">${esc(o.code)}</span><h3>${esc(o.title)}</h3><div class="fit-row"><span class="fit-chip">${fitLabel(o.fit)}</span>${Array.isArray(o.interests)?o.interests.slice(0,3).map(k=>`<span class="fit-chip">${esc(k)} • ${esc(RIASEC[k]||k)}</span>`).join(''):''}</div><div class="metrics"><div class="metric"><small>Typical entry</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div><div class="metric"><small>Median</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div><div class="metric"><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div><div class="metric"><small>Growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div></div><p>${esc(prepSummary(m))}</p><div class="card-actions"><button class="explore-btn" data-explore="${esc(o.code)}">Explore career</button><button class="save-btn" data-save="${esc(o.code)}">${saved?'Saved ✓':'Save'}</button></div></article>`}).join('');
    if(!rows.length)host.innerHTML='<div class="interest-empty"><strong>No occupations matched this search in the selected geography.</strong><p>Try a broader search or switch geography.</p></div>';
    host.querySelectorAll('[data-explore]').forEach(btn=>btn.onclick=()=>openCareer(btn.dataset.explore));
    host.querySelectorAll('[data-save]').forEach(btn=>btn.onclick=()=>toggleSave(btn.dataset.save));
    renderSaved();
  }

  function toggleSave(code){
    const o=catalog.find(x=>x.code===code);if(!o)return;
    const i=state.saved.indexOf(o.title);
    if(i>=0)state.saved.splice(i,1);else if(state.saved.length<MAX_SAVED)state.saved.push(o.title);else{alert(`Save up to ${MAX_SAVED} career possibilities.`);return}
    persist();renderResults();
  }

  function renderSaved(){
    const host=$('savedCareers');
    host.innerHTML=state.saved.length?state.saved.map(title=>`<span class="saved-pill">${esc(title)}<button type="button" data-remove="${esc(title)}" aria-label="Remove ${esc(title)}">×</button></span>`).join(''):'<span class="source-note">No careers saved yet.</span>';
    host.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{state.saved=state.saved.filter(t=>t!==btn.dataset.remove);persist();renderResults()});
  }

  function openCareer(code){
    const o=catalog.find(x=>x.code===code);if(!o)return;
    const m=metric(code),geo=data.geographies[state.geography];
    const dialog=$('careerDialog');
    $('careerDialogContent').innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><span class="eyebrow">${esc(geo?.label||'LABOR MARKET')} • ${esc(code)}</span><h2>${esc(o.title)}</h2><p>${fitLabel(overall(o))} based on your current clues and preferences.</p></div><button class="dialog-close" type="button">Close</button></div><div class="dialog-grid"><section class="lmi-card"><span class="eyebrow">LABOR MARKET INFORMATION</span><div class="lmi-metrics"><div><small>Typical entry</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div><div><small>Median wage</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div><div><small>Highest earners</small><strong>${esc(fmtWage(m.experiencedHourly))}</strong></div><div><small>Employment</small><strong>${esc(fmtNumber(m.employment))}</strong></div><div><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div><div><small>Projected growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div></div><p><strong>Typical preparation:</strong> ${esc(prepSummary(m))}</p><div class="external-links"><a href="${esc(onetUrl(code))}" target="_blank" rel="noopener noreferrer">O*NET Occupation Profile ↗</a><a href="${esc(careerOneStopProfile(code,o.title))}" target="_blank" rel="noopener noreferrer">CareerOneStop Profile ↗</a></div><p class="source-note">Labor market data: ${esc(geo?.sourceLabel||data.provider||'Lightcast')} • ${esc(geo?.projectionPeriod||data.projectionPeriod||'')}</p></section><section class="video-card"><span class="eyebrow">DAY IN THE LIFE</span><h3>CareerOneStop occupation video</h3><video controls preload="metadata" src="${esc(videoUrl(code))}"><track kind="captions" srclang="en" label="English"></video><p class="source-note">If the embedded video is unavailable for this occupation, use the CareerOneStop profile link to view available career media and details.</p><button class="save-btn" data-dialog-save="${esc(code)}" type="button">${state.saved.includes(o.title)?'Saved ✓':'Save this career'}</button></section></div></div>`;
    dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
    dialog.querySelector('[data-dialog-save]').onclick=()=>{toggleSave(code);dialog.close()};
    dialog.showModal();
  }

  async function init(){
    renderInterest();syncForm();
    $('careerSearch').addEventListener('input',()=>renderResults());
    try{
      const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw new Error(`Lightcast data ${r.status}`);
      data=await r.json();
      if(data.sourceStatus!=='loaded'||!data.catalog||!data.geographies)throw new Error('Validated Lightcast snapshot is not available in this deployment.');
      catalog=Object.entries(data.catalog).map(([code,row])=>({code,title:row.title||code,interests:Array.isArray(row.interests)?row.interests:[],typicalEducation:row.typicalEducation||'',typicalOjt:row.typicalOjt||'',workExperience:row.workExperience||''}));
      renderGeo();renderResults();
    }catch(err){
      console.error(err);
      $('resultsSummary').textContent='Labor-market data could not load.';
      const status=$('dataStatus');status.hidden=false;status.textContent='Explore Careers could not load the validated Lightcast snapshot from this deployment. The module will not invent wage or demand values. Refresh after the next Pages deployment.';
      $('careerGrid').innerHTML='';
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();