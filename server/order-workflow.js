'use strict';
const cfg = require('./config');

function productionRange(value) {
  const match = String(value || '').trim().match(/^(\d{1,3})\s*[-–]\s*(\d{1,3})(?:\s*munkanap)?$/);
  if (!match || Number(match[1]) < 1 || Number(match[2]) < Number(match[1]) || Number(match[2]) > 365) throw Error('INVALID_PRODUCTION_RANGE');
  return [Number(match[1]), Number(match[2])];
}
function bankDetails(request) {
  return {
    beneficiary: cfg.company.name,
    bank: cfg.company.bankName || 'OTP Bank Nyrt.',
    account: cfg.company.bankAccount || '[]',
    reference: request.requestNumber,
    amount: request.price,
    currency: request.currency,
    configured: !!cfg.company.bankAccount && !/[\[\]<>]/.test(cfg.company.bankAccount),
  };
}
function specification(r) {
  const d=r.design?.config;
  const metal={yellow14:'14 karátos sárgaarany',yellow18:'18 karátos sárgaarany',white14:'14 karátos fehérarany',white18:'18 karátos fehérarany',rose14:'14 karátos rozéarany',rose18:'18 karátos rozéarany',platinum:'Platina'};
  if(d)return [r.design.name || d.style, `Anyag: ${metal[d.metal]||d.metal}`, `Gyűrűméret: ${d.size} mm`, `Sínszélesség: ${d.width} mm`, `Kő: ${d.shape} · ${d.carat} ct · ${d.color}/${d.clarity}`, `Gravírozás: ${d.engraving||'nincs'}`, r.note].filter(Boolean).join('\n');
  const labels={metal:'Anyag',ringSize:'Gyűrűméret',budget:'Keretösszeg',deadline:'Kért határidő',engraving:'Gravírozás'};
  return [r.note, ...Object.entries(r.details || {}).filter(([,v]) => v).map(([k,v]) => `${labels[k]||k}: ${v}`)].filter(Boolean).join('\n') || 'Egyedi ékszer a feltöltött referencia alapján';
}
function approvalOffer(r, body, days) {
  return {
    specification: specification(r), previewUrl: r.images[0]?.url || '',
    shippingFee: 0, deliveryTime: 'Az elkészülést követően egyeztetett átadás / feladás.',
    shippingMethod: 'Egyeztetett átadás', validUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
    ...body.finalOffer,
    productionTime: `${days[0]}–${days[1]} munkanap az átutalás beérkezésétől`,
    paymentTerms: 'Banki átutalás, a teljes végösszeg előre történő megfizetésével. Közlemény: ' + r.requestNumber,
  };
}
module.exports = { productionRange, bankDetails, specification, approvalOffer };
