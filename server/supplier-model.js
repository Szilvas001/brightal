'use strict';
// Private observations never enter the browser bundle or public catalogue.
const fs=require('node:fs'),path=require('node:path');
const D=require('./diamonds'),P=require('./diamond-pricing');
const FILE=process.env.SUPPLIER_MODEL_FILE||path.join(__dirname,'../data/supplier-model.json');
function combination(x){
 if(!x||!D.SHAPES.includes(x.shape)||!D.COLORS.includes(x.color)||!D.CLARITIES.includes(x.clarity)||typeof x.carat!=='number'||!Number.isFinite(x.carat)||x.carat<0.1||x.carat>30)throw Error('INVALID_COMBINATION');
 return {shape:x.shape,color:x.color,clarity:x.clarity,carat:x.carat};
}
function validate(input){
 if(!input||!Array.isArray(input.observations)||input.observations.length>1000)throw Error('INVALID_OBSERVATIONS');
 const ids=new Set();
 const observations=input.observations.map(x=>{
  const c=combination(x);
  if(typeof x.id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(x.id)||ids.has(x.id))throw Error('INVALID_OBSERVATION_ID');ids.add(x.id);
  if(!['quote','purchase'].includes(x.kind)||x.currency!=='USD'||x.stoneOnly!==true||typeof x.evidence!=='string'||!x.evidence.trim())throw Error('STONE_UNIT_PRICE_EVIDENCE_REQUIRED');
  P.decimalMinor(x.usd);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(Date.parse(x.date))||Date.parse(x.date)>Date.now())throw Error('INVALID_OBSERVATION_DATE');
  return {...c,id:x.id,kind:x.kind,currency:'USD',usd:String(x.usd),date:x.date,stoneOnly:true,evidence:x.evidence.slice(0,600)};
 });
 let fx=null;
 if(input.fx){P.decimalMinor(input.fx.hufPerUsd);const at=Date.parse(input.fx.checkedAt);if(!Number.isFinite(at)||at>Date.now()+60000||!String(input.fx.source||'').trim())throw Error('INVALID_FX');fx={hufPerUsd:String(input.fx.hufPerUsd),checkedAt:new Date(at).toISOString(),source:String(input.fx.source).slice(0,200)};}
 return {observations,fx};
}
function read(){if(!fs.existsSync(FILE))return {observations:[],fx:null};return validate(JSON.parse(fs.readFileSync(FILE,'utf8')));}
function save(input,actor){const data=validate(input);data.updatedAt=new Date().toISOString();data.updatedBy=actor;fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE+'.tmp',JSON.stringify(data,null,2),{mode:0o600});fs.renameSync(FILE+'.tmp',FILE);return data;}
function convertUsd(usd,fx){const n=P.decimalMinor(usd)*P.decimalMinor(fx);const cents=(n+50n)/100n;return `${cents/100n}.${String(cents%100n).padStart(2,'0')}`;}
function distance(a,b){return Math.hypot(Math.log(a.carat/b.carat)*2,(D.COLORS.indexOf(a.color)-D.COLORS.indexOf(b.color))*.35,(D.CLARITIES.indexOf(a.clarity)-D.CLARITIES.indexOf(b.clarity))*.3,a.shape===b.shape?0:2);}
function estimate(input,data=read(),now=Date.now()){
 const c=combination(input),rows=data.observations.filter(x=>Date.parse(x.date)<=now);
 if(!rows.length)throw Error('NO_SUPPLIER_OBSERVATIONS');
 // Temporal trend only from repeat comparable specifications, never from
 // different sizes/grades whose price differences would confound time.
 const rates=[];
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  const a=rows[i],b=rows[j],days=(Date.parse(b.date)-Date.parse(a.date))/86400000;
  if(a.shape===b.shape&&a.color===b.color&&a.clarity===b.clarity&&Math.abs(Math.log(a.carat/b.carat))<.01&&Math.abs(days)>=30)rates.push(Math.log((Number(b.usd)/b.carat)/(Number(a.usd)/a.carat))/days);
 }
 rates.sort((a,b)=>a-b);
 const rate=rates.length?Math.max(Math.log(.1)/365,Math.min(Math.log(2)/365,rates[Math.floor(rates.length/2)])):0;
 const neighbors=rows.map(x=>({...x,distance:distance(c,x)})).sort((a,b)=>a.distance-b.distance||b.date.localeCompare(a.date)).slice(0,8);
 const exact=neighbors.filter(x=>x.distance<1e-9).sort((a,b)=>b.date.localeCompare(a.date))[0];
 const used=exact?[exact]:neighbors;
 let sum=0,weights=0;
 for(const x of used){const w=1/(.05+x.distance*x.distance);const age=Math.max(0,(now-Date.parse(x.date))/86400000);sum+=w*(Math.log(Number(x.usd)/x.carat)+rate*age);weights+=w;}
 const usd=(Math.exp(sum/weights)*c.carat).toFixed(2);
 const warnings=[];
 if(!rates.length)warnings.push('Nincs ismételt, összehasonlítható időbeli adat; automatikus áresést nem feltételezünk.');
 if(!rows.some(x=>x.shape===c.shape))warnings.push('Ehhez a formához nincs megfigyelés: más formákból extrapolált becslés.');
 if(!exact)warnings.push('Becsült ár, nem aktuális beszállítói ajánlat.');
 if(rows.length<10)warnings.push('Kevés adat: a szín- és tisztasági felárak nem becsülhetők megbízhatóan.');
 if(c.carat<Math.min(...rows.map(x=>x.carat))||c.carat>Math.max(...rows.map(x=>x.carat)))warnings.push('A karát a megfigyelt tartományon kívül esik.');
 const fxCurrent=data.fx&&now-Date.parse(data.fx.checkedAt)<=7*86400000&&Date.parse(data.fx.checkedAt)<=now+60000;
 const costHuf=fxCurrent?convertUsd(usd,data.fx.hufPerUsd):null;
 if(!fxCurrent)warnings.push('Hiányzó vagy 7 napnál régebbi USD/HUF árfolyam.');
 return {combination:c,estimatedUsd:usd,estimatedCostHuf:costHuf,retailGrossHuf:costHuf?P.price(costHuf):null,observations:rows.length,method:exact?'historical-match':'distance-weighted-log-price-per-carat',annualTrendPercent:rates.length?Number((Math.exp(rate*365)*100-100).toFixed(2)):null,trendPairs:rates.length,warnings,neighbors:used.map(x=>({id:x.id,date:x.date,kind:x.kind,distance:Number(x.distance.toFixed(3))})),requiresSupplierConfirmation:true};
}
module.exports={combination,validate,read,save,estimate,convertUsd};
