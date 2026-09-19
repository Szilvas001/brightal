'use strict';
/**
 * Felhasználókezelés: jelszó-hash, munkamenet, Google belépés, admin fiók.
 */

const crypto = require('crypto');
const cfg = require('./config');
const db = require('./db');

const MAX_AGE_MS = cfg.sessionMaxAgeDays * 24 * 60 * 60 * 1000;
const ADMIN_ID = 'admin-builtin';

/* ---------- jelszó ---------- */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('scrypt$')) return false;
  const [, salt, hash] = stored.split('$');
  const test = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  const a = Buffer.from(hash, 'hex'), b = Buffer.from(test, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Időzítéstámadás-biztos szöveg-összehasonlítás (admin belépéshez). */
function safeEqual(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(ba, ba);   // állandó idő fenntartása
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

/* ---------- munkamenet ---------- */
function sign(v) {
  return `${v}.${crypto.createHmac('sha256', cfg.sessionSecret).update(v).digest('base64url')}`;
}

function unsign(signed) {
  if (!signed || typeof signed !== 'string') return null;
  const i = signed.lastIndexOf('.');
  if (i === -1) return null;
  const value = signed.slice(0, i);
  const mac = Buffer.from(signed.slice(i + 1));
  const exp = Buffer.from(crypto.createHmac('sha256', cfg.sessionSecret).update(value).digest('base64url'));
  if (mac.length !== exp.length || !crypto.timingSafeEqual(mac, exp)) return null;
  return value;
}

async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await db.sessions.insert({
    token, userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + MAX_AGE_MS).toISOString()
  });
  res.cookie(cfg.sessionCookie, sign(token), {
    httpOnly: true, sameSite: 'lax', secure: cfg.isProd, maxAge: MAX_AGE_MS, path: '/'
  });
}

async function destroySession(req, res) {
  const token = unsign(readCookie(req, cfg.sessionCookie));
  if (token) await db.sessions.remove(s => s.token === token);
  res.clearCookie(cfg.sessionCookie, { path: '/' });
}

function readCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i !== -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

/* ---------- admin ---------- */
const adminUser = () => ({
  id: ADMIN_ID,
  email: cfg.admin.email,
  name: cfg.admin.name,
  provider: 'admin',
  role: 'admin',
  picture: null,
  createdAt: null
});

/**
 * Az admin belépési adatok ellenőrzése (nem tárolódik az adatbázisban).
 *
 * Két mód:
 *   1. ADMIN_PASSWORD_HASH be van állítva → scrypt hash ellenőrzés (AJÁNLOTT).
 *      Ilyenkor a nyílt szöveges ADMIN_PASSWORD figyelmen kívül marad.
 *   2. Csak ADMIN_PASSWORD van → nyílt szöveges összehasonlítás (fejlesztéshez).
 *
 * Hash előállítása:  npm run hash-password
 */
function checkAdmin(username, password) {
  const u = safeEqual(username || '', cfg.admin.username);
  const p = cfg.admin.passwordHash
    ? verifyPassword(String(password || ''), cfg.admin.passwordHash)
    : safeEqual(password || '', cfg.admin.password);
  return u && p;   // mindkettőt kiértékeljük, hogy az idő ne áruljon el semmit
}

/** Igaz, ha az admin jelszó nyílt szövegként van tárolva (élesben figyelmeztetünk). */
const adminPasswordIsPlaintext = () => !cfg.admin.passwordHash;

/* ---------- middleware ---------- */
function attachUser(req, res, next) {
  req.user = null;
  const token = unsign(readCookie(req, cfg.sessionCookie));
  if (!token) return next();
  const s = db.sessions.find(x => x.token === token);
  if (!s || new Date(s.expiresAt) < new Date()) return next();
  if (s.userId === ADMIN_ID) { req.user = adminUser(); return next(); }
  const u = db.users.find(x => x.id === s.userId);
  if (u) req.user = publicUser(u);
  next();
}

const requireUser = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: 'AUTH_REQUIRED' });

const requireAdmin = (req, res, next) =>
  req.user && req.user.role === 'admin' ? next() : res.status(403).json({ error: 'ADMIN_REQUIRED' });

function publicUser(u) {
  return {
    id: u.id, email: u.email, name: u.name,
    provider: u.provider || 'password',
    role: 'user',
    picture: u.picture || null,
    phone: u.phone || null,
    createdAt: u.createdAt,
    address: u.address || null
  };
}

/* ---------- Google ---------- */
async function verifyGoogleToken(idToken) {
  if (!cfg.google.clientId) throw new Error('GOOGLE_NOT_CONFIGURED');
  const res = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken));
  if (!res.ok) throw new Error('GOOGLE_INVALID_TOKEN');
  const p = await res.json();
  if (p.aud !== cfg.google.clientId) throw new Error('GOOGLE_WRONG_AUDIENCE');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(p.iss)) throw new Error('GOOGLE_BAD_ISSUER');
  if (Number(p.exp) * 1000 < Date.now()) throw new Error('GOOGLE_TOKEN_EXPIRED');
  if (p.email_verified !== 'true' && p.email_verified !== true) throw new Error('GOOGLE_EMAIL_UNVERIFIED');
  return { email: String(p.email).toLowerCase(), name: p.name || p.email, picture: p.picture || null, sub: p.sub };
}

const emailOk = e => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length < 190;

module.exports = {
  ADMIN_ID, hashPassword, verifyPassword, safeEqual,
  createSession, destroySession, attachUser,
  requireUser, requireAdmin, publicUser,
  checkAdmin, adminUser, adminPasswordIsPlaintext,
  verifyGoogleToken, readCookie, emailOk
};
