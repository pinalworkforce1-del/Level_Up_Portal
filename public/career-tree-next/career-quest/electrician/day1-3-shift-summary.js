(()=>{
'use strict';
const FRAME_ID='experience';
const DONE_ATTR='data-cq-shift-summary';
const dayCopy={
  1:'You completed your first workday, learned the site, and made your first jobsite decisions.',
  2:'You completed the Gopher mission and built confidence finding, confirming, and delivering what the crew needs.',
  3:'You completed Chapter One and finished your first three simulated workdays.'
};
function cash(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0)}
function rate(doc){
  const el=doc.getElementById('simRate');
  const n=Number(String(el?.textContent||'').replace(/[^0-9.]/g,''));
  return Number.isFinite(n)&&n>0?n:21.89;
}
function findTextNode(doc,needle){
  const all=[...doc.querySelectorAll('h1,h2,h3,strong,.tag,.modal,.dialog')];
  return all.find(el=>(el.textContent||'').toUpperCase().includes(needle));
}
function score(day,doc){
  const r=rate(doc),gross=cash(r*8);
  const box=doc.createElement('div');
  box.className='score-summary cq-standard-shift-summary';
  box.innerHTML=`<p>Day ${day} paid hours: <strong>8 / 8</strong></p><p>Today's gross: <strong>${gross}</strong></p><p>Road to Payday: <strong>${day} / 10 shifts</strong></p><p class="tiny">This is an illustrative pay simulation, not actual payroll. Worksite feedback is coaching, not a certification.</p>`;
  return box;
}
function enhanceDialog(doc,day){
  const needle=`DAY ${day} COMPLETE`;
  const hit=findTextNode(doc,needle);
  if(!hit)return false;
  const box=hit.closest('.dialog')||hit.closest('.modal')||hit.parentElement;
  if(!box||box.hasAttribute(DONE_ATTR))return !!box;
  box.setAttribute(DONE_ATTR,String(day));
  const heading=box.querySelector('strong,h2,h3');
  if(heading)heading.textContent=`DAY ${day} • SHIFT COMPLETE`;
  const p=box.querySelector('p');
  if(p && (!p.textContent||/day [23] begins|day 2 begins/i.test(p.textContent)))p.textContent=dayCopy[day];
  const buttons=box.querySelector('.buttons')||[...box.querySelectorAll('button')][0]?.parentElement;
  const summary=score(day,doc);
  if(buttons)box.insertBefore(summary,buttons);else box.appendChild(summary);
  return true;
}
function enhanceChapter(doc){
  const hit=findTextNode(doc,'CHAPTER ONE COMPLETE • DAYS 1–3');
  if(!hit)return false;
  const box=hit.closest('.modal')||hit.closest('.dialog')||hit.parentElement;
  if(!box||box.hasAttribute(DONE_ATTR))return !!box;
  box.setAttribute(DONE_ATTR,'3');
  const heading=box.querySelector('h2,h3,strong');
  if(heading)heading.textContent='DAY 3 • SHIFT COMPLETE';
  const p=box.querySelector('p');
  if(p)p.textContent=dayCopy[3]+' Day 4 is now ready.';
  const buttons=box.querySelector('.buttons')||[...box.querySelectorAll('button')][0]?.parentElement;
  const summary=score(3,doc);
  if(buttons)box.insertBefore(summary,buttons);else box.appendChild(summary);
  return true;
}
function scan(){
  const frame=document.getElementById(FRAME_ID);
  let doc;try{doc=frame?.contentDocument}catch{return}
  if(!doc?.body)return;
  enhanceDialog(doc,1);
  enhanceDialog(doc,2);
  enhanceChapter(doc);
}
function attach(){
  const frame=document.getElementById(FRAME_ID);
  if(!frame)return;
  const observe=()=>{
    let doc;try{doc=frame.contentDocument}catch{return}
    if(!doc?.body)return;
    scan();
    const obs=new MutationObserver(scan);
    obs.observe(doc.body,{childList:true,subtree:true,characterData:true});
  };
  frame.addEventListener('load',()=>setTimeout(observe,100));
  setTimeout(observe,300);
  setInterval(scan,900);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();