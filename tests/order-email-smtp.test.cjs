'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),net=require('node:net');
test('Nodemailer delivers HTML and inline image over SMTP, not the simulation path',async t=>{
 const messages=[],sockets=new Set();
 const smtp=net.createServer(socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));socket.write('220 test SMTP\r\n');let buffer='',data=false,body='';
  socket.on('data',chunk=>{buffer+=chunk.toString();let index;while((index=buffer.indexOf('\r\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+2);if(data){if(line==='.'){messages.push(body);body='';data=false;socket.write('250 accepted\r\n');}else body+=line+'\r\n';continue;}
   if(/^EHLO|^HELO/.test(line))socket.write('250 localhost\r\n');else if(/^DATA/.test(line)){data=true;socket.write('354 send message\r\n');}else if(/^QUIT/.test(line)){socket.end('221 goodbye\r\n');}else socket.write('250 OK\r\n');
  }});
 });
 await new Promise(r=>smtp.listen(0,'127.0.0.1',r));t.after(()=>{for(const socket of sockets)socket.destroy();return new Promise(r=>smtp.close(r));});
 const cfg=require('../server/config');Object.assign(cfg.mail,{enabled:true,host:'127.0.0.1',port:smtp.address().port,secure:false,user:'',pass:'',from:'BRIGHTAL <shop@example.test>'});
 const mailer=require('../server/mailer');assert.equal(mailer.isSimulated(),false);
 const r=require('../server/requests').build({user:{id:'u',name:'Teszt Vásárló',email:'buyer@example.test'},body:{},files:[],lang:'hu'});
 const message=require('../server/order-email').render(r,'received',{filename:'preview.gif',content:Buffer.from('GIF89a'),contentType:'image/gif'});
 const result=await mailer.send(message.to,message.subject,message.text,message.html,message.attachments);
 assert.equal(result.simulated,false);assert.equal(messages.length,1);assert.match(messages[0],/Content-Type: text\/html/);assert.match(messages[0],/Content-ID: <order-preview>/);assert.match(messages[0],/Content-Type: image\/gif/);assert.ok(messages[0].includes(r.requestNumber));
});
