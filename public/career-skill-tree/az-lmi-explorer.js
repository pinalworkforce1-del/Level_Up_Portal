(() => {
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const DATA_URL='data/az-lmi.json';
  const OCC_URL='../assets/onet-core.json';
  const MAX_SAVED=5;
  const AREA_MAP={
    Realistic:'R',Investigative:'I',Artistic:'A',Social:'S',Enterprising:'E',Conventional:'C'
  };
  const REGION_BY_COUNTY={
    pinal:'Pinal County',coconino:'Coconino County',apache:'Apache County',navajo:'Navajo County',gila:'Gila County',az:'Arizona statewide'
  };
  let lmiData=null, occupations=[], state=null, mode='aligned', query='';

  function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
  function writeState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('career-tree-lmi-updated'));}
  function ensureState(){
    state=readState();
    state.alignment=state.alignment||{};
    state.alignment.selected=Array.isArray(state.alignment.selected)?state.alignment.selected:[];
    state.interest=state.interest||{};
    state.lmi=state.lmi||{};
    state.lmi.explorer=state.lmi.explorer||{geography:'pinal',viewed:[],saved:[],completed:false};
    state.lmi.explorer.saved=Array.isArray(state.lmi.explorer.saved)?state.lmi.explorer.saved:[];
    state.lmi.explorer.viewed=Array.isArray(state.lmi.explorer.viewed)?state.lmi.explorer.viewed:[];
  }
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const riasec=()=>Array.isArray(state?.interest?.top)?state.interest.top:[];
  function getOccCode(o){return o.code||o.onetsoc_code||o.onetSocCode||''}
  function getOccTitle(o){return o.title||''}
  function getOccDescription(o){return o.description||''}
  function getOccInterests(o){
    const raw=o.interests||o.interest_codes||o.riasec||o.interestCode||[];
    if(Array.isArray(raw))return raw.map(x=>AREA_MAP[x]||String(x).charAt(0).toUpperCase()).filter(Boolean);
    return String(raw||'').toUpperCase().replace(/[^RIASEC]/g,'').split('').filter(Boolean);
  }
  function fitScore(o){
    const top=riasec(), ints=getOccInterests(o); let score=0;
    top.forEach((r,i)=>{const pos=ints.indexOf(r);if(pos>=0)score+=(3-i)*5+(3-pos)});
    const title=getOccTitle(o).toLowerCase();
    const curated={electrician:'R',nurse:'S',teacher:'S',welder:'R',software:'I',support:'I',designer:'A',sales:'E',account:'C',logistic:'C',driver:'R',construction:'R'};
    Object.entries(curated).forEach(([k,v])=>{if(title.includes(k)&&top.includes(v))score+=4});
    return score;
  }
  function geographicOptions(){return Object.entries(lmiData?.geographies||{}).map(([k,v])=>`<option value="${esc(k)}" ${state.lmi.explorer.geography===k?'selected':''}>${esc(v.label)}</option>`).join('')}
  function savedTitles(){return [...new Set([...(state.alignment.selected||[]),...(state.lmi.explorer.saved||[])])].slice(0,MAX_SAVED)}
  function persistSaved(title){
    if(!title)return;
    const existing=savedTitles();
    if(existing.includes(title))return;
    if(existing.length>=MAX_SAVED){alert('Keep Career Tree focused: save up to five careers for deeper exploration.');return;}
    state.lmi.explorer.saved.push(title);
    if(!state.alignment.selected.includes(title))state.alignment.selected.push(title);
    state.lmi.evidence=state.lmi.evidence||{};
    state.lmi.evidence[title]=state.lmi.evidence[title]||{entry:'',median:'',outlook:'',openings:'',prep:'',source:'',takeaway:''};
    writeState();render();
  }
  function removeSaved(title){
    state.lmi.explorer.saved=(state.lmi.explorer.saved||[]).filter(t=>t!==title);
    state.alignment.selected=(state.alignment.selected||[]).filter(t=>t!==title);
    writeState();render();
  }
  function markViewed(code){if(code&&!state.lmi.explorer.viewed.includes(code)){state.lmi.explorer.viewed.push(code);writeState();}}
  function careerOneStopUrl(o){
    const code=getOccCode(o).split('.')[0];
    return `https://www.careeronestop.org/Videos/CareerVideos/career-videos.aspx?keyword=${encodeURIComponent(code||getOccTitle(o))}`;
  }
  function onetUrl(o){const code=getOccCode(o);return code?`https://www.onetonline.org/link/summary/${encodeURIComponent(code)}`:'https://www.onetonline.org/'}
  function sourceMetric(o, geo){
    const rec=lmiData?.geographies?.[geo]?.occupations?.[getOccCode(o)]||null;
    return rec||{};
  }
  function metric(v,suffix=''){return v===null||v===undefined||v===''?'Not loaded yet':`${v}${suffix}`}
  function results(){
    let pool=occupations.slice();
    const q=query.trim().toLowerCase();
    if(q)pool=pool.filter(o=>`${getOccTitle(o)} ${getOccDescription(o)} ${getOccCode(o)}`.toLowerCase().includes(q));
    if(mode==='aligned'&&riasec().length)pool=pool.map(o=>({...o,__score:fitScore(o)})).filter(o=>o.__score>0).sort((a,b)=>b.__score-a.__score||getOccTitle(a).localeCompare(getOccTitle(b)));
    else pool=pool.sort((a,b)=>getOccTitle(a).localeCompare(getOccTitle(b)));
    return pool.slice(0,36);
  }
  function card(o){
    const title=getOccTitle(o), saved=savedTitles().includes(title), ints=getOccInterests(o); const top=riasec();
    const fit=ints.filter(i=>top.includes(i));
    return `<article class="az-occ-card ${saved?'saved':''}"><div class="az-occ-code"><span>${esc(getOccCode(o)||'O*NET')}</span><span>${fit.length?`${esc(fit.join(''))} fit`:''}</span></div><h4>${esc(title)}</h4><p>${esc(getOccDescription(o)||'Explore this occupation, then compare local opportunity and preparation.')}</p><div class="az-occ-fit">${(ints.length?ints:top).slice(0,3).map(i=>`<span class="az-fit-pill">${esc(i)}</span>`).join('')}</div><div class="az-occ-actions"><button class="az-preview" data-preview="${esc(getOccCode(o))}" type="button">Explore LMI</button><button class="az-save ${saved?'saved':''}" data-save="${esc(title)}" type="button">${saved?'✓ Saved':'Save for Career Tree'}</button></div></article>`;
  }
  function detail(o){
    const geo=state.lmi.explorer.geography||'pinal', g=lmiData?.geographies?.[geo], m=sourceMetric(o,geo); markViewed(getOccCode(o));
    const wageSource=lmiData?.wageSource, projSource=lmiData?.projectionSource;
    return `<section class="az-lmi-detail"><div class="az-detail-grid"><article class="az-detail-card"><span class="eyebrow">${esc(g?.label||'Arizona')} • OCCUPATION SNAPSHOT</span><h3>${esc(getOccTitle(o))}</h3><div class="az-metrics"><div class="az-metric"><small>Employment</small><strong>${metric(m.employment)}</strong></div><div class="az-metric"><small>Median wage</small><strong>${metric(m.medianHourly?`$${m.medianHourly}/hr`:m.medianAnnual?`$${m.medianAnnual}/yr`:null)}</strong></div><div class="az-metric"><small>Projected growth</small><strong>${metric(m.growthPct,'%')}</strong></div><div class="az-metric"><small>Annual openings</small><strong>${metric(m.annualOpenings)}</strong></div></div><div class="az-source">${m.sourceLabel?esc(m.sourceLabel):`Occupation-level OEO values for ${esc(g?.label||'this geography')} are not yet loaded in this pilot. Career Tree will never substitute a broader number and label it as county-specific.`}</div><div class="az-links"><a href="${esc(onetUrl(o))}" target="_blank" rel="noopener">O*NET occupation profile ↗</a><a href="${esc(wageSource?.url||'#')}" target="_blank" rel="noopener">Arizona OEO wages ↗</a><a href="${esc(projSource?.url||'#')}" target="_blank" rel="noopener">Arizona OEO projections ↗</a></div></article><article class="az-detail-card az-video-wrap"><span class="eyebrow">SEE THE WORK</span><h4>CareerOneStop career video</h4><p>Use the occupation video library to see the work environment, tasks, and preparation in context.</p><div class="az-video-fallback">CareerOneStop videos are opened in a new tab so we do not break playback or licensing restrictions inside Career Tree.</div><div class="az-links"><a href="${esc(careerOneStopUrl(o))}" target="_blank" rel="noopener">Watch CareerOneStop video ↗</a></div></article></div></section>`;
  }
  function render(){
    ensureState(); const host=document.getElementById('azLmiExplorer'); if(!host||!lmiData)return;
    const top=riasec(), geo=lmiData.geographies?.[state.lmi.explorer.geography]||lmiData.geographies?.pinal;
    const saved=savedTitles(); const list=results();
    host.innerHTML=`<div class="az-lmi-head"><div><span class="eyebrow">ARIZONA • CAREER EXPLORATION LAB</span><h2>Find careers from your interests—or search anything.</h2><p>${top.length?`Your O*NET® interest clues are <b>${esc(top.join(''))}</b>. Start with occupations that connect to those interests, or switch to All Occupations and follow your curiosity.`:`Take the O*NET® Mini Interest Profiler for personalized suggestions, or search all occupations now.`}</p></div><div class="az-lmi-xp">LMI exploration • up to 200 XP</div></div><div class="az-lmi-controls"><div class="az-lmi-control"><span class="label">How should I explore?</span><div class="az-lmi-mode-row"><button class="az-lmi-mode ${mode==='aligned'?'active':''}" data-mode="aligned" type="button">Aligned with my O*NET</button><button class="az-lmi-mode ${mode==='all'?'active':''}" data-mode="all" type="button">All occupations</button></div><div class="az-lmi-riasec">${top.length?`Interest profile: ${esc(top.join(''))}`:'No O*NET profile saved yet.'}</div></div><div class="az-lmi-control"><label for="azGeo">Arizona geography</label><select id="azGeo">${geographicOptions()}</select><label for="azOccSearch" style="margin-top:10px">Search by occupation or keyword</label><input id="azOccSearch" value="${esc(query)}" placeholder="Example: electrician, nurse, IT support"></div></div><div class="az-lmi-saved"><div class="az-lmi-saved-head"><strong>Saved for Career Exploration</strong><span>${saved.length} / ${MAX_SAVED}</span></div><div class="az-lmi-saved-list">${saved.length?saved.map(t=>`<span class="az-lmi-chip">${esc(t)}<button data-remove="${esc(t)}" aria-label="Remove ${esc(t)}">×</button></span>`).join(''):'<span style="color:#9fb0ca">Save careers here, then investigate wages, demand, preparation, and videos.</span>'}</div></div><div class="az-lmi-results-head"><h3>${mode==='aligned'&&top.length?'Occupations aligned with your interest clues':'Browse occupations'}</h3><span>${list.length} shown • ${esc(geo?.label||'Arizona')}</span></div><div class="az-lmi-grid">${list.map(card).join('')}</div><div id="azLmiDetail"></div><div class="az-lmi-note"><b>Data integrity rule:</b> county wages/employment may be shown at county level when OEO publishes them. Growth/openings may use a broader workforce-area or statewide geography when that is the official available projection, and Career Tree will label that geography explicitly.</div><div class="az-lmi-footer"><p>Exploration is saved to your Career Tree. Dashboard wiring and the final 550-point Career Exploration XP model come next.</p><button id="azUseSaved" type="button" ${saved.length<3?'disabled':''}>Use saved careers in LMI Workbench →</button></div>`;
    host.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render()});
    const geoSel=document.getElementById('azGeo'); if(geoSel)geoSel.onchange=e=>{state.lmi.explorer.geography=e.target.value;writeState();render()};
    const search=document.getElementById('azOccSearch'); if(search)search.oninput=e=>{query=e.target.value;render()};
    host.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>persistSaved(b.dataset.save));
    host.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeSaved(b.dataset.remove));
    host.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>{const o=occupations.find(x=>getOccCode(x)===b.dataset.preview);if(o){document.getElementById('azLmiDetail').innerHTML=detail(o);document.getElementById('azLmiDetail').scrollIntoView({behavior:'smooth',block:'start'})}});
    const use=document.getElementById('azUseSaved'); if(use)use.onclick=()=>{document.querySelector('.lmi-workbench')?.scrollIntoView({behavior:'smooth',block:'start'})};
  }
  async function init(){
    const host=document.getElementById('azLmiExplorer'); if(!host)return;
    ensureState();
    try{
      const [lmiRes,occRes]=await Promise.all([fetch(DATA_URL,{cache:'no-store'}),fetch(OCC_URL,{cache:'no-store'})]);
      if(!lmiRes.ok||!occRes.ok)throw new Error('Career data unavailable');
      lmiData=await lmiRes.json(); const raw=await occRes.json(); occupations=raw.occupations||raw.row||raw||[];
      render();
    }catch(err){host.innerHTML=`<div class="az-lmi-note"><b>Career Explorer data could not load.</b> The manual LMI Workbench below is still available.</div>`;console.error(err)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('hashchange',()=>{if(location.hash==='#lmi')setTimeout(render,50)});
  window.addEventListener('career-tree-lmi-updated',()=>setTimeout(render,0));
})();
