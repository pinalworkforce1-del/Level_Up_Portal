(() => {
  const MODULE_ID = 'career-skill-tree';
  const STORAGE_KEY = 'level-up-career-skill-tree-v1';
  const VIEWS = ['home','interest','alignment','lmi','tree'];

  const RIASEC = {
    R:{name:'Realistic',short:'Doers',desc:'Hands-on work, tools, equipment, building, fixing, working outdoors or with physical systems.'},
    I:{name:'Investigative',short:'Thinkers',desc:'Questions, science, research, analysis, troubleshooting, and figuring out how things work.'},
    A:{name:'Artistic',short:'Creators',desc:'Design, ideas, writing, visual expression, performance, and making something original.'},
    S:{name:'Social',short:'Helpers',desc:'Helping, teaching, listening, supporting, coaching, caring, and working closely with people.'},
    E:{name:'Enterprising',short:'Persuaders',desc:'Leading, selling, influencing, starting things, making decisions, and moving ideas forward.'},
    C:{name:'Conventional',short:'Organizers',desc:'Details, records, schedules, processes, numbers, accuracy, and keeping systems organized.'}
  };

  // Official O*NET Mini Interest Profiler item order (30 items / 5 per RIASEC area).
  // The participant-facing response values are the published 1-5 anchors. Scoring uses 0-4.
  const IP_QUESTIONS = [
    {index:1,area:'R',text:'Build kitchen cabinets'},
    {index:2,area:'I',text:'Develop a new medicine'},
    {index:3,area:'A',text:'Write books or plays'},
    {index:4,area:'S',text:'Help people with personal or emotional problems'},
    {index:5,area:'E',text:'Manage a department within a large company'},
    {index:6,area:'C',text:'Install software across computers on a large network'},
    {index:7,area:'R',text:'Repair household appliances'},
    {index:8,area:'I',text:'Study ways to reduce water pollution'},
    {index:9,area:'A',text:'Compose or arrange music'},
    {index:10,area:'S',text:'Give career guidance to people'},
    {index:11,area:'E',text:'Start your own business'},
    {index:12,area:'C',text:'Operate a calculator'},
    {index:13,area:'R',text:'Assemble electronic parts'},
    {index:14,area:'I',text:'Conduct chemical experiments'},
    {index:15,area:'A',text:'Create special effects for movies'},
    {index:16,area:'S',text:'Perform rehabilitation therapy'},
    {index:17,area:'E',text:'Negotiate business contracts'},
    {index:18,area:'C',text:'Keep shipping and receiving records'},
    {index:19,area:'R',text:'Drive a truck to deliver packages to offices and homes'},
    {index:20,area:'I',text:'Examine blood samples using a microscope'},
    {index:21,area:'A',text:'Paint sets for plays'},
    {index:22,area:'S',text:'Do volunteer work at a non-profit organization'},
    {index:23,area:'E',text:'Market a new line of clothing'},
    {index:24,area:'C',text:'Inventory supplies using a hand-held computer'},
    {index:25,area:'R',text:'Test the quality of parts before shipment'},
    {index:26,area:'I',text:'Develop a way to better predict the weather'},
    {index:27,area:'A',text:'Write scripts for movies or television shows'},
    {index:28,area:'S',text:'Teach a high-school class'},
    {index:29,area:'E',text:'Sell merchandise at a department store'},
    {index:30,area:'C',text:'Stamp, sort, and distribute mail for an organization'}
  ];

  const IP_ANSWERS = [
    {value:1,label:'Strongly Dislike',emoji:'😣'},
    {value:2,label:'Dislike',emoji:'🙁'},
    {value:3,label:'Unsure',emoji:'😐'},
    {value:4,label:'Like',emoji:'🙂'},
    {value:5,label:'Strongly Like',emoji:'🤩'}
  ];
  const IP_AREA_ICON = {R:'🛠️',I:'🔬',A:'🎨',S:'🤝',E:'🚀',C:'📋'};

  const CAREERS = [
    {title:'Electricians',code:'R',styles:['hands'],training:['mid','open'],env:['active','variety','open'],people:['mix','solo','open'],sector:'Skilled Trades',why:'Hands-on systems, troubleshooting, and visible results.'},
    {title:'Heating, Air Conditioning, and Refrigeration Mechanics and Installers',code:'R',styles:['hands','ideas'],training:['short','mid','open'],env:['active','variety','open'],people:['mix','solo','open'],sector:'Skilled Trades',why:'Mechanical systems, diagnostics, and field-based problem solving.'},
    {title:'Welders, Cutters, Solderers, and Brazers',code:'R',styles:['hands'],training:['short','mid','open'],env:['active','indoor','open'],people:['mix','solo','open'],sector:'Manufacturing',why:'Hands-on precision, equipment, and producing a finished result.'},
    {title:'Computer Numerically Controlled Tool Operators',code:'RC',styles:['hands','organize'],training:['short','mid','open'],env:['indoor','open'],people:['mix','solo','open'],sector:'Manufacturing',why:'Technology, precision, equipment, and quality control.'},
    {title:'Computer User Support Specialists',code:'IRC',styles:['ideas','help','organize'],training:['short','mid','open'],env:['indoor','open'],people:['people','mix','open'],sector:'Technology',why:'Troubleshooting plus helping people solve technology problems.'},
    {title:'Computer Network Support Specialists',code:'IRC',styles:['ideas','hands','organize'],training:['mid','long','open'],env:['indoor','variety','open'],people:['mix','solo','open'],sector:'Technology',why:'Technical troubleshooting, systems thinking, and network reliability.'},
    {title:'Medical Assistants',code:'SCR',styles:['help','hands','organize'],training:['short','mid','open'],env:['indoor','open'],people:['people','mix','open'],sector:'Healthcare',why:'Patient interaction, clinical tasks, and organized healthcare support.'},
    {title:'Registered Nurses',code:'SIR',styles:['help','ideas','hands'],training:['mid','long','open'],env:['indoor','variety','open'],people:['people','mix','open'],sector:'Healthcare',why:'Helping people, clinical judgment, teamwork, and problem solving.'},
    {title:'Nursing Assistants',code:'SR',styles:['help','hands'],training:['short','open'],env:['active','indoor','open'],people:['people','mix','open'],sector:'Healthcare',why:'Direct care, teamwork, and helping people with everyday needs.'},
    {title:'Graphic Designers',code:'AIE',styles:['create','ideas'],training:['mid','long','open'],env:['indoor','open'],people:['mix','solo','open'],sector:'Creative & Business',why:'Visual creativity combined with technology and client needs.'},
    {title:'Public Relations Specialists',code:'EAS',styles:['lead','create','help'],training:['long','open'],env:['indoor','variety','open'],people:['people','mix','open'],sector:'Business',why:'Communication, storytelling, persuasion, and relationship building.'},
    {title:'Customer Service Representatives',code:'SEC',styles:['help','lead','organize'],training:['short','open'],env:['indoor','open'],people:['people','mix','open'],sector:'Business Services',why:'Communication, problem solving, and helping customers navigate issues.'},
    {title:'Human Resources Specialists',code:'ESC',styles:['help','lead','organize'],training:['long','open'],env:['indoor','open'],people:['people','mix','open'],sector:'Business',why:'People, policies, communication, and organized decision making.'},
    {title:'Sales Representatives',code:'EC',styles:['lead','help'],training:['short','mid','long','open'],env:['indoor','variety','open'],people:['people','mix','open'],sector:'Business',why:'Persuasion, relationships, goals, and understanding customer needs.'},
    {title:'Bookkeeping, Accounting, and Auditing Clerks',code:'C',styles:['organize','ideas'],training:['short','mid','open'],env:['indoor','open'],people:['mix','solo','open'],sector:'Business',why:'Numbers, accuracy, records, and maintaining reliable financial information.'},
    {title:'Logisticians',code:'CEI',styles:['organize','ideas','lead'],training:['long','open'],env:['indoor','variety','open'],people:['mix','people','open'],sector:'Transportation & Logistics',why:'Planning, systems, coordination, and solving movement or supply problems.'},
    {title:'Construction Laborers',code:'R',styles:['hands'],training:['short','open'],env:['active','variety','open'],people:['mix','solo','open'],sector:'Construction',why:'Physical, hands-on work where progress is visible.'},
    {title:'Heavy and Tractor-Trailer Truck Drivers',code:'RC',styles:['hands','organize'],training:['short','open'],env:['active','variety','open'],people:['solo','mix','open'],sector:'Transportation & Logistics',why:'Independent responsibility, equipment, routes, and movement of goods.'}
  ];

  const CAREER_SOC={
    'Electricians':'47-2111','Heating, Air Conditioning, and Refrigeration Mechanics and Installers':'49-9021','Welders, Cutters, Solderers, and Brazers':'51-4121','Computer Numerically Controlled Tool Operators':'51-9161','Computer User Support Specialists':'15-1232','Computer Network Support Specialists':'15-1231','Medical Assistants':'31-9092','Registered Nurses':'29-1141','Nursing Assistants':'31-1131','Graphic Designers':'27-1024','Public Relations Specialists':'27-3031','Customer Service Representatives':'43-4051','Human Resources Specialists':'13-1071','Sales Representatives':'41-3091','Bookkeeping, Accounting, and Auditing Clerks':'43-3031','Logisticians':'13-1081','Construction Laborers':'47-2061','Heavy and Tractor-Trailer Truck Drivers':'53-3032'
  };

  const SECTORS = [
    {name:'Health Care & Social Assistance',jobs:'+113,466',annual:'2.1% annual growth'},
    {name:'Construction',jobs:'+51,798',annual:'2.1% annual growth'},
    {name:'Manufacturing',jobs:'+29,435',annual:'1.4% annual growth'},
    {name:'Leisure & Hospitality',jobs:'+55,725',annual:'1.3% annual growth'},
    {name:'Trade, Transportation & Utilities',jobs:'+87,273',annual:'1.3% annual growth'},
    {name:'Arizona Total',jobs:'+454,167',annual:'1.2% annual growth'}
  ];

  const $ = id => document.getElementById(id);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const blankScores = () => ({R:0,I:0,A:0,S:0,E:0,C:0});
  const blankEvidence = () => ({entry:'',median:'',outlook:'',openings:'',prep:'',source:'',takeaway:''});
  const fresh = () => ({
    view:'home',
    facilitated:true,
    interest:{scores:blankScores(),top:[],answers:{},page:0,complete:false},
    alignment:{style:'',training:'',environment:'',people:'',geoScope:'state',geoState:'az',geoCounty:'',matches:[],selected:[],browseAll:false,query:'',complete:false},
    lmi:{evidence:{},complete:false},
    tree:{branches:{primary:'',alternate:'',surprise:''},complete:false,completedAt:null},
    xp:0,
    updatedAt:new Date().toISOString()
  });

  let state = load();
  let laborData = null;

  function load(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      return raw?merge(fresh(),JSON.parse(raw)):fresh();
    }catch{
      return fresh();
    }
  }

  function merge(base,next){
    const out={...base,...next};
    out.interest={
      ...base.interest,
      ...(next.interest||{}),
      scores:{...base.interest.scores,...(next.interest?.scores||{})},
      answers:{...base.interest.answers,...(next.interest?.answers||{})}
    };
    out.interest.page=Math.max(0,Math.min(4,Number(out.interest.page||0)));
    out.alignment={...base.alignment,...(next.alignment||{})};
    out.lmi={...base.lmi,...(next.lmi||{}),evidence:{...base.lmi.evidence,...(next.lmi?.evidence||{})}};
    out.tree={...base.tree,...(next.tree||{}),branches:{...base.tree.branches,...(next.tree?.branches||{})}};
    return out;
  }

  function save(){
    state.updatedAt=new Date().toISOString();

    // Browser storage can be unavailable or full. Keep the live session usable
    // even when either persistence layer rejects a write.
    try{
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    }catch(error){
      console.warn('Career Tree local progress could not be saved; continuing for this session.',error);
    }

    try{
      window.LevelUpOfflineProgress?.save(MODULE_ID,state,{
        xp:state.xp,
        isComplete:state.tree.complete,
        completedAt:state.tree.completedAt
      });
    }catch(error){
      console.warn('Career Tree progress mirror could not be saved; continuing for this session.',error);
    }

    updateTop();
  }

  function milestones(){
    return [state.interest.complete,state.alignment.complete,state.lmi.complete,state.tree.complete].filter(Boolean).length;
  }

  function updateTop(){
    const done=milestones();
    $('progressText').textContent=`${done} of 4 milestones complete`;
    $('progressBar').style.width=`${done/4*100}%`;
    $('facilitatedToggle').setAttribute('aria-pressed',String(state.facilitated));
    $('facilitatedToggle').textContent=state.facilitated?'🎓 Facilitated Mode':'👤 Self-Paced Mode';
    const facilitatorNodes=typeof document.querySelectorAll==='function'
      ?document.querySelectorAll('[data-facilitator]')
      :null;
    if(facilitatorNodes){
      for(const element of facilitatorNodes)element.hidden=!state.facilitated;
    }
  }

  function canView(view){
    if(view==='home'||view==='interest')return true;
    if(view==='alignment')return true;
    if(view==='lmi')return state.alignment.complete;
    if(view==='tree')return state.lmi.complete;
    return false;
  }

  function show(view){
    if(!canView(view))view='home';
    VIEWS.forEach(v=>{
      const el=$('view'+v[0].toUpperCase()+v.slice(1));
      if(el)el.hidden=v!==view;
    });
    state.view=view;
    save();
    if(view==='home')renderHome();
    if(view==='interest')renderInterest();
    if(view==='alignment')renderAlignment();
    if(view==='lmi')renderLmi();
    if(view==='tree')renderTree();
    history.replaceState(null,'',`#${view}`);
    window.scrollTo(0,0);
  }

  function renderHome(){
    const cards=$$('.journey-card');
    const allowed={interest:true,alignment:true,lmi:state.alignment.complete,tree:state.lmi.complete};
    cards.forEach(card=>{
      const v=card.dataset.view;
      card.disabled=!allowed[v];
      card.classList.toggle('locked',!allowed[v]);
    });
    $('homeInterestStatus').textContent=state.interest.complete?`Complete • ${state.interest.top.join('')}`:'Start →';
    $('homeAlignmentStatus').textContent=state.alignment.complete?`${state.alignment.selected.length} careers saved ✓`:'Explore independently →';
    $('homeLmiStatus').textContent=state.lmi.complete?'Evidence captured ✓':state.alignment.complete?'Available →':'Locked';
    $('homeTreeStatus').textContent=state.tree.complete?'Career Tree complete ✓':state.lmi.complete?'Available →':'Locked';
    const hasProgress=milestones()>0;
    $('resumeBtn').hidden=!hasProgress;
    if(hasProgress)$('resumeBtn').textContent=`Continue ${nextStageLabel()} →`;
  }

  function nextStageLabel(){
    if(!state.interest.complete)return'Discover Me';
    if(!state.alignment.complete)return'Career Alignment';
    if(!state.lmi.complete)return'LMI Lab';
    return'My Career Tree';
  }

  function nextView(){
    if(!state.interest.complete)return'interest';
    if(!state.alignment.complete)return'alignment';
    if(!state.lmi.complete)return'lmi';
    return'tree';
  }

  function answeredCount(){
    return IP_QUESTIONS.filter(q=>Number(state.interest.answers[q.index])>=1).length;
  }

  function pageQuestions(page=state.interest.page){
    return IP_QUESTIONS.slice(page*6,page*6+6);
  }

  function pageIsComplete(page=state.interest.page){
    return pageQuestions(page).every(q=>Number(state.interest.answers[q.index])>=1);
  }

  function updateIpStatus(){
    const answered=answeredCount();
    const start=state.interest.page*6+1;
    const end=Math.min(start+5,30);
    $('ipPageLabel').textContent=`Set ${state.interest.page+1} of 5 • Questions ${start}–${end}`;
    $('ipCount').textContent=`${answered} / 30 answered`;
    $('ipProgress').style.width=`${Math.round(answered/30*100)}%`;
  }

  function computeInterestResults(){
    const scores=blankScores();
    IP_QUESTIONS.forEach(q=>{
      const response=Number(state.interest.answers[q.index]);
      if(response>=1&&response<=5)scores[q.area]+=response-1;
    });
    const order=['R','I','A','S','E','C'];
    const ranked=order.slice().sort((a,b)=>scores[b]-scores[a]||order.indexOf(a)-order.indexOf(b));
    state.interest.scores=scores;
    state.interest.top=ranked.slice(0,3);
    state.interest.complete=true;
    state.xp=Math.max(state.xp,100);
    save();
  }

  function retakeInterest(){
    state.interest.answers={};
    state.interest.scores=blankScores();
    state.interest.top=[];
    state.interest.page=0;
    state.interest.complete=false;
    state.alignment={...fresh().alignment};
    state.lmi={...fresh().lmi};
    state.tree={...fresh().tree};
    save();
    renderInterest();
    $('ipQuestions').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function artSlot(q){
    const file=`onet-${String(q.index).padStart(2,'0')}.webp`;
    return `<div aria-hidden="true" style="min-height:190px;border:1px solid rgba(114,215,255,.22);border-radius:16px;display:grid;place-items:center;position:relative;overflow:hidden;background-image:linear-gradient(145deg,rgba(7,17,38,.18),rgba(7,17,38,.78)),url('assets/onet/${file}');background-size:cover;background-position:center;">
      <div style="text-align:center;padding:18px;text-shadow:0 2px 14px rgba(0,0,0,.9)">
        <div style="font-size:3rem;margin-bottom:8px">${IP_AREA_ICON[q.area]}</div>
        <strong style="display:block;font-size:.78rem;letter-spacing:.08em;color:#d9ecff">VISUAL SLOT ${String(q.index).padStart(2,'0')}</strong>
        <small style="display:block;margin-top:5px;color:#aab7d3">assets/onet/${file}</small>
      </div>
    </div>`;
  }

  function questionCard(q){
    const selected=Number(state.interest.answers[q.index]||0);
    return `<section class="ip-question" data-question="${q.index}">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px;align-items:stretch">
        ${artSlot(q)}
        <div style="display:flex;flex-direction:column;justify-content:center">
          <span class="eyebrow">WORK ACTIVITY ${q.index} OF 30</span>
          <h3 style="font-size:clamp(1.25rem,2.4vw,1.75rem);margin:.45rem 0 1rem">${q.text}</h3>
          <p style="color:#b9c5dd;margin-top:0">How would you feel about doing this kind of work?</p>
          <div class="answer-scale" role="radiogroup" aria-label="${escapeAttr(q.text)}">
            ${IP_ANSWERS.map(a=>`<label>
              <input type="radio" name="ip-${q.index}" value="${a.value}" data-ip-answer="${q.index}" ${selected===a.value?'checked':''}>
              <span><b style="font-size:1.15rem;margin-right:6px">${a.emoji}</b>${a.label}</span>
            </label>`).join('')}
          </div>
        </div>
      </div>
    </section>`;
  }

  function renderInterestResults(){
    const results=$('interestResults');
    results.hidden=!state.interest.complete;
    if(!state.interest.complete)return;
    const top=state.interest.top||[];
    $('riasecCode').textContent=`${top.join('')} • ${top.map(k=>RIASEC[k].name).join(' + ')}`;
    $('riasecSummary').textContent=`Your strongest interest clues are ${top.map(k=>RIASEC[k].name).join(', ')}. These are starting points for exploration—not a career assignment.`;
    $('riasecBars').innerHTML=Object.entries(RIASEC).map(([k,v])=>{
      const score=Number(state.interest.scores[k]||0);
      return `<div class="riasec-row"><strong>${k} • ${v.name}</strong><div class="bar"><i style="width:${Math.round(score/20*100)}%"></i></div><span>${score}/20</span></div>`;
    }).join('');
    const actions=results.querySelector('.results-actions');
    actions.innerHTML=`<button id="interestRetake" class="secondary-btn" type="button">Retake embedded profiler</button><button id="interestContinue" class="primary-btn" type="button">Use these clues in Career Alignment →</button>`;
    $('interestRetake').onclick=retakeInterest;
    $('interestContinue').onclick=()=>show('alignment');
  }

  function renderInterest(){
    const wrap=$('ipQuestions');
    const hasEmbeddedAnswers=answeredCount()>0;

    // Preserve legacy completed profiles from the earlier external O*NET workflow.
    if(state.interest.complete&&!hasEmbeddedAnswers){
      $('ipPageLabel').textContent='Previous O*NET® profile saved';
      $('ipCount').textContent='Legacy result';
      $('ipProgress').style.width='100%';
      $('ipPrev').hidden=true;
      $('ipNext').hidden=true;
      wrap.innerHTML=`<section class="ip-question">
        <span class="eyebrow">CAREER TREE UPDATE</span>
        <h2>Your previous O*NET® results are still saved.</h2>
        <p>Career Tree now includes the full 30-question Mini Interest Profiler directly inside Level Up. You can keep your existing profile or retake the assessment here to experience the new version.</p>
        <button id="legacyRetake" class="primary-btn" type="button">Take the embedded profiler →</button>
      </section>`;
      $('legacyRetake').onclick=retakeInterest;
      renderInterestResults();
      return;
    }

    state.interest.page=Math.max(0,Math.min(4,Number(state.interest.page||0)));
    updateIpStatus();

    const facilitator=state.facilitated&&state.interest.page===0
      ? `<aside class="facilitator-pause" style="margin-top:0"><span>🎓 FACILITATOR PAUSE</span><strong>Answer for interest—not skill, pay, or training.</strong><p>Ask students: “Would I enjoy doing this?” A low rating is not a judgment about the value of the work or whether they could learn it.</p></aside>`
      : '';

    wrap.innerHTML=facilitator+pageQuestions().map(questionCard).join('');

    $$('[data-ip-answer]').forEach(input=>{
      input.onchange=evt=>{
        state.interest.answers[evt.target.dataset.ipAnswer]=Number(evt.target.value);
        save();
        updateIpStatus();
      };
    });

    $('ipPrev').hidden=state.interest.page===0;
    $('ipPrev').onclick=()=>{
      state.interest.page=Math.max(0,state.interest.page-1);
      save();
      renderInterest();
      $('ipQuestions').scrollIntoView({behavior:'smooth',block:'start'});
    };

    $('ipNext').hidden=false;
    $('ipNext').textContent=state.interest.page===4?'See my interest profile →':'Next six →';
    $('ipNext').onclick=()=>{
      if(!pageIsComplete()){
        alert('Answer all six work activities on this set before continuing.');
        return;
      }
      if(state.interest.page<4){
        state.interest.page+=1;
        save();
        renderInterest();
        $('ipQuestions').scrollIntoView({behavior:'smooth',block:'start'});
        return;
      }
      if(answeredCount()<30){
        alert('Answer all 30 work activities before building your interest profile.');
        return;
      }
      computeInterestResults();
      renderInterest();
      $('interestResults').scrollIntoView({behavior:'smooth',block:'start'});
    };

    renderInterestResults();
  }

  function alignmentScore(c){
    const codes=[...new Set(String(c.code||'').split('').filter(code=>RIASEC[code]))];
    const scores=state.interest.scores||blankScores();
    const hasInterestProfile=state.interest.complete&&Array.isArray(state.interest.top)&&state.interest.top.length>0;
    const interestFit=hasInterestProfile&&codes.length?codes.reduce((sum,code)=>sum+Math.max(0,Math.min(20,Number(scores[code]||0))),0)/(codes.length*20):0;
    let preferenceMatches=0,preferenceCount=0;
    const preferenceReasons=[];
    [['style','styles','activity'],['training','training','preparation time'],['environment','env','work environment'],['people','people','people interaction']].forEach(([field,list,label])=>{
      const value=state.alignment[field];
      if(!value||value==='open')return;
      preferenceCount+=1;
      if(Array.isArray(c[list])&&c[list].includes(value)){preferenceMatches+=1;preferenceReasons.push(label);}
    });
    const preferenceFit=preferenceCount?preferenceMatches/preferenceCount:null;
    const combinedFit=!hasInterestProfile?(preferenceFit===null?0:preferenceFit):(preferenceFit===null?interestFit:(interestFit*.6+preferenceFit*.4));
    const top=hasInterestProfile?state.interest.top:[];
    const alignedAreas=codes.filter(code=>top.includes(code)).map(code=>RIASEC[code].name);
    const reasons=[];
    if(!hasInterestProfile)reasons.push('your work preferences and selected location');
    if(alignedAreas.length)reasons.push(`${alignedAreas.join(' + ')} O*NET interest${alignedAreas.length>1?'s':''}`);
    if(preferenceReasons.length)reasons.push(`your ${preferenceReasons.slice(0,2).join(' + ')} preference${preferenceReasons.length>1?'s':''}`);
    return {score:Math.round(combinedFit*100),interestScore:Math.round(interestFit*100),reasons};
  }

  function readAlignmentForm(){
    const fd=new FormData($('alignmentForm'));
    ['style','training','environment','people'].forEach(k=>state.alignment[k]=String(fd.get(k)||''));
    save();
  }

  async function getLaborData(){if(laborData)return laborData;const r=await fetch('data/lightcast-lmi.json',{cache:'force-cache'});if(!r.ok)throw Error('Local occupation data could not be loaded.');const d=await r.json();if(d.sourceStatus!=='loaded'||!d.geographies||!d.catalog)throw Error('County and state occupation data is not ready. Refresh and try again.');laborData=d;return d;}
  function alignmentGeoKey(){return state.alignment.geoScope==='county'?state.alignment.geoCounty:state.alignment.geoState;}
  function clearAlignmentResults(){state.alignment.matches=[];state.alignment.selected=[];state.alignment.browseAll=false;state.alignment.query='';state.alignment.complete=false;state.lmi={...fresh().lmi};state.tree={...fresh().tree};$('matchResults').hidden=true;save();}
  async function populateAlignmentCounties(){
    const d=await getLaborData(),suffix=state.alignment.geoState==='az'?', Arizona':', New Mexico';
    const rows=Object.entries(d.geographies).filter(([key,g])=>key!==state.alignment.geoState&&g.label?.endsWith(suffix)).sort((a,b)=>a[1].label.localeCompare(b[1].label));
    const select=$('alignmentCounty');select.innerHTML=rows.map(([k,g])=>`<option value="${escapeAttr(k)}">${escapeText(g.label.replace(/, (Arizona|New Mexico)$/,''))}</option>`).join('');
    if(!rows.some(([k])=>k===state.alignment.geoCounty))state.alignment.geoCounty=rows[0]?.[0]||'';
    if(state.alignment.geoScope==='county'&&state.alignment.geoCounty)select.value=state.alignment.geoCounty;
    select.hidden=state.alignment.geoScope!=='county';$('alignmentCountyLabel').hidden=state.alignment.geoScope!=='county';
    const byTitle=new Map(Object.entries(d.catalog).map(([k,v])=>[v.title,k]));state.alignment.matches=(state.alignment.matches||[]).map(v=>byTitle.get(v)||v);
  }
  function updateAlignmentLocationNote(){const g=laborData?.geographies?.[alignmentGeoKey()];$('alignmentLocationNote').textContent=g?`Career possibilities will be limited to occupations represented in ${g.label} labor-market data. Some occupations may not have local wage estimates.`:'Choose a state or county before building possibilities.';}
  function occupationsForAlignment(d){
    const g=d.geographies?.[alignmentGeoKey()];if(!g)return [];const styleMap={R:'hands',I:'ideas',A:'create',S:'help',E:'lead',C:'organize'};
    return Object.entries(d.catalog||{}).flatMap(([soc,meta])=>{
      const w=g.occupations?.[soc],interests=Array.isArray(meta.interests)?meta.interests:[];if(!w||!interests.length)return [];
      const pay=[w.entryHourly,w.medianHourly,w.experiencedHourly].some(v=>typeof v==='number'&&v>0),emp=w.employment,represented=(typeof emp==='number'&&emp>0)||emp==='<10';if(!pay&&!represented)return [];
      const c=CAREERS.find(x=>CAREER_SOC[x.title]===soc),edu=String(meta.typicalEducation||'').toLowerCase(),ojt=String(meta.typicalOjt||'').toLowerCase();
      const short=/no formal|high school|some high school/.test(edu)&&!/long-term|internship|residency|apprenticeship/.test(ojt),long=/bachelor|master|doctoral|professional degree/.test(edu)||/long-term|internship|residency/.test(ojt);
      const training=short?['short','open']:long?['long','open']:['mid','open'],styles=[...new Set(interests.map(x=>styleMap[x]).filter(Boolean))],major=soc.slice(0,2),env=['45','47','49','51','53'].includes(major)?['active','variety','open']:['indoor','variety','open'],people=interests.some(x=>x==='S'||x==='E')?['people','mix','open']:['mix','solo','open'];
      return [{...(c||{}),title:meta.title||soc,soc,code:c?.code||interests.join(''),styles:c?.styles||styles,training:c?.training||training,env:c?.env||env,people:c?.people||people,why:c?.why||'This occupation appears in local labor-market data and shares themes from your O*NET interests.',sector:c?.sector||'Local occupation'}];
    });
  }
  async function buildCareerMatches(){const d=await getLaborData(),g=d.geographies?.[alignmentGeoKey()];if(!g)throw Error('Choose a state or county with available occupation data.');const ranked=occupationsForAlignment(d).map(c=>({...c,...alignmentScore(c)})).sort((a,b)=>b.score-a.score).slice(0,9).map(c=>c.soc);if(!ranked.length)throw Error(`No occupations with local labor-market records were found for ${g.label}. Choose a broader geography.`);const byTitle=new Map(Object.entries(d.catalog).map(([code,item])=>[item.title,code]));const alreadySelected=state.alignment.selected.map(title=>byTitle.get(title)).filter(Boolean);state.alignment.matches=[...ranked,...alreadySelected.filter(code=>!ranked.includes(code))];save();return g;}

  function renderAlignmentProfile(){
    const hasInterestProfile=state.interest.complete&&Array.isArray(state.interest.top)&&state.interest.top.length>0;
    const intro=$('alignmentProfileTitle').parentElement.querySelector('p');
    intro.textContent=hasInterestProfile?'These six scores come from your 30 answers. Stronger areas are clues we’ll combine with what you like doing and your other preferences.':'Discover Me is optional. Explore careers now using your work preferences and location, or complete the 30-question O*NET activity to add your interest clues.';
    $('alignmentRiasec').hidden=false;
    $('alignmentRiasecBars').hidden=!hasInterestProfile;
    if(!hasInterestProfile){
      $('alignmentRiasec').innerHTML=`<div class="alignment-onet-placeholder" role="status">
        <div class="alignment-onet-placeholder-copy"><span class="eyebrow">OPTIONAL • 30 QUESTIONS</span><strong>Your O*NET interest results will appear here</strong><p>Complete Discover Me to add your interest clues to career matches. You can explore by location and work preferences without it.</p></div>
        <div class="alignment-onet-areas" aria-label="RIASEC interest areas"><span>Realistic</span><span>Investigative</span><span>Artistic</span><span>Social</span><span>Enterprising</span><span>Conventional</span></div>
        <button id="alignmentCompleteOnet" class="primary-btn" type="button">Complete Discover Me →</button>
      </div>`;
      $('alignmentRiasecBars').innerHTML='';
      $('alignmentCompleteOnet').onclick=()=>show('interest');
      return;
    }
    const top=state.interest.top||[];
    $('alignmentRiasec').innerHTML=top.map((code,index)=>`<span class="chip ${index===0?'primary':''}">${index+1} • ${RIASEC[code].name}</span>`).join('');
    $('alignmentRiasecBars').innerHTML=Object.entries(RIASEC).map(([code,area])=>{
      const value=Math.max(0,Math.min(20,Number(state.interest.scores?.[code]||0)));
      return `<div class="riasec-row ${top.includes(code)?'is-top':''}"><strong>${code} • ${area.name}</strong><div class="bar"><i style="width:${Math.round(value/20*100)}%"></i></div><span>${value}/20</span></div>`;
    }).join('');
  }

  function renderAlignment(){
    renderAlignmentProfile();
    ['style','training','environment','people'].forEach(k=>{const e=document.querySelector(`input[name="${k}"][value="${state.alignment[k]}"]`);if(e)e.checked=true;});
    $('alignmentForm').onchange=async()=>{readAlignmentForm();if(state.alignment.matches.length){try{await buildCareerMatches();renderCareerCards();}catch(e){$('alignmentLocationNote').textContent=e.message;}}};
    $('alignmentScope').value=state.alignment.geoScope||'state';$('alignmentState').value=state.alignment.geoState||'az';
    $('alignmentScope').onchange=async()=>{state.alignment.geoScope=$('alignmentScope').value;await populateAlignmentCounties();clearAlignmentResults();updateAlignmentLocationNote();};
    $('alignmentState').onchange=async()=>{state.alignment.geoState=$('alignmentState').value;state.alignment.geoCounty='';await populateAlignmentCounties();clearAlignmentResults();updateAlignmentLocationNote();};
    $('alignmentCounty').onchange=()=>{state.alignment.geoCounty=$('alignmentCounty').value;clearAlignmentResults();updateAlignmentLocationNote();};
    const has=state.alignment.matches.length>0;$('matchResults').hidden=!has;
    $('browseAllCareers').textContent=state.alignment.browseAll?'Show my strongest matches':'Browse all occupations in this area';$('alignmentCareerSearch').hidden=!state.alignment.browseAll;$('alignmentCareerSearch').value=state.alignment.query||'';
    $('browseAllCareers').onclick=()=>{state.alignment.browseAll=!state.alignment.browseAll;state.alignment.query='';$('alignmentCareerSearch').value='';$('alignmentCareerSearch').hidden=!state.alignment.browseAll;$('browseAllCareers').textContent=state.alignment.browseAll?'Show my strongest matches':'Browse all occupations in this area';renderCareerCards();};
    $('alignmentCareerSearch').oninput=()=>{state.alignment.query=$('alignmentCareerSearch').value;renderCareerCards();};
    populateAlignmentCounties().then(()=>{updateAlignmentLocationNote();if(has)renderCareerCards();}).catch(e=>{$('alignmentLocationNote').textContent=e.message;$('buildMatches').disabled=true;});
    $('buildMatches').onclick=async()=>{
      readAlignmentForm();if(!state.alignment.style||!state.alignment.training||!state.alignment.environment||!state.alignment.people){alert('Choose one response in each section so Career Tree can layer your interests with your preferences.');return;}
      const btn=$('buildMatches');btn.disabled=true;btn.textContent='Finding local possibilities…';
      try{const g=await buildCareerMatches();$('careerResultsDescription').textContent=`Showing occupations represented in ${g.label} labor-market data. Choose careers to explore. Results combine O*NET interest clues with your preferences.`;$('matchResults').hidden=false;renderCareerCards();$('matchResults').scrollIntoView({behavior:'smooth'});}
      catch(e){alert(e.message||'Career possibilities could not be loaded.');}
      finally{btn.disabled=false;btn.textContent='Build my career possibilities →';}
    };
    $('alignmentContinue').onclick=()=>{if(state.alignment.selected.length<3){alert('Explore at least three careers before moving to the LMI Lab.');return;}state.alignment.complete=true;state.xp=Math.max(state.xp,250);save();show('lmi');};
  }

  function renderCareerCards(){
    const local=occupationsForAlignment(laborData||{}),byCode=new Map(local.map(c=>[c.soc,c]));
    const rows=(state.alignment.browseAll?local:state.alignment.matches.map(code=>byCode.get(code)).filter(Boolean)).map(c=>({...c,...alignmentScore(c)})).sort((a,b)=>b.score-a.score);
    const q=String(state.alignment.query||'').trim().toLowerCase(),visible=rows.filter(c=>!q||c.title.toLowerCase().includes(q));
    $('alignmentCareerCount').textContent=state.alignment.browseAll?`${visible.length.toLocaleString()} of ${rows.length.toLocaleString()} local occupations`:`${visible.length} career possibilities`;
    $('careerCards').innerHTML=visible.map(c=>{
      const selected=state.alignment.selected.includes(c.title),why=c.reasons.slice(0,2).join(' + ')||c.why,w=laborData?.geographies?.[alignmentGeoKey()]?.occupations?.[c.soc]||{};
      const note=[w.entryHourly,w.medianHourly,w.experiencedHourly].some(v=>typeof v==='number'&&v>0)?'<div class="why">Local wage data is available in this area.</div>':'<div class="why">This occupation is represented locally, but a wage estimate is unavailable here.</div>';
      return `<article class="career-card ${selected?'selected':''}"><span class="eyebrow">${escapeText(c.sector)}</span><h3>${escapeText(c.title)}</h3><p>${escapeText(c.why)}</p><div class="career-fit" aria-label="Interest and preference fit ${c.score} percent"><span>Interest + preference fit</span><strong>${c.score}%</strong><div class="career-fit-track"><i style="width:${c.score}%"></i></div></div><div class="why">Why it surfaced: ${escapeText(why)}</div>${note}<button class="${selected?'secondary-btn':'primary-btn'} career-select" data-career="${escapeAttr(c.title)}" type="button">${selected?'✓ Added to next step':'Explore this career →'}</button></article>`;
    }).join('');
    $$('.career-select').forEach(btn=>btn.onclick=()=>{const title=btn.dataset.career,i=state.alignment.selected.indexOf(title);if(i>=0)state.alignment.selected.splice(i,1);else if(state.alignment.selected.length<5)state.alignment.selected.push(title);else{alert('Select up to five careers to explore.');return;}save();renderCareerCards();});
  }

  function escapeAttr(s){
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  function renderLmi(){
    $('sectorCards').innerHTML=SECTORS.map(s=>`<article class="sector-card"><span class="eyebrow">${s.name}</span><strong>${s.jobs}</strong><p>${s.annual} • projected employment change, 2024–2034</p></article>`).join('');
    const careers=state.alignment.selected;
    if(!careers.length){show('alignment');return;}
    careers.forEach(t=>{if(!state.lmi.evidence[t])state.lmi.evidence[t]=blankEvidence();});
    const active=sessionStorage.getItem('career-tree-lmi-active')||careers[0];
    renderLmiTabs(careers.includes(active)?active:careers[0]);
    $('lmiContinue').onclick=()=>{
      const filled=careers.filter(t=>evidenceCount(state.lmi.evidence[t])>=2);
      if(filled.length<3){
        alert('Capture at least two pieces of LMI evidence for at least three careers before building your tree.');
        return;
      }
      state.lmi.complete=true;
      state.xp=Math.max(state.xp,450);
      save();
      show('tree');
    };
  }

  function evidenceCount(e){
    return ['entry','median','outlook','openings','prep','takeaway'].filter(k=>String(e?.[k]||'').trim()).length;
  }

  function renderLmiTabs(active){
    const careers=state.alignment.selected;
    $('lmiCareerTabs').innerHTML=careers.map(t=>`<button class="tab-btn ${t===active?'active':''}" data-tab="${escapeAttr(t)}" type="button">${t}</button>`).join('');
    $$('.tab-btn').forEach(b=>b.onclick=()=>{
      sessionStorage.setItem('career-tree-lmi-active',b.dataset.tab);
      renderLmiTabs(b.dataset.tab);
    });
    const e=state.lmi.evidence[active]||blankEvidence();
    const career=CAREERS.find(c=>c.title===active);
    $('lmiCareerPanel').innerHTML=`<div class="lmi-panel">
      <span class="eyebrow">${career?.sector||'CAREER'} • INVESTIGATE</span>
      <h3>${active}</h3>
      <div class="evidence-grid">
        <label>Entry / lower wage<input data-evidence="entry" value="${escapeAttr(e.entry)}" placeholder="Example: $___ / hour"></label>
        <label>Median wage<input data-evidence="median" value="${escapeAttr(e.median)}" placeholder="Example: $___ / hour"></label>
        <label>Growth / outlook<input data-evidence="outlook" value="${escapeAttr(e.outlook)}" placeholder="Growing? Declining? % if available"></label>
        <label>Projected openings<input data-evidence="openings" value="${escapeAttr(e.openings)}" placeholder="Annual or period openings"></label>
        <label>Typical preparation<input data-evidence="prep" value="${escapeAttr(e.prep)}" placeholder="Education, credential, license, apprenticeship..."></label>
        <label>Source / year<input data-evidence="source" value="${escapeAttr(e.source)}" placeholder="OEO / O*NET / other + year"></label>
        <label style="grid-column:1/-1">What does this evidence mean for <em>you</em>?<textarea data-evidence="takeaway" placeholder="Keep exploring because... / I need to learn more about...">${escapeText(e.takeaway)}</textarea></label>
      </div>
      <p class="source-note">Career Tree intentionally does not invent wage or demand values. Use the current official tools above, record the source/year, and interpret what the evidence means.</p>
    </div>`;
    $$('[data-evidence]').forEach(input=>input.oninput=evt=>{
      const key=evt.target.dataset.evidence;
      state.lmi.evidence[active][key]=evt.target.value;
      save();
    });
  }

  function escapeText(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function eligibleCareers(){
    return state.alignment.selected.filter(t=>evidenceCount(state.lmi.evidence[t])>=2);
  }

  function renderTree(){
    const options=eligibleCareers();
    if(options.length<3){show('lmi');return;}
    const branches=state.tree.branches;
    const labels=[
      ['primary','Explore Now','The branch you most want to investigate next.'],
      ['alternate','Keep Open','A strong alternative worth keeping on your radar.'],
      ['surprise','Surprise Me','A career you may not have expected but now want to understand.']
    ];
    $('branchCards').innerHTML=labels.map(([key,label,desc])=>`<article class="branch-card">
      <span class="eyebrow">${label}</span>
      <strong>${desc}</strong>
      <select data-branch="${key}">
        <option value="">Choose a career...</option>
        ${options.map(t=>`<option ${branches[key]===t?'selected':''}>${t}</option>`).join('')}
      </select>
      <small id="branch-${key}-evidence"></small>
    </article>`).join('');

    $$('[data-branch]').forEach(sel=>sel.onchange=e=>{
      state.tree.branches[e.target.dataset.branch]=e.target.value;
      save();
      renderBranchEvidence();
    });
    renderBranchEvidence();

    const top=state.interest.top||[];
    $('finalRiasec').innerHTML=`<div class="summary-box"><h3>Interest profile • ${top.join('')}</h3><p>${top.map(k=>`${RIASEC[k].name}: ${state.interest.scores[k]}`).join(' • ')}</p><p>${top.map(k=>RIASEC[k].desc).join(' ')}</p></div>`;
    $('finalEvidence').innerHTML=`<div class="summary-box"><h3>Your decision rule</h3><p><b>Fit + opportunity + preparation + evidence.</b> A career can sound interesting and still require more investigation. Your tree records what is worth exploring next.</p></div>`;
    $('completeTree').textContent=state.tree.complete?'Career Tree Complete ✓':'Complete Career Tree ✓';
    $('completionPanel').hidden=!state.tree.complete;

    $('completeTree').onclick=()=>{
      const vals=Object.values(state.tree.branches);
      if(vals.some(v=>!v)||new Set(vals).size<3){
        alert('Choose three different careers for your three branches.');
        return;
      }
      state.tree.complete=true;
      state.tree.completedAt=state.tree.completedAt||new Date().toISOString();
      state.xp=Math.max(state.xp,600);
      save();
      renderTree();
      $('completionPanel').scrollIntoView({behavior:'smooth'});
    };
    $('printSummary').onclick=()=>window.print();
    $('reviewTree').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderBranchEvidence(){
    Object.entries(state.tree.branches).forEach(([key,title])=>{
      const el=$(`branch-${key}-evidence`);
      if(!el)return;
      if(!title){el.textContent='';return;}
      const e=state.lmi.evidence[title]||{};
      const pieces=[];
      if(e.entry)pieces.push(`Entry ${e.entry}`);
      if(e.median)pieces.push(`Median ${e.median}`);
      if(e.outlook)pieces.push(`Outlook ${e.outlook}`);
      if(e.prep)pieces.push(`Prep ${e.prep}`);
      el.textContent=pieces.join(' • ')||'LMI evidence captured';
    });
  }

  $('facilitatedToggle').onclick=()=>{
    state.facilitated=!state.facilitated;
    save();
    show(state.view);
  };
  $$('[data-view]').forEach(el=>el.onclick=evt=>{
    if(el.tagName==='A')return;
    evt.preventDefault();
    show(el.dataset.view);
  });
  $('startBtn').onclick=()=>show('interest');
  $('resumeBtn').onclick=()=>show(nextView());
  window.addEventListener('hashchange',()=>{
    const target=location.hash.replace('#','');
    if(VIEWS.includes(target)&&target!==state.view)show(target);
  });

  updateTop();
  const requested=location.hash.replace('#','');
  show(VIEWS.includes(requested)?requested:(state.view||'home'));
})();
