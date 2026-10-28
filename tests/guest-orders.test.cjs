'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),express=require('express'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const db=require('../server/db'),cfg=require('../server/config'),access=require('../server/guest-access'),R=require('../server/requests'),Mail=require('../server/mailer');
function memory(){let rows=[];let chain=Promise.resolve();return{all:()=>rows,find:f=>rows.find(f)||null,filter:f=>rows.filter(f),insert:async r=>{rows.push(r);return r;},update:(f,p)=>{const run=()=>{const i=rows.findIndex(f);if(i<0)return null;rows[i]=typeof p==='function'?p(rows[i]):{...rows[i],...p};return rows[i];};chain=chain.then(run,run);return chain;}};}
test('guest photo/designer enquiry → admin offer → private approval and delivery; no accounts',async t=>{
 const originals={requests:db.requests,mailJobs:db.mailJobs,dir:cfg.upload.dir,adminMail:Mail.adminNewRequest,save:require('../server/designs').savePackage};
 db.requests=memory();db.mailJobs=memory();cfg.upload.dir=fs.mkdtempSync(path.join(os.tmpdir(),'brightal-guest-'));Mail.adminNewRequest=async()=>{};require('../server/designs').savePackage=async()=>{};
 const app=express();app.use(express.json());app.use((req,res,next)=>{req.user=req.headers['x-admin']==='yes'?{id:'admin',role:'admin'}:null;next();});
 app.use('/api',require('../server/routes/requests'));app.use('/api/admin',require('../server/routes/admin'));app.use('/api/guest-orders',require('../server/routes/guest-orders'));app.use('/api/auth',require('../server/routes/auth'));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 t.after(()=>{server.close();fs.rmSync(cfg.upload.dir,{recursive:true,force:true});Object.assign(db,{requests:originals.requests,mailJobs:originals.mailJobs});cfg.upload.dir=originals.dir;Mail.adminNewRequest=originals.adminMail;require('../server/designs').savePackage=originals.save;});
 const post=(url,body,headers={})=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 assert.equal((await post('/api/auth/register',{email:'x@example.test',password:'password'})).status,404);
 const {DEFAULT}=await import('../public/builder/state.mjs');
 for(const designer of [false,true]){
  const form=new FormData();form.append('email','buyer@example.test');form.append('phone','+36301234567');form.append('acceptTerms','true');form.append('photos',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6pU8AAAAASUVORK5CYII=','base64')],{type:'image/png'}),'reference.png');
  if(designer)form.append('ringDesign',JSON.stringify({version:3,name:'Saját gyűrű',design:{...DEFAULT,style:'solitaire',size:56,engraving:'Teszt'}}));
  const submitted=await fetch(base+'/api/requests',{method:'POST',body:form});assert.equal(submitted.status,200,await submitted.clone().text());const {request}=await submitted.json();
  assert.equal(request.guestAccess,undefined);const stored=db.requests.find(r=>r.id===request.id),token=access.token(stored),headers={Authorization:'Bearer '+token},url='/api/guest-orders/'+request.requestNumber;
  assert.equal(stored.userId,null);assert.equal(db.mailJobs.all().filter(j=>j.requestId===stored.id&&j.kind==='received').length,1);assert.equal(db.mailJobs.all().filter(j=>j.kind==='approved'&&j.requestId===stored.id).length,0);
  assert.equal((await fetch(base+url)).status,404);assert.equal((await fetch(base+url,{headers:{Authorization:'Bearer '+ 'a'.repeat(43)}})).status,404);
  assert.equal((await fetch(base+'/api/admin/requests')).status,403);
  assert.equal((await post('/api/admin/requests/'+request.requestNumber+'/approve',{price:100000,productionRange:'5-8'})).status,403);
  const approve=()=>post('/api/admin/requests/'+request.requestNumber+'/approve',{price:100000,productionRange:'5-8'},{'x-admin':'yes'});
  if(!designer){
   assert.equal((await approve()).status,409);
   const vf=new FormData();vf.append('visual',new Blob([Buffer.from('R0lGODlhAQABAAAAACw=','base64')],{type:'image/gif'}),'latvanyterv.gif');
   const up=await fetch(base+'/api/admin/requests/'+request.requestNumber+'/visual',{method:'POST',headers:{'x-admin':'yes'},body:vf});assert.equal(up.status,200,await up.clone().text());
   const visualFile=path.join(require('../server/config').upload.dir,db.requests.find(r=>r.id===stored.id).visual.filename);t.after(()=>fs.rmSync(visualFile,{force:true}));
   assert.equal((await fetch(base+url+'/visual',{headers})).status,404);
  }
  const a=await approve();assert.equal(a.status,200,await a.clone().text());let approved=(await a.json()).request;
  const email=require('../server/order-email').render(db.requests.find(r=>r.id===stored.id),'approved',null);
  assert.match(email.html,/LÁTVÁNYTERV JÓVÁHAGYÁSA/);assert.ok(email.text.includes('#'+token));assert.ok(!email.text.includes('/orders'));
  const viewed=(await (await fetch(base+url,{headers})).json()).request;assert.deepEqual(viewed.design,request.design);
  if(!designer){const v=await fetch(base+url+'/visual',{headers});assert.equal(v.status,200);assert.equal(v.headers.get('content-type'),'image/gif');assert.equal((await fetch(base+url+'/visual')).status,404);assert.equal(viewed.finalOffer.previewUrl,viewed.visual.url);}
  const terms=await fetch(base+url+'/terms',{headers});assert.equal(terms.status,200);assert.match(await terms.text(),/Általános Szerződési/);
  if(designer){const json=await (await fetch(base+url+'/design.json',{headers})).json();assert.deepEqual(json.design,stored.design.config);}
  const payload={offerId:approved.finalOffer.id,offerDigest:approved.finalOffer.digest,email:'buyer@example.test',shipping:{name:'Teszt Vásárló',country:'Magyarország',zip:'1011',city:'Budapest',street:'Teszt utca',houseNumber:'1',extra:'2/3'},designApproved:true,termsAccepted:true,priceAccepted:true,privacyRead:true,withdrawalAcknowledged:true,paymentObligation:true};
  assert.equal((await post(url+'/accept',{...payload,termsAccepted:false},headers)).status,409);
  assert.equal((await post(url+'/accept',{...payload,shipping:{...payload.shipping,houseNumber:''}},headers)).status,409);
  assert.equal((await post(url+'/accept',{...payload,email:'other@example.test'},headers)).status,409);
  assert.equal((await post(url+'/accept',{...payload,offerDigest:'bad'},headers)).status,409);
  const revision=await post(url+'/revision',{note:'Kérek egy pontosítást.'},headers);assert.equal(revision.status,200);assert.equal((await post(url+'/accept',payload,headers)).status,409);
  approved=(await (await approve()).json()).request;Object.assign(payload,{offerId:approved.finalOffer.id,offerDigest:approved.finalOffer.digest});
  const results=await Promise.all([post(url+'/accept',payload,headers),post(url+'/accept',payload,headers)]);assert.ok(results.every(r=>r.status===200));
  const final=(await results[0].json()).request;assert.equal(final.paymentStatus,'AwaitingTransfer');assert.equal(final.bankTransfer.reference,request.requestNumber);assert.ok(final.bankTransfer.dueAt);assert.equal(final.acceptance.shipping.houseNumber,'1');
  assert.equal(db.requests.find(r=>r.id===stored.id).history.filter(h=>h.event==='customer_ordered').length,1);
  assert.equal((await post(url+'/revision',{note:'Túl késő'},headers)).status,409);assert.equal((await approve()).status,409);
 }
 const rows=db.requests.all();assert.equal(access.allowed({headers:{authorization:'Bearer '+access.token(rows[0])}},rows[1]),false);
});
