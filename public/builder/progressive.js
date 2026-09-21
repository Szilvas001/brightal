import * as T from 'three';
import { modernLayout, MODERN_STYLES } from './contemporary.mjs';
import { gemGeometry, gemstoneMaterial } from './optics.mjs';
import { METAL_COLORS, buildRing } from './model.mjs';
// Preview uses the same dimensional layout, but omits expensive Boolean seats.
// Never exported or accepted as an engineering-checked model.
export function previewModel(s,environment) {
  if(!MODERN_STYLES.includes(s.style)) return buildRing(s,environment);
  const layout=modernLayout(s),group=new T.Group(),gems=[];
  const positions=[],indices=[],n=80,m=16;
  for(let i=0;i<n;i++) {
    const a=i*2*Math.PI/n;
    for(let j=0;j<m;j++) {
      const b=j*2*Math.PI/m,co=Math.cos(b),si=Math.sin(b);
      const r=layout.inner+layout.thicknessAt(a)*(.5+.5*Math.sign(co)*Math.abs(co)**.55);
      positions.push(Math.sin(a)*r*.8,Math.cos(a)*r*.8,(layout.shift(a)+layout.widthAt(a)*.5*Math.sign(si)*Math.abs(si)**.55)*.8);
      const k=i*m+j,q=i*m+(j+1)%m,next=(i+1)%n*m+j,nextQ=(i+1)%n*m+(j+1)%m;
      indices.push(k,q,next,q,nextQ,next);
    }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
  const metal=new T.MeshPhysicalMaterial({color:METAL_COLORS[s.metal],metalness:1,roughness:s.finish==='polished'?.13:.32});
  group.add(new T.Mesh(geo,metal));
  for(const stone of layout.stones) {
    const {geometry,planes}=gemGeometry(stone.shape);geometry.computeBoundingBox();
    const d=geometry.boundingBox.getSize(new T.Vector3());
    const gem=new T.Mesh(geometry,gemstoneMaterial(planes,environment,stone.tone,s.color,s.light,s.fire));
    gem.matrixAutoUpdate=false;
    gem.matrix.makeScale(.8,.8,.8).multiply(new T.Matrix4().makeRotationZ(-stone.angle)).multiply(new T.Matrix4().makeTranslation(0,stone.girdleRadius,stone.z)).multiply(new T.Matrix4().makeRotationY(stone.rotation)).multiply(new T.Matrix4().makeScale(stone.width/d.x,stone.depth/d.y,stone.length/d.z));
    gem.userData.gem=true;group.add(gem);gems.push(gem);
  }
  return {group,gems,radius:(layout.inner+layout.thickness/2)*.8,width:layout.width*.8};
}
export function unpackModel(packed,environment) {
  const group=new T.ObjectLoader().parse(packed.object),gems=[];
  group.traverse(o=>{if(o.userData.gem){o.material.uniforms.environment.value=environment;
    o.material.uniforms.planes.value=o.material.uniforms.planes.value.map(v=>new T.Vector4(v.x,v.y,v.z,v.w));gems.push(o);}});
  return {...packed,group,gems};
}
