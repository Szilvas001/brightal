'use strict';
const db=require('./db');
let enqueueing=Promise.resolve(), running=false, timer;
function enqueue(request,kind){
 // An admin notice is sent again for a revision request; a new offer is a new approval mail.
 const stamp=kind==='approved'?(request.finalOffer?.id||request.approvedAt):kind==='admin'?(request.updatedAt||request.createdAt):'initial';
 const id=`${request.id}:${kind}:${stamp}`;
 const run=async()=>{const existing=db.mailJobs.find(j=>j.id===id);if(existing)return existing;
  return db.mailJobs.insert({id,requestId:request.id,kind,request:JSON.parse(JSON.stringify(request)),createdAt:new Date().toISOString(),status:'pending',attempts:0,nextAttemptAt:Date.now()});};
 enqueueing=enqueueing.then(run,run);return enqueueing;
}
async function tick(){
 if(running)return;running=true;
 try{for(let n=0;n<20&&await next();n++);}finally{running=false;}
}
const CUSTOMER_ORDER=['received','approved','payment','contract'];
async function next(){
 {
  const mailer=require('./mailer');
  if(mailer.isSimulated())return false;
  const jobs=db.mailJobs.all();
  // Customer mails of one order arrive in the order of the process.
  const waits=j=>CUSTOMER_ORDER.includes(j.kind)&&jobs.some(o=>o.requestId===j.requestId&&o.id!==j.id&&CUSTOMER_ORDER.indexOf(o.kind)>=0&&CUSTOMER_ORDER.indexOf(o.kind)<CUSTOMER_ORDER.indexOf(j.kind)&&!['sent','superseded','failed'].includes(o.status));
  const job=jobs.find(j=>['pending','retry'].includes(j.status)&&j.nextAttemptAt<=Date.now()&&!waits(j));
  if(!job)return false;
  await db.mailJobs.update(j=>j.id===job.id,{status:'sending',attempts:job.attempts+1,error:null});
  try{
   const current=db.requests.find(r=>r.id===job.requestId);
   if(job.kind==='approved'&&(!current||current.status!=='approved'||current.finalOffer?.id!==job.request.finalOffer?.id)){
    await db.mailJobs.update(j=>j.id===job.id,{status:'superseded',error:null});return true;
   }
   let message;
   if(job.kind==='received'||job.kind==='approved'){
    // An optional GIF must never prevent delivery of the order acknowledgement.
    let attachment=null;
    try{attachment=await require('./order-preview').attachment(job.request,job.kind);}catch(e){console.error('[mail preview]',e.message);}
    const latest=db.requests.find(r=>r.id===job.requestId);
    if(job.kind==='approved'&&(!latest||latest.status!=='approved'||latest.finalOffer?.id!==job.request.finalOffer?.id)){
     await db.mailJobs.update(j=>j.id===job.id,{status:'superseded',error:null});return true;
    }
    message=require('./order-email').render(job.request,job.kind,attachment);
   }else message=mailer.compose(job.request,job.kind);
   if(!message.to)throw Error('NO_RECIPIENT');
   const result=await mailer.send(message.to,message.subject,message.text,message.html,message.attachments);
   if(result.simulated)throw Error('SMTP_NOT_CONFIGURED');
   await db.mailJobs.update(j=>j.id===job.id,{status:'sent',sentAt:new Date().toISOString(),to:message.to,error:null});
  }catch(e){
   await db.mailJobs.update(j=>j.id===job.id,{status:job.attempts>=4?'failed':'retry',nextAttemptAt:Date.now()+Math.min(3600000,30000*2**job.attempts),error:String(e.message).slice(0,250)});
   console.error(`[mail] ✖ ${job.kind} (${job.request.requestNumber}): ${e.message}`);
  }
  return true;
 }
}
async function start(){
 if(timer)return;
 // Recover jobs interrupted by a process restart; SMTP may have accepted a message before a crash.
 for(const job of db.mailJobs.filter(j=>j.status==='sending'))await db.mailJobs.update(j=>j.id===job.id,{status:'retry',nextAttemptAt:Date.now()});
 timer=setInterval(()=>tick().catch(e=>console.error('[mail queue]',e.message)),5000);timer.unref();
 tick().catch(e=>console.error('[mail queue]',e.message));
}
async function retry(id){const job=db.mailJobs.find(j=>j.id===id);if(!job||job.status==='sent'||job.status==='sending')throw Error('MAIL_NOT_RETRYABLE');return db.mailJobs.update(j=>j.id===id,{status:'pending',attempts:0,nextAttemptAt:Date.now(),error:null});}
// A message that cannot be sent right now never makes the business action fail.
function enqueueSafe(request,kind){return enqueue(request,kind).then(job=>{tick().catch(e=>console.error('[mail queue]',e.message));return job;});}
module.exports={enqueue:enqueueSafe,tick,start,retry};
