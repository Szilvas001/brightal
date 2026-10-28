'use strict';
const db=require('./db');
let enqueueing=Promise.resolve(), running=false, timer;
function enqueue(request,kind){
 const id=`${request.id}:${kind}:${kind==='approved'?(request.finalOffer?.id||request.approvedAt):'initial'}`;
 const run=async()=>{const existing=db.mailJobs.find(j=>j.id===id);if(existing)return existing;
  return db.mailJobs.insert({id,requestId:request.id,kind,request:JSON.parse(JSON.stringify(request)),createdAt:new Date().toISOString(),status:'pending',attempts:0,nextAttemptAt:Date.now()});};
 enqueueing=enqueueing.then(run,run);return enqueueing;
}
async function tick(){
 if(running)return;running=true;
 try{
  const mailer=require('./mailer');
  if(mailer.isSimulated())return;
  const jobs=db.mailJobs.all();
  const job=jobs.find(j=>['pending','retry'].includes(j.status)&&j.nextAttemptAt<=Date.now()&&!(j.kind==='approved'&&jobs.some(other=>other.requestId===j.requestId&&other.kind==='received'&&other.status!=='sent')));
  if(!job)return;
  await db.mailJobs.update(j=>j.id===job.id,{status:'sending',attempts:job.attempts+1,error:null});
  try{
   const current=db.requests.find(r=>r.id===job.requestId);
   if(job.kind==='approved'&&(!current||current.status!=='approved'||current.finalOffer?.id!==job.request.finalOffer?.id)){
    await db.mailJobs.update(j=>j.id===job.id,{status:'superseded',error:null});return;
   }
   // An optional GIF must never prevent delivery of the order acknowledgement.
   let attachment=null;
   try{attachment=await require('./order-preview').attachment(job.request,job.kind);}catch(e){console.error('[mail preview]',e.message);}
   const latest=db.requests.find(r=>r.id===job.requestId);
   if(job.kind==='approved'&&(!latest||latest.status!=='approved'||latest.finalOffer?.id!==job.request.finalOffer?.id)){
    await db.mailJobs.update(j=>j.id===job.id,{status:'superseded',error:null});return;
   }
   const message=require('./order-email').render(job.request,job.kind,attachment);
   const result=await mailer.send(message.to,message.subject,message.text,message.html,message.attachments);
   if(result.simulated)throw Error('SMTP_NOT_CONFIGURED');
   await db.mailJobs.update(j=>j.id===job.id,{status:'sent',sentAt:new Date().toISOString(),error:null});
  }catch(e){
   await db.mailJobs.update(j=>j.id===job.id,{status:job.attempts>=4?'failed':'retry',nextAttemptAt:Date.now()+Math.min(3600000,30000*2**job.attempts),error:String(e.message).slice(0,250)});
  }
 }finally{running=false;}
}
async function start(){
 if(timer)return;
 // Recover jobs interrupted by a process restart; SMTP may have accepted a message before a crash.
 for(const job of db.mailJobs.filter(j=>j.status==='sending'))await db.mailJobs.update(j=>j.id===job.id,{status:'retry',nextAttemptAt:Date.now()});
 timer=setInterval(()=>tick().catch(e=>console.error('[mail queue]',e.message)),5000);timer.unref();
 tick().catch(e=>console.error('[mail queue]',e.message));
}
async function retry(id){const job=db.mailJobs.find(j=>j.id===id);if(!job||job.status==='sent'||job.status==='sending')throw Error('MAIL_NOT_RETRYABLE');return db.mailJobs.update(j=>j.id===id,{status:'pending',attempts:0,nextAttemptAt:Date.now(),error:null});}
module.exports={enqueue,tick,start,retry};
