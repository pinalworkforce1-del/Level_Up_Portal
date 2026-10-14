(() => {
  const CAREER_URL = new URL('career-tree-next/', document.baseURI).href;

  function isCareerButton(target){
    const button=target?.closest?.('.district-card .district-actions button');
    if(!button) return null;
    const card=button.closest('.district-card');
    const title=card?.querySelector('#district-title, h2')?.textContent?.trim();
    if(title!=='Career Skill Tree') return null;
    return button;
  }

  function activateCareerButton(){
    document.querySelectorAll('.district-card').forEach(card=>{
      const title=card.querySelector('#district-title, h2')?.textContent?.trim();
      if(title!=='Career Skill Tree') return;
      const actions=card.querySelector('.district-actions');
      if(!actions) return;
      const button=[...actions.querySelectorAll('button')].find(b=>/pathway module coming later|explore now|enter career skill tree|enter career tree/i.test(b.textContent||''));
      if(!button) return;
      button.disabled=false;
      button.classList.remove('locked-action');
      button.classList.add('primary-action');
      button.textContent='Enter Career Tree →';
      const note=card.querySelector('.progress-note');
      if(note) note.textContent='Career Tree is an optional exploration experience. It does not change your core Level Up progression.';
    });
  }

  document.addEventListener('click',event=>{
    const button=isCareerButton(event.target);
    if(!button){setTimeout(activateCareerButton,0);return;}
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    window.location.assign(CAREER_URL);
  },true);

  const observer=new MutationObserver(activateCareerButton);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  activateCareerButton();
})();