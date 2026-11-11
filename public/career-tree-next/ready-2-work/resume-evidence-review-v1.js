/* BOOST Career Evidence Review v1 — shared UI/workflow across Northern, Pinal and Level Up.
   No automatic résumé claims. All verified entries are scoped to the active résumé version.
   Existing alignment.explored entries remain readable and reviewable. */
(function(){
'use strict';
function create(ctx){
 const {resumeData,saveState,renderResumePreview,callR2WResumeAI,showResumeCoach,syncActiveExperience,escapeHtml:esc,$}=ctx;
 const list=values=>Array.isArray(values)&&values.length?'<ul>'+values.map(v=>'<li>'+esc(String(v))+'</li>').join('')+'</ul>':'<p>No verified items identified yet.</p>';
 const now=()=>new Date().toISOString();
 const entries=a=>Array.isArray(a.explored)?a.explored:(a.explored=[]);
 const safe=s=>esc(String(s||''));
 function render(){
   const d=resumeData(),v=d.versions[d.activeVersion],a=d.alignment,panel=$('rbAlignmentPanel'),review=$('rbEvidenceReview');
   if(!panel||!review)return;
   if(!a){panel.hidden=true;review.hidden=true;return;}
   const current=String(a.jobDescription||'').trim()===String(d.jobDescription||'').trim();
   panel.hidden=!current;
   if(current){
     $('rbStrongMatch').innerHTML=list(a.strongMatch);
     $('rbEmphasize').innerHTML=list(a.emphasizeMore);
     const rows=(a.gaps||[]).map((gap,i)=>{
       const last=entries(a).filter(x=>x.gap===gap).slice(-1)[0];
       const label=last?.status==='verified_applied'?'Verified and added':last?.status==='no_related_evidence_reported'?'Not claimed':last?.status==='participant_evidence_to_review'?'Awaiting your review':'Not yet explored';
       return '<article class="gap-explore-item"><div class="gap-explore-heading"><p>'+safe(gap)+'</p><span class="gap-state">'+label+'</span></div><button type="button" class="gap-explore-btn" data-gap-index="'+i+'">'+(last?.status==='participant_evidence_to_review'?'Ask Rosie again':'Explore with Rosie →')+'</button><div class="gap-explore-convo" data-gap-convo="'+i+'" hidden></div></article>';
     }).join('');
     $('rbGap').innerHTML='<p class="gap-coaching-copy">Only verified experience belongs on your résumé. Explore a gap if you have related experience, or leave it as an honest gap.</p>'+rows;
     $('rbGap').querySelectorAll('.gap-explore-btn').forEach(b=>b.onclick=()=>explore(Number(b.dataset.gapIndex)));
   }
   const items=entries(a),pending=items.filter(x=>x.status==='participant_evidence_to_review').length,approved=items.filter(x=>x.status==='verified_applied').length;
   review.hidden=items.length===0;
   if(!items.length){review.innerHTML='';return;}
   const old=current?'':'<p class="evidence-recheck">This evidence belongs to an earlier job description for this résumé version. Run alignment again to check the current job.</p>';
   const recheck=a.needsRecheck?'<p class="evidence-recheck">Your verified evidence was added. Select <strong>Rosie: Check My Alignment</strong> again to refresh the job match.</p>':'';
   review.innerHTML='<header class="evidence-review-head"><span class="eyebrow">CAREER EVIDENCE REVIEW</span><h3>Review what Rosie uncovered</h3><p>'+pending+' awaiting review · '+approved+' verified and added. Your responses never become résumé claims automatically.</p></header>'+old+recheck+
     items.map((item,i)=>{
       const status=item.status||'participant_evidence_to_review';
       const label=status==='verified_applied'?'Verified and added':status==='no_related_evidence_reported'?'Not claimed':'Needs review';
       const details=status==='verified_applied'?'<p class="evidence-applied"><strong>Added to résumé:</strong> '+safe(item.claim)+'</p>':status==='no_related_evidence_reported'?'<p>No experience claimed for this requirement.</p>':'';
       const opts=(d.experiences||[]).map((x,j)=>'<option value="experience:'+j+'">Experience: '+safe([x.role,x.employer].filter(Boolean).join(' • ')||'Experience '+(j+1))+'</option>').join('');
       const form=status==='participant_evidence_to_review'?'<label>Your answer to Rosie<textarea class="evidence-answer" rows="5">'+safe(item.answer)+'</textarea></label><label>Where should verified evidence go?<select class="evidence-destination">'+opts+'<option value="skills">Skills section</option></select></label><label>Write accurate résumé-ready wording<input class="evidence-claim" placeholder="A specific claim you can explain and support"></label><label class="evidence-confirm"><input type="checkbox" class="evidence-attest"> I can explain and support this statement in an interview.</label><div class="evidence-review-actions"><button type="button" class="secondary-btn evidence-save-answer">Save revised answer</button><button type="button" class="primary-btn evidence-approve">Verify & add to résumé</button><button type="button" class="secondary-btn evidence-keep-gap">Keep as an honest gap</button></div><p class="evidence-error" role="status"></p>':'';
       return '<article class="evidence-review-item" data-evidence-index="'+i+'"><div class="evidence-review-item-head"><strong>'+safe(item.gap||'Experience to explore')+'</strong><span class="gap-state">'+label+'</span></div>'+details+form+'</article>';
     }).join('');
   review.querySelectorAll('[data-evidence-index]').forEach(card=>{
     const i=Number(card.dataset.evidenceIndex),item=items[i],answer=card.querySelector('.evidence-answer');
     if(!answer)return;
     const error=card.querySelector('.evidence-error'),dest=card.querySelector('.evidence-destination'),claim=card.querySelector('.evidence-claim'),attest=card.querySelector('.evidence-attest');
     card.querySelector('.evidence-save-answer').onclick=()=>{
       if(!answer.value.trim()){error.textContent='Enter an answer or keep this as a gap.';return;}
       item.answer=answer.value.trim();item.editedAt=now();v.alignment=a;saveState();render();
     };
     card.querySelector('.evidence-keep-gap').onclick=()=>{
       item.answer=answer.value.trim();item.status='no_related_evidence_reported';item.reviewedAt=now();v.alignment=a;saveState();render();
     };
     card.querySelector('.evidence-approve').onclick=()=>{
       const value=answer.value.trim(),wording=claim.value.trim(),destination=dest.value;
       if(!value||wording.length<10||!attest.checked){error.textContent='Describe your real experience, write a specific résumé-ready statement, and confirm it is accurate.';return;}
       syncActiveExperience(d);
       if(destination==='skills'){
         const existing=String(d.skills||'').trim();d.skills=existing?(existing.includes(wording)?existing:existing+'\n'+wording):wording;
         if($('rbSkills'))$('rbSkills').value=d.skills;
       }else{
         const idx=Number(destination.split(':')[1]),exp=d.experiences[idx];
         if(!exp){error.textContent='Select an experience or the skills section.';return;}
         exp.bullets=Array.isArray(exp.bullets)?exp.bullets:[];
         if(!exp.bullets.includes(wording))exp.bullets.push(wording);
       }
       item.answer=value;item.claim=wording;item.destination=destination;item.status='verified_applied';item.verifiedAt=now();
       v.careerEvidenceProfile=Array.isArray(v.careerEvidenceProfile)?v.careerEvidenceProfile:[];
       v.careerEvidenceProfile.push({gap:item.gap,answer:value,claim:wording,destination,verifiedAt:item.verifiedAt});
       a.needsRecheck=true;v.alignment=a;
       saveState();renderResumePreview();render();
     };
   });
 }
 async function analyze(){
   const d=resumeData(),v=d.versions[d.activeVersion],btn=$('rbAnalyzeJob');
   syncActiveExperience(d);
   if(!d.jobDescription.trim()){showResumeCoach('rbJobCoach','<strong>Paste the job description first.</strong><br>Then Rosie can compare it with your verified evidence.');return;}
   const verified=(d.experiences||[]).map((x,i)=>['Experience '+(i+1),x.role,x.employer,(x.bullets||[]).join(' | '),x.evidence].filter(Boolean).join(' — ')).join('\n');
   btn.disabled=true;btn.textContent='✦ Rosie is checking alignment…';
   showResumeCoach('rbJobCoach','<strong>Rosie is comparing the job with your verified experience.</strong><br>Unverified responses are not treated as qualifications.');
   try{
     const data=await callR2WResumeAI({mode:'alignment',evidence:{targetOccupation:d.target,jobDescription:d.jobDescription,verifiedEvidence:verified,skills:d.skills,education:d.education}});
     const prior=d.alignment;
     if(prior&&prior.jobDescription!==d.jobDescription){
       v.alignmentHistory=Array.isArray(v.alignmentHistory)?v.alignmentHistory:[];
       v.alignmentHistory.push(prior);
     }
     d.alignment={jobDescription:d.jobDescription,strongMatch:data.strongMatch||[],emphasizeMore:data.emphasizeMore||[],gaps:data.gaps||[],coachNote:data.coachNote||'',explored:prior?.jobDescription===d.jobDescription?entries(prior):[],analyzedAt:now(),needsRecheck:false};
     v.jobDescription=d.jobDescription;v.alignment=d.alignment;saveState();
     showResumeCoach('rbJobCoach','<strong>Alignment complete.</strong><br>'+safe(data.coachNote||'Explore gaps only where you have real experience.'));
     render();$('rbAlignmentPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
   }catch(e){showResumeCoach('rbJobCoach','<strong>Rosie could not complete the alignment check.</strong><br>Your prior evidence remains saved. Try again.');}
   finally{btn.disabled=false;btn.textContent='✦ Rosie: Check My Alignment';}
 }
 async function explore(i){
   const d=resumeData(),v=d.versions[d.activeVersion],gap=d.alignment?.gaps?.[i],box=document.querySelector('[data-gap-convo="'+i+'"]');
   if(!gap||!box)return;
   const verified=(d.experiences||[]).map((x,n)=>['Experience '+(n+1),x.role,x.employer,(x.bullets||[]).join(' | '),x.evidence].filter(Boolean).join(' — ')).join('\n');
   document.querySelectorAll('[data-gap-convo]').forEach(el=>{if(el!==box)el.hidden=true;});
   box.hidden=false;box.innerHTML='<p><strong>Rosie is preparing this question…</strong></p>';
   try{
     const data=await callR2WResumeAI({mode:'explore_gap',evidence:{gap,jobDescription:d.jobDescription,verifiedEvidence:verified}});
     box.innerHTML='<div class="rosie-gap-question"><span class="rosie-mini-badge">Rosie</span><p><strong>'+safe(data.question||'Have you done anything similar in another setting?')+'</strong></p><small>'+safe(data.whyItMatters||'This may help show transferable experience.')+'</small><label>Your response<textarea rows="6" placeholder="Describe what you did, where, and how."></textarea></label><div class="gap-reply-actions"><button type="button" class="primary-btn gap-save-evidence">Save for Career Evidence Review</button><button type="button" class="secondary-btn gap-no-evidence">I haven\'t done this</button></div></div>';
     const ta=box.querySelector('textarea');
     box.querySelector('.gap-save-evidence').onclick=()=>{
       const answer=ta.value.trim();if(!answer){ta.focus();return;}
       const xs=entries(d.alignment),prior=xs.filter(x=>x.gap===gap&&x.status==='participant_evidence_to_review').slice(-1)[0];
       if(prior){prior.answer=answer;prior.editedAt=now();}
       else xs.push({gap,answer,status:'participant_evidence_to_review',at:now()});
       v.alignment=d.alignment;saveState();render();
       $('rbEvidenceReview')?.scrollIntoView({behavior:'smooth',block:'start'});
     };
     box.querySelector('.gap-no-evidence').onclick=()=>{
       entries(d.alignment).push({gap,status:'no_related_evidence_reported',at:now()});
       v.alignment=d.alignment;saveState();render();
     };
     ta.focus();
   }catch(e){box.innerHTML='<p><strong>Rosie could not open this question.</strong> Your previous responses remain saved.</p>';}
 }
 function bind(){
   const btn=$('rbAnalyzeJob');if(btn)btn.onclick=analyze;
   const preview=$('rbTogglePreview');
   if(preview)preview.onclick=()=>{
     const work=document.querySelector('.resume-workspace');if(!work)return;
     const open=work.classList.toggle('alignment-preview-open');
     preview.textContent=open?'Hide résumé preview':'Show résumé preview';
   };
 }
 return {render,analyze,explore,bind};
}
window.R2WEvidenceWorkflow={create};
})();