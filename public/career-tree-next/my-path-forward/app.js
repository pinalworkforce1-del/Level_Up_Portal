(()=>{
'use strict';
const MODULE_ID='my-path-forward';
const LOCAL_PREFIX='levelup-my-path-forward-v1';
const INTEREST_KEY='level-up-career-skill-tree-v1';
const GEO_KEY='level-up-career-tree-geography-v1';
const ACCOUNT_KEY='sb-dnijrzotfyvmmnmueknk-auth-token';
const $=id=>document.getElementById(id);
const FIELDS=[
  {id:'nextChapter',group:'reflection',label:'My next chapter',hint:'What would you like school, training, and work to look like?',example:"Jordan: Earn my GED, explore HVAC, and work toward a steady hands-on career.",wide:true},
  {id:'myStory',group:'reflection',label:'My story',hint:'Share only school, work, volunteering, projects, or skills you feel comfortable including. Do not include private personal circumstances.',example:"Jordan: I helped with small construction and repair jobs. I enjoyed learning how things work."},
  {id:'whereNow',group:'reflection',label:'Where I am now',hint:'Describe your current education or work direction only. No information about your home, health, finances, or personal circumstances.',example:"Jordan: I'm interested in finishing my education and exploring a hands-on career."},
  {id:'strengths',group:'reflection',label:'What I bring',hint:'Strengths, interests, languages, achievements, or work habits you are proud of.',example:"Jordan: I'm dependable, bilingual, good with tools, and enjoy learning by doing."},
  {id:'motivations',group:'reflection',label:'What motivates me',hint:'What would make your effort worthwhile? Focus on positive goals.',example:"Jordan: I enjoy fixing things and want a career where I can keep developing my skills."},
  {id:'resources',group:'reflection',label:'People and resources',hint:'Name general kinds of support—mentors, schools, programs, coaches. No names or contact details needed.',example:"Jordan: Adult Education, training programs, and my Career Coach.",wide:true},
  {id:'futureVision',group:'vision',label:'My future vision',hint:'What type of career, schedule, or lifestyle would you like? Avoid entering current income or sensitive information.',example:"Jordan: Work full time in HVAC or building maintenance and earn a recognized credential.",wide:true},
  {id:'goal',group:'plan',label:'One goal I choose now',hint:'Pick a goal you can work toward—not a promise you have to fulfill.',example:"Jordan: Enroll in GED preparation and compare two HVAC pathways.",wide:true},
  {id:'nextStep',group:'plan',label:'My first next step',hint:'What is one specific, achievable action you could take?',example:"Jordan: Contact Adult Education and identify two training options.",wide:true},
  {id:'support',group:'plan',label:'Who will support me?',hint:'List types of help, rather than names or identifying details.',example:"Jordan: My Career Coach, Adult Education, and a mentor."},
  {id:'target',group:'plan',label:'Target date or time frame',hint:'Choose a realistic time frame; an exact date is optional.',example:"Jordan: Within 30 days.",kind:'text'}
];
const OPTIONS=[
  ['diploma','GED or diploma'],['wex','Job or work experience'],['training','Training or credential'],
  ['apprenticeship','Apprenticeship'],['college','College'],['business','Starting a business']
];
const EMPTY=()=>({version:1,fields:{},options:[],readiness:null,coachConversation:false,completedAt:null,updatedAt:null});
let state=EMPTY(),session=null,syncTimer=null,saveInProgress=false,lastEdit=0,loading=true,initialDirty=false;
const txt=(value)=>String(value??'').slice(0,1500);
function readJSON(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function userSession(){try{
  const raw=readJSON(ACCOUNT_KEY),value=raw?.currentSession||raw?.session||raw;
  return value?.access_token&&value?.user?.id?value:null
}catch{return null}}
function localKey(){return LOCAL_PREFIX+':'+(session?.user?.id||'guest')}
function permittedGeo(){
  const labor=String(localStorage.getItem(GEO_KEY)||'').trim().toLowerCase();
  const next=readJSON('level-up-career-tree-next-v1');
  const previous=readJSON(INTEREST_KEY);
  const selected=String(next?.exploreCareers?.geography||previous?.alignment?.geography||'').trim().toLowerCase();
  const region=String(localStorage.getItem('level-up-pending-county')||previous?.profile?.county||'').trim().toLowerCase();
  return labor==='pinal'||selected==='pinal'||region.includes('pinal')
}
function interestComplete(){return Boolean(readJSON(INTEREST_KEY)?.interest?.complete)}
function fromRow(row){
  const payload=row?.journey_state;
  const data=payload?.data&&payload.experience===MODULE_ID?payload.data:payload;
  if(!data||typeof data!=='object')return null;
  return sanitize(data);
}
function sanitize(data){
  const next=EMPTY();
  if(data.fields&&typeof data.fields==='object'){
    for(const def of FIELDS)if(typeof data.fields[def.id]==='string')next.fields[def.id]=txt(data.fields[def.id]);
  }
  next.options=Array.isArray(data.options)?data.options.filter(v=>OPTIONS.some(([k])=>v===k)).slice(0,OPTIONS.length):[];
  next.readiness=Number.isInteger(data.readiness)&&data.readiness>=0&&data.readiness<=10?data.readiness:null;
  next.coachConversation=data.coachConversation===true;
  next.completedAt=typeof data.completedAt==='string'?data.completedAt:null;
  next.updatedAt=typeof data.updatedAt==='string'?data.updatedAt:null;
  return next;
}
function persistLocal(){
  state.updatedAt=new Date().toISOString();
  try{localStorage.setItem(localKey(),JSON.stringify(state))}catch(e){console.warn('Local draft unavailable',e)}
}
function saveIndicator(text){$('saveState').textContent=text}
function progress(){
  const filled=FIELDS.filter(def=>Boolean(state.fields[def.id]?.trim())).length;
  const count=filled+(state.options.length?1:0)+(state.readiness!==null?1:0);
  $('progressLabel').textContent=count+' of '+(FIELDS.length+2)+' optional prompts filled';
  $('progressFill').style.width=String(count/(FIELDS.length+2)*100)+'%';
  $('readinessValue').textContent=state.readiness===null?'Not selected':state.readiness+' / 10';
  $('readiness').value=String(state.readiness??5);
  $('clearReadiness').hidden=state.readiness===null;
  $('lastSaved').textContent=state.completedAt?'Completed '+new Date(state.completedAt).toLocaleDateString():'Save as a draft whenever you like.';
}
function formValues(){
  for(const def of FIELDS)state.fields[def.id]=txt($(def.id).value.trim());
  state.options=OPTIONS.filter(([key])=>$('choice_'+key).checked).map(([key])=>key);
  state.coachConversation=$('coachConversation').checked;
}
function setForm(){
  for(const def of FIELDS)$(def.id).value=state.fields[def.id]||'';
  for(const [key] of OPTIONS)$('choice_'+key).checked=state.options.includes(key);
  $('coachConversation').checked=Boolean(state.coachConversation);
  progress();
}
async function save(showMessage=false,complete=false){
  if(loading)return;
  formValues();
  if(complete&&!state.completedAt)state.completedAt=new Date().toISOString();
  persistLocal();
  progress();
  saveIndicator('Saved on this device');
  if(!window.LevelUpCareerTreeSync?.save){
    if(showMessage)saveIndicator('Saved on this device • cloud sync unavailable');
    return;
  }
  if(saveInProgress){initialDirty=true;return}
  saveInProgress=true;
  try{
    const result=await window.LevelUpCareerTreeSync.save(MODULE_ID,sanitize(state),{
      xp:0,isComplete:Boolean(state.completedAt),completedAt:state.completedAt||null
    });
    saveIndicator(result.synced?'Saved to Level Up ✓':'Saved on this device • will sync when available');
  }catch(error){
    console.warn('My Path Forward save issue',error);
    saveIndicator('Saved on this device • cloud sync not confirmed');
  }finally{
    saveInProgress=false;
    if(initialDirty){initialDirty=false;queueSave()}
  }
}
function queueSave(){
  clearTimeout(syncTimer);
  formValues();
  persistLocal();
  saveIndicator('Draft saved locally');
  progress();
  syncTimer=setTimeout(()=>{void save(false,false)},900);
}
function viewReport(){
  formValues();
  const root=$('reportContent');root.replaceChildren();
  const make=(tag,className='',text='')=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text)node.textContent=text;
    return node;
  };
  const provided=id=>String(state.fields[id]||'').trim();
  const value=id=>provided(id)||'Not recorded';
  const cell=(label,content,tone,compact=false)=>{
    const section=make('section','worksheetCell '+tone+(compact?' compact':''));
    section.append(make('h3','',label));
    const body=make('div','worksheetValue'+(content==='Not recorded'?' empty':''));
    body.textContent=content;
    section.append(body);
    return section;
  };
  const board=make('div','mapWorksheet');
  board.setAttribute('aria-label','My Path Forward youth discovery worksheet');
  const intro=make('div','worksheetIntro');
  intro.append(make('div','worksheetAppendix','A.7 · MY PATH FORWARD'),make('div','worksheetTitle','MY PATH FORWARD'));
  board.append(intro);
  const chapter=make('div','worksheetChapter');
  chapter.append(make('div','chapterLabel','MY NEXT CHAPTER'));
  const chapterValue=make('div','chapterValue');
  chapterValue.append(make('small','','What would I like school, training, work, and life to look like?'));
  chapterValue.append(make('p',provided('nextChapter')?'':'empty',value('nextChapter')));
  chapter.append(chapterValue);board.append(chapter);
  const middle=make('div','worksheetMiddle');
  middle.append(
    cell('MY STORY',value('myStory'),'sky'),
    cell('WHERE I AM NOW',value('whereNow'),'sage'),
    cell('WHAT I BRING',value('strengths'),'sky'),
    cell('WHAT MOTIVATES ME',value('motivations'),'sage'),
    cell('PEOPLE & RESOURCES',value('resources'),'sage'),
    cell('SUPPORT I WANT TO DISCUSS',state.coachConversation?'☑ I would like to talk privately with my Career Coach.':'☐ No private conversation requested.','sky'),
    (()=>{const section=make('section','worksheetCell sage optionsCell');section.append(make('h3','','OPTIONS I WANT TO EXPLORE'));
      const list=make('div','worksheetOptions');
      for(const [key,label] of OPTIONS){
        list.append(make('span','worksheetOption'+(state.options.includes(key)?' checked':''),(state.options.includes(key)?'☑ ':'☐ ')+label));
      }
      section.append(list);return section;
    })(),
    cell('MY FUTURE VISION',value('futureVision'),'sky')
  );
  board.append(middle);
  const bottom=make('div','worksheetPlan');
  bottom.append(
    cell('ONE GOAL I CHOOSE NOW',value('goal'),'goal',true),
    cell('MY FIRST NEXT STEP',value('nextStep'),'step',true),
    cell('WHO WILL SUPPORT ME',value('support'),'support',true),
    cell('TARGET DATE',value('target'),'target',true),
    cell('READY 0–10',state.readiness===null?'—':state.readiness+' / 10','score',true)
  );
  board.append(bottom);
  const readiness=make('div','worksheetReadiness');
  readiness.append(make('h3','','HOW TO CHOOSE A READINESS SCORE'));
  const levels=make('div','readinessLevels');
  const descriptions=[
    ['0–2','Not ready now. Focus on trust, useful information, and immediate support.'],
    ['3–4','Unsure or mixed. Explore choices and what matters to me.'],
    ['5–6','Somewhat ready. Identify information, confidence, or support that would help.'],
    ['7–8','Ready with support. Name a next step and when to take it.'],
    ['9–10','Ready to act. Schedule the next step and follow through.']
  ];
  for(const [range,description] of descriptions){
    const selected=state.readiness!==null&&((range==='0–2'&&state.readiness<=2)||(range==='3–4'&&state.readiness>=3&&state.readiness<=4)||(range==='5–6'&&state.readiness>=5&&state.readiness<=6)||(range==='7–8'&&state.readiness>=7&&state.readiness<=8)||(range==='9–10'&&state.readiness>=9));
    const level=make('div','readinessLevel'+(selected?' current':''));
    level.append(make('strong','',range),make('p','',description));levels.append(level);
  }
  readiness.append(levels);
  readiness.append(make('p','readinessNote','There is no best or passing score. Readiness reflects how I feel about my next step today; it can change.'));
  board.append(readiness);
  board.append(make('p','worksheetDisclaimer','My Path Forward is a personal career-exploration reflection—not an eligibility determination, needs assessment, or service verification. Personal circumstances can be discussed privately with a Career Coach.'));
  root.append(board);
  $('report').hidden=false;
}
function build(){
  for(const def of FIELDS){
    const outer=document.createElement('div');outer.className='field'+(def.wide?' wide':'');
    const label=document.createElement('label');label.htmlFor=def.id;label.textContent=def.label;
    const hint=document.createElement('small');hint.textContent=def.hint;
    const details=document.createElement('details');details.className='example';
    const summary=document.createElement('summary');summary.textContent='Show me an example';
    const sample=document.createElement('p');sample.textContent=def.example;
    details.append(summary,sample);
    const input=def.kind==='text'?document.createElement('input'):document.createElement('textarea');
    input.id=def.id;input.name=def.id;if(def.kind==='text')input.type='text';
    input.maxLength=def.kind==='text'?120:700;
    input.placeholder=def.kind==='text'?'For example, within 30 days':'Use your own words. You may skip this field.';
    input.autocomplete='off';input.addEventListener('input',queueSave);
    outer.append(label,hint,details,input);$(def.group==='reflection'?'reflectionFields':def.group==='vision'?'visionFields':'planFields').append(outer);
  }
  for(const [key,label] of OPTIONS){
    const wrapper=document.createElement('label');wrapper.className='optionChoice';
    const input=document.createElement('input');input.type='checkbox';input.id='choice_'+key;input.value=key;input.addEventListener('change',queueSave);
    const title=document.createElement('span');title.textContent=label;
    wrapper.append(input,title);$('optionChoices').append(wrapper);
  }
  $('coachConversation').addEventListener('change',queueSave);
  $('readiness').addEventListener('input',()=>{state.readiness=Number($('readiness').value);queueSave()});
  $('clearReadiness').addEventListener('click',()=>{state.readiness=null;queueSave()});
  $('saveDraft').addEventListener('click',()=>{clearTimeout(syncTimer);void save(true,false)});
  $('finishActivity').addEventListener('click',async()=>{clearTimeout(syncTimer);await save(true,true);viewReport();$('report').scrollIntoView({behavior:'smooth',block:'start'})});
  $('printSummary').addEventListener('click',async()=>{clearTimeout(syncTimer);await save(true,false);viewReport();window.print()});
  $('pathForm').addEventListener('submit',e=>e.preventDefault());
}
async function init(){
  session=userSession();
  const regionOkay=permittedGeo();
  const completed=interestComplete();
  const allowed=regionOkay&&completed;
  $('gate').hidden=allowed;
  $('activity').hidden=!allowed;
  if(!allowed){
    $('gateTitle').textContent=!completed?'Start with Discover Me first':'My Path Forward is a Pinal optional activity';
    $('gateDetail').textContent=!completed?'Finish your 30 O*NET interest questions, then return here to explore My Path Forward. You can always continue to Explore Careers instead.':'This optional activity is available when Pinal is your selected workforce region or career geography. Your Discover Me results and Explore Careers remain available.';
    return;
  }
  build();
  const local=readJSON(localKey());
  state=sanitize(local||{});
  setForm();
  if(window.LevelUpCareerTreeSync?.load){
    const cloud=await window.LevelUpCareerTreeSync.load(MODULE_ID);
    const data=fromRow(cloud);
    if(data&&(!local||String(data.updatedAt||'')>String(local.updatedAt||''))){
      state=data;try{localStorage.setItem(localKey(),JSON.stringify(state))}catch(e){}
      setForm();
    }
  }
  loading=false;
  saveIndicator(state.updatedAt?'Saved draft loaded':'Start your path');
  if(state.completedAt){viewReport()}
}
void init();
})();
