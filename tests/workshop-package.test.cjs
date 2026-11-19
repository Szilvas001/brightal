'use strict';
// Every order with a ring design has a downloadable workshop package whose
// files a CAD program opens as closed bodies (rule F).
process.env.MAIL_ENABLED='false';
const test=require('node:test'),assert=require('node:assert/strict'),express=require('express'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {unzipSync}=require('fflate');
const db=require('../server/db'),cfg=require('../server/config'),designs=require('../server/designs');
function memory(){let rows=[];let chain=Promise.resolve();return{all:()=>rows,find:f=>rows.find(f)||null,filter:f=>rows.filter(f),insert:async r=>{rows.push(r);return r;},update:(f,p)=>{const run=()=>{const i=rows.findIndex(f);if(i<0)return null;rows[i]=typeof p==='function'?p(rows[i]):{...rows[i],...p};return rows[i];};chain=chain.then(run,run);return chain;}};}
// Closed and consistently oriented by its own vertex numbering: every edge in exactly two faces, once each way.
function closedByIndex(faces){const edges=new Map();for(const f of faces)for(let i=0;i<3;i++){const k=f[i]+','+f[(i+1)%3];edges.set(k,(edges.get(k)||0)+1);}for(const [k,n] of edges){const [a,b]=k.split(',');if(n!==1||edges.get(b+','+a)!==1)return false;}return true;}
function objObjects(text){const out={};let cur=null;for(const line of text.split('\n')){if(line.startsWith('o '))out[cur=line.slice(2).trim()]=[];else if(line.startsWith('f '))out[cur].push(line.slice(2).trim().split(/\s+/).map(Number));}return out;}
// STL vertices joined by position, as a slicer does: closed, one body.
function stlClosed(bytes){const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),n=v.getUint32(80,true),ids=new Map(),faces=[];for(let i=0;i<n;i++){const f=[];for(let k=0;k<3;k++){const at=84+i*50+12+k*12,key=[0,1,2].map(j=>v.getFloat32(at+j*4,true)).join(',');if(!ids.has(key))ids.set(key,ids.size);f.push(ids.get(key));}faces.push(f);}return {triangles:n,closed:closedByIndex(faces)};}
test('admin downloads a complete 3D/CAD package for designer and photo orders, also when the stored archive is missing',async t=>{
 const originals={requests:db.requests,mailJobs:db.mailJobs,dir:cfg.upload.dir,adminMail:require('../server/mailer').adminNewRequest};
 db.requests=memory();db.mailJobs=memory();cfg.upload.dir=fs.mkdtempSync(path.join(os.tmpdir(),'brightal-package-'));require('../server/mailer').adminNewRequest=async()=>{};
 const app=express();app.use(express.json());app.use((req,res,next)=>{req.user=req.headers['x-admin']==='yes'?{id:'admin',role:'admin'}:null;next();});
 app.use('/api',require('../server/routes/requests'));app.use('/api/admin',require('../server/routes/admin'));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const created=[];
 t.after(()=>{server.close();for(const r of db.requests.all()){try{fs.rmSync(designs.archivePath(r.id),{force:true});}catch{}for(const f of fs.readdirSync(path.dirname(designs.archivePath('00000000-0000-0000-0000-000000000000'))).filter(f=>f.startsWith(r.id)))fs.rmSync(path.join(path.dirname(designs.archivePath('00000000-0000-0000-0000-000000000000')),f),{force:true});}fs.rmSync(cfg.upload.dir,{recursive:true,force:true});Object.assign(db,{requests:originals.requests,mailJobs:originals.mailJobs});cfg.upload.dir=originals.dir;require('../server/mailer').adminNewRequest=originals.adminMail;});
 const {DEFAULT}=await import('../public/builder/state.mjs');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6pU8AAAAASUVORK5CYII=','base64');
 const submit=async design=>{const f=new FormData();f.append('email','buyer@example.test');f.append('phone','+36301234567');f.append('acceptTerms','true');f.append('photos',new Blob([png],{type:'image/png'}),'ref.png');if(design)f.append('ringDesign',JSON.stringify({version:3,name:'Teszt',design}));const r=await fetch(base+'/api/requests',{method:'POST',body:f});assert.equal(r.status,200,await r.clone().text());const {request}=await r.json();created.push(request);return request;};
 const download=async number=>fetch(base+'/api/admin/requests/'+number+'/design.zip',{headers:{'x-admin':'yes'}});
 const check=async number=>{
  const r=await download(number);assert.equal(r.status,200);assert.match(r.headers.get('content-disposition'),/3D-CAD\.zip/);
  const files=unzipSync(new Uint8Array(await r.arrayBuffer()));
  for(const name of ['ring-metal-mm.stl','ring-stones-mm.stl','ring-concept.obj','design.json','workshop.html','READ-ME.txt'])assert.ok(files[name],name);
  const metal=stlClosed(files['ring-metal-mm.stl']);assert.ok(metal.triangles>1000&&metal.closed,'metal STL is one closed body');
  const objects=objObjects(Buffer.from(files['ring-concept.obj']).toString());assert.ok(closedByIndex(objects.BRIGHTAL_metal),'OBJ metal closed by its own vertex numbering');
  assert.ok(Object.keys(objects).filter(n=>n.startsWith('gemstone_')).every(n=>closedByIndex(objects[n])));
  assert.match(Buffer.from(files['READ-ME.txt']).toString(),/milliméter/);
 };
 const designer=await submit({...DEFAULT,style:'trilogy',size:56});await check(designer.requestNumber);
 assert.equal((await fetch(base+'/api/admin/requests/'+designer.requestNumber+'/design.zip')).status,403);
 // An order whose stored archive is missing is rebuilt from its design.
 fs.rmSync(designs.archivePath(db.requests.find(r=>r.requestNumber===designer.requestNumber).id));await check(designer.requestNumber);
 // A photo order has a package once the workshop has uploaded its 3D model.
 const photo=await submit(null);assert.equal((await download(photo.requestNumber)).status,404);
 const form=new FormData();form.append('model',new Blob([JSON.stringify({version:3,name:'Fotó alapján',design:{...DEFAULT,style:'halo',shape:'oval',carat:2}})],{type:'application/json'}),'model.json');
 assert.equal((await fetch(base+'/api/admin/requests/'+photo.requestNumber+'/photo-model',{method:'POST',headers:{'x-admin':'yes'},body:form})).status,200);
 await check(photo.requestNumber);
});
