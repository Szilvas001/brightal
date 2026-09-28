'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{problems}=require('../server/production-check');
const cfg={isProd:true,publicUrl:'https://shop.example.com',admin:{passwordHash:['scrypt','a'.repeat(32),'b'.repeat(128)].join('$')},barion:{simulate:false,envKey:'prod',posKey:'key',payee:'seller@example.com'},company:{name:'Company',address:'Address',taxNumber:'123',email:'a@example.com'}};
test('production rejects unsafe configuration, development stays usable',()=>{
 assert.deepEqual(problems(cfg,{SESSION_SECRET:'a'.repeat(64)}),[]);
 assert.ok(problems({...cfg,admin:{passwordHash:''},barion:{simulate:true},publicUrl:'http://localhost:3000'},{}).length>=4);
 assert.deepEqual(problems({isProd:false},{}),[]);
});
