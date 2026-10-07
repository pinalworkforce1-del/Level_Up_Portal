(() => {
  const BASE_SRC = 'app-base.js?v=20261007-renderfix';

  function loadBase(){
    const script=document.createElement('script');
    script.src=BASE_SRC;
    script.async=false;
    script.onload=installPassB;
    script.onerror=()=>console.error('Career Tree base app failed to load.');
    document.head.appendChild(script);
  }

  function installPassB(){
    const style=document.createElement('style');
    style.id='career-tree-ip-pass-b-styles';
    style.textContent=`
      #viewInterest .stage-shell{max-width:min(1500px,96vw);margin-inline:auto;padding:8px clamp(12px,2vw,28px) 10px!important}
      #viewInterest .question-stack{display:block}
      #viewInterest .ip-question.ip-scene-card{padding:0!important;overflow:hidden;border-radius:24px;border:1px solid rgba(114,215,255,.22);background:#071126;box-shadow:0 24px 80px rgba(0,0,0,.28)}
      #viewInterest .ip-question.ip-scene-card[hidden]{display:none!important}
      #viewInterest .ip-scene-grid{display:flex!important;flex-direction:column!important;gap:0!important;min-height:0!important}
      #viewInterest .ip-scene-visual{width:100%!important;height:clamp(300px,46vh,500px)!important;min-height:0!important;border:0!important;border-radius:0!important;background:none!important;background-color:#071126!important;position:relative!important;overflow:hidden!important}
      #viewInterest .ip-scene-visual::before{content:'';position:absolute;inset:-22px;background-image:var(--scene-image);background-size:cover;background-position:center;filter:blur(18px) brightness(.42) saturate(.9);transform:scale(1.08)}
      #viewInterest .ip-scene-visual::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,13,31,.32),rgba(5,13,31,.02) 28%,rgba(5,13,31,.02) 72%,rgba(5,13,31,.32));pointer-events:none}
      #viewInterest .ip-scene-art{position:absolute;z-index:1;inset:0;width:100%;height:100%;object-fit:contain;display:block}
      #viewInterest .ip-scene-copy{padding:clamp(12px,1.7vw,20px)!important;background:linear-gradient(180deg,#0a1530,#081126)}
      #viewInterest .ip-scene-copy h3{font-size:clamp(1.25rem,2vw,1.7rem)!important;line-height:1.12!important;margin:.2rem 0 .35rem!important}
      #viewInterest .ip-scene-copy p{font-size:.95rem;line-height:1.4;margin:.1rem 0 .75rem!important;color:#b9c5dd}
      #viewInterest .answer-scale{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:10px!important;margin-top:8px}
      #viewInterest .answer-scale label{width:100%}
      #viewInterest .answer-scale label span{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:50px!important;padding:8px 7px!important;border-radius:14px!important;text-align:center}
      #viewInterest .assessment-controls{margin-top:10px!important;display:flex!important;align-items:center!important;gap:12px!important}
      #viewInterest #ipPrev{margin-right:auto}
      #viewInterest #ipNext{margin-left:auto}
      #viewInterest .assessment-controls button:disabled{opacity:.45;cursor:not-allowed}
      #viewInterest .ip-scene-fallback{display:grid;place-items:center;height:clamp(300px,46vh,500px);padding:32px;text-align:center;color:#c9d6ef;background:#0a1530;font-weight:800}
      @media(max-width:800px){
        #viewInterest .stage-shell{max-width:100%;padding-inline:8px}
        #viewInterest .ip-scene-visual{height:clamp(240px,42vh,400px)!important;min-height:0!important}
        #viewInterest .ip-scene-copy{padding:16px!important}
        #viewInterest .answer-scale{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #viewInterest .answer-scale label:first-child{grid-column:1/-1}
      }
    `;
    document.head.appendChild(style);

    const wrap=document.getElementById('ipQuestions');
    const prev=document.getElementById('ipPrev');
    const next=document.getElementById('ipNext');
    const status=document.querySelector('#viewInterest .assessment-status');
    const controls=document.querySelector('#viewInterest .assessment-controls');
    const results=document.getElementById('interestResults');
    if(!wrap||!prev||!next)return;

    let active=0;
    let nativePrev=null;
    let nativeNext=null;
    let enhancing=false;

    const setNumber=()=>{
      const txt=document.getElementById('ipPageLabel')?.textContent||'';
      const m=txt.match(/Set\s+(\d+)\s+of\s+5/i);
      return m?Number(m[1]):1;
    };

    const cards=()=>[...wrap.querySelectorAll('.ip-question[data-question]')];

    function preload(globalIndex){
      for(let n=globalIndex+1;n<=Math.min(30,globalIndex+2);n++){
        const img=new Image();
        img.src=`assets/onet/onet-${String(n).padStart(2,'0')}.webp`;
      }
    }

    function prepareCard(card){
      if(card.dataset.passBReady==='1')return;
      card.dataset.passBReady='1';
      card.classList.add('ip-scene-card');
      const layout=card.firstElementChild;
      if(!layout)return;
      layout.classList.add('ip-scene-grid');
      const visual=layout.children[0];
      const copy=layout.children[1];
      if(visual){
        visual.classList.add('ip-scene-visual');
        visual.setAttribute('aria-hidden','true');
        visual.innerHTML='';
        const q=Number(card.dataset.question||0);
        if(q){
          const src=`assets/onet/onet-${String(q).padStart(2,'0')}.webp`;
          visual.style.setProperty('--scene-image','url("'+src+'")');
          const probe=new Image();
          probe.className='ip-scene-art';
          probe.alt='';
          probe.onload=()=>{};
          probe.onerror=()=>{
            visual.style.removeProperty('--scene-image');
            visual.classList.add('ip-scene-fallback');
            visual.textContent='Visual unavailable — rate this activity using the statement.';
          };
          probe.src=src;
          visual.appendChild(probe);
        }
      }
      if(copy){copy.classList.add('ip-scene-copy');const scale=copy.querySelector('.answer-scale');if(scale&&!scale.dataset.strengthFirst){[...scale.querySelectorAll('label')].reverse().forEach(label=>scale.appendChild(label));scale.dataset.strengthFirst='1';}}
    }

    function currentAnswered(card){ return Boolean(card?.querySelector('input[type="radio"]:checked')); }

    function updateSceneStatus(list){
      const set=setNumber();
      const global=(set-1)*6+active+1;
      const label=document.getElementById('ipPageLabel');
      if(label)label.textContent=`Set ${set} of 5 • Activity ${global} of 30`;
      const card=list[active];
      next.disabled=!currentAnswered(card);
      next.textContent=active<list.length-1?'Next activity →':set<5?'Continue to next set →':'See my interest profile →';
      prev.hidden=(set===1&&active===0);
      prev.textContent=active>0?'← Previous activity':'← Previous set';
      preload(global);
    }

    function showActive(list,{animate=true}={}){
      active=Math.max(0,Math.min(active,list.length-1));
      list.forEach((card,i)=>{ card.hidden=i!==active; card.classList.remove('scene-enter'); });
      const card=list[active];
      if(card&&animate)requestAnimationFrame(()=>card.classList.add('scene-enter'));
      updateSceneStatus(list);
      const heading=card?.querySelector('h3');
      if(heading)heading.setAttribute('tabindex','-1');
    }

    function restoreAssessmentChrome(){
      wrap.style.display='';
      if(controls)controls.style.display='';
      if(status)status.style.display='';
    }

    function showResultsOnly(){
      wrap.style.display='none';
      if(controls)controls.style.display='none';
      if(status)status.style.display='none';
    }

    function enhance(){
      if(enhancing)return;
      enhancing=true;
      try{
        if(results&&!results.hidden){ showResultsOnly(); return; }
        restoreAssessmentChrome();
        const list=cards();
        if(!list.length)return;
        list.forEach(prepareCard);
        const firstOpen=list.findIndex(card=>!currentAnswered(card));
        active=firstOpen>=0?firstOpen:list.length-1;
        nativePrev=prev.onclick;
        nativeNext=next.onclick;
        prev.onclick=(evt)=>{
          evt?.preventDefault?.();
          if(active>0){ active-=1; showActive(list); return; }
          if(typeof nativePrev==='function')nativePrev.call(prev,evt);
        };
        next.onclick=(evt)=>{
          evt?.preventDefault?.();
          const current=list[active];
          if(!currentAnswered(current))return;
          if(active<list.length-1){ active+=1; showActive(list); return; }
          if(typeof nativeNext==='function')nativeNext.call(next,evt);
        };
        list.forEach(card=>{
          card.querySelectorAll('input[data-ip-answer]').forEach(input=>{
            if(input.dataset.passBListener==='1')return;
            input.dataset.passBListener='1';
            input.addEventListener('change',()=>setTimeout(()=>updateSceneStatus(list),0));
          });
        });
        showActive(list,{animate:false});
      } finally { enhancing=false; }
    }

    const observer=new MutationObserver(()=>queueMicrotask(enhance));
    observer.observe(wrap,{childList:true,subtree:false});
    if(results)observer.observe(results,{attributes:true,attributeFilter:['hidden']});
    document.addEventListener('click',evt=>{
      if(evt.target?.id==='interestRetake'||evt.target?.id==='legacyRetake')setTimeout(enhance,0);
    });
    enhance();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadBase,{once:true});
  else loadBase();
})();