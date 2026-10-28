'use strict';
/**
 * E-mail értesítések.
 *
 * Ha a .env-ben MAIL_ENABLED=true és be van állítva az SMTP, valódi levelet küld.
 * Ha nincs, a levelet a konzolra írja ki ÉS elmenti a data/mail-outbox.log fájlba.
 * Így fejlesztés közben is látod, mi ment volna ki — a folyamat nem akad el.
 */

const fs = require('fs');
const path = require('path');
const cfg = require('./config');

let transporter = null;
if (cfg.mail.enabled && cfg.mail.host) {
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: cfg.mail.host,
      port: cfg.mail.port,
      secure: cfg.mail.secure,
      connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
      auth: cfg.mail.user ? { user: cfg.mail.user, pass: cfg.mail.pass } : undefined
    });
    console.log(`[mail] SMTP beállítva: ${cfg.mail.host}:${cfg.mail.port}`);
  } catch (e) {
    console.error('[mail] SMTP inicializálás sikertelen:', e.message);
  }
}

const OUTBOX = path.join(__dirname, '..', 'data', 'mail-outbox.log');

function logToOutbox(to, subject, text) {
  const entry = [
    '═'.repeat(70),
    `IDŐ    : ${new Date().toISOString()}`,
    `CÍMZETT: ${to}`,
    `TÁRGY  : ${subject}`,
    '─'.repeat(70),
    text,
    ''
  ].join('\n');
  try {
    fs.mkdirSync(path.dirname(OUTBOX), { recursive: true });
    fs.appendFileSync(OUTBOX, entry + '\n');
  } catch (e) { /* nem kritikus */ }
  console.log(`\n[mail] ✉  ${to} — ${subject}\n       (SMTP nincs bekapcsolva; mentve: data/mail-outbox.log)\n`);
}

/* ---------- sablon ---------- */
function wrap(title, bodyHtml) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#FDF2EC;font-family:Georgia,serif;padding:32px 16px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.06)">
  <div style="background:#3B2119;padding:26px 32px">
    <div style="color:#E3B79F;font-size:11px;letter-spacing:4px;font-family:Helvetica,Arial,sans-serif">${cfg.shop.name}</div>
  </div>
  <div style="padding:32px">
    <h1 style="font-size:23px;color:#3B2119;margin:0 0 18px;font-weight:normal">${title}</h1>
    ${bodyHtml}
  </div>
  <div style="padding:18px 32px;background:#FDF2EC;color:#AA8B7B;font-size:11px;font-family:Helvetica,Arial,sans-serif">
    ${cfg.shop.name} · ${cfg.shop.address} · ${cfg.shop.email}
  </div>
