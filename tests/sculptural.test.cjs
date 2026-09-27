const test=require('node:test'),assert=require('node:assert/strict');
test('sculptural categories cover all styles; new solid rings survive extreme sizes and optional gemstones',async()=>{
 const {normalize,OPTIONS}=await import('../public/builder/state.mjs');
 const {CATEGORIES}=await import('../public/builder/categories.mjs');
 const {initKernel}=await import('../public/builder/kernel.mjs');await initKernel();
 const {buildRing}=await import('../public/builder/model.mjs');
 for(const style of OPTIONS.style)assert.ok(CATEGORIES.some(c=>c.styles.includes(style)),style);
 const volumes=new Set();
 for(const style of ['fluted','petal','twist','saddle','ripple','tapered']) {
  for(const fashionStone of [false,true]) {
   const config=normalize({style,size:44,width:1.6,thickness:1.4,sculpt:2.5,rhythm:8,fashionStone,shape:'emerald',stoneLength:6,stoneWidth:5,stoneDepth:3.5});
   assert.deepEqual(normalize(JSON.parse(JSON.stringify(config))),config);
   const model=buildRing(config,null);
   assert.equal(model.engineering.metalSolids,1,style);
   assert.ok(model.engineering.volumeMm3>0,style);
   assert.equal(model.gems.length,fashionStone?1:0,style);
   if(!fashionStone)volumes.add(model.engineering.volumeMm3.toFixed(4));
   model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  }
 }
 assert.equal(volumes.size,6,'Each new style must produce different metal geometry');
});
