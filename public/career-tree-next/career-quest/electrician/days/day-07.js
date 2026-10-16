export default {
  day:7,
  title:'Speak Up / Troubleshooting',
  subtitle:'Follow the Evidence',
  steps:[
    {id:'d7-start',label:'Start Day 7',target:'day7-start',activity:{type:'brief'}},
    {id:'d7-mara',label:'Mara • Foreperson',target:'mara',activity:{type:'dialogue'}},
    {id:'d7-panel',label:'Panel Inspection',target:'day7-panel',activity:{type:'inspection',asset:'assets/cq-electrician-d07-panel-inspection.webp'}},
    {id:'d7-meter',label:'Meter Test',target:'day7-meter',activity:{type:'meter',asset:'assets/cq-electrician-d07-meter-reading.webp'}},
    {id:'d7-fault',label:'Fault Location',target:'day7-fault',activity:{type:'sequence',asset:'assets/cq-electrician-d07-fault-location.webp'}},
    {id:'d7-life',label:'Life Happens • Low Fuel',target:'day7-vehicle',activity:{type:'life-event',asset:'assets/cq-common-life-event-car.webp'}},
    {id:'d7-close',label:'Shift Complete',target:'day7-closeout',activity:{type:'shift-summary'}}
  ]
};
