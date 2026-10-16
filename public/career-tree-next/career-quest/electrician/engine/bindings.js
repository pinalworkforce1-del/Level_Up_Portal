import {frameDocument,frameWindow} from './state.js';

const TARGETS={
  'day6-plan':['blueprint','plan','drawing','plan table','print table'],
  'day6-layout':['layout','measure','measurement','wall layout','mark location'],
  'day6-materials':['materials','material cart','supply cart','parts cart'],
  'day6-sequence':['sequence','work sequence','rough in sequence'],
  'day6-box':['box','electrical box','rough in box','rough-in box'],
  'mara':['mara','foreperson'],
  'day7-panel':['panel','electrical panel','breaker panel','service panel'],
  'day7-meter':['meter','multimeter','tester','meter station','test point'],
  'day7-fault':['fault','fault location','circuit fault','switch','circuit trace'],
  'day7-vehicle':['vehicle','car','truck','parking'],
  'day8-crew':['crew','foreperson','mara','crew lead'],
  'day8-shared-jobsite':['shared jobsite','work area','coordination area'],
  'day8-trade-conflict':['trade conflict','mechanical','conflict area'],
  'day8-communication':['crew','coworker','journeyworker','foreperson'],
  'day9-change-request':['change request','revised layout','change area'],
  'day9-quality-compare':['quality compare','quality station','inspection station'],
  'day9-quality-check':['quality check','inspection','close up area'],
  'day9-life-event':['break area','parking','crew lead'],
  'day10-tools':['tools','tool cart','tool station','toolbox'],
  'day10-sequence':['capstone','work area','assignment area'],
  'day10-hazard-scan':['hazard','safety scan','work area'],
  'day10-safety':['hazard','unsafe condition','safety area'],
  'day10-troubleshoot':['meter','test point','fixture','troubleshoot'],
  'day10-closeout':['completed install','installation','fixture','closeout'],
  'day10-supervisor':['mara','foreperson','supervisor']
};

function norm(v){return String(v||'').toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();}
function signature3D(o){
  let ud='';try{ud=JSON.stringify(o?.userData||{})}catch{}
  return norm([o?.name,o?.type,o?.id,ud].filter(Boolean).join(' '));
}
function score(sig,aliases){
  let n=0;
  for(const alias of aliases){
    const a=norm(alias);if(!a)continue;
    if(sig===a)n+=200;
    else if(sig.includes(a))n+=40+a.length;
  }
  return n;
}

export function candidateScenes(){
  const win=frameWindow();if(!win)return[];
  const out=[],seen=new Set();
  const add=v=>{if(v&&typeof v==='object'&&v.isScene&&!seen.has(v)){seen.add(v);out.push(v)}};
  const direct=['scene','world','threeScene','mainScene','gameScene'];
  for(const key of direct){try{add(win[key])}catch{}}
  const hosts=['game','app','careerQuest','CareerQuest','cq','experience'];
  for(const host of hosts){
    let obj;try{obj=win[host]}catch{continue}
    if(!obj||typeof obj!=='object')continue;
    for(const key of direct){try{add(obj[key])}catch{}}
  }
  return out;
}

export function resolve3DTarget(id){
  const aliases=TARGETS[id]||[];if(!aliases.length)return null;
  let best=null,bestScore=0;
  for(const scene of candidateScenes()){
    try{scene.traverse(o=>{const n=score(signature3D(o),aliases);if(n>bestScore){best=o;bestScore=n}})}catch{}
  }
  return bestScore>=45?best:null;
}

export function resolveDOMTarget(id){
  const doc=frameDocument(),aliases=TARGETS[id]||[];if(!doc||!aliases.length)return null;
  const selectors='[data-name],[data-npc],[data-target],[data-hotspot],[aria-label],[title],[id],[class]';
  let best=null,bestScore=0;
  for(const el of doc.querySelectorAll(selectors)){
    const sig=norm([
      el.getAttribute('data-name'),el.getAttribute('data-npc'),el.getAttribute('data-target'),
      el.getAttribute('data-hotspot'),el.getAttribute('aria-label'),el.getAttribute('title'),
      el.id,typeof el.className==='string'?el.className:''
    ].filter(Boolean).join(' '));
    const n=score(sig,aliases);if(n>bestScore){best=el;bestScore=n}
  }
  return bestScore>=45?best:null;
}

export function aliasesFor(id){return [...(TARGETS[id]||[])];}
export function bindingIds(){return Object.keys(TARGETS);}
