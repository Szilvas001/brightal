'use strict';
const express = require('express');
const auth = require('../auth');
const db = require('../db');

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

// Customer orders use private per-order links. Only administrators sign in.
router.post('/register',(req,res)=>res.status(404).json({error:'NOT_AVAILABLE'}));
router.post('/google',(req,res)=>res.status(404).json({error:'NOT_AVAILABLE'}));
router.post('/login',rateLimit(12),async(req,res)=>{
 const id=String(req.body?.email||req.body?.username||'').trim();
 if(!auth.checkAdmin(id,String(req.body?.password||'')))return res.status(401).json({error:'INVALID_CREDENTIALS'});
 await auth.createSession(res,auth.ADMIN_ID);res.json({user:auth.adminUser()});
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
