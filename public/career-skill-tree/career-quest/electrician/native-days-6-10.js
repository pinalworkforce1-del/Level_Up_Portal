(function(){
'use strict';

const DAY_MISSIONS={
  6:{
    title:'Rough-In',
    steps:[
      {target:'office',objective:'Review the rough-in blueprint at the site office',kind:'brief'},
      {target:'station',objective:'Lay out the run and verify the measurement',kind:'measure'},
      {target:'storage',objective:'Select the materials for the rough-in',kind:'materials'},
      {target:'station',objective:'Put the rough-in work in a safe sequence',kind:'sequence'},
      {target:'delivery',objective:'Inspect the box placement before the run continues',kind:'inspect'},
      {target:'mara',objective:'Return to Mara to close out the rough-in shift',kind:'finish'}
    ]
  },
  7:{
    title:'Troubleshooting',
    steps:[
      {target:'mara',objective:'Meet Mara for the troubleshooting briefing',kind:'brief'},
      {target:'station',objective:'Inspect the panel symptoms before testing',kind:'inspect'},
      {target:'station',objective:'Use the meter safely to test the circuit',kind:'meter'},
      {target:'storage',objective:'Isolate the most likely fault from the evidence',kind:'fault'},
      {target:'mara',objective:'Return to Mara and close out the troubleshooting shift',kind:'finish'}
    ]
  },
  8:{
    title:'Crew Coordination',
    steps:[
      {target:'mara',objective:'Join the crew briefing with Mara',kind:'brief'},
      {target:'station',objective:'Coordinate the shared-jobsite work sequence',kind:'sequence'},
      {target:'storage',objective:'Resolve a trade conflict before work continues',kind:'conflict'},
      {target:'luis',objective:'Check the communication decision with Luis',kind:'communication'},
      {target:'mara',objective:'Return to Mara to close out the crew shift',kind:'finish'}
    ]
  },
  9:{
    title:'Quality & Change',
    steps:[
      {target:'mara',objective:'Review the change request with Mara',kind:'brief'},
      {target:'delivery',objective:'Compare the changed requirement to the installed work',kind:'compare'},
      {target:'station',objective:'Complete the quality checks before sign-off',kind:'quality'},
      {target:'mara',objective:'Make the overtime and family-responsibility decision',kind:'life'},
      {target:'mara',objective:'Close out the quality and change shift',kind:'finish'}
    ]
  },
  10:{
    title:'Capstone',
    steps:[
      {target:'station',objective:'Select the right tools for the capstone assignment',kind:'tools'},
      {target:'office',objective:'Build the work sequence from the plan',kind:'sequence'},
      {target:'delivery',objective:'Complete the hazard scan before starting',kind:'hazards'},
      {target:'mara',objective:'Confirm the safest response to the jobsite condition',kind:'safety'},
      {target:'station',objective:'Troubleshoot the circuit using the evidence',kind:'fault'},
      {target:'station',objective:'Complete the final installation check',kind:'quality'},
      {target:'mara',objective:'Meet Mara for final supervisor feedback',kind:'finish'}
    ]
  }
};

function mission(day){return DAY_MISSIONS[Number(day)]||null}
function step(day,phase){const m=mission(day);return m?.steps[Math.min(Math.max(0,Number(phase)||0),m.steps.length-1)]||null}
function dayRecord(day){return Array.isArray(state.shiftDays)?state.shiftDays.find(x=>x.day===day&&x.completed):null}
function advanceNative(day,phase,note){
  if(note){try{mark(note)}catch{} try{log(note)}catch{}}
  setRuntime(day,phase+1,{persist:false});
  save();
  ui();
  hideTalk();
}
function score(day,key,value){
  state.nativeMissionResults=state.nativeMissionResults||{};
  state.nativeMissionResults[day]=state.nativeMissionResults[day]||{};
  state.nativeMissionResults[day][key]=value;
  save();
}
function finishNativeDay(day,feedback){
  if(dayRecord(day)){state.runtime=deriveRuntime(state);state.day=state.runtime.day;state.step=state.runtime.phase;save();ui();return}
  const disruption=typeof lifeState==='function'?lifeState().results.find(x=>x.day===day):null;
  const paidHours=disruption?Math.min(8,Math.max(0,disruption.paidHours)):8;
  const title=mission(day)?.title||`Day ${day}`;
  if(!Array.isArray(state.shiftDays))state.shiftDays=[];
  state.shiftDays.push({day,title,completed:true,choice:-1,choiceLabel:'Completed native 3D mission',feedback,paidHours,communication:2,safety:2,nativeMission:true,results:state.nativeMissionResults?.[day]||{}});
  mark(`Day ${day} complete • ${title}`);
  log(`Completed Day ${day}: ${title} — native 3D mission`);
  state.runtime=deriveRuntime(state);state.day=state.runtime.day;state.step=state.runtime.phase;
  save();
  try{updateEarnings()}catch{}
  ui();
  const next=day<10?`Day ${day+1}`:'Career Quest completion';
  popup(`DAY ${day} • SHIFT COMPLETE`,feedback,[[day<10?'Begin next workday':'Continue',''+(day<10?'': '')]],`<div class="score-summary"><p>Day ${day} paid hours: <strong>${paidHours} / 8</strong></p><p>Next: <strong>${next}</strong></p><p class="tiny">Your result has been saved in the same Career Quest progress record used by the earlier days.</p></div>`);
  const buttons=document.querySelectorAll('#popup button,.popup button,.modal button');
  const last=buttons[buttons.length-1];
  if(last)last.onclick=()=>{hideTalk();if(day<10){normalizeRuntime();ui();showCinematic();talk(`NOVA • DAY ${day+1}`,runtimeObjective(),[['Start shift',hideTalk]])}else{try{showRealPayday()}catch{}}};
}
function choose(title,body,choices){
  talk(title,body,choices.map(c=>[c[0],c[1]]));
  return true;
}
function right(day,phase,label,feedback,points=[1,1,1]){
  return ()=>{score(day,`phase${phase}`,{choice:label,correct:true});try{reward(...points)}catch{} answer('NOVA',feedback,()=>advanceNative(day,phase,`Day ${day} • ${label}`))};
}
function retry(day,phase,label,feedback){
  return ()=>{score(day,`phase${phase}`,{choice:label,correct:false});answer('NOVA',feedback,()=>{hideTalk();ui()})};
}

function handle6(p){
 if(p===0)return choose('MARA • FOREPERSON','Today you are roughing in a branch circuit. Start with the plan, then verify layout, materials, sequence, and box placement before anything gets covered.',[['Review the blueprint',right(6,p,'Blueprint reviewed','The plan gives you the route, device locations, and the work that must be verified before installation begins.')]]);
 if(p===1)return choose('DAY 6 • MEASUREMENT','The plan shows the device location. Your first mark does not line up with the reference point. What should you do?',[['Measure again from the plan reference',right(6,p,'Measurement verified','Correct. Rough-in accuracy starts by measuring from the same reference used on the plan.',[2,1,1])],['Split the difference and keep moving',retry(6,p,'Guessed at layout','A small layout guess can create visible rework later. Recheck from the plan reference.')]]);
 if(p===2)return choose('DAY 6 • MATERIALS','Which approach best prepares the rough-in?',[['Stage the specified boxes, cable/conduit, fittings, fasteners, and PPE',right(6,p,'Materials staged','You matched the materials to the plan before starting the run.',[1,1,2])],['Grab whatever is closest and substitute later',retry(6,p,'Unverified materials','Substitutions and missing fittings create delays. Match the material to the plan first.')]]);
 if(p===3)return choose('DAY 6 • WORK SEQUENCE','Choose the best sequence for this rough-in.',[['Verify plan → lay out → mount boxes → route/support raceway or cable → inspect',right(6,p,'Sequence confirmed','That sequence reduces rework and creates natural quality checkpoints.',[2,1,2])],['Route first → decide box locations later → inspect only if something looks wrong',retry(6,p,'Sequence needs review','Layout and box placement should be established before the run is committed.')]]);
 if(p===4)return choose('DAY 6 • BOX INSPECTION','One box is visibly out of alignment with the planned device line. What do you do?',[['Stop and correct it before the wall is closed',right(6,p,'Box inspection passed','Correcting it now protects quality and prevents expensive rework later.',[1,2,2])],['Leave it because the cover plate may hide it',retry(6,p,'Quality issue missed','Finish materials should not be used to hide a rough-in error. Correct the box now.')]]);
 finishNativeDay(6,'Mara: You worked from the plan, verified the layout, staged the right material, sequenced the work, and caught a quality issue before it became rework.');return true;
}
function handle7(p){
 if(p===0)return choose('MARA • FOREPERSON','A circuit is not operating as expected. Today is about troubleshooting without guessing: observe the symptom, make the condition safe, test deliberately, and let the evidence narrow the fault.',[['Start with the symptom and test plan',right(7,p,'Troubleshooting briefing','Good. The goal is to prove what is happening one step at a time.')]]);
 if(p===1)return choose('DAY 7 • PANEL INSPECTION','Before touching the meter leads, what is the best first move?',[['Inspect labeling, condition, and the known symptom without disturbing the circuit',right(7,p,'Panel inspection complete','Visual evidence and labeling help define the test before your hands enter the work area.',[1,2,1])],['Start moving conductors until the problem changes',retry(7,p,'Unsafe troubleshooting approach','Troubleshooting should not begin by disturbing unknown energized components.')]]);
 if(p===2)return choose('DAY 7 • METER TEST','What is the safest testing approach?',[['Confirm the meter and leads, select the correct function/range, verify the test method, then test at planned points',right(7,p,'Meter test complete','You used the meter as a diagnostic tool instead of as a guess detector.',[1,3,2])],['Touch probes to several points quickly and watch for any reading',retry(7,p,'Meter method needs review','Unplanned probing can create a serious hazard. Define the test and verify the meter first.')]]);
 if(p===3)return choose('DAY 7 • FAULT ISOLATION','Your tests show the source is present, but voltage is lost after one connection point. What does the evidence support?',[['Inspect that connection and the section immediately downstream',right(7,p,'Fault isolated','Exactly. The evidence narrowed the fault instead of sending you across the entire circuit.',[2,2,2])],['Replace the breaker because it is the easiest part to reach',retry(7,p,'Fault not supported by evidence','The test already showed source voltage present. Follow the evidence to the first point where the condition changes.')]]);
 finishNativeDay(7,'Mara: You inspected first, tested deliberately, and isolated the fault from evidence. That is troubleshooting—not parts swapping.');return true;
}
function handle8(p){
 if(p===0)return choose('MARA • FOREPERSON','Today several trades are sharing the same work area. Your technical task matters, but so does keeping the crew coordinated and the path clear for everyone.',[['Join the coordination briefing',right(8,p,'Crew briefing complete','You know the work sequence, who owns each area, and where conflicts are most likely.')]]);
 if(p===1)return choose('DAY 8 • SHARED JOBSITE','Another crew needs the same access point during your planned installation window. What is the best response?',[['Confirm priorities and sequence the work with the affected crew',right(8,p,'Shared sequence coordinated','You protected both schedules by making the conflict visible early.',[3,1,2])],['Start immediately so your trade gets there first',retry(8,p,'Coordination conflict','Competing for the same space creates delays and safety issues. Coordinate the sequence first.')]]);
 if(p===2)return choose('DAY 8 • TRADE CONFLICT','Material from another trade is blocking your planned route. What should you do?',[['Pause, identify the owner, and coordinate a safe resolution before moving anything',right(8,p,'Trade conflict resolved','You did not move another crew’s work or create a new hazard without coordination.',[2,2,2])],['Move it out of the way without telling anyone',retry(8,p,'Trade conflict escalated','Moving another trade’s material without coordination can damage work and create new hazards.')]]);
 if(p===3)return choose('LUIS • JOURNEYWORKER','A coworker asks you to leave your assigned task and help somewhere else. What do you say?',[['I can help—let me update the person I am working with so we do not leave this task uncovered.',right(8,p,'Communication decision','Luis: Exactly. Helping the crew includes keeping commitments visible.',[3,1,1])],['Sure—and leave without telling anyone',retry(8,p,'Communication gap','A good intention can still leave your original crew short-handed. Close the communication loop.')]]);
 finishNativeDay(8,'Mara: You treated coordination as part of the work. You communicated conflicts early, respected other trades, and kept commitments visible.');return true;
}
function handle9(p){
 if(p===0)return choose('MARA • FOREPERSON','We have an approved change. Do not rely on memory or assume the old layout still applies. Compare the new requirement to the installed work, identify the delta, then quality-check the correction.',[['Review the approved change',right(9,p,'Change request reviewed','You have a clear before-and-after requirement before touching the installation.')]]);
 if(p===1)return choose('DAY 9 • QUALITY COMPARISON','The revised plan moves a device and changes the routing. What should you compare?',[['Approved revision, existing installation, affected dimensions, and downstream impacts',right(9,p,'Change compared','You identified the full change instead of treating it as a single moved box.',[2,1,2])],['Only the new device location',retry(9,p,'Change comparison incomplete','A change can affect routing, supports, material, and adjacent work. Compare the whole impacted area.')]]);
 if(p===2)return choose('DAY 9 • QUALITY CHECK','Before sign-off, which check is strongest?',[['Verify location, support, workmanship, labeling/identification, and conformance to the revised plan',right(9,p,'Quality checks complete','Your check covers both the visible result and whether it matches the approved requirement.',[1,2,3])],['Look at it from a few feet away and sign off if it appears straight',retry(9,p,'Quality check incomplete','Appearance is only one part of quality. Verify the installation against the approved requirement.')]]);
 if(p===3)return choose('DAY 9 • LIFE HAPPENS','The crew can use voluntary overtime tonight, but you also have a family responsibility that cannot simply disappear. What is the most professional response?',[['Tell Mara early what you can realistically commit to and protect both obligations',right(9,p,'Life Happens decision','Clear, early communication lets the supervisor plan the work and lets you keep the commitment you make.',[3,1,1])],['Say yes now and hope the family issue works itself out',retry(9,p,'Commitment needs clarity','Overcommitting can create a second problem later. Communicate the constraint before the schedule is built around you.')]]);
 finishNativeDay(9,'Mara: You managed a real change without losing the quality standard, and you communicated a life constraint before it became a crew problem.');return true;
}
function handle10(p){
 if(p===0)return choose('DAY 10 • TOOL SELECTION','Your capstone begins at the workbench. Which setup is strongest?',[['Select only the tools, test equipment, PPE, and materials required by the plan',right(10,p,'Tools selected','A deliberate setup reduces clutter, missed equipment, and unnecessary trips.',[1,2,2])],['Bring every tool you can find just in case',retry(10,p,'Tool setup needs focus','More tools are not automatically better. Select what the task and test plan actually require.')]]);
 if(p===1)return choose('DAY 10 • WORK SEQUENCE','Build the capstone sequence.',[['Review plan → scan hazards → make safe → lay out/install → test → quality check → report',right(10,p,'Capstone sequence built','That sequence places safety and verification before production pressure.',[2,2,2])],['Install first → test later → check the plan if something fails',retry(10,p,'Sequence needs review','The capstone is testing your process, not just whether the finished work eventually functions.')]]);
 if(p===2)return choose('DAY 10 • HAZARD SCAN','You spot material narrowing the access route and an unverified electrical condition in the work area. What do you do?',[['Stop, control access, and resolve or escalate both hazards before starting',right(10,p,'Hazards controlled','You treated the scan as a work decision, not a checklist formality.',[1,3,2])],['Work around both conditions carefully',retry(10,p,'Hazards remain active','“Being careful” does not remove an uncontrolled hazard. Address the condition before work begins.')]]);
 if(p===3)return choose('MARA • FOREPERSON','Production is behind. Someone suggests skipping one verification step because the crew is experienced. Your call?',[['Keep the verification step and explain why it protects the crew and the installation',right(10,p,'Safety decision confirmed','Mara: Good. Experience does not cancel the control that prevents the error.',[2,3,2])],['Skip it this once to recover the schedule',retry(10,p,'Safety shortcut rejected','Schedule pressure is not a reason to remove a required control.')]]);
 if(p===4)return choose('DAY 10 • TROUBLESHOOTING','Your first functional check fails. What is the capstone response?',[['Return to the symptom, verify the test setup, and isolate the fault step by step',right(10,p,'Troubleshooting complete','You stayed evidence-based even after your own installation did not pass the first check.',[2,2,3])],['Change multiple things at once until it works',retry(10,p,'Troubleshooting method needs review','Multiple simultaneous changes destroy the evidence that tells you what actually fixed the problem.')]]);
 if(p===5)return choose('DAY 10 • FINAL INSTALLATION CHECK','The circuit now functions. What remains before you call it complete?',[['Complete the workmanship/quality check, confirm labels and condition, clean the area, and report completion',right(10,p,'Final installation verified','Function is necessary, but completion also includes quality, documentation, and leaving the work area ready for the next person.',[2,2,3])],['Nothing—if it works, the job is done',retry(10,p,'Final check still required','A functional circuit can still have workmanship, labeling, or housekeeping issues. Finish the whole job.')]]);
 finishNativeDay(10,'Mara: You completed the capstone the way a dependable electrician approaches work—plan first, control hazards, communicate, test from evidence, verify quality, and close the loop.');return true;
}

const handlers={6:handle6,7:handle7,8:handle8,9:handle9,10:handle10};
window.LevelUpElectricianMissionRegistry={
  maxPhase(day){const m=mission(day);return m?m.steps.length-1:0},
  objective(day,phase){return step(day,phase)?.objective||null},
  target(day,phase){return step(day,phase)?.target||null},
  interact(day,phase){const fn=handlers[Number(day)];return fn?fn(Number(phase)||0):false},
  missions:DAY_MISSIONS
};
})();
