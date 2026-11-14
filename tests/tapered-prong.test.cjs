const test=require('node:test'),assert=require('node:assert/strict');
test('reference one-carat solitaire uses closed swept prongs, no support posts, and passes raw and final collision checks',async()=>{
 await(await import('../public/builder/kernel.mjs')).initKernel();const {normalize}=await import('../public/builder/state.mjs'),{buildFinishedRing}=await import('../public/builder/finished-model.mjs');
 const model=buildFinishedRing(normalize({style:'solitaire',shape:'round',carat:1,prongs:4,height:0}));
 try{assert.equal(model.contacts.length,0);assert.equal(model.mountings[0].head.arms.length,4);assert.equal(model.mountings[0].head.gallery,null);assert.equal(model.engineering.rawProngValidation.valid,true);assert.equal(model.engineering.assemblyValidation.valid,true,model.engineering.reason);for(const arm of model.mountings[0].head.arms){assert.equal(arm.userData.construction,'tapered-sweep');assert.ok(arm.userData.quality.minimumBendRadiusOverDiameter>=1);}}
 finally{model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
});
test('a halo stone crossing a new prong is rejected before Boolean cutting can hide the collision',async()=>{
 await(await import('../public/builder/kernel.mjs')).initKernel();const {stylePreset}=await import('../public/builder/catalog.mjs'),{buildFinishedRing}=await import('../public/builder/finished-model.mjs');
 const model=buildFinishedRing(stylePreset('halo'));
 try{assert.equal(model.engineering.rawProngValidation.valid,false);assert.equal(model.engineering.assemblyValidation.valid,false);assert.ok(model.engineering.assemblyValidation.issues.includes('METAL_INTERSECTS_STONE'));}
 finally{model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
});
