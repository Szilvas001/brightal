const test=require('node:test'),assert=require('node:assert/strict'),express=require('express');
const D=require('../server/diamonds'),P=require('../server/diamond-pricing'),db=require('../server/db'),barion=require('../server/barion'),invoice=require('../server/invoice');
test('payment rechecks reference freshness and exact gross before calling the gateway',async()=>{
 const original={catalogue:D.catalogue,find:db.requests.find,update:db.requests.update,start:barion.startPayment};let charged;
 let stone={id:'test',available:true,referencePrice:'123455',referenceSource:'dipen',referenceVatIncluded:true,priceCheckedAt:new Date().toISOString(),sourceStatus:'verified',certificate:{number:'TEST'}};
 const r={id:'r',userId:'u',requestNumber:'TEST',status:'approved',price:246910,currency:'HUF',diamond:{id:'test'},history:[],customer:{},accounting:P.accounting(246910)};
 D.catalogue=()=>[stone];db.requests.find=()=>r;db.requests.update=async()=>r;barion.startPayment=async req=>{charged=req.price;return {paymentId:'test',gatewayUrl:'/test',status:'Prepared'};};
 const app=express();app.use(express.json());app.use((req,res,next)=>{req.user={id:'u',role:'user'};next();});app.use('/api',require('../server/routes/payment'));const server=app.listen(0);await new Promise(x=>server.once('listening',x));
 const pay=()=>fetch(`http://127.0.0.1:${server.address().port}/api/payment/start`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestNumber:'TEST',price:1})});
 try{assert.equal((await pay()).status,200);assert.equal(charged,246910);assert.equal(invoice.buildInvoiceData(r).item.gross,246910);assert.equal(invoice.buildInvoiceData(r).item.vat,Number(P.accounting(246910).vatHuf));charged=null;stone={...stone,referencePrice:'200000'};assert.equal((await pay()).status,409);assert.equal(charged,null);stone={...stone,priceCheckedAt:'2020-01-01'};assert.equal((await pay()).status,409);assert.equal(charged,null);}
 finally{await new Promise(x=>server.close(x));D.catalogue=original.catalogue;db.requests.find=original.find;db.requests.update=original.update;barion.startPayment=original.start;}
});
