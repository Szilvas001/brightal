const test=require('node:test'),assert=require('node:assert/strict');
test('all style tiles reset inherited geometry to the exact thumbnail design',async()=>{
 const {PRESETS,stylePreset}=await import('../public/builder/catalog.mjs');
 const {OPTIONS,normalize}=await import('../public/builder/state.mjs');
 assert.equal(PRESETS.length,OPTIONS.style.length);
 assert.equal(new Set(PRESETS.map(p=>p.config.style)).size,OPTIONS.style.length);
 for(const previous of PRESETS)for(const style of OPTIONS.style){
  const thumbnail=normalize(PRESETS.find(p=>p.config.style===style).config);
  const clicked=normalize({...previous.config,...stylePreset(style)});
  assert.deepEqual(clicked,thumbnail,`${previous.config.style} -> ${style}`);
 }
 const cathedral=stylePreset('cathedral');
 assert.equal(cathedral.shape,'cushion');
 assert.equal(cathedral.gemTone,'sapphire');
 assert.equal(cathedral.sideMode,'pair');
 assert.throws(()=>stylePreset('missing'));
});
test('thumbnail URLs belong to designs rather than catalogue positions',async()=>{
 const {PRESETS,thumbnailUrl}=await import('../public/builder/catalog.mjs');
 const urls=PRESETS.map(p=>thumbnailUrl(p.config));
 assert.equal(new Set(urls).size,PRESETS.length);
 for(const p of [...PRESETS].reverse())assert.equal(thumbnailUrl(p.config),urls[PRESETS.indexOf(p)]);
 const c=PRESETS.find(p=>p.config.style==='cathedral').config;
 assert.notEqual(thumbnailUrl(c),thumbnailUrl({...c,gemTone:'ruby'}));
});

test('each starting style has distinct actual geometry and pave starts with shoulder diamonds',async()=>{
 const {PRESETS,stylePreset}=await import('../public/builder/catalog.mjs');
 const {buildRing}=await import('../public/builder/model.mjs');
 const {createHash}=require('node:crypto');
 await (await import('../public/builder/kernel.mjs')).initKernel();
 const seen=new Map(),counts={};
 for(const {config} of PRESETS){
  const model=buildRing(config,null),hash=createHash('sha256');
  model.group.updateMatrixWorld(true);
  model.group.traverse(o=>{if(!o.isMesh)return;const pos=o.geometry.attributes.position.array;hash.update(Buffer.from(pos.buffer,pos.byteOffset,pos.byteLength));hash.update(JSON.stringify(o.matrixWorld.elements));});
  const signature=hash.digest('hex');
  assert.ok(!seen.has(signature),`${config.style} duplicates ${seen.get(signature)}`);
  seen.set(signature,config.style);counts[config.style]=model.gems.length;
  const geometries=new Set(),materials=new Set();model.group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
 }
 assert.equal(stylePreset('solitaire').accents,'none');
 assert.equal(stylePreset('pave').accents,'pave');
 assert.ok(counts.pave>counts.solitaire,'Pavé must contain additional real diamonds');
});
