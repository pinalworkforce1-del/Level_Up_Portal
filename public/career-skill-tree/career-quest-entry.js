(()=>{
  const HUB_URL='career-quest/';
  const HUB_STORAGE='level-up-career-quest-hub-v1';
  const NEW_TREE_URL='../career-tree-next/';

  // Career Tree Next is now the canonical home/map. Any legacy module control
  // that says "Career Tree home" or links to #home should exit to the new map.
  document.addEventListener('click',evt=>{
    const target=evt.target.closest?.('[data-view="home"],.brand[href="#home"]');
    if(!target)return;
    evt.preventDefault();
    evt.stopImmediatePropagation();
    window.location.href=NEW_TREE_URL;
  },true);

  // A plain Career Tree visit should always begin at the hub.
  // Preserve intentional deep links such as #interest, #alignment and #lmi.
  if(!location.hash)history.replaceState(null,'','#home');

  function readHub(){try{return JSON.parse(localStorage.getItem(HUB_STORAGE)||'{}')}catch{return {}}}
  function electricianStatus(){const e=readHub().electrician||{};if(e.complete)return 'Electrician complete';if(e.day)return `Electrician • Day ${e.day}`;return 'Electrician available';}

  function homeIsActive(){
    const home=document.getElementById('viewHome');
    return Boolean(home&&!home.hidden);
  }

  function collapseLegacyHero(){
    const home=document.getElementById('viewHome');
    const map=document.getElementById('careerTreeMap');
    if(!home||!map||home.hidden)return false;
    const hero=home.querySelector('.hero');
    if(hero)hero.style.display='none';
    return true;
  }

  function mapFirst(){
    const hash=(location.hash||'').replace('#','');
    if(hash&&hash!=='home')return;
    const home=document.getElementById('viewHome');
    const map=document.getElementById('careerTreeMap');
    if(!home||!map||home.hidden)return;
    collapseLegacyHero();
    requestAnimationFrame(()=>map.scrollIntoView({behavior:'auto',block:'start'}));
  }

  function findLegacyStepStrip(){
    const terms=['Discover Me','Career Alignment','LMI Lab','Work + Life Simulator'];
    const candidates=[...document.querySelectorAll('nav,section,div')].filter(el=>{
      const text=(el.innerText||'').replace(/\s+/g,' ').trim();
      if(text.length<20||text.length>260)return false;
      return terms.every(term=>text.includes(term));
    });
    candidates.sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length);
    return candidates[0]||null;
  }

  function applyExploreCareersChrome(){
    const view=(location.hash||'').replace('#','');
    const unified=view==='alignment'||view==='lmi';
    document.body.classList.toggle('career-tree-unified-explore',unified);

    const progress=document.querySelector('.top-progress');
    if(progress)progress.style.display=unified?'none':'';

    const brand=document.querySelector('.topbar .brand');
    if(brand){
      brand.textContent=unified?'LEVEL UP • EXPLORE CAREERS':'LEVEL UP • CAREER SKILL TREE';
      brand.setAttribute('aria-label',unified?'Return to Career Tree map':'Career Skill Tree home');
    }

    const strip=findLegacyStepStrip();
    if(strip)strip.style.display=unified?'none':'';

    if(unified){
      const active=view==='alignment'?document.getElementById('viewAlignment'):document.getElementById('viewLmi');
      const eyebrow=active?.querySelector('.stage-head .eyebrow');
      if(eyebrow)eyebrow.textContent=view==='alignment'?'EXPLORE CAREERS • FIND POSSIBILITIES':'EXPLORE CAREERS • LABOR MARKET';
      const homeBtn=active?.querySelector('.stage-head [data-view="home"]');
      if(homeBtn)homeBtn.textContent='← Career Tree Map';
    }

    const interestContinue=document.getElementById('interestContinue');
    if(interestContinue)interestContinue.textContent='Explore careers with these clues →';
    const alignmentContinue=document.getElementById('alignmentContinue');
    if(alignmentContinue)alignmentContinue.textContent='Review labor-market information →';
  }

  function addHomeCard(){
    const grid=document.getElementById('journeyGrid');
    if(!grid||document.getElementById('careerQuestHomeCard'))return;
    const card=document.createElement('a');
    card.id='careerQuestHomeCard';
    card.className='journey-card career-quest-home-card';
    card.href=HUB_URL;
    card.innerHTML=`<div class="career-quest-card-visual" aria-hidden="true">⚡<span>🩺</span><b>🏭</b></div><div><span>5 • CAREER QUEST</span><h2>Try the Work</h2><p>Step into immersive workplaces and test career possibilities through realistic tasks, people, tools, and decisions.</p><strong>${electricianStatus()} →</strong></div>`;
    grid.appendChild(card);
  }

  function addMapEntry(){
    const map=document.getElementById('careerTreeMap');
    if(!map||document.getElementById('careerQuestMapEntry'))return;
    const entry=document.createElement('div');
    entry.id='careerQuestMapEntry';
    entry.className='career-quest-map-entry';
    entry.innerHTML=`<div><span class="eyebrow">DESTINATION • CAREER QUEST</span><h3>Choose a workplace. Try the work.</h3><p>Electrician is available now. Customer Service, Nursing Assistant, Team Assembler, Truck Driver, and IT Support Specialist are being built on the same Career Quest engine.</p></div><a class="primary-btn link-btn" href="${HUB_URL}">Open Career Quest →</a>`;
    map.insertAdjacentElement('afterend',entry);
  }

  function installStyles(){
    if(document.getElementById('careerQuestEntryStyles'))return;
    const style=document.createElement('style');style.id='careerQuestEntryStyles';style.textContent=`
      #careerTreeMap{scroll-margin-top:18px}
      .career-quest-home-card{text-decoration:none;color:inherit;position:relative;overflow:hidden}
      .career-quest-card-visual{min-height:150px;display:grid;place-items:center;font-size:4rem;background:radial-gradient(circle at 50% 40%,rgba(112,215,255,.22),transparent 58%),linear-gradient(145deg,#142c4d,#08152b);position:relative}
      .career-quest-card-visual span{position:absolute;left:18%;bottom:18%;font-size:2rem}.career-quest-card-visual b{position:absolute;right:18%;top:18%;font-size:2rem}
      .career-quest-map-entry{margin:18px 0 30px;padding:20px 22px;border:1px solid rgba(112,215,255,.25);border-radius:20px;background:linear-gradient(135deg,#102744,#0a172d);display:flex;align-items:center;justify-content:space-between;gap:20px;box-shadow:0 18px 55px rgba(0,0,0,.22)}
      .career-quest-map-entry h3{margin:.25rem 0 .4rem;font-size:1.45rem}.career-quest-map-entry p{margin:0;color:#b9c6dc;max-width:820px}.career-quest-map-entry .link-btn{white-space:nowrap;text-decoration:none}
      body.career-tree-unified-explore .topbar{grid-template-columns:1fr auto}
      body.career-tree-unified-explore .stage-shell{padding-top:14px}
      @media(max-width:760px){.career-quest-map-entry{align-items:flex-start;flex-direction:column}.career-quest-map-entry .link-btn{width:100%;text-align:center}}
    `;document.head.appendChild(style);
  }

  function install(){
    installStyles();
    addHomeCard();
    addMapEntry();
    mapFirst();
    applyExploreCareersChrome();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,300);setTimeout(install,900);setTimeout(install,1800)},{once:true});
  else{install();setTimeout(install,300);setTimeout(install,900);setTimeout(install,1800)}

  window.addEventListener('hashchange',()=>{
    const hash=(location.hash||'').replace('#','');
    if(hash==='home'||!hash)setTimeout(mapFirst,0);
    setTimeout(applyExploreCareersChrome,0);
  });

  new MutationObserver(()=>{
    addHomeCard();
    addMapEntry();
    if(homeIsActive())collapseLegacyHero();
    applyExploreCareersChrome();
  }).observe(document.documentElement,{childList:true,subtree:true});
})();