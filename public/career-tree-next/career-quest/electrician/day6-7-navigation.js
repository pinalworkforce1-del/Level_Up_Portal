(()=>{
'use strict';

const ID='cq-day67-navigation';
const MARKER_NAME='cq-day67-active-marker';
const GOLD='#f6c453';
let lastTarget='';

function txt(el){return (el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim()}
function sig(o){
  if(!o)return '';
  let ud='';
  try{ud=JSON.stringify(o.userData||{})}catch{}
  return [o.name,o.type,o.id,ud].filter(Boolean).join(' ').toLowerCase();
}
function day(doc){
  const t=txt(doc.body);
  if(/DAY\s*6\b/i.test(t))return 6;
  if(/DAY\s*7\b/i.test(t))return 7;
  return 0;
}
function activeObjective(doc){
  const raw=doc.body?.innerText||'';
  const lines=raw.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const line=lines.find(s=>/follow\s+the\s+gold\s+marker\s*:/i.test(s));
  if(line){
    const m=line.match(/follow\s+the\s+gold\s+marker\s*:\s*(.+)$/i);
    if(m?.[1])return m[1].trim();
  }
  const compact=txt(doc.body);
  const m=compact.match(/follow\s+the\s+gold\s+marker\s*:\s*([^|]{1,80}?)(?=\s{2,}|movement|journal|interact|$)/i);
  return m?.[1]?.trim()||'';
}
function aliases(target,d){
  const base=String(target||'').toLowerCase();
  const out=new Set(base.split(/[•·|,/()\-]+/).map(s=>s.trim()).filter(s=>s.length>2));
  if(/mara|foreperson/.test(base))['mara','foreperson','supervisor','lead'].forEach(x=>out.add(x));
  if(/plan|blueprint/.test(base))['plan','blueprint','drawing','print','table'].forEach(x=>out.add(x));
  if(/layout|measure/.test(base))['layout','measure','measurement','wall','mark'].forEach(x=>out.add(x));
  if(/material|cart|supply/.test(base))['material','cart','supply','parts'].forEach(x=>out.add(x));
  if(/box|rough/.test(base))['box','roughin','rough-in','install'].forEach(x=>out.add(x));
  if(/panel|breaker/.test(base))['panel','breaker','service'].forEach(x=>out.add(x));
  if(/meter|test/.test(base))['meter','multimeter','tester','testpoint','test point'].forEach(x=>out.add(x));
  if(/fault|circuit|switch/.test(base))['fault','circuit','switch','trace'].forEach(x=>out.add(x));
  if(/fuel|car|vehicle|end.of.day/.test(base))['car','vehicle','truck','parking'].forEach(x=>out.add(x));
  // Day-specific vocabulary used by the current Day 6-7 work sequence.
  if(d===6&&/nia/.test(base))['nia','apprentice'].forEach(x=>out.add(x));
  if(d===7&&/coworker|shortcut/.test(base))['coworker','journeyworker','journey worker','luis'].forEach(x=>out.add(x));
  return [...out].sort((a,b)=>b.length-a.length);
}
function scenes(win){
  const found=[],seen=new Set();
  const add=v=>{if(v&&typeof v==='object'&&v.isScene&&!seen.has(v)){seen.add(v);found.push(v)}};
  try{
    for(const k of Object.keys(win)){
      let v;try{v=win[k]}catch{continue}
      add(v);
      if(v&&typeof v==='object'){
        for(const p of ['scene','world','threeScene','mainScene','gameScene']){try{add(v[p])}catch{}}
      }
    }
  }catch{}
  return found;
}
function objects(scene){
  const a=[];
  try{scene.traverse(o=>a.push(o))}catch{}
  return a;
}
function cleanup(win){
  for(const scene of scenes(win)){
    for(const o of objects(scene)){
      if(o?.name===MARKER_NAME){try{o.parent?.remove(o)}catch{}}
    }
  }
  const doc=win.document;
  doc.querySelectorAll('.cq-day67-dom-marker').forEach(x=>x.remove());
}
function scoreObject(o,keys){
  const s=sig(o);let score=0;
  for(const k of keys){
    if(s===k)score+=100;
    else if(s.includes(k))score+=Math.min(60,18+k.length*2);
  }
  if(/npc|character|person|hotspot|interact|station|target|panel|meter|cart|table|box/.test(s))score+=8;
  if(/marker|waypoint|light|shadow|floor|ground|camera|scene/.test(s))score-=18;
  return score;
}
function findTarget3D(win,target,d){
  const keys=aliases(target,d);let best=null,bestScore=0;
  for(const scene of scenes(win))for(const o of objects(scene)){
    if(!o||o.name===MARKER_NAME)continue;
    const n=scoreObject(o,keys);
    if(n>bestScore){best=o;bestScore=n}
  }
  return bestScore>=18?best:null;
}
function existingMarker(win,targetObj,target,d){
  const keys=aliases(target,d);
  const all=[];
  for(const scene of scenes(win))all.push(...objects(scene));
  const markerish=all.filter(o=>/(gold|marker|waypoint|objective.?target|quest.?target|nav.?target|beacon)/i.test(sig(o))&&o.name!==MARKER_NAME);
  if(!markerish.length)return null;
  const child=markerish.find(o=>o.parent===targetObj||targetObj?.children?.includes(o));
  if(child)return child;
  const tagged=markerish.find(o=>keys.some(k=>sig(o).includes(k)));
  return tagged||null;
}
function showNative(marker){
  try{marker.visible=true}catch{}
  const mats=[];
  try{marker.traverse?.(o=>{if(o.material)mats.push(...(Array.isArray(o.material)?o.material:[o.material]))})}catch{}
  if(marker.material)mats.push(...(Array.isArray(marker.material)?marker.material:[marker.material]));
  for(const m of mats){try{m.visible=true;m.opacity=1;m.needsUpdate=true}catch{}}
}
function makeSprite(win){
  const T=win.THREE;if(!T?.CanvasTexture||!T?.Sprite||!T?.SpriteMaterial)return null;
  const c=win.document.createElement('canvas');c.width=128;c.height=176;
  const x=c.getContext('2d');
  x.clearRect(0,0,c.width,c.height);x.shadowColor='rgba(246,196,83,.95)';x.shadowBlur=22;x.fillStyle=GOLD;x.strokeStyle='#fff2bd';x.lineWidth=7;
  x.beginPath();x.arc(64,58,28,0,Math.PI*2);x.fill();x.stroke();
  x.beginPath();x.moveTo(45,78);x.lineTo(64,132);x.lineTo(83,78);x.closePath();x.fill();x.stroke();
  const tex=new T.CanvasTexture(c);tex.needsUpdate=true;
  const mat=new T.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false});
  const sp=new T.Sprite(mat);sp.name=MARKER_NAME;sp.renderOrder=99999;sp.scale.set(1.15,1.58,1);sp.position.set(0,2.65,0);sp.userData={cqDay67Navigation:true};return sp;
}
function cloneMarker(native){
  try{
    const c=native.clone(true);c.name=MARKER_NAME;c.visible=true;c.userData=Object.assign({},c.userData||{},{cqDay67Navigation:true});
    try{c.position.set(0,2.65,0)}catch{}
    try{c.traverse(o=>{o.visible=true;if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{m.visible=true;m.opacity=1;m.needsUpdate=true})}})}catch{}
    return c;
  }catch{return null}
}
function domTarget(doc,target,d){
  const keys=aliases(target,d);
  const nodes=[...doc.querySelectorAll('[data-npc],[data-name],[data-character],[aria-label],[title],[class*="npc"],[class*="character"],[class*="hotspot"],[class*="interact"]')];
  let best=null,score=0;
  for(const el of nodes){
    const s=[txt(el),el.getAttribute('data-npc'),el.getAttribute('data-name'),el.getAttribute('data-character'),el.getAttribute('aria-label'),el.getAttribute('title'),el.className].filter(Boolean).join(' ').toLowerCase();
    let n=0;for(const k of keys)if(s.includes(k))n+=20+k.length;
    if(n>score){best=el;score=n}
  }
  return score>=20?best:null;
}
function addDomMarker(doc,el){
  if(!el)return false;
  const cs=doc.defaultView.getComputedStyle(el);if(cs.position==='static')el.style.position='relative';
  const m=doc.createElement('div');m.className='cq-day67-dom-marker';m.setAttribute('aria-hidden','true');
  m.style.cssText='position:absolute;left:50%;top:-42px;transform:translateX(-50%);width:26px;height:34px;z-index:2147483000;pointer-events:none;filter:drop-shadow(0 0 10px rgba(246,196,83,.98))';
  m.innerHTML='<span style="display:block;width:20px;height:20px;margin:auto;background:#f6c453;border:3px solid #fff2bd;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 0 4px rgba(246,196,83,.2),0 0 18px rgba(246,196,83,.9)"></span>';
  el.appendChild(m);return true;
}
function place(frame){
  let doc,win;try{doc=frame.contentDocument;win=frame.contentWindow}catch{return}
  if(!doc?.body||!win)return;
  const d=day(doc);
  if(d!==6&&d!==7){cleanup(win);lastTarget='';return}
  const target=activeObjective(doc);
  if(!target){return}
  if(target!==lastTarget){cleanup(win);lastTarget=target}
  // Do not add another marker if our current marker still exists.
  for(const scene of scenes(win))if(objects(scene).some(o=>o?.name===MARKER_NAME))return;
  if(doc.querySelector('.cq-day67-dom-marker'))return;

  const target3d=findTarget3D(win,target,d);
  const native=existingMarker(win,target3d,target,d);
  if(native&&target3d){
    // If the game already owns a target-specific marker, simply restore it.
    if(native.parent===target3d||target3d.children?.includes(native)){showNative(native);doc.body.dataset[ID]='restored-native:'+target;return}
    const clone=cloneMarker(native);if(clone){target3d.add(clone);doc.body.dataset[ID]='cloned-native:'+target;return}
  }
  if(target3d){
    const sprite=makeSprite(win);if(sprite){target3d.add(sprite);doc.body.dataset[ID]='created-3d:'+target;return}
  }
  // Safe fallback for DOM-based hotspots only. Never replaces the 3D worksite.
  const el=domTarget(doc,target,d);if(el&&addDomMarker(doc,el))doc.body.dataset[ID]='dom:'+target;
}
function bind(){
  const frame=document.getElementById('experience');if(!frame)return;
  const start=()=>{
    let doc;try{doc=frame.contentDocument}catch{return}
    if(!doc?.body)return;
    place(frame);
    new MutationObserver(()=>place(frame)).observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});
  };
  frame.addEventListener('load',()=>setTimeout(start,180));
  setTimeout(start,450);
  setInterval(()=>place(frame),800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();