import fs from 'node:fs';
import {initKernel} from '../public/builder/kernel.mjs';
import {PRESETS} from '../public/builder/catalog.mjs';
import {buildRing} from '../public/builder/model.mjs';
import {auditRodThickness} from '../public/builder/structural-audit.mjs';
await initKernel();const out='docs/audits/2026-11-14/rod-thickness.jsonl';fs.writeFileSync(out,'');
for(const {config}of PRESETS){const m=buildRing(config);try{const result=auditRodThickness(m);fs.appendFileSync(out,JSON.stringify({style:config.style,...result})+'\n');console.log(config.style,result.rods.length,result.issues.length);}finally{m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});globalThis.gc?.();}}
