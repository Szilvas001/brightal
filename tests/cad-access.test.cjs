const test=require('node:test'),assert=require('node:assert/strict'),express=require('express');
const C=require('../server/cad');
test('every CAD endpoint rejects anonymous and non-admin direct requests',async()=>{
 const app=express();app.use(express.json());app.use((req,res,next)=>{const role=req.headers['x-test-role'];if(role)req.user={id:'tester',role};next();});app.use('/api/admin/cad',require('../server/routes/cad'));
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/api/admin/cad`;
 try{for(const role of [null,'user'])for(const [method,url] of [['GET','/schema'],['GET','/jobs'],['POST','/mesh-jobs'],['POST','/parameters'],['POST','/jobs'],['GET','/jobs/abc'],['POST','/jobs/abc/download'],['GET','/download/guess']]){const result=await fetch(base+url,{method,headers:role?{'x-test-role':role}:{}});assert.equal(result.status,403,method+url);}
 assert.equal((await fetch(base+'/schema',{headers:{'x-test-role':'admin'}})).status,200);
 assert.equal((await fetch(base+'/download/guess',{headers:{'x-test-role':'admin'}})).status,403);
 }finally{await new Promise(r=>server.close(r));}
});
test('CAD parameter validation rejects unsupported models and unsafe dimensions',async()=>{
 await assert.rejects(C.parameters({style:'halo'}),/NOT_SUPPORTED/);
 await assert.rejects(C.parameters({style:'bezel'},{thickness:.1}),/INVALID_CAD_PARAMETER/);
 await assert.rejects(C.parameters({style:'bezel'},{__unexpected:1}),/UNKNOWN_CAD_PARAMETER/);
 assert.throws(()=>C.consume('any','guessed'),/DOWNLOAD_EXPIRED/);
});
