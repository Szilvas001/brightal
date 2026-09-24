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
  if (r.sourcing || r.diamond) return res.status(409).json({error:'DIAMOND_CONFIRMATION_REQUIRED'});

  const price = R.roundPrice((req.body || {}).price);
  if (price === null) return res.status(400).json({ error: 'INVALID_PRICE' });

  const allowed = R.ADMIN_TRANSITIONS[r.status] || [];
  if (!allowed.includes(R.STATUS.APPROVED)) {
    return res.status(409).json({ error: 'INVALID_TRANSITION', from: r.status });
  }

  const adminNote = String((req.body || {}).adminNote || '').trim().slice(0, 600);
  const now = new Date().toISOString();

  const updated = await db.requests.update(x => x.id === r.id, x => ({
    ...x,
    status: R.STATUS.APPROVED,
    price,
    adminNote: adminNote || null,
    approvedAt: x.approvedAt || now,
    updatedAt: now,
    history: [...x.history, { at: now, event: 'approved', price, by: 'admin' }]
  }));

  mailer.requestApproved(updated, updated.lang).catch(e => console.error('[mail]', e.message));
  console.log(`[admin] ✔ Jóváhagyva: ${updated.requestNumber} — ${price} ${cfg.currency.code}`);

  res.json({ request: R.toPublic(updated, { includeInternal: true }) });
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
  const updated = await db.requests.update(x => x.id === r.id, x => ({
    ...x, status: R.STATUS.REJECTED, adminNote: adminNote || null, updatedAt: now,
    history: [...x.history, { at: now, event: 'rejected', by: 'admin' }]
  }));
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
