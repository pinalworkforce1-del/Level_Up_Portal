(()=>{
'use strict';
const MODULE_ID='my-path-forward';
const LOCAL_PREFIX='levelup-my-path-forward-v1';
const PLAN_PROMPTS=[
  {id:'direction',label:'Career direction',question:'Where are you with choosing a career direction?',choices:['I am exploring possibilities','I have a few directions in mind','I have one direction I want to explore next']},
  {id:'strengths',label:'Strengths and interests',question:'How well can you describe the strengths or interests you could build on?',choices:['I am still discovering them','I can name one or two','I can name strengths or interests that connect to my goals']},
  {id:'goal',label:'A goal I can work toward',question:'How clear is the goal you want to work toward?',choices:['I am not sure yet','I have a general goal','I have a specific goal I can explain']},
  {id:'action',label:'My first action',question:'What does your first step look like?',choices:['I need help identifying a step','I have an idea of what to do','I can name an action I could take']},
  {id:'timeframe',label:'My time frame',question:'Have you considered when to begin?',choices:['Not yet','I have a general time in mind','I have a realistic time frame for my first step']}
];
const READINESS_SUPPORTS=[
 ['career_info','Learn more about career options'],['action_plan','Make a clearer action plan'],
 ['training','Explore training or work experience'],['coach','Talk with my Career Coach'],
 ['ready','I feel ready to take action']
];
const INTEREST_KEY='level-up-career-skill-tree-v1';
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
const EMPTY=()=>({version:2,fields:{},options:[],readiness:null,planResponses:{},readinessSupports:[],readinessHistory:[],coachConversation:false,completedAt:null,updatedAt:null});
let state=EMPTY(),session=null,syncTimer=null,saveInProgress=false,lastEdit=0,loading=true,initialDirty=false;
const txt=(value)=>String(value??'').slice(0,1500);
function readJSON(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function userSession(){try{
  const raw=readJSON(ACCOUNT_KEY),value=raw?.currentSession||raw?.session||raw;
  return value?.access_token&&value?.user?.id?value:null
}catch{return null}}
function localKey(){return LOCAL_PREFIX+':'+(session?.user?.id||'guest')}
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
  if(data.planResponses&&typeof data.planResponses==='object')for(const prompt of PLAN_PROMPTS){
    const value=data.planResponses[prompt.id];
    if(Number.isInteger(value)&&value>=0&&value<=2)next.planResponses[prompt.id]=value;
  }
  next.readinessSupports=Array.isArray(data.readinessSupports)?data.readinessSupports.filter(v=>READINESS_SUPPORTS.some(([key])=>v===key)):[];
  next.readinessHistory=Array.isArray(data.readinessHistory)?data.readinessHistory.slice(-20).map(v=>({
    at:typeof v?.at==='string'?v.at:null,
    selfRating:Number.isInteger(v?.selfRating)&&v.selfRating>=0&&v.selfRating<=10?v.selfRating:null,
    planResponses:Object.fromEntries(PLAN_PROMPTS.filter(p=>Number.isInteger(v?.planResponses?.[p.id])&&v.planResponses[p.id]>=0&&v.planResponses[p.id]<=2).map(p=>[p.id,v.planResponses[p.id]]))
  })).filter(v=>v.at):[];
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
  const planCount=PLAN_PROMPTS.filter(p=>Number.isInteger(state.planResponses[p.id])).length;
  const count=filled+(state.options.length?1:0)+(state.readiness!==null?1:0)+planCount+(state.readinessSupports.length?1:0);
  const total=FIELDS.length+2+PLAN_PROMPTS.length+1;
  $('progressLabel').textContent=count+' of '+total+' optional prompts filled';
  $('progressFill').style.width=String(count/total*100)+'%';
  const reflectionText=$('reflectionSummary');
  if(reflectionText){
    const count=PLAN_PROMPTS.filter(p=>Number.isInteger(state.planResponses[p.id])).length;
    reflectionText.textContent=count===5?'You have reflected on all five planning questions. Your Career Coach can use these responses to help you identify a next step.':count?count+' of 5 planning reflections answered. You may skip any question.':'Choose the statements that best reflect where you are today. This is not a test.';
  }
  $('readinessValue').textContent=state.readiness===null?'Not selected':state.readiness+' / 10';
  $('readiness').value=String(state.readiness??5);
  $('clearReadiness').hidden=state.readiness===null;
  $('lastSaved').textContent=state.completedAt?'Completed '+new Date(state.completedAt).toLocaleDateString():'Save as a draft whenever you like.';
}
function formValues(){
  for(const def of FIELDS)state.fields[def.id]=txt($(def.id).value.trim());
  state.options=OPTIONS.filter(([key])=>$('choice_'+key).checked).map(([key])=>key);
  state.coachConversation=$('coachConversation').checked;
  for(const prompt of PLAN_PROMPTS){
    const selected=document.querySelector('input[name="plan_'+prompt.id+'"]:checked');
    if(selected)state.planResponses[prompt.id]=Number(selected.value);
    else delete state.planResponses[prompt.id];
  }
  state.readinessSupports=READINESS_SUPPORTS.filter(([key])=>$('support_'+key)?.checked).map(([key])=>key);
}
function setForm(){
  for(const def of FIELDS)$(def.id).value=state.fields[def.id]||'';
  for(const [key] of OPTIONS)$('choice_'+key).checked=state.options.includes(key);
  $('coachConversation').checked=Boolean(state.coachConversation);
  for(const prompt of PLAN_PROMPTS){
    for(let value=0;value<=2;value++){
      const input=$('plan_'+prompt.id+'_'+value);
      if(input)input.checked=state.planResponses[prompt.id]===value;
    }
  }
  for(const [key] of READINESS_SUPPORTS){const input=$('support_'+key);if(input)input.checked=state.readinessSupports.includes(key)}
  progress();
}
async function save(showMessage=false,complete=false){
  if(loading)return;
  formValues();
  if(complete){
    if(!state.completedAt)state.completedAt=new Date().toISOString();
    const snapshot={at:new Date().toISOString(),selfRating:state.readiness,planResponses:{...state.planResponses}};
    const previous=state.readinessHistory[state.readinessHistory.length-1];
    if(!previous||JSON.stringify([previous.selfRating,previous.planResponses])!==JSON.stringify([snapshot.selfRating,snapshot.planResponses])){
      state.readinessHistory=[...state.readinessHistory,snapshot].slice(-20);
    }
  }
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
  board.setAttribute('aria-label','My Path Forward career discovery worksheet');
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
  const promptRoot=$('planReadinessQuestions');
  for(const prompt of PLAN_PROMPTS){
    const fieldset=document.createElement('fieldset');fieldset.className='readinessPrompt';
    const legend=document.createElement('legend');legend.textContent=prompt.question;fieldset.append(legend);
    const choices=document.createElement('div');choices.className='readinessChoices';
    prompt.choices.forEach((choice,idx)=>{
      const label=document.createElement('label');label.className='readinessChoice';
      const input=document.createElement('input');input.type='radio';input.name='plan_'+prompt.id;input.id='plan_'+prompt.id+'_'+idx;input.value=String(idx);input.addEventListener('change',queueSave);
      const span=document.createElement('span');span.textContent=choice;label.append(input,span);choices.append(label);
    });fieldset.append(choices);promptRoot.append(fieldset);
  }
  const supportRoot=$('readinessSupportChoices');
  for(const [key,label] of READINESS_SUPPORTS){
    const wrapper=document.createElement('label');wrapper.className='optionChoice';
    const input=document.createElement('input');input.type='checkbox';input.id='support_'+key;input.addEventListener('change',queueSave);
    const caption=document.createElement('span');caption.textContent=label;
    wrapper.append(input,caption);supportRoot.append(wrapper);
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
  const completed=interestComplete();
  // O*NET completion is the only activity prerequisite; geography is never a gate.
  const allowed=completed;
  $('gate').hidden=allowed;
  $('activity').hidden=!allowed;
  if(!allowed){
    $('gateTitle').textContent='Start with Discover Me first';
    $('gateDetail').textContent='Finish your 30 O*NET interest questions, then return here to explore My Path Forward. You can also continue directly to Explore Careers.';
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
