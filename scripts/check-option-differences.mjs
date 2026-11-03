import {createHash} from 'node:crypto';
import {PRESETS} from '../public/builder/catalog.mjs';
import {OPTIONS,normalize,isModern,singleStone} from '../public/builder/state.mjs';
import {buildRing} from '../public/builder/model.mjs';
import {previewModel} from '../public/builder/progressive.mjs';
import {initKernel} from '../public/builder/kernel.mjs';
await initKernel();let checks=0;const duplicates=[];
function sig(s){const m=isModern(s)&&!['open','stack','signet'].includes(s.style)?previewModel(s,null):buildRing(s,null),h=createHash('sha256');m.group.updateMatrixWorld(true);const gs=new Set(),ms=new Set();m.group.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position.array;h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));h.update(JSON.stringify(o.matrixWorld.elements));const mat=o.material;h.update(JSON.stringify([mat.color?.toArray(),mat.roughness,mat.metalness,Object.fromEntries(Object.entries(mat.uniforms||{}).filter(([k])=>['absorption','ior','dispersion','lightAngle','lightPower'].includes(k)).map(([k,v])=>[k,v.value?.toArray?v.value.toArray():v.value]))]));gs.add(o.geometry);ms.add(mat)});const out=h.digest('hex');gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose());return out;}
for(const {config} of PRESETS){const modern=isModern(config),cases={shape:{},metal:{},finish:{},light:{},gemTone:{},color:{gemTone:'ice'}};
 if(config.style!=='eastwest')cases.orientation={shape:'oval'};
 if(!modern)Object.assign(cases,{profile:{},setting:{},headMetal:{metal:'white14'},accents:{width:5},coverage:{accents:'pave',width:5},sideTone:{sideMode:'pair',accents:'pave',width:5},sideShape:{sideMode:'pair'},...(config.style!=='duet'?{sideMode:{}}:{}),...(['halo','vintage'].includes(config.style)?{halo:{}}:{})});
 else if(!singleStone(config))Object.assign(cases,{sideTone:{alternateGems:true,dailyCount:3},...(config.style==='alternating'?{sideShape:{dailyCount:3}}:{})});
 for(const [key,extra]of Object.entries(cases)){const seen=new Map();for(const value of OPTIONS[key]){if(key==='sideMode'&&config.style==='trilogy'&&value==='none')continue;const s=normalize({...config,...extra,[key]:value});if(s[key]!==value){duplicates.push({style:s.style,key,value,normalized:s[key]});continue;}const signature=sig(s);if(seen.has(signature))duplicates.push({style:s.style,key,a:seen.get(signature),b:value});seen.set(signature,value);checks++;}}
 console.log('DONE',config.style);
}
let specificationChecks=0;
for(const {config} of PRESETS)for(const key of ['clarity','certificate','origin'])for(const value of OPTIONS[key]){
 const s=normalize({...config,[key]:value});
 if(s[key]!==value||normalize(JSON.parse(JSON.stringify(s)))[key]!==value)throw Error(`${config.style}/${key}: specification lost`);
 specificationChecks++;
}
console.log(JSON.stringify({checks,specificationChecks,duplicates},null,2));
if(duplicates.length)process.exitCode=1;
