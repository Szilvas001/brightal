'use strict';
/**
 * ══════════════════════════════════════════════════════════════════
 *  BRIGHTAL — szerver
 * ══════════════════════════════════════════════════════════════════
 *  Indítás:    npm start        → http://localhost:3000
 *  Fejlesztés: npm run dev
 * ══════════════════════════════════════════════════════════════════
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const cfg = require('./config');
const authLib = require('./auth');
const barion = require('./barion');
const mailer = require('./mailer');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ---------- biztonsági fejlécek ---------- */
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(self)');
  if (cfg.isProd) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://accounts.google.com https://assets.pinterest.com https://pixel.barion.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://i.pinimg.com https://*.pinimg.com https://pixel.barion.com",
    "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://pixel.barion.com",
    /* A Barion Pixel saját iframe-et nyit a pixel.barion.com címen —
       enélkül a CSP blokkolja, és a mérés nem működik. */
    "frame-src 'self' https://accounts.google.com https://assets.pinterest.com https://www.pinterest.com https://pixel.barion.com",
    "form-action 'self' https://secure.barion.com https://secure.test.barion.com",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; '));
  next();
});

app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(authLib.attachUser);

/* ══════════════════════════════════════════════════════════════════
   API
   ══════════════════════════════════════════════════════════════════ */

