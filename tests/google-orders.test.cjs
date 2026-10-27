'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),express=require('express');
test('first Google sign-in creates an account and repeat sign-in preserves its orders',async t=>{
 const cfg=require('../server/config'),auth=require('../server/auth'),db=require('../server/db');let users=[],sessionUser;
 cfg.google.clientId='test-client';auth.verifyGoogleToken=async()=>({email:'google@example.test',name:'Google Buyer',sub:'verified-google-id'});auth.createSession=async(res,id)=>{sessionUser=id;};
 db.users.find=fn=>users.find(fn);db.users.insert=async u=>{users.push(u);return u;};
 const app=express();app.use(express.json());app.use('/api/auth',require('../server/routes/auth'));const server=app.listen(0);await new Promise(r=>server.once('listening',r));t.after(()=>new Promise(r=>server.close(r)));
 const login=()=>fetch(`http://127.0.0.1:${server.address().port}/api/auth/google`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:'test-token'})});
 const first=await login();assert.equal(first.status,200);const user=(await first.json()).user;assert.equal(users.length,1);assert.equal(users[0].password,null);assert.equal(user.id,sessionUser);
 const order=require('../server/requests').build({user,body:{},files:[],lang:'hu'});
 const second=await login();assert.equal(second.status,200);assert.equal((await second.json()).user.id,order.userId);assert.equal(users.length,1);
});
