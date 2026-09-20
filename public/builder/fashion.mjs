import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const FASHION_STYLES = ['wave', 'rope', 'dome', 'signet', 'open', 'stack'];

// Visual-concept jewelry, in the same scene scale as the classic collection.
// A family has its own construction, rather than a center-stone substitution.
export function buildFashion(s, metal, secondary) {
  const group = new T.Group(), radius = s.size / (2 * Math.PI) * .8, width = s.width * .8;
  const add = (g, m = metal) => { const o = new T.Mesh(g, m); group.add(o); return o; };
  const sweep = (center, radial, axial, material = metal, closed = true, start = 0, end = Math.PI * 2) => {
    const p = [], indices = [], n = 224, sides = 32;
    for (let i = 0; i <= n; i++) {
      const a = start + (end - start) * i / n, c = center(a);
      for (let j = 0; j <= sides; j++) {
        const b = j / sides * Math.PI * 2, r = radial(a) * Math.cos(b);
        p.push(c[0] + Math.sin(a) * r, c[1] + Math.cos(a) * r, c[2] + axial(a) * Math.sin(b));
        if (i < n && j < sides) { const k = i * (sides + 1) + j; indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1); }
      }
    }
    if (!closed) for (const i of [0,n]) {
      const c = center(start + (end-start)*i/n), k = p.length/3;
      p.push(...c);
      for(let j=0;j<sides;j++) { const b=i*(sides+1)+j; if(i===0) indices.push(k,b+1,b); else indices.push(k,b,b+1); }
    }
    const raw=new T.BufferGeometry(); raw.setAttribute('position',new T.Float32BufferAttribute(p,3)); raw.setIndex(indices);
    const g=mergeVertices(raw,.00001); raw.dispose(); g.computeVertexNormals(); return add(g,material);
  };
  const center=(a,z=0,r=radius)=>[Math.sin(a)*r,Math.cos(a)*r,z];
  const accent=s.mixedMetal?secondary:metal;
  if(s.style==='wave') {
    sweep(a=>center(a,Math.sin(a*s.rhythm)*s.sculpt*.65),()=>.48,()=>width*.5);
  } else if(s.style==='rope') {
    for(const phase of [0,Math.PI]) sweep(a=>center(a,Math.sin(a*s.rhythm+phase)*width*.31,radius+Math.cos(a*s.rhythm+phase)*width*.31),()=>width*.27,()=>width*.27,phase===0?metal:accent);
  } else if(s.style==='dome') {
    sweep(a=>center(a,0,radius+Math.pow(Math.max(0,Math.cos(a)),3)*s.sculpt*.5),a=>.6+Math.pow(Math.max(0,Math.cos(a)),3)*s.sculpt*.5,()=>width*.5);
  } else if(s.style==='stack') {
    for(let i=0;i<s.layers;i++) sweep(a=>center(a,(i-(s.layers-1)/2)*(width+s.gap*.8)),()=>.52,()=>width*.5,i%2?accent:metal);
  } else if(s.style==='open') {
    const opening=.2+s.gap*.3;
    sweep(a=>center(a,Math.cos(a/2)*s.sculpt*.6),()=>.55,()=>width*.5,metal,false,opening,Math.PI*2-opening);
    for(const a of [opening,Math.PI*2-opening]) { const o=add(new T.SphereGeometry(1,32,24),accent); o.position.set(...center(a,Math.cos(a/2)*s.sculpt*.6)); o.scale.set(.72,.72,width*.62); }
  } else if(s.style==='signet') {
    sweep(a=>center(a),a=>.6+Math.pow(Math.max(0,Math.cos(a)),6)*.55,a=>width*.5+Math.pow(Math.max(0,Math.cos(a)),6)*s.faceSize*.14);
    const shape = new T.Shape(), size=s.faceSize*.4;
    for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,c=Math.cos(a),v=Math.sin(a),power=s.face==='cushion'?.45:1;
      const x=Math.sign(c)*Math.pow(Math.abs(c),power)*size,z=Math.sign(v)*Math.pow(Math.abs(v),power)*size*(s.face==='oval'?1.25:1);
      if(i===0)shape.moveTo(x,z);else shape.lineTo(x,z);
    }
    const face=add(new T.ExtrudeGeometry(shape,{depth:.55,bevelEnabled:true,bevelSize:.2,bevelThickness:.18,bevelSegments:4,steps:1}),accent);
    face.rotation.x=-Math.PI/2; face.position.y=radius+.5;
    if(s.inlay!=='metal') {
      const colors={onyx:0x101820,ivory:0xe8dfc7,teal:0x087d82,coral:0xbf5c50};
      const inset=add(new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.09,bevelThickness:.05,bevelSegments:3}),new T.MeshPhysicalMaterial({color:colors[s.inlay],roughness:.19,metalness:0,clearcoat:1,clearcoatRoughness:.1}));
      inset.rotation.x=-Math.PI/2; inset.scale.set(.87,.87,1); inset.position.y=radius+1.13;
    }
  }
  group.updateMatrixWorld(true);
  // Secondary metal may be unused; dispose it immediately in that case.
  if(!s.mixedMetal) secondary.dispose();
  return {group,gems:[],radius,width,metal};
}
