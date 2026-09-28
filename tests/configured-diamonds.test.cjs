const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../server/supplier-model'),C=require('../server/configured-diamonds'),D=require('../server/diamonds'),P=require('../server/diamond-previews');
test('all 800 shape/color/clarity combinations have server estimates with only ten preview keys',()=>{
 const original=S.read;S.read=()=>({observations:[{id:'synthetic',shape:'oval',carat:1,color:'F',clarity:'VS1',usd:'100',date:new Date().toISOString().slice(0,10),kind:'quote'}],fx:{hufPerUsd:'300',checkedAt:new Date().toISOString()}});
 try{const keys=new Set();for(const shape of D.SHAPES)for(const color of D.COLORS)for(const clarity of D.CLARITIES){const [x]=C.catalogue({shape,color,clarity,carat:'1.25'});assert.ok(x.price>0);assert.equal(x.estimated,true);assert.equal(x.requestable,true);assert.equal(x.certificate,null);assert.equal(x.purchasable,true);assert.equal(x.referencePrice,undefined);keys.add(x.previewUrl);assert.equal(P.key(x),P.key({...x,carat:4,length:14,color:'D'}));}assert.equal(keys.size,10);assert.throws(()=>C.catalogue({carat:31}));}finally{S.read=original;}
});
