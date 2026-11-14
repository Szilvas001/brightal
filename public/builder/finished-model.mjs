import {inspectDesign} from './geometry-rules.mjs';
// The model shown in the designer, stored with an order and exported for the
// workshop. It is always run through the complete rule check (A–F, see
// geometry-rules.mjs): a design that breaks any rule is marked invalid, so the
// UI refuses to present it as finished and the server refuses the order.
export function buildFinishedRing(config){
 const result=inspectDesign(config,{keepModel:true,exportCheck:false}),model=result.model;
 if(!model)throw new Error(result.violations.map(v=>v.details[0]).join('; ')||'Ring geometry could not be built');
 const audit=model.engineering.assemblyValidation;
 const codes=result.violations.map(v=>v.code).filter(code=>!audit.issues.includes(code));
 model.engineering.ruleValidation={valid:result.valid,violations:result.violations};
 model.engineering.assemblyValidation={...audit,valid:audit.valid&&result.valid,issues:[...audit.issues,...codes]};
 return model;
}
