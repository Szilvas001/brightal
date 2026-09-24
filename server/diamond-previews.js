'use strict';
const crypto=require('node:crypto'),path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
const DIR=path.join(__dirname,'../data/diamond-previews');
function key(x){return crypto.createHash('sha256').update(JSON.stringify(['v4',x.shape,x.length,x.width,x.height,x.color,x.cut])).digest('hex').slice(0,32);}
const pending=new Map();let queue=Promise.resolve();
function ensure(stone){
 const id=key(stone),file=path.join(DIR,id+'.webp');if(fs.existsSync(file))return Promise.resolve(file);
 if(pending.has(id))return pending.get(id);
 const run=queue.then(()=>new Promise((resolve,reject)=>{
  if(fs.existsSync(file))return resolve(file);
  const child=spawn(process.execPath,[path.join(__dirname,'../scripts/diamond-thumbnails.cjs')],{stdio:['pipe','ignore','pipe']});
  const timeout=setTimeout(()=>child.kill('SIGKILL'),60000);let error='';child.stderr.on('data',b=>{error=(error+b).slice(-1000);});
  child.once('error',reject);child.once('exit',code=>{clearTimeout(timeout);code===0&&fs.existsSync(file)?resolve(file):reject(Error('Preview render failed: '+error));});child.stdin.end(JSON.stringify([stone]));
 }));queue=run.catch(()=>{});pending.set(id,run);run.finally(()=>pending.delete(id)).catch(()=>{});return run;
}
module.exports={DIR,key,ensure};
