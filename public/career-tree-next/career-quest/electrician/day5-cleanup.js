(()=>{
'use strict';
const MARK='data-cq-day5-cleanup';
const REVEAL='data-cq-measurement-reveal';
function text(el){return (el?.innerText||el?.textContent||'').replace(/\s+/g,' ').trim()}
function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0}
function day5(doc){return /DAY\s*5\s*(?:\/|•|-).*?(?:MEET\s+NIA|MEASURE\s+TWICE)|MEASURE\s+TWICE/i.test(text(doc.body))}
function candidateRoot(doc){
  const nodes=[...doc.querySelectorAll('.dialog,.modal,[role="dialog"],section,main,.card,.panel')].filter(visible);
  return nodes.find(el=>/DAY\s*5|MEASURE\s+TWICE|NIA/i.test(text(el)))||doc.body;
}
function imgSig(el){return [...el.querySelectorAll('img')].filter(visible).map(i=>(i.currentSrc||i.src||'').split('?')[0]).filter(Boolean).join('|')}
function removeDuplicateVisualRows(root){
  const groups=[...root.querySelectorAll('figure,.visual-row,.image-row,.tool-row,.tools-row,.gallery,.scene-art,.scene-visual,.challenge-visual,.task-visual,div')]
    .filter(el=>visible(el)&&el.querySelectorAll('img').length>=2);
  const seen=new Map();
  for(const el of groups){
    const sig=imgSig(el);
    if(!sig||sig.split('|').length<2)continue;
    if(seen.has(sig)){
      const first=seen.get(sig);
      if(first!==el && !first.contains(el) && !el.contains(first)){
        el.style.display='none';
        el.setAttribute('aria-hidden','true');
        el.dataset.cqDuplicateVisualRemoved='1';
      }
    }else seen.set(sig,el);
  }
  // Fallback for repeated individual artwork: hide only the later duplicate card/figure.
  const seenSrc=new Map();
  for(const img of [...root.querySelectorAll('img')].filter(visible)){
    const src=(img.currentSrc||img.src||'').split('?')[0];
    if(!src)continue;
    if(!seenSrc.has(src)){seenSrc.set(src,img);continue}
    const first=seenSrc.get(src);
    const a=first.closest('figure,.visual-card,.tool-card,.image-card,.scene-art,.challenge-visual');
    const b=img.closest('figure,.visual-card,.tool-card,.image-card,.scene-art,.challenge-visual');
    if(a&&b&&a!==b&&!a.contains(b)&&!b.contains(a)){
      b.style.display='none';
      b.setAttribute('aria-hidden','true');
      b.dataset.cqDuplicateVisualRemoved='1';
    }
  }
}
function measurementBlock(root){
  const nodes=[...root.querySelectorAll('.dialog,.modal,.card,.panel,.challenge,.task,section,div')].filter(visible);
  return nodes.find(el=>{
    const t=text(el);
    return /96/.test(t)&&/92/.test(t)&&/(measure|measurement|difference|layout|cut|conduit|inch)/i.test(t);
  })||null;
}
function makeGate(doc,block){
  if(!block||block.hasAttribute(MARK))return;
  block.setAttribute(MARK,'1');
  const buttons=[...block.querySelectorAll('button')].filter(b=>visible(b)&&!/back|next|close|journal|jobsite|start over/i.test(text(b)));
  if(!buttons.length)return;

  const revealNodes=[];
  for(const el of [...block.querySelectorAll('p,div,figure,img,.feedback,.result,.answer,.explanation')]){
    if(el===block||buttons.some(b=>el.contains(b)||b.contains(el)))continue;
    const t=text(el);
    const src=el.tagName==='IMG'?`${el.getAttribute('src')||''} ${el.getAttribute('alt')||''}`:'';
    const solvedText=/96/.test(t)&&/92/.test(t)&&/(difference|correct|actual|expected|four|4\s*(?:in|inch)|off by|should be)/i.test(t);
    const solvedArt=el.tagName==='IMG'&&/(measurement|measure|overlay|difference|96|92)/i.test(src);
    if(solvedText||solvedArt){revealNodes.push(el)}
  }
  // Keep the question itself visible; only suppress likely result/explanation/artwork nodes.
  const unique=[...new Set(revealNodes)].filter(el=>!revealNodes.some(other=>other!==el&&other.contains(el)));
  for(const el of unique){
    el.dataset.cqPrevDisplay=el.style.display||'';
    el.style.display='none';
    el.setAttribute('aria-hidden','true');
    el.setAttribute(REVEAL,'pending');
  }
  if(!unique.length)return;

  const cue=doc.createElement('div');
  cue.className='cq-measurement-decision-cue';
  cue.setAttribute('role','note');
  cue.style.cssText='margin:12px 0;padding:10px 12px;border:1px solid rgba(255,210,120,.45);border-radius:10px;background:rgba(255,210,120,.08);font-size:.92rem;line-height:1.35';
  cue.textContent='Make your call first. The measurement comparison will appear after you choose.';
  const firstButton=buttons[0];
  const host=firstButton.parentElement||block;
  host.parentElement?.insertBefore(cue,host);

  const reveal=()=>{
    for(const el of unique){
      el.style.display=el.dataset.cqPrevDisplay||'';
      el.removeAttribute('aria-hidden');
      el.setAttribute(REVEAL,'shown');
    }
    cue.style.display='none';
  };
  for(const b of buttons)b.addEventListener('click',()=>setTimeout(reveal,80),{once:true});
}
function clean(){
  const frame=document.getElementById('experience');
  let doc;try{doc=frame?.contentDocument}catch{return}
  if(!doc?.body||!day5(doc))return;
  const root=candidateRoot(doc);
  removeDuplicateVisualRows(root);
  makeGate(doc,measurementBlock(root));
  doc.body.dataset.cqDay5Cleanup='1';
}
function bind(){
  const frame=document.getElementById('experience');
  if(!frame)return;
  const observe=()=>{
    let doc;try{doc=frame.contentDocument}catch{return}
    if(!doc?.body)return;
    clean();
    new MutationObserver(clean).observe(doc.body,{subtree:true,childList:true,characterData:true});
  };
  frame.addEventListener('load',()=>setTimeout(observe,150));
  setTimeout(observe,350);
  setInterval(clean,700);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();