'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');
const DIRECTORY = path.join(__dirname, '..', 'data', 'designs');
const MODEL_VERSION = 'brightal-concept-3';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function parseDesign(raw) {
  if (raw === undefined) return null;
  if (typeof raw !== 'string' || Buffer.byteLength(raw) > 20000) throw new Error('INVALID_DESIGN');
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('INVALID_DESIGN'); }
  const { normalize, OPTIONS } = await import('../public/builder/state.mjs');
  if (!parsed || parsed.version !== 3 || !parsed.design || typeof parsed.design !== 'object' || Array.isArray(parsed.design) || !OPTIONS.style.includes(parsed.design.style)) throw new Error('INVALID_DESIGN');
  const config = normalize(parsed.design);
  // Deliberately exclude client-supplied prices, approval flags and file paths.
  return {
    version: 3, modelVersion: MODEL_VERSION,
    designId: crypto.randomUUID(), name: typeof parsed.name === 'string' ? parsed.name.trim().slice(0, 60) : '',
    config, sha256: crypto.createHash('sha256').update(JSON.stringify(config)).digest('hex'),
    manufacturingStatus: 'requires_goldsmith_review',
  };
}

async function makePackage(request, files = []) {
  const { initKernel } = await import('../public/builder/kernel.mjs');
  await initKernel();
  const { buildRing } = await import('../public/builder/model.mjs');
  const { Vector3 } = await import('three');
  const snapshot = request.design;
  const { unifyLegacy } = await import('../public/builder/solidify.mjs');
  const model = unifyLegacy(buildRing(snapshot.config, null));
  const lines = ['# BRIGHTAL concept mesh; not a production solid', '# Units: millimetres; renderer coordinates / 0.8. Nominal size requires workshop reconciliation.', 'o BRIGHTAL_Ring'];
  let offset = 1, part = 0;
  const meshes = [], geometries = new Set(), materials = new Set();
  try {
    model.group.updateMatrixWorld(true);
    model.group.traverse(object => {
      if (!object.isMesh) return;
      geometries.add(object.geometry);
      for (const m of Array.isArray(object.material) ? object.material : [object.material]) materials.add(m);
      const role = object.userData.gem ? 'gemstone' : (object.userData.role || 'setting');
      lines.push(`g ${role}_${++part}`);
      const position = object.geometry.getAttribute('position');
      const index = object.geometry.index;
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < position.count; i++) {
        const p = new Vector3().fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld).divideScalar(.8);
        const values = p.toArray();
        if (!values.every(Number.isFinite)) throw new Error('INVALID_GEOMETRY');
        values.forEach((v, j) => { min[j] = Math.min(min[j], v); max[j] = Math.max(max[j], v); });
        lines.push('v ' + values.map(v => v.toFixed(6)).join(' '));
      }
      const count = index ? index.count : position.count;
      for (let i = 0; i < count; i += 3) lines.push('f ' + [0, 1, 2].map(j => offset + (index ? index.getX(i + j) : i + j)).join(' '));
      meshes.push({ part, role, vertices: position.count, triangles: count / 3, boundsMm: { min, max } });
      offset += position.count;
    });
  } finally {
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
  }
  const s = snapshot.config;
  const manifest = {
    ...snapshot, requestNumber: request.requestNumber, createdAt: request.createdAt,
    units: 'mm', nominalInnerCircumferenceMm: s.size, nominalInnerDiameterMm: s.size / Math.PI,
    nominalBandWidthMm: s.width, meshParts: meshes,
    engineering: model.engineering || null,
    limitations: model.engineering?.meshValidation.valid ? [
      "Closed, connected metal mesh validated automatically. This is not production approval.",
      "Verify actual stone scans, local minimum walls, setting clearances, alloy shrinkage and polishing allowances before manufacture.",
      "Engraving is a requested workshop operation, not subtracted from the solid.",
    ] : [
      'Concept mesh only. One named ring object contains separate overlapping mesh groups, not a watertight Boolean-unioned manufacturing solid.',
      'Nominal ring size is a requested target. Existing render geometry uses the band centreline and does not certify the inner diameter.',
      'Carat is a requested weight, not a measured stone dimension. Obtain actual stone dimensions and scans.',
      'Stone seats, undercuts, claw thickness, clearances, minimum walls, engraving, alloy shrinkage and finishing allowances require CAD preparation and goldsmith sign-off.',
      'Stack is a set of separate bands. Mixed metals and inlays require separate manufacturing operations.',
    ],
  };
  const entries = {
    'design.json': strToU8(JSON.stringify({ ...manifest, design: s }, null, 2)),
    'ring-concept.obj': strToU8(lines.join('\n') + '\n'),
    'READ-ME.txt': strToU8('BRIGHTAL – műhely-egyeztetési csomag / workshop review package\n\nNem közvetlenül gyártható CAD vagy nyomtatási fájl. / Not production CAD or a print-ready file.\n\n' + manifest.limitations.join('\n\n')),
  };
  if(model.engineering?.meshValidation.valid) {
    const {buildRing: rebuild}=await import('../public/builder/model.mjs');
    const {STLExporter}=await import('three/addons/exporters/STLExporter.js');
    const solid=unifyLegacy(rebuild(snapshot.config,null));
    const remove=[];solid.group.traverse(o=>{if(o.userData.gem)remove.push(o);});remove.forEach(o=>o.removeFromParent());
    const stl=new STLExporter().parse(solid.group,{binary:true});
    // Renderer is in 0.8 scene units per millimetre; STL must be millimetres.
    for(let i=0;i<stl.getUint32(80,true);i++)for(let k=0;k<9;k++){const off=84+i*50+12+k*4;stl.setFloat32(off,stl.getFloat32(off,true)/.8,true);}
    entries['ring-metal-mm.stl']=new Uint8Array(stl.buffer);
    solid.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});remove.forEach(o=>{o.geometry?.dispose();o.material?.dispose();});
  }
  const photos = [];
  for (const [i, file] of files.entries()) {
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[file.mimetype];
    if (!ext) continue;
    const name = `reference-${i + 1}.${ext}`;
    entries[name] = new Uint8Array(await fs.readFile(file.path)); photos.push(name);
  }
  entries['workshop.html'] = strToU8(`<!doctype html><html lang="hu"><meta charset="utf-8"><title>BRIGHTAL ${escape(request.requestNumber)}</title><style>body{font:15px system-ui;color:#351d0f;max-width:900px;margin:40px auto;padding:24px}h1{border-bottom:3px solid #ffdacf;padding-bottom:16px}table{border-collapse:collapse;width:100%}td{padding:7px;border-bottom:1px solid #ddd}img{max-width:45%;height:auto}aside{padding:16px;background:#fff1eb}code{overflow-wrap:anywhere}@media print{body{margin:0}tr,img{break-inside:avoid}}</style><h1>BRIGHTAL · Műhelylap / Workshop brief</h1><p>${escape(request.requestNumber)} · ${escape(snapshot.name || s.style)} · ${escape(request.createdAt)}</p><aside>Ötvösi ellenőrzést és gyártási CAD-előkészítést igényel. / Requires goldsmith review and production CAD preparation.</aside><p>Névleges belső kerület / nominal inner circumference: ${s.size} mm · Átmérő / diameter: ${(s.size / Math.PI).toFixed(3)} mm · Sínszélesség / band width: ${s.width} mm</p>${photos.map(p => `<img src="${p}" alt="Referencia / reference">`).join('')}<h2>Teljes konfiguráció / Complete configuration</h2><table>${Object.entries(s).map(([k,v]) => `<tr><td>${escape(k)}</td><td>${escape(v)}</td></tr>`).join('')}</table><h2>Gyártási ellenőrzés / Production review</h2><ul>${manifest.limitations.map(x => `<li>${escape(x)}</li>`).join('')}</ul><p>Ötvös / Goldsmith: __________________ Dátum / Date: ______________</p><p>Végleges CAD-verzió / Final CAD revision: __________________</p><p>Tervazonosító / Design ID: ${escape(snapshot.designId)}<br>SHA-256: <code>${snapshot.sha256}</code></p></html>`);
  return Buffer.from(zipSync(entries, { level: 3 }));
}
function archivePath(id) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('INVALID_DESIGN_ID');
  return path.join(DIRECTORY, id + '.zip');
}
async function savePackage(request, files) {
  const content = await makePackage(request, files);
  await fs.mkdir(DIRECTORY, { recursive: true, mode: 0o700 });
  await fs.writeFile(archivePath(request.id), content, { flag: 'wx', mode: 0o600 });
}
module.exports = { parseDesign, makePackage, savePackage, archivePath };
