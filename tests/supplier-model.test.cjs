const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../server/supplier-model');
const row={id:'synthetic-only',shape:'oval',color:'F',clarity:'VS1',carat:1,usd:'100.00',currency:'USD',date:'2026-01-01',kind:'quote',stoneOnly:true,evidence:'Synthetic test fixture, not a supplier offer'};
test('supplier model validates evidence and never invents a temporal decline',()=>{
 const data=S.validate({observations:[row],fx:null});const r=S.estimate(row,data,Date.parse('2026-02-01'));
 assert.equal(r.estimatedUsd,'100.00');assert.equal(r.annualTrendPercent,null);assert.equal(r.retailGrossHuf,null);assert.equal(r.requiresSupplierConfirmation,true);
 assert.throws(()=>S.validate({observations:[{...row,stoneOnly:false}]}));assert.throws(()=>S.validate({observations:[row,row]}));assert.throws(()=>S.combination({...row,carat:Infinity}));
 const extrapolated=S.estimate({...row,shape:'heart',carat:10},data,Date.parse('2026-02-01'));assert.ok(extrapolated.warnings.some(x=>x.includes('extrapolált')));assert.ok(extrapolated.warnings.some(x=>x.includes('tartományon')));
});
test('fixed point USD conversion, retail markup, FX expiry and matched temporal observations',()=>{
 assert.equal(S.convertUsd('100.25','350.50'),'35137.63');
 const now=Date.parse('2026-03-01');
 const data=S.validate({observations:[row,{...row,id:'second',date:'2026-02-01',usd:'90'}],fx:{hufPerUsd:'350',source:'Synthetic',checkedAt:'2026-03-01'}});
 const r=S.estimate(row,data,now);assert.equal(r.trendPairs,1);assert.ok(r.annualTrendPercent<0);assert.ok(Number(r.estimatedUsd)<90);assert.ok(r.retailGrossHuf>0);
 assert.equal(S.estimate(row,data,now+8*86400000).retailGrossHuf,null);
 const exact=S.estimate(row,{...data,observations:[row]},now);assert.equal(exact.retailGrossHuf,70000);
});
test('supplier APIs refuse anonymous callers',async()=>{
 const express=require('express'),app=express();app.use(express.json());app.use('/api/diamonds',require('../server/routes/diamonds'));
 const server=app.listen(0);try{const base='http://127.0.0.1:'+server.address().port;for(const [path,method] of [['model','GET'],['model','POST'],['estimate','POST']]){const r=await fetch(base+'/api/diamonds/supplier/'+path,{method,headers:{'Content-Type':'application/json'},...(method==='POST'?{body:'{}'}:{})});assert.ok([401,403].includes(r.status));}}finally{server.close();}
});
