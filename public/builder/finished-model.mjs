import * as T from 'three';
import {buildRing} from './model.mjs';
import {unifyLegacy} from './solidify.mjs';
import {auditAssembly,auditMetalPenetration} from './assembly-audit.mjs';
export function buildFinishedRing(config){
 const raw=buildRing(config,null);
 let rawProngs=null;
 if(raw.mountings?.some(m=>m.tapered)){
  raw.group.updateMatrixWorld(true);const group=new T.Group();
  raw.group.traverse(o=>{if(o.isMesh&&(o.userData.gem||o.userData.construction==='tapered-sweep')){const copy=o.clone();copy.matrixAutoUpdate=false;copy.matrix.copy(o.matrixWorld);group.add(copy);}});
  rawProngs=auditMetalPenetration({group});
 }
 const model=unifyLegacy(raw);
 model.engineering.assemblyValidation=auditAssembly(model,config);
 if(rawProngs){model.engineering.rawProngValidation=rawProngs;if(!rawProngs.valid){model.engineering.assemblyValidation.valid=false;model.engineering.assemblyValidation.issues.push('METAL_INTERSECTS_STONE');}}
 return model;
}
