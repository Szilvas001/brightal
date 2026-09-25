'use strict';
/**
 * ══════════════════════════════════════════════════════════════════
 *  SZÁMLÁZÁS
 * ══════════════════════════════════════════════════════════════════
 *  Sikeres fizetés után automatikusan kiállít egy elektronikus
 *  számlát. Két szolgáltató támogatott:
 *
 *    INVOICE_PROVIDER=szamlazz   → Számlázz.hu Agent XML API
 *    INVOICE_PROVIDER=billingo   → Billingo v3 REST API
 *
 *  KIKAPCSOLVA (INVOICE_ENABLED=false) a modul csak naplóz a
 *  data/invoice-outbox.log fájlba — a fizetési folyamat ettől
 *  teljesen működik, semmi nem törik el.
 *
 *  FONTOS: mindkét szolgáltató a NAV Online Számla rendszerbe is
 *  továbbítja az adatokat, ha a fiókban be van állítva. Ezt a
 *  szolgáltató felületén kell egyszer beállítani.
 *
 *  ⚠  ÉLESÍTÉS ELŐTT: állíts ki egy próbaszámlát teszt módban
 *     (Számlázz.hu: <eszamla>false</eszamla> + próbafiók, Billingo:
 *     draft dokumentum), és ellenőrizd a NAV-adattartalmat is.
 * ══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const cfg = require('./config');

const LOG_FILE = path.join(__dirname, '..', 'data', 'invoice-outbox.log');

const isEnabled = () =>
  cfg.invoice.enabled &&
  (cfg.invoice.provider === 'szamlazz' ? !!cfg.invoice.szamlazzApiKey : !!cfg.invoice.billingoApiKey);

/* ---------- naplózás (mindig fut, akkor is ha van valódi számlázás) ---------- */
function log(entry) {
  const line = `\n${'─'.repeat(64)}\n[${new Date().toISOString()}] ${JSON.stringify(entry, null, 2)}\n`;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    console.error('[invoice] napló írása sikertelen:', e.message);
  }
}

/* ---------- közös: a számla adatai a kérésből ---------- */
function buildInvoiceData(request) {
  const gross = Number(request.price) || 0;
  const vatRate = Number(cfg.shop.vatRate) || 0;
  const exact=request.diamond||request.combinationOffer?require('./diamond-pricing').accounting(gross):null;
  const vat = exact ? Number(exact.vatHuf) : cfg.currency.decimals === 0
    ? Math.round(gross - gross / (1 + vatRate))
    : Math.round((gross - gross / (1 + vatRate)) * 100) / 100;
  const net = exact ? Number(exact.netHuf) : cfg.currency.decimals === 0 ? gross - vat : Math.round((gross - vat) * 100) / 100;

  const today = new Date().toISOString().slice(0, 10);
  const c = request.customer || {};

  return {
    orderNumber: request.requestNumber,
    issueDate: today,
    fulfillmentDate: (request.paidAt || new Date().toISOString()).slice(0, 10),
    dueDate: today,                       // kártyás fizetés: azonnal teljesült
    currency: request.currency || cfg.currency.code,
    paymentMethod: cfg.invoice.paymentMethod,
    lang: request.lang === 'en' ? 'en' : 'hu',
    customer: {
      name: c.name || 'Vásárló',
      email: c.email || '',
      phone: c.phone || '',
      /* A rendszer nem kér számlázási címet — ha az ügyfél megadta a
         fiókjában, az onnan jön. Enélkül a szolgáltató az e-mail
         alapján rögzíti, és a hiányzó címet kézzel kell pótolni. */
      country: (request.billing && request.billing.country) || 'Magyarország',
      zip: (request.billing && request.billing.zip) || '',
      city: (request.billing && request.billing.city) || '',
      street: (request.billing && request.billing.street) || ''
    },
    item: {
      name: `${request.diamond||request.combinationOffer?'Laboratóriumi gyémánt':cfg.invoice.itemName} — ${request.requestNumber}`,
      quantity: 1,
      unit: 'db',
      netUnitPrice: net,
      net,
      vat,
      gross,
      vatRateLabel: exact ? '27' : cfg.invoice.vatRateLabel
    },
    comment: cfg.invoice.comment
  };
}

