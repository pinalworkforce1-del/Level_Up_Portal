import {controller} from './engine/controller.js';
import {days,getDay} from './days/index.js';
import {navigation} from './engine/navigation.js';
import {activities} from './engine/activities.js';
import {snapshot} from './engine/state.js';

// Migration mode: observe the live monolith without changing gameplay.
controller.start({passive:true});

window.CareerQuestModular={
  controller,
  navigation,
  activities,
  days,
  getDay,
  snapshot,
  version:'2026-10-16-migration-1',
  passive:true
};

window.dispatchEvent(new CustomEvent('cq:modular-ready',{detail:{version:window.CareerQuestModular.version,passive:true}}));
