(()=>{
'use strict';

const PATCH='cqMaraWaypointFix';
const GOLD='#f6c453';

function text(el){
  return (el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim();
}

function visible(el,win){
  if(!el)return false;
  const s=win.getComputedStyle(el);
  const r=el.getBoundingClientRect();
  return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>0&&r.height>0;
}

function isMaraObjective(doc){
  const t=text(doc.body);
  return /Mara\s*[•·|-]?\s*Foreperson/i.test(t)||/(?:meet|find|talk\s+to|check\s+in\s+with)\s+Mara/i.test(t);
}

function markerLike(el){
  const sig=[
    el.id,
    el.className,
    el.getAttribute?.('data-marker'),
    el.getAttribute?.('data-waypoint'),
    el.getAttribute?.('aria-label'),
    el.getAttribute?.('title')
  ].filter(Boolean).join(' ');
  return /(marker|waypoint|objective[-_ ]?pin|quest[-_ ]?(?:pin|target)|nav[-_ ]?(?:pin|target))/i.test(sig);
}

function maraLike(el){
  const sig=[text(el),el.getAttribute?.('aria-label'),el.getAttribute?.('title'),el.getAttribute?.('data-name'),el.getAttribute?.('data-npc')]
    .filter(Boolean).join(' ');
  return /\bMara\b/i.test(sig);
}

function restoreExisting(doc,win){
  const all=[...doc.querySelectorAll('*')];
  const markers=all.filter(markerLike);
  if(!markers.length)return false;

  // Prefer a marker already associated with Mara/the active objective.
  let candidates=markers.filter(el=>maraLike(el));
  if(!candidates.length){
    candidates=markers.filter(el=>{
      const p=el.parentElement;
      return p&&maraLike(p);
    });
  }

  // If there is only one waypoint system marker in the scene, that is the active quest marker.
  if(!candidates.length&&markers.length===1)candidates=markers;
  if(!candidates.length)return false;

  let changed=false;
  for(const el of candidates){
    const s=win.getComputedStyle(el);
    if(s.display==='none')el.style.setProperty('display','block','important');
    if(s.visibility==='hidden')el.style.setProperty('visibility','visible','important');
    if(Number(s.opacity||1)===0)el.style.setProperty('opacity','1','important');
    el.removeAttribute('hidden');
    el.setAttribute('aria-hidden','false');
    el.dataset.cqWaypointRestored='mara';
    changed=true;
  }
  return changed;
}

function findMaraAnchor(doc,win){
  const selectors=[
    '[data-npc]','[data-name]','[aria-label]','[title]',
    '[class*="npc"]','[class*="character"]','[class*="hotspot"]','[class*="interact"]','button'
  ];
  const nodes=[...doc.querySelectorAll(selectors.join(','))];
  return nodes.find(el=>maraLike(el)&&visible(el,win))||null;
}

function addMarkerToAnchor(doc,anchor){
  if(!anchor||anchor.querySelector(':scope > .cq-mara-gold-marker'))return false;
  const win=doc.defaultView;
  const cs=win.getComputedStyle(anchor);
  if(cs.position==='static')anchor.style.position='relative';

  const marker=doc.createElement('div');
  marker.className='cq-mara-gold-marker';
  marker.setAttribute('aria-label','Mara waypoint');
  marker.innerHTML='<span></span>';
  marker.style.cssText=[
    'position:absolute','left:50%','top:-40px','transform:translateX(-50%)',
    'width:26px','height:34px','z-index:2147483000','pointer-events:none',
    'filter:drop-shadow(0 0 9px rgba(246,196,83,.95))'
  ].join(';');
  const dot=marker.firstElementChild;
  dot.style.cssText=[
    'display:block','width:20px','height:20px','margin:0 auto','box-sizing:border-box',
    `background:${GOLD}`,'border:3px solid #fff1ba','border-radius:50% 50% 50% 0',
    'transform:rotate(-45deg)','box-shadow:0 0 0 4px rgba(246,196,83,.22),0 0 18px rgba(246,196,83,.9)',
    'animation:cqMaraPulse 1.15s ease-in-out infinite alternate'
  ].join(';');
  anchor.appendChild(marker);

  if(!doc.getElementById('cq-mara-waypoint-style')){
    const style=doc.createElement('style');
    style.id='cq-mara-waypoint-style';
    style.textContent='@keyframes cqMaraPulse{from{transform:rotate(-45deg) scale(.92);filter:brightness(.95)}to{transform:rotate(-45deg) scale(1.12);filter:brightness(1.22)}}';
    doc.head?.appendChild(style);
  }
  anchor.dataset.cqMaraWaypointAnchor='1';
  return true;
}

function repair(frame){
  let doc,win;
  try{doc=frame.contentDocument;win=frame.contentWindow}catch{return}
  if(!doc?.body||!win||!isMaraObjective(doc))return;

  // First restore the game's own waypoint if it exists but was hidden during the Day 4→5 transition.
  if(restoreExisting(doc,win)){
    doc.body.dataset[PATCH]='restored-native';
    return;
  }

  // Fallback: attach the same gold navigation cue directly to Mara's existing scene/NPC hotspot.
  const mara=findMaraAnchor(doc,win);
  if(mara&&addMarkerToAnchor(doc,mara)){
    doc.body.dataset[PATCH]='attached-to-mara';
  }
}

function bind(){
  const frame=document.getElementById('experience');
  if(!frame)return;
  const start=()=>{
    repair(frame);
    let doc;
    try{doc=frame.contentDocument}catch{return}
    if(!doc?.body)return;
    const observer=new MutationObserver(()=>repair(frame));
    observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class','hidden','aria-hidden']});
    setTimeout(()=>repair(frame),150);
    setTimeout(()=>repair(frame),700);
    setTimeout(()=>repair(frame),1600);
  };
  frame.addEventListener('load',()=>setTimeout(start,100));
  setTimeout(start,350);
  setInterval(()=>repair(frame),900);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
else bind();
})();