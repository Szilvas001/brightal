'use strict';
const cfg=require('../server/config');
const errors=require('../server/production-check').problems({...cfg,isProd:true});
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
for(const file of ['public/app.js','public/builder/bundle.js','public/builder/geometry-worker.js','data/supplier-model.json'])if(!fs.existsSync(path.join(root,file)))errors.push('Hiányzó fájl: '+file);
const py=spawnSync(process.env.CAD_PYTHON||path.join(root,'.venv-cad/bin/python'),['-c','import cadquery; print(cadquery.__version__)'],{timeout:30000,encoding:'utf8'});
if(py.status!==0)errors.push('CadQuery nem indítható.');
const S=require('../server/supplier-model');
try{if(!S.estimate({shape:'oval',carat:1,color:'F',clarity:'VS1'},S.read()).retailGrossHuf)errors.push('Hiányzó/frissítésre váró beszállítói modell vagy devizaárfolyam.');}catch{errors.push('Beszállítói árazás nem érhető el.');}
const P=require('../server/diamond-previews');
for(const s of require('../server/diamonds').sample())if(!fs.existsSync(path.join(P.DIR,P.key(s)+'.webp')))errors.push('Hiányzó előnézet: '+s.shape);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Éles konfiguráció, build, CAD és 10 forma-előnézet ellenőrizve.');
