(()=>{
'use strict';
const PANEL_ID='cq-nav-diag';
const frame=()=>document.getElementById('experience');
const text=el=>(el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim();

function getDoc(){try{return frame()?.contentDocument||null}catch{return null}}
function getWin(){try{return frame()?.contentWindow||null}catch{return null}}
function day(doc){const m=text(doc?.body).match(/\bDAY\s*(10|[6-9])\b/i);return m?Number(m[1]):0}
function objective(doc){
  const raw=doc?.body?.innerText||'';
  const line=raw.split(/\n+/).map(s=>s.trim()).find(s=>/follow\s+the\s+gold\s+marker\s*:/i.test(s));
  return line||'';
}
function scenes(win){
  const out=[],seen=new Set();
  const add=(v,label)=>{if(v&&typeof v==='object'&&v.isScene&&!seen.has(v)){seen.add(v);out.push({scene:v,label})}};
  if(!win)return out;
  const direct=['scene','world','threeScene','mainScene','gameScene'];
  for(const key of direct){try{add(win[key],`window.${key}`)}catch{}}
  const hosts=['game','app','careerQuest','CareerQuest','cq','experience'];
  for(const host of hosts){let obj;try{obj=win[host]}catch{continue}if(!obj||typeof obj!=='object')continue;for(const key of direct){try{add(obj[key],`window.${host}.${key}`)}catch{}}}
  return out;
}
function objectRows(scene){
  const rows=[];
  try{scene.traverse(o=>{
    let ud='';try{ud=JSON.stringify(o.userData||{})}catch{}
    const sig=[o.name,o.type,ud].filter(Boolean).join(' ');
    if(/mara|foreperson|panel|meter|fault|switch|breaker|npc|character|worker|hotspot|interact/i.test(sig))rows.push(sig.slice(0,180));
  })}catch{}
  return [...new Set(rows)].slice(0,18);
}
function domRows(doc){
  const rows=[];
  if(!doc)return rows;
  for(const el of doc.querySelectorAll('[data-name],[data-npc],[data-target],[data-hotspot],[aria-label],[title],[id],[class]')){
    const sig=[el.tagName,el.id,typeof el.className==='string'?el.className:'',el.getAttribute('data-name'),el.getAttribute('data-npc'),el.getAttribute('data-target'),el.getAttribute('data-hotspot'),el.getAttribute('aria-label'),el.getAttribute('title')].filter(Boolean).join(' ');
    if(/mara|foreperson|panel|meter|fault|switch|breaker|npc|character|worker|hotspot|interact/i.test(sig))rows.push(sig.slice(0,180));
  }
  return [...new Set(rows)].slice(0,18);
}
function render(){
  const doc=getDoc(),win=getWin();if(!doc?.body||!win)return;
  const d=day(doc);if(d<6||d>10){document.getElementById(PANEL_ID)?.remove();return}
  let panel=document.getElementById(PANEL_ID);
  if(!panel){panel=document.createElement('div');panel.id=PANEL_ID;panel.style.cssText='position:fixed;right:10px;bottom:10px;z-index:2147483647;width:min(430px,calc(100vw - 20px));max-height:44vh;overflow:auto;background:rgba(3,14,24,.96);color:#eaf6ff;border:1px solid #f6c453;border-radius:12px;padding:10px 12px;font:11px/1.35 ui-monospace,SFMono-Regular,Consolas,monospace;box-shadow:0 10px 30px rgba(0,0,0,.45)';document.body.appendChild(panel)}
  const ss=scenes(win);const rows=ss.flatMap(x=>objectRows(x.scene));const dom=domRows(doc);
  panel.innerHTML=`<div style="font:800 12px system-ui;color:#ffd86d;margin-bottom:6px">NAV DEBUG • DAY ${d}</div><div><b>Objective:</b> ${objective(doc)||'(none found)'}</div><div><b>Scenes found:</b> ${ss.length}${ss.length?` — ${ss.map(x=>x.label).join(', ')}`:''}</div><div style="margin-top:7px"><b>3D candidates (${rows.length}):</b><br>${rows.length?rows.map(x=>`• ${x.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}`).join('<br>'):'(none)'}</div><div style="margin-top:7px"><b>DOM candidates (${dom.length}):</b><br>${dom.length?dom.map(x=>`• ${x.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}`).join('<br>'):'(none)'}</div>`;
}
const start=()=>{render();setInterval(render,1200)};
frame()?.addEventListener('load',()=>setTimeout(start,400),{once:true});
setTimeout(start,700);
})();