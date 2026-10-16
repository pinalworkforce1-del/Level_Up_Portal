(()=>{
'use strict';
function txt(el){return (el?.innerText||el?.textContent||'').trim()}
function clean(){
  const frame=document.getElementById('experience');
  let doc;
  try{doc=frame?.contentDocument}catch{return}
  if(!doc?.body)return;
  const bodyText=txt(doc.body);
  const day5Active=/DAY\s*5\s*\/\s*Meet Nia|DAY\s*5\s*[•-]\s*MEASURE TWICE/i.test(bodyText);
  if(!day5Active)return;
  const buttons=[...doc.querySelectorAll('button')];
  const stale=buttons.find(b=>/Finish\s*Day\s*4/i.test(txt(b)));
  if(!stale)return;
  const dialog=stale.closest('.dialog')||stale.closest('[class*="dialog"]')||stale.parentElement;
  if(dialog){dialog.style.display='none';dialog.setAttribute('aria-hidden','true');dialog.style.pointerEvents='none'}
  stale.disabled=true;
  stale.style.display='none';
  const review=buttons.find(b=>/Review\s*my\s*inspection/i.test(txt(b)));
  if(review){review.disabled=true;review.style.display='none'}
  doc.body.dataset.day45TransitionClean='1';
}
function bind(){
  const frame=document.getElementById('experience');
  if(!frame)return;
  frame.addEventListener('load',()=>{setTimeout(clean,250);setTimeout(clean,900)});
  setInterval(clean,500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();