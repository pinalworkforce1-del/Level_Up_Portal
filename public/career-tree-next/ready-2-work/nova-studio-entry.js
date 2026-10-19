(()=>{
  const STUDIO='nova-resume-studio.html';
  function mount(){
    if(document.getElementById('novaStudioLaunch'))return;
    const region=document.getElementById('stageExperienceGrid');
    if(!region)return;
    const button=document.createElement('a');
    button.id='novaStudioLaunch';
    button.className='board-card resume-builder-card';
    button.href=STUDIO;
    button.innerHTML='<span class="card-kicker">NOVA • RÉSUMÉ STUDIO</span><strong>Build or strengthen your résumé</strong><small>Start with an existing résumé or NOVA QuickStart. Early QA prototype; review and browser-only saving.</small><span class="card-arrow">→</span>';
    button.style.cssText='display:block;text-decoration:none;color:inherit';
    region.prepend(button);
  }
  function sync(){
    const heading=document.getElementById('stageHomeTitle');
    const visible=document.getElementById('viewStage')&&!document.getElementById('viewStage').hidden;
    const region=document.getElementById('stageExperienceGrid');
    const current=document.getElementById('novaStudioLaunch');
    if(visible&&heading?.textContent==='Resume Retreat'){mount();if(current)current.hidden=false}
    else if(current)current.hidden=true;
  }
  new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('.resume-builder-card');
    if(!btn||btn.id==='novaStudioLaunch'||!btn.querySelector('strong')?.textContent.includes('Resume District'))return;
    e.preventDefault();e.stopImmediatePropagation();location.href=STUDIO;
  },true);
  sync();
})();