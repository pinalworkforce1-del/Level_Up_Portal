import assert from "node:assert/strict";
import { buildCoachingGuidance } from "../supabase/functions/career-tree-coach-detail/coaching-guidance.ts";
const measurements=[
  {key:"direction",value:1},{key:"strengths",value:1},{key:"goal",value:2},
  {key:"action",value:2},{key:"timeframe",value:2}
];
const testParticipant={
  fields:{
    nextChapter:"I want to earn my GED and begin a meaningful career",
    myStory:"I like working with tools",
    strengths:"Leadership, team player, dependable",
    motivations:"Building things, I like to design and build",
    futureVision:"Work full time in HVAC or building maintenance and earn a recognized credential.",
    goal:"Sign up for my GED",nextStep:"Complete this.",target:"Next week"
  },
  options:["diploma","wex","training"],
  readinessSupports:["career_info","action_plan","training","ready"],
  coachConversation:true
};
const result=buildCoachingGuidance(testParticipant,8,9,measurements);
assert.equal(result.action_specificity.needs_clarification,true);
assert.match(result.action_specificity.suggested_prompt,/Sign up for my GED/);
assert.equal(result.suggested_coaching_priorities.length,3);
assert.deepEqual(result.suggested_coaching_priorities.map(x=>x.id),
 ["make-action-specific","explore-career-direction","private-conversation"]);
assert.match(result.suggested_coaching_priorities[0].detail,/Next week/);
assert.match(result.suggested_coaching_priorities[1].detail,/HVAC/);
assert.equal(result.talking_points[0],"You requested a private conversation. What would you like to discuss today?");
assert.ok(result.talking_points.some(q=>q.includes("HVAC")));
assert.ok(result.talking_points.some(q=>q.includes("Sign up for my GED")));
assert.ok(result.talking_points.every(q=>!q.includes("housing needs")&&!q.includes("legal trouble")));
const clear=buildCoachingGuidance({fields:{goal:"Apply to HVAC training",nextStep:"Call the school admissions office",target:"Next week"},options:[]},7,7,measurements);
assert.equal(clear.action_specificity.needs_clarification,false);
assert.notEqual(clear.suggested_coaching_priorities[0].id,"make-action-specific");
assert.equal(buildCoachingGuidance({fields:{nextStep:"Do this"}},null,null,measurements).action_specificity.needs_clarification,true);
assert.equal(buildCoachingGuidance({fields:{nextStep:"Call GED office"}},null,null,measurements).action_specificity.needs_clarification,false);
const minimal=buildCoachingGuidance({fields:{},coachConversation:false},null,null,[]);
assert.ok(minimal.talking_points.length>=1);
assert.ok(minimal.suggested_coaching_priorities.length>=1);
assert.ok(result.suggested_coaching_priorities.every(p=>p.detail&&!p.detail.includes("unemployed")&&!p.detail.includes("dropped out")));
console.log("PASS: grounded questions, priority order, specific-action prompts, privacy, and minimal responses");
