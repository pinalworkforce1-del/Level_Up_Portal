(() => {
  const STORAGE_KEY='level-up-career-skill-tree-v1';
  const LEVELS=[
    {min:85,label:'Strong',meter:88},
    {min:70,label:'Good',meter:72},
    {min:55,label:'Moderate',meter:56},
    {min:0,label:'Possible',meter:40}
  ];
  const RIASEC={R:'Realistic',I:'Investigative',A:'Artistic',S:'Social',E:'Enterprising',C:'Conventional'};
  const PREF_LABELS={
    style:{hands:'Hands-on / build / fix',ideas:'Investigate / solve / analyze',create:'Create / design / express',help:'Help / teach / support',lead:'Lead / persuade / sell',organize:'Organize / track / detail'},
    training:{short:'Short preparation / start soon',mid:'Up to 1–2 years',long:'Several years could be okay',open:'Open / not sure'},
    environment:{active:'Active / moving / field or shop',indoor:'Mostly indoors',variety:'Variety / changes day to day',open:'No strong preference'},
    people:{people:'A lot of people interaction',mix:'Mix of people + independent work',solo:'More independent / focused work',open:'No strong preference'}
  };
  const STAGES=[
    {key:'interest',num:1,label:'Discover Me',view:'interest'},
    {key:'alignment',num:2,label:'Career Alignment',view:'alignment'},
    {key:'lmi',num:3,label:'LMI Lab',view:'lmi'},
    {key:'simulator',num:4,label:'Work + Life Simulator',view:'simulator'}
  ];

  const $=sel=>document.querySelector(sel);
  const $$=sel=>[...document.querySelectorAll(sel)];
  function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch{return {};}}
  function writeState(state){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function levelFor(score){return LEVELS.find(x=>score>=x.min)||LEVELS[LEVELS.length-1];}
  function pref(field,value){return PREF_LABELS[field]?.[value]||value||'Not answered';}

  function stageStatus(state,key){
    if(key==='interest')return state.interest?.complete?'complete':Object.keys(state.interest?.answers||{}).length?'active':'upcoming';
    if(key==='alignment')return state.alignment?.complete?'complete':(state.alignment?.selected?.length||state.alignment?.matches?.length)?'active':'upcoming';
    if(key==='lmi')return state.lmi?.complete?'complete':Object.keys(state.lmi?.evidence||{}).length?'active':'upcoming';
    const hasPlan=Boolean(state.lifePlan||state.tree?.lifePlan||state.lifePlanComplete||state.tree?.complete);
    return hasPlan?'complete':'upcoming';
  }

  function currentStage(){
    const hash=location.hash.replace('#','');
    if(hash==='interest')return 'interest';
    if(hash==='alignment')return 'alignment';
    if(hash==='lmi')return 'lmi';
    if(hash==='tree')return 'simulator';
    return '';
  }

  function goStage(view){
    if(view==='simulator'){
      location.href='life-plan-completion.html?v=20261011-progression';
      return;
    }
    location.hash=`#${view}`;
  }

  function progressionMarkup(activeKey){
    const state=readState();
    return `<nav class="career-progress-strip" aria-label="Career Tree progression">${STAGES.map(stage=>{
      const status=stageStatus(state,stage.key);
      const active=stage.key===activeKey;
      const icon=status==='complete'?'✓':stage.num;
      return `<button type="button" class="career-progress-step ${status} ${active?'current':''}" data-progress-view="${stage.view}" ${active?'aria-current="step"':''}><span class="step-dot">${icon}</span><span class="step-copy"><b>${stage.label}</b><small>${status==='complete'?'Complete':active?'You are here':'Next step'}</small></span></button>`;
    }).join('<span class="progress-connector" aria-hidden="true"></span>')}</nav>`;
  }

  function installProgression(){
    const active=currentStage();
    ['interest','alignment','lmi','tree'].forEach(view=>{
      const host=$(`#view${view[0].toUpperCase()+view.slice(1)} .stage-shell`);
      const head=host?.querySelector('.stage-head');
      if(!host||!head)return;
      let strip=host.querySelector('.career-progress-strip');
      if(!strip){
        head.insertAdjacentHTML('beforebegin',progressionMarkup(active));
        strip=host.querySelector('.career-progress-strip');
      }else strip.outerHTML=progressionMarkup(active);
    });
    $$('[data-progress-view]').forEach(btn=>{
      if(btn.dataset.progressBound==='1')return;
      btn.dataset.progressBound='1';
      btn.addEventListener('click',()=>goStage(btn.dataset.progressView));
    });
  }

  function updateHomeLanguage(){
    const cards=$$('#journeyGrid .journey-card');
    if(cards[0]){
      cards[0].querySelector('span').textContent='1 • DISCOVER ME';
      cards[0].querySelector('h2').textContent='Discover Your Interests';
      cards[0].querySelector('p').textContent='Use the O*NET® Mini Interest Profiler to identify your strongest interest clues.';
    }
    if(cards[1]){
      cards[1].querySelector('span').textContent='2 • CAREER ALIGNMENT';
      cards[1].querySelector('h2').textContent='Find Possible Fits';
      cards[1].querySelector('p').textContent='Layer your interests with work style, people, environment, and preparation preferences.';
    }
    if(cards[2]){
      cards[2].querySelector('span').textContent='3 • LMI LAB';
      cards[2].querySelector('h2').textContent='Test the Market';
      cards[2].querySelector('p').textContent='Compare your career possibilities using local wages, jobs, growth, openings, and preparation.';
    }
    if(cards[3]){
      cards[3].querySelector('span').textContent='4 • SIMULATOR';
      cards[3].querySelector('h2').textContent='Work + Life Simulator';
      cards[3].querySelector('p').textContent='Test whether career wages can support the life you want, then save your Career Tree results.';
    }
    const hubTree=$('[data-hub-view="tree"] strong');
    if(hubTree)hubTree.textContent='Work + Life Simulator';
    const hubTreeText=$('[data-hub-view="tree"] span');
    if(hubTreeText&&hubTreeText.textContent==='Open simulator')hubTreeText.textContent='Stage 4 • Simulator';
  }

  function updateExplainer(){
    const section=$('#matchResults .section-title');
    if(!section)return;
    const p=section.querySelector('p');
    if(p)p.textContent='Choose up to five possibilities to carry into the LMI Lab, where you will test them against local wages, openings, growth, and preparation.';
    let note=section.querySelector('.alignment-surface-note');
    if(!note){note=document.createElement('div');note.className='alignment-surface-note';section.appendChild(note);}
    note.innerHTML='<strong>Why these careers surfaced</strong><span>Career Tree combined your O*NET interest clues with the work preferences you selected. Careers appear higher when more of those clues point in the same direction. These are possibilities to explore—not recommendations or guarantees.</span>';
  }

  function updateCareerFitLabels(root=document){
    root.querySelectorAll?.('.career-fit').forEach(el=>{
      const value=el.querySelector('strong');
      if(!value)return;
      const score=Number.parseInt(value.textContent,10);
      if(!Number.isFinite(score))return;
      const level=levelFor(score);
      const label=el.querySelector('span');
      const meter=el.querySelector('.career-fit-track i');
      if(label)label.textContent='Interest Alignment:';
      value.textContent=level.label;
      if(meter)meter.style.width=`${level.meter}%`;
      el.dataset.alignmentLevel=level.label;
      el.dataset.alignmentScore=String(score);
      el.setAttribute('aria-label',`Interest alignment: ${level.label}`);
    });
    root.querySelectorAll?.('#careerCards .career-card .why').forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true');});
  }

  function installLmiHandoff(){
    const host=$('#viewLmi .stage-shell');
    const explorer=$('#azLmiExplorer');
    if(!host||!explorer)return;
    const state=readState();
    const selected=Array.isArray(state.alignment?.selected)?state.alignment.selected:[];
    let panel=$('#lmiAlignmentHandoff');
    if(!panel){
      panel=document.createElement('section');
      panel.id='lmiAlignmentHandoff';
      panel.className='lmi-alignment-handoff';
      explorer.insertAdjacentElement('beforebegin',panel);
    }
    if(selected.length){
      panel.innerHTML=`<div><span class="eyebrow">STAGE 3 • LMI LAB</span><h2>You brought ${selected.length} career ${selected.length===1?'possibility':'possibilities'} from Career Alignment.</h2><p>Now test them against the market. Look at wages, employment, growth, openings, and preparation before deciding what stays on your Career Tree.</p></div><div class="handoff-careers">${selected.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`;
    }else{
      panel.innerHTML='<div><span class="eyebrow">STAGE 3 • LMI LAB</span><h2>Test a career against the market.</h2><p>No careers have been carried over yet. You can return to Career Alignment or search an occupation directly in the Lab.</p></div>';
    }

    const workbench=$('#viewLmi .lmi-workbench .section-title p');
    if(workbench)workbench.textContent='Open each saved career, review the local evidence, and capture what matters to you before moving to the Work + Life Simulator.';

    const continueBtn=$('#lmiContinue');
    if(continueBtn){
      continueBtn.textContent='Test these careers in Work + Life Simulator →';
      if(continueBtn.dataset.simulatorBound!=='1'){
        continueBtn.dataset.simulatorBound='1';
        continueBtn.addEventListener('click',()=>{
          setTimeout(()=>{
            const latest=readState();
            if(latest.lmi?.complete)location.href='life-plan-completion.html?v=20261011-progression';
          },80);
        });
      }
    }
  }

  function interestSection(state){
    const scores=state.interest?.scores||{};
    const top=Array.isArray(state.interest?.top)?state.interest.top:[];
    if(!Object.values(scores).some(v=>Number(v)>0)&&!top.length)return '';
    return `<section><h2>1 • Discover Me — O*NET® Interest Profile</h2><p><strong>Top interest clues:</strong> ${top.length?esc(top.map(c=>`${c} • ${RIASEC[c]||c}`).join(' | ')):'Not yet calculated'}</p><table><thead><tr><th>Interest area</th><th>Score</th></tr></thead><tbody>${Object.entries(RIASEC).map(([c,n])=>`<tr><td>${esc(c)} • ${esc(n)}</td><td>${esc(scores[c]??0)} / 20</td></tr>`).join('')}</tbody></table></section>`;
  }

  function alignmentSection(state){
    const a=state.alignment||{};
    const selected=Array.isArray(a.selected)?a.selected:[];
    const matches=Array.isArray(a.matches)?a.matches:[];
    if(!['style','training','environment','people'].some(k=>a[k])&&!selected.length&&!matches.length)return '';
    const levels=new Map();
    $$('#careerCards .career-card').forEach(card=>{
      const title=card.querySelector('h3')?.textContent?.trim();
      const level=card.querySelector('.career-fit')?.dataset?.alignmentLevel||card.querySelector('.career-fit strong')?.textContent?.trim();
      if(title&&level)levels.set(title,level);
    });
    const rows=(matches.length?matches:selected).map(title=>`<tr><td>${esc(title)}</td><td>${esc(levels.get(title)||'')}</td><td>${selected.includes(title)?'Saved for LMI':'Surfaced'}</td></tr>`).join('');
    return `<section><h2>2 • Career Alignment</h2><div class="grid"><div><strong>Preferred activity</strong><span>${esc(pref('style',a.style))}</span></div><div><strong>Preparation time</strong><span>${esc(pref('training',a.training))}</span></div><div><strong>Work environment</strong><span>${esc(pref('environment',a.environment))}</span></div><div><strong>People interaction</strong><span>${esc(pref('people',a.people))}</span></div></div>${rows?`<h3>Career possibilities</h3><table><thead><tr><th>Occupation</th><th>Interest Alignment</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`:''}</section>`;
  }

  function lmiSection(state){
    const evidence=state.lmi?.evidence||{};
    const entries=Object.entries(evidence).filter(([,e])=>e&&typeof e==='object'&&Object.keys(e).length);
    const geo=state.lmi?.explorer?.geography||entries[0]?.[1]?.geographyLabel||entries[0]?.[1]?.geography||'';
    if(!entries.length&&!geo)return '';
    const cards=entries.map(([title,e])=>`<article class="evidence"><h3>${esc(title)}</h3><p class="muted">${esc(e.geographyLabel||e.geography||geo||'Geography not saved')}</p><div class="metrics"><span><b>Employment</b>${esc(e.employment||'Not available')}</span><span><b>Entry / P25</b>${esc(e.entry||'Not available')}</span><span><b>Median</b>${esc(e.median||'Not available')}</span><span><b>Experienced / P75</b>${esc(e.experienced||'Not available')}</span><span><b>Outlook</b>${esc(e.outlook||'Not available')}</span><span><b>Annual openings</b>${esc(e.openings||'Not available')}</span></div><p><strong>Preparation:</strong> ${esc(e.prep||'Not available')}</p>${e.takeaway?`<p><strong>My takeaway:</strong> ${esc(e.takeaway)}</p>`:''}<p class="source">Source: ${esc(e.source||'Career Tree local labor-market source')}</p></article>`).join('');
    return `<section><h2>3 • LMI Lab</h2>${geo?`<p><strong>Geography used:</strong> ${esc(entries[0]?.[1]?.geographyLabel||geo)}</p>`:''}${cards}</section>`;
  }

  function treeSection(state){
    const b=state.tree?.branches||{};
    const items=[['Explore Now',b.primary],['Keep Open',b.alternate],['Surprise Me',b.surprise]].filter(([,v])=>v);
    if(!items.length)return '';
    return `<section><h2>4 • Work + Life Simulator / Career Tree</h2><div class="grid">${items.map(([l,v])=>`<div><strong>${esc(l)}</strong><span>${esc(v)}</span></div>`).join('')}</div></section>`;
  }

  function buildReport(){
    const state=readState();
    const participant=state.profile?.name||state.participantName||localStorage.getItem('level-up-participant-name')||'';
    const body=[interestSection(state),alignmentSection(state),lmiSection(state),treeSection(state)].filter(Boolean).join('');
    const now=new Date();
    return `<!doctype html><html><head><meta charset="utf-8"><title>Career Tree Results</title><style>@page{size:letter;margin:.55in}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#14213d;margin:0;font-size:11pt;line-height:1.42}.header{border-bottom:4px solid #3bbcf5;padding-bottom:16px;margin-bottom:22px}.eyebrow{font-size:9pt;font-weight:800;letter-spacing:.12em;color:#1675a9}.header h1{margin:5px 0 3px;font-size:24pt}.header p{margin:2px 0;color:#53627a}section{break-inside:avoid;margin:0 0 24px}section h2{font-size:16pt;margin:0 0 10px}h3{font-size:12pt;margin:12px 0 6px}table{width:100%;border-collapse:collapse;margin:8px 0 12px}th,td{text-align:left;border-bottom:1px solid #dce4ee;padding:7px 6px;vertical-align:top}th{font-size:9pt;text-transform:uppercase;color:#526278}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 12px}.grid>div{border:1px solid #dce4ee;border-radius:8px;padding:9px}.grid strong,.grid span{display:block}.evidence{border:1px solid #dce4ee;border-radius:10px;padding:12px;margin:10px 0}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:8px 0}.metrics span{background:#f4f7fb;border-radius:7px;padding:7px}.metrics b{display:block;font-size:8pt;text-transform:uppercase;color:#61728a}.muted,.source{color:#61728a}.source{font-size:8.5pt}.footer{border-top:1px solid #dce4ee;padding-top:10px;margin-top:24px;font-size:8.5pt;color:#68778d}.no-print{margin:0 0 18px;padding:10px;background:#eef8fd;border:1px solid #b9e7fb;border-radius:8px}@media print{.no-print{display:none}}@media(max-width:700px){.grid,.metrics{grid-template-columns:1fr}}</style></head><body><div class="no-print">Use your browser’s print window to print this report or choose <strong>Save as PDF</strong>.</div><header class="header"><div class="eyebrow">LEVEL UP • CAREER TREE</div><h1>Career Exploration Results</h1>${participant?`<p><strong>Participant:</strong> ${esc(participant)}</p>`:''}<p>Generated ${esc(now.toLocaleDateString())} at ${esc(now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}))}</p></header>${body||'<p>No Career Tree results have been saved yet.</p>'}<footer class="footer">Career Tree results are exploration evidence, not a guarantee of employment, training eligibility, funding, or career success. O*NET® is a trademark of the U.S. Department of Labor, Employment and Training Administration.</footer><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`;
  }

  function printResults(){
    const win=window.open('','_blank','noopener,noreferrer');
    if(!win){alert('Please allow pop-ups for this page so Career Tree can open your printable results.');return;}
    win.document.open();win.document.write(buildReport());win.document.close();
  }

  function addExportButton(container,id){
    if(!container||document.getElementById(id))return;
    const row=document.createElement('div');row.className='career-results-export-row';
    const btn=document.createElement('button');btn.id=id;btn.type='button';btn.className='secondary-btn';btn.textContent='🖨️ Print / Save Results';btn.addEventListener('click',printResults);row.appendChild(btn);container.appendChild(row);
  }

  function installExportButtons(){
    addExportButton($('#interestResults .results-actions'),'printInterestResults');
    addExportButton($('#matchResults .stage-action-row'),'printAlignmentResults');
    addExportButton($('#viewLmi .lmi-workbench'),'printLmiResults');
    const tree=$('#viewTree .career-summary');
    if(tree&&!$('#printCareerTreeResults')){
      const existing=$('#printSummary');
      if(existing){existing.textContent='🖨️ Print / Save Results';existing.onclick=printResults;existing.id='printCareerTreeResults';}
      else addExportButton(tree,'printCareerTreeResults');
    }
  }

  function addStyles(){
    let style=$('#career-tree-enhancement-styles');
    if(style)return;
    style=document.createElement('style');style.id='career-tree-enhancement-styles';style.textContent=`
      #matchResults .alignment-surface-note{margin-top:16px;padding:16px 18px;border:1px solid rgba(114,215,255,.28);border-radius:16px;background:rgba(114,215,255,.07);display:grid;gap:5px;max-width:900px}
      #matchResults .alignment-surface-note strong{color:#dff7ff;font-size:.95rem}#matchResults .alignment-surface-note span{color:#b9c7df;line-height:1.5;font-size:.9rem}
      #careerCards .career-card .why[hidden]{display:none!important}#careerCards .career-fit{display:grid;grid-template-columns:1fr auto;gap:5px 12px;align-items:center;margin-top:14px}#careerCards .career-fit>span{color:#d7e2f5;font-size:.9rem}#careerCards .career-fit>strong{color:#f6fbff;font-size:.95rem;white-space:nowrap}#careerCards .career-fit-track{grid-column:1/-1;width:100%}
      .career-results-export-row{display:flex;align-items:center;gap:10px;margin-top:12px}#matchResults .stage-action-row .career-results-export-row{margin-top:0}
      .career-progress-strip{display:flex;align-items:stretch;gap:8px;margin:0 0 20px;padding:10px;border:1px solid rgba(106,214,255,.2);border-radius:18px;background:rgba(5,14,34,.7);overflow-x:auto}
      .career-progress-step{min-width:150px;flex:1;display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid rgba(130,160,220,.2);border-radius:14px;background:#0a1630;color:#dbe8ff;text-align:left;cursor:pointer}.career-progress-step:hover{border-color:rgba(92,210,255,.55)}.career-progress-step.current{border-color:#55d6ff;box-shadow:0 0 0 1px rgba(85,214,255,.2)}.career-progress-step.complete{border-color:rgba(100,235,178,.45)}
      .step-dot{display:grid;place-items:center;flex:0 0 30px;height:30px;border-radius:50%;background:#17284d;font-weight:900}.complete .step-dot{background:#174c3f}.current .step-dot{background:#155b78}.step-copy{display:grid;gap:2px}.step-copy b{font-size:.82rem}.step-copy small{font-size:.7rem;color:#93a5c7}.progress-connector{align-self:center;width:18px;height:2px;background:rgba(116,151,211,.3);flex:0 0 18px}
      .lmi-alignment-handoff{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:18px;margin:4px 0 22px;padding:20px;border:1px solid rgba(89,218,255,.28);border-radius:20px;background:linear-gradient(135deg,rgba(21,61,91,.48),rgba(13,28,58,.7))}.lmi-alignment-handoff h2{margin:.25rem 0 .45rem;font-size:clamp(1.25rem,2vw,1.65rem)}.lmi-alignment-handoff p{margin:0;color:#bccae3}.handoff-careers{display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start}.handoff-careers span{padding:8px 10px;border-radius:999px;background:rgba(84,210,255,.1);border:1px solid rgba(84,210,255,.28);font-size:.82rem;font-weight:700}
      @media(max-width:850px){.progress-connector{display:none}.career-progress-strip{display:grid;grid-template-columns:1fr 1fr}.career-progress-step{min-width:0}.lmi-alignment-handoff{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  function refresh(root=document){
    addStyles();
    updateHomeLanguage();
    updateExplainer();
    updateCareerFitLabels(root);
    installProgression();
    installLmiHandoff();
    installExportButtons();
  }

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>[...m.addedNodes].some(n=>n instanceof Element)))queueMicrotask(()=>refresh());
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{refresh();observer.observe(document.body,{childList:true,subtree:true});},{once:true});
  else{refresh();observer.observe(document.body,{childList:true,subtree:true});}
  window.addEventListener('hashchange',()=>setTimeout(()=>refresh(),0));
  window.addEventListener('storage',()=>setTimeout(()=>refresh(),0));
})();
