import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {PRESETS} from '../public/builder/catalog.mjs';
import {normalize,OPTIONS,isModern} from '../public/builder/state.mjs';
import {buildRing} from '../public/builder/model.mjs';
import {buildFinishedRing} from '../public/builder/finished-model.mjs';
import {auditStoneCollisions} from '../public/builder/assembly-audit.mjs';
import {initKernel} from '../public/builder/kernel.mjs';

// Diagnostic matrix, not a manufacturing certificate. --finished also checks
// the final metal and finger opening. Independent shards make it practical to
// run the same matrix on multiple CPU cores without changing its coverage.
const finished=process.argv.includes('--finished'),supports=process.argv.includes('--supports');
const sourceHash=createHash('sha256');
for(const file of ['model.mjs','solidify.mjs','validation.mjs','assembly-audit.mjs','finished-model.mjs','contemporary.mjs','state.mjs','optics.mjs'])sourceHash.update(fs.readFileSync(new URL('../public/builder/'+file,import.meta.url)));
const geometryRevision=sourceHash.digest('hex');
const [shard,shards]=(process.argv.find(a=>a.startsWith('--shard='))||'--shard=0/1')
 .split('=')[1].split('/').map(Number);
if(!Number.isInteger(shard)||!Number.isInteger(shards)||shard<0||shard>=shards)
 throw new Error('Use --shard=INDEX/COUNT, starting at index zero.');
const output=process.env.ASSEMBLY_AUDIT_OUTPUT||'/tmp/brightal-assembly-combinations.json';
let total=0;
const failures=[];
const save=completed=>fs.writeFileSync(output,JSON.stringify({total,finished,supports,geometryRevision,shard,shards,completed,failures}));
await initKernel();
for(const {config} of PRESETS.filter((p,i)=>i%shards===shard&&(!supports||!isModern(p.config)))){
 const variants=[];
 for(const shape of OPTIONS.shape)
  for(const setting of isModern(config)?['bezel']:OPTIONS.setting)
   for(const sideMode of isModern(config)||config.style==='duet'?['none']:['pair','cluster','five'])
    variants.push({shape,setting,sideMode});
 for(const size of [44,72])for(const large of [false,true])
  for(const accents of isModern(config)?['none']:['none','pave','channel'])
   variants.push({size,width:large?5:1.6,carat:large?5:.3,sideCarat:large?1.5:.1,
    stoneWidth:large?5:1.5,stoneDepth:large?3.5:1,dailyCount:9,accents,
    hiddenHalo:true,sideMode:'cluster',halo:'double'});
 for(const variant of variants){
  const c=normalize({...config,...variant});
  let model;
  try{
   model=finished?buildFinishedRing(c):buildRing(c,null);
   const blocked=(model.contacts||[]).filter(c=>!c.support.userData.stoneClearanceValid).length;
   const audit=finished?model.engineering.assemblyValidation:supports?{valid:blocked===0,issues:blocked?['SUPPORT_INTERSECTS_STONE']:[]}:auditStoneCollisions(model);
   if(!audit.valid)failures.push({config:c,collisions:audit.collisions||audit.stones?.collisions,
    issues:audit.issues,reason:model.engineering?.reason});
  }catch(error){failures.push({config:c,issues:['BUILD_FAILED'],reason:error.message});}
  finally{model?.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
  total++;
  globalThis.gc?.();
  save(false);
  if(total%15===0)console.log('PROGRESS',total,failures.length);
 }
 console.log('DONE',config.style,total,failures.length);
}
save(true);
console.log('TOTAL',total,'FAILURES',failures.length);
if(process.argv.includes('--assert-valid')&&failures.length)process.exitCode=1;
