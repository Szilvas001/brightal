'use strict';
const cfg = require('./config');
const {bankDetails, specification} = require('./order-workflow');
const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (v, currency) => new Intl.NumberFormat('hu-HU').format(v) + ' ' + currency;
function render(r, kind, attachment) {
  const hu = r.lang !== 'en', accepted = kind === 'approved';
  const bank = bankDetails(r), url = cfg.publicUrl + (hu ? '/rendeleseim' : '/orders');
  const days = r.productionDays ? r.productionDays.join('–') : r.finalOffer?.productionTime;
  const title = hu ? (accepted ? 'Rendelésed jóváhagyva' : 'Megérkezett a rendelésed') : (accepted ? 'Your order is approved' : 'We received your order');
  const paragraphs = hu ? (accepted ? [
    `Kedves ${r.customer.name}! Ötvösünk visszaigazolta az elkészítési időt, rendelésedet jóváhagytuk.`,
    `Ékszered ${days} munkanapon belül készül el az átutalás beérkezésétől. A vállalt időt és a „Jóváhagyva” állapotot a Rendeléseim menüpontban is megtalálod.`,
    'A végleges összesítő ellenőrzése és elfogadása után banki átutalással rendezheted a tételt. A közleménybe a rendelésazonosítót írd.',
  ] : [
    `Kedves ${r.customer.name}! Köszönjük a rendelésedet. A rendelés már megjelent a fiókod Rendeléseim menüpontjában.`,
    '1 órán belül egy második e-mailben visszajelzünk. Az ötvösi egyeztetés az elkészítés legkorábbi időpontjának meghatározásáról szól: az ékszer elkészítését vállaljuk, most a pontos határidőt egyeztetjük.',
    'Az ötvös visszaigazolásakor rendelésed „Jóváhagyva” állapotba kerül. A második e-mailben és a Rendeléseim menüpontban megadjuk, hány munkanapon belül készül el az ékszer (például 2–5 vagy 8–11 munkanap, az átutalás beérkezésétől).',
    'A tételt jóváhagyás után, a végleges összesítőben szereplő összeggel banki átutalással rendezheted. Kérjük, az átutalással várd meg a második e-mailt.',
  ]) : (accepted ? [
    `Dear ${r.customer.name}, our goldsmith has confirmed the production schedule and your order is approved.`,
    `Your jewellery will be ready within ${days} working days after your bank transfer arrives. The schedule and Approved status are also shown under My orders.`,
    'Review and accept the final order summary, then pay by bank transfer. Use your order number as the payment reference.',
  ] : [
    `Dear ${r.customer.name}, thank you for your order. It is already listed under My orders in your account.`,
    'Within 1 hour we will send a second email. We undertake to make your jewellery; our goldsmith is confirming the earliest production schedule.',
    'Once the goldsmith confirms the schedule, your order will be marked Approved. Our second email and My orders will show the working-day range, for example 2–5 or 8–11 working days after payment arrives.',
    'Payment is by bank transfer after approval. Please wait for the second email and the final total before making a transfer.',
  ]);
  const rows = [
    [hu?'Rendelésazonosító':'Order number', r.requestNumber],
    [hu?'Ékszer':'Jewellery',r.design?.name || r.design?.config?.style || (hu?'Egyedi ékszer':'Custom jewellery')],
    [hu?'Végösszeg':'Total',r.price > 0 ? money(r.price,r.currency) : (hu?'A jóváhagyáskor kerül feltüntetésre':'Confirmed with approval')],
    ...(accepted ? [[hu?'Elkészülés':'Production time',`${days} ${hu?'munkanap az átutalás beérkezésétől':'working days after payment arrives'}`]] : []),
  ];
  const bankRows = [[hu?'Kedvezményezett':'Beneficiary',bank.beneficiary],[hu?'Bank':'Bank',bank.bank],[hu?'Számlaszám':'Account number',bank.account],[hu?'Közlemény':'Reference',bank.reference]];
  const bankNote = bank.configured ? '' : (hu?'A számlaszám kitöltés alatt áll. A végleges számlaadatok megadásáig ne indíts átutalást.':'Account details are being completed. Please wait for the final bank details before paying.');
  const detail = r.finalOffer?.specification || specification(r);
  const caption = r.design ? (hu?'A beküldött 3D terv · egyes levelezők csak az első képkockát mutatják.':'Your submitted 3D design · some email apps display only the first frame.') : (hu?'A feltöltött referenciafotód.':'Your uploaded reference photo.');
  const table = list => `<table role="presentation" style="width:100%;border-collapse:collapse">${list.map(([k,v])=>`<tr><td style="padding:10px 0;border-bottom:1px solid #e8e0d5;color:#776e60;font-size:12px;width:38%">${escape(k)}</td><td style="padding:10px 0;border-bottom:1px solid #e8e0d5;font-size:14px">${escape(v)}</td></tr>`).join('')}</table>`;
  const html = `<!doctype html><html lang="${hu?'hu':'en'}"><meta charset="utf-8"><body style="margin:0;background:#f4f0e9;color:#322d25;font-family:Arial,Helvetica,sans-serif"><div style="display:none">${escape(title)} · ${escape(r.requestNumber)}</div><table role="presentation" width="100%"><tr><td style="padding:32px 12px"><div style="max-width:600px;margin:auto;background:#fff"><div style="padding:32px;text-align:center;border-bottom:1px solid #d9c9af;font-family:Georgia,serif;font-size:30px;letter-spacing:7px;color:#987b4b">BRIGHTAL</div><div style="padding:32px"><p style="font-size:10px;letter-spacing:3px;color:#987b4b">${escape(r.requestNumber)}</p><h1 style="font:normal 32px Georgia,serif;margin:14px 0 24px">${escape(title)}</h1>${attachment?`<img src="cid:order-preview" width="536" alt="${escape(caption)}" style="display:block;width:100%;height:auto;background:#f4f0e9"><p style="font-size:11px;color:#776e60">${escape(caption)}</p>`:''}${table(rows)}${paragraphs.map(p=>`<p style="font-size:15px;line-height:1.8">${escape(p)}</p>`).join('')}<div style="padding:20px;background:#f7f4ee"><h2 style="font:normal 23px Georgia,serif">${hu?'Banki átutalás':'Bank transfer'}</h2>${table(bankRows)}${bankNote?`<p style="font-size:12px;line-height:1.6">${escape(bankNote)}</p>`:''}</div><p style="text-align:center;margin:32px 0"><a href="${escape(url)}" style="display:inline-block;background:#3e362b;color:#fff;padding:17px 28px;text-decoration:none;font-size:13px">${hu?'RENDELÉSEIM MEGNYITÁSA':'VIEW MY ORDERS'}</a></p><h2 style="font:normal 22px Georgia,serif">${hu?'A rendelés részletei':'Order details'}</h2><p style="white-space:pre-wrap;font-size:13px;line-height:1.8">${escape(detail)}</p><p style="font-size:12px"><a href="${escape(cfg.publicUrl)}/rendeles-menete">${hu?'A rendelés menete':'How ordering works'}</a> · <a href="${escape(cfg.publicUrl)}/aszf">${hu?'ÁSZF':'Terms'}</a></p></div><div style="padding:24px 32px;background:#eee7dc;font-size:11px;line-height:1.8">${escape(cfg.company.name)}<br>${escape(cfg.company.address)}<br>${escape(cfg.shop.email)}</div></div></td></tr></table></body></html>`;
  return {to:r.customer.email,subject:`${title} — ${r.requestNumber}`,text:[title,...rows.map(x=>x.join(': ')),...paragraphs,detail,...bankRows.map(x=>x.join(': ')),bankNote,url].join('\n\n'),html,attachments:attachment?[{...attachment,cid:'order-preview',contentDisposition:'inline'}]:[]};
}
module.exports={render,escape};
