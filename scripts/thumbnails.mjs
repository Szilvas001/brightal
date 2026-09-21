import fs from 'node:fs';
import sharp from 'sharp';
import * as T from 'three';
import {PRESETS} from '../public/builder/catalog.mjs';
import {buildRing} from '../public/builder/model.mjs';
import {initKernel} from '../public/builder/kernel.mjs';
await initKernel();fs.mkdirSync('public/builder/thumbnails',{recursive:true});
for(const [i,p] of PRESETS.entries()) {
 const model=buildRing(p.config,null);model.group.updateMatrixWorld(true);
 const camera=new T.PerspectiveCamera(32,1.2,.1,150);camera.position.set(22,19,31);camera.lookAt(0,1.5,0);camera.updateMatrixWorld();
 const faces=[];const light=new T.Vector3(-.4,.8,1).normalize();
 model.group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,pos=g.attributes.position,idx=g.index,count=idx?idx.count:pos.count;
 for(let j=0;j<count;j+=3){const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(j+k):j+k).applyMatrix4(o.matrixWorld));const norm=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize();if(norm.dot(camera.position.clone().sub(v[0]))<0)continue;
 const z=v.reduce((sum,x)=>sum+x.clone().applyMatrix4(camera.matrixWorldInverse).z,0)/3;
 const base=o.userData.gem?new T.Color('#d6e6ed'):o.material.color.clone();const shade=o.userData.gem?.75+.25*Math.abs(norm.dot(light)):.45+.55*Math.max(0,norm.dot(light));base.multiplyScalar(shade);
 faces.push({z,path:v.map(x=>{x.project(camera);return `${((x.x+1)*150).toFixed(1)},${((1-x.y)*125).toFixed(1)}`;}).join(' '),fill:'#'+base.getHexString()});
 }});
 faces.sort((a,b)=>a.z-b.z);
 fs.writeFileSync(`public/builder/thumbnails/preset-${i}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 250"><rect width="300" height="250" fill="#fcfaf7"/>${faces.map(f=>`<polygon points="${f.path}" fill="${f.fill}"/>`).join('')}</svg>`);
 await sharp(`public/builder/thumbnails/preset-${i}.svg`).webp({quality:86}).toFile(`public/builder/thumbnails/preset-${i}.webp`);fs.unlinkSync(`public/builder/thumbnails/preset-${i}.svg`);
 model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});console.log(i,p.config.style);
}
