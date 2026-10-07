(() => {
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const nativeAppend=Node.prototype.appendChild;
  let intercepted=false;

  function replaceRequired(source,from,to,label){
    if(!source.includes(from))throw new Error(`Career Tree open-hub patch could not find: ${label}`);
    return source.replace(from,to);
  }

  function patchBaseSource(source){
    let next=source;
    next=replaceRequired(next,
`  function canView(view){
    if(view==='home'||view==='interest')return true;
    if(view==='alignment')return state.interest.complete;
    if(view==='lmi')return state.alignment.complete;
    if(view==='tree')return state.lmi.complete;
    return false;
  }`,
`  function canView(view){
    return VIEWS.includes(view);
  }`,'open navigation');

    next=replaceRequired(next,
"    $('progressText').textContent=`${done} of 4 milestones complete`;",
"    $('progressText').textContent=`${done} of 4 experiences complete`;",'progress language');

    next=replaceRequired(next,
`    state.interest.complete=false;
    state.alignment={...fresh().alignment};
    state.lmi={...fresh().lmi};
    state.tree={...fresh().tree};`,
`    state.interest.complete=false;`,'non-destructive retake');

    next=replaceRequired(next,
`    const careers=state.alignment.selected;
    if(!careers.length){show('alignment');return;}
    careers.forEach(t=>{if(!state.lmi.evidence[t])state.lmi.evidence[t]=blankEvidence();});
    const active=sessionStorage.getItem('career-tree-lmi-active')||careers[0];
    renderLmiTabs(careers.includes(active)?active:careers[0]);`,
`    const careers=state.alignment.selected;
    if(!careers.length){
      $('lmiCareerTabs').innerHTML='';
      $('lmiCareerPanel').innerHTML=\`<div class="lmi-panel open-empty-state"><span class="eyebrow">START HERE • NO PREREQUISITE</span><h3>Bring any career into the LMI Lab.</h3><p>You do not have to complete Discover Me or Career Alignment first. Type a career you want to investigate, then use current labor-market sources to capture what you learn.</p><div class="standalone-career-add"><label for="standaloneCareerInput">Career to investigate</label><div><input id="standaloneCareerInput" type="text" placeholder="Example: Electrician"><button id="standaloneCareerAdd" class="primary-btn" type="button">Add career →</button></div></div></div>\`;
      const add=()=>{const input=$('standaloneCareerInput');const title=String(input?.value||'').trim();if(!title)return;if(!state.alignment.selected.includes(title))state.alignment.selected.push(title);if(!state.lmi.evidence[title])state.lmi.evidence[title]=blankEvidence();sessionStorage.setItem('career-tree-lmi-active',title);save();renderLmi();};
      $('standaloneCareerAdd').onclick=add;
      $('standaloneCareerInput').onkeydown=evt=>{if(evt.key==='Enter'){evt.preventDefault();add();}};
      $('lmiContinue').onclick=()=>alert('Add and investigate at least three careers before completing My Career Tree. You can explore the rest of Career Tree in any order.');
      return;
    }
    careers.forEach(t=>{if(!state.lmi.evidence[t])state.lmi.evidence[t]=blankEvidence();});
    const active=sessionStorage.getItem('career-tree-lmi-active')||careers[0];
    renderLmiTabs(careers.includes(active)?active:careers[0]);
    document.getElementById('lmiCareerAdder')?.remove();
    const adder=document.createElement('div');adder.id='lmiCareerAdder';adder.className='standalone-career-inline';adder.innerHTML=\`<input id="lmiAddCareerInput" type="text" aria-label="Add another career to investigate" placeholder="Add another career"><button id="lmiAddCareerBtn" class="secondary-btn" type="button">Add career</button>\`;$('lmiCareerTabs').insertAdjacentElement('afterend',adder);
    const addAnother=()=>{const input=$('lmiAddCareerInput');const title=String(input?.value||'').trim();if(!title)return;if(state.alignment.selected.includes(title)){sessionStorage.setItem('career-tree-lmi-active',title);renderLmiTabs(title);input.value='';return;}if(state.alignment.selected.length>=5){alert('Keep the investigation focused: save up to five careers in the LMI Lab.');return;}state.alignment.selected.push(title);state.lmi.evidence[title]=state.lmi.evidence[title]||blankEvidence();sessionStorage.setItem('career-tree-lmi-active',title);save();renderLmi();};
    $('lmiAddCareerBtn').onclick=addAnother;$('lmiAddCareerInput').onkeydown=evt=>{if(evt.key==='Enter'){evt.preventDefault();addAnother();}};`,'LMI standalone');

    next=replaceRequired(next,
`  function renderTree(){
    const options=eligibleCareers();
    if(options.length<3){show('lmi');return;}`,
`  function renderTree(){
    const evidenceReady=eligibleCareers();
    const options=(state.alignment.selected||[]).slice();
    if(options.length<3){
      const needed=3-options.length;
      $('branchCards').innerHTML=\`<article class="branch-card open-empty-state" style="grid-column:1/-1"><span class="eyebrow">MY CAREER TREE • OPEN EXPLORATION</span><strong>Bring at least three career possibilities here to grow your branches.</strong><p>You currently have <b>\${options.length}</b>. Explore Career Alignment or add careers directly in the LMI Lab. You can visit this destination anytime; nothing is locked.</p>\${options.length?\`<div class="open-candidate-list">\${options.map(t=>\`<span>\${escapeText(t)}</span>\`).join('')}</div>\`:''}<div class="open-empty-actions"><button class="primary-btn" type="button" data-open-view="alignment">Explore Career Alignment →</button><button class="secondary-btn" type="button" data-open-view="lmi">Open LMI Lab →</button></div></article>\`;
      $$('[data-open-view]').forEach(btn=>btn.onclick=()=>show(btn.dataset.openView));
      const top=state.interest.top||[];
      $('finalRiasec').innerHTML=state.interest.complete?\`<div class="summary-box"><h3>Interest clues • \${top.join('')}</h3><p>\${top.map(k=>RIASEC[k].name).join(' • ')}</p></div>\`:\`<div class="summary-box"><h3>Interest clues are optional</h3><p>Complete Discover Me anytime to add your O*NET® interest profile to this summary.</p></div>\`;
      $('finalEvidence').innerHTML=\`<div class="summary-box"><h3>Your tree can grow in any order</h3><p>Need \${needed} more career \${needed===1?'possibility':'possibilities'}. LMI evidence strengthens a branch, but you can choose careers here before completing the LMI Lab.</p></div>\`;
      $('completeTree').disabled=true;$('completeTree').textContent='Add 3 career possibilities first';$('printSummary').onclick=()=>window.print();$('completionPanel').hidden=true;return;
    }`,'open tree');

    next=replaceRequired(next,
"      el.textContent=pieces.join(' • ')||'LMI evidence captured';",
"      el.textContent=pieces.join(' • ')||'No LMI evidence yet — add it anytime in the LMI Lab.';",'branch evidence');
    return next;
  }

  function interceptBaseLoader(){
    Node.prototype.appendChild=function(node){
      if(!intercepted&&node?.tagName==='SCRIPT'&&String(node.src||'').includes('/career-skill-tree/app-base.js')){
        intercepted=true;
        Node.prototype.appendChild=nativeAppend;
        const requested=node.src;
        fetch(requested,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Base app ${r.status}`);return r.text();}).then(text=>{
          const patched=patchBaseSource(text);
          const blob=new Blob([patched],{type:'text/javascript'});
          const url=URL.createObjectURL(blob);
          const runner=document.createElement('script');
          runner.src=url;
          runner.onload=()=>{URL.revokeObjectURL(url);if(typeof node.onload==='function')node.onload();queueMicrotask(installOpenHub);};
          runner.onerror=err=>{URL.revokeObjectURL(url);console.error('Patched Career Tree base failed to execute.',err);if(typeof node.onerror==='function')node.onerror(err);};
          nativeAppend.call(document.head,runner);
        }).catch(err=>{console.error('Career Tree open-hub patch failed.',err);nativeAppend.call(document.head,node);});
        return node;
      }
      return nativeAppend.call(this,node);
    };
  }

  function installOpenHub(){
    if(document.getElementById('careerTreeMap'))return;
    const home=document.getElementById('viewHome');const grid=document.getElementById('journeyGrid');if(!home||!grid)return;
    const hero=home.querySelector('.hero-copy');
    if(hero){const e=hero.querySelector('.eyebrow'),h=hero.querySelector('h1'),p=hero.querySelector('p');if(e)e.textContent='OPEN CAREER EXPLORATION • START ANYWHERE';if(h)h.innerHTML='Build your path in <em>your order.</em>';if(p)p.textContent='Career Tree is an open exploration space. Start with interests, career fit, labor-market information, or your career branches — then come back as your thinking changes.';const old=document.getElementById('startBtn');if(old){const b=old.cloneNode(true);b.textContent='Explore the map ↓';b.onclick=()=>document.getElementById('careerTreeMap')?.scrollIntoView({behavior:'smooth',block:'center'});old.replaceWith(b);}const resume=document.getElementById('resumeBtn');if(resume)resume.hidden=true;}
    const map=document.createElement('section');map.className='career-map-shell';map.id='careerTreeMap';map.innerHTML=`<div class="career-map-intro"><div><span class="eyebrow">OPPORTUNITY CITY • CAREER TREE</span><h2>Choose a destination.</h2><p>Select a destination directly on the map or use the buttons below. Progress is saved, but nothing is locked and there is no required sequence.</p></div><div class="open-order-badge">EXPLORE IN ANY ORDER</div></div><div class="career-map-frame"><img src="assets/career-tree-map.webp" alt="Career Tree map showing Discover Me, Career Alignment, LMI Lab, and Work + Life Plan destinations across Opportunity City"><button class="map-hotspot hotspot-interest" type="button" data-hub-view="interest" aria-label="Open Discover Me — O*NET Mini Interest Profiler"><span>OPEN DISCOVER ME</span></button><button class="map-hotspot hotspot-alignment" type="button" data-hub-view="alignment" aria-label="Open Career Alignment"><span>OPEN CAREER ALIGNMENT</span></button><button class="map-hotspot hotspot-lmi" type="button" data-hub-view="lmi" aria-label="Open LMI Lab"><span>OPEN LMI LAB</span></button><button class="map-hotspot hotspot-tree" type="button" data-hub-view="tree" aria-label="Open Work + Life Plan from the My Career Tree map hotspot"><span>OPEN WORK + LIFE PLAN</span></button></div><div class="hub-status-grid" aria-label="Career Tree destination progress"><button class="hub-status-card" type="button" data-hub-view="interest" data-hub-status="interest"><strong>Discover Me</strong><span>Not started</span></button><button class="hub-status-card" type="button" data-hub-view="alignment" data-hub-status="alignment"><strong>Career Alignment</strong><span>Not started</span></button><button class="hub-status-card" type="button" data-hub-view="lmi" data-hub-status="lmi"><strong>LMI Lab</strong><span>Not started</span></button><button class="hub-status-card" type="button" data-hub-view="tree"><strong>Work + Life Plan</strong><span>Open simulator</span></button></div>`;grid.before(map);
    document.querySelectorAll('[data-hub-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.hubView)));
    const labels={interest:'DESTINATION • DISCOVER ME',alignment:'DESTINATION • CAREER ALIGNMENT',lmi:'DESTINATION • LMI LAB',tree:'DESTINATION • MY CAREER TREE'};Object.entries(labels).forEach(([v,t])=>{const el=document.querySelector(`#view${v[0].toUpperCase()+v.slice(1)} .stage-head .eyebrow`);if(el)el.textContent=t;});
    const progress=document.getElementById('progressText');if(progress)new MutationObserver(refreshHubStatus).observe(progress,{childList:true,characterData:true,subtree:true});
    window.addEventListener('hashchange',()=>setTimeout(()=>{decorateCurrentView();refreshHubStatus();},0));refreshHubStatus();decorateCurrentView();
  }

  function navigate(view){if(view==='tree'){location.href='life-plan-narration.html?v=20261007-nova-hotspot';return;}const target=`#${view}`;if(location.hash===target){location.hash='#home';requestAnimationFrame(()=>location.hash=target);}else location.hash=target;}
  function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch{return {};}}
  function hasValues(obj){if(!obj||typeof obj!=='object')return false;return Object.values(obj).some(v=>Array.isArray(v)?v.length>0:v&&typeof v==='object'?hasValues(v):String(v??'').trim()!==''&&v!==false);}
  function setHubCard(key,status,detail){const card=document.querySelector(`[data-hub-status="${key}"]`);if(!card)return;card.classList.remove('complete','in-progress','not-started');card.classList.add(status==='Complete'?'complete':status.startsWith('In progress')?'in-progress':'not-started');const span=card.querySelector('span');if(span)span.textContent=detail||status;}
  function refreshHubStatus(){const s=readState(),answers=s.interest?.answers||{},n=Object.values(answers).filter(v=>Number(v)>=1).length,done=Boolean(s.interest?.complete),code=Array.isArray(s.interest?.top)?s.interest.top.join(''):'';setHubCard('interest',done?'Complete':n?'In progress':'Not started',done?(code?`Complete • ${code}`:'Complete'):n?`In progress • ${n}/30 answered`:'Not started');const a=s.alignment||{},ap=hasValues({style:a.style,training:a.training,environment:a.environment,people:a.people,matches:a.matches,selected:a.selected});setHubCard('alignment',a.complete?'Complete':ap?'In progress':'Not started',a.complete?`Complete • ${(a.selected||[]).length} saved`:ap?'In progress':'Not started');const l=s.lmi||{},lp=hasValues(l.evidence||{});setHubCard('lmi',l.complete?'Complete':lp?'In progress':'Not started',l.complete?'Complete • evidence captured':lp?'In progress':'Not started');const t=s.tree||{},tp=hasValues(t.branches||{});setHubCard('tree',t.complete?'Complete':tp?'In progress':'Not started',t.complete?'Complete':tp?'In progress':'Not started');}
  function decorateCurrentView(){const view=location.hash.replace('#','')||'home';document.querySelectorAll('.open-mode-note[data-open-note]').forEach(el=>el.remove());const s=readState();if(view==='alignment'&&!s.interest?.complete){const anchor=document.getElementById('alignmentRiasec');if(anchor){const note=document.createElement('div');note.className='open-mode-note';note.dataset.openNote='alignment';note.innerHTML='<strong>No prerequisite:</strong> You can build career possibilities from your work preferences now. Complete Discover Me later if you want O*NET® interest clues layered into the matches.';anchor.insertAdjacentElement('afterend',note);}}if(view==='lmi'){const p=document.querySelector('#viewLmi .lmi-workbench .section-title p');if(p)p.textContent='Investigate careers from Career Alignment or type any career you want to research. You can use the LMI Lab at any point in Career Tree.';}if(view==='tree'){const p=document.querySelector('#viewTree .stage-head p');if(p)p.textContent='Use this space whenever you are ready to organize career possibilities into Explore Now, Keep Open, and Surprise Me. Your tree can change as you learn more.';}}

  interceptBaseLoader();
})();
