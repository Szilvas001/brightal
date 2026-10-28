'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),express=require('express'),fs=require('node:fs'),path=require('node:path');
const db=require('../server/db'),cfg=require('../server/config'),R=require('../server/requests'),O=require('../server/offers'),W=require('../server/order-workflow');
const Mail=require('../server/mailer'),queue=require('../server/order-mail-queue');
function memory(){let rows=[];return{all:()=>rows,find:f=>rows.find(f)||null,filter:f=>rows.filter(f),insert:async r=>{rows.push(r);return r;},update:async(f,p)=>{const i=rows.findIndex(f);if(i<0)return null;rows[i]=typeof p==='function'?p(rows[i]):{...rows[i],...p};return rows[i];}};}
test('working-day ranges are explicit, ordered and bounded',()=>{
 assert.deepEqual(W.productionRange('2-5'),[2,5]);assert.deepEqual(W.productionRange('8–11 munkanap'),[8,11]);
 for(const v of ['','2','0-5','5-2','1-366','2.5-5','2-5<script>'])assert.throws(()=>W.productionRange(v),/INVALID_PRODUCTION_RANGE/);
});
test('upload and designer orders share customer/admin identifiers, manual approval and bank payment',async t=>{
 const original={requests:db.requests,mailJobs:db.mailJobs,save:require('../server/designs').savePackage,paymentMail:Mail.paymentReceived,invoice:require('../server/invoice').issueForRequest};
 Mail.paymentReceived=async()=>{};require('../server/invoice').issueForRequest=async()=>({});
 db.requests=memory();db.mailJobs=memory();require('../server/designs').savePackage=async()=>{};
 const files=[];t.after(()=>{files.forEach(f=>fs.rmSync(f,{force:true}));db.requests=original.requests;db.mailJobs=original.mailJobs;require('../server/designs').savePackage=original.save;Mail.paymentReceived=original.paymentMail;require('../server/invoice').issueForRequest=original.invoice;});
 const app=express();app.use(express.json());app.use((req,res,next)=>{req.user={id:req.headers['x-user']||'buyer',role:req.headers['x-role']||'user',email:'buyer@example.test',name:'Teszt Vásárló'};next();});app.use('/api',require('../server/routes/requests'));app.use('/api',require('../server/routes/payment'));app.use('/api/admin',require('../server/routes/admin'));app.use('/api/admin/cad',require('../server/routes/cad'));
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));t.after(()=>new Promise(r=>server.close(r)));const base=`http://127.0.0.1:${server.address().port}/api`;
 const post=(url,body,admin=false)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json','x-role':admin?'admin':'user'},body:JSON.stringify(body)});
 for(const design of [null,{version:3,design:{style:'bezel',metal:'yellow18',size:54}}]){
  const form=new FormData();form.append('phone','+36301234567');form.append('photos',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'reference.png');form.append('acceptTerms','true');form.append('name','Teszt Vásárló');if(design)form.append('ringDesign',JSON.stringify(design));
  const response=await fetch(base+'/requests',{method:'POST',body:form});assert.equal(response.status,200);const {request}=await response.json();const saved=db.requests.find(r=>r.id===request.id);files.push(...saved.images.map(i=>path.join(cfg.upload.dir,i.filename)));
  assert.equal(request.status,'submitted');assert.equal(request.source,design?'designer':'upload');assert.equal(db.mailJobs.filter(j=>j.requestId===request.id&&j.kind==='received').length,1);
  assert.equal((await post('/payment/start',{requestNumber:request.requestNumber})).status,409);
  assert.equal((await post('/admin/requests/'+request.requestNumber+'/approve',{price:100000,productionRange:'2-5'})).status,403);
  assert.equal((await post('/admin/requests/'+request.requestNumber+'/approve',{price:100000,productionRange:'5-2'},true)).status,400);
  const approval=await post('/admin/requests/'+request.requestNumber+'/approve',{price:100000,productionRange:'2-5'},true);assert.equal(approval.status,200);const approved=(await approval.json()).request;
  assert.equal(approved.status,'approved');assert.deepEqual(approved.productionDays,[2,5]);assert.equal(approved.bankTransfer.reference,request.requestNumber);assert.equal(approved.bankTransfer.account,'Megadás alatt');assert.equal(approved.payable,true);
  assert.equal(db.mailJobs.filter(j=>j.requestId===request.id&&j.kind==='approved').length,1);
  const mine=(await (await fetch(base+'/requests')).json()).requests.find(r=>r.id===request.id);
  assert.equal(mine.requestNumber,approved.requestNumber);assert.equal(mine.emailDeliveries,undefined);
  assert.equal((await fetch(base+'/requests/'+request.requestNumber,{headers:{'x-user':'other'}})).status,403);
  assert.equal((await fetch(base+'/admin/requests/'+request.requestNumber+'/design.zip')).status,403);
  assert.equal((await fetch(base+'/admin/cad/jobs')).status,403);
  const payload={requestNumber:request.requestNumber,offerId:approved.finalOffer.id,offerDigest:approved.finalOffer.digest,designApproved:true,priceAccepted:true,termsAccepted:true,privacyRead:true,withdrawalAcknowledged:true,paymentObligation:true,billing:{name:'Teszt Vásárló',country:'HU',zip:'1011',city:'Budapest',street:'Teszt utca 1'},shippingAddress:'Teszt Vásárló, Budapest, Teszt utca 1'};
  const paid=await post('/payment/start',payload);assert.equal(paid.status,200);const body=await paid.json();assert.equal(body.gatewayUrl,undefined);assert.equal(body.bankTransfer.reference,request.requestNumber);assert.equal(db.requests.find(r=>r.id===request.id).paymentStatus,'AwaitingTransfer');
  assert.equal((await post('/admin/requests/'+request.requestNumber+'/bank-received',{confirmed:true,reference:'BANK-123'})).status,403);
  const receipt=await post('/admin/requests/'+request.requestNumber+'/bank-received',{confirmed:true,reference:'BANK-123'},true);assert.equal(receipt.status,200);assert.equal((await receipt.json()).request.status,'paid');
  await post('/admin/requests/'+request.requestNumber+'/bank-received',{confirmed:true,reference:'BANK-123'},true);assert.equal(db.requests.find(r=>r.id===request.id).history.filter(h=>h.event==='bank_transfer_received').length,1);
  assert.equal((await post('/payment/start',payload)).status,409);
 }
 assert.equal(new Set(db.requests.all().map(r=>r.requestNumber)).size,2);
 // Admin list contains every submitted item and the exact same IDs.
 const admin=await fetch(base+'/admin/requests',{headers:{'x-role':'admin'}});assert.equal((await admin.json()).requests.length,2);
});
test('email templates escape submitted text and include both confirmations, bank reference and preview',()=>{
 const r=R.build({user:{id:'u',name:'<script>Buyer</script>',email:'buyer@example.test'},body:{note:'<img onerror=attack>'},files:[],lang:'hu'});const received=require('../server/order-email').render(r,'received',{filename:'preview.gif',content:Buffer.from('GIF89a'),contentType:'image/gif'});
 assert.match(received.text,/1 órán belül/);assert.match(received.text,/3 napon belül/);assert.ok(!received.text.includes('/orders'));assert.ok(received.text.includes('/order/'));assert.match(received.html,/cid:order-preview/);assert.ok(!received.html.includes('<script>'));assert.equal(received.attachments[0].cid,'order-preview');
 const approved=require('../server/order-email').render({...r,price:100000,productionDays:[8,11],finalOffer:{total:100000,productPrice:100000,shippingFee:0,productionTime:'8–11 munkanapon belül az átutalás beérkezésétől',specification:'Teszt'}},'approved',null);assert.match(approved.text,/8–11 munkanapon/);assert.match(approved.text,/beérkezésétől/);assert.ok(approved.text.includes(r.requestNumber));
});
test('durable email queue deduplicates, retains SMTP failures and retries before approval email',async t=>{
 const original={requests:db.requests,jobs:db.mailJobs,send:Mail.send,simulated:Mail.isSimulated,attachment:require('../server/order-preview').attachment};db.mailJobs=memory();db.requests=memory();t.after(()=>{db.requests=original.requests;db.mailJobs=original.jobs;Mail.send=original.send;Mail.isSimulated=original.simulated;require('../server/order-preview').attachment=original.attachment;});
 const r=R.build({user:{id:'u',name:'Buyer',email:'buyer@example.test'},body:{},files:[],lang:'hu'});
 await db.requests.insert({...r,status:'approved'});
 const first=await queue.enqueue(r,'received');await queue.enqueue(r,'received');await queue.enqueue({...r,approvedAt:'now',productionDays:[2,5]},'approved');assert.equal(db.mailJobs.all().length,2);
 Mail.isSimulated=()=>true;await queue.tick();assert.equal(db.mailJobs.find(j=>j.id===first.id).status,'pending');
 Mail.isSimulated=()=>false;require('../server/order-preview').attachment=async()=>null;Mail.send=async()=>{throw Error('SMTP temporarily unavailable');};await queue.tick();assert.equal(db.mailJobs.find(j=>j.id===first.id).status,'retry');
 let sent=0;Mail.send=async()=>{sent++;return{simulated:false};};await queue.tick();assert.equal(sent,0);await queue.retry(first.id);await queue.tick();await queue.tick();assert.equal(sent,2);assert.ok(db.mailJobs.all().every(j=>j.status==='sent'));
});
