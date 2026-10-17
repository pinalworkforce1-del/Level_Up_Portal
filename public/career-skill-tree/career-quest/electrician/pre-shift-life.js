(function(){
'use strict';
const KEY='career-quest-electrician-days123-v1';
const ASSET='../../../career-tree-next/career-quest/electrician/assets/';
const EVENTS={
  6:{id:'native-flat',title:'Flat Tire',image:'cq-common-life-event-car.webp',story:'You find a flat tire in the driveway. Your shift starts in 45 minutes.',options:[
    ['Notify Mara and arrange a ride; arrive two hours late',6,18,3,3,'You communicated and found a practical way to get to work, but two paid hours and the ride cost hit the paycheck.'],
    ['Call Mara, explain the problem, and miss the shift',0,0,3,1,'You communicated, but the full unpaid shift will reduce earnings.'],
    ['Pay for a rideshare and arrive on time',8,42,2,3,'You protect all eight paid hours, but the transportation expense comes out of what you earned.']
  ]},
  10:{id:'native-childcare',title:'Childcare Falls Through',image:'cq-common-life-event-budget.webp',story:'Your childcare plan unexpectedly falls through on the morning of the capstone shift.',options:[
    ['Call Mara and arrange backup care; arrive three hours late',5,20,3,3,'You made a safe care plan and communicated. Three paid hours and the backup-care cost affect payday.'],
    ['Call Mara and miss the shift to provide care',0,0,3,2,'You handled the responsibility openly, but the unpaid shift reduces earnings.'],
    ['Find approved backup care that lets you arrive on time',8,35,2,3,'You protect the full workday, with an added childcare expense.']
  ]}
};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
const write=s=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}};
const state=read();
const day=Number(state?.runtime?.day||state?.day||0),phase=Number(state?.runtime?.phase??state?.step||0),ev=EVENTS[day];
const done=Boolean(ev&&Array.isArray(state?.life?.results)&&state.life.results.some(r=>r?.id===ev.id));
if(!ev||phase!==0||done){window.__CQ_PRE_SHIFT_READY__=Promise.resolve();return}
window.__CQ_PRE_SHIFT_READY__=new Promise(resolve=>{
  const style=document.createElement('style');style.textContent=`#cqPreShift{position:fixed;inset:0;z-index:125;background:rgba(3,10,18,.94);display:grid;place-items:center;padding:18px;color:#eef8ff;font-family:Inter,system-ui,sans-serif}#cqPreShift .card{width:min(1100px,96vw);max-height:94vh;overflow:auto;background:#10263b;border:1px solid #7898ad;border-radius:20px;box-shadow:0 24px 80px #000c}.hero{position:relative}.hero img{width:100%;height:min(52vh,520px);object-fit:cover;display:block;border-radius:20px 20px 0 0}.hero:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(5,15,25,.92))}.copy{position:absolute;z-index:2;left:24px;right:24px;bottom:20px}.eye{font-size:11px;letter-spacing:.16em;color:#ffd386;font-weight:900}.copy h2{font-size:clamp(28px,4vw,46px);margin:5px 0 8px}.copy p{margin:0;max-width:800px;line-height:1.5}.body{padding:20px 24px 24px}.body h3{margin:0 0 14px;font-size:20px}.opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.opts button,.continue{border:1px solid #7fa1b5;background:#173b55;color:#fff;border-radius:13px;padding:13px 16px;font-weight:800;cursor:pointer;text-align:left}.opts button:hover{border-color:#ffd386;background:#245f7d}.feedback{margin-top:14px;padding:13px 15px;background:#173247;border-left:4px solid #ffd386;border-radius:9px;line-height:1.5}.continue{margin-top:14px;border-radius:999px;background:#a87022;border-color:#e5b967;text-align:center}@media(max-width:700px){.opts{grid-template-columns:1fr}}`;document.head.appendChild(style);
  const root=document.createElement('div');root.id='cqPreShift';root.innerHTML=`<div class="card"><div class="hero"><img src="${ASSET+ev.image}" alt=""><div class="copy"><div class="eye">LIFE HAPPENS • BEFORE THE SHIFT</div><h2>${ev.title}</h2><p>${ev.story}</p></div></div><div class="body"><h3>What do you do?</h3><div class="opts"></div><div class="feedback" hidden></div></div></div>`;document.body.appendChild(root);
  const opts=root.querySelector('.opts'),fb=root.querySelector('.feedback');
  ev.options.forEach((o,i)=>{const b=document.createElement('button');b.textContent=o[0];b.onclick=()=>{const s=read()||state||{},life=s.life&&typeof s.life==='object'?s.life:{};life.results=Array.isArray(life.results)?life.results:[];if(!life.results.some(r=>r?.id===ev.id))life.results.push({id:ev.id,day,title:ev.title,choice:i,choiceLabel:o[0],paidHours:o[1],expense:o[2],communication:o[3],safety:o[4],feedback:o[5],nativeLife:true});life.events=Array.isArray(life.events)?life.events:[];if(!life.events.some(x=>x?.id===ev.id))life.events.push({id:ev.id,day,native:true});s.life=life;write(s);opts.replaceChildren();fb.hidden=false;fb.innerHTML=`<strong>Decision recorded.</strong><br>${o[5]}<br><br>Paid hours this shift: <strong>${o[1]}/8</strong> • Unexpected expense: <strong>$${Number(o[2]).toFixed(2)}</strong>`;const c=document.createElement('button');c.className='continue';c.textContent='Continue to the shift →';c.onclick=()=>{root.remove();style.remove();resolve()};root.querySelector('.body').appendChild(c)};opts.appendChild(b)});
});
})();
