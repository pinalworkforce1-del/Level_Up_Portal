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
      saved:[...new Set(Array.isArray(savedNext)?savedNext:(legacy.alignment?.selected||[]))].slice(0,MAX_SAVED),
      reflections:(next.exploreCareers?.reflections&&typeof next.exploreCareers.reflections==='object')?next.exploreCareers.reflections:{}
    };
  }
  const state=readState();

  function persist(){
    try{
      const next=readJson(NEXT_KEY);
      next.exploreCareers={...(next.exploreCareers||{}),activity:state.activity,prep:state.prep,environment:state.environment,people:state.people,geography:state.geography,saved:state.saved,reflections:state.reflections,updatedAt:new Date().toISOString()};
      localStorage.setItem(NEXT_KEY,JSON.stringify(next));localStorage.setItem(GEO_KEY,state.geography||'');
    }catch{}
    try{
      const legacy=readJson(LEGACY_KEY);legacy.alignment=legacy.alignment||{};
      legacy.alignment.geography=state.geography;
      legacy.alignment.geographyLabel=data?.geographies?.[state.geography]?.label||state.geography;
      legacy.alignment.selected=state.saved.slice();
      legacy.alignment.explorations=state.reflections;
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
  function allowedGeos(){const all=Object.keys(data?.geographies||{});if(showAll)return all;const scoped=data?.areas?.[areaFromContext()];return Array.isArray(scoped)&&scoped.length?scoped:all;}
  function defaultGeo(){const allowed=allowedGeos();if(state.geography&&allowed.includes(state.geography))return state.geography;const area=areaFromContext();if(area==='Pinal'&&allowed.includes('pinal'))return'pinal';if(area==='Northern'&&allowed.includes('coconino'))return'coconino';if(area==='UFO - Eastern New Mexico'&&allowed.includes('chaves'))return'chaves';return allowed.find(k=>STATE_META[k]?.[1])||allowed[0]||'';}

  function renderInterest(){
    const host=$('interestContent');if(!host)return;const scores=state.interest?.scores||{},top=Array.isArray(state.interest?.top)?state.interest.top:[];
    if(!state.interest?.complete||!top.length){host.innerHTML='<div class="interest-empty"><strong>O*NET interest clues are optional here.</strong><p>You can continue with work preferences and geography now, or complete Discover Me first so those scores can help rank occupations.</p></div>';return;}
    host.innerHTML=`<div class="interest-summary"><div class="interest-code"><span class="eyebrow">YOUR PROFILE</span><strong>${esc(top.join(''))} • ${esc(top.map(k=>RIASEC[k]||k).join(' + '))}</strong><p>These scores are clues, not commands. Explore Careers combines them with your preferences and labor market.</p></div><div class="riasec-bars">${Object.keys(RIASEC).map(k=>{const v=Math.max(0,Math.min(20,Number(scores[k]||0)));return`<div class="riasec-row"><strong>${k} • ${RIASEC[k]}</strong><div class="bar"><i style="width:${v/20*100}%"></i></div><span>${v}/20</span></div>`}).join('')}</div></div>`;
  }

  function syncForm(){
    ['activity','prep','environment','people'].forEach(name=>{const value=state[name];if(!value)return;const input=document.querySelector(`input[name="${name}"][value="${value}"]`);if(input)input.checked=true;});
    $('preferencesForm')?.addEventListener('change',()=>{const fd=new FormData($('preferencesForm'));['activity','prep','environment','people'].forEach(k=>state[k]=String(fd.get(k)||''));persist();renderResults();});
  }

  function renderGeo(){
    const select=$('geographySelect');if(!select)return;state.geography=defaultGeo();
    const rows=allowedGeos().map(key=>({key,label:data.geographies[key]?.label||key,state:STATE_META[key]?.[0]||'Other',statewide:Boolean(STATE_META[key]?.[1])}));
    const order=['Arizona','New Mexico'];const states=[...new Set(rows.map(r=>r.state))].sort((a,b)=>{const ai=order.indexOf(a),bi=order.indexOf(b);if(ai>=0||bi>=0)return(ai<0?99:ai)-(bi<0?99:bi);return a.localeCompare(b);});
    select.innerHTML=states.map(st=>`<optgroup label="${esc(st)}">${rows.filter(r=>r.state===st).sort((a,b)=>a.statewide!==b.statewide?(a.statewide?1:-1):a.label.localeCompare(b.label)).map(r=>`<option value="${esc(r.key)}" ${r.key===state.geography?'selected':''}>${esc(r.label)}</option>`).join('')}</optgroup>`).join('');
    select.onchange=()=>{state.geography=select.value;persist();renderResults();};
    const toggle=$('showAllGeographies');if(toggle){toggle.textContent=showAll?'Use my workforce area':'Show all available geographies';toggle.onclick=()=>{showAll=!showAll;renderGeo();renderResults();};}persist();
  }

  function prepFit(meta){if(!state.prep||state.prep==='open')return.5;const t=`${meta.typicalEducation||''} ${meta.typicalOjt||''}`.toLowerCase();const rank=/no formal|high school|short-term/.test(t)?1:/postsecondary nondegree|certificate|moderate-term|associate/.test(t)?2:/bachelor|long-term|apprentice/.test(t)?3:/master|doctoral|professional/.test(t)?4:2;const target=state.prep==='short'?1:state.prep==='mid'?2:4;return Math.max(0,1-Math.abs(rank-target)/3);}
  function textSignal(title,map,key){if(!key||key==='open')return.5;const lower=title.toLowerCase();return(map[key]||[]).some(t=>lower.includes(t))?1:.35;}
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
  function reflectionKey(code,geoKey=state.geography){return`${geoKey}|${code}`;}

  function rows(){
    const q=String($('careerSearch')?.value||'').trim().toLowerCase();let list=catalog.filter(o=>represented(o.code));if(q)list=list.filter(o=>`${o.title} ${o.code}`.toLowerCase().includes(q));
    return list.map(o=>({...o,fit:overall(o)})).sort((a,b)=>b.fit-a.fit||Number(metric(b.code).annualOpenings||0)-Number(metric(a.code).annualOpenings||0)||a.title.localeCompare(b.title)).slice(0,q?80:24);
  }

  function renderResults(){
    if(!data||!state.geography)return;const host=$('careerGrid'),geo=data.geographies[state.geography],list=rows();if(!host)return;
    $('resultsSummary').textContent=`Showing ${list.length} occupations in ${geo?.label||state.geography}. Ranked by your clues, preferences, and local representation.`;
    host.innerHTML=list.length?list.map(o=>{const m=metric(o.code),saved=state.saved.includes(o.title),reflected=Boolean(state.reflections[reflectionKey(o.code)]?.savedAt);return`<article class="career-card ${saved?'saved':''}"><span class="code">${esc(o.code)}</span><h3>${esc(o.title)}</h3><div class="fit-row"><span class="fit-chip">${fitLabel(o.fit)}</span>${reflected?'<span class="fit-chip">Explored ✓</span>':''}${(o.interests||[]).slice(0,3).map(k=>`<span class="fit-chip">${esc(k)} • ${esc(RIASEC[k]||k)}</span>`).join('')}</div><div class="metrics"><div class="metric"><small>Typical entry</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div><div class="metric"><small>Median</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div><div class="metric"><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div><div class="metric"><small>Growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div></div><p>${esc(prepSummary(m))}</p><div class="card-actions"><button class="explore-btn" data-explore="${esc(o.code)}">${reflected?'Review exploration':'Explore career'}</button><button class="save-btn" data-save="${esc(o.code)}">${saved?'Saved ✓':'Save'}</button></div></article>`}).join(''):'<div class="interest-empty"><strong>No occupations matched this search in the selected geography.</strong><p>Try a broader search or switch geography.</p></div>';
    host.querySelectorAll('[data-explore]').forEach(b=>b.onclick=()=>openCareer(b.dataset.explore));host.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>toggleSave(b.dataset.save));renderSaved();
  }

  function toggleSave(code){const o=catalog.find(x=>x.code===code);if(!o)return;const i=state.saved.indexOf(o.title);if(i>=0)state.saved.splice(i,1);else if(state.saved.length<MAX_SAVED)state.saved.push(o.title);else return alert(`Save up to ${MAX_SAVED} career possibilities.`);persist();renderResults();}
  function renderSaved(){const host=$('savedCareers');if(!host)return;host.innerHTML=state.saved.length?state.saved.map(t=>`<span class="saved-pill">${esc(t)}<button type="button" data-remove="${esc(t)}" aria-label="Remove ${esc(t)}">×</button></span>`).join(''):'<span class="source-note">No careers saved yet.</span>';host.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state.saved=state.saved.filter(t=>t!==b.dataset.remove);persist();renderResults();});}

  function choice(name,value,label,current){return`<label class="reflection-choice"><input type="radio" name="${esc(name)}" value="${esc(value)}" ${current===value?'checked':''}><span>${esc(label)}</span></label>`;}
  function reflectionAnswers(dialog){
    const form=dialog.querySelector('#careerReflectionForm');if(!form)return{};const fd=new FormData(form);
    return {picture:String(fd.get('picture')||''),commitment:String(fd.get('commitment')||''),wages:String(fd.get('wages')||''),opportunity:String(fd.get('opportunity')||''),notes:String(fd.get('notes')||'').trim()};
  }
  function saveReflection(code,o,m,geo,dialog){
    const answers=reflectionAnswers(dialog);const key=reflectionKey(code);
    state.reflections[key]={
      version:1,code,title:o.title,geographyKey:state.geography,geographyLabel:geo?.label||state.geography,fitLabel:fitLabel(overall(o)),savedAt:new Date().toISOString(),
      snapshot:{entryHourly:m.entryHourly??null,medianHourly:m.medianHourly??null,experiencedHourly:m.experiencedHourly??null,employment:m.employment??null,annualOpenings:m.annualOpenings??null,growthPct:m.growthPct??null,typicalEducation:m.typicalEducation||'',typicalOjt:m.typicalOjt||'',preparation:prepSummary(m)},
      answers
    };
    persist();renderResults();
    const msg=dialog.querySelector('#reflectionStatus');if(msg){msg.textContent='Exploration saved ✓';msg.classList.add('saved');}
  }
  function answerLabel(group,value){
    const maps={picture:{yes:'Yes',maybe:'Maybe',no:'No'},commitment:{now:'Yes, now',future:'Maybe in the future',unsure:"I'm not sure",no:'No'},wages:{higher:'Higher than expected',expected:'About what I expected',lower:'Lower than expected',unsure:"I wasn't sure what to expect"},opportunity:{more:'More interested',same:'About the same',less:'Less interested',unsure:"I'm not sure yet"}};
    return maps[group]?.[value]||'Not answered';
  }
  function printReflection(record){
    if(!record)return;const w=window.open('','_blank','width=860,height=900');if(!w)return alert('Please allow pop-ups to print or save this exploration.');
    const s=record.snapshot||{},a=record.answers||{};
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(record.title)} - Career Exploration</title><style>body{font-family:Arial,sans-serif;color:#13203a;margin:38px;line-height:1.45}h1{margin-bottom:4px}h2{margin-top:28px;border-bottom:2px solid #d8e3f0;padding-bottom:6px}.meta{color:#52647c}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.box{border:1px solid #ccd8e7;border-radius:10px;padding:10px}.q{margin:16px 0}.q b{display:block;margin-bottom:4px}.notes{white-space:pre-wrap;border:1px solid #ccd8e7;border-radius:10px;padding:12px;min-height:80px}@media print{button{display:none}}</style></head><body><h1>${esc(record.title)}</h1><div class="meta">${esc(record.geographyLabel)} • ${esc(record.code)} • Saved ${esc(new Date(record.savedAt).toLocaleString())}</div><h2>Labor Market Snapshot</h2><div class="grid"><div class="box"><b>Typical entry</b><br>${esc(fmtWage(s.entryHourly))}</div><div class="box"><b>Median wage</b><br>${esc(fmtWage(s.medianHourly))}</div><div class="box"><b>Highest earners</b><br>${esc(fmtWage(s.experiencedHourly))}</div><div class="box"><b>Employment</b><br>${esc(fmtNumber(s.employment))}</div><div class="box"><b>Annual openings</b><br>${esc(fmtNumber(s.annualOpenings))}</div><div class="box"><b>Projected growth</b><br>${esc(fmtGrowth(s.growthPct))}</div></div><p><b>Typical preparation:</b> ${esc(s.preparation||'Not available')}</p><h2>Career Exploration Reflection</h2><div class="q"><b>Can you see yourself doing this job?</b>${esc(answerLabel('picture',a.picture))}</div><div class="q"><b>Are you willing to commit the typical amount of time to training/career preparation?</b>${esc(answerLabel('commitment',a.commitment))}</div><div class="q"><b>How did the wages compare with what you expected?</b>${esc(answerLabel('wages',a.wages))}</div><div class="q"><b>How did the local labor market affect your interest?</b>${esc(answerLabel('opportunity',a.opportunity))}</div><div class="q"><b>Notes for your career coach</b><div class="notes">${esc(a.notes||'No notes entered.')}</div></div><button onclick="window.print()">Print / Save PDF</button><script>setTimeout(()=>window.print(),250)<\/script></body></html>`);w.document.close();
  }

  function openCareer(code){
    const o=catalog.find(x=>x.code===code);if(!o)return;const m=metric(code),geo=data.geographies[state.geography],dialog=$('careerDialog');if(!dialog)return;
    const existing=state.reflections[reflectionKey(code)]||{};const a=existing.answers||{};
    $('careerDialogContent').innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><span class="eyebrow">${esc(geo?.label||'LABOR MARKET')} • ${esc(code)}</span><h2>${esc(o.title)}</h2><p>${fitLabel(overall(o))} based on your current clues and preferences.</p></div><button class="dialog-close" type="button">Close</button></div><div class="dialog-grid"><section class="lmi-card"><span class="eyebrow">LABOR MARKET INFORMATION</span><div class="lmi-metrics"><div><small>Typical entry</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div><div><small>Median wage</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div><div><small>Highest earners</small><strong>${esc(fmtWage(m.experiencedHourly))}</strong></div><div><small>Employment</small><strong>${esc(fmtNumber(m.employment))}</strong></div><div><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div><div><small>Projected growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div></div><p><strong>Typical preparation:</strong> ${esc(prepSummary(m))}</p><div class="external-links"><a href="${esc(onetUrl(code))}" target="_blank" rel="noopener noreferrer">O*NET Occupation Profile ↗</a><a href="${esc(cosProfile(code,o.title))}" target="_blank" rel="noopener noreferrer">CareerOneStop Profile ↗</a></div><p class="source-note">Labor market data: ${esc(geo?.sourceLabel||'Lightcast')} • ${esc(geo?.projectionPeriod||data.projectionPeriod||'')}</p></section><section class="video-card"><span class="eyebrow">DAY IN THE LIFE</span><h3>CareerOneStop occupation video</h3><video controls preload="metadata" playsinline src="${esc(videoUrl(code))}"></video><p class="source-note">If the embedded video is unavailable, use the CareerOneStop profile link for available media and details.</p><button class="save-btn dialog-save" type="button">${state.saved.includes(o.title)?'Saved ✓':'Save this career'}</button></section></div>
      <section class="reflection-card"><div class="reflection-head"><div><span class="eyebrow">CAREER EXPLORATION REFLECTION</span><h3>What did you learn about this career?</h3><p>Use the career video and labor-market information above. Your responses stay with this occupation and can be reviewed with your career coach.</p></div>${existing.savedAt?'<span class="reflection-saved-badge">Saved ✓</span>':''}</div>
      <form id="careerReflectionForm" class="reflection-form">
        <fieldset><legend>1. After watching the career video, can you see yourself doing this job?</legend><div class="reflection-options">${choice('picture','yes','Yes',a.picture)}${choice('picture','maybe','Maybe',a.picture)}${choice('picture','no','No',a.picture)}</div></fieldset>
        <fieldset><legend>2. Looking at the typical preparation, are you willing to commit that amount of time to training or career preparation?</legend><div class="reflection-options">${choice('commitment','now','Yes, now',a.commitment)}${choice('commitment','future','Maybe in the future',a.commitment)}${choice('commitment','unsure',"I'm not sure",a.commitment)}${choice('commitment','no','No',a.commitment)}</div></fieldset>
        <fieldset><legend>3. Are the wages higher or lower than what you expected?</legend><div class="reflection-options">${choice('wages','higher','Higher than expected',a.wages)}${choice('wages','expected','About what I expected',a.wages)}${choice('wages','lower','Lower than expected',a.wages)}${choice('wages','unsure',"I wasn't sure what to expect",a.wages)}</div></fieldset>
        <fieldset><legend>4. After seeing the local employment, openings, and projected growth, how does that affect your interest in this career?</legend><div class="reflection-options">${choice('opportunity','more','More interested',a.opportunity)}${choice('opportunity','same','About the same',a.opportunity)}${choice('opportunity','less','Less interested',a.opportunity)}${choice('opportunity','unsure',"I'm not sure yet",a.opportunity)}</div></fieldset>
        <label class="reflection-notes"><b>5. Any notes you would like to discuss with your career coach?</b><textarea name="notes" rows="4" placeholder="Questions, concerns, what interested you, or what you want to learn next…">${esc(a.notes||'')}</textarea></label>
        <div class="reflection-actions"><button type="button" class="explore-btn reflection-save">Save Exploration</button><button type="button" class="save-btn reflection-print" ${existing.savedAt?'':'disabled'}>Print / Save PDF</button><span id="reflectionStatus" class="reflection-status">${existing.savedAt?`Last saved ${esc(new Date(existing.savedAt).toLocaleString())}`:'Not saved yet'}</span></div>
      </form></section></div>`;

    dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
    dialog.querySelector('.dialog-save').onclick=()=>{toggleSave(code);dialog.close();};
    dialog.querySelector('.reflection-save').onclick=()=>{saveReflection(code,o,m,geo,dialog);const print=dialog.querySelector('.reflection-print');if(print)print.disabled=false;};
    dialog.querySelector('.reflection-print').onclick=()=>{const current=state.reflections[reflectionKey(code)];if(current)printReflection(current);};
    dialog.showModal();
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