'use strict';
/**
 * ADMIN felület API-ja.
 * Minden végpont mögött auth.requireAdmin áll.
 */

const express = require('express');
const db = require('../db');
const auth = require('../auth');
const cfg = require('../config');
const R = require('../requests');
const mailer = require('../mailer');
const xport = require('../export');
const designs = require('../designs');
const offers = require('../offers');

const router = express.Router();
router.use(auth.requireAdmin);

/** Szűrés + rendezés — a lista és az export is ezt használja. */
function filterRequests(query) {
  const status = query.status;
  const q = String(query.q || '').trim().toLowerCase();
  let list = db.requests.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (query.source === 'diamond') list = list.filter(r => r.diamond || r.sourcing);
  if (query.source === 'designer') list = list.filter(r => r.design);
  if (status && status !== 'all') list = list.filter(r => r.status === status);
  if (q) {
    list = list.filter(r =>
      r.requestNumber.toLowerCase().includes(q) ||
      r.customer.email.toLowerCase().includes(q) ||
      r.customer.name.toLowerCase().includes(q));
  }
  return list;
}

/* ---------- áttekintés + lista ---------- */
router.get('/requests', (req, res) => {
  const list = filterRequests(req.query);

  const all = db.requests.all();
  const counts = { all: all.length };
  for (const s of Object.values(R.STATUS)) counts[s] = all.filter(r => r.status === s).length;

  const revenue = all.filter(r => ['paid', 'in_production', 'completed'].includes(r.status))
    .reduce((s, r) => s + (r.price || 0), 0);

  res.json({
    requests: list.map(r => R.toPublic(r, { includeInternal: true })),
    counts,
    revenue,
    currency: cfg.currency.code
  });
});

/* ══════════════════════════════════════════════════════════════════
   JÓVÁHAGYÁS + ÁRAZÁS
   Ez a folyamat lelke: az admin ideír egy árat, és a kérés azonnal
   fizethetővé válik az ügyfél fiókjában.
   ══════════════════════════════════════════════════════════════════ */
router.post('/requests/:requestNumber/approve', async (req, res) => {
  const r = db.requests.find(x => x.requestNumber === req.params.requestNumber);
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  if (r.sourcing && !r.combinationOffer) return res.status(409).json({error:'DIAMOND_CONFIRMATION_REQUIRED'});

  const price = (r.combinationOffer || r.diamond) ? r.price : R.roundPrice((req.body || {}).price);
  if (price === null) return res.status(400).json({ error: 'INVALID_PRICE' });

  const allowed = R.ADMIN_TRANSITIONS[r.status] || [];
  if (!allowed.includes(R.STATUS.APPROVED)) {
    return res.status(409).json({ error: 'INVALID_TRANSITION', from: r.status });
  }

  if(r.acceptance) return res.status(409).json({error:'ORDER_ALREADY_ACCEPTED'});
  if(r.paymentId && !['Failed','Canceled','Expired'].includes(r.paymentStatus)) return res.status(409).json({error:'PAYMENT_IN_PROGRESS'});
  let finalOffer, productionDays;
  try {
    const workflow = require('../order-workflow');
    productionDays = workflow.productionRange(req.body.productionRange);
    if(offers.custom(r)) finalOffer=offers.create({...req.body,price,finalOffer:workflow.approvalOffer(r,req.body,productionDays)},r);
  } catch(e){return res.status(400).json({error:e.message});}
  const adminNote = String((req.body || {}).adminNote || '').trim().slice(0, 600);
  const now = new Date().toISOString();

  let updated;
  try {
    updated = await db.requests.update(x => x.id === r.id, x => {
      if(x.acceptance)throw Error('ORDER_ALREADY_ACCEPTED');
      if(x.updatedAt!==r.updatedAt)throw Error('OFFER_CHANGED');
      return {...x, guestAccess:x.guestAccess||require('../guest-access').issue(),
        status:R.STATUS.APPROVED,price,finalOffer,productionDays,paymentMethod:'bank_transfer',
        acceptance:null,contractAcceptedAt:null,adminNote:adminNote||null,approvedAt:x.approvedAt||now,updatedAt:now,
        history:[...x.history,{at:now,event:'approved',price,by:'admin'}]};
    });
  }catch(e){return res.status(409).json({error:e.message});}

  await mailer.requestApproved(updated, updated.lang).catch(e => console.error('[mail]', e.message));
  console.log(`[admin] ✔ Jóváhagyva: ${updated.requestNumber} — ${price} ${cfg.currency.code}`);

  res.json({ request: R.toPublic(updated, { includeInternal: true }) });
});

