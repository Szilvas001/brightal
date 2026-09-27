import { initKernel } from './kernel.mjs';
import {buildFinishedRing} from './finished-model.mjs';
const cache = new Map();
self.onmessage = async ({data:{id,config}}) => {
  try {
    await initKernel();
    const key=JSON.stringify({...config,rotate:false});
    let packed=cache.get(key);
    if(!packed) {
      const start=performance.now(), model=buildFinishedRing(config);
      packed={object:model.group.toJSON(),radius:model.radius,width:model.width,engineering:model.engineering,buildMs:performance.now()-start};
      model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
      cache.set(key,packed);
      if(cache.size>12)cache.delete(cache.keys().next().value);
    }
    self.postMessage({id,packed});
  } catch(error) { self.postMessage({id,error:error.message}); }
};
