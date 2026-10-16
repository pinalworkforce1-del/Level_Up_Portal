(()=>{
'use strict';
const FRAME_ID='experience';
const SCRIPT_ID='cq-core-navigation-extension';
// Resolve from the OUTER wrapper URL before injecting into the inner game document.
// This avoids the iframe resolving the script relative to /career-skill-tree/.
const SRC=new URL('core-navigation-extension.js?v=20261016-native3',window.location.href).href;

function inject(){
  const frame=document.getElementById(FRAME_ID);if(!frame)return false;
  let doc;try{doc=frame.contentDocument}catch{return false}
  if(!doc?.documentElement)return false;
  if(doc.getElementById(SCRIPT_ID))return true;
  const script=doc.createElement('script');
  script.id=SCRIPT_ID;
  script.src=SRC;
  script.async=false;
  script.onload=()=>{try{doc.body.dataset.cqCoreExtension='loaded'}catch{}};
  script.onerror=()=>{try{doc.body.dataset.cqCoreExtension='error'}catch{}};
  (doc.body||doc.head||doc.documentElement).appendChild(script);
  return true;
}

function bind(){
  const frame=document.getElementById(FRAME_ID);if(!frame)return;
  frame.addEventListener('load',()=>setTimeout(inject,120));
  let tries=0;const timer=setInterval(()=>{tries++;if(inject()||tries>30)clearInterval(timer)},200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
