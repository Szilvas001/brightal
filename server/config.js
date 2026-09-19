'use strict';
/**
 * ══════════════════════════════════════════════════════════════════
 *  BRIGHTAL — costum ring webshop · központi konfiguráció
 * ══════════════════════════════════════════════════════════════════
 *  Minden beállítás a .env fájlból jön, ésszerű alapértékekkel.
 *  Élesítéskor CSAK a .env-et kell módosítani.
 * ══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* ---------- egyszerű .env betöltő ---------- */
(function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
})();

const env = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' ? process.env[k] : d);
const bool = (k, d) => {
  const v = env(k, null);
  return v === null ? d : ['1', 'true', 'yes', 'igen'].includes(String(v).toLowerCase());
};

/* ---------- Barion környezetek ---------- */
const BARION_ENVIRONMENTS = {
  test: { api: 'https://api.test.barion.com', gateway: 'https://secure.test.barion.com/Pay', label: 'SANDBOX (teszt)' },
  prod: { api: 'https://api.barion.com', gateway: 'https://secure.barion.com/Pay', label: 'ÉLES (production)' }
};
const barionEnvKey = env('BARION_ENV', 'test') === 'prod' ? 'prod' : 'test';
const barionEnv = BARION_ENVIRONMENTS[barionEnvKey];
const posKey = env('BARION_POS_KEY', '').trim();
const simulate = bool('BARION_SIMULATE', posKey === '');

/* ---------- pénznem ---------- */
const CURRENCIES = {
  HUF: { code: 'HUF', decimals: 0, symbol: 'Ft' },
  EUR: { code: 'EUR', decimals: 2, symbol: '€' }
};
const currency = CURRENCIES[(env('CURRENCY', 'HUF') || 'HUF').toUpperCase()] || CURRENCIES.HUF;

/* ---------- session titok ---------- */
let sessionSecret = env('SESSION_SECRET', '').trim();
if (!sessionSecret) {
  const f = path.join(__dirname, '..', 'data', '.session-secret');
  try {
    if (fs.existsSync(f)) sessionSecret = fs.readFileSync(f, 'utf8').trim();
    else {
      sessionSecret = crypto.randomBytes(32).toString('hex');
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, sessionSecret, { mode: 0o600 });
    }
  } catch (e) { sessionSecret = crypto.randomBytes(32).toString('hex'); }
}

const port = Number(env('PORT', 3000));
const publicUrl = (env('PUBLIC_URL', `http://localhost:${port}`) || '').replace(/\/+$/, '');

