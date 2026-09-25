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
  const defaults={auto:true,captions:true,reduce:false,large:false,playbackRate:1};
  let settings=defaults;
  let sessionStarted=false;

  try{settings={...defaults,...JSON.parse(localStorage.getItem(ACCESS_KEY)||'{}')}}catch(_error){settings={...defaults}}

  const saveSettings=()=>localStorage.setItem(ACCESS_KEY,JSON.stringify(settings));
  const applySettings=()=>{
    document.body.classList.toggle('reduce-motion',!!settings.reduce);
    document.body.classList.toggle('captions-off',!settings.captions);
    document.body.classList.toggle('fdc-large-text',!!settings.large);
    video.playbackRate=Number(settings.playbackRate||1);
  };

  const describeCurrentScene=()=>{
    try{
      const s=typeof scene==='function'?scene():null;
      if(!s)return {label:'First Day Challenge',text:'Workplace readiness scene.'};
      const labels=Array.isArray(s.spots)?s.spots.map(h=>h?.[0]).filter(Boolean):[];
      const interactions=labels.length?(' Interactive areas include: '+labels.join(', ')+'.'):'';
      return {
        label:s.hidden?'Bonus lesson · '+s.title:s.title,
        text:'This scene focuses on '+s.title.toLowerCase()+'.'+interactions
      };
    }catch(_error){
      return {label:'First Day Challenge',text:'Workplace readiness scene.'};
    }
  };

  // Standard Level Up accessibility control in the right rail.
  const accessButton=document.createElement('button');
  accessButton.id='standardAccessBtn';
  accessButton.innerHTML='<span class="control-icon">◉</span><span>Accessibility</span>';
  const audioButton=document.getElementById('audioToggle');
  audioButton?.insertAdjacentElement('afterend',accessButton);

  const helpButton=document.getElementById('fdcHelpBtn');
  const helpDialog=document.createElement('dialog');
  helpDialog.id='standardHelpDialog';
  helpDialog.className='standard-access-dialog';
  helpDialog.innerHTML=`
    <div class="dialog-head"><div><small>HELP</small><h2>First Day Challenge controls</h2></div><button class="close" aria-label="Close help">×</button></div>
    <div class="dialog-body access-options">
      <div class="switch-row"><span><b>Previous scene</b><small>Returns to the prior scene without clearing your saved progress.</small></span></div>
      <div class="switch-row"><span><b>Audio on / Audio off</b><small>Turns narration sound on or off.</small></span></div>
      <div class="switch-row"><span><b>Accessibility</b><small>Controls narration autoplay, visual captions, and reduced motion.</small></span></div>
      <div class="switch-row"><span><b>Replay narration</b><small>Restarts the current scene narration from the beginning.</small></span></div>
      <div class="switch-row"><span><b>Skip narration</b><small>Becomes available while narration is active.</small></span></div>
      <div class="switch-row"><span><b>Play / Pause narration</b><small>Controls the current narration without changing scene progress.</small></span></div>
      <div class="switch-row"><span><b>Continue</b><small>Uses the challenge's existing activity requirements and unlocks only when the scene is complete.</small></span></div>
    </div>`;
  document.body.appendChild(helpDialog);
  helpButton?.addEventListener('click',()=>helpDialog.showModal());
  helpDialog.querySelector('.close')?.addEventListener('click',()=>helpDialog.close());

  const accessDialog=document.createElement('dialog');
  accessDialog.id='standardAccessDialog';
  accessDialog.className='standard-access-dialog rich-access-dialog';
  accessDialog.innerHTML=`
    <div class="dialog-head"><div><small>ACCESSIBILITY</small><h2>Choose how you learn</h2></div><button class="close" aria-label="Close accessibility">×</button></div>
    <div class="dialog-body access-options">
      <section class="scene-description-card" aria-live="polite">
        <div class="scene-description-title"><span aria-hidden="true">◉</span><div><b>Describe this scene</b><small id="fdcSceneLabel">First Day Challenge</small></div></div>
        <p id="fdcSceneDescription">Workplace readiness scene.</p>
      </section>
      <label class="switch-row"><span><b>Play narration automatically</b><small>After you start the challenge, new scenes will begin narration automatically when your browser allows it.</small></span><input id="fdcAutoPlay" type="checkbox"></label>
      <label class="switch-row"><span><b>Show visual captions</b><small>Turn off the caption video layer while keeping narration audio available.</small></span><input id="fdcCaptions" type="checkbox"></label>
      <label class="switch-row"><span><b>Larger interface text</b><small>Increases controls and readable interface text without changing the artwork.</small></span><input id="fdcLargeText" type="checkbox"></label>
      <fieldset class="narration-speed">
        <legend>Narration speed</legend>
        <small>Choose the playback speed that is most comfortable for you.</small>
        <div class="speed-buttons">
          <button type="button" data-rate="0.75">0.75×</button>
          <button type="button" data-rate="1">1×</button>
          <button type="button" data-rate="1.25">1.25×</button>
          <button type="button" data-rate="1.5">1.5×</button>
        </div>
      </fieldset>
      <label class="switch-row"><span><b>Reduce motion</b><small>Stops pulsing and animated transitions where possible.</small></span><input id="fdcReduceMotion" type="checkbox"></label>
      <p class="accessibility-note">These settings stay with your Level Up experience on this device. Narration can still be played, paused, replayed, muted, or skipped from the scene controls.</p>
    </div>`;
  document.body.appendChild(accessDialog);

  const autoToggle=accessDialog.querySelector('#fdcAutoPlay');
  const captionsToggle=accessDialog.querySelector('#fdcCaptions');
  const largeToggle=accessDialog.querySelector('#fdcLargeText');
  const reduceToggle=accessDialog.querySelector('#fdcReduceMotion');
  const sceneLabel=accessDialog.querySelector('#fdcSceneLabel');
  const sceneDescription=accessDialog.querySelector('#fdcSceneDescription');

  const syncAccessControls=()=>{
    autoToggle.checked=!!settings.auto;
    captionsToggle.checked=!!settings.captions;
    largeToggle.checked=!!settings.large;
    reduceToggle.checked=!!settings.reduce;
    const info=describeCurrentScene();
    sceneLabel.textContent=info.label;
    sceneDescription.textContent=info.text;
    accessDialog.querySelectorAll('[data-rate]').forEach(button=>{
      const selected=Number(button.dataset.rate)===Number(settings.playbackRate||1);
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-pressed',selected?'true':'false');
    });
  };

  accessButton.onclick=()=>{syncAccessControls();accessDialog.showModal();};
  accessDialog.querySelector('.close').onclick=()=>accessDialog.close();
  captionsToggle.onchange=()=>{settings.captions=captionsToggle.checked;saveSettings();applySettings();};
  largeToggle.onchange=()=>{settings.large=largeToggle.checked;saveSettings();applySettings();};
  reduceToggle.onchange=()=>{settings.reduce=reduceToggle.checked;saveSettings();applySettings();};
  accessDialog.querySelectorAll('[data-rate]').forEach(button=>button.addEventListener('click',()=>{
    settings.playbackRate=Number(button.dataset.rate)||1;
    saveSettings();
    applySettings();
    syncAccessControls();
  }));
  video.addEventListener('loadedmetadata',()=>{video.playbackRate=Number(settings.playbackRate||1);});

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
    if(skipBtn){skipBtn.hidden=false;skipBtn.disabled=true;}
    playBtn.hidden=false;
    setPlayLabel(entryLabel());
    if(gate)gate.hidden=true;
    if(status)status.textContent=`Select ${entryLabel()} when you're ready`;
  };

  const showNarrationOptional=()=>{
    video.pause();
    stage?.classList.remove('narrating');
    video.style.visibility='hidden';
    if(skipBtn){skipBtn.hidden=false;skipBtn.disabled=true;}
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

  applySettings();
  // The original app schedules start(true) shortly after render. If that timer
  // has already fired, normalize back to the explicit Start/Resume entry state.
  setTimeout(()=>{if(!sessionStarted)showEntryPrompt()},0);
})();