/** Publikus konfiguráció a frontendnek — titkos adat nélkül. */
app.get('/api/config', (req, res) => {
  res.json({
    shop: {
      name: cfg.shop.name,
      email: cfg.shop.email,
      phone: cfg.shop.phone,
      address: cfg.shop.address,
      reviewHours: cfg.shop.reviewHours,
      productionDays: [cfg.shop.productionDaysMin, cfg.shop.productionDaysMax]
    },
    currency: cfg.currency,
    defaultLang: cfg.defaultLang,
    upload: {
      maxMb: Math.round(cfg.upload.maxBytes / 1024 / 1024),
      maxFiles: cfg.upload.maxFiles,
      allowed: cfg.upload.allowed
    },
    /* Cégadatok — az impresszumhoz és a jogi oldalakhoz.
       Jogszabály írja elő a közzétételüket, tehát nem titkosak. */
    company: cfg.company,
    cookies: { pixelRequiresConsent: cfg.cookies.pixelRequiresConsent },
    barion: {
      environment: cfg.barion.envKey,
      label: cfg.barion.label,
      simulated: cfg.barion.simulate,
      pixelId: cfg.barion.pixelId || null
    },
    google: { enabled: !!cfg.google.clientId, clientId: cfg.google.clientId || null },
    mail: { simulated: mailer.isSimulated() },
    pinterest: { boardHu: cfg.pinterest.boardHu || null, boardEn: cfg.pinterest.boardEn || null }
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/requests'));
app.use('/api', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    uptime: Math.round(process.uptime()),
    barion: { env: cfg.barion.envKey, simulated: cfg.barion.simulate },
    mail: { simulated: mailer.isSimulated() },
    currency: cfg.currency.code
  });
});

/* ══════════════════════════════════════════════════════════════════
   SZIMULÁLT BARION ÁTJÁRÓ (csak BARION_POS_KEY nélkül)
   ══════════════════════════════════════════════════════════════════ */
app.get('/sandbox-gateway', (req, res) => {
  if (!barion.isSimulated()) return res.redirect('/');
  const p = barion.simulatedPayment(String(req.query.paymentId || ''));
  if (!p) return res.status(404).send('Ismeretlen fizetés.');
  const fmt = new Intl.NumberFormat('hu-HU').format(p.Total);
  res.type('html').send(`<!DOCTYPE html><html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Szimulált fizetési átjáró</title>
<style>*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#14130F;color:#F0EDE6;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.c{max-width:440px;width:100%;background:#1E1C17;border:1px solid #33302A;border-radius:16px;padding:32px}
.t{font-size:11px;letter-spacing:2.6px;text-transform:uppercase;color:#D9B382;margin-bottom:12px}
h1{font-size:22px;font-weight:600;margin-bottom:8px}p{color:#A29C90;font-size:14px;line-height:1.65}
.amt{font-size:34px;font-weight:600;margin:22px 0 4px}
.box{background:#16150F;border:1px solid #33302A;border-radius:10px;padding:14px;margin:20px 0;font-size:12px;color:#A29C90;word-break:break-all}
button{width:100%;padding:14px;border:0;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-top:10px;font-family:inherit}
.ok{background:#D9B382;color:#1A1813}.cx{background:#33302A;color:#F0EDE6}.fa{background:#3A2220;color:#F0B4A8}
.n{margin-top:22px;font-size:12px;color:#6E6A61;line-height:1.6}</style></head><body><div class="c">
<div class="t">Szimulált átjáró · nincs valódi tranzakció</div>
<h1>Fizetés jóváhagyása</h1>
<p>Ez a képernyő a Barion fizetőoldalát helyettesíti, amíg nincs beállítva valódi <code>BARION_POS_KEY</code>.</p>
<div class="amt">${fmt} ${p.Currency}</div>
<div class="box">PaymentId: ${p.PaymentId}<br>Rendelés: ${p.OrderNumber}</div>
<button class="ok" data-o="success">Sikeres fizetés</button>
<button class="fa" data-o="fail">Sikertelen fizetés</button>
<button class="cx" data-o="cancel">Fizetés megszakítása</button>
<p class="n">Valódi Sandbox teszteléshez add meg a POSKey-t a <code>.env</code> fájlban.</p></div>
<script>document.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){
document.querySelectorAll('button').forEach(function(x){x.disabled=true});b.textContent='Feldolgozás…';
fetch('/api/payment/simulate',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({paymentId:${JSON.stringify(p.PaymentId)},outcome:b.dataset.o})}).then(function(r){return r.json()})
.then(function(d){location.href='/payment-return?request='+encodeURIComponent(d.requestNumber||'');});});});</script>
</body></html>`);
});

/* ══════════════════════════════════════════════════════════════════
   STATIKUS FÁJLOK
   ══════════════════════════════════════════════════════════════════ */
const PUBLIC = path.join(__dirname, '..', 'public');

/* A feltöltött képeket csak bejelentkezve, és csak a tulajdonos vagy
   az admin érheti el — a fájlnév kitalálása önmagában nem elég. */
app.get('/uploads/:file', (req, res) => {
  if (!req.user) return res.status(401).send('Bejelentkezés szükséges.');
  const file = path.basename(String(req.params.file));
  const db_ = require('./db');
  const owner = db_.requests.find(r => r.images.some(i => i.filename === file));
  if (!owner) return res.status(404).send('Nem található.');
  if (req.user.role !== 'admin' && owner.userId !== req.user.id) return res.status(403).send('Nincs jogosultság.');
  res.sendFile(path.join(cfg.upload.dir, file), { maxAge: '1h' });
});

app.use(express.static(PUBLIC, { maxAge: cfg.isProd ? '1h' : 0, index: false }));

/* ══════════════════════════════════════════════════════════════════
   KERESŐOPTIMALIZÁLÁS
   A robots.txt és a sitemap.xml a PUBLIC_URL alapján készül, így
   élesítéskor magától a valódi domainre mutat.
   ══════════════════════════════════════════════════════════════════ */

/* nyilvános, indexelhető útvonalak — a védett oldalak (fiók, admin,
   rendeléseim) szándékosan nincsenek benne */
const SITEMAP_PATHS = [
  { hu: '/ring-builder', en: '/ring-builder', priority: '0.9', freq: 'monthly' },
  { hu: '/', en: '/', priority: '1.0', freq: 'weekly' },
  { hu: '/hogyan', en: '/how', priority: '0.8', freq: 'monthly' },
  { hu: '/feltoltes', en: '/upload', priority: '0.9', freq: 'monthly' },
  { hu: '/inspiracio', en: '/inspiration', priority: '0.6', freq: 'monthly' },
  { hu: '/rolunk', en: '/about', priority: '0.5', freq: 'yearly' },
  { hu: '/kapcsolat', en: '/contact', priority: '0.5', freq: 'yearly' },
  { hu: '/aszf', en: '/terms', priority: '0.3', freq: 'yearly' },
  { hu: '/adatkezeles', en: '/privacy', priority: '0.3', freq: 'yearly' },
  { hu: '/impresszum', en: '/impressum', priority: '0.3', freq: 'yearly' },
  { hu: '/elallas', en: '/refund', priority: '0.3', freq: 'yearly' },
  { hu: '/cookie', en: '/cookies', priority: '0.2', freq: 'yearly' }
];

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /uploads/',
    'Disallow: /fiok',
    'Disallow: /account',
    'Disallow: /rendeleseim',
    'Disallow: /orders',
    'Disallow: /payment-return',
    'Disallow: /sandbox-gateway',
    '',
    `Sitemap: ${cfg.publicUrl}/sitemap.xml`,
    ''
  ].join('\n'));
});

