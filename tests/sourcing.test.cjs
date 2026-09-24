const test=require('node:test'),assert=require('node:assert/strict'),express=require('express');
const D=require('../server/diamonds'),db=require('../server/db'),mail=require('../server/mailer');
test('sourcing accepts all valid combinations but requires certified matching stock before payment',async()=>{
 const original={catalogue:D.catalogue,find:db.requests.find,insert:db.requests.insert,update:db.requests.update,notify:mail.requestApproved};const rows=[];
 const stock={...D.validate(D.sample())[0],id:'synthetic-stock',demo:false,shape:'round',carat:1,color:'F',clarity:'VS1',referenceSource:'dipen',sourceStatus:'verified',referencePrice:'100.25',priceCheckedAt:new Date().toISOString(),certificate:{number:'TEST-ONLY',lab:'IGI',url:'https://www.igi.org/'}};
 D.catalogue=()=>[stock];db.requests.find=f=>rows.find(f);db.requests.insert=async r=>{rows.push(r);return r;};db.requests.update=async(f,change)=>{const i=rows.findIndex(f);rows[i]=change(rows[i]);return rows[i];};mail.requestApproved=async()=>{};
 const app=express();app.use(express.json());app.use((req,res,next)=>{const role=req.headers['x-test-role'];if(role)req.user={id:role,role,name:'Test',email:'test@example.invalid'};next();});app.use('/api/diamonds',require('../server/routes/diamonds'));app.use('/api/admin',require('../server/routes/admin'));
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const post=(path,role,body)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(role?{'x-test-role':role}:{})},body:JSON.stringify(body)});
 try{
  const c={shape:'round',color:'F',clarity:'VS1',carat:1};
  assert.equal((await post('/api/diamonds/sourcing',null,c)).status,401);
  assert.equal((await post('/api/diamonds/sourcing','user',{...c,carat:31})).status,400);
  const result=await (await post('/api/diamonds/sourcing','user',c)).json();const r=result.request;
  assert.equal(r.payable,false);assert.equal(r.source,'diamond');assert.deepEqual(r.sourcing,c);
  const path='/api/diamonds/sourcing/'+r.requestNumber+'/confirm';
  assert.equal((await post(path,'user',{stoneId:stock.id})).status,403);
  assert.equal((await post('/api/admin/requests/'+r.requestNumber+'/approve','admin',{price:1})).status,409);
  assert.equal((await post(path,'admin',{stoneId:'missing'})).status,409);
  const confirmed=await (await post(path,'admin',{stoneId:stock.id,price:1})).json();
  assert.equal(confirmed.request.price,201);assert.equal(confirmed.request.payable,true);assert.equal(confirmed.request.diamond.id,stock.id);
  const second=await (await post('/api/diamonds/sourcing','user',c)).json();
  assert.equal((await post('/api/diamonds/sourcing/'+second.request.requestNumber+'/confirm','admin',{stoneId:stock.id})).status,409);
 }finally{await new Promise(r=>server.close(r));D.catalogue=original.catalogue;db.requests.find=original.find;db.requests.insert=original.insert;db.requests.update=original.update;mail.requestApproved=original.notify;}
});
