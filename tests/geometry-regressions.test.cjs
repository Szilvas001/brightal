const test=require('node:test'),assert=require('node:assert/strict');
test('Float32 sliver cleanup cancels opposite faces but does not hide duplicated outward surfaces',async()=>{
 const T=await import('three'),{removeOppositeCoincidentTriangles}=await import('../public/builder/validation.mjs');
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));g.setIndex([0,1,2,2,1,0]);removeOppositeCoincidentTriangles(g);assert.equal(g.index.count,0);
 g.setIndex([0,1,2,0,1,2]);removeOppositeCoincidentTriangles(g);assert.equal(g.index.count,6);g.dispose();
});
test('reported low pear pavé with eight prongs and five princess side stones has closed, non-intersecting metal',async()=>{
 await(await import('../public/builder/kernel.mjs')).initKernel();const {normalize}=await import('../public/builder/state.mjs'),{buildFinishedRing}=await import('../public/builder/finished-model.mjs');
 const c=normalize({style:'pave',shape:'pear',metal:'yellow14',carat:1.3,color:'G',clarity:'VVS1',accents:'pave',width:2.4,size:50,prongs:8,sideShape:'princess',sideMode:'five',sideCarat:.3,height:.5,thickness:2});
 const m=buildFinishedRing(c);try{assert.equal(m.engineering.assemblyValidation.valid,true,JSON.stringify({reason:m.engineering.reason,issues:m.engineering.assemblyValidation.issues}));assert.equal(m.engineering.meshValidation.parts,1);assert.equal(m.engineering.assemblyValidation.metal.valid,true);}finally{m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
});

test('double claws remain separate and closed around round, oval and pear cluster settings',async()=>{
 await(await import('../public/builder/kernel.mjs')).initKernel();
 const {stylePreset}=await import('../public/builder/catalog.mjs'),{normalize}=await import('../public/builder/state.mjs'),{buildFinishedRing}=await import('../public/builder/finished-model.mjs');
 for(const shape of ['round','oval','pear']){
  const m=buildFinishedRing(normalize({...stylePreset('split'),shape,setting:'doubleclaw',sideMode:'cluster'}));
  try{assert.equal(m.engineering.assemblyValidation.valid,true,JSON.stringify({shape,reason:m.engineering.reason,issues:m.engineering.assemblyValidation.issues}));}
  finally{m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 }
});
test('collision audit must reject an open metal mesh rather than report zero penetration',async()=>{
 await(await import('../public/builder/kernel.mjs')).initKernel();
 const T=await import('three'),{auditMetalPenetration}=await import('../public/builder/assembly-audit.mjs');
 const group=new T.Group(),mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial());group.add(mesh);
 try{assert.throws(()=>auditMetalPenetration({group}),/Invalid solid|Empty metal|Not manifold/);}
 finally{mesh.geometry.dispose();mesh.material.dispose();}
});

test('pointed marquise bezels and wide channel rails form one connected metal body',async()=>{
 await(await import('../public/builder/kernel.mjs')).initKernel();
 const {stylePreset}=await import('../public/builder/catalog.mjs'),{normalize}=await import('../public/builder/state.mjs'),{buildFinishedRing}=await import('../public/builder/finished-model.mjs');
 const cases=[normalize({...stylePreset('split'),shape:'marquise',setting:'bezel',sideMode:'cluster'}),normalize({...stylePreset('duet'),carat:5,sideCarat:1.5,size:44,width:5,accents:'channel',hiddenHalo:true})];
 for(const c of cases){const m=buildFinishedRing(c);try{assert.equal(m.engineering.assemblyValidation.valid,true,JSON.stringify({style:c.style,reason:m.engineering.reason,issues:m.engineering.assemblyValidation.issues}));}finally{m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}}
});

test('two closed solids touching at a single vertex are not a manufacturable connection',async()=>{
 const T=await import('three'),{mergeGeometries}=await import('three/addons/utils/BufferGeometryUtils.js'),{validateMesh}=await import('../public/builder/validation.mjs');
 const a=new T.BoxGeometry(1,1,1),b=new T.BoxGeometry(1,1,1);b.translate(1,1,1);const joined=mergeGeometries([a,b]);
 try{const result=validateMesh(joined);assert.equal(result.boundaryEdges,0);assert.equal(result.nonManifoldVertices,1);assert.equal(result.valid,false);assert.equal(validateMesh(a).valid,true);}
 finally{a.dispose();b.dispose();joined.dispose();}
});

test('reported pavé supports avoid stones before cavity subtraction, so cutting cannot conceal severed rods',async()=>{
 await(await import('../public/builder/kernel.mjs')).initKernel();
 const T=await import('three'),{buildRing}=await import('../public/builder/model.mjs'),{normalize}=await import('../public/builder/state.mjs'),{auditMetalPenetration}=await import('../public/builder/assembly-audit.mjs');
 const c=normalize({style:'pave',shape:'pear',metal:'yellow14',carat:1.3,accents:'pave',width:2.4,size:50,prongs:8,sideShape:'princess',sideMode:'five',sideCarat:.3,height:.5,thickness:2}),m=buildRing(c),group=new T.Group();
 try{
  assert.equal(m.contacts.length,20);assert.ok(m.contacts.every(c=>c.support.userData.stoneClearanceValid));
  for(const mesh of [...m.contacts.map(c=>c.support),...m.gems]){const copy=mesh.clone();copy.matrixAutoUpdate=false;copy.matrix.copy(mesh.matrixWorld);group.add(copy);}
  const audit=auditMetalPenetration({group});assert.equal(audit.valid,true,JSON.stringify(audit));
 }finally{m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
});

test('hidden-halo diamonds stay outside raw claws and bezel ribs for every cut at both carat limits',async()=>{
 await(await import('../public/builder/kernel.mjs')).initKernel();
 const T=await import('three'),{buildRing}=await import('../public/builder/model.mjs'),{normalize,OPTIONS}=await import('../public/builder/state.mjs'),{auditMetalPenetration}=await import('../public/builder/assembly-audit.mjs'),{spacedOutline}=await import('../public/builder/stone-spacing.mjs');
 let count=0;
 for(const shape of OPTIONS.shape)for(const setting of OPTIONS.setting)for(const carat of [.3,5]){
  const m=buildRing(normalize({style:'solitaire',shape,setting,carat,hiddenHalo:true}));
  try{const group=new T.Group(),mount=m.mountings[0],stones=mount.assembly.children.filter(o=>o.userData.gem&&!o.userData.hero);
   assert.equal(stones.length,spacedOutline(shape,2.4*Math.cbrt(carat)*.86,.44,24,24).length,'No hidden-halo stone may be removed');
   for(const o of [...stones,...mount.assembly.children.filter(o=>['prong','setting-rib'].includes(o.userData.role))]){const copy=o.clone();copy.matrixAutoUpdate=false;copy.matrix.copy(o.matrixWorld);group.add(copy);}
   const report=auditMetalPenetration({group});assert.equal(report.valid,true,JSON.stringify({shape,setting,carat,report}));count++;
  }finally{m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 }
 console.log('Hidden-halo raw setting clearance cases:',count);
});
