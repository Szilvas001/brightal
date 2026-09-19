'use strict';
/**
 * ══════════════════════════════════════════════════════════════════
 *  BARION SMART GATEWAY v2 KLIENS
 * ══════════════════════════════════════════════════════════════════
 *  FONTOS: a POSKey KIZÁRÓLAG a szerveren létezik, sosem kerül a
 *  böngészőbe. Bankkártyaadatot ez az alkalmazás soha nem lát és nem
 *  tárol – a kártyaadatokat a vásárló a Barion saját, PCI-DSS
 *  tanúsított fizetőoldalán adja meg.
 *
 *  Élesítéskor egyetlen dolog változik: a .env fájlban
 *      BARION_ENV=prod
 *      BARION_POS_KEY=<éles POSKey>
 *      BARION_PAYEE=<éles Barion e-mail cím>
 *  A kód maga változatlan marad.
 * ══════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');
const cfg = require('./config');

const STATUS = {
  PREPARED: 'Prepared',
  STARTED: 'Started',
  IN_PROGRESS: 'InProgress',
  WAITING: 'Waiting',
  RESERVED: 'Reserved',
  AUTHORIZED: 'Authorized',
  CANCELED: 'Canceled',
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  PARTIALLY_SUCCEEDED: 'PartiallySucceeded',
  EXPIRED: 'Expired'
};

const SUCCESS_STATES = [STATUS.SUCCEEDED, STATUS.AUTHORIZED, STATUS.RESERVED];
const FAILURE_STATES = [STATUS.CANCELED, STATUS.FAILED, STATUS.EXPIRED];

/* ---------- szimulált fizetések memóriában (csak BARION_SIMULATE=1 esetén) ---------- */
const simStore = new Map();

function amountForBarion(v) {
  // HUF/CZK: egész szám. EUR/USD: 2 tizedes.
  return cfg.currency.decimals === 0 ? Math.round(v) : Math.round(v * 100) / 100;
}

/** A kéréshez tartozó egyetlen Barion-tétel összeállítása. */
function toBarionItems(request) {
  const desc = [
    request.details && request.details.metal,
    request.details && request.details.ringSize ? `méret ${request.details.ringSize}` : null,
    request.details && request.details.engraving ? `gravírozás: ${request.details.engraving}` : null,
    `${request.images.length} referenciakép`
  ].filter(Boolean).join(' · ');
  return [{
    Name: `Egyedi jegygyűrű — ${request.requestNumber}`.slice(0, 250),
    Description: (desc || 'Egyedi készítésű jegygyűrű').slice(0, 500),
    Quantity: 1,
    Unit: 'db',
    UnitPrice: amountForBarion(request.price),
    ItemTotal: amountForBarion(request.price),
    SKU: request.requestNumber
  }];
}

/**
 * Fizetés indítása.
 * @param {object} order  a saját rendelésobjektumunk
 * @returns {Promise<{paymentId:string, gatewayUrl:string, status:string, simulated:boolean}>}
 */
async function startPayment(request) {
  const items = toBarionItems(request);
  const total = amountForBarion(request.price);

  const payload = {
    POSKey: cfg.barion.posKey,
    PaymentType: 'Immediate',
    PaymentWindow: cfg.barion.paymentWindow,   // .NET TimeSpan: "1.00:00:00"
    GuestCheckOut: cfg.barion.guestCheckout,
    InitiateRecurrence: false,
    FundingSources: cfg.barion.fundingSources,
    PaymentRequestId: request.paymentRequestId,
    OrderNumber: request.requestNumber,
    PayerHint: request.customer.email || undefined,
    Locale: cfg.barion.locale,
    Currency: cfg.currency.code,
    RedirectUrl: `${cfg.barion.redirectUrl}?request=${encodeURIComponent(request.requestNumber)}`,
    CallbackUrl: cfg.barion.callbackUrl,
    Transactions: [{
      POSTransactionId: request.requestNumber,
      Payee: cfg.barion.payee,
      Total: total,
      Comment: `${cfg.shop.name} — ${request.requestNumber}`,
      Items: items
    }]
  };

  /* ---------- SZIMULÁCIÓS MÓD ---------- */
  if (cfg.barion.simulate) {
    const paymentId = crypto.randomUUID();
    simStore.set(paymentId, {
      PaymentId: paymentId,
      PaymentRequestId: request.paymentRequestId,
      OrderNumber: request.requestNumber,
      Status: STATUS.PREPARED,
      Total: total,
      Currency: cfg.currency.code,
      createdAt: new Date().toISOString()
    });
    return {
      paymentId,
      gatewayUrl: `${cfg.publicUrl}/sandbox-gateway?paymentId=${paymentId}`,
      status: STATUS.PREPARED,
      simulated: true
    };
  }

  /* ---------- VALÓDI BARION HÍVÁS ---------- */
  const res = await fetch(`${cfg.barion.apiBase}/v2/Payment/Start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) {
    throw new Error(`Barion válasz nem értelmezhető (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok || (data.Errors && data.Errors.length)) {
    const msg = (data.Errors || []).map(e => `${e.ErrorCode}: ${e.Title || e.Description}`).join(' | ') || `HTTP ${res.status}`;
    const err = new Error(`Barion Payment/Start hiba – ${msg}`);
    err.barionErrors = data.Errors || [];
    throw err;
  }

  const gatewayUrl = data.GatewayUrl || `${cfg.barion.gatewayBase}?Id=${data.PaymentId}`;
  return { paymentId: data.PaymentId, gatewayUrl, status: data.Status, simulated: false };
}

/**
 * Fizetés állapotának lekérdezése.
 * A rendelés státuszát KIZÁRÓLAG ennek az eredménye alapján léptetjük –
 * sosem a böngészőből visszaérkező paraméterek alapján.
 */
async function getPaymentState(paymentId) {
  if (cfg.barion.simulate) {
    const p = simStore.get(paymentId);
    if (!p) throw new Error('Ismeretlen (szimulált) paymentId.');
    return { PaymentId: p.PaymentId, PaymentRequestId: p.PaymentRequestId, Status: p.Status, Total: p.Total, Currency: p.Currency, simulated: true };
  }

  const url = `${cfg.barion.apiBase}/v2/Payment/GetPaymentState`
    + `?POSKey=${encodeURIComponent(cfg.barion.posKey)}&PaymentId=${encodeURIComponent(paymentId)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) {
    throw new Error(`Barion állapotlekérdezés nem értelmezhető (HTTP ${res.status})`);
  }
  if (!res.ok || (data.Errors && data.Errors.length)) {
    const msg = (data.Errors || []).map(e => `${e.ErrorCode}: ${e.Title}`).join(' | ') || `HTTP ${res.status}`;
    throw new Error(`Barion GetPaymentState hiba – ${msg}`);
  }
  return data;
}

/** Csak szimulációs módban: a teszt-átjáró állítja be az eredményt. */
function simulateResult(paymentId, outcome) {
  const p = simStore.get(paymentId);
  if (!p) return null;
  p.Status = outcome === 'success' ? STATUS.SUCCEEDED
    : outcome === 'cancel' ? STATUS.CANCELED
      : STATUS.FAILED;
  p.completedAt = new Date().toISOString();
  return p;
}

function simulatedPayment(paymentId) {
  return simStore.get(paymentId) || null;
}

module.exports = {
  STATUS, SUCCESS_STATES, FAILURE_STATES,
  startPayment, getPaymentState,
  simulateResult, simulatedPayment,
  isSimulated: () => cfg.barion.simulate
};
