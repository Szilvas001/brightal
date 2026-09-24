const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../server/diamond-pricing'),F=require('../server/diamond-feed');
test('fixed-point supplier markup with HALF_UP ties and VAT reconciliation',()=>{
 for(const [input,expected] of [['100000',200000],['123455',246910],['5',10],['100000.24',200000],['100000.25',200001],['9999999999.99',20000000000]])assert.equal(P.price(input),expected);
 assert.deepEqual(P.accounting(90000),{grossHuf:90000,netHuf:'70866.14',vatHuf:'19133.86',vatRate:27});
 for(const invalid of ['NaN','1e6','-1','1.005','0',Infinity])assert.throws(()=>P.price(invalid));
});
test('certificate match is primary; full composite match mandatory and duplicates remain ambiguous',()=>{
 const row={id:'a',certificate:{number:'TEST-ONLY'},shape:'oval',carat:1,color:'D',clarity:'VS1',cut:'Excellent',polish:'Excellent',symmetry:'Excellent',fluorescence:'None',length:8,width:6,height:4};
 assert.equal(F.match([row],{certificateNumber:'TEST-ONLY',shape:'round'}).length,1);
 assert.equal(F.match([row],{...row,certificate:undefined}).length,1);
 assert.equal(F.match([row],{...row,height:undefined}).length,0);
 assert.equal(F.match([row,row],{certificateNumber:'TEST-ONLY'}).length,2);
 assert.equal(F.match([row],{...row,certificateNumber:'OTHER'}).length,0);
});
test('checkout blocks stale prices, tampered totals and failed verification',()=>{
 const stone={referencePrice:'123455',priceCheckedAt:new Date().toISOString(),sourceStatus:'verified',referenceSource:'dipen',referenceVatIncluded:true,available:true,certificate:{number:'TEST'}};
 assert.equal(P.checkout(stone,246910).price,246910);
 assert.throws(()=>P.checkout(stone,1),/PRICE_CHANGED/);
 assert.throws(()=>P.checkout({...stone,sourceStatus:'failed'},246910),/PRICE_UNAVAILABLE/);
 assert.throws(()=>P.checkout({...stone,priceCheckedAt:'2020-01-01'},246910),/PRICE_UNAVAILABLE/);
});
