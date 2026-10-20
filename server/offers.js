'use strict';
const crypto=require('crypto');
const cfg=require('./config');
const text=(v,max=6000)=>typeof v==='string'?v.trim().slice(0,max):'';
function create(body,request,now=new Date()) {
 const x=body.finalOffer||{},shippingFee=Number(x.shippingFee),total=Number(body.price);
 const offer={id:crypto.randomUUID(),issuedAt:now.toISOString(),specification:text(x.specification),previewUrl:text(x.previewUrl,2000),shippingFee,total,currency:request.currency,productionTime:text(x.productionTime,250),deliveryTime:text(x.deliveryTime,250),shippingMethod:text(x.shippingMethod,250),validUntil:text(x.validUntil,40),paymentTerms:text(x.paymentTerms,500),customMade:true};
 if(!offer.specification||!offer.previewUrl||!(/^(?:https:\/\/|\/uploads\/)/.test(offer.previewUrl))||!offer.productionTime||!offer.deliveryTime||!offer.shippingMethod||!offer.paymentTerms||!Number.isFinite(shippingFee)||shippingFee<0||!Number.isFinite(total)||total<=shippingFee||!Number.isFinite(Date.parse(offer.validUntil))||Date.parse(offer.validUntil)<=now.getTime()) throw new Error('FINAL_OFFER_REQUIRED');
 offer.productPrice=total-shippingFee;
 offer.design=request.design?.config||null;
 offer.termsVersion=cfg.company.legalEffectiveFrom;
 offer.digest=crypto.createHash('sha256').update(JSON.stringify(offer)).digest('hex');
 return offer;
}
function acceptance(request,body,userId,now=new Date()) {
 const offer=request.finalOffer;
 if(!offer)throw new Error('FINAL_OFFER_REQUIRED');
 if(offer.total!==request.price||offer.currency!==request.currency||body.offerId!==offer.id||body.offerDigest!==offer.digest)throw new Error('OFFER_CHANGED');
 if(Date.parse(offer.validUntil)<=now.getTime())throw new Error('OFFER_EXPIRED');
 for(const key of ['designApproved','priceAccepted','termsAccepted','privacyRead','withdrawalAcknowledged','paymentObligation'])if(body[key]!==true)throw new Error('APPROVAL_REQUIRED');
 const billing=Object.fromEntries(['name','country','zip','city','street'].map(k=>[k,text(body.billing?.[k],250)]));
 const shippingAddress=text(body.shippingAddress,1000);
 if(Object.values(billing).some(v=>v.length<2)||shippingAddress.length<10)throw new Error('ADDRESS_REQUIRED');
 const billingAddress=[billing.name,billing.country,billing.zip,billing.city,billing.street].join(', ');
 return {offerId:offer.id,offerDigest:offer.digest,userId,at:now.toISOString(),billing,billingAddress,shippingAddress,termsVersion:offer.termsVersion,declarations:{designApproved:true,priceAccepted:true,termsAccepted:true,privacyRead:true,withdrawalAcknowledged:true,paymentObligation:true},offer:JSON.parse(JSON.stringify(offer))};
}
function accepted(r){return !!r.finalOffer&&r.acceptance?.offerDigest===r.finalOffer.digest&&r.acceptance?.offerId===r.finalOffer.id;}
function custom(r){return !r.diamond&&!r.sourcing&&!r.combinationOffer;}
function readyForProduction(r){return accepted(r)&&!!r.contractAcceptedAt&&!!r.paidAt&&r.compliance?.cleared===true;}
module.exports={create,acceptance,accepted,custom,readyForProduction};
