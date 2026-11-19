const test=require('node:test'),assert=require('node:assert/strict');
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
async function fixture(){const {GeometryClient}=await import('../public/builder/geometry-client.mjs');const workers=[],models=[],errors=[];const client=new GeometryClient(model=>models.push(model),error=>errors.push(error),{delay:0,createWorker:()=>{const worker={messages:[],terminated:false,postMessage(data){this.messages.push(data);},terminate(){this.terminated=true;}};workers.push(worker);return worker;}});return {client,workers,models,errors};}
test('rapid requests coalesce; obsolete active jobs and their late responses cannot block or replace the current ring',async()=>{
 const {client,workers,models}=await fixture();
 try{client.request({style:'halo'});client.request({style:'band'});await tick();assert.equal(workers[0].messages.length,1);assert.equal(workers[0].messages[0].config.style,'band');
 const old=workers[0],oldId=old.messages[0].id;client.request({style:'duet'});assert.equal(old.terminated,true);await tick();const current=workers[1],id=current.messages[0].id;
 old.onmessage({data:{id:oldId,packed:'obsolete'}});old.onerror({message:'obsolete failure'});assert.equal(workers.length,2);assert.deepEqual(models,[]);
 current.onmessage({data:{id,packed:'current'}});assert.deepEqual(models,['current']);assert.equal(client.busy,false);
 }finally{client.dispose();}
});
test('a poisoned WASM worker is replaced once; persistent errors are reported and the next valid design can recover',async()=>{
 const {client,workers,models,errors}=await fixture();
 try{client.request({style:'band'});await tick();const id=workers[0].messages[0].id;workers[0].onmessage({data:{id,error:'WASM failure'}});assert.equal(workers[0].terminated,true);assert.equal(workers.length,2);assert.deepEqual(workers[1].messages,[{id,config:{style:'band'}}]);
 workers[1].onmessage({data:{id,error:'invalid solid'}});assert.equal(workers.length,2);assert.deepEqual(errors,['invalid solid']);
 client.request({style:'solitaire'});await tick();const next=workers[1].messages.at(-1).id;workers[1].onmessage({data:{id:next,packed:'valid ring'}});assert.deepEqual(models,['valid ring']);
 }finally{client.dispose();}
});
test('unmount cancels pending work and ignores all later worker callbacks',async()=>{
 const {client,workers,models,errors}=await fixture();client.request({style:'halo'});client.dispose();await tick();assert.equal(workers[0].messages.length,0);assert.equal(workers[0].terminated,true);workers[0].onmessage({data:{id:client.id,packed:'late'}});workers[0].onerror({message:'late'});assert.deepEqual(models,[]);assert.deepEqual(errors,[]);
});
test('an early solid is shown while its checks run; the job stays active until the verdict',async()=>{
 const {GeometryClient}=await import('../public/builder/geometry-client.mjs');const calls=[];let worker;
 const client=new GeometryClient((model,info)=>calls.push([model,info.early]),()=>{},{delay:0,createWorker:()=>(worker={messages:[],postMessage(d){this.messages.push(d);},terminate(){}})});
 try{client.request({style:'halo'});await tick();const id=worker.messages[0].id;
  worker.onmessage({data:{id,early:true,packed:'solid'}});assert.deepEqual(calls,[['solid',true]]);assert.equal(client.busy,true);
  worker.onmessage({data:{id,packed:'verdict'}});assert.deepEqual(calls,[['solid',true],['verdict',false]]);assert.equal(client.busy,false);
 }finally{client.dispose();}
});
test('the worker sends the finished solid first, then the verdict without repeating the geometry; a cached design is sent whole',async()=>{
 const messages=[];globalThis.self={postMessage:m=>messages.push(m)};
 await import('../public/builder/geometry-worker.mjs');const {stylePreset}=await import('../public/builder/catalog.mjs');
 await self.onmessage({data:{id:7,config:stylePreset('solitaire')}});
 assert.equal(messages.length,2);assert.equal(messages[0].early,true);assert.ok(messages[0].packed.object);assert.equal(messages[0].packed.engineering.checking,true);
 assert.equal(messages[1].early,undefined);assert.equal(messages[1].packed.object,null);assert.deepEqual(messages[1].packed.engineering.assemblyValidation.issues,[]);
 messages.length=0;await self.onmessage({data:{id:8,config:stylePreset('solitaire')}});
 assert.equal(messages.length,1);assert.ok(messages[0].packed.object);
 delete globalThis.self;
});
