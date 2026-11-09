import {buildRing} from './model.mjs';
import {unifyLegacy} from './solidify.mjs';
import {auditAssembly} from './assembly-audit.mjs';
export function buildFinishedRing(config){
 const model=unifyLegacy(buildRing(config,null));
 model.engineering.assemblyValidation=auditAssembly(model,config);
 return model;
}
