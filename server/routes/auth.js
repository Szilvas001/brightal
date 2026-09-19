'use strict';
const express = require('express');
const crypto = require('crypto');
const auth = require('../auth');
const db = require('../db');
const cfg = require('../config');

const router = express.Router();

/* ---------- sebességkorlátozás ---------- */
const hits = new Map();
function rateLimit(max = 10, windowMs = 60_000) {
  return (req, res, next) => {
    const key = (req.ip || 'x') + ':' + req.path;
    const now = Date.now();
    const rec = hits.get(key) || { n: 0, reset: now + windowMs };
    if (now > rec.reset) { rec.n = 0; rec.reset = now + windowMs; }
    rec.n++;
    hits.set(key, rec);
    if (rec.n > max) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
    next();
  };
}
setInterval(() => { const n = Date.now(); for (const [k, v] of hits) if (n > v.reset) hits.delete(k); }, 300_000).unref();

/* ---------- regisztráció ---------- */
router.post('/register', rateLimit(8), async (req, res) => {
  const { email, password, name, phone } = req.body || {};
  const mail = String(email || '').trim().toLowerCase();
  if (!auth.emailOk(mail)) return res.status(400).json({ error: 'INVALID_EMAIL' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });
  if (db.users.find(u => u.email === mail)) return res.status(409).json({ error: 'EMAIL_TAKEN' });

  const user = {
    id: crypto.randomUUID(),
    email: mail,
    name: String(name || mail.split('@')[0]).slice(0, 80),
    phone: String(phone || '').slice(0, 40),
    password: auth.hashPassword(password),
    provider: 'password',
    createdAt: new Date().toISOString()
  };
  await db.users.insert(user);
  await auth.createSession(res, user.id);
  res.json({ user: auth.publicUser(user) });
});

/* ══════════════════════════════════════════════════════════════════
   BEJELENTKEZÉS
   Ugyanaz az űrlap kezeli az ügyfeleket és az admint.
   Ha a megadott azonosító megegyezik az ADMIN_USERNAME értékkel,
   admin munkamenet jön létre.
   ══════════════════════════════════════════════════════════════════ */
router.post('/login', rateLimit(12), async (req, res) => {
  const id = String((req.body || {}).email || (req.body || {}).username || '').trim();
  const pw = String((req.body || {}).password || '');

  /* admin belépés */
  if (auth.checkAdmin(id, pw)) {
    await auth.createSession(res, auth.ADMIN_ID);
    return res.json({ user: auth.adminUser() });
  }
  /* ha az azonosító az admin felhasználónév, de a jelszó rossz: ne essen át
     a normál ágra, különben az e-mail formátumú hibaüzenet elárulná a fiók létét */
  if (auth.safeEqual(id, cfg.admin.username)) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  /* normál felhasználó */
  const user = db.users.find(u => u.email === id.toLowerCase());
  if (!user || !user.password || !auth.verifyPassword(pw, user.password)) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }
  await auth.createSession(res, user.id);
  res.json({ user: auth.publicUser(user) });
});

/* ---------- Google belépés ---------- */
router.post('/google', rateLimit(20), async (req, res) => {
  try {
    if (!cfg.google.clientId) return res.status(503).json({ error: 'GOOGLE_NOT_CONFIGURED' });
    const p = await auth.verifyGoogleToken(String((req.body || {}).credential || ''));
    let user = db.users.find(u => u.email === p.email);
    if (!user) {
      user = {
        id: crypto.randomUUID(), email: p.email, name: p.name, picture: p.picture,
        googleId: p.sub, password: null, provider: 'google', createdAt: new Date().toISOString()
      };
      await db.users.insert(user);
    } else if (!user.googleId) {
      await db.users.update(u => u.id === user.id, { googleId: p.sub, picture: p.picture });
      user = db.users.find(u => u.id === user.id);
    }
    await auth.createSession(res, user.id);
    res.json({ user: auth.publicUser(user) });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

router.post('/logout', async (req, res) => {
  await auth.destroySession(req, res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => res.json({ user: req.user }));

router.put('/me', auth.requireUser, async (req, res) => {
  if (req.user.role === 'admin') return res.status(400).json({ error: 'ADMIN_PROFILE_READONLY' });
  const b = req.body || {};
  const patch = {
    name: String(b.name || '').slice(0, 100) || req.user.name,
    phone: String(b.phone || '').slice(0, 40),
    address: {
      country: String((b.address && b.address.country) || '').slice(0, 60),
      zip: String((b.address && b.address.zip) || '').slice(0, 12),
      city: String((b.address && b.address.city) || '').slice(0, 80),
      street: String((b.address && b.address.street) || '').slice(0, 160)
    }
  };
  await db.users.update(u => u.id === req.user.id, patch);
  res.json({ user: auth.publicUser(db.users.find(u => u.id === req.user.id)) });
});

module.exports = router;
