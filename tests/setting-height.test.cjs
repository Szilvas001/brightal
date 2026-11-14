const test=require('node:test'),assert=require('node:assert/strict');
async function modules(){await(await import('../public/builder/kernel.mjs')).initKernel();return {...await import('../public/builder/state.mjs'),...await import('../public/builder/catalog.mjs'),...await import('../public/builder/model.mjs'),...await import('../public/builder/finished-model.mjs'),T:await import('three')};}
function dispose(m){m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
test('setting lift defaults to zero, retains all 61 positions, and moves the actual stone by the labelled millimetres',async()=>{
 const A=await modules();assert.equal(A.DEFAULT.height,0);assert.equal(A.normalize({height:-1}).height,0);assert.equal(A.normalize({height:99}).height,6);
 for(const {config} of A.PRESETS)assert.equal(config.height,0);
 let zero;
 for(let i=0;i<=60;i++){
  const c=A.normalize({...A.stylePreset('solitaire'),height:i/10});assert.equal(c.height,i/10);assert.deepEqual(A.normalize(JSON.parse(JSON.stringify(c))),c);
  const m=A.buildRing(c);try{const p=m.gems[0].getWorldPosition(new A.T.Vector3());if(!zero)zero=p.clone();assert.ok(Math.abs((p.y-zero.y)/.8-c.height)<1e-6,`height ${c.height}`);assert.equal(p.x,zero.x);assert.equal(p.z,zero.z);}finally{dispose(m);}
 }
});
test('lowest and highest settings have valid finished geometry across every legacy style and the reported pavé configuration',async()=>{
 const A=await modules();const configurations=A.PRESETS.filter(p=>!A.isModern(p.config)).map(p=>p.config);
 configurations.push(A.normalize({style:'pave',shape:'pear',metal:'yellow14',carat:1.3,accents:'pave',width:2.4,size:50,prongs:8,sideShape:'princess',sideMode:'five',sideCarat:.3,thickness:2}));
 let count=0;
 for(const config of configurations)for(const height of [0,6]){const m=A.buildFinishedRing(A.normalize({...config,height}));try{assert.equal(m.engineering.assemblyValidation.valid,true,JSON.stringify({style:config.style,height,reason:m.engineering.reason,issues:m.engineering.assemblyValidation.issues}));assert.equal(m.engineering.assemblyValidation.blockedSupports,0);count++;}finally{dispose(m);}}
 console.log(`Finished height extremes: ${count}`);
});
