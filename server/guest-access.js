'use strict';
const crypto = require('node:crypto');
const cfg = require('./config');
const auth = require('./auth');
function issue() { return { nonce: crypto.randomBytes(32).toString('hex') }; }
function token(r) {
  if (!r.guestAccess?.nonce) return null;
  return crypto.createHmac('sha256', cfg.sessionSecret).update('guest-order:'+r.id+':'+r.guestAccess.nonce).digest('base64url');
}
function allowed(req, r) {
  const supplied = String(req.headers.authorization || '').replace(/^Bearer /, '');
  return !!r && !!token(r) && supplied.length === 43 && auth.safeEqual(supplied, token(r));
}
function url(r) { return token(r) ? `${cfg.publicUrl}/order/${encodeURIComponent(r.requestNumber)}#${token(r)}` : `${cfg.publicUrl}/orders`; }
module.exports = { issue, token, allowed, url };
