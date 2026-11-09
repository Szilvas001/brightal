import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {getKernel} from './kernel.mjs';
// All gemstone meshes are convex faceted solids. Broad-phase boxes avoid
// Boolean work for distant stones; intersections are measured in mm³.
export function auditStoneCollisions(model) {
 const {Manifold}=getKernel(),stones=[],solids=new Map(),collisions=[];
 model.group.updateMatrixWorld(true);
 model.group.traverse(o=>{if(o.isMesh&&o.userData.gem)stones.push(o);});
 const boxes=stones.map(o=>new T.Box3().setFromObject(o));
 const solid=i=>{if(!solids.has(i)){const o=stones[i],p=o.geometry.attributes.position,vertices=[];for(let j=0;j<p.count;j++)vertices.push(new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld).toArray());solids.set(i,Manifold.hull(vertices));}return solids.get(i);};
 try{for(let i=0;i<stones.length;i++)for(let j=i+1;j<stones.length;j++){
  if(!boxes[i].intersectsBox(boxes[j]))continue;
  const intersection=solid(i).intersect(solid(j));
  try{const volume=intersection.volume()/(.8**3);if(volume>1e-5)collisions.push({stones:[i,j],overlapMm3:volume});}finally{intersection.delete();}
 }}finally{for(const s of solids.values())s.delete();}
 return {valid:collisions.length===0,stoneCount:stones.length,collisions,toleranceMm3:1e-5};
}

export function auditAssembly(model,config){
 const stones=auditStoneCollisions(model),issues=[];
 if(!model.engineering?.meshValidation?.valid||model.engineering?.status==='requires_cad_repair')issues.push('METAL_NOT_CLOSED');
 if(!stones.valid)issues.push('STONES_INTERSECT');
 let metal=null;
 if(model.engineering?.meshValidation?.valid){try{metal=auditMetalPenetration(model);if(!metal.valid)issues.push('METAL_INTERSECTS_STONE');}catch{issues.push('METAL_AUDIT_FAILED');}}
 let bore=Infinity;
 model.group.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);bore=Math.min(bore,Math.hypot(v.x,v.y)/.8);}});
 const requested=config.size/(2*Math.PI);
 if(bore<requested-.03)issues.push('FINGER_CLEARANCE');
 return {valid:issues.length===0,issues,stones,metal,minimumBoreRadiusMm:bore,requestedBoreRadiusMm:requested,boreToleranceMm:.03,requiresWorkshopApproval:true};
}

// Independent check of final metal against gemstones. Contact is permitted;
// positive-volume penetration beyond the numerical tolerance is not.
export function auditMetalPenetration(model){
 const {Manifold,Mesh}=getKernel(),owned=[],metals=[],stones=[],collisions=[];
 model.group.updateMatrixWorld(true);
 try{
  model.group.traverse(o=>{if(!o.isMesh)return;if(o.userData.gem){stones.push(o);return;}
   let g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);for(const key of Object.keys(g.attributes))if(key!=='position')g.deleteAttribute(key);const welded=mergeVertices(g,1e-6);g.dispose();g=welded;
   const mesh=new Mesh({numProp:3,vertProperties:g.attributes.position.array,triVerts:new Uint32Array(g.index.array)});mesh.merge();g.dispose();const s=new Manifold(mesh);owned.push(s);metals.push(s);
  });
  for(let i=0;i<stones.length;i++){const o=stones[i],p=o.geometry.attributes.position,vertices=[];for(let j=0;j<p.count;j++)vertices.push(new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld).toArray());const stone=Manifold.hull(vertices);owned.push(stone);
   for(const metal of metals){const part=metal.intersect(stone);try{const volume=part.volume()/.8**3;if(volume>.001)collisions.push({stone:i,overlapMm3:volume});}finally{part.delete();}}
  }
  return {valid:collisions.length===0,collisions,toleranceMm3:.001};
 }finally{owned.forEach(s=>s.delete());}
}
