'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const C=require('../server/cad');
(async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'brightal-cad-validation-'));let failures=0;
 const cases=['eastwest','contour','split','trilogy','duet','wavebezel','openpair','band'].map(style=>({style}));
 cases.push({style:'bezel',innerDiameter:14,width:1.8,thickness:1.2,stoneLength:3,stoneWidth:2,stoneDepth:1,settingHeight:3,underOpening:.3});
 cases.push({style:'bezel',innerDiameter:24,width:8,thickness:3.5,stoneLength:10,stoneWidth:8,stoneDepth:6,settingHeight:9,bezelWall:1.5});
 for(const [i,overrides] of cases.entries()){
  const config={style:overrides.style,shape:'oval',width:3.4,thickness:1.8,stoneLength:4,stoneWidth:3,stoneDepth:1.8};
  const p=await C.parameters(config,{stoneLength:4,stoneWidth:3,stoneDepth:1.8,sideSize:1.5,settingHeight:5,...overrides});
  const dir=path.join(out,String(i));fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'input.json'),JSON.stringify(p));
  const start=Date.now(),r=spawnSync(process.env.CAD_PYTHON||'.venv-cad/bin/python',['server/cad/generate.py',path.join(dir,'input.json'),dir],{timeout:120000,encoding:'utf8'});
  if(r.status!==0){failures++;console.log('FAIL',p.style,r.stderr,r.error?.message||'');continue;}
  const report=JSON.parse(fs.readFileSync(path.join(dir,'report.json'))),step=fs.readFileSync(path.join(dir,'ring.step'),'utf8');
  if(!step.includes('MANIFOLD_SOLID_BREP')||!report.stepRoundtrip){failures++;console.log('FAIL',p.style,'STEP_BREP');continue;}
  // STL normals and closed two-manifold edge incidence, welded at 1e-5 mm.
  const b=fs.readFileSync(path.join(dir,'ring.stl')),n=b.readUInt32LE(80),edges=new Map();let volume=0;
  for(let j=0;j<n;j++){const pts=[];for(let k=0;k<3;k++){const o=84+j*50+12+k*12;pts.push([0,4,8].map(d=>b.readFloatLE(o+d)));}
   const ids=pts.map(v=>v.map(x=>Math.round(x*1e5)).join(','));for(let k=0;k<3;k++){const a=ids[k],c=ids[(k+1)%3],key=[a,c].sort().join('|'),e=edges.get(key)||[0,0];e[0]++;e[1]+=a<c?1:-1;edges.set(key,e);}
   const [a,c,d]=pts;volume+=(a[0]*(c[1]*d[2]-c[2]*d[1])+a[1]*(c[2]*d[0]-c[0]*d[2])+a[2]*(c[0]*d[1]-c[1]*d[0]))/6;
  }
  const bad=[...edges.values()].filter(([count,orientation])=>count!==2||orientation!==0).length;
  if(bad||volume<=0){failures++;console.log('FAIL',p.style,'STL',bad,volume);}else console.log('PASS',p.style,n,'triangles',Date.now()-start,'ms');
 }
 console.log('CAD_ARTIFACTS',out,'FAILURES',failures);process.exitCode=failures?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;});
