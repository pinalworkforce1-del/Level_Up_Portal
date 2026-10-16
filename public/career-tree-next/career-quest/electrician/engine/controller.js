import {watch} from './state.js';
import {getDay} from '../days/index.js';
import {navigation} from './navigation.js';

export class CareerQuestController{
  constructor(){
    this.currentDay=0;
    this.currentStepIndex=0;
    this.currentConfig=null;
    this.stopWatch=null;
    this.passive=true;
  }

  start({passive=true}={}){
    this.passive=passive;
    this.stopWatch?.();
    this.stopWatch=watch(state=>this.sync(state));
    return this;
  }

  stop(){this.stopWatch?.();this.stopWatch=null;navigation.clear();}

  sync(state){
    const config=getDay(state.day);
    this.currentDay=state.day;
    this.currentConfig=config;
    if(!config)return;

    const matched=this._matchObjective(config,state.objective);
    if(matched>=0)this.currentStepIndex=matched;

    const step=config.steps[this.currentStepIndex]||config.steps[0];
    window.dispatchEvent(new CustomEvent('cq:modular-state',{detail:{state,day:config,step,index:this.currentStepIndex,passive:this.passive}}));

    // During migration we stay passive. Once each 3D target is explicitly bound,
    // turning passive off will let the shared navigation engine control markers.
    if(!this.passive&&step)navigation.activate(step);
  }

  advance(){
    if(!this.currentConfig)return null;
    this.currentStepIndex=Math.min(this.currentStepIndex+1,this.currentConfig.steps.length-1);
    const step=this.currentConfig.steps[this.currentStepIndex];
    if(!this.passive)navigation.activate(step);
    window.dispatchEvent(new CustomEvent('cq:step-changed',{detail:{day:this.currentConfig,index:this.currentStepIndex,step}}));
    return step;
  }

  current(){
    return this.currentConfig?.steps?.[this.currentStepIndex]||null;
  }

  _matchObjective(config,objective){
    if(!objective)return -1;
    const o=objective.toLowerCase();
    let best=-1,bestScore=0;
    config.steps.forEach((step,index)=>{
      const parts=[step.label,step.target].filter(Boolean).map(v=>String(v).toLowerCase());
      let score=0;
      for(const part of parts){
        for(const token of part.split(/[^a-z0-9]+/).filter(t=>t.length>2))if(o.includes(token))score+=token.length;
      }
      if(score>bestScore){best=index;bestScore=score;}
    });
    return bestScore>0?best:-1;
  }
}

export const controller=new CareerQuestController();
