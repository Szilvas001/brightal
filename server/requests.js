'use strict';
/**
 * ══════════════════════════════════════════════════════════════════
 *  KÉRÉSEK (custom ring requests) — életciklus
 * ══════════════════════════════════════════════════════════════════
 *
 *   submitted ──► approved ──► paid ──► in_production ──► completed
 *       │            (admin ár)   (Barion)
 *       └──► rejected
 *
 *  Az ÁRAT KIZÁRÓLAG az admin állítja be a szerveren.
 *  A böngészőből érkező összeget soha nem fogadjuk el.
 * ══════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');
const cfg = require('./config');

const STATUS = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
  IN_PRODUCTION: 'in_production',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
};

/** Melyik státuszból melyikbe lehet lépni (adminként). */
const ADMIN_TRANSITIONS = {
  [STATUS.SUBMITTED]: [STATUS.APPROVED, STATUS.REJECTED],
  [STATUS.APPROVED]: [STATUS.REJECTED, STATUS.APPROVED],   // ár módosítható
  [STATUS.REJECTED]: [STATUS.APPROVED],
  [STATUS.PAID]: [STATUS.IN_PRODUCTION, STATUS.COMPLETED],
  [STATUS.IN_PRODUCTION]: [STATUS.COMPLETED],
  [STATUS.COMPLETED]: []
};

const PAYABLE = [STATUS.APPROVED];

function requestNumber() {
  const d = new Date();
  const day = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `BRG-${day}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

/** Ár kerekítése (HUF: 100-ra). */
function roundPrice(v) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return null;
  return cfg.currency.decimals === 0 ? Math.round(n / 100) * 100 : Math.round(n * 100) / 100;
}

/** ÁFA-bontás a végösszegből. */
function vatBreakdown(total) {
  const vat = Math.round(total - total / (1 + cfg.shop.vatRate));
  return { total, vat, net: total - vat };
}

const S = (v, max) => String(v === undefined || v === null ? '' : v).trim().slice(0, max);

/** Az ügyfél felé küldhető, biztonságos kérésobjektum. */
function toPublic(r, { includeInternal = false } = {}) {
  const out = {
    id: r.id,
    requestNumber: r.requestNumber,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    approvedAt: r.approvedAt || null,
    paidAt: r.paidAt || null,
    images: r.images.map(i => ({ url: i.url, name: i.originalName })),
    details: r.details,
    source: r.diamond ? 'diamond' : r.design ? 'designer' : 'upload',
    diamond: r.diamond || null,
    design: r.design || null,
    note: r.note,
    price: r.price,
    currency: r.currency,
    vat: r.accounting ? Number(r.accounting.vatHuf) : r.price ? vatBreakdown(r.price).vat : null,
    accounting: r.accounting || null,
    adminNote: r.adminNote || null,
    paymentStatus: r.paymentStatus || null,
    payable: PAYABLE.includes(r.status) && r.price > 0,
    productionDays: [cfg.shop.productionDaysMin, cfg.shop.productionDaysMax]
  };
  if (includeInternal) {
    out.customer = r.customer;
    out.userId = r.userId;
    out.paymentId = r.paymentId || null;
    out.history = r.history;
    out.lang = r.lang;
  }
  return out;
}

/** Új kérés objektum összeállítása. */
function build({ user, body, files, lang, design = null }) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    requestNumber: requestNumber(),
    userId: user.id,
    design,
    lang: lang === 'en' ? 'en' : 'hu',
    status: STATUS.SUBMITTED,
    createdAt: now,
    updatedAt: now,
    customer: {
      name: S(body.name, 100) || user.name,
      email: (S(body.email, 190) || user.email).toLowerCase(),
      phone: S(body.phone, 40)
    },
    images: files.map(f => ({
      url: '/uploads/' + f.filename,
      filename: f.filename,
      originalName: S(f.originalname, 120),
      size: f.size,
      mime: f.mimetype
    })),
    details: {
      metal: design ? design.config.metal : S(body.metal, 40),
      ringSize: design ? String(design.config.size) : S(body.ringSize, 10),
      budget: S(body.budget, 40),
      deadline: S(body.deadline, 40),
      engraving: design ? design.config.engraving : S(body.engraving, 40)
    },
    note: S(body.note, 1000),
    price: null,
    currency: cfg.currency.code,
    adminNote: null,
    approvedAt: null,
    paidAt: null,
    paymentId: null,
    paymentRequestId: null,
    paymentStatus: null,
    gatewayUrl: null,
    history: [{ at: now, event: 'submitted' }]
  };
}

module.exports = {
  STATUS, ADMIN_TRANSITIONS, PAYABLE,
  requestNumber, roundPrice, vatBreakdown, toPublic, build
};
