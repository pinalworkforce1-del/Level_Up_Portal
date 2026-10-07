(() => {
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const DATA_URL='data/lightcast-lmi.json';
  const MAX_SAVED=5;
  let lmiData=null, occupations=[], state=null, mode='aligned', query='', activeCode='';

  function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
  function writeState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('career-tree-lmi-updated'));}
  function ensureState(){
    state=readState();
    state.alignment=state.alignment||{};
    state.alignment.selected=Array.isArray(state.alignment.selected)?state.alignment.selected:[];
    state.interest=state.interest||{};
    state.lmi=state.lmi||{};
    state.lmi.evidence=state.lmi.evidence||{};
    state.lmi.explorer=state.lmi.explorer||{geography:'',viewed:[],saved:[],completed:false};
    state.lmi.explorer.saved=Array.isArray(state.lmi.explorer.saved)?state.lmi.explorer.saved:[];
    state.lmi.explorer.viewed=Array.isArray(state.lmi.explorer.viewed)?state.lmi.explorer.viewed:[];
  }

  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const riasec=()=>Array.isArray(state?.interest?.top)?state.interest.top:[];
  const entryArea=()=>localStorage.getItem('level-up-pending-county')||state?.profile?.county||'';
  const getOccCode=o=>o?.code||'';
  const getOccTitle=o=>o?.title||getOccCode(o)||'Occupation';
  const getOccInterests=o=>Array.isArray(o?.interests)?o.interests.filter(x=>'RIASEC'.includes(x)):[];
  const savedTitles=()=>[...new Set([...(state.alignment.selected||[]),...(state.lmi.explorer.saved||[])])].slice(0,MAX_SAVED);

  function allowedGeoKeys(){
    const scoped=lmiData?.areas?.[entryArea()];
    if(Array.isArray(scoped)&&scoped.length)return scoped.filter(k=>lmiData?.geographies?.[k]);
    return Object.keys(lmiData?.geographies||{});
  }

  function normalizeGeography(){
    const allowed=allowedGeoKeys();
    if(!allowed.length)return '';
    if(!allowed.includes(state.lmi.explorer.geography))state.lmi.explorer.geography=allowed[0];
    return state.lmi.explorer.geography;
  }

  function geographicOptions(){
    const current=normalizeGeography();
    return allowedGeoKeys().map(k=>`<option value="${esc(k)}" ${current===k?'selected':''}>${esc(lmiData.geographies[k].label)}</option>`).join('');
  }

  function sourceMetric(o,geo){return lmiData?.geographies?.[geo]?.occupations?.[getOccCode(o)]||{}}

  function fmtNumber(v){
    if(v===null||v===undefined||v==='')return 'Not available';
    if(typeof v==='string')return v;
    const n=Number(v);
    return Number.isFinite(n)?Math.round(n).toLocaleString():'Not available';
  }
  function fmtWage(v){
    if(v===null||v===undefined||v==='')return 'Not available';
    if(typeof v==='string'&&!/^-?\d+(\.\d+)?$/.test(v))return v;
    const n=Number(v);
    return Number.isFinite(n)?`$${n.toFixed(2)}/hr`:'Not available';
  }
  function fmtGrowth(v){
    if(v===null||v===undefined||v==='')return 'Not available';
    if(typeof v==='string'&&!/^-?\d+(\.\d+)?$/.test(v))return v;
    const n=Number(v);
    return Number.isFinite(n)?`${n>0?'+':''}${n.toFixed(1)}%`:'Not available';
  }
  function prepText(m){
    return [
      m.typicalEducation?`Education: ${m.typicalEducation}`:'',
      m.workExperience&&m.workExperience!=='None'?`Experience: ${m.workExperience}`:'',
      m.typicalOjt&&m.typicalOjt!=='None'?`OJT: ${m.typicalOjt}`:''
    ].filter(Boolean).join(' • ')||'No preparation detail reported';
  }

  function evidenceFor(o,geo,existing={}){
    const m=sourceMetric(o,geo), g=lmiData.geographies[geo]||{};
    return {
      ...existing,
      soc:getOccCode(o),
      geography:geo,
      geographyLabel:g.label||geo,
      employment:fmtNumber(m.employment),
      entry:fmtWage(m.entryHourly),
      median:fmtWage(m.medianHourly),
      average:fmtWage(m.averageHourly),
      experienced:fmtWage(m.experiencedHourly),
      outlook:`${fmtGrowth(m.growthPct)} growth • ${g.projectionPeriod||lmiData.projectionPeriod||'2026–2035'}`,
      openings:fmtNumber(m.annualOpenings),
      recentHires:fmtNumber(m.recentHires),
      prep:prepText(m),
      education:m.typicalEducation||'Not available',
      ojt:m.typicalOjt||'Not available',
      workExperience:m.workExperience||'Not available',
      source:g.sourceLabel||`Lightcast ${lmiData.datarun||''} • ${g.label||geo}`,
      takeaway:existing?.takeaway||''
    };
  }

  function refreshEvidenceForSaved(){
    const geo=normalizeGeography();
    if(!geo)return;
    savedTitles().forEach(title=>{
      const o=occupations.find(x=>getOccTitle(x)===title);
      if(o)state.lmi.evidence[title]=evidenceFor(o,geo,state.lmi.evidence[title]||{});
    });
  }

  function persistSaved(code){
    const o=occupations.find(x=>getOccCode(x)===code);
    if(!o)return;
    const title=getOccTitle(o), existing=savedTitles();
    if(!existing.includes(title)&&existing.length>=MAX_SAVED){alert('Keep Career Tree focused: save up to five careers for deeper exploration.');return;}
    if(!state.lmi.explorer.saved.includes(title))state.lmi.explorer.saved.push(title);
    if(!state.alignment.selected.includes(title))state.alignment.selected.push(title);
    state.lmi.evidence[title]=evidenceFor(o,normalizeGeography(),state.lmi.evidence[title]||{});
    activeCode=code;
    writeState();
    render();
  }

  function removeSaved(title){
    state.lmi.explorer.saved=(state.lmi.explorer.saved||[]).filter(t=>t!==title);
    state.alignment.selected=(state.alignment.selected||[]).filter(t=>t!==title);
    delete state.lmi.evidence[title];
    writeState();
    render();
  }

  function markViewed(code){
    if(code&&!state.lmi.explorer.viewed.includes(code)){
      state.lmi.explorer.viewed.push(code);
      writeState();
    }
  }

  function saveReflection(title,value){
    state.lmi.evidence[title]=state.lmi.evidence[title]||{};
    state.lmi.evidence[title].takeaway=value;
    writeState();
    const status=document.getElementById('azReflectionStatus');
    if(status)status.textContent=value.trim()?'Saved automatically ✓':'Your reflection saves automatically.';
  }

  function careerOneStopUrl(o){return `https://www.careeronestop.org/Videos/CareerVideos/career-videos.aspx?keyword=${encodeURIComponent(getOccTitle(o))}`}
  function onetUrl(o){return `https://www.onetonline.org/link/summary/${encodeURIComponent(getOccCode(o))}`}

  function fitScore(o){
    const top=riasec(), ints=getOccInterests(o);
    let total=0;
    top.forEach((r,i)=>{const pos=ints.indexOf(r);if(pos>=0)total+=(3-i)*20+(3-pos)*6;});
    return total;
  }

  function results(){
    let pool=occupations.slice(), q=query.trim().toLowerCase();
    if(q)pool=pool.filter(o=>`${getOccTitle(o)} ${getOccCode(o)}`.toLowerCase().includes(q));
    if(mode==='aligned'&&riasec().length){
      pool=pool.map(o=>({...o,__score:fitScore(o)})).filter(o=>o.__score>0).sort((a,b)=>b.__score-a.__score||getOccTitle(a).localeCompare(getOccTitle(b)));
    }else pool.sort((a,b)=>getOccTitle(a).localeCompare(getOccTitle(b)));
    return pool.slice(0,60);
  }

  function card(o){
    const title=getOccTitle(o), saved=savedTitles().includes(title), ints=getOccInterests(o), top=riasec(), fit=ints.filter(i=>top.includes(i));
    return `<article class="az-occ-card ${saved?'saved':''}">
      <div class="az-occ-code"><span>${esc(getOccCode(o))}</span><span>${fit.length?`${esc(fit.join(''))} interest fit`:ints.length?esc(ints.join('')):'Explore'}</span></div>
      <h4>${esc(title)}</h4>
      <p>Compare this occupation with real local Lightcast wages, jobs, growth, openings, education, and on-the-job training.</p>
      <div class="az-occ-fit">${ints.map(i=>`<span class="az-fit-pill">${esc(i)}</span>`).join('')}</div>
      <div class="az-occ-actions">
        <button class="az-preview" data-preview="${esc(getOccCode(o))}" type="button">Explore LMI</button>
        <button class="az-save ${saved?'saved':''}" data-save="${esc(getOccCode(o))}" type="button">${saved?'✓ Saved':'Save for Career Tree'}</button>
      </div>
    </article>`;
  }

  function detail(o){
    const geo=normalizeGeography(), g=lmiData.geographies[geo]||{}, m=sourceMetric(o,geo), title=getOccTitle(o);
    markViewed(getOccCode(o));
    const saved=savedTitles().includes(title);
    if(saved)state.lmi.evidence[title]=evidenceFor(o,geo,state.lmi.evidence[title]||{});
    const e=state.lmi.evidence[title]||{};
    return `<section class="az-lmi-detail">
      <div class="az-detail-grid">
        <article class="az-detail-card">
          <span class="eyebrow">${esc(g.label||'LOCAL')} • LIGHTCAST OCCUPATION SNAPSHOT</span>
          <h3>${esc(title)}</h3>
          <div class="az-metrics">
            <div class="az-metric"><small>2026 employment</small><strong>${esc(fmtNumber(m.employment))}</strong></div>
            <div class="az-metric"><small>Lower wage • P25</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div>
            <div class="az-metric"><small>Median wage</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div>
            <div class="az-metric"><small>Experienced wage • P75</small><strong>${esc(fmtWage(m.experiencedHourly))}</strong></div>
            <div class="az-metric"><small>Projected growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div>
            <div class="az-metric"><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div>
            <div class="az-metric"><small>2025 hires</small><strong>${esc(fmtNumber(m.recentHires))}</strong></div>
            <div class="az-metric"><small>Average wage</small><strong>${esc(fmtWage(m.averageHourly))}</strong></div>
          </div>
          <div class="az-prep-grid">
            <div><small>Typical education</small><strong>${esc(m.typicalEducation||'Not available')}</strong></div>
            <div><small>Work experience</small><strong>${esc(m.workExperience||'None reported')}</strong></div>
            <div><small>Typical OJT</small><strong>${esc(m.typicalOjt||'None reported')}</strong></div>
          </div>
          <div class="az-source">${esc(g.sourceLabel||'Lightcast')} • projection period ${esc(g.projectionPeriod||lmiData.projectionPeriod||'2026–2035')}</div>
          <div class="az-links"><a href="${esc(onetUrl(o))}" target="_blank" rel="noopener">O*NET occupation profile ↗</a><a href="${esc(careerOneStopUrl(o))}" target="_blank" rel="noopener">CareerOneStop video ↗</a></div>
        </article>
        <article class="az-detail-card">
          <span class="eyebrow">MAKE THE DATA PERSONAL</span>
          <h4>What does this mean for me?</h4>
          <p>Think about the wages, number of jobs, openings, growth, and preparation. Does this career still feel worth exploring?</p>
          ${saved?`<textarea id="azReflection" class="az-reflection" placeholder="Example: The wage works for my goal, but I need to learn more about the apprenticeship path.">${esc(e.takeaway||'')}</textarea><div id="azReflectionStatus" class="az-reflection-status">${String(e.takeaway||'').trim()?'Saved automatically ✓':'Your reflection saves automatically.'}</div>`:`<button class="az-save" data-detail-save="${esc(getOccCode(o))}" type="button">Save this career to reflect →</button>`}
        </article>
      </div>
    </section>`;
  }

  function render(){
    ensureState();
    const host=document.getElementById('azLmiExplorer');
    if(!host||!lmiData)return;
    const geo=normalizeGeography(), g=lmiData.geographies[geo]||{}, top=riasec(), saved=savedTitles(), list=results();
    refreshEvidenceForSaved();
    host.innerHTML=`<div class="az-lmi-head"><div><span class="eyebrow">CAREER EXPLORATION • LIGHTCAST + O*NET</span><h2>Follow your interests. Then test them against the market.</h2><p>${top.length?`Your O*NET® interest clues are <b>${esc(top.join(''))}</b>. Start with aligned occupations, or switch to All Occupations and explore anything.`:`Search all occupations and compare real local labor-market evidence.`}</p></div><div class="az-lmi-xp">LMI exploration • 200 XP</div></div>
      <a class="az-lmi-life-plan" href="life-plan.html"><strong>Want to check what local wages could support?</strong><span>Build a Work + Life Plan →</span></a>
      <div class="az-lmi-controls">
        <div class="az-lmi-control"><span class="label">How should I explore?</span><div class="az-lmi-mode-row"><button class="az-lmi-mode ${mode==='aligned'?'active':''}" data-mode="aligned" type="button">Aligned with my O*NET</button><button class="az-lmi-mode ${mode==='all'?'active':''}" data-mode="all" type="button">All occupations</button></div><div class="az-lmi-riasec">${top.length?`Interest profile: ${esc(top.join(''))}`:'No interest profile saved yet.'}</div></div>
        <div class="az-lmi-control"><label for="azGeo">Geography</label><select id="azGeo">${geographicOptions()}</select><label for="azOccSearch" style="margin-top:10px">Search occupation or SOC</label><input id="azOccSearch" value="${esc(query)}" placeholder="Example: electrician, nurse, IT support"></div>
      </div>
      <div class="az-lmi-saved"><div class="az-lmi-saved-head"><strong>Saved for Career Exploration</strong><span>${saved.length} / ${MAX_SAVED}</span></div><div class="az-lmi-saved-list">${saved.length?saved.map(t=>`<span class="az-lmi-chip">${esc(t)}<button data-remove="${esc(t)}" aria-label="Remove ${esc(t)}">×</button></span>`).join(''):'<span style="color:#9fb0ca">Save careers, inspect the evidence, then explain what the data means to you.</span>'}</div></div>
      <div class="az-lmi-results-head"><h3>${mode==='aligned'&&top.length?'Occupations aligned with your interest clues':'Browse all occupations'}</h3><span>${list.length} shown • ${esc(g.label||'local area')}</span></div>
      <div class="az-lmi-grid">${list.map(card).join('')}</div>
      <div id="azLmiDetail">${activeCode?detail(occupations.find(x=>getOccCode(x)===activeCode)||{}):''}</div>
      <div class="az-lmi-note"><b>Data integrity:</b> every value shown stays attached to the geography in the Lightcast export. Career Tree never relabels statewide or another county's data as local.</div>
      <div class="az-lmi-footer"><p>Save at least three careers and add a reflection for each before building My Career Tree.</p><button id="azUseSaved" type="button" ${saved.length<3?'disabled':''}>Review my saved careers →</button></div>`;

    host.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;activeCode='';render()});
    const geoSel=document.getElementById('azGeo');
    if(geoSel)geoSel.onchange=e=>{state.lmi.explorer.geography=e.target.value;refreshEvidenceForSaved();writeState();render()};
    const search=document.getElementById('azOccSearch');
    if(search)search.oninput=e=>{query=e.target.value;activeCode='';render()};
    host.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>persistSaved(b.dataset.save));
    host.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeSaved(b.dataset.remove));
    host.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>{activeCode=b.dataset.preview;render();document.getElementById('azLmiDetail')?.scrollIntoView({behavior:'smooth',block:'start'})});
    host.querySelectorAll('[data-detail-save]').forEach(b=>b.onclick=()=>persistSaved(b.dataset.detailSave));
    const reflection=document.getElementById('azReflection');
    if(reflection){const o=occupations.find(x=>getOccCode(x)===activeCode);if(o)reflection.oninput=e=>saveReflection(getOccTitle(o),e.target.value)}
    const use=document.getElementById('azUseSaved');
    if(use)use.onclick=()=>document.querySelector('.lmi-workbench')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function init(){
    const host=document.getElementById('azLmiExplorer');
    if(!host)return;
    ensureState();
    try{
      const response=await fetch(DATA_URL,{cache:'no-store'});
      if(!response.ok)throw new Error(`Lightcast data request failed: ${response.status}`);
      lmiData=await response.json();
      if(lmiData.sourceStatus!=='loaded'||Number(lmiData.geographyCount)!==19)throw new Error('Lightcast snapshot is incomplete');
      occupations=Object.entries(lmiData.catalog||{}).map(([code,row])=>({code,title:row.title,interests:row.interests||[]}));
      if(occupations.length!==798)throw new Error(`Lightcast occupation catalog incomplete: ${occupations.length}`);
      render();
    }catch(err){
      host.innerHTML=`<div class="az-lmi-note"><b>Career Explorer data could not load.</b> Refresh the page. If this continues, tell your facilitator rather than entering substitute data.</div>`;
      console.error(err);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.addEventListener('hashchange',()=>{if(location.hash==='#lmi')setTimeout(render,50)});
  window.addEventListener('career-tree-lmi-updated',()=>setTimeout(render,0));
})();
