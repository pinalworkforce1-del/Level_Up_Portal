(()=>{
'use strict';
const ROOT='https://dnijrzotfyvmmnmueknk.supabase.co/functions/v1/';
const SESSION_KEY='levelup-coach-readiness-staff-v1';
const $=id=>document.getElementById(id);
let token=sessionStorage.getItem(SESSION_KEY)||'',people=[],selected=null;
const labels={direction:'Career direction',strengths:'Strengths and interests',goal:'Specific goal',action:'First action',timeframe:'Time frame'};
const supportLabels={career_info:'Career information',action_plan:'Action planning',training:'Training or work experience',coach:'Talk with Career Coach',ready:'Ready to act'};
const showStatus=(message,error=false)=>{const e=$('status');e.textContent=message;e.className=error?'error':''};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n};
const append=(parent,...children)=>{parent.append(...children);return parent};
async function post(slug,data,staffToken=token){
 const headers={'Content-Type':'application/json'};
 if(staffToken)headers['X-Levelup-Staff-Token']=staffToken;
 const res=await fetch(ROOT+slug,{method:'POST',headers,body:JSON.stringify(data)});
 const body=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(body.error||'Request failed ('+res.status+')');
 return body;
}
function signedIn(yes){$('login').hidden=yes;$('workspace').hidden=!yes;$('logout').hidden=!yes;}
async function signIn(email,access_code){
 showStatus('Checking staff credentials…');
 const result=await post('levelup-facilitated',{action:'staff_login',email,access_code},'');
 if(!result.staff_token)throw Error('No staff session returned');
 token=result.staff_token;sessionStorage.setItem(SESSION_KEY,token);
 signedIn(true);await roster();
}
async function roster(){
 showStatus('Loading assigned participant records…');
 const result=await post('career-tree-coach-roster',{});
 people=(result.participants||[]).filter(p=>p?.career_tree?.my_path_forward?.status!=='not_started'&&p?.career_tree?.my_path_forward);
 const root=$('roster');root.replaceChildren();
 if(!people.length){root.append(node('p','No saved My Path Forward reflections found for your assigned participants.','muted'));}
 for(const person of people){
   const btn=node('button',person.display_name||'Participant','person');
   const details=node('small',person.career_tree?.my_path_forward?.is_complete?' · Completed':' · Draft','muted');
   btn.append(details);
   btn.onclick=()=>loadPerson(person);
   if(selected?.person_key===person.person_key)btn.setAttribute('aria-current','true');
   root.append(btn);
 }
 showStatus(people.length+' participant record(s) with My Path Forward progress');
}
function section(root,title){const s=node('section');s.append(node('h2',title));root.append(s);return s}
function row(root,label,value){const wrapper=node('div',undefined,'row');wrapper.append(node('span',label),node('strong',value));root.append(wrapper);}
function block(root,label,value){if(!value)return;root.append(node('h3',label),node('div',value,'textblock'));}
function scoreCard(label,value,note){const c=node('div',undefined,'score');c.append(node('span',label),node('strong',value===null?'—':String(value)+'/10'),node('span',note));return c;}
function render(person,data){
 const r=$('insights');r.replaceChildren();
 r.append(node('h2',person.display_name||'Participant'));
 r.append(node('p','My Path Forward · '+(data.is_complete?'Completed reflection':'Saved draft')+' · '+(data.updated_at?new Date(data.updated_at).toLocaleDateString():'No timestamp'),'muted'));
 const scores=node('div',undefined,'scores');scores.append(scoreCard('Participant self-rating',data.self_reported_readiness,data.self_reported_readiness===null?'Not selected':'Self-reported confidence'),scoreCard('Plan readiness',data.plan_readiness,data.category||'Insufficient information'));r.append(scores);
 const insight=section(r,'Coach interpretation');insight.append(node('p',data.interpretation||'Reflection not yet available.'));
 if(data.private_conversation_requested)insight.append(node('div','Private conversation requested. Discuss privately; do not infer or record sensitive details here.','notice'));
 const requested=(data.requested_support||[]).map(k=>supportLabels[k]).filter(Boolean);
 if(requested.length)insight.append(node('p','Participant requested: '+requested.join(' · ')));
 const details=section(r,'Plan readiness breakdown');
 for(const m of data.scored_dimensions||[])row(details,m.label,m.value===null?'Not answered':m.value+' / 2');
 if(data.plan_readiness===null)details.append(node('p','A numeric plan score appears only after all five optional questions are answered.','muted'));
 const talks=section(r,'Suggested coach talking points');
 const list=node('ul');for(const q of data.coach_talking_points||[])list.append(node('li',q));
 if(!list.children.length)list.append(node('li','Which next step would feel useful to you?'));
 talks.append(list);
 const reflections=section(r,'Participant reflections');
 for(const [key,label] of [['nextChapter','Next chapter'],['strengths','Strengths'],['goal','Goal'],['nextStep','First next step'],['target','Target time frame']])block(reflections,label,data.fields?.[key]);
 if(Array.isArray(data.history)&&data.history.length){
  const history=section(r,'Saved readiness snapshots');
  for(const h of data.history.slice(-10).reverse())row(history,new Date(h.at).toLocaleString(),'Self '+(h.self_reported_readiness??'—')+'/10 · Plan '+(h.plan_readiness??'—')+'/10');
 }
 r.append(node('p','For coaching reflection only. Not a clinical, eligibility, or employability assessment.','muted'));
}
async function loadPerson(person){
 selected=person;for(const button of $('roster').querySelectorAll('button'))button.setAttribute('aria-current',String(button.textContent||'').startsWith(person.display_name)?'true':'false');
 showStatus('Loading readiness details…');
 try{
   const result=await post('career-tree-coach-detail',{person_key:person.person_key});
   if(!result?.career_tree?.my_path_forward){$('insights').replaceChildren(node('h2','No saved reflection'),node('p','The participant has not saved My Path Forward in the cloud.'));return}
   render(person,result.career_tree.my_path_forward);
   showStatus('Readiness details loaded.');
 }catch(e){showStatus(e.message,true)}
}
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.target.querySelector('button[type=submit]');btn.disabled=true;
 try{await signIn($('email').value.trim(),$('accessCode').value)}
 catch(err){showStatus(err.message,true);signedIn(false)}
 finally{btn.disabled=false;$('accessCode').value=''}
});
$('logout').addEventListener('click',async()=>{
 try{await post('levelup-facilitated',{action:'staff_logout',staff_token:token})}catch(_){}
 sessionStorage.removeItem(SESSION_KEY);token='';selected=null;signedIn(false);$('insights').replaceChildren();showStatus('Signed out.');
});
(async()=>{if(!token)return;
 try{await post('levelup-facilitated',{action:'staff_resume',staff_token:token});signedIn(true);await roster()}
 catch(_){sessionStorage.removeItem(SESSION_KEY);token='';signedIn(false)}
})();
})();