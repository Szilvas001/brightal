import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {getKernel} from './kernel.mjs';
import {MIN_ROD_DIAMETER_MM,MIN_PRONG_DIAMETER_MM} from './manufacturing-policy.mjs';
export const SCENE_PER_MM=.8;
// Independent mesh conversion: no inferred primitive or renderer bounding box.
export function meshSolid(object) {
 const {Mesh,Manifold}=getKernel();
 let g=object.geometry.clone().applyMatrix4(object.matrixWorld);
 for(const key of Object.keys(g.attributes))if(key!=='position')g.deleteAttribute(key);
 const welded=mergeVertices(g,1e-6);g.dispose();g=welded;
 try {
  const input=new Mesh({numProp:3,vertProperties:g.attributes.position.array,triVerts:new Uint32Array(g.index.array)});input.merge();
  const solid=new Manifold(input);
  if(solid.status()!=='NoError'||!Number.isFinite(solid.volume())||solid.volume()<=0){solid.delete();throw new Error('INVALID_SOURCE_SOLID');}
  return solid;
 }finally{g.dispose();}
}
export function overlapMm3(a,b){const intersection=a.intersect(b);try{return intersection.volume()/SCENE_PER_MM**3;}finally{intersection.delete();}}
export function mirrorDifferenceMm3(solid,axis){const normal=[0,0,0];normal[axis]=1;const mirror=solid.mirror(normal);try{const a=solid.subtract(mirror),b=mirror.subtract(solid);try{return (a.volume()+b.volume())/SCENE_PER_MM**3;}finally{a.delete();b.delete();}}finally{mirror.delete();}}
// The relation is measured BEFORE Boolean fusion can conceal a bad joint.
export function auditSupportJoints(model) {
 model.group.updateMatrixWorld(true);
 const cache=new Map(),joints=[],issues=[];
 const solid=o=>{if(!cache.has(o))cache.set(o,meshSolid(o));return cache.get(o);};
 try {
  for(const [i,c]of (model.contacts||[]).entries()){
   const shankOverlapMm3=overlapMm3(solid(c.support),solid(c.band));
   const galleryOverlapMm3=overlapMm3(solid(c.support),solid(c.gallery));
   joints.push({index:i,shankOverlapMm3,galleryOverlapMm3});
   if(!(shankOverlapMm3>1e-6&&galleryOverlapMm3>1e-6))issues.push({rule:'B',code:'SUPPORT_JOINT_HAS_NO_VOLUME',index:i});
  }
  // Compare the actual union of support meshes, not their declared flags.
  const symmetry=[];
  for(const [index,mount]of (model.mountings||[]).entries()){
   const members=(model.contacts||[]).filter(c=>c.gallery===mount.gallery);
   const parts=members.map(c=>solid(c.support));
   if(!parts.length)continue;
   const union=getKernel().Manifold.union(parts);
   try {
    // Only a centred, axis-aligned mounting defines the global ring mirror
    // planes. Off-centre duet/side settings are reported as unverified here.
    const center=mount.assembly.getWorldPosition(new T.Vector3());
    if(Math.hypot(center.x,center.z)>1e-6){symmetry.push({index,status:'not-tested',reason:'off-centre mounting requires paired mounting comparison'});continue;}
    const rotation=mount.assembly.rotation.y,axes=mount.shape==='pear'?[Math.abs(Math.sin(rotation))>.5?2:0]:[0,2];
    for(const axis of axes){const differenceMm3=mirrorDifferenceMm3(union,axis);symmetry.push({index,axis,differenceMm3});if(differenceMm3>.001)issues.push({rule:'A',code:'SUPPORT_MIRROR_MISMATCH',index,axis,differenceMm3});}
   }finally{union.delete();}
  }
  return {valid:issues.length===0,issues,joints,symmetry,coverage:{jointVolume:true,centredSupportMirror:true,offCentreSupportMirror:false,prongAngularDistribution:false,minimumWallThickness:false,stoneRetention:false}};
 }finally{for(const s of cache.values())s.delete();}
}
// A cylinder intersection detects a triangle spanning the bore even when all
// its vertices lie outside it (the old vertex-only test could miss that).
export function auditBoreVolume(model,config){
 const {Manifold}=getKernel();model.group.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(model.group),radius=(config.size/(2*Math.PI)-.03)*SCENE_PER_MM;
 const cylinder=Manifold.cylinder(bounds.max.z-bounds.min.z+2,radius,radius,256),bore=cylinder.translate([0,0,bounds.min.z-1]);
 const intersections=[];
 try{model.group.traverse(o=>{if(!o.isMesh)return;const s=meshSolid(o);try{const volume=overlapMm3(s,bore);if(volume>1e-5)intersections.push({role:o.userData.gem?'gem':'metal',overlapMm3:volume});}finally{s.delete();}});}finally{cylinder.delete();bore.delete();}
 return {valid:intersections.length===0,intersections,toleranceMm3:1e-5,radialToleranceMm:.03,cylinderSegments:256};
}

// Sample transverse diameters on the actual source rod mesh. This establishes
// concrete failures, not a proof of the global minimum after stone subtraction.
// The separate CAD pipeline accepts >=0.7 mm prongs and >=0.6 mm walls.
export function auditRodThickness(model){
 model.group.updateMatrixWorld(true);const rods=[],issues=[];
 model.group.traverse(o=>{
  const path=o.geometry?.parameters?.path;if(!o.isMesh||!path?.curves?.length)return;
  const solid=meshSolid(o);let minimumMm=Infinity,samples=0;
  try{for(const segment of path.curves){const a=segment.getPoint(0).applyMatrix4(o.matrixWorld),b=segment.getPoint(1).applyMatrix4(o.matrixWorld),tangent=b.clone().sub(a).normalize();
   const helper=Math.abs(tangent.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0),u=new T.Vector3().crossVectors(tangent,helper).normalize(),v=new T.Vector3().crossVectors(tangent,u).normalize();
   for(const fraction of [.25,.5,.75])for(let i=0;i<4;i++){
    const center=a.clone().lerp(b,fraction),direction=u.clone().multiplyScalar(Math.cos(i*Math.PI/4)).addScaledVector(v,Math.sin(i*Math.PI/4));
    const distances=[1,-1].map(sign=>{const hits=solid.rayCast(center.toArray(),center.clone().addScaledVector(direction,sign*10).toArray());return hits.length?new T.Vector3(...hits[0].position).distanceTo(center):NaN;});
    if(distances.every(Number.isFinite)){minimumMm=Math.min(minimumMm,(distances[0]+distances[1])/SCENE_PER_MM);samples++;}
   }
  }}finally{solid.delete();}
  const requiredMm=o.userData.role==='prong'?MIN_PRONG_DIAMETER_MM:MIN_ROD_DIAMETER_MM,index=rods.length;rods.push({index,role:o.userData.role||'rod',minimumSampledDiameterMm:minimumMm,samples,requiredMm});
  if(!samples||minimumMm<requiredMm-1e-4)issues.push({rule:'D',code:!samples?'THICKNESS_UNMEASURED':'ROD_TOO_THIN',index,minimumSampledDiameterMm:minimumMm,requiredMm});
 });
 return {valid:issues.length===0,issues,rods,method:'12 transverse mesh ray pairs per straight segment, before final stone subtraction',globalMinimumProven:false};
}
