const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'../public/career-tree-next/ready-2-work');
const policy=require(path.join(dir,'resume-progression-policy.js'));
const make=(source,entry,valid=true)=>({version_data:{
 levelUpResumeCompletionSource:source,levelUpEntryPoint:entry,
 contact:{name:valid?'Test participant':''},
 bullets:[{bullet:'Coordinated school tournaments with fellow students.'}]
}});
const legacy=make(undefined,undefined);
const district=make('resume-district','resume-district');
const tagged=make('resume-rise','ready-2-work');
const invalid=make('resume-rise','ready-2-work',false);
const row=(module_id,is_complete)=>({module_id,is_complete});
assert.equal(policy.resumeRiseComplete([],[]),false,'No evidence does not complete');
assert.equal(policy.resumeRiseComplete([],[legacy]),false,'Legacy untagged résumé does not auto-complete Ready 2 Work');
assert.equal(policy.resumeRiseComplete([],[district]),false,'District résumé does not complete Ready 2 Work');
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
console.log('PASS Resume Rise source isolation, legacy exclusion, progress and load order');
