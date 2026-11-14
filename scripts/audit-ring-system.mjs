import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {OPTIONS,NUMERIC_RANGES,normalize,isModern,DEFAULT} from '../public/builder/state.mjs';
import {PRESETS,stylePreset} from '../public/builder/catalog.mjs';
import {buildRing} from '../public/builder/model.mjs';
import {unifyLegacy} from '../public/builder/solidify.mjs';
import {auditAssembly} from '../public/builder/assembly-audit.mjs';
import {auditSupportJoints,auditBoreVolume} from '../public/builder/structural-audit.mjs';
import {initKernel} from '../public/builder/kernel.mjs';
const arg=(key,fallback)=>process.argv.find(x=>x.startsWith('--'+key+'='))?.split('=').slice(1).join('=')||fallback;
const out=arg('out','docs/audits/2026-11-14'),mode=arg('mode','defaults');fs.mkdirSync(out,{recursive:true});
const names=Object.fromEntries(PRESETS.map(p=>[p.config.style,p.name[0]]));
const inventory={styles:OPTIONS.style.map(id=>({id,name:names[id]})),options:OPTIONS,numericRanges:NUMERIC_RANGES.map(([key,min,max,step])=>({key,min,max,step,default:DEFAULT[key]})),discrete:{prongs:[4,6,8],accentRows:[1,2]},booleans:Object.keys(DEFAULT).filter(k=>typeof DEFAULT[k]==='boolean'),text:{engraving:{maxLength:24}},normalization:'Modern styles force bezel; dynamic stone/band bounds and style restrictions are applied by normalize(). Requested and effective configurations are both retained. No normalized duplicate is counted as another geometry.'};
fs.writeFileSync(out+'/inventory.json',JSON.stringify(inventory,null,2));
const variants=[];
if(mode==='defaults')for(const config of PRESETS.map(p=>p.config))variants.push({config,label:'preset'});
else for(const style of OPTIONS.style)for(const setting of OPTIONS.setting)for(const shape of OPTIONS.shape){
 const base={...stylePreset(style),setting,shape};variants.push({config:base,label:'base'});
 if(mode==='parameters'){
  for(const [key,min,max,step]of NUMERIC_RANGES)for(const v of [min,Math.round((min+max)/2/step)*step,max])variants.push({config:{...base,[key]:v},label:key+'='+v});
  for(const [key,values]of Object.entries({...OPTIONS,prongs:[4,6,8],accentRows:[1,2],hiddenHalo:[false,true],alternateGems:[false,true],mixedMetal:[false,true]}))if(!['style','setting','shape'].includes(key))for(const value of values)variants.push({config:{...base,[key]:value},label:key+'='+value});
 }
}
const seen=new Map();for(const v of variants){const config=normalize(v.config),key=JSON.stringify(config);if(!seen.has(key))seen.set(key,{id:createHash('sha256').update(key).digest('hex').slice(0,16),config,requests:[]});seen.get(key).requests.push({label:v.label,requested:v.config});}
const cases=[...seen.values()];
const manifest={mode,requestedCases:variants.length,uniqueCases:cases.length,coverage:'style × setting × shape, then one parameter at a time at min/mid/max and enumerated choices; not the Cartesian product of every parameter',unsupportedSettings:OPTIONS.style.filter(style=>isModern({style})).map(style=>({style,supported:['bezel']})),completed:false,processed:0,failures:0,unverifiedRules:['A: off-centre/multi-setting symmetry and prong angular distribution','C: stone retention and bearing contact','D: local minimum wall/prong thickness and geometric self-intersection','F: round-trip export mesh equivalence']};
fs.writeFileSync(out+'/manifest-'+mode+'.json',JSON.stringify(manifest,null,2));
if(process.argv.includes('--plan')){console.log(JSON.stringify({requested:variants.length,unique:cases.length}));process.exit(0);}
await initKernel();const resultsPath=out+'/results-'+mode+'.jsonl';fs.writeFileSync(resultsPath,'');
for(const entry of cases){
 let model,result;
 try{
  model=buildRing(entry.config);const structural=auditSupportJoints(model);unifyLegacy(model);const assembly=auditAssembly(model,entry.config);const bore=auditBoreVolume(model,entry.config);
  result={id:entry.id,config:entry.config,requestLabels:entry.requests.map(r=>r.label),structural,assembly,bore,reason:model.engineering?.reason,valid:structural.valid&&assembly.valid&&bore.valid};
 }catch(error){result={id:entry.id,config:entry.config,valid:false,error:error.stack};}
 finally{model?.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});globalThis.gc?.();}
 fs.appendFileSync(resultsPath,JSON.stringify(result)+'\n');manifest.processed++;if(!result.valid)manifest.failures++;
 fs.writeFileSync(out+'/manifest-'+mode+'.json',JSON.stringify(manifest,null,2));console.log(manifest.processed+'/'+cases.length,entry.config.style,result.valid?'PASS':'FAIL');
}
manifest.completed=true;manifest.releaseReady=manifest.failures===0&&manifest.unverifiedRules.length===0;fs.writeFileSync(out+'/manifest-'+mode+'.json',JSON.stringify(manifest,null,2));
if(process.argv.includes('--assert-valid')&&!manifest.releaseReady)process.exitCode=1;
