'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const cfg = require('../config');
const db = require('../db');
const auth = require('../auth');
const R = require('../requests');
const mailer = require('../mailer');

const router = express.Router();

/* ══════════════════════════════════════════════════════════════════
   KÉPFELTÖLTÉS
   Csak JPEG / PNG / WebP, méretkorláttal. A fájlnevet mi generáljuk,
   így a felhasználó nem tud útvonalat vagy kiterjesztést befolyásolni.
   ══════════════════════════════════════════════════════════════════ */
fs.mkdirSync(cfg.upload.dir, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, cfg.upload.dir),
  filename: (req, file, cb) => {
    const safe = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now().toString(36)}-${safe}${EXT[file.mimetype] || '.jpg'}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: cfg.upload.maxBytes, files: cfg.upload.maxFiles },
  fileFilter: (req, file, cb) => {
    if (!cfg.upload.allowed.includes(file.mimetype)) return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    cb(null, true);
  }
});

/** A multer hibáit egységes JSON-válasszá alakítja. */
function handleUpload(req, res, next) {
  upload.array('photos', cfg.upload.maxFiles)(req, res, err => {
    if (!err) return next();
    const code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE'
      : err.code === 'LIMIT_FILE_COUNT' ? 'TOO_MANY_FILES'
        : err.message === 'UNSUPPORTED_FILE_TYPE' ? 'UNSUPPORTED_FILE_TYPE'
          : 'UPLOAD_FAILED';
    res.status(400).json({ error: code });
  });
}

/** Feltöltött fájlok törlése, ha a kérés érvénytelen. */
function cleanup(files) {
  for (const f of files || []) {
    try { fs.unlinkSync(f.path); } catch (e) { /* nem kritikus */ }
  }
}

/* ══════════════════════════════════════════════════════════════════
   1) ÚJ KÉRÉS BEKÜLDÉSE
   Bejelentkezés szükséges — a kérés a fiókhoz kötődik, hogy később
   ott jelenjen meg az árajánlat és a fizetés.
   ══════════════════════════════════════════════════════════════════ */
router.post('/requests', auth.requireUser, handleUpload, async (req, res) => {
  if (req.user.role === 'admin') { cleanup(req.files); return res.status(400).json({ error: 'ADMIN_CANNOT_ORDER' }); }
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'NO_PHOTO' });

  const body = req.body || {};
  const email = String(body.email || req.user.email).trim().toLowerCase();
  if (!auth.emailOk(email)) { cleanup(req.files); return res.status(400).json({ error: 'INVALID_EMAIL' }); }
  if (String(body.name || req.user.name).trim().length < 2) { cleanup(req.files); return res.status(400).json({ error: 'NAME_REQUIRED' }); }
  if (!body.acceptTerms || body.acceptTerms === 'false') { cleanup(req.files); return res.status(400).json({ error: 'TERMS_REQUIRED' }); }

  const request = R.build({
    user: req.user,
    body: { ...body, email },
    files: req.files,
    lang: body.lang || cfg.defaultLang
  });

  await db.requests.insert(request);

  /* e-mail: az ügyfélnek visszaigazolás, az adminnak értesítés */
  mailer.requestReceived(request, request.lang).catch(e => console.error('[mail]', e.message));
  mailer.adminNewRequest(request).catch(e => console.error('[mail]', e.message));

  console.log(`[request] ⬆ Új kérés: ${request.requestNumber} — ${request.customer.email} (${request.images.length} kép)`);
  res.json({ request: R.toPublic(request) });
});

/* ---------- 2) SAJÁT KÉRÉSEK ---------- */
router.get('/requests', auth.requireUser, (req, res) => {
  if (req.user.role === 'admin') return res.json({ requests: [] });
  const list = db.requests
    .filter(r => r.userId === req.user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(r => R.toPublic(r));
  res.json({ requests: list });
});

/* ---------- 3) EGY KÉRÉS ---------- */
router.get('/requests/:requestNumber', auth.requireUser, (req, res) => {
  const r = db.requests.find(x => x.requestNumber === req.params.requestNumber);
  if (!r) return res.status(404).json({ error: 'NOT_FOUND' });
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && r.userId !== req.user.id) return res.status(403).json({ error: 'FORBIDDEN' });
  res.json({ request: R.toPublic(r, { includeInternal: isAdmin }) });
});

module.exports = router;
