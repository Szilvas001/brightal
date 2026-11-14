import fs from 'node:fs';import * as T from 'three';
import {initKernel,getKernel} from '../public/builder/kernel.mjs';import {buildRing} from '../public/builder/model.mjs';import {unifyLegacy} from '../public/builder/solidify.mjs';import {auditAssembly,auditMetalPenetration} from '../public/builder/assembly-audit.mjs';import {PRESETS,stylePreset} from '../public/builder/catalog.mjs';import {normalize,isModern} from '../public/builder/state.mjs';import {validateMesh} from '../public/builder/validation.mjs';import {meshSolid} from '../public/builder/structural-audit.mjs';
const out='docs/audits/2026-11-14/tapered-head';fs.mkdirSync(out,{recursive:true});await initKernel();
const results=[];
const configs=[normalize({...stylePreset('solitaire'),shape:'round',carat:1}),...PRESETS.filter(p=>!isModern(p.config)).map(p=>normalize({...p.config,setting:'claw'}))];
for(const config of configs){let m;const result={config,issues:[]};try{
 m=buildRing(config);m.group.updateMatrixWorld(true);const prongs=[];m.group.traverse(o=>{if(o.userData.construction==='tapered-sweep')prongs.push(o);});
 const group=new T.Group();for(const o of [...prongs,...m.gems]){const copy=o.clone();copy.matrixAutoUpdate=false;copy.matrix.copy(o.matrixWorld);group.add(copy);}result.rawProngStone=auditMetalPenetration({group});if(!result.rawProngStone.valid)result.issues.push('RAW_PRONG_STONE_INTERSECTION');
 result.sweeps=prongs.map(o=>{const p=o.geometry.attributes.position,{segments,sides}=o.geometry.userData.sweep,centers=[],diameters=[];
 for(let i=0;i<=segments;i++){const ring=Array.from({length:sides},(_,j)=>new T.Vector3().fromBufferAttribute(p,i*sides+j).divideScalar(.8)),center=ring.reduce((a,b)=>a.add(b),new T.Vector3()).divideScalar(sides);centers.push(center);diameters.push(Math.min(...ring.map(v=>v.distanceTo(center)*2))*Math.cos(Math.PI/sides));}
 let bend=Infinity;for(let i=1;i<segments;i++){const a=centers[i-1].distanceTo(centers[i]),b=centers[i].distanceTo(centers[i+1]),c=centers[i-1].distanceTo(centers[i+1]),cross=centers[i-1].clone().sub(centers[i]).cross(centers[i+1].clone().sub(centers[i])).length();if(cross>1e-8)bend=Math.min(bend,a*b*c/(2*cross)/diameters[i]);}
 return {topology:validateMesh(o.geometry).valid,rootDiameterMm:diameters[0],tipDiameterMm:diameters.at(-1),minimumBendRadiusOverDiameter:bend};
 });if(result.sweeps.some(s=>!s.topology||s.tipDiameterMm<.7||s.rootDiameterMm<=s.tipDiameterMm||s.minimumBendRadiusOverDiameter<1))result.issues.push('SWEEP_CONSTRAINT');
 result.culet=[];
 for(const mount of m.mountings){if(!mount.head)continue;const bandSolids=[];m.group.traverse(o=>{if(o.userData.role==='shank')bandSolids.push(meshSolid(o));});bandSolids.push(meshSolid(mount.head.base));const support=getKernel().Manifold.union(bandSolids);const stone=meshSolid(mount.assembly.children.find(o=>o.userData.gem));try{const gap=stone.minGap(support,.3*.8)/.8;result.culet.push(gap);if(gap<.15-1e-5)result.issues.push('CULET_CLEARANCE');}finally{support.delete();stone.delete();bandSolids.forEach(s=>s.delete());}}
 unifyLegacy(m);result.assembly=auditAssembly(m,config);result.reason=m.engineering.reason;if(!result.assembly.valid)result.issues.push(...result.assembly.issues);
 }catch(e){result.issues.push(e.message);result.diagnostics=e.diagnostics;}finally{m?.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 result.valid=!result.issues.length;results.push(result);fs.writeFileSync(out+'/prototype-results.json',JSON.stringify(results,null,2));console.log(config.style,config.shape,config.carat,result.valid?'PASS':JSON.stringify(result.issues));globalThis.gc?.();
}
