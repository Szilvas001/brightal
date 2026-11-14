import * as T from 'three';
import {getKernel} from './kernel.mjs';
import {validateMesh,removeCollapsedTriangles,removeOppositeCoincidentTriangles} from './validation.mjs';
// Failed legacy assemblies are diagnostic concepts only. The UI must not
// display them as finished models, and exports retain the failed validation.
export function checkModel(model) {
 const checks=[];model.group.traverse(o=>{if(o.isMesh&&!o.userData.gem)checks.push(validateMesh(removeCollapsedTriangles(o.geometry)));});
 const valid=checks.length===1&&checks[0].valid;
 model.engineering={...model.engineering,meshValidation:{valid,parts:checks.length,checks},requiresWorkshopApproval:true};
 return model;
}

import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// One raw metal part as a closed Manifold solid in world coordinates. Shared by
// the union below and by the independent rule audit (geometry-rules.mjs).
export function meshToSolid(o,originalId) {
   const {Manifold,Mesh}=getKernel();
   let geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);for(const key of Object.keys(geo.attributes))if(key!=='position')geo.deleteAttribute(key);
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
   const options={numProp:3,vertProperties:new Float32Array(positions),triVerts:new Uint32Array(indices)};
   if(originalId!==undefined){options.runIndex=new Uint32Array([0,indices.length]);options.runOriginalID=new Uint32Array([originalId]);}
   const m=new Mesh(options);m.merge();geo.dispose();
   const solid=new Manifold(m);if(solid.status()!=='NoError'){const status=solid.status();solid.delete();throw new Error(status);}return solid;
}
export function unifyLegacy(model) {
 if(model.engineering?.metalSolids===1)return checkModel(model);
 const {Manifold,Mesh}=getKernel(),owned=[],own=x=>(owned.push(x),x),metals=[],gems=[];
 model.group.updateMatrixWorld(true);
 model.group.traverse(o=>{if(o.isMesh)(o.userData.gem?gems:metals).push(o);});
 try {
  const sourceMaterials=[...new Set(metals.map(o=>o.material))];
  const materialIds=new Map(sourceMaterials.map(m=>[m,Manifold.reserveIDs(1)]));
  const colorsById=new Map(sourceMaterials.map(m=>[materialIds.get(m),m.color]));
  const solids=metals.map(o=>own(meshToSolid(o,materialIds.get(o.material))));
  let body=own(Manifold.union(solids));
  // All stone cavities are cut in one Boolean: stones never overlap each other.
  const cavities=gems.map(o=>{const p=o.geometry.attributes.position,verts=[];const center=o.getWorldPosition(new T.Vector3());for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);v.add(v.clone().sub(center).normalize().multiplyScalar(.008));verts.push(v.toArray());}return own(Manifold.hull(verts));});
  if(cavities.length)body=own(body.subtract(own(Manifold.union(cavities))));
  // Small pavé/halo seats need an opening on the visible crown side. An
  // entirely enclosed subtraction is a negative cavity shell, not removable
  // debris; deleting it would silently fill the gemstone volume back in.
  const shells=body.decompose();
  const enclosed=shells.filter(p=>p.volume()<-.000000001).map(p=>p.boundingBox());
  shells.forEach(p=>p.delete());
  const openings=[];
  for(const o of gems.filter(g=>!g.userData.hero)){
    const center=o.getWorldPosition(new T.Vector3()).toArray();
    if(!enclosed.some(box=>center.every((v,i)=>v>=box.min[i]-.01&&v<=box.max[i]+.01)))continue;
    const p=o.geometry.attributes.position,verts=[];
    const scale=o.getWorldScale(new T.Vector3()).y;
    for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i))<.03){
      for(const y of [.018,.22/scale])
        verts.push(new T.Vector3(p.getX(i)*1.01,y,p.getZ(i)*1.01).applyMatrix4(o.matrixWorld).toArray());
    }
    if(verts.length)openings.push(own(Manifold.hull(verts)));
  }
  if(openings.length)body=own(body.subtract(own(Manifold.union(openings))));
  let parts=body.decompose();parts.sort((a,b)=>b.volume()-a.volume());
  // A closed bubble smaller than 0.0002 mm³ is a numerical sliver between two
  // touching surfaces, not a stone seat (the smallest seat is a thousand times
  // larger). It is filled with metal, i.e. its inward-facing shell is dropped.
  const bubbles=parts.filter(p=>p.volume()<0&&p.volume()>-.0001);
  const filledVoids=bubbles.length;
  if(filledVoids){parts=parts.filter(p=>!bubbles.includes(p));bubbles.forEach(p=>p.delete());body=own(Manifold.compose(parts));}
  // Exact cavity cuts may leave minute isolated claw-tip slivers. Remove only
  // sub-0.02 scene-unit^3 debris; any structural island fails validation.
  if(body.status()!=='NoError'||body.isEmpty()||parts.slice(1).some(p=>p.volume()>.02||p.volume()<-.000000001)){const volumes=parts.map(p=>Number((p.volume()/(.8**3)).toFixed(6)));parts.forEach(p=>p.delete());throw new Error('Assembly is not a single metal solid; component volumes mm3: '+volumes.join(', '));}
  // Record what was discarded: the geometry rules treat any removed metal as a defect.
  const removedDebris=parts.slice(1).reduce((sum,p)=>sum+Math.abs(p.volume()),0)/(.8**3),removedDebrisParts=parts.length-1;
  if(parts.length>1){body=own(parts[0]);parts.slice(1).forEach(p=>p.delete());}else parts.forEach(p=>p.delete());
  // Collapse sub-micron Boolean slivers before Float32 export. The tolerance
  // starts 800 times below the stone clearance; where two rods cross at a very
  // shallow angle the slivers are longer, and only then is it raised (to at
  // most 0.0006 mm, still far below any designed feature). Every attempt is
  // rechecked triangle by triangle.
  let mesh,geo,checked;
  for(const tolerance of [.00001,.0001,.0005]){
    geo?.dispose();
    const cleaned=own(body.simplify(tolerance));
    mesh=cleaned.getMesh();geo=new T.BufferGeometry();const xyz=[];for(let i=0;i<mesh.vertProperties.length;i+=mesh.numProp)xyz.push(...mesh.vertProperties.slice(i,i+3));
    geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setIndex(Array.from(mesh.triVerts));geo.computeVertexNormals();
    removeOppositeCoincidentTriangles(geo);
    geo.computeVertexNormals();
    checked=validateMesh(removeCollapsedTriangles(geo));
    if(!checked.valid&&checked.nonFinite===0&&checked.components===1){
      // Float32 exports can separate the ends of a collapsed edge by one ULP.
      // Snap only as a fallback, at a 0.000001 scene-unit grid (0.00000125 mm).
      // Keep original indices for material provenance, and recheck every surface.
      const p=geo.attributes.position,grid=.000001;
      for(let i=0;i<p.count;i++)p.setXYZ(i,Math.round(p.getX(i)/grid)*grid,Math.round(p.getY(i)/grid)*grid,Math.round(p.getZ(i)/grid)*grid);
      removeOppositeCoincidentTriangles(geo);removeCollapsedTriangles(geo);geo.computeVertexNormals();
      checked=validateMesh(geo);
    }
    if(checked.valid)break;
  }
  if(!checked.valid){geo.dispose();throw new Error('Triangle validation failed: '+JSON.stringify(checked));}
  const material=metals[0].material.clone();
  if(sourceMaterials.length>1) {
   // Preserve the alloy of each original face through the Boolean union.
   // Vertex colours keep one closed mesh and one physical finish/material.
   const faceColors=new Map();
   for(let run=0;run<mesh.runOriginalID.length;run++) {
    const color=colorsById.get(mesh.runOriginalID[run])||sourceMaterials.at(-1).color;
    for(let i=mesh.runIndex[run];i<mesh.runIndex[run+1];i+=3)faceColors.set(mesh.triVerts.slice(i,i+3).join(','),color);
   }
   const colors=[],index=geo.index.array;
   for(let i=0;i<index.length;i+=3) {
    const color=faceColors.get(Array.from(index.slice(i,i+3)).join(','))||sourceMaterials.at(-1).color;
    for(let j=0;j<3;j++)colors.push(color.r,color.g,color.b);
   }
   const coloured=geo.toNonIndexed();geo.dispose();
   coloured.setAttribute('color',new T.Float32BufferAttribute(colors,3));
   material.color.set(0xffffff);material.vertexColors=true;
   const metal=new T.Mesh(coloured,material);metal.userData.role='unified-metal';model.group.add(metal);
  } else {
   const metal=new T.Mesh(geo,material);metal.userData.role='unified-metal';model.group.add(metal);
  }
  metals.forEach(o=>o.removeFromParent());
  const geometry=new Set(metals.map(o=>o.geometry)),materials=new Set(metals.map(o=>o.material));geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  model.engineering={status:'geometry_checked',removedDebrisMm3:removedDebris,metalSolids:1,volumeMm3:body.volume()/(.8**3),units:'mm',requiresWorkshopApproval:true};return checkModel(model);
 } catch(error){checkModel(model);model.engineering.status='requires_cad_repair';model.engineering.reason=error.message;return model;}
 finally{for(let i=owned.length-1;i>=0;i--)owned[i].delete();}
}
