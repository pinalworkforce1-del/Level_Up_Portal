(()=>{
  'use strict';
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const RIASEC={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};
  const QUESTIONS=[
    ['R','Build kitchen cabinets'],['I','Develop a new medicine'],['A','Write books or plays'],['S','Help people with personal or emotional problems'],['E','Manage a department within a large company'],['C','Install software across computers on a large network'],
    ['R','Repair household appliances'],['I','Study ways to reduce water pollution'],['A','Compose or arrange music'],['S','Give career guidance to people'],['E','Start your own business'],['C','Operate a calculator'],
    ['R','Assemble electronic parts'],['I','Conduct chemical experiments'],['A','Create special effects for movies'],['S','Perform rehabilitation therapy'],['E','Negotiate business contracts'],['C','Keep shipping and receiving records'],
    ['R','Drive a truck to deliver packages to offices and homes'],['I','Examine blood samples using a microscope'],['A','Paint sets for plays'],['S','Do volunteer work at a non-profit organization'],['E','Market a new line of clothing'],['C','Inventory supplies using a hand-held computer'],
    ['R','Test the quality of parts before shipment'],['I','Develop a way to better predict the weather'],['A','Write scripts for movies or television shows'],['S','Teach a high-school class'],['E','Sell merchandise at a department store'],['C','Stamp, sort, and distribute mail for an organization']
  ].map((q,i)=>({index:i+1,area:q[0],text:q[1]}));
  const ANSWERS=[
    {value:1,label:'Strongly Dislike',emoji:'😣'},{value:2,label:'Dislike',emoji:'🙁'},{value:3,label:'Unsure',emoji:'😐'},{value:4,label:'Like',emoji:'🙂'},{value:5,label:'Strongly Like',emoji:'🤩'}
  ];
  const PAGE_SIZE=6;
  let page=0;
  const $=id=>document.getElementById(id);
  function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return {}}}
  const state=read();
  state.interest=state.interest||{scores:{R:0,I:0,A:0,S:0,E:0,C:0},top:[],answers:{},page:0,complete:false};
  state.interest.answers=state.interest.answers||{};
  if(state.interest.complete)page=4;else page=Math.max(0,Math.min(4,Number(state.interest.page||0)));
  function save(){state.updatedAt=new Date().toISOString();state.interest.page=page;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}}
  function answeredCount(){return QUESTIONS.filter(q=>Number(state.interest.answers[q.index])>=1).length;}
  function render(){
    if(state.interest.complete){renderResults();return;}
    $('resultsPanel').hidden=true;$('questionPanel').hidden=false;
    const start=page*PAGE_SIZE,items=QUESTIONS.slice(start,start+PAGE_SIZE);
    $('questions').innerHTML=items.map(q=>`<div class="question"><span class="question-number">QUESTION ${q.index} OF 30</span><h2>${q.text}</h2><div class="answers">${ANSWERS.map(a=>`<label class="answer"><input type="radio" name="q${q.index}" value="${a.value}" ${Number(state.interest.answers[q.index])===a.value?'checked':''}><span><em>${a.emoji}</em>${a.label}</span></label>`).join('')}</div></div>`).join('');
    items.forEach(q=>document.querySelectorAll(`input[name="q${q.index}"]`).forEach(input=>input.addEventListener('change',()=>{state.interest.answers[q.index]=Number(input.value);save();updateProgress();})));
    $('backBtn').disabled=page===0;$('backBtn').onclick=()=>{if(page>0){page--;save();render();window.scrollTo({top:0,behavior:'smooth'});}};
    $('nextBtn').textContent=page===4?'See My Results →':'Next →';
    $('nextBtn').onclick=()=>{
      const missing=items.some(q=>!Number(state.interest.answers[q.index]));
      if(missing){alert('Please answer each activity on this page before continuing.');return;}
      if(page<4){page++;save();render();window.scrollTo({top:0,behavior:'smooth'});}else complete();
    };
    updateProgress();
  }
  function updateProgress(){const count=answeredCount();$('progressText').textContent=`${count} of 30 answered`;$('pageText').textContent=`Page ${page+1} of 5`;$('progressBar').style.width=`${count/30*100}%`;}
  function complete(){
    const scores={R:0,I:0,A:0,S:0,E:0,C:0};
    QUESTIONS.forEach(q=>{const v=Number(state.interest.answers[q.index]);if(v>=1)scores[q.area]+=v-1;});
    const top=Object.keys(scores).sort((a,b)=>scores[b]-scores[a]||a.localeCompare(b)).slice(0,3);
    state.interest.scores=scores;state.interest.top=top;state.interest.complete=true;state.interest.completedAt=new Date().toISOString();save();renderResults();window.scrollTo({top:0,behavior:'smooth'});
  }
  function renderResults(){
    $('questionPanel').hidden=true;$('resultsPanel').hidden=false;$('progressText').textContent='30 of 30 answered';$('pageText').textContent='Complete';$('progressBar').style.width='100%';
    const scores=state.interest.scores||{R:0,I:0,A:0,S:0,E:0,C:0};const top=Array.isArray(state.interest.top)?state.interest.top:[];
    $('resultTitle').textContent=`${top.join('')} • ${top.map(k=>RIASEC[k]).join(' + ')}`;
    $('resultBars').innerHTML=Object.keys(RIASEC).map(k=>`<div class="result-row"><strong>${k} • ${RIASEC[k]}</strong><div class="bar"><i style="width:${Math.max(0,Math.min(20,Number(scores[k]||0)))/20*100}%"></i></div><span>${Number(scores[k]||0)}/20</span></div>`).join('');
    $('retakeBtn').onclick=()=>{state.interest={scores:{R:0,I:0,A:0,S:0,E:0,C:0},top:[],answers:{},page:0,complete:false};page=0;save();render();window.scrollTo({top:0,behavior:'smooth'});};
  }
  render();
})();