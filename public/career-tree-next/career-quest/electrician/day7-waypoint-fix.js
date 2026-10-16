(()=>{
'use strict';

const PATCH='cqDay7MaraWaypointFix';
const GOLD='#f6c453';

function text(el){
  return (el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim();
}

function isExactDay7State(doc){
  const t=text(doc.body);
  const day7=/DAY\s*7\s*(?:\/|•|-)?\s*SPEAK\s*UP/i.test(t)||(/DAY\s*7/i.test(t)&&/SPEAK\s*UP/i.test(t));
  const mara=/Mara\s*[•·|-]?\s*Foreperson/i.test(t);
  return day7&&mara;
}

function objectSignature(o){
  if(!o)return '';
  let ud='';
  try{ud=JSON.stringify(o.userData||{})}catch{}
  return [o.name,o.type,o.id,o.uuid,ud].filter(Boolean).join(' ');
}

function collectScenes(win){
  const scenes=[];
  const seen=new Set();
  const add=v=>{if(v&&typeof v==='object'&&v.isScene&&!seen.has(v)){seen.add(v);scenes.push(v)}};
  try{
    for(const k of Object.keys(win)){
      let v;
      try{v=win[k]}catch{continue}
      add(v);
      if(v&&typeof v==='object'){
        try{add(v.scene)}catch{}
        try{add(v.world)}catch{}
        try{add(v.threeScene)}catch{}
        try{add(v.mainScene)}catch{}
      }
    }
  }catch{}
  return scenes;
}

function traverse(scene){
  const out=[];
  try{scene.traverse(o=>out.push(o))}catch{
    const walk=o=>{if(!o||out.includes(o))return;out.push(o);for(const c of o.children||[])walk(c)};
    walk(scene);
  }
  return out;
}

function setMaterialVisible(o){
  const mats=Array.isArray(o?.material)?o.material:[o?.material].filter(Boolean);
  for(const m of mats){
    try{m.visible=true}catch{}
    try{m.opacity=1}catch{}
    try{m.transparent=false}catch{}
    try{m.needsUpdate=true}catch{}
  }
}

function restoreNative3D(win){
  const scenes=collectScenes(win);
  for(const scene of scenes){
    const objects=traverse(scene);
    const maraObjects=objects.filter(o=>/\bmara\b/i.test(objectSignature(o)));
    const markerObjects=objects.filter(o=>/(gold|marker|waypoint|quest.?target|objective.?target|nav.?target)/i.test(objectSignature(o)));

    // Best case: the game's waypoint is already tagged for Mara but was hidden.
    const maraMarkers=markerObjects.filter(o=>/\bmara\b/i.test(objectSignature(o))||maraObjects.some(m=>o.parent===m||m.children?.includes(o)));
    if(maraMarkers.length){
      for(const o of maraMarkers){
        try{o.visible=true}catch{}
        try{if(o.scale&&o.scale.length?.()===0)o.scale.setScalar(1)}catch{}
        setMaterialVisible(o);
      }
      return 'restored-native-3d';
    }

    // If Mara exists and the game has a reusable waypoint object, clone that visual and attach it to Mara.
    if(maraObjects.length&&markerObjects.length){
      const mara=maraObjects[0];
      const template=markerObjects.find(o=>o.isSprite||o.isMesh||o.isGroup)||markerObjects[0];
      try{
        const clone=template.clone(true);
        clone.name='cq-day7-mara-waypoint';
        clone.visible=true;
        clone.userData=Object.assign({},clone.userData||{},{cqDay7Waypoint:true,target:'Mara'});
        if(clone.position){clone.position.set(0,2.6,0)}
        if(clone.scale){
          const max=Math.max(Math.abs(clone.scale.x||0),Math.abs(clone.scale.y||0),Math.abs(clone.scale.z||0));
          if(max<0.35)clone.scale.multiplyScalar(2.5);
        }
        clone.traverse?.(setMaterialVisible);
        setMaterialVisible(clone);
        mara.add(clone);
        return 'cloned-native-marker';
      }catch{}
    }

    // Final 3D fallback: if THREE is globally available, create a gold sprite above Mara.
    if(maraObjects.length&&win.THREE?.Sprite&&win.THREE?.CanvasTexture){
      try{
        const canvas=win.document.createElement('canvas');canvas.width=128;canvas.height=160;
        const c=canvas.getContext('2d');
        c.clearRect(0,0,128,160);
        c.shadowColor='rgba(246,196,83,.95)';c.shadowBlur=22;
        c.fillStyle=GOLD;c.strokeStyle='#fff1ba';c.lineWidth=8;
        c.beginPath();c.arc(64,58,30,0,Math.PI*2);c.fill();c.stroke();
        c.beginPath();c.moveTo(48,82);c.lineTo(64,124);c.lineTo(80,82);c.closePath();c.fill();c.stroke();
        const tex=new win.THREE.CanvasTexture(canvas);tex.needsUpdate=true;
        const mat=new win.THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});
        const sprite=new win.THREE.Sprite(mat);sprite.name='cq-day7-mara-waypoint';sprite.renderOrder=9999;sprite.scale.set(1.2,1.5,1);sprite.position.set(0,2.7,0);
        maraObjects[0].add(sprite);
        return 'created-3d-sprite';
      }catch{}
    }
  }
  return '';
}

function markerLike(el){
  const sig=[el.id,el.className,el.getAttribute?.('data-marker'),el.getAttribute?.('data-waypoint'),el.getAttribute?.('aria-label'),el.getAttribute?.('title')].filter(Boolean).join(' ');
  return /(marker|waypoint|objective[-_ ]?pin|quest[-_ ]?(?:pin|target)|nav[-_ ]?(?:pin|target))/i.test(sig);
}

function restoreNativeDOM(doc,win){
  const candidates=[...doc.querySelectorAll('*')].filter(el=>markerLike(el)&&/\bmara\b/i.test([text(el),el.getAttribute?.('aria-label'),el.getAttribute?.('title'),el.getAttribute?.('data-name'),el.getAttribute?.('data-npc')].filter(Boolean).join(' ')));
  if(!candidates.length)return '';
  for(const el of candidates){
    el.style.setProperty('display','block','important');
    el.style.setProperty('visibility','visible','important');
    el.style.setProperty('opacity','1','important');
    el.removeAttribute('hidden');el.setAttribute('aria-hidden','false');
  }
  return 'restored-native-dom';
}

function addScreenCue(doc){
  if(doc.getElementById('cq-day7-mara-screen-cue'))return 'screen-cue-present';
  const cue=doc.createElement('div');
  cue.id='cq-day7-mara-screen-cue';
  cue.setAttribute('aria-label','Mara waypoint');
  cue.innerHTML='<span class="pin"></span><b>MARA • FOREPERSON</b>';
  cue.style.cssText='position:fixed;left:50%;top:112px;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(8,28,44,.88);border:1px solid rgba(246,196,83,.7);color:#fff;font:800 12px/1.1 system-ui,sans-serif;letter-spacing:.04em;pointer-events:none;box-shadow:0 0 18px rgba(246,196,83,.24)';
  const pin=cue.querySelector('.pin');
  pin.style.cssText=`display:block;width:16px;height:16px;background:${GOLD};border:2px solid #fff1ba;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 12px rgba(246,196,83,.9)`;
  doc.body.appendChild(cue);
  return 'added-screen-cue';
}

function repair(frame){
  let doc,win;
  try{doc=frame.contentDocument;win=frame.contentWindow}catch{return}
  if(!doc?.body||!win||!isExactDay7State(doc))return;

  let result=restoreNative3D(win);
  if(!result)result=restoreNativeDOM(doc,win);
  // This cue is only a safety fallback so the learner is never left with no visible navigation signal.
  if(!result)result=addScreenCue(doc);
  doc.body.dataset[PATCH]=result||'checked';
}

function cleanupOutsideDay7(frame){
  let doc;
  try{doc=frame.contentDocument}catch{return}
  if(!doc?.body||isExactDay7State(doc))return;
  doc.getElementById('cq-day7-mara-screen-cue')?.remove();
  try{
    for(const scene of collectScenes(frame.contentWindow)){
      for(const o of traverse(scene))if(o.name==='cq-day7-mara-waypoint')o.parent?.remove(o);
    }
  }catch{}
}

function bind(){
  const frame=document.getElementById('experience');
  if(!frame)return;
  const run=()=>{repair(frame);cleanupOutsideDay7(frame)};
  const start=()=>{
    run();
    let doc;try{doc=frame.contentDocument}catch{return}
    if(doc?.body)new MutationObserver(run).observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style','class','hidden','aria-hidden']});
    setTimeout(run,250);setTimeout(run,900);setTimeout(run,1800);
  };
  frame.addEventListener('load',()=>setTimeout(start,120));
  setTimeout(start,400);
  setInterval(run,1000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();