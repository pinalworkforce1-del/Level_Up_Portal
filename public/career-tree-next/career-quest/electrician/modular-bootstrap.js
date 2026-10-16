import {controller} from './engine/controller.js';
import {days,getDay} from './days/index.js';
import {navigation} from './engine/navigation.js';
import {activities} from './engine/activities.js';
import {snapshot} from './engine/state.js';

// Days 6-10 now use the modular navigation controller.
// The 3D worksite remains the primary experience; this layer only manages objective markers.
controller.start({passive:false});

const retry=setInterval(()=>{
  const state=snapshot();
  if(state.day<6||state.day>10)return;
  const step=controller.current();
  if(step)navigation.refresh(step);
},900);

window.addEventListener('beforeunload',()=>clearInterval(retry),{once:true});

window.CareerQuestModular={
  controller,
  navigation,
  activities,
  days,
  getDay,
  snapshot,
  version:'2026-10-16-navigation-1',
  passive:false
};

window.dispatchEvent(new CustomEvent('cq:modular-ready',{detail:{version:window.CareerQuestModular.version,passive:false}}));
