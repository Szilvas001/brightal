'use strict';
// Fixed-point decimal arithmetic: supplier HUF -> hundredths -> gross whole HUF.
// Integer arithmetic is used throughout; ties round upwards for positive money.
function decimalMinor(value) {
 const s=String(value);
 if(!/^(0|[1-9]\d{0,10})(\.\d{1,2})?$/.test(s))throw new Error('INVALID_GROSS_HUF');
 const [whole,fraction='']=s.split('.');
 const n=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
 if(n<=0n||n>1000000000000n)throw new Error('INVALID_GROSS_HUF');
 return n;
}
/** @param {bigint} n @param {bigint} d @returns {bigint} */
const halfUp=(n,d)=>(n+d/2n)/d;
// Retail gross is twice the approved supplier stone cost, rounded once to HUF.
function price(supplierCost){return Number(halfUp(decimalMinor(supplierCost)*2n,100n));}
function accounting(gross){
 if(!Number.isSafeInteger(gross)||gross<0)throw new Error('INVALID_GROSS_HUF');
 const total=BigInt(gross)*100n,net=halfUp(total*100n,127n),vat=total-net;
 const format=n=>`${n/100n}.${String(n%100n).padStart(2,'0')}`;
 return {grossHuf:gross,netHuf:format(net),vatHuf:format(vat),vatRate:27};
}
function priceStatus(stone,now=Date.now()){
 if(stone.demo)return 'development';
 const checked=Date.parse(stone.priceCheckedAt);
 if(stone.sourceStatus!=='verified'||stone.referenceSource!=='dipen')return 'unverified';
 if(!Number.isFinite(checked)||checked>now+60000||now-checked>24*3600000)return 'stale';
 try{decimalMinor(stone.referencePrice);}catch{return 'invalid';}
 return 'current';
}
function checkout(stone,expected){
 if(!stone||stone.demo||!stone.available||!stone.certificate||priceStatus(stone)!=='current')throw new Error('PRICE_UNAVAILABLE');
 const current=price(stone.referencePrice);
 if(expected!==current)throw new Error('PRICE_CHANGED');
 return {price:current,accounting:accounting(current)};
}
module.exports={decimalMinor,price,accounting,priceStatus,checkout};
