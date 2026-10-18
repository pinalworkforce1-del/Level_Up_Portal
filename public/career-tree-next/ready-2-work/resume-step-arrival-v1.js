(() => {
  'use strict';

  let lastStep = null;
  let timer = null;

  function activeStep(){
    return document.querySelector('.resume-step:not([hidden])');
  }

  function stepNumber(step){
    return step?.getAttribute('data-resume-step') || '';
  }

  function cueStep(force=false){
    const step = activeStep();
    if(!step) return;
    const id = stepNumber(step);
    if(!force && id === lastStep) return;
    lastStep = id;

    document.querySelectorAll('.resume-step-start-cue').forEach(x=>x.remove());
    document.querySelectorAll('.resume-step-arrival').forEach(x=>x.classList.remove('resume-step-arrival'));

    const heading = step.querySelector('h2');
    const title = heading?.textContent?.trim() || 'Continue here';
    const cue = document.createElement('div');
    cue.className = 'resume-step-start-cue';
    cue.setAttribute('role','status');
    cue.setAttribute('aria-live','polite');
    cue.innerHTML = '<span class="start-arrow">↓</span><div class="start-copy"><span>START HERE</span><strong>'+escapeHtml(title)+'</strong></div>';
    step.prepend(cue);
    step.classList.add('resume-step-arrival');

    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const top = window.scrollY + cue.getBoundingClientRect().top - 88;
      window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
    }));

    setTimeout(()=>step.classList.remove('resume-step-arrival'),1800);
  }

  function scheduleCue(force=false){
    clearTimeout(timer);
    timer = setTimeout(()=>cueStep(force),70);
  }

  function escapeHtml(v){
    return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  function init(){
    const steps = [...document.querySelectorAll('.resume-step')];
    if(!steps.length) return;

    const observer = new MutationObserver(()=>scheduleCue(false));
    steps.forEach(step=>observer.observe(step,{attributes:true,attributeFilter:['hidden']}));

    // Catch every progression route, even if the base app changes implementation later.
    ['rbNext','rbPrev'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>scheduleCue(false)));
    window.addEventListener('hashchange',()=>{
      if(location.hash==='#resume-builder') setTimeout(()=>cueStep(true),120);
    });

    // When the builder opens, immediately establish a clear visual starting point.
    if(location.hash==='#resume-builder') setTimeout(()=>cueStep(true),160);
  }

  init();
})();