// Human review remains a separate action; payment alone cannot start production.
router.post('/requests/:requestNumber/fulfilment-review',async(req,res)=>{
 const r=db.requests.find(x=>x.requestNumber===req.params.requestNumber);
 if(!r)return res.status(404).json({error:'NOT_FOUND'});
 if(r.contractAcceptedAt)return res.json({request:R.toPublic(r,{includeInternal:true})});
 if(!offers.accepted(r)||!r.paidAt)return res.status(409).json({error:'APPROVAL_REQUIRED'});
 if(req.body.sanctionsChecked!==true||req.body.dueDiligenceCompleted!==true||req.body.contractAccepted!==true||!String(req.body.reviewReference||'').trim())return res.status(400).json({error:'FULFILMENT_REVIEW_REQUIRED'});
 const now=new Date().toISOString();
 const updated=await db.requests.update(x=>x.id===r.id,x=>({...x,contractAcceptedAt:now,compliance:{cleared:true,reviewedAt:now,reviewedBy:req.user.id,reference:String(req.body.reviewReference).slice(0,250)},history:[...x.history,{at:now,event:'fulfilment_review_completed',by:req.user.id}]}));
 mailer.contractAccepted(updated,updated.lang).catch(e=>console.error('[mail]',e.message));
 res.json({request:R.toPublic(updated,{includeInternal:true})});
});


/* Bank receipt is confirmed by an administrator, never by the customer. */
router.post('/requests/:requestNumber/bank-received', async (req,res) => {
  const r=db.requests.find(x=>x.requestNumber===req.params.requestNumber);
  if(!r)return res.status(404).json({error:'NOT_FOUND'});
  if(r.paidAt)return res.json({request:R.toPublic(r,{includeInternal:true})});
  if(r.status!=='approved'||!r.price|| (offers.custom(r)&&!offers.accepted(r)))return res.status(409).json({error:'APPROVAL_REQUIRED'});
  const reference=String(req.body.reference||'').trim().slice(0,200);
  if(req.body.confirmed!==true||!reference)return res.status(400).json({error:'BANK_RECEIPT_REQUIRED'});
  const now=new Date().toISOString();
  let recorded=false;
  const updated=await db.requests.update(x=>x.id===r.id,x=>{
    if(x.paidAt)return x;
    recorded=true;
    return {...x,status:'paid',paidAt:now,updatedAt:now,paymentMethod:'bank_transfer',paymentStatus:'TransferReceived',history:[...x.history,{at:now,event:'bank_transfer_received',reference,by:req.user.id}]};
  });
  if(recorded){
    mailer.paymentReceived(updated,updated.lang).catch(e=>console.error('[mail]',e.message));
    require('../invoice').issueForRequest(updated).then(result=>{if(result.invoiceNumber)return db.requests.update(x=>x.id===updated.id,{invoiceNumber:result.invoiceNumber});}).catch(e=>console.error('[invoice]',e.message));
  }
  res.json({request:R.toPublic(updated,{includeInternal:true})});
});
router.post('/requests/:requestNumber/retry-email',async(req,res)=>{
 const r=db.requests.find(x=>x.requestNumber===req.params.requestNumber);
 const job=require('../db').mailJobs.find(j=>j.id===req.body.id&&j.requestId===r?.id);
 if(!r||!job)return res.status(404).json({error:'NOT_FOUND'});
 try{await require('../order-mail-queue').retry(job.id);res.json({request:R.toPublic(r,{includeInternal:true})});}
 catch(e){res.status(409).json({error:e.message});}
});

