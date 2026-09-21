import{initKernel}from'../public/builder/kernel.mjs';import{buildRing}from'../public/builder/model.mjs';import{normalize,DEFAULT}from'../public/builder/state.mjs';import{COLLECTION}from'../public/builder/collection.mjs';import{unifyLegacy}from'../public/builder/solidify.mjs';
await initKernel();let failures=0;
for(const c of COLLECTION){for(const extreme of [false,true]){
 const config=normalize({...DEFAULT,...c.config,style:c.style,...extreme?{size:44,width:1.6,thickness:1.4,bezelWall:.35,stoneWidth:5,stoneLength:6,stoneDepth:3.5,dailyCount:9,sculpt:2.5}: {size:72}});
 try{const m=unifyLegacy(buildRing(config,null));const ok=m.engineering.meshValidation.valid;console.log(c.style,extreme?'max':'min',ok?'PASS':'FAIL',m.engineering.reason||'');if(!ok)failures++;m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}catch(e){console.log(c.style,'FAIL',e.message);failures++;}
}}console.log('FAILURES',failures);process.exitCode=failures?1:0;
