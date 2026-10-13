(()=>{
  'use strict';

  const NEXT_KEY='level-up-career-tree-next-v1';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const finite=v=>Number.isFinite(Number(v));
  const fmtNumber=v=>finite(v)?Math.round(Number(v)).toLocaleString():'Not available';
  const fmtWage=v=>finite(v)?`$${Number(v).toFixed(2)}/hr`:'Not available';
  const fmtGrowth=v=>finite(v)?`${Number(v)>0?'+':''}${Number(v).toFixed(1)}%`:'Not available';

  function readState(){
    try{return JSON.parse(localStorage.getItem(NEXT_KEY)||'{}')}catch{return {}}
  }

  function records(){
    const raw=readState().exploreCareers?.reflections||{};
    return Object.values(raw).filter(r=>r&&r.savedAt).sort((a,b)=>String(b.savedAt).localeCompare(String(a.savedAt)));
  }

  function answerLabel(group,value){
    const maps={
      picture:{yes:'Yes',maybe:'Maybe',no:'No'},
      commitment:{now:'Yes, now',future:'Maybe in the future',unsure:"I'm not sure",no:'No'},
      wages:{higher:'Higher than expected',expected:'About what I expected',lower:'Lower than expected',unsure:"I wasn't sure what to expect"},
      opportunity:{more:'More interested',same:'About the same',less:'Less interested',unsure:"I'm not sure yet"}
    };
    return maps[group]?.[value]||'Not answered';
  }

  function updateCount(){
    const button=$('viewSavedExplorations');
    if(!button)return;
    const count=records().length;
    button.textContent=`View Saved Explorations (${count})`;
    button.disabled=count===0;
    button.setAttribute('aria-disabled',count===0?'true':'false');
  }

  function detailHtml(record){
    const a=record.answers||{},s=record.snapshot||{};
    return `<div class="saved-exploration-detail">
      <div class="saved-exploration-metrics">
        <div><small>Typical entry</small><strong>${esc(fmtWage(s.entryHourly))}</strong></div>
        <div><small>Median wage</small><strong>${esc(fmtWage(s.medianHourly))}</strong></div>
        <div><small>Highest earners</small><strong>${esc(fmtWage(s.experiencedHourly))}</strong></div>
        <div><small>Employment</small><strong>${esc(fmtNumber(s.employment))}</strong></div>
        <div><small>Annual openings</small><strong>${esc(fmtNumber(s.annualOpenings))}</strong></div>
        <div><small>Projected growth</small><strong>${esc(fmtGrowth(s.growthPct))}</strong></div>
      </div>
      <p><strong>Typical preparation:</strong> ${esc(s.preparation||'Not available')}</p>
      <div class="saved-exploration-answers">
        <p><b>Can you see yourself doing this job?</b><span>${esc(answerLabel('picture',a.picture))}</span></p>
        <p><b>Commitment to preparation</b><span>${esc(answerLabel('commitment',a.commitment))}</span></p>
        <p><b>Wages compared with expectations</b><span>${esc(answerLabel('wages',a.wages))}</span></p>
        <p><b>Effect of local opportunity</b><span>${esc(answerLabel('opportunity',a.opportunity))}</span></p>
        <p class="coach-note"><b>Notes for career coach</b><span>${esc(a.notes||'No notes entered.')}</span></p>
      </div>
    </div>`;
  }

  function renderList(){
    const host=$('savedExplorationsList');
    if(!host)return;
    const list=records();
    if(!list.length){host.innerHTML='<div class="interest-empty"><strong>No saved explorations yet.</strong><p>Complete and save a Career Exploration Reflection to see it here.</p></div>';return;}
    host.innerHTML=list.map((r,i)=>`<article class="saved-exploration-card" data-index="${i}">
      <div class="saved-exploration-summary">
        <div><span class="eyebrow">${esc(r.geographyLabel||'CAREER EXPLORATION')} • ${esc(r.code||'')}</span><h3>${esc(r.title||'Saved career exploration')}</h3><p>Saved ${esc(new Date(r.savedAt).toLocaleString())}</p></div>
        <div class="saved-exploration-actions"><button type="button" class="secondary-btn" data-view="${i}">View</button><button type="button" class="secondary-btn" data-print="${i}">Print / Save PDF</button></div>
      </div>
      <div class="saved-exploration-body" id="savedExplorationBody${i}" hidden>${detailHtml(r)}</div>
    </article>`).join('');

    host.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
      const index=Number(button.dataset.view),body=$(`savedExplorationBody${index}`);
      if(!body)return;
      body.hidden=!body.hidden;
      button.textContent=body.hidden?'View':'Hide';
    });
    host.querySelectorAll('[data-print]').forEach(button=>button.onclick=()=>printRecord(list[Number(button.dataset.print)]));
  }

  function printRecord(record){
    if(!record)return;
    const a=record.answers||{},s=record.snapshot||{};
    const w=window.open('','_blank','width=860,height=900');
    if(!w)return alert('Please allow pop-ups to print or save this exploration.');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(record.title)} - Career Exploration</title><style>body{font-family:Arial,sans-serif;color:#13203a;margin:38px;line-height:1.45}h1{margin-bottom:4px}h2{margin-top:28px;border-bottom:2px solid #d8e3f0;padding-bottom:6px}.meta{color:#52647c}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.box{border:1px solid #ccd8e7;border-radius:10px;padding:10px}.q{margin:16px 0}.q b{display:block;margin-bottom:4px}.notes{white-space:pre-wrap;border:1px solid #ccd8e7;border-radius:10px;padding:12px;min-height:80px}@media print{button{display:none}}</style></head><body><h1>${esc(record.title)}</h1><div class="meta">${esc(record.geographyLabel)} • ${esc(record.code)} • Saved ${esc(new Date(record.savedAt).toLocaleString())}</div><h2>Labor Market Snapshot</h2><div class="grid"><div class="box"><b>Typical entry</b><br>${esc(fmtWage(s.entryHourly))}</div><div class="box"><b>Median wage</b><br>${esc(fmtWage(s.medianHourly))}</div><div class="box"><b>Highest earners</b><br>${esc(fmtWage(s.experiencedHourly))}</div><div class="box"><b>Employment</b><br>${esc(fmtNumber(s.employment))}</div><div class="box"><b>Annual openings</b><br>${esc(fmtNumber(s.annualOpenings))}</div><div class="box"><b>Projected growth</b><br>${esc(fmtGrowth(s.growthPct))}</div></div><p><b>Typical preparation:</b> ${esc(s.preparation||'Not available')}</p><h2>Career Exploration Reflection</h2><div class="q"><b>Can you see yourself doing this job?</b>${esc(answerLabel('picture',a.picture))}</div><div class="q"><b>Are you willing to commit the typical amount of time to training/career preparation?</b>${esc(answerLabel('commitment',a.commitment))}</div><div class="q"><b>How did the wages compare with what you expected?</b>${esc(answerLabel('wages',a.wages))}</div><div class="q"><b>How did the local labor market affect your interest?</b>${esc(answerLabel('opportunity',a.opportunity))}</div><div class="q"><b>Notes for your career coach</b><div class="notes">${esc(a.notes||'No notes entered.')}</div></div><button onclick="window.print()">Print / Save PDF</button><script>setTimeout(()=>window.print(),250)<\/script></body></html>`);
    w.document.close();
  }

  function openReview(){
    renderList();
    $('savedExplorationsDialog')?.showModal();
  }

  function init(){
    const button=$('viewSavedExplorations'),dialog=$('savedExplorationsDialog');
    if(!button||!dialog)return;
    button.onclick=openReview;
    dialog.querySelector('.saved-explorations-close')?.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    document.addEventListener('click',e=>{if(e.target.closest?.('.reflection-save'))setTimeout(updateCount,75);});
    updateCount();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();