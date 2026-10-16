(()=>{
'use strict';

const TARGET_TO_NATIVE={
  'day6-start':'nia',
  'day6-plan':'office',
  'day6-layout':'delivery',
  'day6-materials':'storage',
  'day6-sequence':'station',
  'day6-box':'delivery',
  'day6-closeout':'luis',

  'day7-start':'mara',
  'mara':'mara',
  'day7-panel':'office',
  'day7-meter':'station',
  'day7-fault':'delivery',
  'day7-vehicle':'storage',
  'day7-closeout':'mara',

  'day8-start':'mara',
  'day8-crew':'mara',
  'day8-shared-jobsite':'station',
  'day8-trade-conflict':'luis',
  'day8-communication':'mara',
  'day8-closeout':'mara',

  'day9-start':'mara',
  'day9-change-request':'mara',
  'day9-quality-compare':'delivery',
  'day9-quality-check':'station',
  'day9-life-event':'nia',
  'day9-closeout':'luis',

  'day10-start':'mara',
  'day10-tools':'station',
  'day10-sequence':'office',
  'day10-hazard-scan':'delivery',
  'day10-safety':'mara',
  'day10-troubleshoot':'station',
  'day10-closeout':'delivery',
  'day10-supervisor':'mara'
};

let boundWindow=null;
let originalRuntimeTarget=null;

function modularStep(){
  try{return window.CareerQuestModular?.controller?.current?.()||null}catch{return null}
}

function bind(){
  const frame=document.getElementById('experience');
  const win=frame?.contentWindow;
  if(!win||win===boundWindow)return;
  if(typeof win.runtimeTarget!=='function'||typeof win.ui!=='function')return;

  boundWindow=win;
  originalRuntimeTarget=win.runtimeTarget.bind(win);

  win.runtimeTarget=function(runtime){
    let r=runtime;
    try{r=r||win.currentRuntime?.()}catch{}
    const day=Number(r?.day||0);
    if(day>=6&&day<=10){
      const step=modularStep();
      const native=TARGET_TO_NATIVE[step?.target];
      if(native)return native;
      // Safe day-start fallbacks while modular state initializes.
      if(day===6)return 'nia';
      return 'mara';
    }
    return originalRuntimeTarget(runtime);
  };

  try{win.ui()}catch{}
  win.document?.body?.setAttribute('data-cq-native-marker-bridge','ready');
  window.dispatchEvent(new CustomEvent('cq:native-marker-bridge-ready',{detail:{day:Number(win.currentRuntime?.()?.day||0)}}));
}

function refresh(){
  bind();
  const win=document.getElementById('experience')?.contentWindow;
  if(!win||win!==boundWindow)return;
  let day=0;try{day=Number(win.currentRuntime?.()?.day||0)}catch{}
  if(day<6||day>10)return;
  try{win.ui()}catch{}
}

const frame=document.getElementById('experience');
frame?.addEventListener('load',()=>setTimeout(bind,250));
window.addEventListener('cq:modular-state',()=>setTimeout(refresh,0));
window.addEventListener('cq:step-changed',()=>setTimeout(refresh,0));
setInterval(refresh,700);
setTimeout(bind,400);
})();