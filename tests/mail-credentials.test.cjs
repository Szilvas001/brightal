'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
test('missing SMTP password keeps authenticated delivery disabled and queue pending',async()=>{
 const cfg=require('../server/config');Object.assign(cfg.mail,{enabled:true,host:'smtp.rackhost.hu',user:'rendeles@brightal.hu',pass:''});
 assert.equal(require('../server/mailer').isSimulated(),true);
 const db=require('../server/db');let inspected=false;db.mailJobs.all=()=>{inspected=true;return[];};
 await require('../server/order-mail-queue').tick();assert.equal(inspected,false);
});
