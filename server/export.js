'use strict';
/**
 * ══════════════════════════════════════════════════════════════════
 *  EXPORT — „ki, mit, mikor rendelt"
 * ══════════════════════════════════════════════════════════════════
 *  A táblázat két formátumban tölthető le az admin felületről:
 *    • CSV  — UTF-8 BOM + pontosvessző (a magyar Excel ezt várja)
 *    • XLS  — SpreadsheetML, külön csomag nélkül
 *  Mindkettő ugyanazt a szűrést használja, mint a képernyőn látott
 *  lista, tehát amit látsz, azt exportálod.
 * ══════════════════════════════════════════════════════════════════
 */

const cfg = require('./config');

const COLUMNS = [
  ['requestNumber', 'Azonosító'],
  ['createdAt', 'Beérkezett'],
  ['statusLabel', 'Státusz'],
  ['customerName', 'Ügyfél neve'],
  ['customerEmail', 'E-mail'],
  ['customerPhone', 'Telefon'],
  ['userId', 'Felhasználó ID'],
  ['price', `Bruttó ár (${cfg.currency.code})`],
  ['net', 'Nettó'],
  ['vat', 'ÁFA'],
  ['metal', 'Nemesfém'],
  ['ringSize', 'Gyűrűméret'],
  ['engraving', 'Gravírozás'],
  ['budget', 'Elképzelt keret'],
  ['deadline', 'Határidő'],
  ['note', 'Ügyfél megjegyzése'],
  ['adminNote', 'Admin megjegyzés'],
  ['images', 'Képek száma'],
  ['approvedAt', 'Jóváhagyva'],
  ['paidAt', 'Fizetve'],
  ['paymentId', 'Barion PaymentId'],
  ['paymentStatus', 'Barion státusz'],
  ['lang', 'Nyelv']
];

const STATUS_LABEL = {
  submitted: 'Beérkezett',
  approved: 'Elfogadva · fizethető',
  rejected: 'Elutasítva',
  paid: 'Kifizetve',
  in_production: 'Gyártás alatt',
  completed: 'Elkészült',
  canceled: 'Törölve'
};

function dt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Egy kérés → egy exportsor. */
function toRow(r) {
  const price = Number(r.price) || 0;
  const vat = price ? Math.round(price - price / (1 + cfg.shop.vatRate)) : 0;
  const d = r.details || {};
  return {
    requestNumber: r.requestNumber,
    createdAt: dt(r.createdAt),
    statusLabel: STATUS_LABEL[r.status] || r.status,
    customerName: (r.customer && r.customer.name) || '',
    customerEmail: (r.customer && r.customer.email) || '',
    customerPhone: (r.customer && r.customer.phone) || '',
    userId: r.userId || '',
    price: price || '',
    net: price ? price - vat : '',
    vat: vat || '',
    metal: d.metal || '',
    ringSize: d.ringSize || '',
    engraving: d.engraving || '',
    budget: d.budget || '',
    deadline: d.deadline || '',
    note: r.note || '',
    adminNote: r.adminNote || '',
    images: (r.images || []).length,
    approvedAt: dt(r.approvedAt),
    paidAt: dt(r.paidAt),
    paymentId: r.paymentId || '',
    paymentStatus: r.paymentStatus || '',
    lang: r.lang || ''
  };
}

/* ---------- CSV ---------- */
function csvCell(v) {
  const s = String(v === null || v === undefined ? '' : v).replace(/\r?\n/g, ' ');
  return /[";]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(requests) {
  const lines = [COLUMNS.map(c => csvCell(c[1])).join(';')];
  for (const r of requests.map(toRow)) lines.push(COLUMNS.map(c => csvCell(r[c[0]])).join(';'));
  return '\uFEFF' + lines.join('\r\n') + '\r\n';   // BOM → az Excel felismeri az UTF-8-at
}

/* ---------- XLS (SpreadsheetML) ---------- */
const xesc = v => String(v === null || v === undefined ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function xcell(v) {
  if (typeof v === 'number') return '<Cell><Data ss:Type="Number">' + v + '</Data></Cell>';
  return '<Cell><Data ss:Type="String">' + xesc(v) + '</Data></Cell>';
}

function toXls(requests) {
  const head = '<Row>' + COLUMNS.map(c =>
    '<Cell ss:StyleID="h"><Data ss:Type="String">' + xesc(c[1]) + '</Data></Cell>').join('') + '</Row>';
  const body = requests.map(toRow).map(r =>
    '<Row>' + COLUMNS.map(c => xcell(r[c[0]])).join('') + '</Row>').join('');
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
    + '<Styles><Style ss:ID="h"><Font ss:Bold="1"/>'
    + '<Interior ss:Color="#F7DACE" ss:Pattern="Solid"/></Style></Styles>'
    + '<Worksheet ss:Name="Rendelesek"><Table>' + head + body + '</Table></Worksheet></Workbook>';
}

const filename = ext => `brightal-rendelesek-${new Date().toISOString().slice(0, 10)}.${ext}`;

module.exports = { COLUMNS, STATUS_LABEL, toRow, toCsv, toXls, filename };
