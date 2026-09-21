const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { unzipSync, strFromU8 } = require('fflate');
const D = require('../server/designs');
const R = require('../server/requests');
const payload = (design = {}) => JSON.stringify({ version: 3, name: 'Saját gyűrű <script>', design: { style: 'ribbon', ...design } });

test('server validates envelopes and discards untrusted manufacturing claims', async () => {
  assert.equal(await D.parseDesign(undefined), null);
  for (const raw of ['', 'null', '[]', '{}', payload({style:'bad'}), 'x'.repeat(20001), JSON.stringify({version:2,design:{style:'band'}})])
    await assert.rejects(D.parseDesign(raw), /INVALID_DESIGN/);
  const d = await D.parseDesign(payload({ size: 999, manufacturingStatus: 'approved', price: 1, engraving: 'Ő & Á' }));
  assert.equal(d.config.size, 72);
  assert.equal(d.config.engraving, 'Ő & Á');
  assert.equal(d.config.price, undefined);
  assert.equal(d.manufacturingStatus, 'requires_goldsmith_review');
  assert.equal(d.sha256.length, 64);
});

test('ZIP has a single logical object, valid indices, complete config and escaped printable brief', async () => {
  const design = await D.parseDesign(payload());
  const r = R.build({user:{id:'u',name:'Test',email:'test@example.com'},body:{ringSize:'99',metal:'wrong'},files:[],lang:'hu',design});
  const zip = unzipSync(await D.makePackage(r));
  const manifest = JSON.parse(strFromU8(zip['design.json']));
  assert.deepEqual(manifest.design, design.config);
  assert.equal(manifest.nominalInnerDiameterMm, design.config.size / Math.PI);
  assert.equal(r.details.ringSize, String(design.config.size));
  assert.equal(r.details.metal, design.config.metal);
  const obj = strFromU8(zip['ring-concept.obj']).split('\n');
  assert.equal(obj.filter(l=>l.startsWith('o ')).length, 1);
  const vertices = obj.filter(l=>l.startsWith('v '));
  assert.ok(vertices.length > 1000);
  for (const v of vertices) assert.ok(v.slice(2).split(' ').every(n=>Number.isFinite(Number(n))));
  for (const face of obj.filter(l=>l.startsWith('f '))) assert.ok(face.slice(2).split(' ').every(n=>Number(n)>=1 && Number(n)<=vertices.length));
  const brief = strFromU8(zip['workshop.html']);
  assert.ok(brief.includes('&lt;script&gt;'));
  assert.ok(!brief.includes('<script>'));
  assert.equal(R.toPublic(r).source, 'designer');
  assert.equal(R.toPublic({...r,status:'paid'}).design.sha256, design.sha256);
});

test('new daily families have distinct geometry and normalize every preset', async () => {
  const {normalize,PRESETS,DAILY_STYLES,OPTIONS}=await import('../public/builder/state.mjs');
  const {buildRing}=await import('../public/builder/model.mjs');
  assert.equal(OPTIONS.style.length,24);
  const signatures = new Set();
  for(const style of DAILY_STYLES) {
    const config=normalize({style,shape:'emerald',sideShape:'round',dailyCount:5,dailyCarat:.1});
    const model=buildRing(config,null);
    assert.equal(model.gems.length, config.dailyCount);
    const signature=model.gems.map(g=>[...g.matrixWorld.elements].map(x=>x.toFixed(4)).join(',')).join('|');
    signatures.add(signature);
    const geo=new Set(),mat=new Set();model.group.traverse(o=>{if(o.isMesh){geo.add(o.geometry);mat.add(o.material)}});geo.forEach(g=>g.dispose());mat.forEach(m=>m.dispose());
  }
  // Alternating cuts changes geometry, while placement matches the straight row.
  assert.ok(signatures.size>=7);
  for(const p of PRESETS) assert.ok(OPTIONS.style.includes(normalize(p.config).style));
});

test('submission, admin-only immutable download, source filter and malformed upload cleanup', async t => {
  const express = require('express');
  const cfg = require('../server/config');
  const db = require('../server/db');
  const mailer = require('../server/mailer');
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(),'brightal-design-test-'));
  cfg.upload.dir = tmp;
  const rows=[];
  db.requests.insert=async r=>{rows.push(r);return r};
  db.requests.all=()=>rows.slice();
  db.requests.find=fn=>rows.find(fn);
  db.requests.filter=fn=>rows.filter(fn);
  mailer.requestReceived=mailer.adminNewRequest=async()=>{};
  const app=express();app.use(express.json());
  app.use((req,res,next)=>{const role=req.headers['x-test-role'];req.user=role?{id:'u',role,name:'Test User',email:'test@example.com'}:null;next()});
  app.use('/api',require('../server/routes/requests'));
  app.use('/api/admin',require('../server/routes/admin'));
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.rm(tmp,{recursive:true,force:true});for(const r of rows)if(r.design)await fs.rm(D.archivePath(r.id),{force:true});});
  const submit=async raw=>{
    const form=new FormData();form.append('name','Test User');form.append('acceptTerms','true');
    form.append('photos',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'ring.png');
    if(raw!==undefined)form.append('ringDesign',raw);
    return fetch(url+'/api/requests',{method:'POST',headers:{'x-test-role':'user'},body:form});
  };
  assert.equal((await submit('bad json')).status,400);
  assert.deepEqual(await fs.readdir(tmp),[]);
  const response=await submit(payload());assert.equal(response.status,200);
  const record=(await response.json()).request;
  const endpoint=url+`/api/admin/requests/${record.requestNumber}/design.zip`;
  assert.equal((await fetch(endpoint)).status,403);
  assert.equal((await fetch(endpoint,{headers:{'x-test-role':'user'}})).status,403);
  const download=await fetch(endpoint,{headers:{'x-test-role':'admin'}});assert.equal(download.status,200);
  const first=Buffer.from(await download.arrayBuffer());
  assert.ok(unzipSync(first)['reference-1.png']);
  rows[0].status='paid';
  const second=Buffer.from(await (await fetch(endpoint,{headers:{'x-test-role':'admin'}})).arrayBuffer());assert.deepEqual(second,first);
  assert.equal((await submit(undefined)).status,200);
  const filtered=await (await fetch(url+'/api/admin/requests?source=designer',{headers:{'x-test-role':'admin'}})).json();
  assert.equal(filtered.requests.length,1);assert.equal(filtered.requests[0].status,'paid');
  const csv=await (await fetch(url+'/api/admin/export.csv?source=designer',{headers:{'x-test-role':'admin'}})).text();
  assert.ok(csv.includes(record.requestNumber));assert.ok(!csv.includes(rows[1].requestNumber));
});
