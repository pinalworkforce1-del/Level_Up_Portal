(() => {
  const CAREER_URL = new URL('career-tree-next/', document.baseURI).href;

  function replaceCareerHotspot(){
    const stage=document.querySelector('.opportunity-stage');
    if(!stage) return;
    if(stage.querySelector('.career-tree-direct-icon')) return;

    const original=[...stage.querySelectorAll('button.explore-icon')].find(button=>
      /career skill tree/i.test(button.getAttribute('aria-label')||'')
    );
    if(!original) return;

    const link=document.createElement('a');
    link.className=`${original.className} career-tree-direct-icon`;
    link.href=CAREER_URL;
    link.setAttribute('aria-label','Open Career Tree');
    link.setAttribute('data-label','Open');
    link.style.cssText=original.style.cssText;
    link.style.textDecoration='none';
    link.innerHTML=original.innerHTML;

    original.replaceWith(link);
  }

  const observer=new MutationObserver(()=>replaceCareerHotspot());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',replaceCareerHotspot,{once:true});
  replaceCareerHotspot();
})();