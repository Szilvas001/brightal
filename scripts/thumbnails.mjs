import fs from 'node:fs';
import sharp from 'sharp';
import * as T from 'three';
import {PRESETS,thumbnailUrl} from '../public/builder/catalog.mjs';
import {GEM_TONES} from '../public/builder/optics.mjs';
import {buildFinishedRing} from '../public/builder/finished-model.mjs';
import {initKernel} from '../public/builder/kernel.mjs';
await initKernel();fs.mkdirSync('public/builder/thumbnails',{recursive:true});
for(const [i,p] of PRESETS.entries()) {
 const destination='public'+thumbnailUrl(p.config);
 if(process.argv.includes('--missing')&&fs.existsSync(destination))continue;
 const model=buildFinishedRing(p.config);model.group.updateMatrixWorld(true);
 const camera=new T.PerspectiveCamera(32,1.2,.1,150);camera.position.set(22,19,31);camera.lookAt(0,1.5,0);camera.updateMatrixWorld();
 const faces=[];const light=new T.Vector3(-.4,.8,1).normalize();
 model.group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,pos=g.attributes.position,idx=g.index,count=idx?idx.count:pos.count;
 for(let j=0;j<count;j+=3){const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(j+k):j+k).applyMatrix4(o.matrixWorld));const norm=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize();if(norm.dot(camera.position.clone().sub(v[0]))<0)continue;
 const z=v.reduce((sum,x)=>sum+x.clone().applyMatrix4(camera.matrixWorldInverse).z,0)/3;
 const tone=o.userData.tone||'ice';
 const base=o.userData.gem?new T.Color(tone==='ice'?'#d6e6ed':(GEM_TONES[tone]||GEM_TONES.ice).color):o.material.color.clone();const shade=o.userData.gem?.75+.25*Math.abs(norm.dot(light)):.45+.55*Math.max(0,norm.dot(light));base.multiplyScalar(shade);
 faces.push({z,path:v.map(x=>{x.project(camera);return `${((x.x+1)*150).toFixed(1)},${((1-x.y)*125).toFixed(1)}`;}).join(' '),fill:'#'+base.getHexString()});
 }});
 faces.sort((a,b)=>a.z-b.z);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 250"><rect width="300" height="250" fill="#fcfaf7"/>${faces.map(f=>`<polygon points="${f.path}" fill="${f.fill}"/>`).join('')}</svg>`;
 await sharp(Buffer.from(svg)).webp({quality:86}).toFile(destination);
 model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});console.log(i,p.config.style);
}
