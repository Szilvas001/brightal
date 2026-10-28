'use strict';
const path=require('node:path'),express=require('express'),db=require('../db'),R=require('../requests'),O=require('../offers');
const access=require('../guest-access'),auth=require('../auth');
const router=express.Router();
router.use('/:number', (req,res,next)=>{
 const r=db.requests.find(x=>x.requestNumber===req.params.number);
 res.set({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'});
 if(!access.allowed(req,r))return res.status(404).json({error:'ORDER_LINK_INVALID'});
 req.order=r;next();
});
function visible(r){return {...R.toPublic(r),customer:r.customer};}
router.get('/:number',(req,res)=>res.json({request:visible(req.order)}));
router.get('/:number/terms',(req,res)=>{
 const text=req.order.acceptance?.offer?.termsText||req.order.finalOffer?.termsText;
 if(!text)return res.status(404).json({error:'NOT_FOUND'});
 res.attachment(req.order.requestNumber+'-ASZF.txt').type('text/plain; charset=utf-8').send(text);
});
router.get('/:number/design.json',(req,res)=>{
 const r=req.order;if(!r.design)return res.status(404).json({error:'NOT_FOUND'});
 res.attachment(r.requestNumber+'-design.json').json({version:3,name:r.design.name,design:r.design.config,sha256:r.design.sha256});
});
router.get('/:number/visual',(req,res)=>{
 const v=req.order.finalOffer&&(req.order.finalOffer.photoVisual||req.order.visual);
 if(!v||path.basename(v.filename)!==v.filename)return res.status(404).json({error:'NOT_FOUND'});
 res.type(v.mime).sendFile(path.join(require('../config').upload.dir,v.filename));
});
router.post('/:number/accept',async(req,res)=>{
 try {
  const updated=await db.requests.update(x=>x.id===req.order.id,r=>{
   if(r.acceptance){if(req.body.offerDigest!==r.acceptance.offerDigest)throw Error('OFFER_CHANGED');return r;}
   if(r.status!=='approved')throw Error('NOT_PAYABLE');
   const email=String(req.body.email||'').trim().toLowerCase();
   if(!auth.emailOk(email)||email!==r.customer.email)throw Error('EMAIL_MISMATCH');
   const shipping=Object.fromEntries(['name','country','zip','city','street','houseNumber','extra'].map(k=>[k,String(req.body.shipping?.[k]||'').trim().slice(0,250)]));
   if(['name','country','zip','city','street','houseNumber'].some(k=>!shipping[k]))throw Error('ADDRESS_REQUIRED');
   const acceptance=O.acceptance(r,{...req.body,billing:{...shipping,street:shipping.street+' '+shipping.houseNumber+(shipping.extra?', '+shipping.extra:'')},shippingAddress:Object.values(shipping).filter(Boolean).join(', ')},'guest:'+r.id);
   const now=acceptance.at;
   return {...r,acceptance:{...acceptance,shipping,email},customer:{...r.customer,name:shipping.name},billing:acceptance.billing,paymentStatus:'AwaitingTransfer',paymentMethod:'bank_transfer',updatedAt:now,history:[...r.history,{at:now,event:'customer_ordered',offerId:acceptance.offerId}]};
  });
  res.json({request:visible(updated)});
 }catch(e){res.status(409).json({error:e.message});}
});
router.post('/:number/revision',async(req,res)=>{
 const note=String(req.body.note||'').trim().slice(0,2000);
 if(note.length<3)return res.status(400).json({error:'REVISION_REQUIRED'});
 try{
  const updated=await db.requests.update(x=>x.id===req.order.id,r=>{
   if(r.acceptance||!['submitted','approved'].includes(r.status))throw Error('NOT_PAYABLE');
   const now=new Date().toISOString();return {...r,status:'submitted',finalOffer:null,price:null,updatedAt:now,note:(r.note||'')+'\nMódosítási kérés: '+note,history:[...r.history,{at:now,event:'revision_requested',note}]};
  });
  require('../mailer').adminNewRequest(updated).catch(e=>console.error('[mail]',e.message));
  res.json({request:visible(updated)});
 }catch(e){res.status(409).json({error:e.message});}
});
module.exports=router;
