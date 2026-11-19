// Workshop export of the exact meshes shown in the viewer, in millimetres.
// One closed metal body and every stone as its own named OBJ object; the STL
// holds the metal body only (a second STL the stones). The geometry checker
// re-reads these bytes.
//
// The viewer's copy of a mesh splits vertices where its shading creases (and
// a two-tone body is drawn as separate triangles). A CAD program reads shared
// vertices as connectivity, so every object is written with its vertices
// welded again: one vertex per position, the closed skin intact.
import * as T from 'three';
import {SCENE} from './design-rules.mjs';

export function exportMeshes(model) {
  model.group.updateMatrixWorld(true);
  const lines = ['# BRIGHTAL ring mesh', '# Units: millimetres. Metal is one closed body; each stone is a separate object.'];
  const objects = [], metal = [], stones = [];
  let offset = 1, stoneNumber = 0;
  const v = new T.Vector3();
  model.group.traverse(object => {
    if (!object.isMesh) return;
    const gem = !!object.userData.gem, position = object.geometry.getAttribute('position'), index = object.geometry.index;
    const name = gem ? `gemstone_${++stoneNumber}` : 'BRIGHTAL_metal';
    lines.push(`o ${name}`);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity], points = [], welded = new Map(), slot = [];
    for (let i = 0; i < position.count; i++) {
      // On a grid of 1/1000 µm: CAD programs and slicers join vertices closer
      // than about that, so the file holds no two vertices they would join
      // (numerical noise such as 4e-17 beside 0 on the mirror plane).
      const values = v.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld).divideScalar(SCENE).toArray().map(x => Math.round(x * 1e6) / 1e6 + 0);
      if (!values.every(Number.isFinite)) throw new Error('INVALID_GEOMETRY');
      // (Only exact copies of one vertex are joined; two distinct vertices a
      // hair apart stay distinct, as the solid has them.)
      const exact = values.join(' ');
      let k = welded.get(exact);
      if (k === undefined) {
        k = points.length; welded.set(exact, k);
        values.forEach((x, j) => { min[j] = Math.min(min[j], x); max[j] = Math.max(max[j], x); });
        points.push(values);
        lines.push('v ' + values.map(x => x.toFixed(6)).join(' '));
      }
      slot.push(k);
    }
    const count = index ? index.count : position.count;
    // Single precision millimetres can merge two vertices that were one
    // rounding step apart; such a collapsed sliver is dropped (an edge
    // collapse keeps the surface closed) instead of exported as a zero-area face.
    const key = k => points[k].map(Math.fround).join(',');
    const faces = [];
    for (let i = 0; i < count; i += 3) {
      const face = [0, 1, 2].map(j => slot[index ? index.getX(i + j) : i + j]);
      if (new Set(face.map(key)).size < 3) continue;
      faces.push(face);
    }
    // Two triangles that rounding has laid exactly onto each other, facing
    // opposite ways, are a fold of zero thickness (where two surfaces grazed):
    // both go, and the skin closes over them.
    const turned = face => { const k = face.map(key), i = k.indexOf([...k].sort()[0]); return [k[i], k[(i + 1) % 3], k[(i + 2) % 3]].join('|'); };
    const seen = new Map();
    faces.forEach((face, i) => { const t = turned(face); seen.set(t, [...(seen.get(t) || []), i]); });
    const folded = new Set();
    faces.forEach((face, i) => {
      const back = turned([face[0], face[2], face[1]]), twins = seen.get(back);
      if (twins?.length && !folded.has(i)) { const j = twins.find(x => !folded.has(x) && x !== i); if (j !== undefined) { folded.add(i); folded.add(j); } }
    });
    let triangles = 0;
    faces.forEach((face, i) => {
      if (folded.has(i)) return;
      lines.push('f ' + face.map(k => offset + k).join(' '));
      (gem ? stones : metal).push(face.map(k => points[k]));
      triangles++;
    });
    objects.push({name, kind: gem ? 'gemstone' : 'metal', role: gem ? 'gemstone' : (object.userData.role || 'setting'), vertices: points.length, triangles, boundsMm: {min, max}});
    offset += points.length;
  });
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3();
  const binaryStl = (faces, title) => {
    const stl = new DataView(new ArrayBuffer(84 + faces.length * 50));
    [...title.slice(0, 80)].forEach((ch, i) => stl.setUint8(i, ch.charCodeAt(0) & 127));
    stl.setUint32(80, faces.length, true);
    faces.forEach((face, i) => {
      a.fromArray(face[0]); b.fromArray(face[1]); c.fromArray(face[2]);
      n.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
      const at = 84 + i * 50;
      [n, a, b, c].forEach((p, k) => p.toArray().forEach((x, j) => stl.setFloat32(at + k * 12 + j * 4, x, true)));
    });
    return new Uint8Array(stl.buffer);
  };
  return {obj: lines.join('\n') + '\n', stl: binaryStl(metal, 'BRIGHTAL metal, millimetres'), stonesStl: binaryStl(stones, 'BRIGHTAL gemstones, millimetres'), objects};
}
