const test=require('node:test'),assert=require('node:assert/strict'),express=require('express');
process.env.BARION_SIMULATE='true';
const S=require('../server/supplier-model'),D=require('../server/diamonds'),db=require('../server/db'),barion=require('../server/barion');
test('public combination prices use admin model; orders fix price, retry safely and reach payment',async()=>{
 const original={read:S.read,find:db.requests.find,insert:db.requests.insert,update:db.requests.update,start:barion.startPayment};
 let data={observations:[{id:'synthetic',shape:'round',color:'F',clarity:'VS1',carat:1,usd:'100.25',currency:'USD',date:'2026-01-01',kind:'quote',stoneOnly:true,evidence:'Test fixture only'}],fx:{hufPerUsd:'350.50',checkedAt:new Date().toISOString(),source:'Synthetic fixture'}};
 const rows=[];let charged=null;
 S.read=()=>data;db.requests.find=f=>rows.find(f);db.requests.insert=async r=>{rows.push(r);return r;};db.requests.update=async(f,change)=>{const i=rows.findIndex(f);rows[i]=change(rows[i]);return rows[i];};barion.startPayment=async r=>{charged=r.price;return {paymentId:'test',gatewayUrl:'/test',status:'Prepared'};};
 const app=express();app.use(express.json());app.use((req,res,next)=>{if(req.headers['x-role'])req.user={id:req.headers['x-role'],role:req.headers['x-role'],name:'Test',email:'test@example.invalid'};next();});app.use('/api/diamonds',require('../server/routes/diamonds'));app.use('/api',require('../server/routes/payment'));
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const post=(path,body,role)=>fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(role?{'x-role':role}:{})},body:JSON.stringify(body)});
 try{
  const c={shape:'round',color:'F',clarity:'VS1',carat:1};
  const offer=await (await post('diamonds/offer',c)).json();assert.equal(offer.price,70275);assert.deepEqual(Object.keys(offer).sort(),['combination','currency','fulfilment','price','purchasable']);
  for(const shape of D.SHAPES)for(const color of D.COLORS)for(const clarity of D.CLARITIES)for(const carat of [.1,30])assert.ok(require('../server/diamond-offer').offer({shape,color,clarity,carat}).price>0);
  const body={...c,expectedPrice:offer.price,orderKey:'test-combination-order-001',acceptTerms:true};
  assert.equal((await post('diamonds/combination/order',body)).status,401);
  assert.equal((await post('diamonds/combination/order',body,'admin')).status,400);
  assert.equal((await post('diamonds/combination/order',{...body,acceptTerms:false},'user')).status,400);
  assert.equal((await post('diamonds/combination/order',{...body,expectedPrice:1},'user')).status,409);
  const responses=await Promise.all([post('diamonds/combination/order',body,'user'),post('diamonds/combination/order',body,'user')]);
  const a=await responses[0].json(),b=await responses[1].json();assert.equal(a.request.requestNumber,b.request.requestNumber);assert.equal(rows.length,1);assert.equal(a.request.payable,true);assert.equal(a.request.currency,'HUF');assert.equal(a.request.price,70275);assert.equal(a.request.source,'diamond');assert.equal(a.request.diamond,null);
  assert.equal((await post('diamonds/combination/order',{...body,carat:2},'user')).status,409);
  data={...data,fx:{...data.fx,checkedAt:'2020-01-01'}};
  assert.equal((await post('diamonds/offer',c)).status,503);
  assert.equal((await post('payment/start',{requestNumber:a.request.requestNumber,price:1},'user')).status,200);assert.equal(charged,70275);
  const invoice=require('../server/invoice').buildInvoiceData(rows[0]);assert.equal(invoice.item.vat,Number(rows[0].accounting.vatHuf));assert.match(invoice.item.name,/Laboratóriumi gyémánt/);
  const gateway=await original.start({...rows[0],paymentRequestId:'synthetic'});const state=await barion.getPaymentState(gateway.paymentId);assert.equal(state.Total,70275);assert.equal(state.Currency,'HUF');
  rows[0].price=1;charged=null;assert.equal((await post('payment/start',{requestNumber:a.request.requestNumber},'user')).status,409);assert.equal(charged,null);
  data={observations:[],fx:null};assert.equal((await post('diamonds/offer',c)).status,503);
  assert.equal((await post('diamonds/offer',{...c,carat:31})).status,400);
 }finally{await new Promise(r=>server.close(r));S.read=original.read;db.requests.find=original.find;db.requests.insert=original.insert;db.requests.update=original.update;barion.startPayment=original.start;}
});
