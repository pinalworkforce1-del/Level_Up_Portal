(() => {
  const BASE_SRC = 'app-base.js?v=20261005-passb1';

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
      #viewInterest .stage-shell{max-width:1180px;margin-inline:auto}
      #viewInterest .question-stack{display:block}
      #viewInterest .ip-question.ip-scene-card{padding:0!important;overflow:hidden;border-radius:24px;border:1px solid rgba(114,215,255,.22);background:linear-gradient(145deg,rgba(10,20,48,.98),rgba(7,16,38,.98));box-shadow:0 24px 80px rgba(0,0,0,.28)}
      #viewInterest .ip-question.ip-scene-card[hidden]{display:none!important}
      #viewInterest .ip-scene-grid{display:grid!important;grid-template-columns:minmax(0,1.25fr) minmax(330px,.75fr)!important;gap:0!important;align-items:stretch!important;min-height:520px}
      #viewInterest .ip-scene-visual{min-height:520px!important;border:0!important;border-radius:0!important;background-size:cover!important;background-position:center!important;position:relative!important}
      #viewInterest .ip-scene-visual::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 62%,rgba(7,16,38,.18) 82%,rgba(7,16,38,.58) 100%);pointer-events:none}
      #viewInterest .ip-scene-copy{padding:clamp(28px,4vw,52px)!important;display:flex!important;flex-direction:column!important;justify-content:center!important;background:linear-gradient(145deg,rgba(8,19,45,.76),rgba(8,17,39,.98))}
      #viewInterest .ip-scene-copy h3{font-size:clamp(1.55rem,3vw,2.35rem)!important;line-height:1.12!important;margin:.55rem 0 1rem!important}
      #viewInterest .ip-scene-copy p{font-size:1rem;line-height:1.55}
      #viewInterest .answer-scale{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;margin-top:10px}
      #viewInterest .answer-scale label{width:100%}
      #viewInterest .answer-scale label span{display:flex!important;align-items:center!important;width:100%!important;min-height:54px!important;border-radius:14px!important;padding:12px 16px!important;transition:transform .15s ease,border-color .15s ease,background .15s ease!important}
      #viewInterest .answer-scale label span:hover{transform:translateY(-1px)}
      #viewInterest .answer-scale input:focus-visible + span{outline:3px solid rgba(89,205,255,.75);outline-offset:2px}
      #viewInterest .assessment-controls{margin-top:18px;gap:12px;align-items:center}
      #viewInterest .assessment-controls button:disabled{opacity:.46;cursor:not-allowed;filter:saturate(.5)}
      #viewInterest .ip-scene-fallback{display:grid;place-items:center;min-height:520px;padding:32px;text-align:center;color:#c9d6ef;background:radial-gradient(circle at 50% 35%,rgba(90,135,255,.18),transparent 46%),#0a1530;font-weight:800;letter-spacing:.02em}
      #viewInterest .ip-scene-card.scene-enter{animation:careerTreeSceneIn .28s ease both}
      @keyframes careerTreeSceneIn{from{opacity:.25;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
      @media(max-width:900px){
        #viewInterest .ip-scene-grid{grid-template-columns:1fr!important;min-height:0}
        #viewInterest .ip-scene-visual{min-height:clamp(270px,62vw,430px)!important;background-position:center!important}
        #viewInterest .ip-scene-visual::after{background:linear-gradient(180deg,transparent 72%,rgba(7,16,38,.6) 100%)}
        #viewInterest .ip-scene-copy{padding:24px!important}
        #viewInterest .ip-scene-fallback{min-height:300px}
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
          const probe=new Image();
          probe.onload=()=>{};
          probe.onerror=()=>{
            visual.style.backgroundImage='none';
            visual.classList.add('ip-scene-fallback');
            visual.textContent='Visual unavailable — rate this activity using the statement.';
          };
          probe.src=src;
        }
      }
      if(copy)copy.classList.add('ip-scene-copy');
    }

    function currentAnswered(card){
      return Boolean(card?.querySelector('input[type="radio"]:checked'));
    }

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
      list.forEach((card,i)=>{
        card.hidden=i!==active;
        card.classList.remove('scene-enter');
      });
      const card=list[active];
      if(card&&animate){
        requestAnimationFrame(()=>card.classList.add('scene-enter'));
      }
      updateSceneStatus(list);
      const heading=card?.querySelector('h3');
      if(heading){
        heading.setAttribute('tabindex','-1');
      }
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
        if(results&&!results.hidden){
          showResultsOnly();
          return;
        }
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
          if(active>0){
            active-=1;
            showActive(list);
            return;
          }
          if(typeof nativePrev==='function')nativePrev.call(prev,evt);
        };

        next.onclick=(evt)=>{
          evt?.preventDefault?.();
          const current=list[active];
          if(!currentAnswered(current))return;
          if(active<list.length-1){
            active+=1;
            showActive(list);
            return;
          }
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
      } finally {
        enhancing=false;
      }
    }

    const observer=new MutationObserver(()=>queueMicrotask(enhance));
    observer.observe(wrap,{childList:true,subtree:false});
    if(results)observer.observe(results,{attributes:true,attributeFilter:['hidden']});

    document.addEventListener('click',evt=>{
      if(evt.target?.id==='interestRetake'||evt.target?.id==='legacyRetake'){
        setTimeout(enhance,0);
      }
    });

    enhance();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',loadBase,{once:true});
  }else{
    loadBase();
  }
})();