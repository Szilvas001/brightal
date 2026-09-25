'use strict';
const supplier=require('./supplier-model');
const P=require('./diamond-pricing');

// Publish only the retail price; supplier evidence and purchase costs stay private.
function offer(input){
 const result=supplier.estimate(input,supplier.read());
 if(!Number.isSafeInteger(result.retailGrossHuf)||result.retailGrossHuf<=0)throw Error('PRICE_UNAVAILABLE');
 return {combination:result.combination,price:result.retailGrossHuf,currency:'HUF',fulfilment:'sourced',purchasable:true};
}
function checkout(input,expected){
 const result=offer(input);
 if(result.price!==expected)throw Error('PRICE_CHANGED');
 return {...result,accounting:P.accounting(result.price),acceptedAt:new Date().toISOString()};
}
module.exports={offer,checkout};
