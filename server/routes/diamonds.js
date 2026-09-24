'use strict';
const router=require('express').Router();
const D=require('../diamonds'),auth=require('../auth'),db=require('../db'),R=require('../requests');
const supplier=require('../supplier-model');
router.get('/supplier/model',auth.requireAdmin,(req,res)=>{res.set('Cache-Control','no-store');try{res.json(supplier.read());}catch{res.status(503).json({error:'SUPPLIER_DATA_UNAVAILABLE'});}});
router.post('/supplier/model',auth.requireAdmin,(req,res)=>{res.set('Cache-Control','no-store');try{res.json(supplier.save(req.body,req.user.id));}catch(e){res.status(400).json({error:e.message});}});
router.post('/supplier/estimate',auth.requireAdmin,(req,res)=>{res.set('Cache-Control','no-store');try{res.json(supplier.estimate(req.body));}catch(e){res.status(400).json({error:e.message});}});
router.post('/sourcing',auth.requireUser,async(req,res)=>{try{
 if(req.user.role==='admin')return res.status(400).json({error:'ADMIN_CANNOT_ORDER'});
 const c=supplier.combination(req.body);
 const request=R.build({user:req.user,body:{},files:[],lang:req.body.lang});
 request.note=`Laboratóriumi kő beszerzési igény · ${c.shape} · ${c.carat} ct · ${c.color}/${c.clarity}. Készlet, IGI és végleges ár egyeztetendő.`;
 request.details.metal='Loose diamond';request.sourcing=c;
 await db.requests.insert(request);res.json({request:R.toPublic(request)});
}catch(e){res.status(400).json({error:e.message});}});
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
router.post('/sourcing/:number/confirm',auth.requireAdmin,(req,res)=>{
 const run=async()=>{
  const r=db.requests.find(x=>x.requestNumber===req.params.number);
  if(!r?.sourcing)return res.status(404).json({error:'NOT_FOUND'});
  if(!['submitted','rejected','approved'].includes(r.status))return res.status(409).json({error:'INVALID_TRANSITION'});
  const stone=D.catalogue().find(x=>x.id===req.body.stoneId);
  if(!stone||!Object.keys(r.sourcing).every(k=>stone[k]===r.sourcing[k]))return res.status(409).json({error:'EXACT_STONE_MATCH_REQUIRED'});
  const checked=require('../diamond-pricing').checkout(stone,D.publicStone(stone).price);
  if(db.requests.find(x=>x.id!==r.id&&x.diamond?.id===stone.id&&!['canceled','rejected'].includes(x.status)))return res.status(409).json({error:'STONE_RESERVED'});
  const now=new Date().toISOString();
  const updated=await db.requests.update(x=>x.id===r.id,x=>({...x,diamond:D.publicStone(stone),price:checked.price,accounting:checked.accounting,status:'approved',approvedAt:now,updatedAt:now,adminNote:String(req.body.adminNote||'').slice(0,600),history:[...x.history,{at:now,event:'supplier_stone_confirmed',by:req.user.id,stoneId:stone.id,price:checked.price}]}));
  require('../mailer').requestApproved(updated,updated.lang).catch(()=>{});
  res.json({request:R.toPublic(updated,{includeInternal:true})});
 };
 ordering=ordering.then(run,run).catch(e=>{if(!res.headersSent)res.status(409).json({error:e.message});});
});
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