</div></body></html>`;
}

async function send(to, subject, text, html, attachments = []) {
  if (!transporter) { logToOutbox(to, subject, text); return { simulated: true }; }
  try {
    await transporter.sendMail({ from: cfg.mail.from, replyTo: cfg.mail.replyTo || undefined, to, subject, text, html: html || undefined, attachments });
    console.log(`[mail] ✔ elküldve: ${to} — ${subject}`);
    return { simulated: false };
  } catch (e) {
    console.error(`[mail] ✖ küldés sikertelen (${to}):`, e.message);
    throw e;
  }
}

const money = v => new Intl.NumberFormat('hu-HU').format(v) + ' ' + cfg.currency.symbol;

/* ══════════════════════════════════════════════════════════════════
   KONKRÉT ÉRTESÍTÉSEK
   ══════════════════════════════════════════════════════════════════ */

const escapeHtml=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function notice(r,subject,text){return send(r.customer.email,subject,text,wrap(subject,`<div style="white-space:pre-wrap;line-height:1.7">${escapeHtml(text)}</div>`));}
function offerText(r){const o=r.finalOffer;if(!o)return `Azonosító: ${r.requestNumber}\nÁr: ${money(r.price)}`;return `Azonosító: ${r.requestNumber}\n${o.specification}\n\nÉkszer: ${money(o.productPrice)}\nSzállítás: ${money(o.shippingFee)}\nFizetendő végösszeg: ${money(o.total)}\nGyártási idő: ${o.productionTime}\nÁtadás / feladás: ${o.deliveryTime}\nSzállítás: ${o.shippingMethod}\nFizetési feltételek: ${o.paymentTerms}\nÉrvényesség: ${o.validUntil}\nLátványterv: ${o.previewUrl.startsWith('/')?cfg.publicUrl:''}${o.previewUrl}\nAjánlat azonosítója: ${o.id}`;}
function requestReceived(r){return require('./order-mail-queue').enqueue(r,'received');}
function requestApproved(r){return require('./order-mail-queue').enqueue(r,'approved');}
function contractAccepted(r){return notice(r,`Megrendelés elfogadva — ${r.requestNumber}`,`Kedves ${r.customer.name}!\n\nMegrendelését elfogadtuk. Fizetése beérkezett, a teljesítés előtti ellenőrzések lezárultak.\n\n${offerText(r)}\n\nJóváhagyás: ${r.acceptance?.at}\nSzállítási cím: ${r.acceptance?.shippingAddress}\nA gyártás és a kiszállítás állapotát a privát hivatkozáson követheti: ${require("./guest-access").url(r)}`);}

/** 3) Elutasítva */
function requestRejected(req_, lang = 'hu') {
  const hu = lang === 'hu';
  const subject = hu ? `A kérésedről — ${req_.requestNumber}` : `About your request — ${req_.requestNumber}`;
  const text = hu
    ? `Kedves ${req_.customer.name}!\n\nSajnos ezt a gyűrűt nem tudjuk elkészíteni.\n\n`
    + (req_.adminNote ? `Indoklás: ${req_.adminNote}\n\n` : '')
    + `Nyugodtan tölts fel másik képet — szívesen segítünk.\n\nÜdvözlettel,\n${cfg.shop.name}`
    : `Dear ${req_.customer.name},\n\nUnfortunately we are unable to craft this particular ring.\n\n`
    + (req_.adminNote ? `Reason: ${req_.adminNote}\n\n` : '')
    + `You are welcome to upload another photo — we are happy to help.\n\nWarm regards,\n${cfg.shop.name}`;
  return send(req_.customer.email, subject, text, wrap(hu ? 'A kérésedről' : 'About your request',
    `<p style="color:#4A2C1F;line-height:1.75;font-size:15px">${text.split('\n\n').slice(1).join('<br><br>')}</p>`));
}

function paymentReceived(r,lang='hu') {
 return notice(r,`${lang==='hu'?'Fizetés beérkezett':'Payment received'} — ${r.requestNumber}`,`Kedves ${r.customer.name}!\n\nFizetése beérkezett. Köszönjük!\n\n${offerText(r)}\n\nA fizetés visszaigazolása önmagában nem jelenti a gyártás megkezdését. A megrendelés elfogadásáról és teljesítéséről külön értesítjük. A számlát a számlázási szolgáltatón keresztül küldjük meg.\n\n${require("./guest-access").url(r)}`);
}

/** 5) Admin értesítés új kérésről */
function adminNewRequest(req_) {
  const url = `${cfg.publicUrl}/admin`;
  const text = `Új kérés érkezett.\n\nAzonosító: ${req_.requestNumber}\n`
    + `Ügyfél: ${req_.customer.name} (${req_.customer.email})\n`
    + `Képek: ${req_.images.length} db\n`
    + (req_.note ? `Megjegyzés: ${req_.note}\n` : '')
    + `\nÁrazás: ${url}`;
  return send(cfg.admin.email, `[ADMIN] Új kérés — ${req_.requestNumber}`, text,
    wrap('Új kérés érkezett', `<pre style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#4A2C1F;white-space:pre-wrap">${escapeHtml(text)}</pre>`));
}

module.exports = {
  send, contractAccepted, requestReceived, requestApproved, requestRejected, paymentReceived, adminNewRequest,
  startWorker: () => require('./order-mail-queue').start().catch(e=>console.error('[mail queue]',e.message)),
  isSimulated: () => !transporter
};
