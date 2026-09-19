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

async function send(to, subject, text, html) {
  if (!transporter) { logToOutbox(to, subject, text); return { simulated: true }; }
  try {
    await transporter.sendMail({ from: cfg.mail.from, to, subject, text, html: html || undefined });
    console.log(`[mail] ✔ elküldve: ${to} — ${subject}`);
    return { simulated: false };
  } catch (e) {
    console.error(`[mail] ✖ küldés sikertelen (${to}):`, e.message);
    logToOutbox(to, subject, text);
    return { simulated: true, error: e.message };
  }
}

const money = v => new Intl.NumberFormat('hu-HU').format(v) + ' ' + cfg.currency.symbol;

/* ══════════════════════════════════════════════════════════════════
   KONKRÉT ÉRTESÍTÉSEK
   ══════════════════════════════════════════════════════════════════ */

/** 1) Kérés beérkezett — a vőlegénynek */
function requestReceived(req_, lang = 'hu') {
  const hu = lang === 'hu';
  const subject = hu
    ? `Megkaptuk a képet — ${req_.requestNumber}`
    : `We received your photo — ${req_.requestNumber}`;
  const url = `${cfg.publicUrl}/orders`;
  const text = hu
    ? `Kedves ${req_.customer.name}!\n\nMegkaptuk a feltöltött gyűrűképet. Azonosító: ${req_.requestNumber}\n\n`
    + `Ötvösünk kb. ${cfg.shop.reviewHours} órán belül átnézi, és egyedi árajánlatot készít.\n`
    + `Amint kész, a fiókodban a "Rendeléseim" menüpontban megjelenik az ár, és ott tudsz fizetni.\n\n${url}\n\nÜdvözlettel,\n${cfg.shop.name}`
    : `Dear ${req_.customer.name},\n\nWe have received your ring photo. Reference: ${req_.requestNumber}\n\n`
    + `Our goldsmith will review it within approximately ${cfg.shop.reviewHours} hour(s) and prepare a personal quote.\n`
    + `Once ready, the price will appear under "My orders" in your account, where you can pay.\n\n${url}\n\nWarm regards,\n${cfg.shop.name}`;
  const html = wrap(hu ? 'Megkaptuk a képet' : 'We received your photo', `
    <p style="color:#4A2C1F;line-height:1.75;font-size:15px">${hu ? 'Kedves' : 'Dear'} ${req_.customer.name},</p>
    <p style="color:#4A2C1F;line-height:1.75;font-size:15px">${hu
      ? `Megkaptuk a feltöltött gyűrűképet. Ötvösünk kb. <strong>${cfg.shop.reviewHours} órán belül</strong> átnézi, és egyedi árajánlatot készít.`
      : `We have received your ring photo. Our goldsmith will review it within approximately <strong>${cfg.shop.reviewHours} hour(s)</strong> and prepare a personal quote.`}</p>
    <div style="background:#FDF2EC;border-radius:8px;padding:14px 18px;margin:20px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#3B2119">
      ${hu ? 'Azonosító' : 'Reference'}: <strong>${req_.requestNumber}</strong>
    </div>
    <a href="${url}" style="display:inline-block;background:#3B2119;color:#E3B79F;padding:13px 28px;border-radius:6px;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:2px">
      ${hu ? 'RENDELÉSEIM' : 'MY ORDERS'}</a>`);
  return send(req_.customer.email, subject, text, html);
}

