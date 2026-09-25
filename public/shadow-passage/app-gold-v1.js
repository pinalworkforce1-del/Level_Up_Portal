(() => {
  const STORE = 'level-up-shadow-passage-v1';
  const ACCESS_KEY = 'level-up-accessibility-v1';
  const accessDefaults = { auto:true, captions:true, reduce:false, large:false, playbackRate:1 };
  let accessSettings = accessDefaults;
  try{ accessSettings={...accessDefaults,...JSON.parse(localStorage.getItem(ACCESS_KEY)||'{}')}; }catch{ accessSettings={...accessDefaults}; }
  const saveAccessSettings=()=>{ try{localStorage.setItem(ACCESS_KEY,JSON.stringify(accessSettings))}catch{} };
  let cloudReady = false;
  const scenes = [
    { title:'Shadow Passage Unlocked', image:'assets/images/scene-01.webp', media:'assets/video/narration-01.mp4', alt:'Alex stands outside Opportunity Plaza facing a glowing hidden cave entrance labeled Shadow Passage Unlocked — the Cave of Tomorrows.', note:'Enter the passage when the narration ends.', hotspots:[{id:'enter',label:'Enter Shadow Passage',cx:57,cy:53,type:'enter'}] },
    { title:'First Paycheck', image:'assets/images/scene-02.webp', media:'assets/video/narration-02.mp4', alt:'Alex celebrates a first paycheck, then the scene advances through food delivery, gaming purchases, online shopping, subscriptions, and an empty wallet before the next payday.', note:'Explore any two spending choices to continue.', hotspots:[
      {id:'food',label:'Food delivery',cx:12,cy:27,type:'spend',copy:'Convenience can feel small in the moment, but repeated delivery costs can quietly compete with other priorities.'},
      {id:'gaming',label:'Gaming skins',cx:66,cy:27,type:'spend',copy:'Digital purchases are still real spending. Repeated small purchases can add up before the next payday.'},
      {id:'shopping',label:'Online shopping',cx:80,cy:30,type:'spend',copy:'Fast checkout makes it easy to spend before deciding what the rest of the paycheck needs to cover.'},
      {id:'subscriptions',label:'Subscriptions',cx:90,cy:54,type:'spend',copy:'Subscriptions repeat automatically. Individually they may feel manageable; together they can become a fixed monthly drain.'}] },
    { title:'The Cycle', image:'assets/images/scene-03.webp', media:'assets/video/narration-03.mp4', alt:'A circular path shows Alex moving through four repeating stages: Payday, Spending, Waiting, and Stress, surrounded by shadowy Paycheck Phantoms.', note:'Open the Paycheck Phantoms lesson to break down the cycle.', hotspots:[{id:'phantoms',label:'Paycheck Phantoms',cx:51,cy:50,type:'lesson-phantoms'}] },
    { title:'Higher Income, Same Habits', image:'assets/images/scene-04.webp', media:'assets/video/narration-04.mp4', alt:'Two years later, Alex earns more money but is still surrounded by lifestyle inflation, impulse spending, convenience costs, subscription drain, overdue bills, and financial stress.', note:'Explore the higher-income insight, then continue.', hotspots:[{id:'same-outcome',label:'Higher income, same outcome',cx:51,cy:23,type:'insight'}] },
    { title:'Twenty Years Later', image:'assets/images/scene-05.webp', media:'assets/video/narration-05.mp4', alt:'Twenty years later, Alex has a stronger career and higher income, but the same pattern has grown into lifestyle inflation, debt, convenience costs, endless payments, and continued financial stress.', note:'Complete the Break the Cycle lesson to move forward.', hotspots:[{id:'break-cycle',label:'Break the Cycle',cx:51,cy:51,type:'lesson-cycle'}] },
    { title:'Future Unlocked', image:'assets/images/scene-06.webp', media:'assets/video/narration-06.mp4', alt:'The Cave of Tomorrows dissolves into a bright future path leading toward Money Moves District, including Budget Bridge, Banking Tower, Savings Vault, and Credit Score Citadel.', note:'Step through the portal to complete Shadow Passage.', hotspots:[{id:'finish',label:'Unlock Money Moves',cx:78,cy:35,type:'finish'}] }
  ];

  const baseState = { scene:0, xp:0, explored:[], completed:[], muted:false, finished:false };
  let state = load(), unlocked = false, playing = false;
  const $ = s => document.querySelector(s), stage=$('#stage'), image=$('#sceneImage'), hotspots=$('#hotspots'), video=$('#narrationVideo'), playBtn=$('#play'), muteBtn=$('#mute'), backBtn=$('#back'), contBtn=$('#continue'), accessBtn=$('#access'), restartBtn=$('#restart'), helpBtn=$('#help'), cityBtn=$('#opportunityCity'), skipBtn=$('#skip'), replayBtn=$('#replay'), gate=$('#gate'), modal=$('#modal'), modalBody=$('#modalBody'), modalClose=$('#modalClose');

  function applyAccessSettings(){
    document.body.classList.toggle('captions-off',!accessSettings.captions);
    document.body.classList.toggle('reduce-motion',!!accessSettings.reduce);
    document.body.classList.toggle('large-interface',!!accessSettings.large);
    video.playbackRate=Number(accessSettings.playbackRate||1);
  }
  function setPlayUi(){
    const icon=playBtn.querySelector('.control-icon');
    const label=$('#playLabel');
    if(icon)icon.textContent=playing?'⏸':'▶';
    if(label)label.textContent=playing?'Pause narration':'Play narration';
    playBtn.setAttribute('aria-label',playing?'Pause narration':'Play narration');
  }

  function load(){ try{return {...baseState,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return {...baseState}} }
  function save(){ localStorage.setItem(STORE,JSON.stringify(state)); window.LevelUpOfflineProgress?.save('shadow-passage',state,{xp:state.xp,isComplete:state.finished,completedAt:state.finished?new Date().toISOString():null}); if(cloudReady&&window.ShadowPassageCloud) window.ShadowPassageCloud.save(state,state.finished).then(()=>setCloudStatus('CLOUD SYNCED')).catch(()=>setCloudStatus('LOCAL SAVE • CLOUD RETRY NEEDED')); }
  function setCloudStatus(text){ const el=$('#saveState'); if(el)el.textContent=text; }
  async function initCloud(){
    if(!window.ShadowPassageCloud){setCloudStatus('LOCAL SAVE');return}
    setCloudStatus('CONNECTING…');
    try{const result=await window.ShadowPassageCloud.load(); if(!result?.signedIn){setCloudStatus('LOCAL SAVE • SIGN IN FROM MY JOURNEY TO SYNC');return} if(result.state){state={...baseState,...result.state};localStorage.setItem(STORE,JSON.stringify(state))} cloudReady=true;setCloudStatus('CLOUD SYNCED');render(false);await window.ShadowPassageCloud.save(state,state.finished)}catch(err){console.warn('Shadow Passage cloud sync unavailable',err);setCloudStatus('LOCAL SAVE • CLOUD UNAVAILABLE')}
  }
  const has=(arr,id)=>arr.includes(id), addUnique=(arr,id)=>has(arr,id)?arr:[...arr,id];
  function addXp(id,amount){if(has(state.completed,id))return;state.completed=addUnique(state.completed,id);state.xp+=amount;save();toast(`+${amount} XP`);updateHud()}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1600)}
  function updateHud(){const s=scenes[state.scene];$('#sceneTitle').textContent=s.title;$('#sceneCount').textContent=`SCENE ${state.scene+1} OF 6`;$('#xp').textContent=`${state.xp} XP`;$('#progressFill').style.width=`${((state.scene+1)/6)*100}%`;backBtn.disabled=state.scene===0;muteBtn.querySelector('.control-icon').textContent=state.muted?'🔇':'🔊';$('#muteLabel').textContent=state.muted?'Audio off':'Audio on';muteBtn.setAttribute('aria-label',state.muted?'Turn on narration':'Mute narration');setPlayUi()}
  function sceneReady(){const i=state.scene;if(i===0)return state.explored.includes('enter');if(i===1)return ['food','gaming','shopping','subscriptions'].filter(id=>state.explored.includes(id)).length>=2;if(i===2)return state.completed.includes('phantoms-lesson');if(i===3)return state.explored.includes('same-outcome');if(i===4)return state.completed.includes('cycle-lesson');if(i===5)return state.finished;return true}
  function setFooter(){const ready=sceneReady();$('#footerNote').textContent=ready?(state.scene===5?'Shadow Passage complete. Money Moves is unlocked.':'Scene complete. Continue when you are ready.'):scenes[state.scene].note;contBtn.disabled=!ready||state.scene===5;gate.textContent=ready?'Scene complete — continue when ready.':(unlocked?scenes[state.scene].note:'Listen or skip — then explore the scene.')}
  function render(auto=true){unlocked=false;playing=false;const s=scenes[state.scene];video.pause();video.currentTime=0;video.classList.remove('narration-finished');video.src=s.media;video.muted=state.muted;image.src=s.image;image.alt=s.alt;hotspots.innerHTML='';stage.classList.remove('narrating');playBtn.hidden=false;skipBtn.hidden=false;skipBtn.disabled=false;applyAccessSettings();setPlayUi();updateHud();setFooter();window.scrollTo({top:0,behavior:accessSettings.reduce?'auto':'smooth'});if(state.finished&&state.scene===5){unlock();return}if(auto&&accessSettings.auto)setTimeout(()=>startNarration(true),180);else if(auto){$('#footerNote').textContent='Select Play narration or Skip narration when you are ready.';gate.textContent='Play narration or skip — then explore the scene.';}}
  function startNarration(auto=false,reset=true){unlocked=false;hotspots.innerHTML='';stage.classList.add('narrating');video.classList.remove('narration-finished');skipBtn.disabled=false;applyAccessSettings();$('#footerNote').textContent='Narration playing — you can skip when ready.';if(reset)video.currentTime=0;video.play().then(()=>{playing=true;setPlayUi()}).catch(()=>{playing=false;stage.classList.remove('narrating');setPlayUi();$('#footerNote').textContent=auto?'Select Play narration once to enable audio.':'Select Play narration to begin.'})}
  function unlock(){unlocked=true;playing=false;stage.classList.remove('narrating');video.classList.add('narration-finished');skipBtn.disabled=true;setPlayUi();buildHotspots();setFooter()}
  function buildHotspots(){hotspots.innerHTML='';scenes[state.scene].hotspots.forEach(h=>{const b=document.createElement('button');b.type='button';b.className=`hotspot hotspot-${h.type}`;if(state.explored.includes(h.id)||(h.id==='phantoms'&&state.completed.includes('phantoms-lesson'))||(h.id==='break-cycle'&&state.completed.includes('cycle-lesson'))||(h.id==='finish'&&state.finished))b.classList.add('done');b.style.left=h.cx+'%';b.style.top=h.cy+'%';b.setAttribute('aria-label',h.label);const label=document.createElement('span');label.textContent=h.label;b.appendChild(label);b.addEventListener('click',()=>handleHotspot(h));hotspots.appendChild(b)})}
  function handleHotspot(h){
    if(h.type==='enter'){state.explored=addUnique(state.explored,h.id);save();buildHotspots();setFooter();toast('Entering Shadow Passage');setTimeout(()=>next(),220);return}
    if(h.type==='spend'){state.explored=addUnique(state.explored,h.id);save();openInfo(h.label,h.copy,'SMALL CHOICES • BIG IMPACT');const count=['food','gaming','shopping','subscriptions'].filter(id=>state.explored.includes(id)).length;if(count>=2&&!state.completed.includes('spending-explore'))addXp('spending-explore',50);buildHotspots();setFooter();return}
    if(h.type==='insight'){state.explored=addUnique(state.explored,h.id);save();buildHotspots();setFooter();openInfo('Higher income, same outcome','The visual makes the point on purpose: earning more can create more options, but income alone does not automatically change the pattern. The next scene pushes that idea further.','TWO YEARS LATER');return}
    if(h.type==='lesson-phantoms')return openPhantoms();if(h.type==='lesson-cycle')return openCycle();if(h.type==='finish')return finish();
  }
  function openInfo(title,copy,kicker='EXPLORE'){modalBody.innerHTML=`<p class="kicker">${kicker}</p><h2>${title}</h2><p>${copy}</p><button class="modal-action" data-close>Got it</button>`;modal.showModal();modalBody.querySelector('[data-close]').onclick=()=>modal.close()}
  function openPhantoms(){const done=state.completed.includes('phantoms-lesson');modalBody.innerHTML=`<p class="kicker">MICRO-LESSON 1</p><h2>Paycheck Phantoms</h2><p>They do not have to take the whole paycheck at once. The pattern works because small choices can become automatic, repeated, and hard to notice until the money is already gone.</p><div class="lesson-list"><div class="lesson-chip"><strong>Impulse spending</strong><span>Buying before deciding what the paycheck needs to do.</span></div><div class="lesson-chip"><strong>Convenience costs</strong><span>Paying more because the easiest option is always one tap away.</span></div><div class="lesson-chip"><strong>Subscription drain</strong><span>Small recurring charges stacking into a larger monthly commitment.</span></div><div class="lesson-chip"><strong>Lifestyle inflation</strong><span>Spending rising every time income rises.</span></div></div><p><strong>Which move gives Alex the best chance to interrupt the cycle before the next payday?</strong></p><div class="choice-grid"><button class="choice" data-answer="0">Wait until the money gets tight, then cut back.</button><button class="choice" data-answer="1">Decide what the paycheck needs to do before the spending starts.</button><button class="choice" data-answer="2">Focus only on earning more money.</button></div><div id="phantomFeedback" class="feedback" ${done?'':'hidden'}>${done?'Exactly. A plan creates a decision point before the cycle starts. Money Moves will build the actual tools for doing that.':''}</div>${done?'<button class="modal-action" data-close>Continue</button>':''}`;modal.showModal();wireLesson('phantoms-lesson','#phantomFeedback','Exactly. A plan creates a decision point before the cycle starts. Money Moves will build the actual tools for doing that.','That may change the pressure later, but it does not change the pattern before spending begins. Try again.')}
  function openCycle(){const done=state.completed.includes('cycle-lesson');modalBody.innerHTML=`<p class="kicker">MICRO-LESSON 2</p><h2>Break the Cycle</h2><p>Twenty years passed. Alex built a career and earns more, but the financial stress still looks familiar.</p><p><strong>Which statement best explains what the Cave of Tomorrows is showing?</strong></p><div class="choice-grid"><button class="choice" data-answer="0">The only problem is that Alex never earned enough.</button><button class="choice" data-answer="1">Income grew, but the habits and commitments consuming it grew too.</button><button class="choice" data-answer="2">Once a pattern starts, there is no realistic way to change it.</button></div><div id="cycleFeedback" class="feedback" ${done?'':'hidden'}>${done?'Right. Shadow Passage is not saying “never spend.” It is showing why a stronger system matters as income and responsibilities grow.':''}</div>${done?'<button class="modal-action" data-close>Continue</button>':''}`;modal.showModal();wireLesson('cycle-lesson','#cycleFeedback','Right. Shadow Passage is not saying “never spend.” It is showing why a stronger system matters as income and responsibilities grow.','The image points to something else: Alex’s income changed, but the pattern around the money kept expanding. Try again.')}
  function wireLesson(id,feedbackSelector,correctCopy,wrongCopy){modalBody.querySelectorAll('.choice').forEach(btn=>btn.onclick=()=>{const correct=btn.dataset.answer==='1';modalBody.querySelectorAll('.choice').forEach(x=>x.disabled=true);btn.classList.add(correct?'correct':'wrong');const feedback=$(feedbackSelector);feedback.hidden=false;if(correct){addXp(id,100);feedback.textContent=correctCopy;const a=document.createElement('button');a.className='modal-action';a.textContent='Continue';a.onclick=()=>modal.close();modalBody.appendChild(a);buildHotspots();setFooter()}else{feedback.textContent=wrongCopy;setTimeout(()=>modalBody.querySelectorAll('.choice').forEach(x=>x.disabled=false),450)}});const c=modalBody.querySelector('[data-close]');if(c)c.onclick=()=>modal.close()}
  function finish(){if(!state.finished){state.finished=true;addXp('passage-complete',50);save()}buildHotspots();setFooter();modalBody.innerHTML=`<div class="completion"><div class="seal">LU</div><p class="kicker">SHADOW PASSAGE COMPLETE</p><h2>Future Unlocked</h2><p>You saw where the cycle can travel. The next district is where the tools begin.</p><div class="score">${state.xp} XP</div><p><strong>MONEY MOVES DISTRICT UNLOCKED</strong></p><div class="completion-actions"><button class="primary" id="closeComplete">Return to Opportunity City →</button><button id="replayComplete">Replay Shadow Passage</button></div></div>`;modal.showModal();$('#closeComplete').onclick=()=>{modal.close();window.location.href='../'};$('#replayComplete').onclick=()=>{modal.close();state.scene=0;save();render(false)}}
  function showAccess(){
    const s=scenes[state.scene];
    modalBody.innerHTML=`
      <p class="kicker">ACCESSIBILITY</p>
      <h2>Choose how you learn</h2>
      <section class="scene-description"><strong>Describe this scene</strong><p>${s.alt}</p></section>
      <div class="access-options">
        <label class="access-row"><span><b>Play narration automatically</b><small>Start narration when each new scene opens.</small></span><input id="accessAuto" type="checkbox"></label>
        <label class="access-row"><span><b>Show visual captions</b><small>Show or hide the captioned narration video while keeping narration audio available.</small></span><input id="accessCaptions" type="checkbox"></label>
        <label class="access-row"><span><b>Larger interface text</b><small>Increase readable interface text and controls without changing the scene artwork.</small></span><input id="accessLarge" type="checkbox"></label>
        <label class="access-row"><span><b>Reduce motion</b><small>Reduce pulses and decorative movement.</small></span><input id="accessReduce" type="checkbox"></label>
        <fieldset class="speed-options"><legend>Narration speed</legend><div>
          <button type="button" data-rate="0.75">0.75×</button>
          <button type="button" data-rate="1">1×</button>
          <button type="button" data-rate="1.25">1.25×</button>
          <button type="button" data-rate="1.5">1.5×</button>
        </div></fieldset>
      </div>
      <button class="modal-action" data-close>Return to Shadow Passage</button>`;
    modal.showModal();
    const auto=$('#accessAuto'), captions=$('#accessCaptions'), large=$('#accessLarge'), reduce=$('#accessReduce');
    auto.checked=!!accessSettings.auto;captions.checked=!!accessSettings.captions;large.checked=!!accessSettings.large;reduce.checked=!!accessSettings.reduce;
    const syncRates=()=>modalBody.querySelectorAll('[data-rate]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.rate)===Number(accessSettings.playbackRate||1)));
    syncRates();
    auto.onchange=()=>{accessSettings.auto=auto.checked;saveAccessSettings();applyAccessSettings()};
    captions.onchange=()=>{accessSettings.captions=captions.checked;saveAccessSettings();applyAccessSettings()};
    large.onchange=()=>{accessSettings.large=large.checked;saveAccessSettings();applyAccessSettings()};
    reduce.onchange=()=>{accessSettings.reduce=reduce.checked;saveAccessSettings();applyAccessSettings()};
    modalBody.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{accessSettings.playbackRate=Number(b.dataset.rate)||1;saveAccessSettings();applyAccessSettings();syncRates()});
    modalBody.querySelector('[data-close]').onclick=()=>modal.close();
  }
  function showHelp(){
    modalBody.innerHTML=`
      <p class="kicker">HELP</p>
      <h2>Shadow Passage controls</h2>
      <div class="help-guide">
        <p><b>Previous scene</b> returns to the prior scene without clearing saved progress.</p>
        <p><b>Audio</b> turns narration sound on or off.</p>
        <p><b>Accessibility</b> controls narration autoplay, visual captions, larger interface text, narration speed, and reduced motion.</p>
        <p><b>Replay narration</b> restarts the current scene narration.</p>
        <p><b>Skip narration</b> opens the scene activity without requiring narration to finish.</p>
        <p><b>Play/Pause narration</b> controls the current scene narration.</p>
        <p><b>Continue</b> uses Shadow Passage's existing scene requirements and becomes available only when the scene is complete.</p>
        <p><b>Hotspots</b> use visible cues; a ✓ marks items already explored.</p>
      </div>
      <button class="modal-action" data-close>Return to Shadow Passage</button>`;
    modal.showModal();
    modalBody.querySelector('[data-close]').onclick=()=>modal.close();
  }
  function next(){if(!sceneReady()||state.scene>=5)return;state.scene++;save();render(true)}function previous(){if(state.scene<=0)return;state.scene--;save();render(false);unlock()}function restart(){if(!confirm('Restart Shadow Passage and clear this progress?'))return;state={...baseState};save();render(false)}
  video.addEventListener('ended',()=>unlock());video.addEventListener('play',()=>{playing=true;stage.classList.add('narrating');setPlayUi()});video.addEventListener('pause',()=>{playing=false;setPlayUi()});playBtn.onclick=()=>{if(playing){video.pause();$('#footerNote').textContent='Narration paused.';return}const resume=stage.classList.contains('narrating')&&video.currentTime>0&&!video.ended;startNarration(false,!resume)};replayBtn.onclick=()=>{video.pause();startNarration(false,true)};muteBtn.onclick=()=>{state.muted=!state.muted;video.muted=state.muted;save();updateHud()};backBtn.onclick=previous;contBtn.onclick=next;accessBtn.onclick=showAccess;helpBtn.onclick=showHelp;cityBtn.onclick=()=>{window.location.href='../'};restartBtn.onclick=restart;skipBtn.onclick=()=>{if(skipBtn.disabled)return;video.pause();unlock()};modalClose.onclick=()=>modal.close();modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});document.addEventListener('keydown',e=>{if(modal.open)return;if(e.key==='ArrowRight'&&!contBtn.disabled)next();if(e.key==='ArrowLeft'&&!backBtn.disabled)previous();if(e.key===' '){e.preventDefault();playBtn.click()}});
  applyAccessSettings();render(true);initCloud();
})();
