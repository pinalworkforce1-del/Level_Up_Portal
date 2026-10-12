(() => {
  const host=document.getElementById('azLmiExplorer');
  if(host) host.innerHTML='<div class="az-lmi-note"><b>Loading guided LMI Lab…</b><br>Preparing your carried careers and local labor-market evidence.</div>';

  const scripts=[
    {src:'alignment-geography-20261011.js?v=20261012-stable1',key:'careerTreeGeography'},
    {src:'lmi-lab-20261011.js?v=20261012-stable1',key:'careerTreeLmiLab'},
    {src:'lmi-video-cleanup-20261011.js?v=20261012-stable1',key:'careerTreeLmiVideoCleanup'}
  ];

  function dataAttr(key){return key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());}

  function existingFor(item){
    return document.querySelector(`script[data-${dataAttr(item.key)}]`) ||
      [...document.scripts].find(s=>String(s.src||'').includes(item.src.split('?')[0]));
  }

  function loadAt(index){
    if(index>=scripts.length)return;
    const item=scripts[index];
    const existing=existingFor(item);
    if(existing){
      if(existing.dataset.loaded==='1'||existing.readyState==='complete') loadAt(index+1);
      else {
        existing.addEventListener('load',()=>loadAt(index+1),{once:true});
        existing.addEventListener('error',()=>showError(item.src),{once:true});
      }
      return;
    }

    const script=document.createElement('script');
    script.src=item.src;
    script.defer=false;
    script.dataset[item.key]='1';
    script.addEventListener('load',()=>{
      script.dataset.loaded='1';
      loadAt(index+1);
    },{once:true});
    script.addEventListener('error',()=>showError(item.src),{once:true});
    document.head.appendChild(script);
  }

  function showError(src){
    console.error('Career Tree guided LMI runtime failed to load:',src);
    if(host){
      host.hidden=false;
      host.innerHTML='<div class="az-lmi-note"><b>LMI Lab could not finish loading.</b><br>Please refresh once. If this message remains, the deployment needs attention; do not use substitute labor-market data.</div>';
    }
  }

  loadAt(0);
})();