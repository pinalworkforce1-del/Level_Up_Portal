(() => {
  const CAREER_URL = new URL('career-skill-tree/', document.baseURI).href;
  function activateCareerButton(){
    document.querySelectorAll('.district-card').forEach(card=>{
      const title=card.querySelector('#district-title, h2')?.textContent?.trim();
      if(title!=='Career Skill Tree') return;
      const actions=card.querySelector('.district-actions');
      if(!actions) return;
      const button=[...actions.querySelectorAll('button')].find(b=>/pathway module coming later|explore now/i.test(b.textContent||''));
      if(!button) return;
      button.disabled=false;
      button.classList.remove('locked-action');
      button.classList.add('primary-action');
      button.textContent='Enter Career Skill Tree →';
      button.onclick=()=>window.location.assign(CAREER_URL);
      const note=card.querySelector('.progress-note');
      if(note) note.textContent='Career Skill Tree is an optional exploration experience. It does not change your core Level Up progression.';
    });
  }
  const observer=new MutationObserver(activateCareerButton);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(activateCareerButton,0),true);
  activateCareerButton();
})();