module.exports = {
  port,
  publicUrl,
  nodeEnv: env('NODE_ENV', 'development'),
  isProd: env('NODE_ENV', 'development') === 'production',

  shop: {
    name: env('SHOP_NAME', 'BRIGHTAL'),
    email: env('SHOP_EMAIL', 'hello@brightal.hu'),
    phone: env('SHOP_PHONE', '+36 1 234 5678'),
    address: env('SHOP_ADDRESS', 'Budapest, Váci utca 1., 1052'),
    vatRate: Number(env('VAT_RATE', 0.27)),
    reviewHours: Number(env('REVIEW_HOURS', 1)),
    productionDaysMin: Number(env('PRODUCTION_DAYS_MIN', 10)),
    productionDaysMax: Number(env('PRODUCTION_DAYS_MAX', 14))
  },

  /* ══════════════════════════════════════════════════════════════
     CÉGADATOK — az impresszumhoz, ÁSZF-hez és adatkezelési
     tájékoztatóhoz. Ezek NEM titkos adatok, a böngészőbe is
     kikerülnek (a jogszabály kötelezővé teszi a közzétételüket).

     Amelyik üresen marad, ott a jogi oldalon jól látható
     „[KITÖLTENDŐ]" jelölés jelenik meg.
     ══════════════════════════════════════════════════════════════ */
  company: {
    name: env('COMPANY_NAME', ''),
    shortName: env('COMPANY_SHORT_NAME', env('SHOP_NAME', 'BRIGHTAL')),
    address: env('COMPANY_ADDRESS', ''),
    mailingAddress: env('COMPANY_MAILING_ADDRESS', ''),
    taxNumber: env('COMPANY_TAX_NUMBER', ''),
    euTaxNumber: env('COMPANY_EU_TAX_NUMBER', ''),
    regNumber: env('COMPANY_REG_NUMBER', ''),
    regAuthority: env('COMPANY_REG_AUTHORITY', ''),
    representative: env('COMPANY_REPRESENTATIVE', ''),
    bankName: env('COMPANY_BANK_NAME', ''),
    bankAccount: env('COMPANY_BANK_ACCOUNT', ''),
    email: env('COMPANY_EMAIL', env('SHOP_EMAIL', '')),
    phone: env('COMPANY_PHONE', env('SHOP_PHONE', '')),
    /* tárhelyszolgáltató — az Ekertv. 4. § alapján kötelező adat */
    hostingName: env('HOSTING_NAME', 'Hetzner Online GmbH'),
    hostingAddress: env('HOSTING_ADDRESS', 'Industriestr. 25, 91710 Gunzenhausen, Németország'),
    hostingEmail: env('HOSTING_EMAIL', 'info@hetzner.com'),
    /* fogyasztóvédelem / békéltető testület */
    arbitrationBoard: env('ARBITRATION_BOARD', 'Budapesti Békéltető Testület'),
    arbitrationAddress: env('ARBITRATION_ADDRESS', '1016 Budapest, Krisztina krt. 99. III. em. 310.'),
    arbitrationEmail: env('ARBITRATION_EMAIL', 'bekelteto.testulet@bkik.hu'),
    /* mikortól hatályosak a jogi szövegek */
    legalEffectiveFrom: env('LEGAL_EFFECTIVE_FROM', new Date().toISOString().slice(0, 10))
  },

  currency,

  /* ---------- képfeltöltés ---------- */
  upload: {
    dir: path.join(__dirname, '..', 'public', 'uploads'),
    maxBytes: Number(env('UPLOAD_MAX_MB', 8)) * 1024 * 1024,
    maxFiles: Number(env('UPLOAD_MAX_FILES', 4)),
    allowed: ['image/jpeg', 'image/png', 'image/webp']
  },

  /* ══════════════════════════════════════════════════════════════
     BEÉPÍTETT ADMIN FIÓK
     ⚠ Az alapértelmezett jelszó GYENGE. Élesítés előtt cseréld le
       a .env fájlban az ADMIN_PASSWORD értékét!
     ══════════════════════════════════════════════════════════════ */
  admin: {
    username: env('ADMIN_USERNAME', '20000902'),
    password: env('ADMIN_PASSWORD', '12345'),
    /* Ha ez ki van töltve, a nyílt szöveges ADMIN_PASSWORD-öt a rendszer
       FIGYELMEN KÍVÜL hagyja. Előállítás:  npm run hash-password    */
    passwordHash: env('ADMIN_PASSWORD_HASH', '').trim(),
    email: env('ADMIN_EMAIL', env('SHOP_EMAIL', 'hello@brightal.hu')),
    name: env('ADMIN_NAME', 'Admin')
  },

  barion: {
    envKey: barionEnvKey,
    label: barionEnv.label,
    apiBase: env('BARION_API_BASE', barionEnv.api).replace(/\/+$/, ''),
    gatewayBase: env('BARION_GATEWAY_BASE', barionEnv.gateway),
    posKey,
    payee: env('BARION_PAYEE', '').trim(),
    shopId: env('BARION_SHOP_ID', ''),
    pixelId: env('BARION_PIXEL_ID', ''),
    locale: env('BARION_LOCALE', 'hu-HU'),
    guestCheckout: bool('BARION_GUEST_CHECKOUT', true),
    fundingSources: (env('BARION_FUNDING_SOURCES', 'All') || 'All').split(',').map(s => s.trim()),
    simulate,
    redirectUrl: `${publicUrl}/payment-return`,
    callbackUrl: `${publicUrl}/api/payment/callback`,
    /* .NET TimeSpan formátum (d.hh:mm:ss) — a Barion NEM ISO 8601-et vár! */
    paymentWindow: env('BARION_PAYMENT_WINDOW', '1.00:00:00')
  },

  google: { clientId: env('GOOGLE_CLIENT_ID', '').trim() },

  /* ---------- e-mail értesítés ---------- */
  mail: {
    enabled: bool('MAIL_ENABLED', false),
    host: env('SMTP_HOST', ''),
    port: Number(env('SMTP_PORT', 587)),
    secure: bool('SMTP_SECURE', false),
    user: env('SMTP_USER', ''),
    pass: env('SMTP_PASS', ''),
    from: env('MAIL_FROM', `BRIGHTAL <${env('SHOP_EMAIL', 'hello@brightal.hu')}>`)
  },

  /* ══════════════════════════════════════════════════════════════
     SZÁMLÁZÁS
     Kikapcsolva a rendszer csak naplózza, hogy mikor kellett volna
     számlát kiállítani (data/invoice-outbox.log) — a fizetés ettől
     hibátlanul működik.
     ══════════════════════════════════════════════════════════════ */
  invoice: {
    enabled: bool('INVOICE_ENABLED', false),
    /* 'szamlazz' | 'billingo' */
    provider: (env('INVOICE_PROVIDER', 'szamlazz') || 'szamlazz').toLowerCase(),
    /* Számlázz.hu: Beállítások → Számla agent → Agent kulcs */
    szamlazzApiKey: env('SZAMLAZZ_AGENT_KEY', '').trim(),
    /* Billingo v3: Beállítások → API kulcsok */
    billingoApiKey: env('BILLINGO_API_KEY', '').trim(),
    billingoBlockId: env('BILLINGO_BLOCK_ID', '').trim(),
    billingoBankAccountId: env('BILLINGO_BANK_ACCOUNT_ID', '').trim(),
    /* e-számla küldése az ügyfélnek a szolgáltatón keresztül */
    sendToCustomer: bool('INVOICE_SEND_TO_CUSTOMER', true),
    /* fizetési mód a számlán */
    paymentMethod: env('INVOICE_PAYMENT_METHOD', 'bankkártya'),
    /* teljesítés = fizetés napja */
    vatRateLabel: env('INVOICE_VAT_RATE_LABEL', '27'),
    itemName: env('INVOICE_ITEM_NAME', 'Egyedi készítésű gyűrű'),
    /* alanyi adómentesség esetén: AM, és a VAT_RATE=0 */
    comment: env('INVOICE_COMMENT', '')
  },

  /* ---------- cookie / hozzájárulás ---------- */
  cookies: {
    /* a Barion Pixel csak marketing-hozzájárulás után töltődik be */
    pixelRequiresConsent: bool('PIXEL_REQUIRES_CONSENT', true)
  },

  /* ---------- Pinterest inspiráció ---------- */
  pinterest: {
    boardHu: env('PINTEREST_BOARD_HU', ''),
    boardEn: env('PINTEREST_BOARD_EN', '')
  },

  defaultLang: env('DEFAULT_LANG', 'hu') === 'en' ? 'en' : 'hu',
  sessionSecret,
  sessionCookie: env('SESSION_COOKIE', 'ssy_session'),
  sessionMaxAgeDays: Number(env('SESSION_MAX_AGE_DAYS', 30))
};
