/* Level Up First Day Challenge Gold Standard v12
   Self-paced only. Native scene logic, XP, Supabase, offline progress, gating,
   branch behavior, reflection, and First 30 handoff remain authoritative. */
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
  const backBtn=document.getElementById('back');
  const audioBtn=document.getElementById('audioToggle');
  const cityBtn=document.getElementById('opportunityCityBtn');
  const helpBtn=document.getElementById('helpBtn');
  const saveStatus=document.getElementById('saveStatus');
  if(!rail||!video||!playBtn)return;
  document.body.classList.add('fdc-gold-standard');

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
    const icon=playBtn.querySelector('.control-icon');
    const text=playBtn.querySelector('span:last-child');
    const pausedLabel=label==='Pause narration';
    if(icon)icon.textContent=pausedLabel?'⏸':'▶';
    if(text)text.textContent=label;
    playBtn.setAttribute('aria-label',label);
  };

  const setSkipState=(enabled)=>{
    if(!skipBtn)return;
    skipBtn.hidden=false;
    skipBtn.disabled=!enabled;
    skipBtn.setAttribute('aria-disabled',enabled?'false':'true');
  };

  const syncAudioLabel=()=>{
    if(!audioBtn)return;
    const icon=audioBtn.querySelector('.control-icon');
    const text=audioBtn.querySelector('span:last-child');
    if(icon)icon.textContent=video.muted?'🔇':'🔊';
    if(text)text.textContent=video.muted?'Audio off':'Audio on';
    audioBtn.setAttribute('aria-label',video.muted?'Unmute narration':'Mute narration');
  };

  const syncNarrationControls=()=>{
    playBtn.hidden=false;
    const activelyNarrating=stage?.classList.contains('narrating')&&!video.ended;
    const playing=activelyNarrating&&!video.paused;
    setPlayLabel(playing?'Pause narration':'Play narration');
    setSkipState(!!activelyNarrating);
    replayBtn.hidden=false;
    replayBtn.disabled=!video.getAttribute('src');
    syncAudioLabel();
  };

  const showEntryPrompt=()=>{
    video.pause();
    stage?.classList.remove('narrating');
    video.style.visibility='hidden';
    setSkipState(false);
    playBtn.hidden=false;
    setPlayLabel('Play narration');
    if(gate)gate.hidden=true;
    if(status)status.textContent='Select Play narration when you are ready';
  };

  const showNarrationOptional=()=>{
    video.pause();
    stage?.classList.remove('narrating');
    video.style.visibility='hidden';
    setSkipState(false);
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
          const result=nativeStart(false);
          setTimeout(syncNarrationControls,0);
          return result;
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
      const result=nativeStart(auto);
      setTimeout(syncNarrationControls,0);
      return result;
    };
  }

  // Keep native start/replay/skip logic authoritative. The gold-standard Play
  // control adds pause/resume without changing scene unlock or completion logic.
  playBtn.onclick=null;
  playBtn.addEventListener('click',()=>{
    sessionStarted=true;
    const activelyNarrating=stage?.classList.contains('narrating')&&!video.ended;
    if(activelyNarrating&&!video.paused){
      video.pause();
      if(status)status.textContent='Narration paused';
      syncNarrationControls();
      return;
    }
    if(activelyNarrating&&video.paused&&video.currentTime>0){
      video.play().catch(()=>{});
      if(status)status.textContent='Narration playing';
      syncNarrationControls();
      return;
    }
    try{start(false)}catch(_error){}
    setTimeout(syncNarrationControls,0);
  });

  // Do not replace the module's existing Replay/Skip handlers. They already
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

  // Previously explored hidden branches must remain enterable on revisit. The
  // native renderer intentionally marks completed branch hotspots as done, but
  // it also removes their click handler. On scenes such as The Night Before,
  // that leaves a returning participant with no valid way forward. Restore the
  // original branch action without re-awarding XP; activate() already guards
  // branch awards with the existing branch completion state.
  let nativeShowSpots=null;
  try{nativeShowSpots=typeof showSpots==='function'?showSpots:null}catch(_error){}
  const restoreCompletedBranchLinks=()=>{
    let s=null;
    try{s=typeof scene==='function'?scene():null}catch(_error){}
    if(!s||!Array.isArray(s.spots))return;
    document.querySelectorAll('#hotspots .kind-branch').forEach(button=>{
      const label=button.getAttribute('aria-label')||'';
      const branch=s.spots.find(h=>h[5]==='branch'&&h[0]===label);
      if(!branch)return;
      const key=`${s.n}-${branch[0]}`;
      button.onclick=()=>activate(branch,key,button);
    });
  };
  if(nativeShowSpots){
    showSpots=function(){
      const result=nativeShowSpots();
      restoreCompletedBranchLinks();
      return result;
    };
    setTimeout(restoreCompletedBranchLinks,0);
  }

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

  // Gold-standard master header utilities.
  const helpDialog=document.createElement('dialog');
  helpDialog.id='standardHelpDialog';
  helpDialog.className='standard-help-dialog';
  helpDialog.innerHTML=`
    <div class="dialog-head"><div><small>HELP</small><h2>First Day Challenge controls</h2></div><button class="close" aria-label="Close help">×</button></div>
    <div class="dialog-body help-guide">
      <p><b>Previous scene</b> returns to the prior scene without clearing saved progress.</p>
      <p><b>Audio</b> turns narration sound on or off.</p>
      <p><b>Accessibility</b> controls narration autoplay, visual captions, and reduced motion.</p>
      <p><b>Replay narration</b> restarts the current scene narration.</p>
      <p><b>Skip narration</b> ends narration and opens the scene activity when a skip is available.</p>
      <p><b>Play/Pause narration</b> lets you control the current narration without changing scene progress.</p>
      <p><b>Continue</b> uses the challenge's existing activity requirements. It becomes available only after required interactions are complete.</p>
      <p><b>Hotspots</b> use visible cues. A ✓ marks items you have already explored.</p>
    </div>`;
  document.body.appendChild(helpDialog);
  helpDialog.querySelector('.close')?.addEventListener('click',()=>helpDialog.close());
  helpBtn?.addEventListener('click',()=>helpDialog.showModal());
  cityBtn?.addEventListener('click',()=>{location.href=PORTAL});

  const syncSaveStatus=()=>{
    if(!saveStatus)return;
    let state='local';
    try{state=(typeof cloud!=='undefined'&&cloud?.status)||'local'}catch(_error){}
    const meta={
      syncing:['↻','Saving…'],
      synced:['✓','Saved'],
      offline:['◌','Offline · saved on this device'],
      local:['●','Saved on this device']
    }[state]||['●','Saved on this device'];
    saveStatus.textContent=meta[0];
    saveStatus.title=meta[1];
    saveStatus.setAttribute('aria-label',meta[1]);
    saveStatus.dataset.state=state;
  };

  // Preserve the native Back handler now that the same button lives in the rail.
  if(backBtn){
    const nativeBack=backBtn.onclick;
    if(nativeBack)backBtn.onclick=nativeBack;
  }

  audioBtn?.addEventListener('click',()=>setTimeout(syncAudioLabel,0));
  replayBtn?.addEventListener('click',()=>setTimeout(syncNarrationControls,0));
  skipBtn?.addEventListener('click',()=>setTimeout(syncNarrationControls,0));
  video.addEventListener('play',syncNarrationControls);
  video.addEventListener('pause',()=>setTimeout(syncNarrationControls,0));
  video.addEventListener('ended',()=>setTimeout(syncNarrationControls,0));
  video.addEventListener('loadedmetadata',syncNarrationControls);

  const observer=new MutationObserver(()=>syncNarrationControls());
  observer.observe(rail,{subtree:true,attributes:true,attributeFilter:['hidden','disabled','aria-label']});

  applySettings();
  syncAudioLabel();
  syncNarrationControls();
  syncSaveStatus();
  setInterval(syncSaveStatus,1200);
  // The original app schedules start(true) shortly after render. If that timer
  // has already fired, normalize back to the explicit Start/Resume entry state.
  setTimeout(()=>{if(!sessionStarted)showEntryPrompt()},0);
})();
