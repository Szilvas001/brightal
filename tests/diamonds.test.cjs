const test=require('node:test'),assert=require('node:assert/strict');const D=require('../server/diamonds');
test('all shapes and filters with server-only prices; demos never have certificates',()=>{
 const rows=D.validate(D.sample()),items=rows.map(D.publicStone);assert.equal(items.length,10);for(const x of items){assert.equal(x.demo,true);assert.equal(x.purchasable,false);assert.equal(x.certificate,null);assert.equal(x.referencePrice,undefined);assert.equal(x.sourceReference,undefined);}
 assert.equal(D.price(100000),90000);assert.equal(D.filter(items,{shape:'heart'}).length,1);assert.equal(D.filter(items,{caratMin:2}).length,4);assert.equal(D.filter(items,{certificate:'123'}).length,0);assert.equal(D.filter(items,{priceMax:1}).length,0);assert.equal(D.filter(items,{depthMin:60,tableMax:60,ratioMin:1,polish:'Excellent',symmetry:'Excellent',fluorescence:'None'}).length,10);
});
test('reject uncertified live stock, malformed numbers, duplicate IDs and non-IGI links',()=>{
 const x=D.sample()[0];assert.throws(()=>D.validate([{...x,demo:false}]));assert.throws(()=>D.validate([{...x,referencePrice:-1}]));assert.throws(()=>D.validate([x,x]));assert.throws(()=>D.validate([{...x,demo:false,certificate:{lab:'IGI',number:'00000000',verified:true,url:'https://evil.example'}}]));
});
test('public client artifacts do not contain pricing inputs or formula',()=>{
 const fs=require('fs');for(const f of ['public/app.js','public/builder/bundle.js']){const code=fs.readFileSync(f,'utf8');assert.ok(!code.includes('DIAMOND_PRICE_MULTIPLIER'));assert.ok(!code.includes('referencePrice'));assert.ok(!code.includes('Noordia'));}
});
