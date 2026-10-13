(()=>{
  const MAP_ID='careerTreeMap';

  function hideLegacyHero(){
    const home=document.getElementById('viewHome');
    if(!home)return;
    const hero=home.querySelector('.hero');
    if(hero)hero.style.display='none';
  }

  function showMapFirst(){
    hideLegacyHero();
    const map=document.getElementById(MAP_ID);
    if(!map)return false;
    map.style.marginTop='18px';
    const hash=(location.hash||'').replace('#','');
    if(!hash||hash==='home'){
      if(location.hash!=='#home')history.replaceState(null,'','#home');
      requestAnimationFrame(()=>map.scrollIntoView({behavior:'auto',block:'start'}));
    }
    return true;
  }

  function install(){
    hideLegacyHero();
    if(showMapFirst())return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(showMapFirst()||tries>40)clearInterval(timer);
    },100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  window.addEventListener('hashchange',()=>{
    hideLegacyHero();
    const hash=(location.hash||'').replace('#','');
    if(hash==='home'||!hash){
      const map=document.getElementById(MAP_ID);
      if(map)requestAnimationFrame(()=>map.scrollIntoView({behavior:'auto',block:'start'}));
    }
  });

  new MutationObserver(()=>hideLegacyHero()).observe(document.documentElement,{childList:true,subtree:true});
})();