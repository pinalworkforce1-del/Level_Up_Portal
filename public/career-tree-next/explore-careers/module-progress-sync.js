(() => {
  'use strict';
  const LEGACY_KEY='level-up-career-skill-tree-v1';
  const NEXT_KEY='level-up-career-tree-next-v1';
  const MODULE_ID='explore-careers';
  let last='';

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
  function workforceArea(){
    const legacy=read(LEGACY_KEY);
    const raw=String(localStorage.getItem('level-up-pending-county')||legacy?.profile?.county||'').trim();
    if(/pinal/i.test(raw))return 'Pinal';
    if(/northern|apache|coconino|navajo|gila/i.test(raw))return 'Northern';
    if(/eastern|ufo|new mexico|chaves|curry|de.?baca|eddy|guadalupe|harding|lea|lincoln|otero|quay|roosevelt|union/i.test(raw))return 'UFO - Eastern New Mexico';
    return '';
  }
  function normalize(){
    const legacy=read(LEGACY_KEY),next=read(NEXT_KEY);
    const current=next.exploreCareers||{};
    const reflections=current.reflections&&typeof current.reflections==='object'?Object.values(current.reflections):[];
    const savedCareers=Array.isArray(current.saved)?current.saved.slice(0,5):Array.isArray(legacy.alignment?.selected)?legacy.alignment.selected.slice(0,5):[];
    return {
      progress:{
        status:reflections.length>0?'complete':(savedCareers.length>0?'in_progress':'not_started'),
        careers_saved:savedCareers.length,
        occupations_reflected:reflections.length
      },
      preferences:{
        activity:current.activity||legacy.alignment?.style||'',
        preparation:current.prep||legacy.alignment?.training||'',
        environment:current.environment||legacy.alignment?.environment||'',
        people:current.people||legacy.alignment?.people||''
      },
      geography:{
        key:current.geography||legacy.alignment?.geography||localStorage.getItem('level-up-career-tree-geography-v1')||'',
        label:legacy.alignment?.geographyLabel||'',
        workforce_area:workforceArea()
      },
      saved_careers:savedCareers,
      occupation_reflections:reflections,
      interest_context:legacy.interest?.complete?{riasec_scores:legacy.interest.scores||{},top_3:Array.isArray(legacy.interest.top)?legacy.interest.top.slice(0,3):[]}:null
    };
  }
  function sync(){
    const data=normalize();
    const isComplete=data.occupation_reflections.length>0;
    const reflectedDates=data.occupation_reflections.map(item=>item?.savedAt).filter(Boolean).sort();
    const completedAt=isComplete?(reflectedDates[0]||new Date().toISOString()):null;
    const fingerprint=JSON.stringify({data,isComplete,completedAt});
    if(fingerprint===last)return;
    last=fingerprint;
    void window.LevelUpCareerTreeSync?.save(MODULE_ID,data,{xp:0,isComplete,completedAt});
  }
  sync();
  setInterval(sync,700);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sync();});
})();
