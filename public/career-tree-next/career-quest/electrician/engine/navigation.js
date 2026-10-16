import {frameDocument,frameWindow} from './state.js';
import {resolve3DTarget,resolveDOMTarget,aliasesFor,bindingIds} from './bindings.js';

export class NavigationEngine{
  constructor(){
    this.targets=new Map();
    this.active=null;
    this._registerDefaults();
  }

  _registerDefaults(){
    for(const id of bindingIds()){
      this.registerTarget(id,{
        aliases:aliasesFor(id),
        resolve3D:()=>resolve3DTarget(id),
        resolveDOM:()=>resolveDOMTarget(id)
      });
    }
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

    const binding=this.targets.get(step.target);
    if(!binding){
      this.active={stepId:step.id,target:step.target,status:'unbound'};
      window.dispatchEvent(new CustomEvent('cq:navigation-target',{detail:{...this.active,step}}));
      return false;
    }

    let object3D=null,dom=null;
    try{object3D=binding.resolve3D?.()||null}catch{}
    try{dom=binding.resolveDOM?.()||null}catch{}

    if(object3D){
      const marker=this._make3DMarker(frameWindow());
      if(marker){
        object3D.add(marker);
        this.active={stepId:step.id,target:step.target,status:'3d',object3D};
        window.dispatchEvent(new CustomEvent('cq:navigation-target',{detail:{stepId:step.id,target:step.target,status:'3d',step}}));
        return true;
      }
    }

    if(dom){
      this._makeDOMMarker(dom);
      this.active={stepId:step.id,target:step.target,status:'dom',dom};
      window.dispatchEvent(new CustomEvent('cq:navigation-target',{detail:{stepId:step.id,target:step.target,status:'dom',step}}));
      return true;
    }

    this.active={stepId:step.id,target:step.target,status:'unresolved'};
    window.dispatchEvent(new CustomEvent('cq:navigation-target',{detail:{...this.active,step}}));
    return false;
  }

  _make3DMarker(win){
    const T=win?.THREE;
    if(!T?.CanvasTexture||!T?.Sprite||!T?.SpriteMaterial)return null;
    const c=win.document.createElement('canvas');c.width=128;c.height=176;
    const x=c.getContext('2d');
    x.clearRect(0,0,128,176);
    x.shadowColor='rgba(246,196,83,.98)';x.shadowBlur=22;
    x.fillStyle='#f6c453';x.strokeStyle='#fff1ba';x.lineWidth=7;
    x.beginPath();x.arc(64,58,28,0,Math.PI*2);x.fill();x.stroke();
    x.beginPath();x.moveTo(45,79);x.lineTo(64,133);x.lineTo(83,79);x.closePath();x.fill();x.stroke();
    const tex=new T.CanvasTexture(c);tex.needsUpdate=true;
    const mat=new T.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false});
    const sp=new T.Sprite(mat);
    sp.name='cq-navigation-marker';
    sp.userData={cqNavigationMarker:true};
    sp.renderOrder=99999;
    sp.scale.set(1.15,1.58,1);
    sp.position.set(0,2.65,0);
    return sp;
  }

  _makeDOMMarker(el){
    const doc=frameDocument();
    if(!doc||!el)return null;
    const cs=doc.defaultView.getComputedStyle(el);
    if(cs.position==='static')el.style.position='relative';
    const m=doc.createElement('div');
    m.dataset.cqNavigationMarker='true';
    m.setAttribute('aria-hidden','true');
    m.style.cssText='position:absolute;left:50%;top:-42px;transform:translateX(-50%);width:26px;height:34px;z-index:2147483000;pointer-events:none;filter:drop-shadow(0 0 10px rgba(246,196,83,.98))';
    m.innerHTML='<span style="display:block;width:20px;height:20px;margin:auto;background:#f6c453;border:3px solid #fff1ba;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 0 4px rgba(246,196,83,.2),0 0 18px rgba(246,196,83,.9)"></span>';
    el.appendChild(m);
    return m;
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
