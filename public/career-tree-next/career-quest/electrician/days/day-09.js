export default {
  day:9,
  title:'Quality & Change',
  subtitle:'Do Not Let Rework Become Sloppy Work',
  steps:[
    {id:'d9-start',label:'Start Day 9',target:'day9-start',activity:{type:'brief'}},
    {id:'d9-change',label:'Change Request',target:'day9-change-request',activity:{type:'decision',asset:'assets/cq-electrician-d09-change-request.webp'}},
    {id:'d9-compare',label:'Quality Compare',target:'day9-quality-compare',activity:{type:'compare',asset:'assets/cq-common-quality-compare.webp',reveal:'assets/cq-common-quality-compare-reveal.webp'}},
    {id:'d9-check',label:'Quality Check',target:'day9-quality-check',activity:{type:'inspection',asset:'assets/cq-electrician-d09-quality-check.webp'}},
    {id:'d9-life',label:'Life Happens • Overtime / Family',target:'day9-life-event',activity:{type:'life-event',asset:'assets/cq-common-life-event-budget.webp'}},
    {id:'d9-close',label:'Shift Complete',target:'day9-closeout',activity:{type:'shift-summary'}}
  ]
};
