'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),express=require('express');
test('customer registration and Google sign-in are unavailable; only admin can sign in',async t=>{
 const auth=require('../server/auth');let created=0;
 auth.createSession=async()=>{created++;};auth.checkAdmin=(id,pw)=>id==='test-admin'&&pw==='test-password';
 const app=express();app.use(express.json());app.use('/api/auth',require('../server/routes/auth'));const server=app.listen(0);await new Promise(r=>server.once('listening',r));t.after(()=>new Promise(r=>server.close(r)));
 const post=(route,body)=>fetch(`http://127.0.0.1:${server.address().port}/api/auth/${route}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await post('google',{credential:'test-token'})).status,404);
 assert.equal((await post('register',{email:'buyer@example.test',password:'test-password'})).status,404);
 assert.equal((await post('login',{email:'buyer@example.test',password:'test-password'})).status,401);
 assert.equal(created,0);
 const login=await post('login',{username:'test-admin',password:'test-password'});assert.equal(login.status,200);assert.equal((await login.json()).user.role,'admin');assert.equal(created,1);
});
