'use strict';
const D=require('./diamonds'),S=require('./supplier-model'),P=require('./diamond-previews');
function catalogue(q={}){
 const data=S.read();
 const carat=Number(q.carat||q.caratMin||Math.min(1,Number(q.caratMax)||1)),color=q.color||'F',clarity=q.clarity||'VS1';
 for(const key of ['cut','polish','symmetry','fluorescence'])if(q[key]&&!(key==='fluorescence'?D.FLUORESCENCE:D.GRADES).includes(q[key]))throw Error('INVALID_GRADE');
 S.combination({shape:q.shape||'round',carat,color,clarity});
 const shapes=q.shape?[q.shape]:D.SHAPES;
 return shapes.map(shape=>{
  const c={shape,carat,color,clarity},estimate=S.estimate(c,data),ref=P.canonical(c),scale=Math.cbrt(carat);
  return {id:'configured-'+shape+'-'+carat+'-'+color+'-'+clarity,...c,cut:q.cut||'Excellent',polish:q.polish||'Excellent',symmetry:q.symmetry||'Excellent',fluorescence:q.fluorescence||'None',length:Number((ref.length*scale).toFixed(2)),width:Number((ref.width*scale).toFixed(2)),height:Number((ref.height*scale).toFixed(2)),ratio:Number((ref.length/ref.width).toFixed(3)),depth:ref.depth,table:ref.table,price:estimate.retailGrossHuf,currency:'HUF',estimated:true,requestable:true,purchasable:Number.isSafeInteger(estimate.retailGrossHuf)&&estimate.retailGrossHuf>0,illustrative:true,fulfilment:'sourced',certificate:null,demo:false,previewUrl:'/api/diamonds/preview/'+P.key(ref)+'.webp',priceNote:'Modellalapú becslés. Egyedileg beszerzendő kő; a tanúsítvány a beszerzéskor válik elérhetővé.',dimensionsEstimated:true};
 });
}
module.exports={catalogue};