/** 2) Árajánlat elkészült / jóváhagyva — a vőlegénynek */
function requestApproved(req_, lang = 'hu') {
  const hu = lang === 'hu';
  const subject = hu
    ? `Elkészült az árajánlat — ${req_.requestNumber}`
    : `Your quote is ready — ${req_.requestNumber}`;
  const url = `${cfg.publicUrl}/orders`;
  const text = hu
    ? `Kedves ${req_.customer.name}!\n\nÖtvösünk elfogadta a kérésed, és elkészítette az árajánlatot.\n\n`
    + `Azonosító: ${req_.requestNumber}\nÁr: ${money(req_.price)}\n\n`
    + (req_.adminNote ? `Megjegyzés: ${req_.adminNote}\n\n` : '')
    + `A fizetéshez lépj be a fiókodba:\n${url}\n\nA gyártás a fizetés beérkezése után ${cfg.shop.productionDaysMin}–${cfg.shop.productionDaysMax} munkanap.\n\nÜdvözlettel,\n${cfg.shop.name}`
    : `Dear ${req_.customer.name},\n\nOur goldsmith has approved your request and prepared a quote.\n\n`
    + `Reference: ${req_.requestNumber}\nPrice: ${money(req_.price)}\n\n`
    + (req_.adminNote ? `Note: ${req_.adminNote}\n\n` : '')
    + `Sign in to pay:\n${url}\n\nProduction takes ${cfg.shop.productionDaysMin}–${cfg.shop.productionDaysMax} working days after payment.\n\nWarm regards,\n${cfg.shop.name}`;
  const html = wrap(hu ? 'Elkészült az árajánlat' : 'Your quote is ready', `
    <p style="color:#4A2C1F;line-height:1.75;font-size:15px">${hu ? 'Kedves' : 'Dear'} ${req_.customer.name},</p>
    <p style="color:#4A2C1F;line-height:1.75;font-size:15px">${hu
      ? 'Ötvösünk elfogadta a kérésed, és elkészítette az egyedi árajánlatot.'
      : 'Our goldsmith has approved your request and prepared a personal quote.'}</p>
    <div style="background:#FDF2EC;border-radius:8px;padding:18px;margin:20px 0;font-family:Helvetica,Arial,sans-serif;color:#3B2119">
      <div style="font-size:12px;color:#AA8B7B">${hu ? 'Azonosító' : 'Reference'}: ${req_.requestNumber}</div>
      <div style="font-size:28px;margin-top:8px">${money(req_.price)}</div>
    </div>
    ${req_.adminNote ? `<p style="color:#4A2C1F;line-height:1.7;font-size:14px;font-style:italic">"${req_.adminNote}"</p>` : ''}
    <a href="${url}" style="display:inline-block;background:#E3B79F;color:#3B2119;padding:13px 28px;border-radius:6px;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:2px">
      ${hu ? 'FIZETÉS' : 'PAY NOW'}</a>`);
  return send(req_.customer.email, subject, text, html);
}

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

/** 4) Fizetés beérkezett */
function paymentReceived(req_, lang = 'hu') {
  const hu = lang === 'hu';
  const subject = hu ? `Fizetés megérkezett — ${req_.requestNumber}` : `Payment received — ${req_.requestNumber}`;
  const text = hu
    ? `Kedves ${req_.customer.name}!\n\nA fizetés megérkezett. Köszönjük!\n\nAzonosító: ${req_.requestNumber}\nÖsszeg: ${money(req_.price)}\n\n`
    + `A gyártás elkezdődött, ${cfg.shop.productionDaysMin}–${cfg.shop.productionDaysMax} munkanapot vesz igénybe.\n\nÜdvözlettel,\n${cfg.shop.name}`
    : `Dear ${req_.customer.name},\n\nYour payment has been received. Thank you!\n\nReference: ${req_.requestNumber}\nAmount: ${money(req_.price)}\n\n`
    + `Production has started and takes ${cfg.shop.productionDaysMin}–${cfg.shop.productionDaysMax} working days.\n\nWarm regards,\n${cfg.shop.name}`;
  return send(req_.customer.email, subject, text, wrap(hu ? 'Fizetés megérkezett' : 'Payment received', `
    <p style="color:#4A2C1F;line-height:1.75;font-size:15px">${hu ? 'A fizetés megérkezett. Köszönjük!' : 'Your payment has been received. Thank you!'}</p>
    <div style="background:#FDF2EC;border-radius:8px;padding:18px;margin:20px 0;font-family:Helvetica,Arial,sans-serif">
      <div style="font-size:12px;color:#AA8B7B">${req_.requestNumber}</div>
      <div style="font-size:26px;color:#3B2119;margin-top:6px">${money(req_.price)}</div>
    </div>
    <p style="color:#4A2C1F;line-height:1.75;font-size:15px">${hu
      ? `A gyártás elkezdődött, <strong>${cfg.shop.productionDaysMin}–${cfg.shop.productionDaysMax} munkanapot</strong> vesz igénybe.`
      : `Production has started and takes <strong>${cfg.shop.productionDaysMin}–${cfg.shop.productionDaysMax} working days</strong>.`}</p>`));
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
    wrap('Új kérés érkezett', `<pre style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#4A2C1F;white-space:pre-wrap">${text}</pre>`));
}

module.exports = {
  send, requestReceived, requestApproved, requestRejected, paymentReceived, adminNewRequest,
  isSimulated: () => !transporter
};
