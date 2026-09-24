'use strict';
const router=require('express').Router();
const D=require('../diamonds'),auth=require('../auth'),db=require('../db'),R=require('../requests');
router.get('/',(req,res)=>{try{
 const items=D.filter(D.catalogue().map(D.publicStone),req.query);
 const sort=req.query.sort==='price-desc'?-1:1;items.sort((a,b)=>sort*(a.price-b.price));
 res.json({items,facets:{shape:D.SHAPES,color:D.COLORS,clarity:D.CLARITIES,cut:D.GRADES,polish:D.GRADES,symmetry:D.GRADES,fluorescence:D.FLUORESCENCE}});
}catch(e){res.status(503).json({error:'CATALOG_UNAVAILABLE'});}});
router.post('/import',auth.requireAdmin,(req,res)=>{try{if(req.body.authorized!==true)throw new Error('Engedélyezett adatforrás és ellenőrzött tanúsítványok igazolása szükséges.');res.json({imported:D.importCatalogue(req.body.items)});}catch(e){res.status(400).json({error:e.message});}});
router.get('/pricing/status',auth.requireAdmin,(req,res)=>{try{res.json(require('../diamond-feed').status());}catch{res.status(503).json({error:'CATALOG_UNAVAILABLE'});}});
router.post('/pricing/import',auth.requireAdmin,(req,res)=>{try{if(req.body.authorized!==true)throw new Error('AUTHORIZED_SOURCE_REQUIRED');res.json(require('../diamond-feed').refresh(req.body.items,req.user.id));}catch(e){res.status(400).json({error:e.message});}});
// Reuse the established customer account, admin orders and Barion checkout.
// A stone is held by the stored approved order; retries return that same order.
let ordering=Promise.resolve();
router.post('/order',auth.requireUser,(req,res)=>{
 const run=async()=>{
  if(req.user.role==='admin')return res.status(400).json({error:'ADMIN_CANNOT_ORDER'});
  if(req.body.acceptTerms!==true)return res.status(400).json({error:'TERMS_REQUIRED'});
  const stone=D.catalogue().find(x=>x.id===req.body.id);
  if(!stone||!D.publicStone(stone).purchasable)return res.status(409).json({error:'STONE_NOT_PURCHASABLE'});
  let checked;try{checked=require('../diamond-pricing').checkout(stone,req.body.expectedPrice);}catch(e){return res.status(409).json({error:e.message});}
  const held=db.requests.find(x=>x.diamond?.id===stone.id&&!['canceled','rejected'].includes(x.status));
  if(held){if(held.userId===req.user.id&&held.status==='approved'){if(held.price!==checked.price)return res.status(409).json({error:'PRICE_CHANGED'});return res.json({request:R.toPublic(held)});}return res.status(409).json({error:'STONE_RESERVED'});}
  const request=R.build({user:req.user,body:{},files:[],lang:req.body.lang});
  request.diamond=D.publicStone(stone);request.price=checked.price;request.accounting=checked.accounting;request.status='approved';request.approvedAt=new Date().toISOString();
  request.note=`Laboratóriumi gyémánt · ${stone.shape} · ${stone.carat} ct · ${stone.color}/${stone.clarity} · IGI ${stone.certificate.number}`;
  request.details.metal='Loose diamond';request.history.push({at:request.approvedAt,event:'diamond_order'});
  await db.requests.insert(request);res.json({request:R.toPublic(request)});
 };
 ordering=ordering.then(run,run).catch(e=>{console.error('Diamond order:',e.message);if(!res.headersSent)res.status(500).json({error:'SERVER_ERROR'});});
});
router.get('/preview/:file',async(req,res)=>{const P=require('../diamond-previews');try{const stone=D.catalogue().find(x=>P.key(x)+'.webp'===req.params.file);if(!stone)return res.sendStatus(404);const file=await P.ensure(stone);res.set('Cache-Control','public, max-age=31536000, immutable');res.sendFile(file);}catch{res.sendStatus(503);}});
router.get('/:id',(req,res)=>{try{const x=D.catalogue().find(x=>x.id===req.params.id);if(!x)return res.status(404).json({error:'NOT_FOUND'});res.json({item:D.publicStone(x)});}catch{res.status(503).json({error:'CATALOG_UNAVAILABLE'});}});
module.exports=router;
