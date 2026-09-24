'use strict';
const router=require('express').Router(),auth=require('../auth'),db=require('../db'),C=require('../cad'),fs=require('node:fs'),path=require('node:path');
router.use(auth.requireAdmin);
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.get('/schema',(req,res)=>res.json({styles:C.STYLES,limits:C.limits}));
router.get('/jobs',(req,res)=>res.json({jobs:C.list()}));
router.post('/mesh-jobs',async(req,res)=>{try{
 const raw=req.body.requestId?db.requests.find(r=>r.id===req.body.requestId)?.design?.config:req.body.config;
 const d=await require('../designs').parseDesign(JSON.stringify({version:3,design:raw,name:req.body.name}));
 if(!d)throw Error('DESIGN_REQUIRED');
 res.status(202).json(C.create(req.user.id,{requestId:req.body.requestId||null,config:d.config,name:d.name},{mode:'mesh'}));
}catch(e){res.status(400).json({error:e.message});}});
router.post('/parameters',async(req,res)=>{try{const config=req.body.requestId?db.requests.find(r=>r.id===req.body.requestId)?.design?.config:req.body.config;if(!config)throw Error('DESIGN_REQUIRED');res.json({parameters:await C.parameters(config)});}catch(e){res.status(400).json({error:e.message});}});
router.post('/jobs',async(req,res)=>{try{const source=req.body.requestId?db.requests.find(r=>r.id===req.body.requestId)?.design?.config:req.body.config;if(!source)throw Error('DESIGN_REQUIRED');const p=await C.parameters(source,req.body.overrides);res.status(202).json(C.create(req.user.id,{requestId:req.body.requestId||null,config:source},p));}catch(e){res.status(400).json({error:e.message});}});
router.get('/jobs/:id',(req,res)=>{const job=C.get(req.params.id);if(!job)return res.sendStatus(404);res.json({...job,formats:C.formats(job)});});
router.post('/jobs/:id/download', (req,res)=>{try{res.json({url:'/api/admin/cad/download/'+C.ticket(req.user.id,req.params.id,req.body.format),expiresIn:300});}catch(e){res.status(409).json({error:e.message});}});
router.get('/download/:token',(req,res)=>{try{const t=C.consume(req.user.id,req.params.token);if(t.format==='zip'){
 if(fs.existsSync(path.join(t.dir,'export.zip')))return res.download(path.join(t.dir,'export.zip'),'brightal-3d-'+t.id+'.zip');
 const {zipSync}=require('fflate'),entries={};for(const name of ['ring.step','ring.stl','ring.3mf','source.json','parameters.json','report.json'])entries[name]=new Uint8Array(fs.readFileSync(path.join(t.dir,name)));entries['generate.py']=new Uint8Array(fs.readFileSync(path.join(__dirname,'../cad/generate.py')));entries['requirements.txt']=new Uint8Array(fs.readFileSync(path.join(__dirname,'../cad/requirements.txt')));res.type('application/zip').attachment('brightal-cad-'+t.id+'.zip').send(Buffer.from(zipSync(entries)));
 }else res.download(path.join(t.dir,t.format==='json'?'report.json':'ring.'+t.format));}catch{res.status(403).json({error:'DOWNLOAD_EXPIRED'});}});
module.exports=router;
