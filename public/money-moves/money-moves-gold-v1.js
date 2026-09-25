/* Level Up Money Moves — gold-standard learner shell v1
   Thin adapter only: native Money Moves scenes, activities, XP, gating,
   Supabase sync, offline progress, calculators, summaries, and certificates remain authoritative. */
(()=>{
  const rail=document.querySelector('.rail');
  const audioBtn=document.getElementById('audioBtn');
  const replayBtn=document.getElementById('replayBtn');
  const skipBtn=document.getElementById('skipBtn');
  const playBtn=document.getElementById('playBtn');
  const continueBtn=document.getElementById('continueBtn');
  const video=document.getElementById('narration');
  const stage=document.getElementById('stage');
  const card=document.getElementById('card');
  const cloud=document.querySelector('.cloud');
  if(!rail||!audioBtn||!replayBtn||!skipBtn||!playBtn||!continueBtn||!video||!stage)return;

  document.body.classList.add('mm-gold-standard');

  const ACCESS_KEY='level-up-accessibility-v1';
  const defaults={auto:true,captions:true,reduce:false,large:false,playbackRate:1};
  let settings=defaults;
  try{settings={...defaults,...JSON.parse(localStorage.getItem(ACCESS_KEY)||'{}')}}catch(_error){settings={...defaults}}
  const saveSettings=()=>{try{localStorage.setItem(ACCESS_KEY,JSON.stringify(settings))}catch(_error){}};

  const iconLabel=(button,icon,label)=>{
    if(!button)return;
    button.innerHTML='<span class="control-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>';
  };

  let backBtn=document.getElementById('back');
  if(!backBtn){
    backBtn=document.createElement('button');
    backBtn.id='back';
    backBtn.type='button';
    backBtn.className='rail-back';
    rail.insertBefore(backBtn,rail.querySelector('small')?.nextSibling||rail.firstChild);
  }
  iconLabel(backBtn,'←','Previous scene');

  let accessBtn=document.getElementById('standardAccessBtn');
  if(!accessBtn){
    accessBtn=document.createElement('button');
    accessBtn.id='standardAccessBtn';
    accessBtn.type='button';
    audioBtn.insertAdjacentElement('afterend',accessBtn);
  }
  iconLabel(accessBtn,'◉','Accessibility');

  let cityBtn=document.getElementById('mmOpportunityCity');
  let helpBtn=document.getElementById('mmHelpBtn');
  if(cloud){
    cloud.classList.add('mm-header-utils');
    const audioState=document.getElementById('audioState');
    if(audioState)audioState.hidden=true;
    if(!cityBtn){
      cityBtn=document.createElement('button');
      cityBtn.id='mmOpportunityCity';
      cityBtn.type='button';
      cityBtn.className='mm-header-tool';
      cityBtn.innerHTML='<span aria-hidden="true">←</span><span>Opportunity City</span>';
      cityBtn.setAttribute('aria-label','Return to Opportunity City');
      cloud.prepend(cityBtn);
    }
    if(!helpBtn){
      helpBtn=document.createElement('button');
      helpBtn.id='mmHelpBtn';
      helpBtn.type='button';
      helpBtn.className='mm-header-tool';
      helpBtn.innerHTML='<span aria-hidden="true">?</span><span>Help</span>';
      helpBtn.setAttribute('aria-label','Open Money Moves help');
      cloud.append(helpBtn);
    }
  }

  const applySettings=()=>{
    document.body.classList.toggle('mm-captions-off',!settings.captions);
    document.body.classList.toggle('mm-reduce-motion',!!settings.reduce);
    document.body.classList.toggle('mm-large-text',!!settings.large);
    video.playbackRate=Number(settings.playbackRate||1);
  };

  const currentScene=()=>{
    try{return SCENES[state.scene]||null}catch(_error){return null}
  };

  const describeScene=()=>{
    const s=currentScene();
    if(!s)return {label:'Money Moves',text:'Financial readiness scene.'};
    const labels=[...document.querySelectorAll('#hotLayer .hot')].map(x=>x.getAttribute('aria-label')).filter(Boolean);
    return {
      label:s.title||'Money Moves',
      text:'This scene focuses on '+String(s.title||'Money Moves').toLowerCase()+'. '+(s.note||'')+(labels.length?' Interactive areas include: '+labels.join(', ')+'.':'')
    };
  };

  const syncButtons=()=>{
    let hasAudio=false, isMuted=false, isPlaying=false, isUnlocked=true, sceneIndex=0;
    try{
      const s=currentScene();
      hasAudio=!!s?.audio;
      isMuted=!!state.muted;
      isPlaying=!!playing;
      isUnlocked=!!unlocked;
      sceneIndex=Number(state.scene||0);
    }catch(_error){}

    iconLabel(audioBtn,isMuted?'🔇':'🔊',isMuted?'Audio off':'Audio on');
    audioBtn.setAttribute('aria-label',isMuted?'Turn on narration':'Mute narration');
    iconLabel(replayBtn,'↻','Replay narration');
    iconLabel(skipBtn,'⇥','Skip narration');
    iconLabel(playBtn,isPlaying?'⏸':'▶',isPlaying?'Pause narration':'Play narration');
    playBtn.setAttribute('aria-label',isPlaying?'Pause narration':'Play narration');
    iconLabel(backBtn,'←','Previous scene');

    backBtn.disabled=sceneIndex<=0;
    replayBtn.disabled=!hasAudio;
    playBtn.disabled=!hasAudio;
    skipBtn.disabled=!hasAudio||isUnlocked;
    accessBtn.disabled=false;
  };

  const showHelp=()=>{
    if(typeof openModal!=='function')return;
    openModal([
      '<div class="mm-panel">',
      '<p class="mm-kicker">HELP</p><h2>Money Moves controls</h2>',
      '<div class="mm-help-guide">',
      '<p><b>Previous scene</b><span>Returns to the prior scene without clearing your saved progress.</span></p>',
      '<p><b>Audio on / Audio off</b><span>Turns narration sound on or off.</span></p>',
      '<p><b>Accessibility</b><span>Controls narration autoplay, visual captions, larger interface text, narration speed, and reduced motion.</span></p>',
      '<p><b>Replay narration</b><span>Restarts the current scene narration from the beginning.</span></p>',
      '<p><b>Skip narration</b><span>Becomes available while narration is waiting to be completed.</span></p>',
      '<p><b>Play / Pause narration</b><span>Controls the current narration without changing scene progress.</span></p>',
      '<p><b>Continue</b><span>Uses Money Moves existing activity requirements and unlocks only when the scene is ready.</span></p>',
      '</div><button class="action" id="mmHelpClose">Return to Money Moves</button>',
      '</div>'
    ].join(''));
    document.getElementById('mmHelpClose')?.addEventListener('click',()=>closeModal());
  };

  const showAccess=()=>{
    if(typeof openModal!=='function')return;
    const info=describeScene();
    openModal([
      '<div class="mm-panel">',
      '<p class="mm-kicker">ACCESSIBILITY</p><h2>Choose how you learn</h2>',
      '<section class="mm-scene-description"><div><span aria-hidden="true">◉</span><div><b>Describe this scene</b><small>'+info.label+'</small></div></div><p>'+info.text+'</p></section>',
      '<div class="mm-access-options">',
      '<label class="mm-access-row"><span><b>Play narration automatically</b><small>Begin narration when each new Money Moves scene opens.</small></span><input id="mmAutoPlay" type="checkbox"></label>',
      '<label class="mm-access-row"><span><b>Show visual captions</b><small>Show or hide the captioned narration layer while keeping narration audio available.</small></span><input id="mmCaptions" type="checkbox"></label>',
      '<label class="mm-access-row"><span><b>Larger interface text</b><small>Increase readable controls and interface text without changing the scene artwork.</small></span><input id="mmLargeText" type="checkbox"></label>',
      '<fieldset class="mm-speed"><legend>Narration speed</legend><small>Choose the playback speed that is most comfortable for you.</small><div>',
      '<button type="button" data-rate="0.75">0.75×</button><button type="button" data-rate="1">1×</button><button type="button" data-rate="1.25">1.25×</button><button type="button" data-rate="1.5">1.5×</button>',
      '</div></fieldset>',
      '<label class="mm-access-row"><span><b>Reduce motion</b><small>Stops pulsing and decorative transitions where possible.</small></span><input id="mmReduceMotion" type="checkbox"></label>',
      '<p class="mm-access-note">These settings stay with your Level Up experience on this device. Narration can still be played, paused, replayed, muted, or skipped from Scene Controls.</p>',
      '</div><button class="action" id="mmAccessClose">Return to Money Moves</button>',
      '</div>'
    ].join(''));

    const auto=document.getElementById('mmAutoPlay');
    const captions=document.getElementById('mmCaptions');
    const large=document.getElementById('mmLargeText');
    const reduce=document.getElementById('mmReduceMotion');
    auto.checked=!!settings.auto;
    captions.checked=!!settings.captions;
    large.checked=!!settings.large;
    reduce.checked=!!settings.reduce;

    const syncRates=()=>document.querySelectorAll('#card [data-rate]').forEach(button=>{
      const selected=Number(button.dataset.rate)===Number(settings.playbackRate||1);
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-pressed',selected?'true':'false');
    });
    syncRates();

    auto.onchange=()=>{settings.auto=auto.checked;saveSettings();applySettings()};
    captions.onchange=()=>{settings.captions=captions.checked;saveSettings();applySettings()};
    large.onchange=()=>{settings.large=large.checked;saveSettings();applySettings()};
    reduce.onchange=()=>{settings.reduce=reduce.checked;saveSettings();applySettings()};
    document.querySelectorAll('#card [data-rate]').forEach(button=>button.addEventListener('click',()=>{
      settings.playbackRate=Number(button.dataset.rate)||1;
      saveSettings();
      applySettings();
      syncRates();
    }));
    document.getElementById('mmAccessClose')?.addEventListener('click',()=>closeModal());
  };

  // Preserve native Money Moves rendering/gating while honoring the shared autoplay preference.
  try{
    const nativeRender=render;
    render=function(auto=false){
      const shouldAuto=!!auto&&!!settings.auto;
      const result=nativeRender(shouldAuto);
      if(auto&&!settings.auto&&currentScene()?.audio){
        const note=document.getElementById('note');
        if(note)note.textContent='Narration is optional. Select Play narration or Skip narration when you are ready.';
      }
      setTimeout(()=>{applySettings();syncButtons()},0);
      return result;
    };
  }catch(_error){}

  // Preserve the native HUD, adding only shell-state synchronization.
  try{
    const nativeHud=hud;
    hud=function(){
      const result=nativeHud();
      setTimeout(syncButtons,0);
      return result;
    };
  }catch(_error){}

  backBtn.addEventListener('click',()=>{
    try{
      if(state.scene<=0)return;
      video.pause();
      state.scene=Math.max(0,state.scene-1);
      if(typeof persist==='function')persist();
      render(false);
      if(currentScene()?.audio&&typeof finishNarration==='function')setTimeout(()=>finishNarration(),0);
      else if(typeof renderHotspots==='function')setTimeout(()=>renderHotspots(),0);
    }catch(_error){}
  });

  accessBtn.addEventListener('click',showAccess);
  cityBtn?.addEventListener('click',()=>{location.href='../'});
  helpBtn?.addEventListener('click',showHelp);

  [audioBtn,replayBtn,skipBtn,playBtn,continueBtn].forEach(button=>button?.addEventListener('click',()=>setTimeout(syncButtons,0)));
  video.addEventListener('play',()=>setTimeout(syncButtons,0));
  video.addEventListener('pause',()=>setTimeout(syncButtons,0));
  video.addEventListener('ended',()=>setTimeout(syncButtons,0));
  video.addEventListener('loadedmetadata',()=>{video.playbackRate=Number(settings.playbackRate||1);});

  if(card){
    const completionObserver=new MutationObserver(()=>{
      const returnLink=card.querySelector('a.action[href="../"]');
      if(returnLink)returnLink.textContent='Return to Opportunity City →';
    });
    completionObserver.observe(card,{subtree:true,childList:true});
  }

  applySettings();
  syncButtons();
})();