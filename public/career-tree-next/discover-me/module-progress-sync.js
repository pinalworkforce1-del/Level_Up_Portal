(() => {
  'use strict';
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const MODULE_ID='discover-me';
  let last='';

  function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
  function normalize(){
    const interest=read().interest||{};
    const answers=interest.answers&&typeof interest.answers==='object'?interest.answers:{};
    return {
      riasec_scores:{R:Number(interest.scores?.R||0),I:Number(interest.scores?.I||0),A:Number(interest.scores?.A||0),S:Number(interest.scores?.S||0),E:Number(interest.scores?.E||0),C:Number(interest.scores?.C||0)},
      top_3:Array.isArray(interest.top)?interest.top.slice(0,3):[],
      answers:{...answers},
      answered_count:Object.values(answers).filter(v=>Number(v)>=1).length,
      completion_timestamp:interest.completedAt||null
    };
  }
  function complete(){return Boolean(read().interest?.complete)}
  function sync(){
    const data=normalize();
    const fingerprint=JSON.stringify({data,complete:complete()});
    if(fingerprint===last)return;
    last=fingerprint;
    void window.LevelUpCareerTreeSync?.save(MODULE_ID,data,{isComplete:complete(),completedAt:data.completion_timestamp});
  }
  sync();
  setInterval(sync,700);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sync();});
})();
