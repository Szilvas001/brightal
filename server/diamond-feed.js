'use strict';
const fs=require('node:fs'),path=require('node:path');
const D=require('./diamonds'),P=require('./diamond-pricing');
const REVIEW=process.env.DIAMOND_REVIEW_FILE||path.join(__dirname,'../data/diamond-price-review.json');
const fields=['shape','carat','color','clarity','cut','polish','symmetry','fluorescence','length','width','height'];
function match(rows,entry){
 const number=entry.certificateNumber;
 if(number)return rows.filter(x=>!x.demo&&x.certificate?.number===String(number));
 if(!fields.every(k=>entry[k]!==undefined&&entry[k]!==null&&entry[k]!==''))return [];
 return rows.filter(x=>!x.demo&&fields.every(k=>String(x[k])===String(entry[k])));
}
function review(){try{return JSON.parse(fs.readFileSync(REVIEW,'utf8'));}catch{return [];}}
function refresh(entries,actor){
 if(!Array.isArray(entries)||entries.length>1000)throw new Error('INVALID_PRICE_FEED');
 const rows=D.catalogue().map(x=>({...x})),issues=[],updated=new Set();
 for(const entry of entries){
  const candidates=match(rows,entry);
  let reason;
  if(candidates.length!==1)reason='NO_UNIQUE_MATCH';
  else if(updated.has(candidates[0].id))reason='DUPLICATE_MATCH';
  else if(entry.currency!=='HUF'||entry.source!=='dipen'||entry.status!=='verified')reason='UNVERIFIED_GROSS_PRICE';
  else if(!Number.isFinite(Date.parse(entry.checkedAt))||Date.parse(entry.checkedAt)>Date.now()+60000||Date.now()-Date.parse(entry.checkedAt)>86400000)reason='STALE_VERIFICATION';
  else try{P.decimalMinor(entry.costHuf);}catch{reason='INVALID_GROSS_PRICE';}
  if(reason){issues.push({at:new Date().toISOString(),actor,reason,certificateNumber:String(entry.certificateNumber||''),candidateIds:candidates.map(x=>x.id)});if(candidates.length===1)candidates[0].sourceStatus='review';continue;}
  const x=candidates[0];x.referencePrice=String(entry.costHuf);x.priceCheckedAt=entry.checkedAt;x.sourceStatus='verified';x.sourceReference='dipen-approved-cost';x.referenceSource='dipen';x.referenceVatIncluded=true;updated.add(x.id);
 }
 D.save(rows);
 fs.mkdirSync(path.dirname(REVIEW),{recursive:true});fs.writeFileSync(REVIEW+'.tmp',JSON.stringify([...review(),...issues].slice(-2000)));fs.renameSync(REVIEW+'.tmp',REVIEW);
 return {updated:updated.size,review:issues};
}
function status(){return {items:D.catalogue().filter(x=>!x.demo).map(x=>({id:x.id,certificateNumber:x.certificate?.number,referenceGrossHuf:x.referencePrice,priceCheckedAt:x.priceCheckedAt,status:P.priceStatus(x),grossHuf:P.price(x.referencePrice),accounting:P.accounting(P.price(x.referencePrice))})),review:review()};}
module.exports={match,refresh,status};
