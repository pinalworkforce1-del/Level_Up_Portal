(()=>{
  const KEY='level-up-career-tree-next-v1';
  const map=document.getElementById('careerTreeMapImage');
  if(map){
    map.addEventListener('error',()=>{
      if(map.dataset.fallbackApplied)return;
      map.dataset.fallbackApplied='1';
      map.src='../career-skill-tree/assets/career-tree-map.webp';
      map.alt='Career Tree map. The new map image is not yet installed, so the previous map artwork is shown temporarily.';
    });
  }

  function read(){
    try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}
  }
  function write(next){
    try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}
  }
  function remember(destination){
    const state=read();
    state.lastDestination=destination;
    state.lastOpenedAt=new Date().toISOString();
    write(state);
  }

  // On the youth subdomain, provide an explicit way into Opportunity City.
  // The original Level Up host's navigation stays exactly as it is.
  if(document.querySelector('meta[name="level-up-youth-entry"][content="1"]')){
    const cityLink=document.querySelector('.city-link');
    if(cityLink)cityLink.href=new URL('../?view=city',window.location.href).href;
  }

  document.querySelectorAll('[data-destination]').forEach(link=>{
    link.addEventListener('click',()=>remember(link.dataset.destination));
  });
})();