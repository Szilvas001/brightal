'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
let errors=0;
for(const root of ['server','scripts','tests'])for(const entry of fs.readdirSync(root,{recursive:true})){
 const f=path.join(root,entry);if(!/\.(cjs|js|mjs)$/.test(f)||!fs.statSync(f).isFile())continue;
 const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status){errors++;console.error(r.stderr);}
}
console.log('Source syntax:',errors?'FAILED':'PASS');process.exitCode=errors?1:0;
