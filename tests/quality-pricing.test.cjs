const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../server/supplier-model'),F=require('../server/diamond-factors');
test('quality factors give consistent premiums, preserve supplier anchors and propagate every ordered grade',()=>{
 const at=Date.now(),base={shape:'oval',carat:1,color:'F',clarity:'VS1',cut:'Excellent',polish:'Excellent',symmetry:'Excellent',fluorescence:'None'};
 const data={observations:[{...base,id:'synthetic',usd:'120',date:new Date(at).toISOString().slice(0,10)}],fx:{hufPerUsd:'300',checkedAt:new Date(at).toISOString()}};
 const estimate=x=>S.estimate({...base,...x},data,at);
 assert.equal(estimate({}).estimatedUsd,'120.00');assert.equal(estimate({}).retailGrossHuf,72000);
 for(const key of ['color','clarity','cut','polish','symmetry','fluorescence']){
  const entries=Object.entries(F.TABLES[key]);
  for(const [a,fa]of entries)for(const [b,fb]of entries)if(fa>fb)assert.ok(estimate({[key]:a}).retailGrossHuf>estimate({[key]:b}).retailGrossHuf,key+': '+a+' > '+b);
 }
 assert.ok(estimate({carat:3}).retailGrossHuf>estimate({carat:2}).retailGrossHuf);
 assert.notEqual(estimate({shape:'round'}).retailGrossHuf,estimate({shape:'heart'}).retailGrossHuf);
 const c=S.combination({...base,polish:'Good',symmetry:'Very Good',fluorescence:'Faint'});
 assert.equal(c.polish,'Good');assert.equal(c.symmetry,'Very Good');assert.equal(c.fluorescence,'Faint');
 assert.throws(()=>S.combination({...base,cut:'fake'}));
 assert.equal(estimate({}).modelVersion,F.VERSION);
});
