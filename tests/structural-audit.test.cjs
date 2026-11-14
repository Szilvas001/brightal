const test=require('node:test'),assert=require('node:assert/strict');
async function setup(){await(await import('../public/builder/kernel.mjs')).initKernel();return {...await import('../public/builder/structural-audit.mjs'),...await import('../public/builder/model.mjs'),...await import('../public/builder/catalog.mjs'),...await import('../public/builder/state.mjs'),T:await import('three')};}
function dispose(m){m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
test('mirrored mesh audit detects a single displaced support and a disconnected joint',async()=>{
 const A=await setup(),c=A.stylePreset('tension'),m=A.buildRing(c);
 try{const good=A.auditSupportJoints(m);assert.equal(good.valid,true,JSON.stringify(good));assert.equal(good.joints.length,4);assert.ok(good.joints.every(j=>j.shankOverlapMm3>1e-6&&j.galleryOverlapMm3>1e-6));
 m.contacts[0].support.position.z+=4;const bad=A.auditSupportJoints(m);assert.equal(bad.valid,false);assert.ok(bad.issues.some(i=>i.code==='SUPPORT_JOINT_HAS_NO_VOLUME'));assert.ok(bad.issues.some(i=>i.code==='SUPPORT_MIRROR_MISMATCH'));
 }finally{dispose(m);}
});
test('all centred legacy settings preserve support mesh symmetry at both lift extremes',async()=>{
 const A=await setup();let count=0;
 for(const style of A.OPTIONS.style.filter(style=>!A.isModern({style})&&style!=='duet'))for(const height of [0,6]){
  const c=A.normalize({...A.stylePreset(style),height}),m=A.buildRing(c);try{const report=A.auditSupportJoints(m);assert.equal(report.valid,true,JSON.stringify({style,height,...report}));count++;}finally{dispose(m);}
 }console.log('Symmetric support extreme cases:',count);
});
test('volume-based bore check catches a face crossing the bore with every vertex outside',async()=>{
 const A=await setup(),group=new A.T.Group();const o=new A.T.Mesh(new A.T.BoxGeometry(20,20,.5),new A.T.MeshBasicMaterial());group.add(o);
 try{const r=A.auditBoreVolume({group},{size:44});assert.equal(r.valid,false);assert.ok(r.intersections[0].overlapMm3>1);}finally{dispose({group});}
});
