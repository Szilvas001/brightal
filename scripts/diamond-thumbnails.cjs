'use strict';
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright'),sharp=require('sharp'),esbuild=require('esbuild');
const {DIR,key}=require('../server/diamond-previews');
(async()=>{
 let input='';if(!process.stdin.isTTY)for await(const chunk of process.stdin)input+=chunk;
 const stones=input.trim()?JSON.parse(input):require('../server/diamonds').catalogue();
 fs.mkdirSync(DIR,{recursive:true});
 const bundle=esbuild.buildSync({entryPoints:[path.join(__dirname,'../public/builder/diamond-preview.mjs')],bundle:true,write:false,format:'iife',logLevel:'silent'}).outputFiles[0].contents;
 const server=http.createServer((req,res)=>{if(req.url==='/render.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle);}else res.end('<!doctype html><style>body{margin:0;background:radial-gradient(ellipse at 50% 42%,#fff 10%,#f1f0ed 100%)}#preview{width:640px;height:520px}</style><div id="preview"></div><script src="/render.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:640,height:520}});await page.goto(`http://127.0.0.1:${server.address().port}`);
 for(const stone of stones){const file=path.join(DIR,key(stone)+'.webp');if(fs.existsSync(file))continue;
 await page.evaluate(x=>window.renderDiamond(x),stone);await page.screenshot({path:file+'.png'});await sharp(file+'.png').webp({quality:90}).toFile(file+'.tmp');fs.renameSync(file+'.tmp',file);fs.unlinkSync(file+'.png');console.log(stone.shape,file);
 }
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
