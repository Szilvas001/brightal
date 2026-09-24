'use strict';
// Export the actual saved designer geometry, not a different CAD style.
const fs=require('node:fs'),path=require('node:path'),{unzipSync}=require('fflate');
(async()=>{
 const dir=process.argv[2],raw=JSON.parse(fs.readFileSync(path.join(dir,'source.json')));
 const config=raw.config.config;
 const design=await require('../designs').parseDesign(JSON.stringify({version:3,name:raw.config.name||config.style,design:config}));
 const zip=await require('../designs').makePackage({design,requestNumber:path.basename(dir),createdAt:new Date().toISOString()});
 const entries=unzipSync(zip),manifest=JSON.parse(Buffer.from(entries['design.json']).toString());
 fs.writeFileSync(path.join(dir,'export.zip'),zip);
 fs.writeFileSync(path.join(dir,'ring.obj'),entries['ring-concept.obj']);
 if(entries['ring-metal-mm.stl'])fs.writeFileSync(path.join(dir,'ring.stl'),entries['ring-metal-mm.stl']);
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify({mode:'mesh',units:'mm',style:config.style,meshValidation:manifest.engineering?.meshValidation||null,warning:'A mentett terv pontos 3D geometriája. Az OBJ a köveket is tartalmazza; az STL csak validált fémgeometria. Nem parametrikus STEP. Az ötvös végső műszaki jóváhagyása szükséges.',limitations:manifest.limitations}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
