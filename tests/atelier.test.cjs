const test=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
test('five Atelier styles have editable, closed geometry and matching catalogue presets',async()=>{
 const {ATELIER_STYLES,normalize}=await import('../public/builder/state.mjs');
 const {stylePreset}=await import('../public/builder/catalog.mjs');
 const {CATEGORIES}=await import('../public/builder/categories.mjs');
 const {initKernel}=await import('../public/builder/kernel.mjs');await initKernel();
 const {buildFinishedRing}=await import('../public/builder/finished-model.mjs');
 assert.equal(ATELIER_STYLES.length,5);
 assert.deepEqual(CATEGORIES.find(x=>x.id==='atelier').styles,ATELIER_STYLES);
 const signature=config=>{
  const model=buildFinishedRing(normalize(config)),hash=createHash('sha256');
  assert.equal(model.engineering.metalSolids,1,config.style);
  assert.ok(model.engineering.volumeMm3>0,config.style);
  assert.equal(model.gems.length,config.fashionStone?1:0);
  model.group.traverse(o=>{if(o.geometry){const a=o.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite));hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));o.geometry.dispose();o.material.dispose();}});
  return hash.digest('hex');
 };
 const unique=new Set();
 for(const style of ATELIER_STYLES){
  const preset=stylePreset(style),base=signature(preset);unique.add(base);
  for(const [key,value] of [['sculpt',.4],['rhythm',8],['width',9],['motifDepth',0],['motifOffset',-.7],['edgeSoftness',1.2],['thickness',2.8]]){
   assert.notEqual(signature({...preset,[key]:value}),base,`${style}: ${key} must change actual geometry`);
  }
  for(const size of [44,72])signature({...preset,size,width:1.6,sculpt:2.5,rhythm:8,motifDepth:1.2,edgeSoftness:.35,fashionStone:true,shape:'emerald',stoneLength:6,stoneWidth:5,stoneDepth:3.5});
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(preset))),preset);
 }
 assert.equal(unique.size,5);
});
