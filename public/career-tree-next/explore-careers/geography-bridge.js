(()=>{
  const GEO_KEY='level-up-career-tree-geography-v1';
  const NEXT_KEY='level-up-career-tree-next-v1';
  const LEGACY_KEY='level-up-career-skill-tree-v1';

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

  // Apply a geography supplied in the URL before the main app initializes.
  try{
    const requested=new URL(location.href).searchParams.get('geo');
    if(requested)saveGeo(requested);
  }catch{}

  function install(){
    const select=document.getElementById('geographySelect');
    if(!select||select.dataset.geoBridge==='1')return false;
    select.dataset.geoBridge='1';

    // Capture the change before any legacy/private handler can interfere.
    select.addEventListener('change',()=>{
      const geo=String(select.value||'').trim();
      if(!geo)return;
      saveGeo(geo);

      const status=document.getElementById('resultsSummary');
      if(status)status.textContent='Updating labor market…';

      const next=new URL(location.href);
      next.searchParams.set('geo',geo);
      next.searchParams.set('v','20261013-geo2');
      setTimeout(()=>location.replace(next.toString()),40);
    },true);
    return true;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
    if(install())return;
    let tries=0;
    const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer)},100);
  },{once:true});
  else if(!install()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer)},100);
  }
})();