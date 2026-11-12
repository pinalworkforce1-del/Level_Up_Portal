/* Level Up Ready 2 Work resume completion boundary.
   Resume District journey completion is independent of a saved résumé.
   Pre-migration credible résumé versions retain historical eligibility without relabeling\n   their source; all NEW résumé completions require explicit pathway evidence. */
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
 // Version-history boundary: all known legacy versions predate this point.
 // The cutoff is fixed; it must never advance automatically with the clock.
 const LEGACY_CUTOFF='2026-11-12T03:45:00Z';
 const legacyEligible=v=>{
  const d=v?.version_data||v||{};
  const hasProvenance=Object.prototype.hasOwnProperty.call(d,'levelUpResumeCompletionSource')
    ||Object.prototype.hasOwnProperty.call(d,'levelUpEntryPoint');
  const created=Date.parse(v?.created_at||'');
  return !hasProvenance && Number.isFinite(created)
    && created<=Date.parse(LEGACY_CUTOFF) && credible(v);
 };
 function resumeRiseEvidence(rows=[],versions=[]){
  if(Array.isArray(rows)&&rows.some(x=>x?.module_id==='ready2work-resume-rise'&&x?.is_complete===true))
   return 'confirmed';
  if(Array.isArray(versions)&&versions.some(v=>source(v)&&credible(v)))
   return 'confirmed';
  if(Array.isArray(versions)&&versions.some(legacyEligible))
   return 'historical';
  return 'none';
 }
 function resumeRiseComplete(rows=[],versions=[]){
  return resumeRiseEvidence(rows,versions)!=='none';
 }
 return {credible,source,legacyEligible,resumeRiseEvidence,resumeRiseComplete,LEGACY_CUTOFF};
});
