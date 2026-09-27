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
function catalogue(){
 const D=require('./diamonds'),data=supplier.read();
 return D.catalogue().map(stone=>{
  const publicItem=D.publicStone(stone);
  const result=supplier.estimate(stone,data);
  const price=result.retailGrossHuf;
  // These cards offer a specification to source, not a reservation of the
  // illustrative feed stone. Never imply its certificate or dimensions apply.
  return {...publicItem,price,currency:'HUF',certificate:null,demo:false,
   illustrative:true,fulfilment:'sourced',purchasable:Number.isSafeInteger(price)&&price>0};
 });
}
module.exports={offer,checkout,catalogue};
