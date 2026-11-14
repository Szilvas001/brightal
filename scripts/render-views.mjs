// Deterministic software renderer (z-buffer) of the real generated meshes.
// Used for audit evidence: four fixed views per design and before/after pairs.
// No GPU or browser is involved, so what is drawn is exactly the mesh data.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import * as T from 'three';

export const VIEWS = {
  front: [0, 6, 40],   // looking along the finger axis
  back: [0, 6, -40],
  left: [-40, 6, 0],   // side: across the band
  right: [40, 6, 0],
  top: [0, 46, 0.01],
  iso: [22, 19, 31],
};

export function renderModel(model, view = 'iso', {width = 640, height = 560, zoom = 1, target} = {}) {
  model.group.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(model.group), centre = target || box.getCenter(new T.Vector3());
  const span = box.getSize(new T.Vector3()).length();
  const direction = new T.Vector3(...VIEWS[view]).normalize();
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, .1, 500);
  camera.position.copy(centre).addScaledVector(direction, 100);
  camera.up.set(0, view === 'top' ? 0 : 1, view === 'top' ? -1 : 0);
  camera.lookAt(centre); camera.updateMatrixWorld();
  const pixelsPerUnit = Math.min(width, height) * .92 / span * zoom;
  const colour = new Uint8ClampedArray(width * height * 3).fill(250), depth = new Float32Array(width * height).fill(Infinity);
  const keyLight = new T.Vector3(-.45, .8, .6).normalize(), fill = new T.Vector3(.7, .2, .5).normalize();
  const view4 = camera.matrixWorldInverse, a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3();
  model.group.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry, p = g.attributes.position, idx = g.index, count = idx ? idx.count : p.count;
    const m = new T.Matrix4().multiplyMatrices(view4, o.matrixWorld);
    const gem = !!o.userData.gem;
    const base = gem ? new T.Color(o.userData.hero === false ? '#9fd0ea' : '#7fbfe6') : (o.material?.color?.clone() || new T.Color('#e8c887'));
    if (!gem && o.material?.vertexColors) base.set('#e8c887');
    for (let i = 0; i < count; i += 3) {
      a.fromBufferAttribute(p, idx ? idx.getX(i) : i).applyMatrix4(m);
      b.fromBufferAttribute(p, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(m);
      c.fromBufferAttribute(p, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(m);
      n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
      if (n.lengthSq() < 1e-18) continue;
      n.normalize(); if (n.z < 0) n.negate(); // view-space; shade both sides
      const worldNormal = n.clone().transformDirection(camera.matrixWorld);
      const lit = gem ? .62 + .38 * Math.abs(worldNormal.dot(keyLight))
        : .2 + .62 * Math.max(0, worldNormal.dot(keyLight)) + .22 * Math.max(0, worldNormal.dot(fill)) + .12 * n.z;
      const r = base.r * lit * 255, gg = base.g * lit * 255, bb = base.b * lit * 255;
      const X = v => width / 2 + v.x * pixelsPerUnit, Y = v => height / 2 - v.y * pixelsPerUnit;
      const x0 = X(a), y0 = Y(a), x1 = X(b), y1 = Y(b), x2 = X(c), y2 = Y(c);
      const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      if (Math.abs(area) < 1e-9) continue;
      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxX = Math.min(width - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxY = Math.min(height - 1, Math.ceil(Math.max(y0, y1, y2)));
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const px = x + .5, py = y + .5;
        const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) / area;
        const w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = -(w0 * a.z + w1 * b.z + w2 * c.z), k = y * width + x;
        if (z >= depth[k]) continue;
        depth[k] = z; colour[k * 3] = r; colour[k * 3 + 1] = gg; colour[k * 3 + 2] = bb;
      }
    }
  });
  return sharp(Buffer.from(colour.buffer), {raw: {width, height, channels: 3}});
}

export async function renderSheet(model, file, views = ['front', 'back', 'left', 'right'], options = {}) {
  const width = options.width || 420, height = options.height || 380;
  const tiles = await Promise.all(views.map(v => renderModel(model, v, {...options, width, height}).png().toBuffer()));
  fs.mkdirSync(path.dirname(file), {recursive: true});
  await sharp({create: {width: width * views.length, height, channels: 3, background: '#fafafa'}})
    .composite(tiles.map((input, i) => ({input, left: i * width, top: 0}))).png().toFile(file);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const {initKernel} = await import('../public/builder/kernel.mjs');
  const {buildFinishedRing} = await import('../public/builder/finished-model.mjs');
  const {buildRing} = await import('../public/builder/model.mjs');
  const {PRESETS} = await import('../public/builder/catalog.mjs');
  const {normalize} = await import('../public/builder/state.mjs');
  await initKernel();
  const arg = name => { const i = process.argv.indexOf('--' + name); return i < 0 ? undefined : process.argv[i + 1]; };
  const out = arg('out') || 'docs/audits/views', raw = process.argv.includes('--raw');
  const views = (arg('views') || 'front,back,left,right').split(',');
  const jobs = arg('config') ? [{name: arg('name') || 'custom', config: normalize(JSON.parse(arg('config')))}]
    : PRESETS.filter(p => !arg('style') || p.config.style === arg('style')).map(p => ({name: p.config.style, config: p.config}));
  for (const {name, config} of jobs) {
    const model = raw ? buildRing(config, null) : buildFinishedRing(config);
    await renderSheet(model, path.join(out, name + '.png'), views, {zoom: Number(arg('zoom') || 1)});
    model.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    console.log(name, model.engineering?.assemblyValidation?.valid ?? '');
  }
}
