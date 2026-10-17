(function(){
'use strict';

const MISSIONS={
  6:{title:'Rough-In',steps:[
    ['office','Review the rough-in blueprint at the site office'],
    ['station','Lay out the run and verify the measurement'],
    ['storage','Select the materials for the rough-in'],
    ['station','Put the rough-in work in a safe sequence'],
    ['delivery','Inspect the box placement before the run continues'],
    ['mara','Return to Mara to close out the rough-in shift']
  ]},
  7:{title:'Troubleshooting',steps:[
    ['mara','Meet Mara for the troubleshooting briefing'],
    ['station','Inspect the panel symptoms before testing'],
    ['station','Use the meter safely to test the circuit'],
    ['storage','Isolate the most likely fault from the evidence'],
    ['mara','Return to Mara and close out the troubleshooting shift']
  ]},
  8:{title:'Crew Coordination',steps:[
    ['mara','Join the crew briefing with Mara'],
    ['station','Coordinate the shared-jobsite work sequence'],
    ['storage','Resolve a trade conflict before work continues'],
    ['luis','Check the communication decision with Luis'],
    ['mara','Return to Mara to close out the crew shift']
  ]},
  9:{title:'Quality & Change',steps:[
    ['mara','Review the change request with Mara'],
    ['delivery','Compare the changed requirement to the installed work'],
    ['station','Complete the quality checks before sign-off'],
    ['mara','Make the overtime and family-responsibility decision'],
    ['mara','Close out the quality and change shift']
  ]},
 10:{title:'Capstone',steps:[
    ['station','Select the right tools for the capstone assignment'],
    ['office','Build the work sequence from the plan'],
    ['delivery','Complete the hazard scan before starting'],
    ['mara','Confirm the safest response to the jobsite condition'],
    ['station','Troubleshoot the circuit using the evidence'],
    ['station','Complete the final installation check'],
    ['mara','Meet Mara for final supervisor feedback']
  ]}
};

const getMission=day=>MISSIONS[Number(day)]||null;
const getStep=(day,phase)=>{
  const m=getMission(day); if(!m)return null;
  return m.steps[Math.min(Math.max(0,Number(phase)||0),m.steps.length-1)]||null;
};
const hasCompleted=day=>Array.isArray(state.shiftDays)&&state.shiftDays.some(x=>x.day===day&&x.completed);

function result(day,key,value){
  state.nativeMissionResults=state.nativeMissionResults||{};
  state.nativeMissionResults[day]=state.nativeMissionResults[day]||{};
  state.nativeMissionResults[day][key]=value;
  save();
}
function next(day,phase,note){
  if(note){try{mark(note)}catch{} try{log(note)}catch{}}
  setRuntime(day,phase+1,{persist:false}); save(); ui(); hideTalk();
}
function correct(day,phase,label,feedback,points=[1,1,1]){
  return ()=>{result(day,`phase${phase}`,{choice:label,correct:true});try{reward(...points)}catch{} answer('NOVA',feedback,()=>next(day,phase,`Day ${day} • ${label}`))};
}
function retry(day,phase,label,feedback){
  return ()=>{result(day,`phase${phase}`,{choice:label,correct:false});answer('NOVA',feedback,()=>{hideTalk();ui()})};
}
function choose(title,body,choices){talk(title,body,choices);return true}
function finish(day,feedback){
  if(hasCompleted(day)){state.runtime=deriveRuntime(state);state.day=state.runtime.day;state.step=state.runtime.phase;save();ui();return true}
  const disruption=typeof lifeState==='function'?lifeState().results.find(x=>x.day===day):null;
  const paidHours=disruption?Math.min(8,Math.max(0,disruption.paidHours)):8;
  const title=getMission(day)?.title||`Day ${day}`;
  state.shiftDays=Array.isArray(state.shiftDays)?state.shiftDays:[];
  state.shiftDays.push({day,title,completed:true,choice:-1,choiceLabel:'Completed native 3D mission',feedback,paidHours,communication:2,safety:2,nativeMission:true,results:state.nativeMissionResults?.[day]||{}});
  try{mark(`Day ${day} complete • ${title}`)}catch{}
  try{log(`Completed Day ${day}: ${title} — native 3D mission`)}catch{}
  state.runtime=deriveRuntime(state);state.day=state.runtime.day;state.step=state.runtime.phase;save();
  try{updateEarnings()}catch{} ui();
  const continueFn=()=>{
    hideTalk();
    if(day<10){normalizeRuntime();ui();showCinematic();talk(`NOVA • DAY ${day+1}`,`Day ${day+1} is active. ${runtimeObjective()}. Follow the gold marker and press E.`,[['Start shift',hideTalk]])}
    else{try{showRealPayday()}catch{}}
  };
  popup(`DAY ${day} • SHIFT COMPLETE`,feedback,[[day<10?'Begin next workday':'Continue',continueFn]],`<div class="score-summary"><p>Day ${day} paid hours: <strong>${paidHours} / 8</strong></p><p>Next: <strong>${day<10?`Day ${day+1}`:'Career Quest completion'}</strong></p><p class="tiny">Saved in the same Career Quest progress record used by the earlier days.</p></div>`);
  return true;
}

function d6(p){
 if(p===0)return choose('MARA • FOREPERSON','Today you are roughing in a branch circuit. Start with the plan, then verify layout, materials, sequence, and box placement before anything gets covered.',[['Review the blueprint',correct(6,p,'Blueprint reviewed','The plan gives you the route, device locations, and the work that must be verified before installation begins.')]]);
 if(p===1)return choose('DAY 6 • MEASUREMENT','Your first mark does not line up with the plan reference. What should you do?',[['Measure again from the plan reference',correct(6,p,'Measurement verified','Correct. Rough-in accuracy starts from the same reference used on the plan.',[2,1,1])],['Split the difference and keep moving',retry(6,p,'Guessed at layout','A small layout guess can create visible rework later. Recheck from the plan reference.')]]);
 if(p===2)return choose('DAY 6 • MATERIALS','Which setup best prepares the rough-in?',[['Stage the specified boxes, raceway/cable, fittings, fasteners, and PPE',correct(6,p,'Materials staged','You matched the materials to the plan before starting the run.',[1,1,2])],['Grab whatever is closest and substitute later',retry(6,p,'Unverified materials','Substitutions and missing fittings create delays. Match material to the plan first.')]]);
 if(p===3)return choose('DAY 6 • WORK SEQUENCE','Choose the best sequence.',[['Verify plan → lay out → mount boxes → route/support → inspect',correct(6,p,'Sequence confirmed','That sequence reduces rework and creates natural quality checkpoints.',[2,1,2])],['Route first → choose box locations later → inspect only if needed',retry(6,p,'Sequence needs review','Layout and box placement should be established before the run is committed.')]]);
 if(p===4)return choose('DAY 6 • BOX INSPECTION','One box is visibly out of alignment. What do you do?',[['Stop and correct it before the wall is closed',correct(6,p,'Box inspection passed','Correcting it now protects quality and prevents expensive rework later.',[1,2,2])],['Leave it because a cover plate may hide it',retry(6,p,'Quality issue missed','Finish materials should not hide a rough-in error. Correct the box now.')]]);
 return finish(6,'Mara: You worked from the plan, verified layout, staged the right material, sequenced the work, and caught a quality issue before it became rework.');
}
function d7(p){
 if(p===0)return choose('MARA • FOREPERSON','A circuit is not operating as expected. Today is about troubleshooting without guessing: observe, make the condition safe, test deliberately, and let the evidence narrow the fault.',[['Start with the symptom and test plan',correct(7,p,'Troubleshooting briefing','Good. Prove what is happening one step at a time.')]]);
 if(p===1)return choose('DAY 7 • PANEL INSPECTION','Before using the meter, what is the best first move?',[['Inspect labeling, condition, and the known symptom without disturbing the circuit',correct(7,p,'Panel inspection complete','Visual evidence and labeling define the test before your hands enter the work area.',[1,2,1])],['Move conductors until the problem changes',retry(7,p,'Unsafe troubleshooting approach','Do not begin by disturbing unknown energized components.')]]);
 if(p===2)return choose('DAY 7 • METER TEST','What is the safest testing approach?',[['Confirm meter/leads, select the correct function/range, verify the method, then test planned points',correct(7,p,'Meter test complete','You used the meter as a diagnostic tool instead of a guess detector.',[1,3,2])],['Probe several points quickly and watch for any reading',retry(7,p,'Meter method needs review','Unplanned probing can create a serious hazard. Define the test first.')]]);
 if(p===3)return choose('DAY 7 • FAULT ISOLATION','Source voltage is present, but it is lost after one connection point. What does the evidence support?',[['Inspect that connection and the section immediately downstream',correct(7,p,'Fault isolated','Exactly. The evidence narrowed the fault.',[2,2,2])],['Replace the breaker because it is easiest to reach',retry(7,p,'Fault not supported by evidence','The test already showed source voltage present. Follow the evidence to where the condition changes.')]]);
 return finish(7,'Mara: You inspected first, tested deliberately, and isolated the fault from evidence. That is troubleshooting—not parts swapping.');
}
function d8(p){
 if(p===0)return choose('MARA • FOREPERSON','Several trades are sharing the same work area today. Your technical task matters, but so does keeping the crew coordinated and access clear.',[['Join the coordination briefing',correct(8,p,'Crew briefing complete','You know the work sequence, ownership, and likely conflicts.')]]);
 if(p===1)return choose('DAY 8 • SHARED JOBSITE','Another crew needs the same access point during your installation window. Best response?',[['Confirm priorities and sequence the work with the affected crew',correct(8,p,'Shared sequence coordinated','You protected both schedules by making the conflict visible early.',[3,1,2])],['Start immediately so your trade gets there first',retry(8,p,'Coordination conflict','Competing for the same space creates delay and risk. Coordinate first.')]]);
 if(p===2)return choose('DAY 8 • TRADE CONFLICT','Another trade’s material blocks your route. What should you do?',[['Pause, identify the owner, and coordinate a safe resolution before moving anything',correct(8,p,'Trade conflict resolved','You respected the other trade’s work and kept the resolution visible.',[2,2,2])],['Move it without telling anyone',retry(8,p,'Trade conflict escalated','Moving another trade’s material can damage work and create new hazards.')]]);
 if(p===3)return choose('LUIS • JOURNEYWORKER','A coworker asks you to leave your assigned task to help elsewhere. What do you say?',[['I can help—let me update the person I am working with so this task is not left uncovered.',correct(8,p,'Communication decision','Luis: Exactly. Helping the crew includes keeping commitments visible.',[3,1,1])],['Sure—and leave without telling anyone',retry(8,p,'Communication gap','Close the communication loop before switching tasks.')]]);
 return finish(8,'Mara: You treated coordination as part of the work. You communicated conflicts early, respected other trades, and kept commitments visible.');
}
function d9(p){
 if(p===0)return choose('MARA • FOREPERSON','We have an approved change. Compare the new requirement to the installed work, identify the delta, then quality-check the correction.',[['Review the approved change',correct(9,p,'Change request reviewed','You have a clear before-and-after requirement before touching the installation.')]]);
 if(p===1)return choose('DAY 9 • QUALITY COMPARISON','The revision moves a device and changes routing. What should you compare?',[['Approved revision, existing installation, affected dimensions, and downstream impacts',correct(9,p,'Change compared','You identified the full change instead of treating it as one moved box.',[2,1,2])],['Only the new device location',retry(9,p,'Change comparison incomplete','A change can affect routing, supports, material, and adjacent work.')]]);
 if(p===2)return choose('DAY 9 • QUALITY CHECK','Before sign-off, which check is strongest?',[['Verify location, support, workmanship, identification, and conformance to the revision',correct(9,p,'Quality checks complete','Your check covers the visible result and the approved requirement.',[1,2,3])],['Look at it from a few feet away and sign off if it appears straight',retry(9,p,'Quality check incomplete','Appearance is only one part of quality. Verify against the approved requirement.')]]);
 if(p===3)return choose('DAY 9 • LIFE HAPPENS','Voluntary overtime is available, but you also have a family responsibility. Most professional response?',[['Tell Mara early what you can realistically commit to and protect both obligations',correct(9,p,'Life Happens decision','Clear, early communication lets the supervisor plan and lets you keep your commitment.',[3,1,1])],['Say yes now and hope the family issue works itself out',retry(9,p,'Commitment needs clarity','Communicate the constraint before the schedule is built around you.')]]);
 return finish(9,'Mara: You managed a real change without losing the quality standard, and you communicated a life constraint before it became a crew problem.');
}
function d10(p){
 if(p===0)return choose('DAY 10 • TOOL SELECTION','Your capstone begins at the workbench. Which setup is strongest?',[['Select only the tools, test equipment, PPE, and materials required by the plan',correct(10,p,'Tools selected','A deliberate setup reduces clutter and missed equipment.',[1,2,2])],['Bring every tool you can find just in case',retry(10,p,'Tool setup needs focus','Select what the task and test plan actually require.')]]);
 if(p===1)return choose('DAY 10 • WORK SEQUENCE','Build the capstone sequence.',[['Review plan → scan hazards → make safe → lay out/install → test → quality check → report',correct(10,p,'Capstone sequence built','Safety and verification come before production pressure.',[2,2,2])],['Install first → test later → check the plan if something fails',retry(10,p,'Sequence needs review','The capstone tests your process, not just the final outcome.')]]);
 if(p===2)return choose('DAY 10 • HAZARD SCAN','Material narrows access and an electrical condition is unverified. What do you do?',[['Stop, control access, and resolve or escalate both hazards before starting',correct(10,p,'Hazards controlled','You treated the scan as a work decision, not a checklist formality.',[1,3,2])],['Work around both conditions carefully',retry(10,p,'Hazards remain active','Being careful does not remove an uncontrolled hazard.')]]);
 if(p===3)return choose('MARA • FOREPERSON','Production is behind. Someone suggests skipping one verification step. Your call?',[['Keep the verification step and explain why it protects the crew and installation',correct(10,p,'Safety decision confirmed','Mara: Good. Experience does not cancel the control.',[2,3,2])],['Skip it this once to recover the schedule',retry(10,p,'Safety shortcut rejected','Schedule pressure is not a reason to remove a required control.')]]);
 if(p===4)return choose('DAY 10 • TROUBLESHOOTING','Your first functional check fails. What is the capstone response?',[['Return to the symptom, verify the test setup, and isolate the fault step by step',correct(10,p,'Troubleshooting complete','You stayed evidence-based even after your own installation failed its first check.',[2,2,3])],['Change multiple things at once until it works',retry(10,p,'Troubleshooting method needs review','Multiple simultaneous changes destroy the evidence.')]]);
 if(p===5)return choose('DAY 10 • FINAL INSTALLATION CHECK','The circuit now functions. What remains?',[['Complete workmanship/quality checks, confirm identification, clean the area, and report completion',correct(10,p,'Final installation verified','Function is necessary, but completion also includes quality and closeout.',[2,2,3])],['Nothing—if it works, the job is done',retry(10,p,'Final check still required','A functional circuit can still have workmanship, labeling, or housekeeping issues.')]]);
 return finish(10,'Mara: You completed the capstone the way a dependable electrician approaches work—plan first, control hazards, communicate, test from evidence, verify quality, and close the loop.');
}

const handlers={6:d6,7:d7,8:d8,9:d9,10:d10};
window.LevelUpElectricianMissionRegistry={
  maxPhase(day){const m=getMission(day);return m?m.steps.length-1:0},
  objective(day,phase){return getStep(day,phase)?.[1]||null},
  target(day,phase){return getStep(day,phase)?.[0]||null},
  interact(day,phase){const fn=handlers[Number(day)];return fn?fn(Number(phase)||0):false},
  missions:MISSIONS
};
})();
