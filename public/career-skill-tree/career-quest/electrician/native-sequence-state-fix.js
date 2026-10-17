(function(){
'use strict';
function getSweep(){return document.getElementById('cqSweep')}
function resetFeedback(root){
  const fb=root?.querySelector('.cqsw-feedback');
  if(fb){fb.hidden=true;fb.innerHTML=''}
}
function syncCheck(root){
  if(!root)return;
  const seq=root.querySelector('#seq');
  const order=root.querySelector('#order');
  const check=root.querySelector('#check');
  if(!seq||!order||!check)return;
  const chosenText=(order.textContent||'').replace(/^Chosen:\s*/i,'').trim();
  const chosenCount=!chosenText||chosenText.toLowerCase()==='none'?0:chosenText.split('→').length;
  const remainingCount=seq.querySelectorAll('.cqsw-cardbtn').length;
  const total=chosenCount+remainingCount;
  if(check.textContent.includes('Continue')){check.disabled=false;return}
  check.disabled=chosenCount<total;
  check.setAttribute('aria-disabled',String(check.disabled));
  if(chosenCount===0) order.textContent='Chosen: none';
  else order.textContent=`Step ${chosenCount} of ${total} • Chosen: `+chosenText;
}
function wireCurrent(){const root=getSweep();if(!root||root.dataset.sequenceStateFixed==='1')return;const seq=root.querySelector('#seq'),reset=root.querySelector('#reset'),check=root.querySelector('#check');if(!seq||!reset||!check)return;root.dataset.sequenceStateFixed='1';syncCheck(root);reset.addEventListener('click',()=>{resetFeedback(root);setTimeout(()=>syncCheck(root),0)},true);seq.addEventListener('click',e=>{if(!e.target.closest('.cqsw-cardbtn'))return;resetFeedback(root);setTimeout(()=>syncCheck(root),0)},true);check.addEventListener('click',()=>setTimeout(()=>syncCheck(root),0),true)}
const observer=new MutationObserver(()=>wireCurrent());
observer.observe(document.documentElement,{childList:true,subtree:true});
wireCurrent();
})();
