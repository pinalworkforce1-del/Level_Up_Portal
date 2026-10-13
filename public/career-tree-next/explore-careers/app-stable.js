(()=>{
  'use strict';

  const LEGACY_KEY='level-up-career-skill-tree-v1';
  const NEXT_KEY='level-up-career-tree-next-v1';
  const GEO_KEY='level-up-career-tree-geography-v1';
  const DATA_URL='../../career-skill-tree/data/lightcast-lmi.json';
  const MAX_SAVED=5;
  const RIASEC={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};
  const STATE_META={
    pinal:['Arizona',false],coconino:['Arizona',false],apache:['Arizona',false],navajo:['Arizona',false],gila:['Arizona',false],az:['Arizona',true],
    chaves:['New Mexico',false],curry:['New Mexico',false],'de-baca':['New Mexico',false],eddy:['New Mexico',false],guadalupe:['New Mexico',false],harding:['New Mexico',false],lea:['New Mexico',false],lincoln:['New Mexico',false],otero:['New Mexico',false],quay:['New Mexico',false],roosevelt:['New Mexico',false],union:['New Mexico',false],nm:['New Mexico',true]
  };
  const ENV_HINTS={active:['construction','installation','repair','maintenance','driver','labor','welder','mechanic','assembler','operator','technician'],indoor:['specialist','assistant','clerk','designer','accountant','support','representative','nurse','teacher'],variety:['manager','supervisor','technician','specialist','driver','sales','nurse','electrician']};
  const PEOPLE_HINTS={people:['service','teacher','nurse','assistant','counsel','sales','human resources','public relations','reception','support'],mix:['technician','specialist','manager','supervisor','electrician','mechanic','logistic'],solo:['driver','operator','welder','assembler','bookkeeping','programmer','analyst']};

  let data=null;
  let catalog=[];
  let showAll=false;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const finite=v=>Number.isFinite(Number(v));
  const fmtNumber=v=>finite(v)?Math.round(Number(v)).toLocaleString():'Not available';
  const fmtWage=v=>finite(v)?`$${Number(v).toFixed(2)}/hr`:'Not available';
  const fmtGrowth=v=>finite(v)?`${Number(v)>0?'+':''}${Number(v).toFixed(1)}%`:'Not available';

  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
  function readState(){
    const legacy=readJson(LEGACY_KEY),next=readJson(NEXT_KEY),savedNext=next.exploreCareers?.saved;
    return {
      interest:legacy.interest||{},profile:legacy.profile||{},
      activity:next.exploreCareers?.activity||legacy.alignment?.style||'',
      prep:next.exploreCareers?.prep||legacy.alignment?.training||'',
      environment:next.exploreCareers?.environment||legacy.alignment?.environment||'',
      people:next.exploreCareers?.people||legacy.alignment?.people||'',
      geography:next.exploreCareers?.geography||localStorage.getItem(GEO_KEY)||legacy.alignment?.geography||'',
      saved:[...new Set(Array.isArray(savedNext)?savedNext:(legacy.alignment?.selected||[]))].slice(0,MAX_SAVED)
    };
  }
  const state=readState();

  function persist(){
    try{
      const next=readJson(NEXT_KEY);
      next.exploreCareers={...(next.exploreCareers||{}),activity:state.activity,prep:state.prep,environment:state.environment,people:state.people,geography:state.geography,saved:state.saved,updatedAt:new Date().toISOString()};
      localStorage.setItem(NEXT_KEY,JSON.stringify(next));localStorage.setItem(GEO_KEY,state.geography||'');
    }catch{}
    try{
      const legacy=readJson(LEGACY_KEY);legacy.alignment=legacy.alignment||{};
      legacy.alignment.geography=state.geography;
      legacy.alignment.geographyLabel=data?.geographies?.[state.geography]?.label||state.geography;
      legacy.alignment.selected=state.saved.slice();
      localStorage.setItem(LEGACY_KEY,JSON.stringify(legacy));
    }catch{}
  }

  function areaFromContext(){
    const legacy=readJson(LEGACY_KEY);
    const raw=String(localStorage.getItem('level-up-pending-county')||legacy?.profile?.county||'').trim();
    if(/pinal/i.test(raw))return 'Pinal';
    if(/northern|apache|coconino|navajo|gila/i.test(raw))return 'Northern';
    if(/eastern|ufo|new mexico|chaves|curry|de.?baca|eddy|guadalupe|harding|lea|lincoln|otero|quay|roosevelt|union/i.test(raw))return 'UFO - Eastern New Mexico';
    return '';
  }
  function allowedGeos(){
    const all=Object.keys(data?.geographies||{});
    if(showAll)return all;
    const scoped=data?.areas?.[areaFromContext()];
    return Array.isArray(scoped)&&scoped.length?scoped:all;
  }
  function defaultGeo(){
    const allowed=allowedGeos();
    if(state.geography&&allowed.includes(state.geography))return state.geography;
    const area=areaFromContext();
    if(area==='Pinal'&&allowed.includes('pinal'))return 'pinal';
    if(area==='Northern'&&allowed.includes('coconino'))return 'coconino';
    if(area==='UFO - Eastern New Mexico'&&allowed.includes('chaves'))return 'chaves';
    return allowed.find(k=>STATE_META[k]?.[1])||allowed[0]||'';
  }

  function renderInterest(){
    const host=$('interestContent');if(!host)return;
    const scores=state.interest?.scores||{},top=Array.isArray(state.interest?.top)?state.interest.top:[];
    if(!state.interest?.complete||!top.length){host.innerHTML='<div class="interest-empty"><strong>O*NET interest clues are optional here.</strong><p>You can continue with work preferences and geography now, or complete Discover Me first so those scores can help rank occupations.</p></div>';return;}
    host.innerHTML=`<div class="interest-summary"><div class="interest-code"><span class="eyebrow">YOUR PROFILE</span><strong>${esc(top.join(''))} • ${esc(top.map(k=>RIASEC[k]||k).join(' + '))}</strong><p>These scores are clues, not commands. Explore Careers combines them with your preferences and labor market.</p></div><div class="riasec-bars">${Object.keys(RIASEC).map(k=>{const v=Math.max(0,Math.min(20,Number(scores[k]||0)));return`<div class="riasec-row"><strong>${k} • ${RIASEC[k]}</strong><div class="bar"><i style="width:${v/20*100}%"></i></div><span>${v}/20</span></div>`}).join('')}</div></div>`;
  }

  function syncForm(){
    ['activity','prep','environment','people'].forEach(name=>{const value=state[name];if(!value)return;const input=document.querySelector(`input[name="${name}"][value="${value}"]`);if(input)input.checked=true;});
    $('preferencesForm')?.addEventListener('change',()=>{const fd=new FormData($('preferencesForm'));['activity','prep','environment','people'].forEach(k=>state[k]=String(fd.get(k)||''));persist();renderResults();});
  }

  function renderGeo(){
    const select=$('geographySelect');if(!select)return;
    state.geography=defaultGeo();
    const rows=allowedGeos().map(key=>({key,label:data.geographies[key]?.label||key,state:STATE_META[key]?.[0]||'Other',statewide:Boolean(STATE_META[key]?.[1])}));
    const states=[...new Set(rows.map(r=>r.state))].sort((a,b)=>['Arizona','New Mexico'].indexOf(a)-['Arizona','New Mexico'].indexOf(b)||a.localeCompare(b));
    select.innerHTML=states.map(st=>`<optgroup label="${esc(st)}">${rows.filter(r=>r.state===st).sort((a,b)=>a.statewide!==b.statewide?(a.statewide?1:-1):a.label.localeCompare(b.label)).map(r=>`<option value="${esc(r.key)}" ${r.key===state.geography?'selected':''}>${esc(r.label)}</option>`).join('')}</optgroup>`).join('');
    select.onchange=()=>{state.geography=select.value;persist();renderResults();};
    const toggle=$('showAllGeographies');
    if(toggle){toggle.textContent=showAll?'Use my workforce area':'Show all available geographies';toggle.onclick=()=>{showAll=!showAll;renderGeo();renderResults();};}
    persist();
  }

  function prepFit(meta){
    if(!state.prep||state.prep==='open')return .5;
    const t=`${meta.typicalEducation||''} ${meta.typicalOjt||''}`.toLowerCase();
    const rank=/no formal|high school|short-term/.test(t)?1:/postsecondary nondegree|certificate|moderate-term|associate/.test(t)?2:/bachelor|long-term|apprentice/.test(t)?3:/master|doctoral|professional/.test(t)?4:2;
    const target=state.prep==='short'?1:state.prep==='mid'?2:4;return Math.max(0,1-Math.abs(rank-target)/3);
  }
  function textSignal(title,map,key){if(!key||key==='open')return .5;const lower=title.toLowerCase();return(map[key]||[]).some(t=>lower.includes(t))?1:.35;}
  function interestFit(meta){const areas=Array.isArray(meta.interests)?meta.interests:[],scores=state.interest?.scores||{};if(state.interest?.complete&&areas.length)return areas.reduce((s,k)=>s+Math.max(0,Math.min(20,Number(scores[k]||0))),0)/(areas.length*20);if(state.activity&&areas.includes(state.activity))return 1;return state.activity?.length?.35:.5;}
  function overall(meta){const parts=[interestFit(meta),prepFit(meta),textSignal(meta.title||'',ENV_HINTS,state.environment),textSignal(meta.title||'',PEOPLE_HINTS,state.people)],weights=state.interest?.complete?[.5,.2,.15,.15]:[.35,.25,.2,.2];return parts.reduce((s,v,i)=>s+v*weights[i],0);}
  function fitLabel(score){return score>=.78?'Strong fit':score>=.62?'Good fit':score>=.48?'Possible fit':'Worth a look';}
  function metric(code){return data?.geographies?.[state.geography]?.occupations?.[code]||{};}
  function represented(code){const m=metric(code);return[m.employment,m.annualOpenings,m.recentHires].some(v=>Number(v)>0);}
  function prepSummary(m){return[m.typicalEducation,m.typicalOjt&&m.typicalOjt!=='None'?m.typicalOjt:''].filter(Boolean).join(' + ')||'Preparation varies';}
  function onetCode(code){const c=String(code||'').trim();return /^\d{2}-\d{4}$/.test(c)?`${c}.00`:c;}
  function onetUrl(code){return`https://www.onetonline.org/link/summary/${encodeURIComponent(onetCode(code))}`;}
  function videoUrl(code){return`https://cdn.careeronestop.org/OccVids/OccupationVideos/${encodeURIComponent(String(code||'').replace(/\.\d{2}$/,''))}.00.mp4`;}
  function cosProfile(code,title){const onet=onetCode(code).replace(/\D/g,'');return`https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=${encodeURIComponent(title)}&lang=en&location=US&onetcode=${encodeURIComponent(onet)}`;}

  function rows(){
    const q=String($('careerSearch')?.value||'').trim().toLowerCase();
    let list=catalog.filter(o=>represented(o.code));if(q)list=list.filter(o=>`${o.title} ${o.code}`.toLowerCase().includes(q));
    return list.map(o=>({...o,fit:overall(o)})).sort((a,b)=>b.fit-a.fit||Number(metric(b.code).annualOpenings||0)-Number(metric(a.code).annualOpenings||0)||a.title.localeCompare(b.title)).slice(0,q?80:24);
  }

  function renderResults(){
    if(!data||!state.geography)return;
    const host=$('careerGrid'),geo=data.geographies[state.geography],list=rows();if(!host)return;
    $('resultsSummary').textContent=`Showing ${list.length} occupations in ${geo?.label||state.geography}. Ranked by your clues, preferences, and local representation.`;
    host.innerHTML=list.length?list.map(o=>{const m=metric(o.code),saved=state.saved.includes(o.title);return`<article class="career-card ${saved?'saved':''}"><span class="code">${esc(o.code)}</span><h3>${esc(o.title)}</h3><div class="fit-row"><span class="fit-chip">${fitLabel(o.fit)}</span>${(o.interests||[]).slice(0,3).map(k=>`<span class="fit-chip">${esc(k)} • ${esc(RIASEC[k]||k)}</span>`).join('')}</div><div class="metrics"><div class="metric"><small>Typical entry</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div><div class="metric"><small>Median</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div><div class="metric"><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div><div class="metric"><small>Growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div></div><p>${esc(prepSummary(m))}</p><div class="card-actions"><button class="explore-btn" data-explore="${esc(o.code)}">Explore career</button><button class="save-btn" data-save="${esc(o.code)}">${saved?'Saved ✓':'Save'}</button></div></article>`}).join(''):'<div class="interest-empty"><strong>No occupations matched this search in the selected geography.</strong><p>Try a broader search or switch geography.</p></div>';
    host.querySelectorAll('[data-explore]').forEach(b=>b.onclick=()=>openCareer(b.dataset.explore));host.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>toggleSave(b.dataset.save));renderSaved();
  }

  function toggleSave(code){const o=catalog.find(x=>x.code===code);if(!o)return;const i=state.saved.indexOf(o.title);if(i>=0)state.saved.splice(i,1);else if(state.saved.length<MAX_SAVED)state.saved.push(o.title);else return alert(`Save up to ${MAX_SAVED} career possibilities.`);persist();renderResults();}
  function renderSaved(){const host=$('savedCareers');if(!host)return;host.innerHTML=state.saved.length?state.saved.map(t=>`<span class="saved-pill">${esc(t)}<button type="button" data-remove="${esc(t)}" aria-label="Remove ${esc(t)}">×</button></span>`).join(''):'<span class="source-note">No careers saved yet.</span>';host.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state.saved=state.saved.filter(t=>t!==b.dataset.remove);persist();renderResults();});}

  function openCareer(code){
    const o=catalog.find(x=>x.code===code);if(!o)return;const m=metric(code),geo=data.geographies[state.geography],dialog=$('careerDialog');if(!dialog)return;
    $('careerDialogContent').innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><span class="eyebrow">${esc(geo?.label||'LABOR MARKET')} • ${esc(code)}</span><h2>${esc(o.title)}</h2><p>${fitLabel(overall(o))} based on your current clues and preferences.</p></div><button class="dialog-close" type="button">Close</button></div><div class="dialog-grid"><section class="lmi-card"><span class="eyebrow">LABOR MARKET INFORMATION</span><div class="lmi-metrics"><div><small>Typical entry</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div><div><small>Median wage</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div><div><small>Highest earners</small><strong>${esc(fmtWage(m.experiencedHourly))}</strong></div><div><small>Employment</small><strong>${esc(fmtNumber(m.employment))}</strong></div><div><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div><div><small>Projected growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div></div><p><strong>Typical preparation:</strong> ${esc(prepSummary(m))}</p><div class="external-links"><a href="${esc(onetUrl(code))}" target="_blank" rel="noopener noreferrer">O*NET Occupation Profile ↗</a><a href="${esc(cosProfile(code,o.title))}" target="_blank" rel="noopener noreferrer">CareerOneStop Profile ↗</a></div><p class="source-note">Labor market data: ${esc(geo?.sourceLabel||'Lightcast')} • ${esc(geo?.projectionPeriod||data.projectionPeriod||'')}</p></section><section class="video-card"><span class="eyebrow">DAY IN THE LIFE</span><h3>CareerOneStop occupation video</h3><video controls preload="metadata" playsinline src="${esc(videoUrl(code))}"></video><p class="source-note">If the embedded video is unavailable, use the CareerOneStop profile link for available media and details.</p><button class="save-btn dialog-save" type="button">${state.saved.includes(o.title)?'Saved ✓':'Save this career'}</button></section></div></div>`;
    dialog.querySelector('.dialog-close').onclick=()=>dialog.close();dialog.querySelector('.dialog-save').onclick=()=>{toggleSave(code);dialog.close();};dialog.showModal();
  }

  async function init(){
    try{
      const response=await fetch(DATA_URL,{cache:'no-store'});if(!response.ok)throw new Error(`LMI data ${response.status}`);data=await response.json();
      if(data.sourceStatus!=='loaded'||!data.catalog||!Object.keys(data.catalog).length)throw new Error('Validated Lightcast snapshot is not loaded.');
      catalog=Object.entries(data.catalog).map(([code,row])=>({code,title:row.title||code,interests:Array.isArray(row.interests)?row.interests:[],typicalEducation:row.typicalEducation||'',typicalOjt:row.typicalOjt||''}));
      renderInterest();syncForm();renderGeo();renderResults();renderSaved();
      $('careerSearch')?.addEventListener('input',renderResults);
      $('careerDialog')?.addEventListener('click',e=>{if(e.target===$('careerDialog'))$('careerDialog').close();});
      const status=$('dataStatus');if(status)status.hidden=true;
    }catch(err){console.error('Explore Careers failed to initialize',err);const status=$('dataStatus');if(status){status.hidden=false;status.textContent='Explore Careers could not load the validated labor-market snapshot. Please refresh after deployment completes.';}const summary=$('resultsSummary');if(summary)summary.textContent='Labor-market data unavailable.';}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();