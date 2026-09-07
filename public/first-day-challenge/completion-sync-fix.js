(()=>{
  const BRIDGE_KEY='level-up-supabase-session-v1';

  function readBridge(){
    try{
      const raw=sessionStorage.getItem(BRIDGE_KEY);
      if(!raw)return null;
      const parsed=JSON.parse(raw);
      return parsed?.access_token&&parsed?.user?parsed:null;
    }catch{return null}
  }

  const bridge=readBridge();
  let nativeGet=null;
  try{nativeGet=typeof getStoredSession==='function'?getStoredSession:null}catch(_error){}
  if(nativeGet){
    getStoredSession=function(){return readBridge()||nativeGet()};
  }

  // app.js initializes cloud before this compatibility layer loads. If that
  // first pass fell back to local-only, retry once with the session established
  // by Opportunity City so participant name and module progress sync normally.
  if(bridge){
    setTimeout(async()=>{
      try{
        if(typeof initCloud==='function')await initCloud();
      }catch(_error){}
    },0);
  }

  async function flushCompletion(){
    try{if(typeof persist==='function')persist()}catch(_error){}
    try{
      if(typeof cloud!=='undefined'&&!cloud?.user&&bridge){
        cloud={status:'syncing',user:bridge.user,token:bridge.access_token};
      }
      if(typeof syncCloud==='function'&&typeof cloud!=='undefined'&&cloud?.user)await syncCloud();
    }catch(_error){}
  }

  const form=document.getElementById('reflectionForm');
  form?.addEventListener('submit',()=>setTimeout(flushCompletion,0));

  const returnButton=document.getElementById('returnFinal');
  if(returnButton){
    returnButton.onclick=async()=>{
      await flushCompletion();
      location.href=PORTAL+'?completed=first-day-challenge';
    };
  }
})();
