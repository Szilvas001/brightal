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
