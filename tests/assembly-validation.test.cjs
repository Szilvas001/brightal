const test=require('node:test'),assert=require('node:assert/strict');
test('finished baseline seats do not penetrate stones, including pear vintage regression',async()=>{
 await (await import('../public/builder/kernel.mjs')).initKernel();const {stylePreset}=await import('../public/builder/catalog.mjs');const {buildFinishedRing}=await import('../public/builder/finished-model.mjs');
 for(const style of ['vintage','halo','solitaire','duet']){const m=buildFinishedRing(stylePreset(style));assert.equal(m.engineering.assemblyValidation.valid,true,JSON.stringify(m.engineering.assemblyValidation));assert.equal(m.engineering.assemblyValidation.metal.valid,true);m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});}
});
test('independent collision check detects overlapping stones and repaired hidden halo passes server validation',async()=>{
 await (await import('../public/builder/kernel.mjs')).initKernel();const T=await import('three');const {auditStoneCollisions}=await import('../public/builder/assembly-audit.mjs');const group=new T.Group();for(let i=0;i<2;i++){const o=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial());o.userData.gem=true;group.add(o);}assert.equal(auditStoneCollisions({group}).valid,false);group.children[1].position.x=2;assert.equal(auditStoneCollisions({group}).valid,true);group.children.forEach(o=>{o.geometry.dispose();o.material.dispose()});
 const {normalize}=await import('../public/builder/state.mjs');const config=normalize({style:'trilogy',shape:'emerald',carat:.3,sideCarat:.1,sideMode:'cluster',hiddenHalo:true,halo:'double',size:44,width:1.6,accents:'none',setting:'bezel'});
 await assert.doesNotReject(require('../server/designs').validateGeometry({config}));
});
