'use strict';
const fs=require('node:fs');
const path=require('node:path');
const SHAPES=['round','oval','pear','emerald','radiant','cushion','princess','marquise','asscher','heart'];
const COLORS=['D','E','F','G','H','I','J','K','L','M'];
const CLARITIES=['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2'];
const GRADES=['Excellent','Very Good','Good','Fair','Poor','Not graded'];
const FLUORESCENCE=['None','Faint','Medium','Strong','Very Strong'];
const FILE=process.env.DIAMOND_FEED_FILE || path.join(__dirname,'../data/diamond-catalog.json');
const factor=Number(process.env.DIAMOND_PRICE_MULTIPLIER || .8);
if(!Number.isFinite(factor)||factor<=0)throw new Error('Invalid diamond price multiplier');
function price(referencePrice){return Math.max(100,Math.round(referencePrice*factor/100)*100);}
function validate(rows){
 if(!Array.isArray(rows)||rows.length>1000)throw new Error('Legfeljebb 1000 követ tartalmazó JSON-tömb szükséges.');
 const ids=new Set();
 return rows.map(x=>{
   if(!x||typeof x!=='object'||!/^[-a-zA-Z0-9]{1,64}$/.test(x.id)||ids.has(x.id))throw new Error('Hiányzó vagy ismétlődő kőazonosító.');
   ids.add(x.id);
   for(const [key,list] of Object.entries({shape:SHAPES,color:COLORS,clarity:CLARITIES,cut:GRADES,polish:GRADES,symmetry:GRADES,fluorescence:FLUORESCENCE}))if(!list.includes(x[key]))throw new Error('Érvénytelen mező: '+key);
   for(const key of ['carat','referencePrice','length','width','height','depth','table'])if(typeof x[key]!=='number'||!Number.isFinite(x[key])||x[key]<=0)throw new Error('Érvénytelen szám: '+key);
   if(x.carat>30||x.referencePrice>1e10||x.table>100||x.depth>100||Math.max(x.length,x.width,x.height)>50)throw new Error('Érvénytelen mérettartomány.');
   if(x.currency!=='HUF')throw new Error('A feed pénzneme HUF legyen.');
   const demo=x.demo===true;
   let certificate=null;
   if(!demo){
     const c=x.certificate;
     if(!c||c.lab!=='IGI'||!/^\d{6,20}$/.test(c.number)||c.verified!==true)throw new Error('Ellenőrzött IGI-adat szükséges.');
     let url;try{url=new URL(c.url);}catch{throw new Error('Érvénytelen tanúsítvány URL.');}
     if(url.protocol!=='https:'||!(url.hostname==='igi.org'||url.hostname.endsWith('.igi.org')))throw new Error('Hivatalos IGI HTTPS dokumentum vagy ellenőrzési link szükséges.');
     certificate={lab:'IGI',number:c.number,url:url.href};
     if(typeof x.sourceReference!=='string'||!x.sourceReference.trim())throw new Error('Az import belső forráshivatkozása szükséges.');
   }
   return {id:x.id,shape:x.shape,color:x.color,clarity:x.clarity,cut:x.cut,polish:x.polish,symmetry:x.symmetry,fluorescence:x.fluorescence,carat:x.carat,referencePrice:x.referencePrice,currency:'HUF',length:x.length,width:x.width,height:x.height,depth:x.depth,table:x.table,ratio:Number((x.length/x.width).toFixed(3)),demo,certificate,available:x.available!==false,sourceReference:demo?'development':x.sourceReference,importedAt:new Date().toISOString()};
 });
}
function sample(){return SHAPES.map((shape,i)=>({id:'demo-'+shape,shape,color:COLORS[i%7],clarity:CLARITIES[i%8],carat:Number((.7+i*.23).toFixed(2)),referencePrice:180000+i*75000,currency:'HUF',length:7+i*.2,width:6,height:4,depth:66.7,table:58,cut:'Excellent',polish:'Excellent',symmetry:'Excellent',fluorescence:'None',demo:true,available:true}));}
let cached,stamp;
function catalogue(){
 const next=fs.existsSync(FILE)?fs.statSync(FILE).mtimeMs:0;
 if(cached&&stamp===next)return cached;
 const rows=next?JSON.parse(fs.readFileSync(FILE,'utf8')):sample();
 // Reattach the importer attestation when validating our saved canonical feed.
 cached=validate(rows.map(x=>({...x,certificate:x.certificate?{...x.certificate,verified:true}:null})));stamp=next;return cached;
}
function publicStone(x){return {id:x.id,shape:x.shape,color:x.color,clarity:x.clarity,cut:x.cut,polish:x.polish,symmetry:x.symmetry,fluorescence:x.fluorescence,carat:x.carat,currency:x.currency,length:x.length,width:x.width,height:x.height,ratio:x.ratio,depth:x.depth,table:x.table,price:price(x.referencePrice),demo:x.demo,certificate:x.certificate,purchasable:!x.demo&&!!x.certificate&&x.available};}
function filter(rows,q){return rows.filter(x=>{
 for(const key of ['shape','color','clarity','cut','polish','symmetry','fluorescence'])if(q[key]&&x[key]!==q[key])return false;
 if(q.certificate&&!x.certificate?.number.includes(String(q.certificate)))return false;
 for(const key of ['carat','price','ratio','depth','table']){
  for(const [suffix,compare] of [['Min',(a,b)=>a<b],['Max',(a,b)=>a>b]]){
   const v=q[key+suffix];if(v!==undefined&&v!==''&&(!Number.isFinite(Number(v))||compare(x[key],Number(v))))return false;
  }
 }
 return true;
});}
function importCatalogue(rows){const clean=validate(rows);fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE+'.tmp',JSON.stringify(clean));fs.renameSync(FILE+'.tmp',FILE);stamp=null;cached=null;return clean.length;}
module.exports={catalogue,publicStone,filter,importCatalogue,validate,price,sample,SHAPES,COLORS,CLARITIES,GRADES,FLUORESCENCE};
