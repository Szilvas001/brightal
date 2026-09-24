const test=require('node:test'),assert=require('node:assert/strict'),express=require('express');
const D=require('../server/diamonds'),db=require('../server/db');
test('authenticated order, price tampering, ownership and concurrent reservation',async()=>{
 const original={catalogue:D.catalogue,find:db.requests.find,insert:db.requests.insert},rows=[];
 // In-memory test double only. This is never imported or exposed by the app.
 D.catalogue=()=>[{...D.validate(D.sample())[0],id:'unit-test-stone',demo:false,referencePrice:'180000',sourceStatus:'verified',referenceSource:'dipen',referenceVatIncluded:true,priceCheckedAt:new Date().toISOString(),certificate:{lab:'IGI',number:'TEST_ONLY_NOT_A_REPORT',url:'https://www.igi.org/'}}];
 db.requests.find=fn=>rows.find(fn);db.requests.insert=async r=>{rows.push(r);return r;};
 const app=express();app.use(express.json());app.use((req,res,next)=>{if(req.headers['x-test-user'])req.user={id:req.headers['x-test-user'],name:'Test',email:'test@example.invalid',role:'user'};next();});app.use('/api/diamonds',require('../server/routes/diamonds'));
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/api/diamonds`;
 const post=(user,body)=>fetch(base+'/order',{method:'POST',headers:{'Content-Type':'application/json',...user?{'x-test-user':user}:{}},body:JSON.stringify(body)});
 try{
  assert.equal((await post(null,{})).status,401);
  assert.equal((await post('a',{id:'unit-test-stone'})).status,400);
  const [a,b]=await Promise.all([post('a',{id:'unit-test-stone',acceptTerms:true,expectedPrice:360000,price:1}),post('b',{id:'unit-test-stone',acceptTerms:true,expectedPrice:360000})]);assert.equal(a.status,200);assert.equal(b.status,409);assert.equal(rows.length,1);const result=await a.json();assert.equal(result.request.price,360000);assert.equal(result.request.source,'diamond');assert.equal(result.request.payable,true);
  assert.equal((await post('a',{id:'unit-test-stone',acceptTerms:true,expectedPrice:360000})).status,200);assert.equal(rows.length,1);
  const pub=await (await fetch(base)).json();assert.equal(pub.items[0].referencePrice,undefined);
 }finally{await new Promise(r=>server.close(r));D.catalogue=original.catalogue;db.requests.find=original.find;db.requests.insert=original.insert;}
});
