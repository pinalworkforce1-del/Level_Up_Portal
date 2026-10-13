(()=>{
  const GEO_KEY='level-up-career-tree-geography-v1';
  const NEXT_KEY='level-up-career-tree-next-v1';
  const LEGACY_KEY='level-up-career-skill-tree-v1';
  const STATE_BY_GEO={
    pinal:'Arizona',coconino:'Arizona',apache:'Arizona',navajo:'Arizona',gila:'Arizona',az:'Arizona',
    chaves:'New Mexico',curry:'New Mexico','de-baca':'New Mexico',eddy:'New Mexico',guadalupe:'New Mexico',harding:'New Mexico',lea:'New Mexico',lincoln:'New Mexico',otero:'New Mexico',quay:'New Mexico',roosevelt:'New Mexico',union:'New Mexico',nm:'New Mexico'
  };

  function saveGeo(geo){
    if(!geo)return;
    try{localStorage.setItem(GEO_KEY,geo)}catch{}
    try{
      const next=JSON.parse(localStorage.getItem(NEXT_KEY)||'{}');
      next.exploreCareers={...(next.exploreCareers||{}),geography:geo,updatedAt:new Date().toISOString()};
      localStorage.setItem(NEXT_KEY,JSON.stringify(next));
    }catch{}
    try{
      const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'{}');
      legacy.alignment=legacy.alignment||{};
      legacy.alignment.geography=geo;
      localStorage.setItem(LEGACY_KEY,JSON.stringify(legacy));
    }catch{}
  }

  function isStatewide(value){return value==='az'||value==='nm'}

  function normalizeLabel(option){
    return String(option.textContent||'').replace(/\s+statewide$/i,' statewide').trim();
  }

  function sortGeographies(select){
    if(!select||select.dataset.sortingGeo==='1')return;
    const options=[...select.querySelectorAll('option')];
    if(!options.length)return;

    const selected=select.value;
    const rows=options.map(option=>({
      value:option.value,
      label:normalizeLabel(option),
      state:STATE_BY_GEO[option.value]||option.closest('optgroup')?.label||''
    })).filter(row=>row.state);
    if(!rows.length)return;

    select.dataset.sortingGeo='1';
    const stateOrder=['Arizona','New Mexico'];
    const states=[...new Set(rows.map(r=>r.state))].sort((a,b)=>{
      const ai=stateOrder.indexOf(a),bi=stateOrder.indexOf(b);
      if(ai>=0||bi>=0)return(ai<0?99:ai)-(bi<0?99:bi);
      return a.localeCompare(b);
    });

    select.innerHTML='';
    states.forEach(state=>{
      const group=document.createElement('optgroup');
      group.label=state;
      rows.filter(r=>r.state===state).sort((a,b)=>{
        if(isStatewide(a.value)!==isStatewide(b.value))return isStatewide(a.value)?1:-1;
        return a.label.localeCompare(b.label,undefined,{sensitivity:'base'});
      }).forEach(row=>{
        const option=document.createElement('option');
        option.value=row.value;
        option.textContent=row.label;
        group.appendChild(option);
      });
      select.appendChild(group);
    });
    if([...select.options].some(o=>o.value===selected))select.value=selected;
    delete select.dataset.sortingGeo;
  }

  function install(){
    const select=document.getElementById('geographySelect');
    if(!select)return false;

    sortGeographies(select);

    if(select.dataset.geoBridge!=='1'){
      select.dataset.geoBridge='1';
      // Save immediately, but deliberately do NOT reload the page.
      // The main Explore Careers onchange handler performs the in-place LMI rerender.
      select.addEventListener('change',()=>{
        const geo=String(select.value||'').trim();
        if(!geo)return;
        saveGeo(geo);
        const status=document.getElementById('resultsSummary');
        if(status)status.textContent='Updating labor market…';
        try{
          const url=new URL(location.href);
          url.searchParams.set('geo',geo);
          url.searchParams.delete('v');
          history.replaceState(null,'',url.pathname+url.search+url.hash);
        }catch{}
      },true);

      new MutationObserver(()=>queueMicrotask(()=>sortGeographies(select))).observe(select,{childList:true,subtree:true});
    }
    return true;
  }

  function start(){
    if(install())return;
    let tries=0;
    const timer=setInterval(()=>{tries++;if(install()||tries>50)clearInterval(timer)},100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();