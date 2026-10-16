export default {
  day:8,
  title:'Crew Coordination',
  subtitle:'Your Work Affects Everyone',
  steps:[
    {id:'d8-start',label:'Start Day 8',target:'day8-start',activity:{type:'brief'}},
    {id:'d8-assign',label:'Crew Assignment',target:'day8-crew',activity:{type:'dialogue'}},
    {id:'d8-sequence',label:'Shared Jobsite Sequence',target:'day8-shared-jobsite',activity:{type:'sequence',asset:'assets/cq-electrician-d08-shared-jobsite.webp'}},
    {id:'d8-conflict',label:'Trade Conflict',target:'day8-trade-conflict',activity:{type:'decision',asset:'assets/cq-electrician-d08-trade-conflict.webp'}},
    {id:'d8-communicate',label:'Communication Decision',target:'day8-communication',activity:{type:'decision',asset:'assets/cq-electrician-d08-trade-conflict.webp'}},
    {id:'d8-close',label:'Shift Complete',target:'day8-closeout',activity:{type:'shift-summary'}}
  ]
};
