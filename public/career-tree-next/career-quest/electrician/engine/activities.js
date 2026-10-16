export class ActivityRouter{
  constructor(){this.handlers=new Map();}
  register(type,handler){this.handlers.set(type,handler);return this;}
  async open(step,context={}){
    const handler=this.handlers.get(step?.activity?.type);
    if(!handler)throw new Error(`No Career Quest activity handler for ${step?.activity?.type||'unknown'}`);
    const result=await handler(step,context);
    window.dispatchEvent(new CustomEvent('cq:activity-complete',{detail:{step,result}}));
    return result;
  }
}

export const activities=new ActivityRouter();
