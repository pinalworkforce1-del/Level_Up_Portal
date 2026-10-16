(()=>{
'use strict';

// This script is intentionally injected INTO the legacy Career Quest iframe.
// It executes in the same global lexical environment as the original game,
// so it can extend the native Days 1-5 marker system without duplicating it.

const parentCQ=()=>{try{return window.parent?.CareerQuestModular||null}catch{return null}};
const currentModularStep=()=>{try{return parentCQ()?.controller?.current?.()||null}catch{return null}};

const TARGET_TO_NATIVE={
  'day6-start':'mara',
  'day6-plan':'office',
  'day6-layout':'station',
  'day6-materials':'storage',
  'day6-sequence':'station',
  'day6-box':'delivery',
  'day6-closeout':'mara',

  'day7-start':'mara',
  'mara':'mara',
  'day7-panel':'office',
  'day7-meter':'station',
  'day7-fault':'delivery',
  'day7-vehicle':'storage',
  'day7-closeout':'mara',

  'day8-start':'mara',
  'day8-crew':'mara',
  'day8-shared-jobsite':'delivery',
  'day8-trade-conflict':'station',
  'day8-communication':'luis',
  'day8-closeout':'mara',

  'day9-start':'mara',
  'day9-change-request':'office',
  'day9-quality-compare':'delivery',
  'day9-quality-check':'station',
  'day9-life-event':'storage',
  'day9-closeout':'mara',

  'day10-start':'mara',
  'day10-tools':'station',
  'day10-sequence':'office',
  'day10-hazard-scan':'delivery',
  'day10-safety':'mara',
  'day10-troubleshoot':'station',
  'day10-closeout':'delivery',
  'day10-supervisor':'mara'
};

const originalRuntimeTarget=runtimeTarget;
const originalRuntimeObjective=runtimeObjective;

runtimeTarget=function(runtime=currentRuntime()){
  if(runtime?.day>=6&&runtime?.day<=10){
    const step=currentModularStep();
    return TARGET_TO_NATIVE[step?.target]||'mara';
  }
  return originalRuntimeTarget(runtime);
};

runtimeObjective=function(runtime=currentRuntime()){
  if(runtime?.day>=6&&runtime?.day<=10){
    const step=currentModularStep();
    if(step?.label)return step.label;
  }
  return originalRuntimeObjective(runtime);
};

function refreshNativeMarker(){
  try{
    const runtime=currentRuntime();
    if(runtime.day<6||runtime.day>10)return;
    const id=runtimeTarget(runtime);
    if(!id||!locations[id])return;
    setTargetRaw(id);
    marker.visible=true;
    const objective=runtimeObjective(runtime);
    const objectiveNode=$('objective');
    const missionNode=$('mission');
    if(objectiveNode)objectiveNode.textContent=`DAY ${runtime.day} / ${objective}`;
    if(missionNode)missionNode.textContent=objective;
  }catch(err){
    try{window.__cqNativeNavError=String(err?.message||err)}catch{}
  }
}

window.addEventListener('cq:step-changed',refreshNativeMarker);
window.addEventListener('cq:modular-state',refreshNativeMarker);
window.__cqNativeNavigation={version:'2026-10-16-native2',targets:{...TARGET_TO_NATIVE},refresh:refreshNativeMarker};

setTimeout(()=>{try{ui()}catch{}refreshNativeMarker()},40);
setInterval(refreshNativeMarker,400);
})();
