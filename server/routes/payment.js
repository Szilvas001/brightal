'use strict';
const express = require('express');
const barion = require('../barion');
const db = require('../db');
const cfg = require('../config');
const auth = require('../auth');
const R = require('../requests');
const mailer = require('../mailer');
const invoice = require('../invoice');

const router = express.Router();

const findByNumber = n => db.requests.find(r => r.requestNumber === n);

/** Barion státusz → belső státusz. */
function mapStatus(barionStatus, current) {
  if (barion.SUCCESS_STATES.includes(barionStatus)) return R.STATUS.PAID;
  if ([barion.STATUS.CANCELED, barion.STATUS.FAILED, barion.STATUS.EXPIRED].includes(barionStatus)) {
    /* sikertelen fizetés után a kérés fizethető marad — újra lehet próbálni */
    return current === R.STATUS.PAID ? R.STATUS.PAID : R.STATUS.APPROVED;
  }
  return current;
}

/* ══════════════════════════════════════════════════════════════════
   FIZETÉS INDÍTÁSA
   Csak jóváhagyott (approved) és árazott kérésre, csak a tulajdonosnak.
   Az összeg a szerveren tárolt árból jön — a kliens nem küldhet árat.
   ══════════════════════════════════════════════════════════════════ */
router.post('/payment/start', auth.requireUser, async (req, res) => {
  const request = findByNumber(String((req.body || {}).requestNumber || ''));
  if (!request) return res.status(404).json({ error: 'NOT_FOUND' });
  if (request.userId !== req.user.id) return res.status(403).json({ error: 'FORBIDDEN' });
  if (request.status === R.STATUS.PAID) return res.status(409).json({ error: 'ALREADY_PAID' });
  if (!R.PAYABLE.includes(request.status)) return res.status(409).json({ error: 'NOT_PAYABLE' });
  if (!request.price || request.price <= 0) return res.status(409).json({ error: 'NO_PRICE' });

  if(request.combinationOffer){
    const offer=request.combinationOffer;
    if(offer.price!==request.price||request.currency!=='HUF'||!request.sourcing||!Object.keys(offer.combination).every(k=>offer.combination[k]===request.sourcing[k]))return res.status(409).json({error:'PRICE_CHANGED'});
  }else if(request.diamond){
    try{const D=require('../diamonds');require('../diamond-pricing').checkout(D.catalogue().find(x=>x.id===request.diamond.id),request.price);}
    catch(e){return res.status(409).json({error:e.message});}
  }

  try {
    const paymentRequestId = `${request.requestNumber}-${Date.now().toString(36)}`;
    const started = await barion.startPayment({ ...request, paymentRequestId });

    await db.requests.update(r => r.id === request.id, r => ({
      ...r,
      paymentId: started.paymentId,
      paymentRequestId,
      gatewayUrl: started.gatewayUrl,
      paymentStatus: started.status,
      updatedAt: new Date().toISOString(),
      history: [...r.history, { at: new Date().toISOString(), event: 'payment_started', paymentId: started.paymentId, simulated: started.simulated }]
    }));

    res.json({ gatewayUrl: started.gatewayUrl, paymentId: started.paymentId, simulated: started.simulated });
  } catch (e) {
    console.error('[payment/start]', e.message);
    res.status(502).json({ error: 'PAYMENT_START_FAILED', detail: e.message });
  }
});

/* ---------- Barion IPN callback ---------- */
async function handleCallback(req, res) {
  const paymentId = (req.query && (req.query.paymentId || req.query.PaymentId))
    || (req.body && (req.body.paymentId || req.body.PaymentId));
  if (!paymentId) return res.status(400).send('missing paymentId');
  try { await syncPayment(String(paymentId)); }
  catch (e) { console.error('[payment/callback]', e.message); }
  res.status(200).send('OK');   // a Barion mindig 200-at vár
}
router.post('/payment/callback', handleCallback);
router.get('/payment/callback', handleCallback);

/**
 * A fizetés valódi állapotának lekérdezése a Barion API-tól,
 * és a kérés státuszának frissítése. A böngészőből érkező
 * paraméterekben SOHA nem bízunk.
 */
async function syncPayment(paymentId) {
  const request = db.requests.find(r => r.paymentId === paymentId);
  if (!request) return null;

  const state = await barion.getPaymentState(paymentId);
  const next = mapStatus(state.Status, request.status);
  const wasPaid = request.status === R.STATUS.PAID;

  const updated = await db.requests.update(r => r.id === request.id, r => ({
    ...r,
    paymentStatus: state.Status,
    status: next,
    paidAt: next === R.STATUS.PAID ? (r.paidAt || new Date().toISOString()) : r.paidAt,
    updatedAt: new Date().toISOString(),
    history: [...r.history, { at: new Date().toISOString(), event: 'payment_state', barionStatus: state.Status }]
  }));

  if (!wasPaid && next === R.STATUS.PAID) {
    console.log(`[payment] ✔ Kifizetve: ${updated.requestNumber} (${updated.price} ${updated.currency})`);
    mailer.paymentReceived(updated, updated.lang).catch(e => console.error('[mail]', e.message));

    /* ---------- számla kiállítása ----------
       Külön, nem blokkoló ágon fut: ha a számlázó szolgáltató nem
       elérhető, a fizetés akkor is rendben lezárul. A hiba a
       data/invoice-outbox.log fájlba kerül, és kézzel pótolható. */
    invoice.issueForRequest(updated)
      .then(r => {
        if (r.invoiceNumber) {
          db.requests.update(x => x.id === updated.id, x => ({
            ...x,
            invoiceNumber: r.invoiceNumber,
            history: [...x.history, { at: new Date().toISOString(), event: 'invoice_issued', invoiceNumber: r.invoiceNumber }]
          })).catch(() => {});
        }
      })
      .catch(e => console.error('[invoice]', e.message));
  }
  return updated;
}

/* ---------- állapotlekérdezés a visszatérési oldalról ---------- */
router.get('/payment/status/:requestNumber', auth.requireUser, async (req, res) => {
  const request = findByNumber(req.params.requestNumber);
  if (!request) return res.status(404).json({ error: 'NOT_FOUND' });
  if (request.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });

  try { if (request.paymentId) await syncPayment(request.paymentId); }
  catch (e) { console.error('[payment/status]', e.message); }

  res.json({ request: R.toPublic(findByNumber(req.params.requestNumber)) });
});

/* ---------- szimulált átjáró vezérlése ---------- */
router.post('/payment/simulate', async (req, res) => {
  if (!barion.isSimulated()) return res.status(404).json({ error: 'NOT_AVAILABLE' });
  const { paymentId, outcome } = req.body || {};
  const p = barion.simulateResult(String(paymentId || ''), String(outcome || 'success'));
  if (!p) return res.status(404).json({ error: 'UNKNOWN_PAYMENT' });
  try { await syncPayment(String(paymentId)); } catch (e) { /* no-op */ }
  const request = db.requests.find(r => r.paymentId === paymentId);
  res.json({ ok: true, status: p.Status, requestNumber: request ? request.requestNumber : null });
});

module.exports = router;
module.exports.syncPayment = syncPayment;
