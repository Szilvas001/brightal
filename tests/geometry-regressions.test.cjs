const test=require('node:test'),assert=require('node:assert/strict');
test('Float32 sliver cleanup cancels opposite faces but does not hide duplicated outward surfaces',async()=>{
 const T=await import('three'),{removeOppositeCoincidentTriangles}=await import('../public/builder/validation.mjs');
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));g.setIndex([0,1,2,2,1,0]);removeOppositeCoincidentTriangles(g);assert.equal(g.index.count,0);
 g.setIndex([0,1,2,0,1,2]);removeOppositeCoincidentTriangles(g);assert.equal(g.index.count,6);g.dispose();
});
test('reported low pear pavé with eight prongs and five princess side stones has closed, non-intersecting metal',async()=>{
 await(await import('../public/builder/kernel.mjs')).initKernel();const {normalize}=await import('../public/builder/state.mjs'),{buildFinishedRing}=await import('../public/builder/finished-model.mjs');
 const c=normalize({style:'pave',shape:'pear',metal:'yellow14',carat:1.3,color:'G',clarity:'VVS1',accents:'pave',width:2.4,size:50,prongs:8,sideShape:'princess',sideMode:'five',sideCarat:.3,height:.5,thickness:2});
 const m=buildFinishedRing(c);try{assert.equal(m.engineering.assemblyValidation.valid,true,JSON.stringify(m.engineering));assert.equal(m.engineering.meshValidation.parts,1);assert.equal(m.engineering.assemblyValidation.metal.valid,true);}finally{m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
});
