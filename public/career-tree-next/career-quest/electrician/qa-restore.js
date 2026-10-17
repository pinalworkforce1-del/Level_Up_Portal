(()=>{
'use strict';
const CORE='career-quest-electrician-days123-v1';
const BACKUP='career-quest-electrician-qa-backup-v1';
const backup=localStorage.getItem(BACKUP);
if(!backup)return;
try{
  JSON.parse(backup);
  localStorage.setItem(CORE,backup);
  localStorage.removeItem(BACKUP);
  sessionStorage.removeItem('career-quest-electrician-qa-active');
  console.info('[Career Quest QA] Restored participant progress.');
}catch(err){
  console.warn('[Career Quest QA] Backup restore skipped because the backup was invalid.',err);
}
})();
