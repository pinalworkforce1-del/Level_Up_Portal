export default {
  day:10,
  title:'Capstone',
  subtitle:'Prove You’re Ready',
  steps:[
    {id:'d10-start',label:'Start Day 10',target:'day10-start',activity:{type:'brief'}},
    {id:'d10-tools',label:'Tool Kit',target:'day10-tools',activity:{type:'tool-select',asset:'assets/cq-common-tool-match.webp'}},
    {id:'d10-sequence',label:'Work Sequence',target:'day10-sequence',activity:{type:'sequence',asset:'assets/cq-electrician-d10-capstone-worksite.webp'}},
    {id:'d10-hazards',label:'Hazard Scan',target:'day10-hazard-scan',activity:{type:'hazard-scan',asset:'assets/cq-common-hazard-scan.webp',reveal:'assets/cq-common-hazard-scan-reveal.webp'}},
    {id:'d10-safety',label:'Safety Decision',target:'day10-safety',activity:{type:'decision',asset:'assets/cq-common-hazard-scan-reveal.webp'}},
    {id:'d10-troubleshoot',label:'Final Troubleshoot',target:'day10-troubleshoot',activity:{type:'meter',asset:'assets/cq-electrician-d07-meter-reading.webp'}},
    {id:'d10-closeout',label:'Installation Closeout',target:'day10-closeout',activity:{type:'inspection',asset:'assets/cq-electrician-d10-completed-install.webp'}},
    {id:'d10-feedback',label:'Supervisor Feedback',target:'day10-supervisor',activity:{type:'completion',asset:'assets/cq-electrician-d10-supervisor-feedback.webp'}}
  ]
};
