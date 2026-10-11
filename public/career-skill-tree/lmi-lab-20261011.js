(() => {
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const GEO_KEY='level-up-career-tree-geography-v1';
  const DATA_URL='data/lightcast-lmi.json';
  const MAX_SAVED=5;
  let data=null;
  let mode='carried';
  let query='';
  let activeCode='';
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

  function evidenceFor(code,geo,existing={}){
    const o=occupation(code),m=metrics(code,geo),g=data.geographies[geo]||{};
    return {...existing,soc:code,geography:geo,geographyLabel:g.label||geo,employment:fmtNumber(m.employment),entry:fmtWage(m.entryHourly),median:fmtWage(m.medianHourly),average:fmtWage(m.averageHourly),experienced:fmtWage(m.experiencedHourly),outlook:`${fmtGrowth(m.growthPct)} growth • ${g.projectionPeriod||data.projectionPeriod||'2026–2035'}`,openings:fmtNumber(m.annualOpenings),recentHires:fmtNumber(m.recentHires),prep:prepText(m),education:m.typicalEducation||'Not available',ojt:m.typicalOjt||'Not available',workExperience:m.workExperience||'Not available',source:g.sourceLabel||`Lightcast ${data.datarun||''} • ${g.label||geo}`,takeaway:existing.takeaway||''};
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

  function listCodes(state,geo){
    let codes=mode==='carried'?carriedCodes(state,geo):availableCodes(geo);
    const q=query.trim().toLowerCase();
    if(q)codes=codes.filter(code=>`${occupation(code).title} ${code}`.toLowerCase().includes(q));
    return codes.slice(0,60);
  }

  function card(code,state,geo){
    const o=occupation(code),m=metrics(code,geo),saved=state.alignment.selected.includes(o.title);
    return `<article class="az-occ-card ${saved?'saved':''}">
      <div class="az-occ-code"><span>${esc(code)}</span><span>${esc(fmtNumber(m.employment))} jobs</span></div>
      <h4>${esc(o.title)}</h4>
      <p>${esc(data.geographies[geo]?.label||geo)} • Median ${esc(fmtWage(m.medianHourly))} • ${esc(fmtNumber(m.annualOpenings))} annual openings</p>
      <div class="az-occ-fit">${o.interests.map(i=>`<span class="az-fit-pill">${esc(i)}</span>`).join('')}</div>
      <div class="az-occ-actions">
        <button class="az-preview" data-lmi-preview="${esc(code)}" type="button">Review LMI</button>
        <button class="az-save ${saved?'saved':''}" data-lmi-save="${esc(code)}" type="button">${saved?'✓ In my careers':'Add to my careers'}</button>
      </div>
    </article>`;
  }

  function detail(code,state,geo){
    const o=occupation(code),m=metrics(code,geo),g=data.geographies[geo]||{},saved=state.alignment.selected.includes(o.title),e=state.lmi.evidence[o.title]||{};
    return `<section class="az-lmi-detail career-lmi-detail"><div class="az-detail-grid">
      <article class="az-detail-card"><span class="eyebrow">${esc(g.label||geo)} • LIGHTCAST OCCUPATION SNAPSHOT</span><h3>${esc(o.title)}</h3>
        <div class="az-metrics">
          <div class="az-metric"><small>2026 employment</small><strong>${esc(fmtNumber(m.employment))}</strong></div><div class="az-metric"><small>Lower wage • P25</small><strong>${esc(fmtWage(m.entryHourly))}</strong></div><div class="az-metric"><small>Median wage</small><strong>${esc(fmtWage(m.medianHourly))}</strong></div><div class="az-metric"><small>Experienced wage • P75</small><strong>${esc(fmtWage(m.experiencedHourly))}</strong></div><div class="az-metric"><small>Projected growth</small><strong>${esc(fmtGrowth(m.growthPct))}</strong></div><div class="az-metric"><small>Annual openings</small><strong>${esc(fmtNumber(m.annualOpenings))}</strong></div><div class="az-metric"><small>Recent hires</small><strong>${esc(fmtNumber(m.recentHires))}</strong></div><div class="az-metric"><small>Average wage</small><strong>${esc(fmtWage(m.averageHourly))}</strong></div>
        </div>
        <div class="az-prep-grid"><div><small>Typical education</small><strong>${esc(m.typicalEducation||'Not available')}</strong></div><div><small>Work experience</small><strong>${esc(m.workExperience||'None reported')}</strong></div><div><small>Typical OJT</small><strong>${esc(m.typicalOjt||'None reported')}</strong></div></div>
        <div class="az-source">${esc(g.sourceLabel||'Lightcast')} • projection period ${esc(g.projectionPeriod||data.projectionPeriod||'2026–2035')}</div>
      </article>
      <article class="az-detail-card"><span class="eyebrow">MAKE THE DATA PERSONAL</span><h4>What does this mean for me?</h4><p>Think about the wages, number of jobs, openings, growth, and preparation. Does this career still feel worth exploring?</p>${saved?`<textarea id="careerLmiReflection" class="az-reflection" placeholder="The wages, demand, preparation, or fit tell me...">${esc(e.takeaway||'')}</textarea><div id="careerLmiReflectionStatus" class="az-reflection-status">${String(e.takeaway||'').trim()?'Saved automatically ✓':'Your reflection saves automatically.'}</div>`:`<button class="az-save" data-lmi-save="${esc(code)}" type="button">Add this career to reflect →</button>`}</article>
    </div></section>`;
  }

  function updateProgress(){
    const visible=[['interest','viewInterest'],['alignment','viewAlignment'],['lmi','viewLmi'],['tree','viewTree']].find(([,id])=>{const el=document.getElementById(id);return el&&!el.hidden;});
    const key=visible?.[0]||location.hash.replace('#','');
    document.querySelectorAll('.career-progress-strip').forEach(strip=>{
      strip.querySelectorAll('[data-career-progress]').forEach(btn=>btn.classList.toggle('current',btn.dataset.careerProgress===key));
    });
  }

  function bind(host,state,geo){
    host.querySelectorAll('[data-lmi-mode]').forEach(btn=>btn.onclick=()=>{mode=btn.dataset.lmiMode;query='';activeCode='';render()});
    const search=$('#careerLmiSearch');if(search)search.oninput=e=>{query=e.target.value;activeCode='';render()};
    host.querySelectorAll('[data-lmi-preview]').forEach(btn=>btn.onclick=()=>{activeCode=btn.dataset.lmiPreview;render();$('#careerLmiDetail')?.scrollIntoView({behavior:'smooth',block:'start'})});
    host.querySelectorAll('[data-lmi-save]').forEach(btn=>btn.onclick=()=>{
      const code=btn.dataset.lmiSave,o=occupation(code),fresh=ensureState(readState());
      if(!fresh.alignment.selected.includes(o.title)){
        if(fresh.alignment.selected.length>=MAX_SAVED){alert('You already have five careers. Remove one from My Alignment Careers before adding another.');return;}
        fresh.alignment.selected.push(o.title);
      }
      fresh.lmi.explorer.saved=[...new Set([...(fresh.lmi.explorer.saved||[]),o.title])];
      fresh.lmi.evidence[o.title]=evidenceFor(code,geo,fresh.lmi.evidence[o.title]||{});
      writeState(fresh);mode='carried';activeCode=code;render();
    });
    host.querySelectorAll('[data-lmi-remove]').forEach(btn=>btn.onclick=()=>{
      const title=btn.dataset.lmiRemove,fresh=ensureState(readState());
      fresh.alignment.selected=fresh.alignment.selected.filter(t=>t!==title);
      fresh.lmi.explorer.saved=fresh.lmi.explorer.saved.filter(t=>t!==title);
      delete fresh.lmi.evidence[title];
      writeState(fresh);activeCode='';render();
    });
    const reflection=$('#careerLmiReflection');
    if(reflection&&activeCode){
      reflection.oninput=e=>{
        const fresh=ensureState(readState()),title=occupation(activeCode).title;
        fresh.lmi.evidence[title]=evidenceFor(activeCode,geo,fresh.lmi.evidence[title]||{});
        fresh.lmi.evidence[title].takeaway=e.target.value;
        writeState(fresh);
        const status=$('#careerLmiReflectionStatus');if(status)status.textContent=e.target.value.trim()?'Saved automatically ✓':'Your reflection saves automatically.';
      };
    }
  }

  function render(){
    if(!data)return;
    const view=$('#viewLmi');
    const old=$('#azLmiExplorer');
    if(!view||!old)return;
    updateProgress();
    const state=ensureState(readState()),geo=currentGeo(state),g=data.geographies[geo]||{};
    refreshEvidence(state,geo);writeState(state);
    let host=$('#careerLmiLab');
    if(!host){host=document.createElement('div');host.id='careerLmiLab';host.className='az-lmi-explorer career-lmi-lab';old.insertAdjacentElement('beforebegin',host)}
    old.hidden=true;
    const saved=state.alignment.selected.slice(0,MAX_SAVED),codes=listCodes(state,geo);
    const label=g.label||geo;
    host.innerHTML=`<div class="az-lmi-head"><div><span class="eyebrow">STAGE 3 • LMI LAB</span><h2>Test your career possibilities against the market.</h2><p>You brought <b>${saved.length}</b> ${saved.length===1?'career':'careers'} from Career Alignment. Review those first, or browse occupations that are actually represented in <b>${esc(label)}</b>.</p></div><div class="az-lmi-xp">LMI exploration • 200 XP</div></div>
      <div class="career-lmi-context"><span>📍 Labor market: <strong>${esc(label)}</strong></span><button type="button" id="careerLmiChangeGeo">Change in Career Alignment</button></div>
      <div class="az-lmi-controls"><div class="az-lmi-control"><span class="label">What do you want to explore?</span><div class="az-lmi-mode-row"><button class="az-lmi-mode ${mode==='carried'?'active':''}" data-lmi-mode="carried" type="button">My Alignment Careers (${saved.length})</button><button class="az-lmi-mode ${mode==='available'?'active':''}" data-lmi-mode="available" type="button">Available in ${esc(label)}</button></div></div><div class="az-lmi-control"><label for="careerLmiSearch">Search this list</label><input id="careerLmiSearch" value="${esc(query)}" placeholder="Occupation or SOC"></div></div>
      <div class="az-lmi-saved"><div class="az-lmi-saved-head"><strong>My careers</strong><span>${saved.length} / ${MAX_SAVED}</span></div><div class="az-lmi-saved-list">${saved.length?saved.map(t=>`<span class="az-lmi-chip">${esc(t)}<button type="button" data-lmi-remove="${esc(t)}" aria-label="Remove ${esc(t)}">×</button></span>`).join(''):'<span style="color:#9fb0ca">No careers carried forward yet. Browse the local market and add careers you want to investigate.</span>'}</div></div>
      <div class="az-lmi-results-head"><h3>${mode==='carried'?'Careers carried forward from Alignment':`Occupations represented in ${esc(label)}`}</h3><span>${codes.length} shown${mode==='available'?' • ranked by local openings':''}</span></div>
      <div class="az-lmi-grid">${codes.length?codes.map(code=>card(code,state,geo)).join(''):`<div class="career-lmi-empty"><strong>${mode==='carried'?'No carried careers match this market.':'No occupations match this search.'}</strong><p>${mode==='carried'?'Return to Career Alignment or browse the local market here.':'Try a broader search term.'}</p></div>`}</div>
      <div id="careerLmiDetail">${activeCode?detail(activeCode,state,geo):''}</div>
      <div class="az-lmi-note"><b>Location rule:</b> this list only includes occupations with employment, annual openings, or recent hires reported in the selected Lightcast market. Your Interest Alignment score is not recalculated here.</div>`;
    $('#careerLmiChangeGeo')?.addEventListener('click',()=>{location.hash='#alignment';setTimeout(updateProgress,25)});
    bind(host,state,geo);
  }

  function addStyles(){
    if($('#career-lmi-lab-styles'))return;
    const style=document.createElement('style');style.id='career-lmi-lab-styles';style.textContent=`
      .career-lmi-context{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0;padding:12px 14px;border:1px solid rgba(85,214,255,.22);border-radius:14px;background:rgba(85,214,255,.06);color:#bcd0eb}.career-lmi-context strong{color:#6bdcff}.career-lmi-context button{border:0;background:transparent;color:#82dcff;font-weight:800;cursor:pointer}.career-lmi-empty{grid-column:1/-1;padding:18px;border:1px dashed rgba(120,155,215,.35);border-radius:14px;color:#dce8fa}.career-lmi-empty p{margin:.35rem 0 0;color:#9fb0ca}.career-progress-step.current{border-color:#55d6ff!important;box-shadow:0 0 0 1px rgba(85,214,255,.22)}
      @media(max-width:700px){.career-lmi-context{align-items:flex-start;flex-direction:column}}
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