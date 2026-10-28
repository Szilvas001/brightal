'use strict';
const cfg=require('./config');
const {specification}=require('./order-workflow');
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(n,c)=>new Intl.NumberFormat('hu-HU').format(n)+' '+c;
function render(r,kind,attachment){
 const approved=kind==='approved',hu=r.lang!=='en',o=r.finalOffer;
 const url=require('./guest-access').url(r);
 const title=hu?(approved?'Látványterv és végleges ajánlat':'Megérkezett az elképzelése'):(approved?'Your design and final offer':'We received your design request');
 const greeting=hu?(r.customer.name&&r.customer.name!=='Vásárlónk'?`Kedves ${r.customer.name}!`:'Kedves Vásárlónk!'):'Dear customer,';
 const paragraphs=hu?(approved?[
  greeting,'Örömmel küldjük az Ön elképzelései alapján elkészített egyedi Brightal látványtervet.',
  'Amennyiben a terv és az ajánlat megfelel elképzeléseinek, az alábbi gombra kattintva megtekintheti a végleges rendelési összesítőt és jóváhagyhatja a megrendelést. A szállítási adatokat is ezen az oldalon adhatja meg.',
  'A gyártás csak a végleges terv és ajánlat kifejezett jóváhagyása, a vételár beérkezése és az ötvösi ellenőrzés után kezdődhet meg.'
 ]:[greeting,
  'Köszönjük, hogy megosztotta velünk elképzelését, és a Brightal-t választotta ékszere megvalósításához. Megkeresése és bizalma megtiszteltetés számunkra.',
  'Már dolgozunk az Ön által megadott elképzelések alapján készülő egyedi látványterven. Célunk, hogy a terv a lehető legpontosabban tükrözze az Ön elképzeléseit, és megfelelő alapot adjon az ékszer elkészítéséhez.',
  r.design?'Gyűrűtervét legkésőbb 48 órán belül jóváhagyjuk, és e-mailben megküldjük Önnek a végleges ajánlatot: az ékszer végleges specifikációját, a pontos vételárat, valamint a várható elkészítési időt.':'A feltöltött kép alapján legkésőbb 48 órán belül elkészítjük és e-mailben megküldjük Önnek a személyre szabott látványtervet. A tervvel együtt megkapja az ékszer végleges specifikációját, a pontos vételárat, valamint a várható elkészítési időt is.',
  'A gyártás kizárólag azt követően kezdődhet meg, hogy Ön a látványtervet és a hozzá tartozó végleges ajánlatot kifejezetten jóváhagyta. Kérjük, egyelőre ne indítson átutalást.',
  'Amennyiben addig további kérése vagy észrevétele merül fel, kérjük, válaszoljon erre a levélre vagy keressen minket az alábbi elérhetőségeken.'
 ]):(approved?[greeting,'Your bespoke Brightal design and final offer are ready. Use the private link below to review the design, enter your delivery details and explicitly approve your order.','Production can begin only after your approval, receipt of payment and goldsmith review.']:[greeting,'Thank you for sharing your vision with Brightal.',r.design?'We will approve your design within 48 hours at the latest and email you the final offer with the specification, exact price and production schedule.':'Based on your photo, we will prepare and email your personalised visual design within 48 hours at the latest, together with the specification, exact price and production schedule.','Production requires your explicit approval of the final offer. Please do not transfer money yet.']);
 const rows=[[hu?'Rendelésazonosító':'Order number',r.requestNumber],[hu?'Ékszer típusa':'Jewellery type',r.design?.name||'Egyedi gyűrű']];
 if(approved&&o)rows.push([hu?'Ékszer vételára':'Jewellery price',money(o.productPrice,r.currency)],[hu?'Szállítási díj':'Shipping',money(o.shippingFee,r.currency)],[hu?'Fizetendő végösszeg':'Total',money(o.total,r.currency)],[hu?'Várható gyártási idő':'Production time',o.productionTime],[hu?'Várható átadás / feladás':'Delivery',o.deliveryTime],[hu?'Szállítás módja':'Delivery method',o.shippingMethod],[hu?'Ajánlat érvényessége':'Offer expires',o.validUntil]);
 const details=o?.specification||specification(r);
 const contact=[cfg.company.name||cfg.shop.name,cfg.company.address||cfg.shop.address,cfg.mail.replyTo||cfg.company.email||cfg.shop.email,cfg.company.phone||cfg.shop.phone,cfg.publicUrl].filter(Boolean);
 const table=`<table style="width:100%;border-collapse:collapse">${rows.map(([k,v])=>`<tr><th style="text-align:left;padding:10px;border-bottom:1px solid #ddd2c5">${escape(k)}</th><td style="padding:10px;border-bottom:1px solid #ddd2c5">${escape(v)}</td></tr>`).join('')}</table>`;
 const cta=hu?'LÁTVÁNYTERV JÓVÁHAGYÁSA ÉS MEGRENDELÉS':'REVIEW DESIGN AND PLACE ORDER';
 const html=`<!doctype html><html lang="${hu?'hu':'en'}"><meta charset="utf-8"><body style="background:#f8f4ed;color:#3c332d;font:15px/1.8 Arial,sans-serif"><main style="max-width:640px;margin:32px auto;background:#fcfaf7;padding:32px"><h1 style="font-family:Georgia,serif;color:#b6956a">BRIGHTAL</h1><h2>${escape(title)}</h2>${paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}${table}<h3>${hu?'Az ékszer specifikációja':'Jewellery specification'}</h3><p style="white-space:pre-wrap">${escape(details)}</p>${attachment?`<img src="cid:order-preview" alt="${approved?(hu?'Látványterv':'Visual design'):r.design?(hu?'Beküldött terv':'Submitted design'):(hu?'Beküldött referenciakép':'Submitted reference photo')}" style="max-width:100%">`:''}${approved?`<p><a href="${escape(url)}" style="display:inline-block;padding:16px;background:#3c332d;color:#f7f2ea;text-decoration:none">${cta}</a></p><p><a href="${escape(url)}">${hu?'Módosítást kérek a látványtervhez':'Request changes to this design'}</a></p>`:`<p><a href="${escape(url)}">${hu?'A beküldött elképzelés megtekintése':'View your submitted design'}</a></p>`}<p>${hu?'Ez a hivatkozás kizárólag az Ön rendeléséhez biztosít hozzáférést. Kérjük, ne ossza meg.':'This private link grants access to your order. Please do not share it.'}</p><p>${hu?'Üdvözlettel, Brightal csapata':'Kind regards, Brightal'}</p><footer>${contact.map(escape).join('<br>')}</footer></main></body></html>`;
 return {to:r.customer.email,subject:`${title} — ${r.requestNumber}`,text:[title,...paragraphs,...rows.map(x=>x.join(': ')),details,approved?cta:'',url,...contact].join('\n\n'),html,attachments:attachment?[{...attachment,cid:'order-preview',contentDisposition:'inline'}]:[]};
}
module.exports={render,escape};
