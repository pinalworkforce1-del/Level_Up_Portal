(() => {
  'use strict';

  let observer=null;
  let resizeHandler=null;
  let activeActions=null;
  let placeholder=null;

  function occupationStep(doc){
    const text=String(doc?.getElementById('stepContent')?.textContent||'').replace(/\s+/g,' ').toUpperCase();
    if(!text.includes('OCCUPATION'))return false;
    const work=doc.getElementById('workLens')?.getAttribute('aria-pressed')==='true';
    const life=doc.getElementById('lifeLens')?.getAttribute('aria-pressed')==='true';
    return (work&&text.includes('STEP 1 OF 5'))||(life&&text.includes('STEP 4 OF 5'));
  }

  function ensureStyles(doc){
    if(doc.getElementById('careerTreeOccupationNavStyles'))return;
    const style=doc.createElement('style');
    style.id='careerTreeOccupationNavStyles';
    style.textContent=`
      .career-tree-floating-actions{
        position:fixed!important;
        bottom:16px;
        z-index:9999;
        margin:0!important;
        padding:10px 12px!important;
        border:1px solid #46618a;
        border-radius:14px;
        background:rgba(7,17,38,.96);
        box-shadow:0 14px 36px rgba(0,0,0,.36);
        backdrop-filter:blur(8px);
      }
      .career-tree-actions-placeholder{height:76px}
      @media(max-width:920px){.career-tree-floating-actions{left:16px!important;right:16px!important;width:auto!important}}
    `;
    doc.head.appendChild(style);
  }

  function positionBar(doc){
    if(!activeActions||!occupationStep(doc))return;
    const content=doc.querySelector('.content');
    if(!content)return;
    const rect=content.getBoundingClientRect();
    activeActions.style.left=`${Math.max(12,rect.left)}px`;
    activeActions.style.width=`${Math.max(260,rect.width)}px`;
  }

  function restore(doc){
    if(activeActions){
      activeActions.classList.remove('career-tree-floating-actions');
      activeActions.style.removeProperty('left');
      activeActions.style.removeProperty('width');
      if(placeholder?.isConnected)placeholder.replaceWith(activeActions);
    }
    placeholder=null;
    activeActions=null;
  }

  function apply(doc){
    if(!doc?.body)return;
    ensureStyles(doc);
    if(!occupationStep(doc)){
      restore(doc);
      return;
    }

    const actions=doc.getElementById('stepContent')?.querySelector('.actions');
    if(!actions)return;

    if(activeActions&&activeActions!==actions)restore(doc);
    if(activeActions===actions){positionBar(doc);return;}

    placeholder=doc.createElement('div');
    placeholder.className='career-tree-actions-placeholder';
    actions.replaceWith(placeholder);
    doc.body.appendChild(actions);
    actions.classList.add('career-tree-floating-actions');
    activeActions=actions;
    positionBar(doc);
  }

  function wire(){
    const frame=document.getElementById('experience');
    if(!frame)return;
    try{
      const win=frame.contentWindow;
      const doc=win?.document;
      observer?.disconnect();
      if(resizeHandler)win?.removeEventListener('resize',resizeHandler);
      restore(doc);
      apply(doc);
      observer=new MutationObserver(()=>apply(doc));
      observer.observe(doc.body,{childList:true,subtree:true});
      resizeHandler=()=>positionBar(doc);
      win?.addEventListener('resize',resizeHandler);
    }catch(_){}
  }

  const frame=document.getElementById('experience');
  frame?.addEventListener('load',wire);
  wire();
})();
