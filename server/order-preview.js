'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const DIR=path.join(__dirname,'../data/order-previews');
async function attachment(r, kind) {
  // The approval email of a photo-upload order carries the visual design uploaded by the admin.
  if (kind === 'approved' && !r.design && r.visual && path.basename(r.visual.filename) === r.visual.filename)
    return {filename:r.requestNumber+'-latvanyterv'+path.extname(r.visual.filename),path:path.join(require('./config').upload.dir,r.visual.filename),contentType:r.visual.mime};
  if (r.design) {
    fs.mkdirSync(DIR,{recursive:true,mode:0o700});
    const target=path.join(DIR,r.design.sha256+'.gif');
    if (!/^[a-f0-9]{64}$/.test(r.design.sha256)) throw Error('INVALID_DESIGN');
    if (!fs.existsSync(target)) await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,[path.join(__dirname,'../scripts/order-preview.cjs'),target],{stdio:['pipe','ignore','pipe']});
      let error=''; child.stderr.on('data',chunk=>{error=(error+chunk).slice(-2000);});
      const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('PREVIEW_TIMEOUT'));},180000);
      child.once('error',e=>{clearTimeout(timer);reject(e);});
      child.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error(error||'PREVIEW_FAILED'));});
      child.stdin.end(JSON.stringify(r.design.config));
    });
    return {filename:r.requestNumber+'.gif',path:target,contentType:'image/gif'};
  }
  const image=r.images?.find(i=>i.filename && path.basename(i.filename)===i.filename);
  if (!image) return null;
  return {filename:r.requestNumber+path.extname(image.filename),path:path.join(require('./config').upload.dir,image.filename),contentType:image.mime};
}
module.exports={attachment};
