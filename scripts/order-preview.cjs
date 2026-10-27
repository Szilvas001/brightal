'use strict';
// Render the saved geometry from multiple angles and encode an email-compatible GIF.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const sharp=require('sharp'),{chromium}=require('playwright'),esbuild=require('esbuild');
(async()=>{
 let input='';for await(const chunk of process.stdin)input+=chunk;const config=JSON.parse(input);
 const bundle=esbuild.buildSync({stdin:{contents:`import {RingRenderer} from './public/builder/renderer.js'; import {initKernel} from './public/builder/kernel.mjs'; import {buildRing} from './public/builder/model.mjs'; import {unifyLegacy} from './public/builder/solidify.mjs'; window.prepare=async c=>{await initKernel();const r=new RingRenderer(document.getElementById('ring'),()=>{});r.update({...c,rotate:false},unifyLegacy(buildRing(c,r.studioTexture)));r.controls.enableDamping=false;window.frame=angle=>{r.camera.position.set(Math.sin(angle)*40,24,Math.cos(angle)*40);r.controls.update();return r.capture();};};`,resolveDir:path.join(__dirname,'..')},bundle:true,write:false,format:'iife',logLevel:'silent'}).outputFiles[0].contents;
 const server=http.createServer((req,res)=>{
  if(req.url==='/render.js'){res.setHeader('Content-Type','text/javascript');return res.end(bundle);}
  if(['/builder/manifold.js','/builder/manifold.wasm'].includes(req.url)){res.setHeader('Content-Type',req.url.endsWith('.wasm')?'application/wasm':'text/javascript');return fs.createReadStream(require.resolve('manifold-3d/'+path.basename(req.url))).pipe(res);}
  res.end('<!doctype html><style>body{margin:0;background:#f7f4ee}#ring{width:480px;height:400px}</style><div id="ring"></div><script src="/render.js"></script>');
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:480,height:400},deviceScaleFactor:1});
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(c=>window.prepare(c),config);
  const frames=[];
  for(let i=0;i<24;i++){const png=await page.evaluate(angle=>window.frame(angle),Math.PI/5+i*Math.PI*2/24);frames.push(await sharp(Buffer.from(png.split(',')[1],'base64')).flatten({background:'#f7f4ee'}).ensureAlpha().raw().toBuffer());}
  await sharp(Buffer.concat(frames),{raw:{width:480,height:400*24,channels:4,pageHeight:400}}).gif({loop:0,delay:120,colours:128}).toFile(process.argv[2]+'.tmp');
  fs.renameSync(process.argv[2]+'.tmp',process.argv[2]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