/* ══════════════════════════════════════════════════════════════════
   SZÁMLÁZZ.HU — Agent XML API
   Dokumentáció: https://docs.szamlazz.hu/
   ══════════════════════════════════════════════════════════════════ */

const xmlEscape = v => String(v === undefined || v === null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function szamlazzXml(d) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamla xmlns="http://www.szamlazz.hu/xmlszamla"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://www.szamlazz.hu/xmlszamla https://www.szamlazz.hu/szamla/docs/xsds/agent/xmlszamla.xsd">
  <beallitasok>
    <szamlaagentkulcs>${xmlEscape(cfg.invoice.szamlazzApiKey)}</szamlaagentkulcs>
    <eszamla>true</eszamla>
    <szamlaLetoltes>false</szamlaLetoltes>
    <valaszVerzio>2</valaszVerzio>
  </beallitasok>
  <fejlec>
    <keltDatum>${xmlEscape(d.issueDate)}</keltDatum>
    <teljesitesDatum>${xmlEscape(d.fulfillmentDate)}</teljesitesDatum>
    <fizetesiHataridoDatum>${xmlEscape(d.dueDate)}</fizetesiHataridoDatum>
    <fizmod>${xmlEscape(d.paymentMethod)}</fizmod>
    <penznem>${xmlEscape(d.currency)}</penznem>
    <szamlaNyelve>${xmlEscape(d.lang)}</szamlaNyelve>
    <megjegyzes>${xmlEscape(d.comment)}</megjegyzes>
    <rendelesSzam>${xmlEscape(d.orderNumber)}</rendelesSzam>
    <fizetve>true</fizetve>
  </fejlec>
  <elado>
    <emailReplyto>${xmlEscape(cfg.shop.email)}</emailReplyto>
    <emailTargy>Számla — ${xmlEscape(d.orderNumber)}</emailTargy>
  </elado>
  <vevo>
    <nev>${xmlEscape(d.customer.name)}</nev>
    <irsz>${xmlEscape(d.customer.zip)}</irsz>
    <telepules>${xmlEscape(d.customer.city)}</telepules>
    <cim>${xmlEscape(d.customer.street)}</cim>
    <email>${xmlEscape(d.customer.email)}</email>
    <sendEmail>${cfg.invoice.sendToCustomer ? 'true' : 'false'}</sendEmail>
    <telefonszam>${xmlEscape(d.customer.phone)}</telefonszam>
  </vevo>
  <tetelek>
    <tetel>
      <megnevezes>${xmlEscape(d.item.name)}</megnevezes>
      <mennyiseg>${d.item.quantity}</mennyiseg>
      <mennyisegiEgyseg>${xmlEscape(d.item.unit)}</mennyisegiEgyseg>
      <nettoEgysegar>${d.item.netUnitPrice}</nettoEgysegar>
      <afakulcs>${xmlEscape(d.item.vatRateLabel)}</afakulcs>
      <nettoErtek>${d.item.net}</nettoErtek>
      <afaErtek>${d.item.vat}</afaErtek>
      <bruttoErtek>${d.item.gross}</bruttoErtek>
    </tetel>
  </tetelek>
</xmlszamla>`;
}

async function createSzamlazzInvoice(d) {
  const xml = szamlazzXml(d);
  const form = new FormData();
  form.append('action-xmlagentxmlfile', new Blob([xml], { type: 'text/xml' }), 'szamla.xml');

  const res = await fetch('https://www.szamlazz.hu/szamla/', { method: 'POST', body: form });
  const body = await res.text();

  /* A Számlázz.hu a hibát HTTP fejlécben is visszaadja. */
  const errCode = res.headers.get('szlahu_error_code');
  const errMsg = res.headers.get('szlahu_error');
  if (errCode) {
    throw new Error(`Számlázz.hu hiba ${errCode}: ${decodeURIComponent(errMsg || '').replace(/\+/g, ' ')}`);
  }
  if (!res.ok) throw new Error(`Számlázz.hu HTTP ${res.status}`);

  const number = res.headers.get('szlahu_szamlaszam')
    || (body.match(/<szamlaszam>([^<]+)<\/szamlaszam>/) || [])[1]
    || null;

  return { provider: 'szamlazz', invoiceNumber: number, raw: body.slice(0, 2000) };
}

/* ══════════════════════════════════════════════════════════════════
   BILLINGO v3 — REST API
   Dokumentáció: https://api.billingo.hu/
   ══════════════════════════════════════════════════════════════════ */

async function billingo(pathname, options = {}) {
  const res = await fetch('https://api.billingo.hu/v3' + pathname, {
    method: options.method || 'GET',
    headers: {
      'X-API-KEY': cfg.invoice.billingoApiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(`Billingo hiba: ${msg}`);
  }
  return data;
}

async function createBillingoInvoice(d) {
  if (!cfg.invoice.billingoBlockId) throw new Error('Hiányzik a BILLINGO_BLOCK_ID.');

  /* 1. partner létrehozása (a Billingo minden számlához partnert vár) */
  const partner = await billingo('/partners', {
    method: 'POST',
    body: {
      name: d.customer.name,
      emails: d.customer.email ? [d.customer.email] : [],
      phone: d.customer.phone || undefined,
      address: {
        country_code: 'HU',
        post_code: d.customer.zip || '',
        city: d.customer.city || '',
        address: d.customer.street || ''
      }
    }
  });

  /* 2. számla kiállítása */
  const doc = await billingo('/documents', {
    method: 'POST',
    body: {
      partner_id: partner.id,
      block_id: Number(cfg.invoice.billingoBlockId),
      bank_account_id: cfg.invoice.billingoBankAccountId ? Number(cfg.invoice.billingoBankAccountId) : undefined,
      type: 'invoice',
      fulfillment_date: d.fulfillmentDate,
      due_date: d.dueDate,
      payment_method: 'bankcard',
      language: d.lang,
      currency: d.currency,
      conversion_rate: 1,
      electronic: true,
      paid: true,
      comment: d.comment || undefined,
      settings: { should_send_email: !!cfg.invoice.sendToCustomer },
      items: [{
        name: d.item.name,
        unit_price: d.item.netUnitPrice,
        unit_price_type: 'net',
        quantity: d.item.quantity,
        unit: d.item.unit,
        vat: `${d.item.vatRateLabel}%`
      }]
    }
  });

  return { provider: 'billingo', invoiceNumber: doc.invoice_number || String(doc.id), raw: doc };
}

/* ══════════════════════════════════════════════════════════════════
   BELÉPÉSI PONT
   ══════════════════════════════════════════════════════════════════ */

/**
 * Számla kiállítása egy kifizetett kérésre.
 * SOHA nem dob kivételt kifelé — a fizetés akkor sem borulhat,
 * ha a számlázó szolgáltató nem elérhető. Hiba esetén a naplóba kerül,
 * és kézzel pótolható.
 *
 * @returns {Promise<{ok:boolean, invoiceNumber?:string, error?:string, simulated?:boolean}>}
 */
async function issueForRequest(request) {
  const d = buildInvoiceData(request);

  if (!isEnabled()) {
    log({ mode: 'SZIMULÁLT — nincs bekapcsolva a számlázás', data: d });
    console.log(`[invoice] ⚠  szimulált számla: ${d.orderNumber} (${d.item.gross} ${d.currency}) → data/invoice-outbox.log`);
    return { ok: true, simulated: true };
  }

  try {
    const result = cfg.invoice.provider === 'billingo'
      ? await createBillingoInvoice(d)
      : await createSzamlazzInvoice(d);

    log({ mode: 'KIÁLLÍTVA', provider: result.provider, invoiceNumber: result.invoiceNumber, orderNumber: d.orderNumber });
    console.log(`[invoice] ✔ Számla kiállítva: ${result.invoiceNumber || '(szám nélkül)'} — ${d.orderNumber}`);
    return { ok: true, invoiceNumber: result.invoiceNumber, simulated: false };
  } catch (e) {
    log({ mode: 'HIBA — kézzel pótlandó!', error: e.message, data: d });
    console.error(`[invoice] ✗ Számlázás sikertelen (${d.orderNumber}): ${e.message}`);
    console.error('[invoice]   A számlát kézzel kell kiállítani — részletek: data/invoice-outbox.log');
    return { ok: false, error: e.message };
  }
}

module.exports = {
  issueForRequest,
  isEnabled,
  buildInvoiceData,
  LOG_FILE
};
