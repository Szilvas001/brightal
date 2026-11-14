import * as T from 'three';
import {getKernel} from './kernel.mjs';
import {meshSolid} from './structural-audit.mjs';
import {outline} from './optics.mjs';
import {spacedOutline} from './stone-spacing.mjs';
// Place the whole hidden-halo row clear of the existing setting. A longer
// aperture would drill through a claw when the gemstone starts inside it.
export function hiddenHaloLayout(assembly,shape,size){
 assembly.updateWorldMatrix(true,true);
 const {Manifold}=getKernel(),parts=[],owned=[];
 try{
  for(const o of assembly.children)if(o.isMesh&&['prong','setting-rib'].includes(o.userData.role))parts.push(meshSolid(o));
  const structure=parts.length?Manifold.union(parts):null;if(structure)owned.push(structure);
  const probe=Manifold.sphere(.22,20);owned.push(probe);
  const y=-size*.42;
  const original=spacedOutline(shape,size*.86,.44,24,24),count=original.length;
  for(let step=0;step<=40;step++){
   const radius=size*.86+step*.05;
   for(const halfStep of [0,.5]){
    const points=halfStep===0?spacedOutline(shape,radius,.44,count,count):Array.from({length:count},(_,i)=>outline(shape,(i+halfStep)/count*Math.PI*2).map(v=>v*radius));
    if(points.length!==count||points.some((p,i)=>points.some((q,j)=>i!==j&&Math.hypot(p[0]-q[0],p[1]-q[1])<.44-1e-8)))continue;
    let clear=true;
    if(structure)for(const [x,z]of points){
     const center=assembly.localToWorld(new T.Vector3(x,y,z));const placed=probe.translate(center.toArray()),intersection=structure.intersect(placed);
     try{if(intersection.volume()>1e-9){clear=false;break;}}finally{intersection.delete();placed.delete();}
    }
    if(clear)return {radius,points,y};
   }
  }
  throw new Error('Hidden halo cannot clear the setting without changing its stone count');
 }finally{owned.reverse().forEach(s=>s.delete());parts.forEach(s=>s.delete());}
}
