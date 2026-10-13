(()=>{
  const HUB_URL='career-quest/';
  const HUB_STORAGE='level-up-career-quest-hub-v1';

  function readHub(){try{return JSON.parse(localStorage.getItem(HUB_STORAGE)||'{}')}catch{return {}}}
  function electricianStatus(){const e=readHub().electrician||{};if(e.complete)return 'Electrician complete';if(e.day)return `Electrician • Day ${e.day}`;return 'Electrician available';}

  function hideLegacyHero(){
    const home=document.getElementById('viewHome');
    if(!home)return;
    const hero=home.querySelector('.hero');
    if(hero)hero.style.display='none';
  }

  function mapFirst(){
    hideLegacyHero();
    const hash=(location.hash||'').replace('#','');
    if(hash&&hash!=='home')return;
    const map=document.getElementById('careerTreeMap');
    if(!map)return;
    if(location.hash!=='#home')history.replaceState(null,'','#home');
    requestAnimationFrame(()=>map.scrollIntoView({behavior:'auto',block:'start'}));
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
      #viewHome>.hero{display:none!important}
      #careerTreeMap{scroll-margin-top:18px}
      .career-quest-home-card{text-decoration:none;color:inherit;position:relative;overflow:hidden}
      .career-quest-card-visual{min-height:150px;display:grid;place-items:center;font-size:4rem;background:radial-gradient(circle at 50% 40%,rgba(112,215,255,.22),transparent 58%),linear-gradient(145deg,#142c4d,#08152b);position:relative}
      .career-quest-card-visual span{position:absolute;left:18%;bottom:18%;font-size:2rem}.career-quest-card-visual b{position:absolute;right:18%;top:18%;font-size:2rem}
      .career-quest-map-entry{margin:18px 0 30px;padding:20px 22px;border:1px solid rgba(112,215,255,.25);border-radius:20px;background:linear-gradient(135deg,#102744,#0a172d);display:flex;align-items:center;justify-content:space-between;gap:20px;box-shadow:0 18px 55px rgba(0,0,0,.22)}
      .career-quest-map-entry h3{margin:.25rem 0 .4rem;font-size:1.45rem}.career-quest-map-entry p{margin:0;color:#b9c6dc;max-width:820px}.career-quest-map-entry .link-btn{white-space:nowrap;text-decoration:none}
      @media(max-width:760px){.career-quest-map-entry{align-items:flex-start;flex-direction:column}.career-quest-map-entry .link-btn{width:100%;text-align:center}}
    `;document.head.appendChild(style);
  }

  function install(){
    installStyles();
    hideLegacyHero();
    addHomeCard();
    addMapEntry();
    mapFirst();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,300);setTimeout(install,900);setTimeout(install,1800)},{once:true});
  else{install();setTimeout(install,300);setTimeout(install,900);setTimeout(install,1800)}

  window.addEventListener('hashchange',()=>{
    hideLegacyHero();
    const hash=(location.hash||'').replace('#','');
    if(hash==='home'||!hash)setTimeout(mapFirst,0);
  });

  new MutationObserver(()=>{
    hideLegacyHero();
    addHomeCard();
    addMapEntry();
  }).observe(document.documentElement,{childList:true,subtree:true});
})();