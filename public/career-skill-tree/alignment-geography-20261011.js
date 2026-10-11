(() => {
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const GEO_KEY='level-up-career-tree-geography-v1';
  const DATA_URL='data/lightcast-lmi.json';
  const AZ_KEYS=new Set(['pinal','coconino','apache','navajo','gila','az']);
  let lmiData=null;
  let filtering=false;

  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function readState(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}
    catch{return {}}
  }

  function readGeoKey(){
    try{return String(localStorage.getItem(GEO_KEY)||'').trim()}
    catch{return ''}
  }

  function writeGeoKey(geo){
    try{localStorage.setItem(GEO_KEY,geo||'')}
    catch(err){console.warn('Career Tree geography context could not be saved.',err)}
  }

  function writeState(state){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
    catch(err){console.warn('Career Tree geography could not be saved.',err)}
    const geo=readGeoKey()||state?.alignment?.geography||'';
    window.dispatchEvent(new CustomEvent('career-tree-geography-updated',{detail:{geography:geo}}));
  }

  function entryArea(state){
    const raw=String(localStorage.getItem('level-up-pending-county')||state?.profile?.county||'').trim();
    if(lmiData?.areas?.[raw])return raw;
    if(/pinal/i.test(raw))return 'Pinal';
    if(/northern|apache|coconino|navajo|gila/i.test(raw))return 'Northern';
    if(/eastern|ufo|new mexico|chaves|curry|de.?baca|eddy|guadalupe|harding|lea|lincoln|otero|quay|roosevelt|union/i.test(raw))return 'UFO - Eastern New Mexico';
    return '';
  }

  function allowedGeographies(state){
    const area=entryArea(state);
    const scoped=area?lmiData?.areas?.[area]:null;
    if(Array.isArray(scoped)&&scoped.length)return scoped.filter(k=>lmiData?.geographies?.[k]);
    return Object.keys(lmiData?.geographies||{});
  }

  function stateGeographyFor(key,state){
    const area=entryArea(state);
    if(area==='UFO - Eastern New Mexico')return 'nm';
    if(area==='Pinal'||area==='Northern')return 'az';
    return AZ_KEYS.has(key)?'az':'nm';
  }

  function defaultGeography(state,allowed){
    const area=entryArea(state);
    if(area==='Pinal'&&allowed.includes('pinal'))return 'pinal';
    if(area==='Northern'&&allowed.includes('coconino'))return 'coconino';
    if(area==='UFO - Eastern New Mexico'&&allowed.includes('chaves'))return 'chaves';
    if(allowed.includes('az'))return 'az';
    if(allowed.includes('nm'))return 'nm';
    return allowed[0]||'';
  }

  function ensureSharedGeography(state){
    state.alignment=state.alignment||{};
    state.lmi=state.lmi||{};
    state.lmi.explorer=state.lmi.explorer||{geography:'',viewed:[],saved:[],completed:false};
    const allowed=allowedGeographies(state);
    const keyed=readGeoKey();
    let geo=allowed.includes(keyed)?keyed:'';
    if(!geo)geo=allowed.includes(state.alignment.geography)?state.alignment.geography:'';
    if(!geo)geo=allowed.includes(state.lmi.explorer.geography)?state.lmi.explorer.geography:'';
    if(!geo)geo=defaultGeography(state,allowed);
    writeGeoKey(geo);
    state.alignment.geography=geo;
    state.alignment.geographyLabel=lmiData?.geographies?.[geo]?.label||geo;
    state.lmi.explorer.geography=geo;
    return geo;
  }

  function optionsHtml(state,current){
    const allowed=allowedGeographies(state);
    const rows=allowed.map(key=>({key,label:lmiData.geographies[key]?.label||key,state:AZ_KEYS.has(key)?'Arizona':'New Mexico'}));
    const states=[...new Set(rows.map(r=>r.state))];
    if(states.length===1)return rows.map(r=>`<option value="${esc(r.key)}" ${r.key===current?'selected':''}>${esc(r.label)}</option>`).join('');
    return states.map(group=>`<optgroup label="${group}">${rows.filter(r=>r.state===group).map(r=>`<option value="${esc(r.key)}" ${r.key===current?'selected':''}>${esc(r.label)}</option>`).join('')}</optgroup>`).join('');
  }

  function occupationCodeByTitle(title){
    const target=String(title||'').trim().toLowerCase();
    for(const [code,row] of Object.entries(lmiData?.catalog||{})){
      if(String(row?.title||'').trim().toLowerCase()===target)return code;
    }
    return '';
  }

  function representedLocally(title,geo){
    const code=occupationCodeByTitle(title);
    if(!code)return false;
    const metrics=lmiData?.geographies?.[geo]?.occupations?.[code];
    if(!metrics)return false;
    return [metrics.employment,metrics.annualOpenings,metrics.recentHires].some(v=>Number(v)>0);
  }

  function geographyPanel(){
    if(!lmiData)return;
    const form=$('#alignmentForm');
    const profile=$('.alignment-profile-panel');
    if(!form||!profile)return;
    const state=readState();
    const geo=ensureSharedGeography(state);
    writeState(state);
    let panel=$('#alignmentGeographyPanel');
    if(!panel){
      panel=document.createElement('section');
      panel.id='alignmentGeographyPanel';
      panel.className='alignment-geography-panel';
      profile.insertAdjacentElement('afterend',panel);
    }
    panel.innerHTML=`<div><span class="eyebrow">YOUR LABOR MARKET</span><h2>Where do you want to explore opportunities?</h2><p>Your O*NET interests and work preferences determine alignment. This location filters the results so the primary career possibilities are represented in the labor market you choose.</p></div><label for="alignmentGeography">State or county<select id="alignmentGeography">${optionsHtml(state,geo)}</select></label><div class="alignment-geo-context">📍 Exploring: <strong>${esc(lmiData.geographies[geo]?.label||geo)}</strong></div>`;
    const select=$('#alignmentGeography');
    if(select)select.onchange=()=>changeGeography(select.value);
  }

  function changeGeography(geo){
    const state=readState();
    const allowed=allowedGeographies(state);
    if(!allowed.includes(geo))return;
    const current=readGeoKey()||state.alignment?.geography||state.lmi?.explorer?.geography||'';
    if(current===geo)return;

    state.alignment=state.alignment||{};
    state.lmi=state.lmi||{};
    state.lmi.explorer=state.lmi.explorer||{};

    writeGeoKey(geo);
    state.alignment.geography=geo;
    state.alignment.geographyLabel=lmiData?.geographies?.[geo]?.label||geo;
    state.alignment.matches=[];
    state.alignment.selected=[];
    state.alignment.complete=false;
    state.lmi.explorer.geography=geo;
    state.lmi.explorer.saved=[];
    state.lmi.explorer.viewed=[];
    state.lmi.evidence={};
    state.lmi.complete=false;
    writeState(state);

    sessionStorage.removeItem('career-tree-lmi-active');
    const next=new URL(location.href);
    next.hash='alignment';
    next.searchParams.set('geo',geo);
    next.searchParams.set('v','20261011-geo2');
    location.replace(next.toString());
  }

  function summaryPanel(geo,removed){
    const cards=$('#careerCards');
    if(!cards)return;
    let summary=$('#alignmentGeoSummary');
    if(!summary){
      summary=document.createElement('div');
      summary.id='alignmentGeoSummary';
      summary.className='alignment-geo-summary';
      cards.insertAdjacentElement('beforebegin',summary);
    }
    const state=readState();
    const label=lmiData?.geographies?.[geo]?.label||geo;
    const stateGeo=stateGeographyFor(geo,state);
    const canBroaden=geo!==stateGeo&&lmiData?.geographies?.[stateGeo];
    summary.innerHTML=`<div><strong>📍 Showing opportunities represented in ${esc(label)}</strong><span>Interest Alignment still reflects your O*NET scores and work preferences. Location only determines which occupations are shown here.</span>${removed?`<small>${removed} otherwise-aligned ${removed===1?'occupation was':'occupations were'} not shown because this Lightcast snapshot did not report employment, openings, or recent hires in this market.</small>`:''}</div>${canBroaden?`<button type="button" class="secondary-btn" id="broadenAlignmentGeo">Explore ${esc(lmiData.geographies[stateGeo].label)} instead</button>`:''}`;
    $('#broadenAlignmentGeo')?.addEventListener('click',()=>changeGeography(stateGeo),{once:true});
  }

  function filterCareerCards(){
    if(filtering||!lmiData)return;
    const host=$('#careerCards');
    if(!host)return;
    const cards=[...host.querySelectorAll('.career-card')];
    if(!cards.length)return;
    filtering=true;
    try{
      const state=readState();
      const geo=ensureSharedGeography(state);
      writeState(state);
      let removed=0;
      cards.forEach(card=>{
        const title=card.querySelector('h3')?.textContent?.trim()||'';
        if(title&&!representedLocally(title,geo)){
          card.remove();
          removed+=1;
        }
      });
      summaryPanel(geo,removed);
      if(!host.querySelector('.career-card')){
        host.innerHTML='<div class="alignment-no-local"><strong>No primary matches were represented in this labor market.</strong><p>Try the statewide option to broaden the search, or change your preferences and build possibilities again.</p></div>';
      }
    }finally{filtering=false;}
  }

  function installCardObserver(){
    const host=$('#careerCards');
    if(!host||host.dataset.geoObserver==='1')return;
    host.dataset.geoObserver='1';
    const observer=new MutationObserver(mutations=>{
      if(filtering)return;
      if(mutations.some(m=>[...m.addedNodes].some(n=>n instanceof Element)))queueMicrotask(filterCareerCards);
    });
    observer.observe(host,{childList:true,subtree:false});
    filterCareerCards();
  }

  function installSharedLmiSync(){
    if(document.documentElement.dataset.geoSync==='1')return;
    document.documentElement.dataset.geoSync='1';
    document.addEventListener('change',event=>{
      if(event.target?.id!=='azGeo'||!lmiData)return;
      const geo=event.target.value;
      writeGeoKey(geo);
      setTimeout(()=>{
        const state=readState();
        state.alignment=state.alignment||{};
        state.alignment.geography=geo;
        state.alignment.geographyLabel=lmiData.geographies?.[geo]?.label||geo;
        state.lmi=state.lmi||{};
        state.lmi.explorer=state.lmi.explorer||{};
        state.lmi.explorer.geography=geo;
        writeState(state);
      },0);
    });
  }

  function addStyles(){
    if($('#alignment-geography-styles'))return;
    const style=document.createElement('style');
    style.id='alignment-geography-styles';
    style.textContent=`
      .alignment-geography-panel{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(240px,.55fr);gap:18px;align-items:end;margin:18px 0;padding:20px;border:1px solid rgba(85,214,255,.3);border-radius:20px;background:linear-gradient(135deg,rgba(18,48,78,.72),rgba(9,23,49,.9))}
      .alignment-geography-panel h2{margin:.25rem 0 .4rem;font-size:clamp(1.25rem,2vw,1.65rem)}.alignment-geography-panel p{margin:0;color:#b9c7df;line-height:1.5}.alignment-geography-panel label{display:grid;gap:7px;color:#dce9ff;font-weight:800}.alignment-geography-panel select{min-height:46px;border:1px solid #46618a;border-radius:12px;background:#07152e;color:#f2f6ff;padding:9px 12px}.alignment-geo-context{grid-column:1/-1;padding-top:2px;color:#a9bddc;font-size:.9rem}.alignment-geo-context strong{color:#65dcff}
      .alignment-geo-summary{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 16px;padding:14px 16px;border:1px solid rgba(91,214,255,.22);border-radius:15px;background:rgba(91,214,255,.06)}.alignment-geo-summary>div{display:grid;gap:3px}.alignment-geo-summary strong{color:#e9f8ff}.alignment-geo-summary span,.alignment-geo-summary small{color:#aebeda;line-height:1.4}.alignment-geo-summary small{font-size:.78rem}.alignment-no-local{grid-column:1/-1;padding:20px;border:1px dashed rgba(255,201,107,.5);border-radius:16px;background:rgba(255,201,107,.06)}.alignment-no-local p{color:#b9c7df;margin:.4rem 0 0}
      @media(max-width:760px){.alignment-geography-panel{grid-template-columns:1fr}.alignment-geo-summary{align-items:stretch;flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function install(){
    if(!lmiData)return;
    addStyles();
    geographyPanel();
    installCardObserver();
    installSharedLmiSync();
    setTimeout(filterCareerCards,0);
  }

  async function init(){
    try{
      const response=await fetch(DATA_URL,{cache:'no-store'});
      if(!response.ok)throw new Error(`Lightcast geography data request failed: ${response.status}`);
      lmiData=await response.json();
      if(lmiData.sourceStatus!=='loaded'||!lmiData.geographies)throw new Error('Lightcast geography snapshot is incomplete');
      install();
      window.addEventListener('hashchange',()=>setTimeout(install,50));
      window.addEventListener('career-tree-lmi-updated',()=>setTimeout(install,0));
    }catch(err){
      console.error('Career Alignment geography could not load.',err);
      const profile=$('.alignment-profile-panel');
      if(profile&&!$('#alignmentGeographyError'))profile.insertAdjacentHTML('afterend','<div id="alignmentGeographyError" class="alignment-no-local"><strong>Local labor-market data could not load.</strong><p>Refresh before building career possibilities so Career Tree does not show unverified local matches.</p></div>');
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
