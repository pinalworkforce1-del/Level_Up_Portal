(()=>{
const $=id=>document.getElementById(id), sections=['start','details','questions','review'];
const KEY='levelup-nova-resume-studio-draft-v1';
const state={mode:'',q:0,answers:[],prompts:[]};
const show=id=>sections.forEach(x=>$(x).classList.toggle('hidden',x!==id));
function persist(){try{localStorage.setItem(KEY,JSON.stringify({mode:state.mode,q:state.q,answers:state.answers,prompts:state.prompts,fields:fields(),draft:$('editable').value,format:$('format').value}))}catch{}}
function fields(){return Object.fromEntries(['person','contact','target','posting','resume','experience','education','skills'].map(id=>[id,$(id).value.trim()]))}
function choose(mode){state.mode=mode;$('existingFields').classList.toggle('hidden',mode!=='existing');$('newFields').classList.toggle('hidden',mode!=='new');show('details');persist()}
$('existing').onclick=()=>choose('existing');$('new').onclick=()=>choose('new');$('backStart').onclick=()=>show('start');
const safe=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const sentence=s=>String(s||'').trim().replace(/\s+/g,' ');
function questionSet(){
 const f=fields(),posting=f.posting.toLowerCase(),cna=/nurs|patient|cna|care|clinical|hospital/.test((f.target+' '+posting).toLowerCase());
 const core=[
 ['What responsibilities or projects best demonstrate your readiness for this job?','Describe the setting, what you personally did, and roughly when.'],
 ['Tell me about a time you communicated clearly with someone who needed help.','What did you say or do, and what was the result?'],
 ['Describe a time you worked with someone else to accomplish something.','What was your contribution?'],
 ['How have you handled a problem or an unexpected change?','Share one example. It can come from school, volunteering, caregiving or work.'],
 ['What training, credentials, equipment or systems related to this position have you actually used?','Only include completed credentials or training, and name the issuing source when possible.'],
 ['What relevant accomplishment or strength is missing from your current résumé?','Be specific; avoid estimated percentages or numbers unless you can substantiate them.']
 ];
 if(cna){core[0]=['Have you supported someone with daily activities in a professional or personal setting?','What tasks did you personally perform, and were you acting as a trained employee, volunteer, or family member?'];core[4]=['Do you currently hold a CNA license or certification, CPR training, or other relevant healthcare credential?','Specify the credential and status. If none, say none.'];}
 const extracted=sentence(f.posting).split(/[.;\n]/).filter(x=>x.length>25).slice(0,2);
 if(extracted[0])core[3]=['The posting mentions: “'+extracted[0].slice(0,120)+'”. Have you done something relevant?','Describe an actual example or say you have not. Do not claim training you have not received.'];
 if(extracted[1])core[5]=['The employer also mentions: “'+extracted[1].slice(0,120)+'”. What verified experience could you share?','Tell NOVA what you personally did, where, and when.'];
 return core;
}
function renderQuestion(){const [q,h]=state.prompts[state.q];$('qCounter').textContent='NOVA QUESTION '+(state.q+1)+' OF '+state.prompts.length;$('qTitle').textContent=q;$('qHelp').textContent=h;$('answer').value=state.answers[state.q]||'';$('qNext').textContent=state.q===state.prompts.length-1?'Review my résumé →':'Save & next →';show('questions');}
async function novaToken(){
 const base='https://dnijrzotfyvmmnmueknk.supabase.co';
 const key='sb_publishable_qSEo4iczJBozMaSIvTKisw_BsJy-iPc';
 const keys=['sb-dnijrzotfyvmmnmueknk-auth-token',...Object.keys(localStorage).filter(x=>x.includes('dnijrzotfyvmmnmueknk')&&x.includes('auth-token'))];
 for(const storageKey of [...new Set(keys)]){
   let record;try{record=JSON.parse(localStorage.getItem(storageKey)||'null')}catch{continue}
   let session=record?.access_token?record:record?.currentSession||record?.session||record?.data?.session;
   if(!session?.access_token)continue;
   const refresh=async()=>{
     if(!session.refresh_token)return false;
     try{const res=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify({refresh_token:session.refresh_token})});
       if(!res.ok)return false;const updated=await res.json();if(!updated.access_token)return false;
       session=updated;localStorage.setItem(storageKey,JSON.stringify(updated));return true;
     }catch{return false}
   };
   let valid=false;
   try{const res=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+session.access_token}});valid=res.ok}catch{}
   if(!valid){if(!await refresh())continue;
     try{const res=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+session.access_token}});valid=res.ok}catch{}}
   if(valid)return session.access_token;
 }
 return '';
}
async function novaQuestions(f){
 if(f.posting.length<80)throw Error('Paste at least 80 characters of the employer job posting for live AI questions.');
 const token=await novaToken();
 if(!token)throw Error('Sign in to Level Up to use live NOVA intelligence.');
 const resume={targetRole:f.target,summary:state.mode==='existing'?f.resume:f.experience,skills:f.skills.split(/[,;\\n]/).map(x=>x.trim()).filter(Boolean),bullets:[],education:{type:f.education,status:'',school:'',year:''}};
 const response=await fetch('https://dnijrzotfyvmmnmueknk.supabase.co/functions/v1/resume-ai',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'apikey':'sb_publishable_qSEo4iczJBozMaSIvTKisw_BsJy-iPc'},body:JSON.stringify({mode:'job_match',resume,jobPosting:f.posting})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.message||'NOVA AI is unavailable ('+response.status+').');
 const questions=(result.mightBeThere||[]).filter(x=>x.question).map(x=>[x.question,'NOVA is checking whether you have evidence for: '+(x.item||'this job requirement')]);
 const gap=(result.notShowingYet||[]).filter(x=>x.item).map(x=>['The employer seeks '+x.item+'. Do you have related experience, training, or a credential not yet listed?','Only describe facts you can support. It is fine to answer no.']);
 return [...questions,...gap].slice(0,6);
}
$('analyze').onclick=async()=>{
 const f=fields();
 if(!f.person||!f.target||(state.mode==='existing'&&!f.resume)||(state.mode==='new'&&!f.experience&&!f.education&&!f.skills)){alert('Please add your name, target occupation, and either résumé text or at least one experience, education or skills detail.');return;}
 const button=$('analyze');button.disabled=true;button.textContent='NOVA is analyzing the job…';
 try{const questions=await novaQuestions(f);if(!questions.length)throw Error('NOVA found no clarification questions.');state.prompts=questions;state.q=0;state.answers=[];renderQuestion();persist();}
 catch(e){alert(e.message+'\\n\\nYou can continue using guided questions while live AI is unavailable.');state.prompts=questionSet();state.q=0;state.answers=[];renderQuestion();persist();}
 finally{button.disabled=false;button.textContent='Continue to NOVA\'s questions →';}
};
$('qBack').onclick=()=>{state.answers[state.q]=$('answer').value.trim();if(state.q===0)show('details');else{state.q--;renderQuestion()}persist()};
$('qNext').onclick=()=>{state.answers[state.q]=$('answer').value.trim();if(state.q<state.prompts.length-1){state.q++;renderQuestion()}else draft();persist()};
function draft(){
 const f=fields(),lines=[f.person.toUpperCase(),f.contact,f.target,'PROFESSIONAL PROFILE'];
 const evidence=state.mode==='existing'?f.resume:f.experience;
 lines.push('Targeting '+f.target+'. Experience and skills are detailed below for participant review.');
 lines.push('RELEVANT EXPERIENCE');lines.push(evidence||'No experience details supplied.');
 if(f.skills){lines.push('SKILLS');lines.push(f.skills)}
 if(f.education){lines.push('EDUCATION AND TRAINING');lines.push(f.education)}
 const answered=state.answers.map((v,i)=>({v:sentence(v),q:state.prompts[i]?.[0]})).filter(x=>x.v&&!/^(none|no|n\/a|i haven.t)/i.test(x.v));
 if(answered.length){lines.push('ADDITIONAL EVIDENCE TO REVIEW');answered.forEach(x=>lines.push('• '+x.v));}
 lines.push('Note: Review and reorganize this draft before applying. Remove prompts and unsupported statements.');
 $('editable').value=lines.filter(Boolean).join('\n\n');$('approval').checked=false;$('save').disabled=true;renderPreview();show('review');
}
function renderPreview(){const rows=$('editable').value.split('\n').map(x=>x.trim());let html='',heading=true;rows.forEach((x,i)=>{if(!x)return;const upper=x===x.toUpperCase()&&x.length<45&&!x.startsWith('•');if(i===0){html+='<h2>'+safe(x)+'</h2>';return}if(upper){html+='<div class="section">'+safe(x)+'</div>';return}html+='<p>'+safe(x)+'</p>'});$('preview').innerHTML=html;$('preview').className='paper '+$('format').value;}
$('editable').oninput=()=>{renderPreview();$('approval').checked=false;$('save').disabled=true;persist()};
$('format').onchange=()=>{renderPreview();persist()};
$('approval').onchange=()=>{$('save').disabled=!$('approval').checked};
$('print').onclick=()=>window.print();
$('save').onclick=()=>{if(!$('approval').checked)return;const record={name:$('person').value,target:$('target').value,content:$('editable').value,format:$('format').value,reviewedAt:new Date().toISOString(),mode:state.mode};try{const arr=JSON.parse(localStorage.getItem('levelup-nova-resume-reviewed-v1')||'[]');arr.push(record);localStorage.setItem('levelup-nova-resume-reviewed-v1',JSON.stringify(arr));$('savedNote').textContent='Saved to this browser for QA. Shared Supabase résumé saving is not yet connected.'}catch{$('savedNote').textContent='Unable to save to this browser.'}persist()};
$('restart').onclick=()=>{if(confirm('Start a new NOVA draft? Your reviewed local saved versions will remain.')){localStorage.removeItem(KEY);location.reload()}};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.fields){for(const [id,v] of Object.entries(saved.fields)){if($(id))$(id).value=v||''}state.mode=saved.mode;state.q=saved.q||0;state.answers=saved.answers||[];state.prompts=saved.prompts||[];$('format').value=saved.format||'classic';$('editable').value=saved.draft||'';choose(state.mode||'new');if(saved.draft){renderPreview();show('review')}else if(state.prompts.length)renderQuestion();}}catch{}
})();