import { initKernel } from './kernel.mjs';
import {buildFinishedRing} from './finished-model.mjs';
const cache = new Map();
const pack = (model, start, engineering = model.engineering) => ({object:model.group.toJSON(),radius:model.radius,width:model.width,engineering,buildMs:performance.now()-start});
self.onmessage = async ({data:{id,config}}) => {
  try {
    await initKernel();
    const key=JSON.stringify({...config,rotate:false});
    const cached=cache.get(key);
    if(cached){self.postMessage({id,packed:cached});return;}
    // The finished solid is sent as soon as it exists, marked as still being
    // checked (early); the verdict of the remaining rule checks follows with
    // the same id, without the geometry already sent.
    const start=performance.now();let early=null;
    const model=buildFinishedRing(config,{onSolid:solid=>{
      early=pack(solid,start,{...solid.engineering,checking:true});
      self.postMessage({id,packed:early,early:true});
    }});
    const packed=pack(model,start);
    model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    cache.set(key,packed);
    if(cache.size>12)cache.delete(cache.keys().next().value);
    self.postMessage({id,packed:early?{...packed,object:null}:packed});
  } catch(error) { self.postMessage({id,error:error.message}); }
};
