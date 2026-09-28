'use strict';
const D=require('./diamonds'),S=require('./supplier-model'),P=require('./diamond-previews');
const WEIGHTS=[.3,.5,.7,1,1.25,1.5,2,2.5,3,4];
function catalogue(q={}){
 const data=S.read(),shapes=q.shape?[q.shape]:D.SHAPES;
 const min=Number(q.caratMin||.1),max=Number(q.caratMax||30);
 if(!Number.isFinite(min)||!Number.isFinite(max)||min>max)throw Error('INVALID_COMBINATION');
 let weights=q.carat?[Number(q.carat)]:WEIGHTS.filter(c=>c>=min&&c<=max);
 if(!weights.length)weights=[Math.max(.1,min)];
 const result=[];
 for(const [si,shape]of shapes.entries())for(const [i,carat]of weights.entries()){
  const c=S.combination({shape,carat,color:q.color||D.COLORS[(si+i)%7],clarity:q.clarity||D.CLARITIES[(si+i)%6],cut:q.cut||'Excellent',polish:q.polish||'Excellent',symmetry:q.symmetry||'Excellent',fluorescence:q.fluorescence||'None'});
  const estimate=S.estimate(c,data),ref=P.canonical(c),scale=Math.cbrt(carat);
  result.push({id:'configured-'+Object.values(c).join('-').replaceAll(' ','_'),...c,
   length:Number((ref.length*scale).toFixed(2)),width:Number((ref.width*scale).toFixed(2)),height:Number((ref.height*scale).toFixed(2)),
   ratio:Number((ref.length/ref.width).toFixed(3)),depth:ref.depth,table:ref.table,
   price:estimate.retailGrossHuf,currency:'HUF',estimated:true,requestable:true,purchasable:Number.isSafeInteger(estimate.retailGrossHuf)&&estimate.retailGrossHuf>0,
   illustrative:true,fulfilment:'sourced',certificate:null,demo:false,previewUrl:'/api/diamonds/preview/'+P.key(ref)+'.webp',
   priceNote:'Egyedileg beszerzendő kő; a tanúsítvány a beszerzéskor válik elérhetővé.',dimensionsEstimated:true});
 }
 return result;
}
module.exports={catalogue};
