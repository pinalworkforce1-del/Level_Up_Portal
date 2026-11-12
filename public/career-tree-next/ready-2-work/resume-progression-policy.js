/* Level Up Ready 2 Work resume completion boundary.
   Resume District journey completion is independent of a saved résumé.
   Legacy resume_versions without explicit source never auto-complete Resume Rise. */
(function(root,factory){
 const policy=factory();
 if(typeof module==='object'&&module.exports)module.exports=policy;
 if(root)root.LevelUpResumeProgression=policy;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const credible=v=>{
  const d=v?.version_data||v||{};
  return typeof d.contact?.name==='string'&&!!d.contact.name.trim()
   &&Array.isArray(d.bullets)
   &&d.bullets.some(b=>typeof b==='string'?b.trim().length>15:
      typeof(b?.text||b?.bullet||b?.final)==='string'&&(b.text||b.bullet||b.final).trim().length>15);
 };
 const source=v=>{
  const d=v?.version_data||v||{};
  return d.levelUpResumeCompletionSource==='resume-rise'&&d.levelUpEntryPoint==='ready-2-work';
 };
 function resumeRiseComplete(rows=[],versions=[]){
  const progress=Array.isArray(rows)&&rows.some(x=>x?.module_id==='ready2work-resume-rise'&&x?.is_complete===true);
  const explicit=Array.isArray(versions)&&versions.some(v=>source(v)&&credible(v));
  return progress||explicit;
 }
 return {credible,source,resumeRiseComplete};
});
