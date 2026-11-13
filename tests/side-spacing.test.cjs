const test=require('node:test'),assert=require('node:assert/strict');
async function setup(){await(await import('../public/builder/kernel.mjs')).initKernel();return {...await import('../public/builder/state.mjs'),...await import('../public/builder/model.mjs'),T:await import('three')};}
function positions(A,c){const m=A.buildRing(A.normalize(c),null);m.group.updateMatrixWorld(true);const p=m.gems.map(g=>g.getWorldPosition(new A.T.Vector3()));const gs=new Set(),ms=new Set();m.group.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());return p;}
test('side spacing moves actual stones independently and keeps old defaults',async()=>{
 const A=await setup();assert.equal(A.normalize({}).sideMainGap,0);assert.equal(A.normalize({sideMainGap:99,sideSpacing:-1}).sideMainGap,1);assert.equal(A.normalize({sideSpacing:-1}).sideSpacing,0);
 for(const sideMode of ['pair','cluster','five']){const c={style:'solitaire',sideMode};const a=positions(A,c),b=positions(A,{...c,sideMainGap:1});assert.equal(a.length,b.length);assert.ok(b[1].distanceTo(b[0])>a[1].distanceTo(a[0]));assert.ok(Math.abs(Math.abs(b[1].x-a[1].x)-.8)<1e-8);
 if(sideMode!=='pair'){const d=positions(A,{...c,sideSpacing:.8});assert.ok(d[1].distanceTo(d[2])>a[1].distanceTo(a[2]));assert.ok(d[1].distanceTo(a[1])<1e-8);}}
 const a=positions(A,{style:'duet'}),b=positions(A,{style:'duet',sideMainGap:1});assert.ok(b[0].distanceTo(b[1])>a[0].distanceTo(a[1]));
 for(const accents of ['pave','channel']){const c={style:'pave',accents,coverage:'half'};const a=positions(A,c),b=positions(A,{...c,sideMainGap:1}),d=positions(A,{...c,sideSpacing:.8});const nearest=p=>Math.min(...p.slice(1).map(v=>v.distanceTo(p[0])));assert.ok(nearest(b)>nearest(a));assert.ok(d.length<a.length);}
});
test('server order snapshots preserve spacing; incompatible parametric CAD cannot silently drop it',async()=>{
 const {parseDesign}=require('../server/designs');const s=await parseDesign(JSON.stringify({version:3,design:{style:'solitaire',sideMode:'five',sideMainGap:.65,sideSpacing:.35}}));assert.equal(s.config.sideMainGap,.65);assert.equal(s.config.sideSpacing,.35);const text=require('../server/order-workflow').specification({design:s});assert.match(text,/0.65 mm/);assert.match(text,/0.35 mm/);await assert.rejects(require('../server/cad').parameters(s.config),/CUSTOM_SPACING/);
});
