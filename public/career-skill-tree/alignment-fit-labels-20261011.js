(() => {
  const STORAGE_KEY = 'level-up-career-skill-tree-v1';
  const LEVELS = [
    { min: 85, label: 'Strong', meter: 88 },
    { min: 70, label: 'Good', meter: 72 },
    { min: 55, label: 'Moderate', meter: 56 },
    { min: 0, label: 'Possible', meter: 40 }
  ];
  const RIASEC = {
    R:'Realistic', I:'Investigative', A:'Artistic', S:'Social', E:'Enterprising', C:'Conventional'
  };
  const PREF_LABELS = {
    style:{hands:'Hands-on / build / fix',ideas:'Investigate / solve / analyze',create:'Create / design / express',help:'Help / teach / support',lead:'Lead / persuade / sell',organize:'Organize / track / detail'},
    training:{short:'Short preparation / start soon',mid:'Up to 1–2 years',long:'Several years could be okay',open:'Open / not sure'},
    environment:{active:'Active / moving / field or shop',indoor:'Mostly indoors',variety:'Variety / changes day to day',open:'No strong preference'},
    people:{people:'A lot of people interaction',mix:'Mix of people + independent work',solo:'More independent / focused work',open:'No strong preference'}
  };

  function levelFor(score) {
    return LEVELS.find(level => score >= level.min) || LEVELS[LEVELS.length - 1];
  }

  function readState(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}
    catch{return {};}
  }

  function esc(value){
    return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function preferenceLabel(field,value){
    return PREF_LABELS[field]?.[value] || value || 'Not answered';
  }

  function updateExplainer() {
    const section = document.querySelector('#matchResults .section-title');
    if (!section) return;
    const paragraph = section.querySelector('p');
    if (paragraph) paragraph.textContent = 'Choose up to five possibilities to carry into the next step, where you can compare local pay, openings, growth, and preparation.';

    let note = section.querySelector('.alignment-surface-note');
    if (!note) {
      note = document.createElement('div');
      note.className = 'alignment-surface-note';
      section.appendChild(note);
    }
    note.innerHTML = '<strong>Why these careers surfaced</strong><span>Career Tree combined your O*NET interest clues with the work preferences you selected. Careers appear higher when more of those clues point in the same direction. These are possibilities to explore—not recommendations or guarantees.</span>';
  }

  function updateCareerFitLabels(root = document) {
    root.querySelectorAll?.('.career-fit').forEach(element => {
      const valueNode = element.querySelector('strong');
      if (!valueNode) return;

      const rawText = valueNode.textContent || '';
      const score = Number.parseInt(rawText, 10);
      if (!Number.isFinite(score)) return;

      const level = levelFor(score);
      const labelNode = element.querySelector('span');
      const meter = element.querySelector('.career-fit-track i');

      if (labelNode) labelNode.textContent = 'Interest Alignment:';
      valueNode.textContent = level.label;
      if (meter) meter.style.width = `${level.meter}%`;
      element.setAttribute('aria-label', `Interest alignment: ${level.label}`);
      element.dataset.alignmentLevel = level.label;
      element.dataset.alignmentScore = String(score);
    });

    root.querySelectorAll?.('#careerCards .career-card .why').forEach(element => {
      element.hidden = true;
      element.setAttribute('aria-hidden', 'true');
    });
  }

  function interestSection(state){
    const scores=state.interest?.scores||{};
    const top=Array.isArray(state.interest?.top)?state.interest.top:[];
    const hasScores=Object.values(scores).some(v=>Number(v)>0);
    if(!hasScores&&!top.length)return '';
    const rows=Object.entries(RIASEC).map(([code,name])=>`<tr><td>${esc(code)} • ${esc(name)}</td><td>${esc(scores[code]??0)} / 20</td></tr>`).join('');
    return `<section><h2>1 • Discover Me — O*NET® Interest Profile</h2><p><strong>Top interest clues:</strong> ${top.length?esc(top.map(c=>`${c} • ${RIASEC[c]||c}`).join(' | ')):'Not yet calculated'}</p><table><thead><tr><th>Interest area</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }

  function alignmentSection(state){
    const a=state.alignment||{};
    const hasPrefs=['style','training','environment','people'].some(k=>a[k]);
    const selected=Array.isArray(a.selected)?a.selected:[];
    const matches=Array.isArray(a.matches)?a.matches:[];
    if(!hasPrefs&&!selected.length&&!matches.length)return '';

    const visibleCards=[...document.querySelectorAll('#careerCards .career-card')];
    const levels=new Map();
    visibleCards.forEach(card=>{
      const title=card.querySelector('h3')?.textContent?.trim();
      const fit=card.querySelector('.career-fit');
      const label=fit?.dataset?.alignmentLevel || fit?.querySelector('strong')?.textContent?.trim();
      if(title&&label)levels.set(title,label);
    });
    const occupationRows=(matches.length?matches:selected).map(title=>`<tr><td>${esc(title)}</td><td>${esc(levels.get(title)||'')}</td><td>${selected.includes(title)?'Saved for LMI':'Surfaced'}</td></tr>`).join('');

    return `<section><h2>2 • Career Alignment</h2><div class="grid"><div><strong>Preferred activity</strong><span>${esc(preferenceLabel('style',a.style))}</span></div><div><strong>Preparation time</strong><span>${esc(preferenceLabel('training',a.training))}</span></div><div><strong>Work environment</strong><span>${esc(preferenceLabel('environment',a.environment))}</span></div><div><strong>People interaction</strong><span>${esc(preferenceLabel('people',a.people))}</span></div></div>${occupationRows?`<h3>Career possibilities</h3><table><thead><tr><th>Occupation</th><th>Interest Alignment</th><th>Status</th></tr></thead><tbody>${occupationRows}</tbody></table>`:''}</section>`;
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
    return `<section><h2>4 • My Career Tree</h2><div class="grid">${items.map(([label,value])=>`<div><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`).join('')}</div></section>`;
  }

  function buildReport(){
    const state=readState();
    const participant=state.profile?.name||state.participantName||localStorage.getItem('level-up-participant-name')||'';
    const body=[interestSection(state),alignmentSection(state),lmiSection(state),treeSection(state)].filter(Boolean).join('');
    const now=new Date();
    return `<!doctype html><html><head><meta charset="utf-8"><title>Career Tree Results</title><style>
      @page{size:letter;margin:.55in}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#14213d;margin:0;font-size:11pt;line-height:1.42}.header{border-bottom:4px solid #3bbcf5;padding-bottom:16px;margin-bottom:22px}.eyebrow{font-size:9pt;font-weight:800;letter-spacing:.12em;color:#1675a9}.header h1{margin:5px 0 3px;font-size:24pt}.header p{margin:2px 0;color:#53627a}section{break-inside:avoid;margin:0 0 24px}section h2{font-size:16pt;margin:0 0 10px;color:#14213d}h3{font-size:12pt;margin:12px 0 6px}table{width:100%;border-collapse:collapse;margin:8px 0 12px}th,td{text-align:left;border-bottom:1px solid #dce4ee;padding:7px 6px;vertical-align:top}th{font-size:9pt;text-transform:uppercase;letter-spacing:.04em;color:#526278}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 12px}.grid>div{border:1px solid #dce4ee;border-radius:8px;padding:9px}.grid strong,.grid span{display:block}.grid span{margin-top:3px;color:#44536a}.evidence{border:1px solid #dce4ee;border-radius:10px;padding:12px;margin:10px 0;break-inside:avoid}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:8px 0}.metrics span{background:#f4f7fb;border-radius:7px;padding:7px}.metrics b{display:block;font-size:8pt;text-transform:uppercase;color:#61728a;margin-bottom:2px}.muted,.source{color:#61728a}.source{font-size:8.5pt}.footer{border-top:1px solid #dce4ee;padding-top:10px;margin-top:24px;font-size:8.5pt;color:#68778d}.no-print{margin:0 0 18px;padding:10px;background:#eef8fd;border:1px solid #b9e7fb;border-radius:8px}@media print{.no-print{display:none}.evidence,section{break-inside:avoid}}@media(max-width:700px){.grid,.metrics{grid-template-columns:1fr}}
    </style></head><body><div class="no-print">Use your browser’s print window to print this report or choose <strong>Save as PDF</strong>.</div><header class="header"><div class="eyebrow">LEVEL UP • CAREER TREE</div><h1>Career Exploration Results</h1>${participant?`<p><strong>Participant:</strong> ${esc(participant)}</p>`:''}<p>Generated ${esc(now.toLocaleDateString())} at ${esc(now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}))}</p></header>${body||'<p>No Career Tree results have been saved yet.</p>'}<footer class="footer">Career Tree results are exploration evidence, not a guarantee of employment, training eligibility, funding, or career success. O*NET® is a trademark of the U.S. Department of Labor, Employment and Training Administration.</footer><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`;
  }

  function printResults(){
    const win=window.open('','_blank','noopener,noreferrer');
    if(!win){alert('Please allow pop-ups for this page so Career Tree can open your printable results.');return;}
    win.document.open();
    win.document.write(buildReport());
    win.document.close();
  }

  function addExportButton(container,id){
    if(!container||document.getElementById(id))return;
    const row=document.createElement('div');
    row.className='career-results-export-row';
    const btn=document.createElement('button');
    btn.id=id;
    btn.type='button';
    btn.className='secondary-btn';
    btn.textContent='🖨️ Print / Save Results';
    btn.addEventListener('click',printResults);
    row.appendChild(btn);
    container.appendChild(row);
  }

  function installExportButtons(){
    const interest=document.querySelector('#interestResults .results-actions');
    if(interest)addExportButton(interest,'printInterestResults');

    const alignment=document.querySelector('#matchResults .stage-action-row');
    if(alignment)addExportButton(alignment,'printAlignmentResults');

    const lmi=document.querySelector('#viewLmi .lmi-workbench');
    if(lmi)addExportButton(lmi,'printLmiResults');

    const tree=document.querySelector('#viewTree .career-summary');
    if(tree&&!document.getElementById('printCareerTreeResults')){
      const existing=document.getElementById('printSummary');
      if(existing){
        existing.textContent='🖨️ Print / Save Results';
        existing.onclick=printResults;
        existing.id='printCareerTreeResults';
      }else addExportButton(tree,'printCareerTreeResults');
    }
  }

  function installStageProgression(){
    const configs=[
      ['viewInterest','interest','Discover Me'],
      ['viewAlignment','alignment','Career Alignment'],
      ['viewLmi','lmi','LMI Lab'],
      ['viewTree','tree','Work + Life Simulator']
    ];
    const state=readState();
    const done={interest:Boolean(state.interest?.complete),alignment:Boolean(state.alignment?.complete),lmi:Boolean(state.lmi?.complete),tree:Boolean(state.lifePlan||state.tree?.complete)};
    const current=location.hash.replace('#','');
    const markup=configs.map(([id,key,label],i)=>`<button type="button" class="career-progress-step ${done[key]?'complete':''} ${current===key?'current':''}" data-career-progress="${key}"><span>${done[key]?'✓':i+1}</span><b>${label}</b></button>`).join('');
    configs.forEach(([id])=>{
      const shell=document.querySelector(`#${id} .stage-shell`);
      const head=shell?.querySelector('.stage-head');
      if(!shell||!head||shell.querySelector('.career-progress-strip'))return;
      const nav=document.createElement('nav');
      nav.className='career-progress-strip';
      nav.setAttribute('aria-label','Career Tree progression');
      nav.innerHTML=markup;
      head.insertAdjacentElement('beforebegin',nav);
      nav.querySelectorAll('[data-career-progress]').forEach(btn=>btn.addEventListener('click',()=>{
        const target=btn.dataset.careerProgress;
        if(target==='tree')location.href='life-plan-completion.html?v=20261011-progression-stable';
        else location.hash=`#${target}`;
      }));
    });
  }

  function installLmiHandoff(){
    const explorer=document.getElementById('azLmiExplorer');
    if(!explorer||document.getElementById('lmiAlignmentHandoff'))return;
    const state=readState();
    const selected=Array.isArray(state.alignment?.selected)?state.alignment.selected:[];
    const panel=document.createElement('section');
    panel.id='lmiAlignmentHandoff';
    panel.className='lmi-alignment-handoff';
    panel.innerHTML=selected.length?`<div><span class="eyebrow">STAGE 3 • LMI LAB</span><h2>You brought ${selected.length} career ${selected.length===1?'possibility':'possibilities'} from Career Alignment.</h2><p>Now test them against the market. Review wages, employment, growth, openings, and preparation before deciding what stays on your Career Tree.</p></div><div class="handoff-careers">${selected.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:`<div><span class="eyebrow">STAGE 3 • LMI LAB</span><h2>Test a career against the market.</h2><p>No careers have been carried over yet. You can return to Career Alignment or search an occupation directly in the Lab.</p></div>`;
    explorer.insertAdjacentElement('beforebegin',panel);
  }

  function addStyles() {
    if (document.getElementById('alignment-surface-note-styles')) return;
    const style=document.createElement('style');
    style.id='alignment-surface-note-styles';
    style.textContent=`
      #matchResults .alignment-surface-note{margin-top:16px;padding:16px 18px;border:1px solid rgba(114,215,255,.28);border-radius:16px;background:rgba(114,215,255,.07);display:grid;gap:5px;max-width:900px}
      #matchResults .alignment-surface-note strong{color:#dff7ff;font-size:.95rem}
      #matchResults .alignment-surface-note span{color:#b9c7df;line-height:1.5;font-size:.9rem}
      #careerCards .career-card .why[hidden]{display:none!important}
      #careerCards .career-fit{display:grid;grid-template-columns:1fr auto;gap:5px 12px;align-items:center;margin-top:14px}
      #careerCards .career-fit>span{color:#d7e2f5;font-size:.9rem}
      #careerCards .career-fit>strong{color:#f6fbff;font-size:.95rem;white-space:nowrap}
      #careerCards .career-fit-track{grid-column:1/-1;width:100%}
      .career-results-export-row{display:flex;align-items:center;gap:10px;margin-top:12px}
      #matchResults .stage-action-row .career-results-export-row{margin-top:0}
      .career-progress-strip{display:flex;gap:8px;margin:0 0 18px;padding:10px;border:1px solid rgba(114,215,255,.2);border-radius:16px;background:rgba(7,17,38,.75);overflow-x:auto}
      .career-progress-step{flex:1;min-width:150px;display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid rgba(120,150,210,.2);border-radius:12px;background:#0a1630;color:#dce8fb;text-align:left;cursor:pointer}
      .career-progress-step span{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#19294b;font-weight:900;flex:0 0 28px}
      .career-progress-step.complete{border-color:rgba(100,235,178,.42)}.career-progress-step.complete span{background:#174c3f}.career-progress-step.current{border-color:#55d6ff}
      .lmi-alignment-handoff{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(240px,.65fr);gap:16px;margin:0 0 20px;padding:18px;border:1px solid rgba(89,218,255,.28);border-radius:18px;background:linear-gradient(135deg,rgba(21,61,91,.45),rgba(13,28,58,.7))}
      .lmi-alignment-handoff h2{margin:.25rem 0 .4rem;font-size:clamp(1.2rem,2vw,1.55rem)}.lmi-alignment-handoff p{margin:0;color:#bccae3}.handoff-careers{display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start}.handoff-careers span{padding:8px 10px;border-radius:999px;background:rgba(84,210,255,.1);border:1px solid rgba(84,210,255,.28);font-size:.82rem;font-weight:700}
      @media(max-width:850px){.career-progress-strip{display:grid;grid-template-columns:1fr 1fr}.career-progress-step{min-width:0}.lmi-alignment-handoff{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function refresh(root=document){
    addStyles();
    updateExplainer();
    updateCareerFitLabels(root);
    installExportButtons();
    installStageProgression();
    installLmiHandoff();
  }

  let refreshQueued=false;
  const observer=new MutationObserver(mutations=>{
    const relevant=mutations.some(m=>[...m.addedNodes].some(node=>node instanceof Element && (
      node.matches?.('.career-card,.career-fit,.results-actions,.lmi-workbench,.career-summary') ||
      node.querySelector?.('.career-card,.career-fit,.results-actions,.lmi-workbench,.career-summary')
    )));
    if(!relevant||refreshQueued)return;
    refreshQueued=true;
    setTimeout(()=>{refreshQueued=false;refresh();},0);
  });

  const start=()=>{
    refresh();
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(refresh,250);
    setTimeout(refresh,900);
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  window.addEventListener('hashchange',()=>setTimeout(refresh,0));
})();
