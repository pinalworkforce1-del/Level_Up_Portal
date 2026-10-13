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

  document.querySelectorAll('[data-destination]').forEach(link=>{
    link.addEventListener('click',()=>remember(link.dataset.destination));
  });
})();