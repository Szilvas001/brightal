import * as T from 'three';
import {getKernel} from './kernel.mjs';
import {validateMesh,removeCollapsedTriangles} from './validation.mjs';
// Legacy assemblies remain visible when they cannot pass a true solid check.
// Exports explicitly carry that result rather than claiming manufacturing approval.
export function checkModel(model) {
 const checks=[];model.group.traverse(o=>{if(o.isMesh&&!o.userData.gem)checks.push(validateMesh(removeCollapsedTriangles(o.geometry)));});
 const valid=checks.length===1&&checks[0].valid;
 model.engineering={...model.engineering,meshValidation:{valid,parts:checks.length,checks},requiresWorkshopApproval:true};
 return model;
}

import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
export function unifyLegacy(model) {
 if(model.engineering?.metalSolids===1)return checkModel(model);
 const {Manifold,Mesh}=getKernel(),owned=[],own=x=>(owned.push(x),x),metals=[],gems=[];
 model.group.updateMatrixWorld(true);
 model.group.traverse(o=>{if(o.isMesh)(o.userData.gem?gems:metals).push(o);});
 try {
  const solids=metals.map(o=>{
   let geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);geo.deleteAttribute('normal');geo.deleteAttribute('uv');
   // TubeGeometry has open ends. Seal each boundary loop before the Boolean union.
   geo=mergeVertices(geo,1e-5);
   const positions=Array.from(geo.attributes.position.array),indices=Array.from(geo.index.array),edge=new Map();
   for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){const a=indices[i+j],b=indices[i+(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');if(edge.has(key))edge.delete(key);else edge.set(key,[a,b]);}
   const boundary=[...edge.values()];
   while(boundary.length){const [a,b]=boundary.pop(),loop=[a,b];let last=b;
    while(last!==a){const at=boundary.findIndex(e=>e[0]===last);if(at<0)throw new Error('Open boundary cannot be sealed');const next=boundary.splice(at,1)[0][1];loop.push(next);last=next;}
    loop.pop();const center=positions.length/3,mean=[0,0,0];for(const v of loop)for(let j=0;j<3;j++)mean[j]+=positions[v*3+j]/loop.length;positions.push(...mean);
    for(let j=0;j<loop.length;j++)indices.push(loop[(j+1)%loop.length],loop[j],center);
   }
   const m=new Mesh({numProp:3,vertProperties:new Float32Array(positions),triVerts:new Uint32Array(indices)});m.merge();geo.dispose();
   const solid=own(new Manifold(m));if(solid.status()!=='NoError')throw new Error(solid.status());return solid;
  });
  let body=own(Manifold.union(solids));
  for(const o of gems){const p=o.geometry.attributes.position,verts=[];for(let i=0;i<p.count;i++)verts.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).toArray());body=own(body.subtract(own(Manifold.hull(verts))));}
  const parts=body.decompose();parts.sort((a,b)=>b.volume()-a.volume());
  // Exact cavity cuts may leave minute isolated claw-tip slivers. Remove only
  // sub-0.02 scene-unit^3 debris; any structural island fails validation.
  if(body.status()!=='NoError'||body.isEmpty()||parts.slice(1).some(p=>p.volume()>.02)){parts.forEach(p=>p.delete());throw new Error('Assembly is not a single metal solid');}
  if(parts.length>1){body=own(parts[0]);parts.slice(1).forEach(p=>p.delete());}else parts.forEach(p=>p.delete());
  body=own(body.simplify(.0001));
  const mesh=body.getMesh(),geo=new T.BufferGeometry(),xyz=[];for(let i=0;i<mesh.vertProperties.length;i+=mesh.numProp)xyz.push(...mesh.vertProperties.slice(i,i+3));
  geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setIndex(Array.from(mesh.triVerts));geo.computeVertexNormals();
  const checked=validateMesh(removeCollapsedTriangles(geo));if(!checked.valid){geo.dispose();throw new Error('Triangle validation failed: '+JSON.stringify(checked));}
  const material=metals[0].material.clone();metals.forEach(o=>o.removeFromParent());const metal=new T.Mesh(geo,material);metal.userData.role='unified-metal';model.group.add(metal);
  const geometry=new Set(metals.map(o=>o.geometry)),materials=new Set(metals.map(o=>o.material));geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  model.engineering={status:'geometry_checked',metalSolids:1,volumeMm3:body.volume()/(.8**3),units:'mm',requiresWorkshopApproval:true};return checkModel(model);
 } catch(error){checkModel(model);model.engineering.status='requires_cad_repair';model.engineering.reason=error.message;return model;}
 finally{for(let i=owned.length-1;i>=0;i--)owned[i].delete();}
}
