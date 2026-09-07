(()=>{
  const rail=document.querySelector('.scene-rail');
  const video=document.getElementById('narration');
  const stage=document.getElementById('stage');
  const playBtn=document.getElementById('play');
  const replayBtn=document.getElementById('replay');
  const skipBtn=document.getElementById('skip');
  const status=document.getElementById('status');
  const returnFinal=document.getElementById('returnFinal');
  if(!rail||!video||!playBtn)return;

  const ACCESS_KEY='level-up-accessibility-v1';
  const AUDIO_PRIMED_KEY='level-up-fdc-audio-primed';
  const defaults={auto:true,captions:true,reduce:false};
  let settings=defaults;
  let userInitiated=false;
  let audioPrimed=sessionStorage.getItem(AUDIO_PRIMED_KEY)==='1';

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
      <label class="switch-row"><span><b>Play narration automatically</b><small>After your browser allows audio, new scenes will begin narration automatically.</small></span><input id="fdcAutoPlay" type="checkbox"></label>
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

  // A browser may block audible autoplay on the very first scene. Once the
  // learner presses Play/Replay once, keep audio primed so later scenes can
  // use the module's existing automatic narration behavior reliably.
  const primeAudio=()=>{
    userInitiated=true;
    audioPrimed=true;
    sessionStorage.setItem(AUDIO_PRIMED_KEY,'1');
  };
  playBtn.addEventListener('click',primeAudio,true);
  replayBtn?.addEventListener('click',primeAudio,true);

  video.addEventListener('play',()=>{
    if(!settings.auto&&!userInitiated){
      queueMicrotask(()=>{
        video.pause();
        stage?.classList.remove('narrating');
        video.style.visibility='hidden';
        if(skipBtn)skipBtn.hidden=true;
        playBtn.hidden=false;
        if(status)status.textContent='Select play to begin narration';
      });
    }
    userInitiated=false;
  });

  // Make the initial browser-autoplay fallback read like an intentional first
  // interaction instead of a broken control state.
  const refreshAudioPrompt=()=>{
    if(!audioPrimed&&playBtn&&!playBtn.hidden){
      const label=playBtn.querySelector('span:last-child');
      if(label)label.textContent='Start narration';
      if(status&&/Select play/.test(status.textContent))status.textContent='Select Start narration once to enable audio';
    }else if(playBtn&&!playBtn.hidden){
      const label=playBtn.querySelector('span:last-child');
      if(label)label.textContent='Play narration';
    }
  };
  new MutationObserver(refreshAudioPrompt).observe(playBtn,{attributes:true,attributeFilter:['hidden']});
  if(status)new MutationObserver(refreshAudioPrompt).observe(status,{childList:true,subtree:true});

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
  setTimeout(refreshAudioPrompt,260);
})();