export const HUB_KEY='level-up-career-quest-hub-v1';

export function frame(){return document.getElementById('experience')||null;}
export function frameWindow(){try{return frame()?.contentWindow||null}catch{return null}}
export function frameDocument(){try{return frame()?.contentDocument||null}catch{return null}}
export function text(el){return (el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim();}

export function parseDay(doc=frameDocument()){
  if(!doc?.body)return 0;
  const t=text(doc.body);
  const m=t.match(/\bDAY\s*(10|[1-9])\b/i);
  return m?Number(m[1]):0;
}

export function parseObjective(doc=frameDocument()){
  if(!doc?.body)return '';
  const raw=doc.body.innerText||'';
  const line=raw.split(/\n+/).map(s=>s.trim()).find(s=>/follow\s+the\s+gold\s+marker\s*:/i.test(s));
  if(line){
    const m=line.match(/follow\s+the\s+gold\s+marker\s*:\s*(.+)$/i);
    if(m?.[1])return m[1].trim();
  }
  return '';
}

export function readHub(){
  try{return JSON.parse(localStorage.getItem(HUB_KEY)||'{}')||{}}catch{return {}}
}

export function snapshot(){
  const doc=frameDocument();
  const hub=readHub();
  return {
    day:parseDay(doc),
    objective:parseObjective(doc),
    hubElectrician:hub.electrician||{},
    capturedAt:new Date().toISOString()
  };
}

export function watch(callback,{interval=500}={}){
  let last='';
  const emit=()=>{
    const next=snapshot();
    const sig=JSON.stringify([next.day,next.objective,next.hubElectrician?.day,next.hubElectrician?.currentDay]);
    if(sig!==last){last=sig;callback(next);}
  };
  const f=frame();
  const onLoad=()=>setTimeout(emit,120);
  f?.addEventListener('load',onLoad);
  const timer=setInterval(emit,interval);
  emit();
  return ()=>{clearInterval(timer);f?.removeEventListener('load',onLoad)};
}
