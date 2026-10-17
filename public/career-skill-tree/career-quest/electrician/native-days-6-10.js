(function(){
'use strict';
const MISSIONS={
6:{title:'Rough-In',steps:[['office','Review the rough-in blueprint at the site office'],['station','Lay out the run and verify the measurement'],['storage','Select the materials for the rough-in'],['station','Put the rough-in work in a safe sequence'],['delivery','Inspect the box placement before the run continues'],['mara','Return to Mara to close out the rough-in shift']]},
7:{title:'Troubleshooting',steps:[['mara','Meet Mara for the troubleshooting briefing'],['station','Inspect the panel symptoms before testing'],['station','Use the meter safely to test the circuit'],['storage','Isolate the most likely fault from the evidence'],['mara','Return to Mara and close out the troubleshooting shift']]},
8:{title:'Crew Coordination',steps:[['mara','Join the crew briefing with Mara'],['station','Coordinate the shared-jobsite work sequence'],['storage','Resolve a trade conflict before work continues'],['luis','Check the communication decision with Luis'],['mara','Return to Mara to close out the crew shift']]},
9:{title:'Quality & Change',steps:[['mara','Review the change request with Mara'],['delivery','Compare the changed requirement to the installed work'],['station','Complete the quality checks before sign-off'],['mara','Make the overtime and family-responsibility decision'],['mara','Close out the quality and change shift']]},
10:{title:'Capstone',steps:[['station','Select the right tools for the capstone assignment'],['office','Build the work sequence from the plan'],['delivery','Complete the hazard scan before starting'],['mara','Confirm the safest response to the jobsite condition'],['station','Troubleshoot the circuit using the evidence'],['station','Complete the final installation check'],['mara','Meet Mara for final supervisor feedback']]}
};
const getMission=day=>MISSIONS[Number(day)]||null;
const getStep=(day,phase)=>{const m=getMission(day);if(!m)return null;return m.steps[Math.min(Math.max(0,Number(phase)||0),m.steps.length-1)]||null};
const shim={
 maxPhase(day){const m=getMission(day);return m?m.steps.length-1:0},
 objective(day,phase){return getStep(day,phase)?.[1]||null},
 target(day,phase){return getStep(day,phase)?.[0]||null},
 interact(){return false},
 missions:MISSIONS,
 loading:true
};
window.LevelUpElectricianMissionRegistry=shim;
function loadSequenceFix(){const f=document.createElement('script');f.src='./native-sequence-state-fix.js?v=20261017-seqfix1';f.async=false;f.onerror=()=>console.error('Unable to load sequence state cleanup');document.head.appendChild(f)}
function loadSweep(){const s=document.createElement('script');s.src='./native-interaction-sweep.js?v=20261017-exposure1';s.async=false;s.onerror=()=>console.error('Unable to load Electrician Days 6-10 interaction sweep');s.onload=loadSequenceFix;document.head.appendChild(s)}
function loadPolish(){const p=document.createElement('script');p.src='./native-interaction-polish.js?v=20261017-polish4';p.async=false;p.onerror=()=>console.error('Unable to load Electrician interaction polish');p.onload=loadSweep;document.head.appendChild(p)}
function loadInteraction(){const script=document.createElement('script');script.src='./native-interaction-v3.js?v=20261017-interaction3';script.async=false;script.onerror=()=>console.error('Unable to load Electrician proximity interaction engine');script.onload=loadPolish;document.head.appendChild(script)}
const pre=document.createElement('script');pre.src='./pre-shift-life.js?v=20261017-preshift1';pre.async=false;pre.onload=()=>Promise.resolve(window.__CQ_PRE_SHIFT_READY__).then(loadInteraction);pre.onerror=()=>loadInteraction();document.head.appendChild(pre);
})();
