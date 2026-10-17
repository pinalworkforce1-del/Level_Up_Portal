(()=>{
'use strict';
const CORE='career-quest-electrician-days123-v1';
const LEGACY='level-up-career-quest-electrician-days6-10-v1';
const FLAG='nativeLegacyMissionMigrationV1';

const PHASE_MAP={
  6:[0,1,1,3,2,4,5],
  7:[0,1,2,3,4,4,4],
  8:[0,1,2,3,4],
  9:[0,0,1,2,3,4],
 10:[0,0,1,2,3,4,5,6,6]
};

function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}

const core=read(CORE);
const legacy=read(LEGACY);
if(!core||!legacy||core[FLAG])return;

const day=Number(legacy.currentDay||legacy.day||0);
const step=Math.max(0,Number(legacy.step)||0);
if(day<6||day>10||step<=0)return;

const coreDay=Number(core.runtime?.day||core.day||0);
const corePhase=Math.max(0,Number(core.runtime?.phase??core.step)||0);
if(coreDay!==day||corePhase>0)return;

const map=PHASE_MAP[day]||[];
const phase=Math.max(0,Number(map[Math.min(step,map.length-1)])||0);
if(phase<=0)return;

core.runtime={day,phase};
core.day=day;
core.step=phase;
core[FLAG]={from:'legacy-wrapper-v1',legacyDay:day,legacyStep:step,nativePhase:phase,migratedAt:new Date().toISOString()};
write(CORE,core);
})();
