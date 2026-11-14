// Workshop export of the exact meshes shown in the viewer, in millimetres.
// One closed metal body and every stone as its own named OBJ object; the STL
// holds the metal body only. The geometry checker re-reads these bytes.
import * as T from 'three';
import {SCENE} from './design-rules.mjs';

export function exportMeshes(model) {
  model.group.updateMatrixWorld(true);
  const lines = ['# BRIGHTAL ring mesh', '# Units: millimetres. Metal is one closed body; each stone is a separate object.'];
  const objects = [], metal = [];
  let offset = 1, stoneNumber = 0;
  const v = new T.Vector3();
  model.group.traverse(object => {
    if (!object.isMesh) return;
    const gem = !!object.userData.gem, position = object.geometry.getAttribute('position'), index = object.geometry.index;
    const name = gem ? `gemstone_${++stoneNumber}` : 'BRIGHTAL_metal';
    lines.push(`o ${name}`);
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity], points = [];
    for (let i = 0; i < position.count; i++) {
      const values = v.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld).divideScalar(SCENE).toArray();
      if (!values.every(Number.isFinite)) throw new Error('INVALID_GEOMETRY');
      values.forEach((x, j) => { min[j] = Math.min(min[j], x); max[j] = Math.max(max[j], x); });
      points.push(values);
      lines.push('v ' + values.map(x => x.toFixed(6)).join(' '));
    }
    const count = index ? index.count : position.count;
    // Single precision millimetres can merge two vertices that were one
    // rounding step apart; such a collapsed sliver is dropped (an edge
    // collapse keeps the surface closed) instead of exported as a zero-area face.
    const key = k => points[k].map(Math.fround).join(',');
    for (let i = 0; i < count; i += 3) {
      const face = [0, 1, 2].map(j => index ? index.getX(i + j) : i + j);
      if (new Set(face.map(key)).size < 3) continue;
      lines.push('f ' + face.map(k => offset + k).join(' '));
      if (!gem) metal.push(face.map(k => points[k]));
    }
    objects.push({name, kind: gem ? 'gemstone' : 'metal', role: gem ? 'gemstone' : (object.userData.role || 'setting'), vertices: position.count, triangles: count / 3, boundsMm: {min, max}});
    offset += position.count;
  });
  const stl = new DataView(new ArrayBuffer(84 + metal.length * 50));
  stl.setUint32(80, metal.length, true);
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3();
  metal.forEach((face, i) => {
    a.fromArray(face[0]); b.fromArray(face[1]); c.fromArray(face[2]);
    n.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
    const at = 84 + i * 50;
    [n, a, b, c].forEach((p, k) => p.toArray().forEach((x, j) => stl.setFloat32(at + k * 12 + j * 4, x, true)));
  });
  return {obj: lines.join('\n') + '\n', stl: new Uint8Array(stl.buffer), objects};
}
