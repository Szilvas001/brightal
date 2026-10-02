const test=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
let modules;
async function setup(){if(!modules)modules=(async()=>{const S=await import('../public/builder/state.mjs');const C=await import('../public/builder/catalog.mjs');const M=await import('../public/builder/model.mjs');const L=await import('../public/builder/contemporary.mjs');const F=await import('../public/builder/finished-model.mjs');await (await import('../public/builder/kernel.mjs')).initKernel();return {...S,...C,...M,...L,...F};})();return modules;}
function dispose(model){const geometries=new Set(),materials=new Set();model.group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
function meshSignature(model){const h=createHash('sha256');model.group.updateMatrixWorld(true);model.group.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite));h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));h.update(JSON.stringify(o.matrixWorld.elements));});const result=h.digest('hex');dispose(model);return result;}
function layoutSignature(s,modernLayout){const l=modernLayout(s);return JSON.stringify({inner:l.inner,stones:l.stones,profile:l.profileExponent,body:Array.from({length:61},(_,i)=>{const a=i*Math.PI*2/61;return [l.widthAt(a),l.thicknessAt(a),l.shift(a),...Array.from({length:19},(_,j)=>l.relief(a,j*Math.PI*2/19))];}),// Collar dimensions and groove cuts are constructed separately from the band sweep.
collars:l.stones.map(stone=>[stone.width+2*s.bezelWall,stone.length+2*s.bezelWall]),grooves:['open','stack','openpair'].includes(s.style)?[s.gap,s.layers,s.sculpt]:null});}
const ticks=(min,max,step)=>Array.from({length:Math.floor((max-min)/step+1e-7)+1},(_,i)=>Number((min+i*step).toFixed(2)));
function ranges(s,A){const {isModern,isFashion,ATELIER_STYLES,SQUARE_SHAPES,modernLayout}=A;
 const r={size:ticks(44,72,1),width:ticks(isModern(s)?A.minBandWidth(s):1.6,isModern(s)?10:5,.1),thickness:ticks(isModern(s)?A.minBandThickness(s):1.4,isModern(s)?3.4:3,.1)};
 if(isModern(s)){
  Object.assign(r,{stoneWidth:ticks(1.5,A.maxStoneWidth(s),.1),stoneDepth:ticks(1,A.maxStoneDepth(s),.1),bezelWall:ticks(.35,.7,.05)});
  if(!SQUARE_SHAPES.includes(s.shape))r.stoneLength=ticks(s.stoneWidth,A.maxStoneLength(s),.1);
  if(!A.singleStone(s)&&!['openpair','fullcircle'].includes(s.style))r.dailyCount=ticks(1,A.maxDailyStones(s),1);
  if(modernLayout(s).stones.length>1&&s.style!=='fullcircle')r.dailySpacing=ticks(0,.5,.05);
  if(isFashion(s)&&s.style!=='stack'||['chevron','ribbon','crown','contour','curvedoval','wavebezel','asymmetric'].includes(s.style))r.sculpt=ticks(.4,2.5,.1);
  if(['rope','fluted','petal','twist','ripple',...ATELIER_STYLES].includes(s.style))r.rhythm=ticks(2,8,1);
  if(s.style==='stack')r.layers=[2,3,4];
  if(['stack','open','openpair'].includes(s.style))r.gap=ticks(s.style==='openpair'?.5:.3,1.5,.1);
  if(s.style==='signet')r.faceSize=ticks(Math.max(5,Math.ceil(A.minBandWidth(s)*2)/2),11,.5);
  if(ATELIER_STYLES.includes(s.style))Object.assign(r,{motifDepth:ticks(0,1.2,.1),motifOffset:ticks(-1,1,.1),edgeSoftness:ticks(.35,1.2,.05)});
 }else{
  Object.assign(r,{carat:ticks(.3,5,.1),height:ticks(.5,2.5,.1)});
  if(s.setting!=='bezel')r.prongs=[4,6,8];
  if(s.style==='duet'||s.sideMode!=='none')r.sideCarat=ticks(.1,1.5,.05);
  if(['halo','vintage'].includes(s.style))r.haloSize=ticks(.6,1.6,.1);
  if(s.accents!=='none')Object.assign(r,{accentSize:ticks(.6,A.maxAccentSize(s),.1),accentRows:s.style==='split'||s.style==='tension'&&s.width<2.7?[1]:[1,2]});
 }
 return r;
}
test('every available slider tick changes its requested parameter and ring geometry for all 44 presets',async()=>{
 const A=await setup();let checks=0;
 for(const {config:s}of A.PRESETS){for(const [key,values]of Object.entries(ranges(s,A))){let previous;for(const value of values){const next=A.normalize({...s,[key]:value});assert.equal(next[key],value,`${s.style}/${key}: ${value} must be retained`);assert.deepEqual(A.normalize(next),next,`${s.style}/${key}: normalization must be stable`);const sig=A.isModern(next)?layoutSignature(next,A.modernLayout):meshSignature(A.buildRing(next,null));assert.notEqual(sig,previous,`${s.style}/${key}: adjacent slider steps must affect the model`);previous=sig;checks++;}}}
 console.log(`Slider checks: ${checks}`);
});
test('every cut and orientation renders finite geometry from every starting style, including dimensional limits',async()=>{
 const A=await setup();let checks=0;
 for(const {config:s}of A.PRESETS)for(const shape of A.OPTIONS.shape)for(const orientation of s.style==='eastwest'?['east']:A.OPTIONS.orientation){const next=A.normalize({...s,shape,orientation});assert.equal(next.shape,shape);assert.equal(next.orientation,orientation);assert.deepEqual(A.normalize(next),next);const model=A.buildRing(next,null);assert.ok(model.gems.length>0);meshSignature(model);checks++;}
 console.log(`Cut/orientation models: ${checks}`);
});
test('hidden halo can be toggled in its preset and is applied to both duet mountings',async()=>{
 const A=await setup();for(const style of A.OPTIONS.style.filter(x=>!A.isModern({style:x}))){const s=A.stylePreset(style);const off=A.normalize({...s,hiddenHalo:false}),on=A.normalize({...s,hiddenHalo:true});assert.equal(off.hiddenHalo,false);assert.equal(on.hiddenHalo,true);const a=A.buildRing(off,null),b=A.buildRing(on,null);assert.equal(b.gems.length-a.gems.length,style==='duet'?48:24,style);dispose(a);dispose(b);}
});
test('all side layouts, cuts, tones, settings and accent combinations are applied to legacy ring models',async()=>{
 const A=await setup();let checks=0;
 for(const {config:s}of A.PRESETS.filter(p=>!A.isModern(p.config))){
  for(const setting of A.OPTIONS.setting)for(const prongs of setting==='bezel'?[4]:[4,6,8]){const c=A.normalize({...s,setting,prongs});assert.equal(c.setting,setting);assert.equal(c.prongs,prongs);meshSignature(A.buildRing(c,null));checks++;}
  for(const sideMode of s.style==='duet'?['none']:A.OPTIONS.sideMode.filter(x=>s.style!=='trilogy'||x!=='none'))for(const sideShape of A.OPTIONS.sideShape){const c=A.normalize({...s,sideMode,sideShape,hiddenHalo:false,accents:'none'}),m=A.buildRing(c,null);assert.equal(m.mountings.length,s.style==='duet'?2:sideMode==='none'?1:sideMode==='pair'?3:sideMode==='cluster'?7:5);assert.equal(c.sideShape,sideShape);meshSignature(m);checks++;}
  for(const accents of A.OPTIONS.accents)for(const coverage of A.OPTIONS.coverage)for(const accentRows of s.style==='split'?[1]:[1,2]){const c=A.normalize({...s,accents,coverage,accentRows,width:5});assert.equal(c.accents,accents);assert.equal(c.coverage,coverage);assert.equal(c.accentRows,accentRows);meshSignature(A.buildRing(c,null));checks++;}
  for(const sideTone of A.OPTIONS.sideTone){const c=A.normalize({...s,sideMode:'pair',accents:'pave',hiddenHalo:true,sideTone}),m=A.buildRing(c,null);assert.ok(m.gems.some(g=>g.userData.tone===sideTone));dispose(m);checks++;}
 }
 console.log(`Legacy dependent combinations: ${checks}`);
});
test('all metal, finish, gemstone palette and light options reach the finished model without being discarded',async()=>{
 const A=await setup();let checks=0;
 // Detailed finish/material checks for every starting style; the expensive
 // Boolean geometry is shared across material-only specifications.
 for(const {config:s}of A.PRESETS){for(const finish of A.OPTIONS.finish){const m=A.buildFinishedRing(A.normalize({...s,finish}));const metals=[];m.group.traverse(o=>{if(o.isMesh&&!o.userData.gem)metals.push(o.material);});assert.ok(metals.every(m=>m.roughness===(A.isModern(s)?{polished:.13,satin:.3,brushed:.4}:{polished:.105,satin:.29,brushed:.4})[finish]),s.style+'/'+finish);dispose(m);checks++;}
  for(const key of ['metal','gemTone','light','color','clarity','origin','certificate'])for(const value of A.OPTIONS[key]){const c=A.normalize({...s,[key]:value});assert.equal(c[key],value,s.style+'/'+key);assert.deepEqual(A.normalize(JSON.parse(JSON.stringify(c))),c);checks++;}
 }
 for(const {config:s}of A.PRESETS.filter(p=>!A.isModern(p.config)))for(const headMetal of A.OPTIONS.headMetal){const c=A.normalize({...s,metal:'rose14',headMetal}),m=A.buildFinishedRing(c);const desired=A.METAL_COLORS[headMetal==='match'?c.metal:headMetal];const T=await import('three'),expected=new T.Color(desired);let found=false;m.group.traverse(o=>{if(!o.isMesh||o.userData.gem)return;const attr=o.geometry.attributes.color;if(attr){for(let i=0;i<attr.count;i++)if(Math.abs(attr.getX(i)-expected.r)<1e-6&&Math.abs(attr.getY(i)-expected.g)<1e-6&&Math.abs(attr.getZ(i)-expected.b)<1e-6)found=true;}else if(o.material.color.equals(expected))found=true;});assert.ok(found,`${s.style}/${headMetal}: detailed model must preserve head alloy`);dispose(m);checks++;}
 console.log(`Material/specification checks: ${checks}`);
});
test('modern alternating cuts and colours apply to every other actual stone',async()=>{
 const A=await setup();for(const {config:s}of A.PRESETS.filter(p=>A.isModern(p.config)&&!A.singleStone(p.config)))for(const sideTone of A.OPTIONS.sideTone){const c=A.normalize({...s,alternateGems:true,sideTone}),l=A.modernLayout(c);assert.ok(l.stones.every((stone,i)=>stone.tone===(i%2?sideTone:c.gemTone)));if(c.style==='alternating')for(const sideShape of A.OPTIONS.sideShape){const next=A.normalize({...c,sideShape});assert.ok(A.modernLayout(next).stones.every((stone,i)=>stone.shape===(i%2?sideShape:next.shape)));}}
});
