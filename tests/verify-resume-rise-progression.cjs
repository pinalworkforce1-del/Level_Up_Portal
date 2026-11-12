const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'../public/career-tree-next/ready-2-work');
const vm=require('node:vm');
const sandbox={module:{exports:{}},globalThis:{}};
vm.runInNewContext(fs.readFileSync(path.join(dir,'resume-progression-policy.js'),'utf8'),sandbox);
const policy=sandbox.module.exports;
const make=(source,entry,valid=true)=>({version_data:{
 levelUpResumeCompletionSource:source,levelUpEntryPoint:entry,
 contact:{name:valid?'Test participant':''},
 bullets:[{bullet:'Coordinated school tournaments with fellow students.'}]
}});
const untagged=()=>{
 const x=make(undefined,undefined);
 delete x.version_data.levelUpResumeCompletionSource;
 delete x.version_data.levelUpEntryPoint;
 return x;
};
const legacy={...untagged(),created_at:'2026-11-07T20:31:10Z'};
const postCutoff={...untagged(),created_at:'2026-11-13T01:00:00Z'};
const missingTimestamp=untagged();
const district=make('resume-district','resume-district');
const tagged=make('resume-rise','ready-2-work');
const invalid=make('resume-rise','ready-2-work',false);
const row=(module_id,is_complete)=>({module_id,is_complete});
assert.equal(policy.resumeRiseComplete([],[]),false,'No evidence does not complete');
assert.equal(policy.resumeRiseComplete([],[legacy]),true,'Credible historical résumé retains previous Ready 2 Work eligibility');
assert.equal(policy.resumeRiseEvidence([],[legacy]),'historical','Historical résumé is not relabeled as confirmed Resume Rise');
assert.equal(policy.resumeRiseComplete([],[postCutoff]),false,'New untagged résumé cannot bypass source-aware rules');
assert.equal(policy.resumeRiseComplete([],[missingTimestamp]),false,'Missing creation timestamp cannot bypass source-aware rules');
assert.equal(policy.legacyEligible(legacy),true,'Historical cutoff is fixed and explicit');
assert.equal(policy.resumeRiseComplete([],[district]),false,'District résumé does not complete Ready 2 Work');
assert.equal(policy.resumeRiseComplete([], [{...district,created_at:'2026-10-23T01:20:00Z'}]),false,'Provenance-tagged Resume District version remains excluded even when old');
assert.equal(policy.resumeRiseComplete([],[invalid]),false,'Invalid draft does not complete Ready 2 Work');
assert.equal(policy.resumeRiseComplete([],[tagged]),true,'Completed Ready 2 Work résumé does complete');
assert.equal(policy.resumeRiseComplete([row('ready2work-resume-rise',true)],[]),true,'Participant-owned Resume Rise progress completes');
assert.equal(policy.resumeRiseComplete([row('resume-district',true)],[]),false,'District journey never completes Resume Rise');
assert.equal(policy.resumeRiseComplete([row('ready2work-resume-rise',false)],[]),false,'Incomplete Resume Rise progress is not sufficient');
assert.equal(policy.resumeRiseComplete([row('interview-arena',true)],[]),false,'Interview progress cannot complete résumé');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
assert.ok(html.indexOf('resume-progression-policy.js')<html.indexOf('app.js?v='),'Policy loaded before application');
assert.match(app,/LevelUpResumeProgression\?\.resumeRiseComplete\(rows,versions\)/);
assert.doesNotMatch(app,/state\.resumeBuilderCloudSaved===true/);
assert.doesNotMatch(app,/module_id=in\.\(resume-district,interview-arena\)/);
assert.match(app,/module_id=in\.\(ready2work-resume-rise,interview-arena\)/);
assert.match(app,/select=version_data,created_at/,'Historical eligibility requires immutable creation date');
const entry=fs.readFileSync(path.join(dir,'nova-studio-entry.js'),'utf8');
const stagingUrl='https://pinalworkforce1-del.github.io/Level-Up-Resume-Staging/?from=ready-2-work';
assert.ok(app.includes(stagingUrl),'Resume Rise primary launcher targets staged builder with explicit origin');
assert.ok(entry.includes(stagingUrl),'Resume Rise card launcher targets same staged builder');
assert.doesNotMatch(entry,/resume-builder-prototype\.html/,'No reconstructed builder in staged launch card');

console.log('PASS Resume Rise source isolation, grandfathered legacy eligibility, progress and load order');