/* ---------- elutasítás ---------- */
router.post('/requests/:requestNumber/reject', async (req, res) => {
  const r = db.requests.find(x => x.requestNumber === req.params.requestNumber);
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  if (!(R.ADMIN_TRANSITIONS[r.status] || []).includes(R.STATUS.REJECTED)) {
    return res.status(409).json({ error: 'INVALID_TRANSITION', from: r.status });
  }
  const adminNote = String((req.body || {}).adminNote || '').trim().slice(0, 600);
  const now = new Date().toISOString();
  let updated;
  try {
    updated = await db.requests.update(x => x.id === r.id, x => {
      if (x.acceptance || !(R.ADMIN_TRANSITIONS[x.status] || []).includes(R.STATUS.REJECTED)) throw Error('INVALID_TRANSITION');
      return {...x, status: R.STATUS.REJECTED, adminNote: adminNote || null, updatedAt: now,
        history: [...x.history, { at: now, event: 'rejected', by: 'admin' }]};
    });
  } catch (e) { return res.status(409).json({error:e.message}); }
  mailer.requestRejected(updated, updated.lang).catch(e => console.error('[mail]', e.message));
  res.json({ request: R.toPublic(updated, { includeInternal: true }) });
});

/* ---------- státuszléptetés (gyártás / kész) ---------- */
router.post('/requests/:requestNumber/status', async (req, res) => {
  const r = db.requests.find(x => x.requestNumber === req.params.requestNumber);
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  const target = String((req.body || {}).status || '');
  if (!(R.ADMIN_TRANSITIONS[r.status] || []).includes(target)) {
    return res.status(409).json({ error: 'INVALID_TRANSITION', from: r.status, to: target });
  }
  if(offers.custom(r)&&!offers.readyForProduction(r))return res.status(409).json({error:'FULFILMENT_REVIEW_REQUIRED'});
  const now = new Date().toISOString();
  const updated = await db.requests.update(x => x.id === r.id, x => ({
    ...x, status: target, updatedAt: now,
    history: [...x.history, { at: now, event: 'status_change', to: target, by: 'admin' }]
  }));
  res.json({ request: R.toPublic(updated, { includeInternal: true }) });
});

/* ══════════════════════════════════════════════════════════════════
   EXPORT — „ki, mit, mikor rendelt"
   ──────────────────────────────────────────────────────────────
   GET /api/admin/export.csv?status=&q=      → Excel-barát CSV
   GET /api/admin/export.xls?status=&q=      → Excel munkafüzet
   Ugyanaz a szűrés, mint a listán: amit látsz, azt exportálod.
   ══════════════════════════════════════════════════════════════════ */

router.get('/export.csv', (req, res) => {
  const rows = filterRequests(req.query);
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="' + xport.filename('csv') + '"');
  res.send(xport.toCsv(rows));
});

router.get('/export.xls', (req, res) => {
  const rows = filterRequests(req.query);
  res.set('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="' + xport.filename('xls') + '"');
  res.send(xport.toXls(rows));
});

/* Immutable submission package; access is protected by requireAdmin above. */
router.get('/requests/:requestNumber/design.zip', (req, res) => {
  const r = db.requests.find(x => x.requestNumber === req.params.requestNumber);
  if (!r || !r.design) return res.status(404).json({ error: 'NOT_FOUND' });
  res.set('Cache-Control', 'private, no-store');
  res.download(designs.archivePath(r.id), `${r.requestNumber}-workshop.zip`, err => {
    if (err && !res.headersSent) res.status(err.code === 'ENOENT' ? 404 : 500).json({ error: err.code === 'ENOENT' ? 'NOT_FOUND' : 'SERVER_ERROR' });
  });
});

/* ---------- ügyféllista ---------- */
router.get('/users', (req, res) => {
  const all = db.requests.all();
  res.json({
    users: db.users.all().map(u => ({
      id: u.id, email: u.email, name: u.name, provider: u.provider, createdAt: u.createdAt,
      requestCount: all.filter(r => r.userId === u.id).length
    })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  });
});

module.exports = router;
