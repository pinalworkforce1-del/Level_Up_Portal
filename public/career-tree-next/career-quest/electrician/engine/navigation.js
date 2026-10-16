import {frameDocument,frameWindow} from './state.js';

export class NavigationEngine{
  constructor(){
    this.targets=new Map();
    this.active=null;
  }

  registerTarget(id,{aliases=[],resolve3D=null,resolveDOM=null}={}){
    this.targets.set(id,{id,aliases,resolve3D,resolveDOM});
    return this;
  }

  clear(){
    const win=frameWindow(),doc=frameDocument();
    try{
      for(const scene of this._scenes(win)){
        scene.traverse?.(o=>{if(o?.userData?.cqNavigationMarker)o.parent?.remove(o)});
      }
    }catch{}
    doc?.querySelectorAll?.('[data-cq-navigation-marker="true"]').forEach(el=>el.remove());
    this.active=null;
  }

  activate(step){
    if(!step?.target)return false;
    if(this.active?.stepId===step.id)return true;
    this.clear();
    this.active={stepId:step.id,target:step.target};
    // Marker rendering is intentionally explicit. We do not guess scene objects.
    // Each target will be bound once we finish mapping Days 6-10 against the 3D core.
    window.dispatchEvent(new CustomEvent('cq:navigation-target',{detail:{...this.active,step}}));
    return true;
  }

  _scenes(win){
    if(!win)return[];
    const out=[],seen=new Set();
    const add=v=>{if(v&&typeof v==='object'&&v.isScene&&!seen.has(v)){seen.add(v);out.push(v)}};
    try{
      for(const k of Object.keys(win)){
        let v;try{v=win[k]}catch{continue}
        add(v);
        if(v&&typeof v==='object')for(const p of ['scene','world','threeScene','mainScene','gameScene']){try{add(v[p])}catch{}}
      }
    }catch{}
    return out;
  }
}

export const navigation=new NavigationEngine();
