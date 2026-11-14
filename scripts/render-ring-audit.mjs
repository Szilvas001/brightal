import fs from 'node:fs';
import sharp from 'sharp';
import * as T from 'three';
import {PRESETS} from '../public/builder/catalog.mjs';
import {buildFinishedRing} from '../public/builder/finished-model.mjs';
import {initKernel} from '../public/builder/kernel.mjs';
const arg=(key,fallback)=>process.argv.find(x=>x.startsWith('--'+key+'='))?.split('=').slice(1).join('=')||fallback;
const out=arg('out','docs/audits/2026-11-14/views'),styles=arg('styles','').split(',');fs.mkdirSync(out,{recursive:true});await initKernel();
for(const {config}of PRESETS){if(styles[0]&&!styles.includes(config.style))continue;const model=buildFinishedRing(config);model.group.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(model.group),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),span=Math.max(size.x,size.y,size.z)*1.16;
 const panels=[];
 for(const [label,direction]of [['front',[0,0,1]],['back',[0,0,-1]],['left',[-1,0,0]],['right',[1,0,0]]]){
  const camera=new T.OrthographicCamera(-span/2,span/2,span/2,-span/2,.01,200);camera.position.copy(center).add(new T.Vector3(...direction).multiplyScalar(70));camera.lookAt(center);camera.updateMatrixWorld();const faces=[];
  model.group.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,idx=o.geometry.index;
   for(let j=0;j<(idx?idx.count:p.count);j+=3){const raw=[0,1,2].map(k=>idx?idx.getX(j+k):j+k),v=raw.map(k=>new T.Vector3().fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld));const n=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize();if(n.dot(camera.position.clone().sub(v[0]))<=0)continue;
    const depth=v.reduce((a,q)=>a+q.clone().applyMatrix4(camera.matrixWorldInverse).z,0)/3;
    const color=o.userData.gem?new T.Color('#c4deed'):o.geometry.attributes.color?new T.Color().fromBufferAttribute(o.geometry.attributes.color,raw[0]):o.material.color.clone();color.multiplyScalar(.45+.55*Math.abs(n.dot(new T.Vector3(.4,.8,.7).normalize())));
    faces.push({depth,color:'#'+color.getHexString(),points:v.map(q=>{q.project(camera);return `${((q.x+1)*300).toFixed(2)},${((1-q.y)*300).toFixed(2)}`;}).join(' ')});
   }
  });faces.sort((a,b)=>a.depth-b.depth);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="640"><rect width="600" height="640" fill="#fcfaf7"/>${faces.map(f=>`<polygon points="${f.points}" fill="${f.color}"/>`).join('')}<text x="18" y="625" font-size="18">${config.style} · ${label} · ${model.engineering.assemblyValidation.valid?'mesh checks pass':'INVALID'}</text></svg>`;
  const png=await sharp(Buffer.from(svg)).png().toBuffer();fs.writeFileSync(`${out}/${config.style}-${label}.png`,png);panels.push(png);
 }
 await sharp({create:{width:1200,height:1280,channels:3,background:'#fcfaf7'}}).composite(panels.map((input,i)=>({input,left:(i%2)*600,top:Math.floor(i/2)*640}))).png().toFile(`${out}/${config.style}-four-views.png`);
 fs.writeFileSync(`${out}/${config.style}.json`,JSON.stringify({config,engineering:model.engineering},null,2));model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});console.log(config.style);globalThis.gc?.();
}
