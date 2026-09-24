'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const ROOT=process.env.CAD_DATA_DIR||path.join(__dirname,'../data/cad');
const PYTHON=process.env.CAD_PYTHON||path.join(__dirname,'../.venv-cad/bin/python');
const STYLES=['solitaire','bezel','band','eastwest','contour','split','trilogy','duet','curvedoval','wavebezel','openpair'];
const limits={innerDiameter:[14,24],width:[1.8,8],thickness:[1.2,3.5],stoneLength:[1,10],stoneWidth:[1,8],stoneDepth:[.6,6],bezelWall:[.6,1.5],prongDiameter:[.7,1.5],prongCount:[4,8],prongRotation:[0,360],underOpening:[.3,3],settingHeight:[2.5,10],sideSize:[1,4],sideCount:[0,7],minimumWall:[.5,1],allowance:[0,.3],tolerance:[.01,.15],sculpt:[0,2.5],gap:[1,4]};
async function parameters(config,overrides={}){
 const {normalize}=await import('../public/builder/state.mjs');const s=normalize(config);
 if(!STYLES.includes(s.style))throw Error('CAD_STYLE_NOT_SUPPORTED');
 const modern=['eastwest','contour','curvedoval','wavebezel','openpair'].includes(s.style);
 const side=Number(s.sideCarat||.15),dim=6.5*Math.cbrt(s.carat||1);
 const defaults={style:s.style,innerDiameter:s.size/Math.PI,width:s.width,thickness:s.thickness,profile:s.profile,setting:modern?'bezel':s.setting==='bezel'?'bezel':'claw',shape:s.shape,orientation:s.orientation,stoneLength:modern?s.stoneLength:dim*(s.shape==='oval'?1.3:1),stoneWidth:modern?s.stoneWidth:dim,stoneDepth:modern?s.stoneDepth:dim*.6,bezelWall:Math.max(.6,s.bezelWall||.7),prongDiameter:1,prongCount:4,prongRotation:45,underOpening:.8,settingHeight:6.8,sideSize:Math.min(4,6.5*Math.cbrt(side)),sideCount:s.style==='contour'?5:0,minimumWall:.6,allowance:0,tolerance:.05,sculpt:s.sculpt||1,gap:2};
 const p={...defaults};
 for(const key of Object.keys(overrides)){
  if(!Object.hasOwn(defaults,key))throw Error('UNKNOWN_CAD_PARAMETER');p[key]=overrides[key];
 }
 if(!STYLES.includes(p.style)||!['round','flat','knife'].includes(p.profile)||!['bezel','claw'].includes(p.setting)||!['north','east'].includes(p.orientation))throw Error('INVALID_CAD_OPTION');
 for(const [key,[min,max]] of Object.entries(limits))if(typeof p[key]!=='number'||!Number.isFinite(p[key])||p[key]<min||p[key]>max)throw Error('INVALID_CAD_PARAMETER:'+key);
 if(!Number.isInteger(p.prongCount)||!Number.isInteger(p.sideCount))throw Error('INTEGER_PARAMETER_REQUIRED');
 const {outline}=await import('../public/builder/optics.mjs');const shapes=['round','oval','pear','emerald','radiant','cushion','princess','marquise','asscher','heart'];if(!shapes.includes(p.shape))throw Error('INVALID_SHAPE');
 const coords=Array.from({length:32},(_,i)=>outline(p.shape,2*Math.PI*i/32));const maxX=Math.max(...coords.map(x=>Math.abs(x[0]))),maxY=Math.max(...coords.map(x=>Math.abs(x[1])));
 const stone=(x,y,scale=1)=>({length:p.stoneLength*scale,width:p.stoneWidth*scale,depth:p.stoneDepth*scale,x,y,rotation:p.orientation==='east'?90:0,outline:coords.map(([a,b])=>[a/maxX,b/maxY])});
 p.stones=p.style==='band'?[]:[stone(0,0)];
 if(p.style==='trilogy')p.stones.push(stone(-(p.stoneWidth+p.sideSize)/2-1,0,p.sideSize/p.stoneWidth),stone((p.stoneWidth+p.sideSize)/2+1,0,p.sideSize/p.stoneWidth));
 if(p.style==='duet')p.stones=[stone(-p.stoneWidth*.6,-p.stoneLength*.18,.82),stone(p.stoneWidth*.6,p.stoneLength*.18,.82)];
 if(p.style==='openpair')p.stones=[stone(-p.gap/2-p.stoneWidth*.45,0,.8),stone(p.gap/2+p.stoneWidth*.45,0,.8)];
 if(p.style==='contour')p.stones=Array.from({length:Math.max(1,p.sideCount)},(_,i)=>{const x=(i-(Math.max(1,p.sideCount)-1)/2)*(p.sideSize+1.5);return stone(x,p.sculpt*Math.max(0,1-(x/7)**2),p.sideSize/p.stoneWidth);});
 if(p.underOpening>=Math.min(...(p.stones.length?p.stones.map(s=>Math.min(s.width,s.length)):[10]))-p.minimumWall)throw Error('OPENING_TOO_LARGE');
 return p;
}
function audit(actor,event,id){fs.mkdirSync(ROOT,{recursive:true});fs.appendFileSync(path.join(ROOT,'audit.jsonl'),JSON.stringify({at:new Date().toISOString(),actor,event,jobId:id})+'\n');}
const jobs=new Map();let queue=Promise.resolve();
function create(actor,source,p){
 if([...jobs.values()].filter(j=>['queued','running'].includes(j.status)).length>=4)throw Error('CAD_QUEUE_FULL');
 const id=crypto.randomUUID(),dir=path.join(ROOT,id);fs.mkdirSync(dir,{recursive:true,mode:0o700});
 fs.writeFileSync(path.join(dir,'parameters.json'),JSON.stringify(p));fs.writeFileSync(path.join(dir,'source.json'),JSON.stringify({config:source,sha256:crypto.createHash('sha256').update(JSON.stringify(source)).digest('hex')}));
 const job={id,actor,source,status:'queued',createdAt:new Date().toISOString()};jobs.set(id,job);audit(actor,'generate',id);
 queue=queue.then(()=>new Promise(resolve=>{
  job.status='running';const mesh=p.mode==='mesh';const child=spawn(mesh?process.execPath:PYTHON,mesh?[path.join(__dirname,'cad/mesh-export.cjs'),dir]:[path.join(__dirname,'cad/generate.py'),path.join(dir,'parameters.json'),dir],{stdio:['ignore','ignore','pipe']});let error='';
  const timer=setTimeout(()=>{job.error='CAD_TIMEOUT';child.kill('SIGKILL');},120000);
  child.stderr.on('data',b=>{error=(error+b).slice(-2000);});
  const finish=(code)=>{clearTimeout(timer);job.status=code===0?'ready':'failed';if(code!==0)job.error=job.error||error||'CAD_KERNEL_UNAVAILABLE';job.finishedAt=new Date().toISOString();const report=path.join(dir,'report.json');if(fs.existsSync(report))job.report=JSON.parse(fs.readFileSync(report));fs.writeFileSync(path.join(dir,'job.json'),JSON.stringify(job));audit(actor,job.status,id);resolve();};
  child.once('error',e=>{error=e.code;finish(1);});child.once('exit',finish);
 }));return job;
}
function get(id){if(!/^[0-9a-f-]{36}$/.test(id))return undefined;if(jobs.has(id))return jobs.get(id);try{const job=JSON.parse(fs.readFileSync(path.join(ROOT,id,'job.json')));jobs.set(id,job);return job;}catch{return undefined;}}
const tickets=new Map();
function formats(job){const dir=path.join(ROOT,job.id);return ['step','stl','3mf','obj'].filter(x=>fs.existsSync(path.join(dir,'ring.'+x))).concat(job.status==='ready'?['json','zip']:[]);}
function list(){if(fs.existsSync(ROOT))for(const id of fs.readdirSync(ROOT))get(id);return [...jobs.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(j=>({...j,formats:formats(j)}));}
function ticket(actor,id,format){const job=get(id);if(!job||job.status!=='ready'||!formats(job).includes(format))throw Error('EXPORT_NOT_READY');for(const [key,t] of tickets)if(t.expires<Date.now())tickets.delete(key);const token=crypto.randomBytes(24).toString('hex');tickets.set(token,{actor,id,format,expires:Date.now()+5*60000});return token;}
function consume(actor,token){const t=tickets.get(token);if(!t||t.actor!==actor||t.expires<Date.now())throw Error('DOWNLOAD_EXPIRED');tickets.delete(token);audit(actor,'download:'+t.format,t.id);return {...t,dir:path.join(ROOT,t.id)};}
module.exports={parameters,limits,STYLES,create,get,list,formats,ticket,consume,ROOT};