app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const url = (loc, alt, p) => `  <url>
    <loc>${cfg.publicUrl}${loc}</loc>
    <xhtml:link rel="alternate" hreflang="hu" href="${cfg.publicUrl}${p.hu}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${cfg.publicUrl}${p.en}"/>
    <lastmod>${today}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;

  const urls = [];
  for (const p of SITEMAP_PATHS) {
    urls.push(url(p.hu, p.en, p));
    if (p.en !== p.hu) urls.push(url(p.en, p.hu, p));
  }

  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
});

/* ══════════════════════════════════════════════════════════════════
   SPA VISSZAESÉS — SEO-behelyettesítéssel
   Az index.html-ben lévő {{PUBLIC_URL}} és {{SHOP_NAME}} jelölőket
   a szerver tölti ki, hogy az og: és canonical címek abszolútak
   legyenek. Élesben egyszer olvassuk be és gyorsítótárazzuk.
   ══════════════════════════════════════════════════════════════════ */
let indexCache = null;
function renderIndex() {
  if (indexCache && cfg.isProd) return indexCache;
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8')
    .split('{{PUBLIC_URL}}').join(cfg.publicUrl)
    .split('{{SHOP_NAME}}').join(cfg.shop.name);
  indexCache = html;
  return html;
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  /* Ismeretlen útvonalon is az SPA-t szolgáljuk ki (ott jelenik meg a
     404 oldal), de a keresőknek helyes státuszkódot küldünk. */
  const known = /^\/($|ring-builder|hogyan|how|feltoltes|upload|inspiracio|inspiration|rendeleseim|orders|fiok|account|rolunk|about|kapcsolat|contact|admin|payment-return|aszf|terms|adatkezeles|privacy|impresszum|impressum|elallas|refund|cookie|cookies)\/?$/;
  if (!known.test(req.path)) res.status(404);
  res.type('html').send(renderIndex());
});

app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND' }));
app.use((err, req, res, next) => {
  console.error('[hiba]', err);
  res.status(500).json({ error: 'SERVER_ERROR' });
});

/* ══════════════════════════════════════════════════════════════════
   INDÍTÁS
   ══════════════════════════════════════════════════════════════════ */
if (!fs.existsSync(path.join(PUBLIC, 'app.js'))) {
  console.warn('\n⚠  A public/app.js hiányzik. Futtasd:  npm install && npm run build\n');
}

app.listen(cfg.port, () => {
  const line = '─'.repeat(64);
  console.log(`\n${line}`);
  console.log(`  ${cfg.shop.name} — elindult`);
  console.log(line);
  console.log(`  URL          : ${cfg.publicUrl}`);
  console.log(`  Nyelv        : ${cfg.defaultLang.toUpperCase()} (HU / EN váltható)`);
  console.log(`  Pénznem      : ${cfg.currency.code}`);
  console.log(`  Barion       : ${cfg.barion.label} → ${cfg.barion.apiBase}`);
  console.log(`  Fizetés mód  : ${cfg.barion.simulate ? '⚠  SZIMULÁCIÓ (nincs BARION_POS_KEY)' : '✔  valódi Barion API'}`);
  console.log(`  E-mail       : ${mailer.isSimulated() ? '⚠  szimulált (data/mail-outbox.log)' : '✔  SMTP aktív'}`);
  console.log(`  Google login : ${cfg.google.clientId ? '✔ bekapcsolva' : '– nincs beállítva'}`);
  console.log(line);
  console.log(`  Számlázás    : ${require('./invoice').isEnabled() ? `✔  ${cfg.invoice.provider}` : '⚠  szimulált (data/invoice-outbox.log)'}`);
  console.log(line);
  console.log(`  ADMIN belépés: ${cfg.publicUrl}/admin`);
  console.log(`     felhasználó: ${cfg.admin.username}`);
  console.log(`     jelszó tár.: ${cfg.admin.passwordHash ? '✔  scrypt hash' : '⚠  NYÍLT SZÖVEG a .env-ben'}`);
  if (!cfg.admin.passwordHash && cfg.admin.password === '12345') {
    console.log(`     jelszó     : ${cfg.admin.password}`);
    console.log(`  ⚠  FIGYELEM: alapértelmezett, gyenge admin jelszó!`);
  }
  if (!cfg.admin.passwordHash) {
    console.log(`     Erősítsd meg:  npm run hash-password`);
  }

  /* ---------- élesítési ellenőrzés ---------- */
  const problems = [];
  if (cfg.isProd) {
    if (!cfg.admin.passwordHash && cfg.admin.password === '12345') problems.push('Az admin jelszó az alapértelmezett „12345".');
    if (!cfg.publicUrl.startsWith('https://')) problems.push('A PUBLIC_URL nem HTTPS — a Barion callback és a belépés nem fog működni.');
    if (!process.env.SESSION_SECRET) problems.push('Nincs SESSION_SECRET a .env-ben (npm run gen-secret).');
    if (!cfg.company.name) problems.push('Nincs COMPANY_NAME — az impresszum hiányos, a Barion elutasíthatja a boltot.');
    if (!cfg.company.taxNumber) problems.push('Nincs COMPANY_TAX_NUMBER — az impresszum hiányos.');
    if (cfg.barion.simulate) problems.push('A Barion SZIMULÁCIÓS módban van (nincs BARION_POS_KEY) — nincs valódi fizetés.');
  }
  if (problems.length) {
    console.log(line);
    console.log('  ⚠  ÉLESÍTÉSI FIGYELMEZTETÉSEK');
    problems.forEach(p => console.log(`     · ${p}`));
  }
  console.log(`${line}\n`);
});
