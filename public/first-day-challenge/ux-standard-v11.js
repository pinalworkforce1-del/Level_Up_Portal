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
  autoToggle.onchange=()=>{settings.auto=autoToggle.checked;saveSettings();};
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
    playBtn.hidden=false;
    setPlayLabel('Play narration');
    if(status)status.textContent='Explore the scene · narration is optional';
  };

  const ensureNarrationSource=()=>{
    if(video.getAttribute('src'))return;
    try{
      const active=typeof scene==='function'?scene():null;
      if(active?.media)video.src=`assets/media/${active.media}`;
    }catch(_error){}
  };

  const playNarration=({unlockOnFailure=true}={})=>{
    ensureNarrationSource();
    stage?.classList.add('narrating');
    video.style.visibility='visible';
    if(gate)gate.hidden=true;
    const hotspots=document.getElementById('hotspots');
    if(hotspots)hotspots.innerHTML='';
    playBtn.hidden=true;
    if(skipBtn)skipBtn.hidden=false;
    if(status)status.textContent='Narration playing';
    try{video.currentTime=0}catch(_error){}

    let playback;
    try{playback=video.play()}catch(_error){playback=Promise.reject(_error)}
    Promise.resolve(playback).catch(()=>{
      video.pause();
      stage?.classList.remove('narrating');
      video.style.visibility='hidden';
      if(skipBtn)skipBtn.hidden=true;
      if(unlockOnFailure){
        try{if(typeof unlock==='function')unlock()}catch(_error){}
      }
      showNarrationOptional();
      if(status)status.textContent='Challenge ready · narration is available anytime';
    });
  };

  // Level Up entry standard: starting the experience is not the same thing as
  // choosing narration. The first learner action starts/resumes the challenge.
  // Narration follows the accessibility preference, and a blocked audio stream
  // never prevents the learner from reaching the activity.
  let nativeStart=null;
  try{nativeStart=typeof start==='function'?start:null}catch(_error){}
  if(nativeStart){
    start=function(auto=false){
      if(auto&&!sessionStarted){
        showEntryPrompt();
        return;
      }
      if(auto&&!settings.auto){
        try{if(typeof unlock==='function')unlock()}catch(_error){}
        showNarrationOptional();
        return;
      }
      return nativeStart(auto);
    };
  }

  playBtn.onclick=()=>{
    if(!sessionStarted){
      sessionStarted=true;
      if(settings.auto){
        playNarration({unlockOnFailure:true});
      }else{
        try{if(typeof unlock==='function')unlock()}catch(_error){}
        showNarrationOptional();
      }
      return;
    }
    playNarration({unlockOnFailure:true});
  };

  if(replayBtn){
    replayBtn.onclick=()=>{
      sessionStarted=true;
      playNarration({unlockOnFailure:true});
    };
  }

  // Keep optional narration available after an audio-disabled scene unlock.
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
  // If the original app already attempted autoplay before this adapter loaded,
  // normalize the entry state back to the explicit Start/Resume action.
  setTimeout(()=>{if(!sessionStarted)showEntryPrompt()},0);
})();
