(()=>{
  const rail=document.querySelector('.scene-rail');
  const video=document.getElementById('narration');
  const stage=document.getElementById('stage');
  const playBtn=document.getElementById('play');
  const replayBtn=document.getElementById('replay');
  const skipBtn=document.getElementById('skip');
  const status=document.getElementById('status');
  const gate=document.getElementById('gate');
  const returnFinal=document.getElementById('returnFinal');
  if(!rail||!video||!playBtn)return;

  const ACCESS_KEY='level-up-accessibility-v1';
  const defaults={auto:true,captions:true,reduce:false};
  let settings=defaults;
  let sessionStarted=false;

  try{settings={...defaults,...JSON.parse(localStorage.getItem(ACCESS_KEY)||'{}')}}catch(_error){settings={...defaults}}

  const saveSettings=()=>localStorage.setItem(ACCESS_KEY,JSON.stringify(settings));
  const applySettings=()=>{
    document.body.classList.toggle('reduce-motion',!!settings.reduce);
    document.body.classList.toggle('captions-off',!settings.captions);
  };

  // Standard Level Up accessibility control in the right rail.
  const accessButton=document.createElement('button');
  accessButton.id='standardAccessBtn';
  accessButton.innerHTML='<span class="control-icon">◉</span><span>Accessibility</span>';
  const audioButton=document.getElementById('audioToggle');
  audioButton?.insertAdjacentElement('afterend',accessButton);

  const accessDialog=document.createElement('dialog');
  accessDialog.id='standardAccessDialog';
  accessDialog.className='standard-access-dialog';
  accessDialog.innerHTML=`
    <div class="dialog-head"><div><small>ACCESSIBILITY</small><h2>Choose how you learn</h2></div><button class="close" aria-label="Close accessibility">×</button></div>
    <div class="dialog-body access-options">
      <label class="switch-row"><span><b>Play narration automatically</b><small>After you start the challenge, new scenes will begin narration automatically when your browser allows it.</small></span><input id="fdcAutoPlay" type="checkbox"></label>
      <label class="switch-row"><span><b>Show visual captions</b><small>Turn off the caption video layer while keeping narration audio available.</small></span><input id="fdcCaptions" type="checkbox"></label>
      <label class="switch-row"><span><b>Reduce motion</b><small>Stops pulsing and animated transitions where possible.</small></span><input id="fdcReduceMotion" type="checkbox"></label>
    </div>`;
  document.body.appendChild(accessDialog);

  const autoToggle=accessDialog.querySelector('#fdcAutoPlay');
  const captionsToggle=accessDialog.querySelector('#fdcCaptions');
  const reduceToggle=accessDialog.querySelector('#fdcReduceMotion');
  autoToggle.checked=!!settings.auto;
  captionsToggle.checked=!!settings.captions;
  reduceToggle.checked=!!settings.reduce;

  accessButton.onclick=()=>accessDialog.showModal();
  accessDialog.querySelector('.close').onclick=()=>accessDialog.close();
  captionsToggle.onchange=()=>{settings.captions=captionsToggle.checked;saveSettings();applySettings();};
  reduceToggle.onchange=()=>{settings.reduce=reduceToggle.checked;saveSettings();applySettings();};

  const setPlayLabel=(label)=>{
    const text=playBtn.querySelector('span:last-child');
    if(text)text.textContent=label;
  };

  const entryLabel=()=>{
    try{return typeof current==='number'&&current>1?'Resume Challenge':'Start Challenge'}catch(_error){return 'Start Challenge'}
  };

  const showEntryPrompt=()=>{
    video.pause();
    stage?.classList.remove('narrating');
    video.style.visibility='hidden';
    if(skipBtn)skipBtn.hidden=true;
    playBtn.hidden=false;
    setPlayLabel(entryLabel());
    if(gate)gate.hidden=true;
    if(status)status.textContent=`Select ${entryLabel()} when you're ready`;
  };

  const showNarrationOptional=()=>{
    video.pause();
    stage?.classList.remove('narrating');
    video.style.visibility='hidden';
    if(skipBtn)skipBtn.hidden=true;
    playBtn.hidden=false;
    setPlayLabel('Play narration');
    if(status)status.textContent='Explore the scene · narration is optional';
  };

  // Preserve the module's proven native narration pathway. The previous v1.2
  // pilot bypassed start() and called video.play() directly; that could unlock
  // activities after a failed media attempt while producing no sound/captions.
  // This wrapper changes only *when* start() is called, not *how* narration is
  // loaded, displayed, skipped, replayed, or completed.
  let nativeStart=null;
  try{nativeStart=typeof start==='function'?start:null}catch(_error){}
  if(nativeStart){
    start=function(auto=false){
      // First automatic call becomes the module-level entry action.
      if(auto&&!sessionStarted){
        showEntryPrompt();
        return;
      }

      // The learner's first press starts/resumes the experience. Narration then
      // follows the accessibility preference without being the progression gate.
      if(!auto&&!sessionStarted){
        sessionStarted=true;
        if(settings.auto){
          setPlayLabel('Play narration');
          return nativeStart(false);
        }
        try{if(typeof unlock==='function')unlock()}catch(_error){}
        showNarrationOptional();
        return;
      }

      // Once started, later scenes autoplay only when requested.
      if(auto&&!settings.auto){
        try{if(typeof unlock==='function')unlock()}catch(_error){}
        showNarrationOptional();
        return;
      }

      // Manual Play and all normal autoplay use the original module code.
      return nativeStart(auto);
    };
  }

  // Do not replace the module's existing Play/Replay/Skip handlers. They already
  // know how to expose the caption video and call unlock() on narration end.
  replayBtn?.addEventListener('click',()=>{sessionStarted=true},true);

  autoToggle.onchange=()=>{
    settings.auto=autoToggle.checked;
    saveSettings();
    if(sessionStarted&&!settings.auto&&video.paused){
      try{if(typeof unlock==='function')unlock()}catch(_error){}
      showNarrationOptional();
    }
  };

  // Keep the learner artifact separate from progression. After the readiness
  // review, return to Opportunity City so the map can reveal the next step.
  if(returnFinal){
    returnFinal.textContent='Return to Opportunity City →';
    returnFinal.onclick=async()=>{
      try{if(typeof persist==='function')persist();}catch(_error){}
      try{if(typeof syncCloud==='function')await syncCloud();}catch(_error){}
      location.href=PORTAL+'?completed=first-day-challenge';
    };
  }

  applySettings();
  // The original app schedules start(true) shortly after render. If that timer
  // has already fired, normalize back to the explicit Start/Resume entry state.
  setTimeout(()=>{if(!sessionStarted)showEntryPrompt()},0);
})();
