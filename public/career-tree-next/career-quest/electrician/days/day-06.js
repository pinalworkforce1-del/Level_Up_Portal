export default {
  day:6,
  title:'Rough-In',
  subtitle:'Read It, Lay It Out, Build It Right',
  steps:[
    {id:'d6-start',label:'Start Day 6',target:'day6-start',activity:{type:'brief'}},
    {id:'d6-plan',label:'Blueprint / Plan',target:'day6-plan',activity:{type:'plan-match',asset:'assets/cq-electrician-d06-roughin-blueprint.webp'}},
    {id:'d6-layout',label:'Measurement & Layout',target:'day6-layout',activity:{type:'measurement',asset:'assets/cq-common-measurement-overlay.webp'}},
    {id:'d6-materials',label:'Materials',target:'day6-materials',activity:{type:'material-select',asset:'assets/cq-electrician-d06-materials.webp'}},
    {id:'d6-sequence',label:'Work Sequence',target:'day6-sequence',activity:{type:'sequence',asset:'assets/cq-common-sequence-board.webp',reveal:'assets/cq-common-sequence-board-reveal.webp'}},
    {id:'d6-box',label:'Box / Rough-In Check',target:'day6-box',activity:{type:'inspection',asset:'assets/cq-electrician-d06-box-fill-closeup.webp'}},
    {id:'d6-close',label:'Shift Complete',target:'day6-closeout',activity:{type:'shift-summary'}}
  ]
};
