// Shading normals for a finished solid.
//
// A Boolean result is one welded mesh full of long, thin triangles. Averaging
// face normals by area over every triangle that shares a vertex (three.js
// computeVertexNormals) does two visible kinds of damage on polished metal:
//   - a sharp edge (claw meets shank, seat meets wall) is smeared into a dark
//     halo, because both sides share one normal;
//   - a sliver with a numerically noisy normal tilts its neighbours, which
//     shows as ridges across a surface that is geometrically smooth.
// Here every corner gets the normal of its own smoothing group: the faces
// around the vertex that are connected through edges flatter than the crease
// angle. Faces are weighted by their corner angle (independent of how the
// surface happens to be triangulated) and degenerate faces carry no weight.
import * as T from 'three';

export const CREASE_DEGREES = 38;

export function creasedNormals(geometry, creaseDegrees = CREASE_DEGREES) {
  const position = geometry.attributes.position, index = geometry.index;
  if (!index) throw new Error('creasedNormals needs an indexed geometry');
  const faces = index.count / 3, ids = index.array, P = position.array;
  const cosCrease = Math.cos(creaseDegrees * Math.PI / 180);
  const normal = new Float64Array(faces * 3), weight = new Float64Array(faces * 3), solid = new Uint8Array(faces);
  const e = [new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  for (let f = 0; f < faces; f++) {
    const v = [ids[f * 3], ids[f * 3 + 1], ids[f * 3 + 2]];
    const len = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const a = v[k] * 3, b = v[(k + 1) % 3] * 3;
      for (let j = 0; j < 3; j++) e[k][j] = P[b + j] - P[a + j];
      len[k] = Math.hypot(e[k][0], e[k][1], e[k][2]);
    }
    const nx = e[0][1] * -e[2][2] - e[0][2] * -e[2][1], ny = e[0][2] * -e[2][0] - e[0][0] * -e[2][2], nz = e[0][0] * -e[2][1] - e[0][1] * -e[2][0];
    const twiceArea = Math.hypot(nx, ny, nz), longest = Math.max(...len);
    // A face thinner than 1:2000 has no reliable normal.
    if (!(longest > 0) || twiceArea / longest < longest * 5e-4) continue;
    solid[f] = 1;
    normal[f * 3] = nx / twiceArea; normal[f * 3 + 1] = ny / twiceArea; normal[f * 3 + 2] = nz / twiceArea;
    for (let k = 0; k < 3; k++) {
      const p = e[k], q = e[(k + 2) % 3];
      const cos = -(p[0] * q[0] + p[1] * q[1] + p[2] * q[2]) / (len[k] * len[(k + 2) % 3]);
      weight[f * 3 + k] = Math.acos(Math.max(-1, Math.min(1, cos)));
    }
  }
  // Corners around each vertex.
  const count = position.count, start = new Uint32Array(count + 1);
  for (let i = 0; i < ids.length; i++) start[ids[i] + 1]++;
  for (let i = 0; i < count; i++) start[i + 1] += start[i];
  const fill = start.slice(0, count), corners = new Uint32Array(ids.length);
  for (let i = 0; i < ids.length; i++) corners[fill[ids[i]]++] = i;
  const outPosition = [], outNormal = [], outIndex = new Uint32Array(ids.length), source = [];
  const parent = [], root = x => { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; };
  for (let v = 0; v < count; v++) {
    const from = start[v], n = start[v + 1] - from;
    if (!n) continue;
    for (let i = 0; i < n; i++) parent[i] = i;
    // Two faces at this vertex are neighbours when they share an edge through it.
    const byOther = new Map();
    for (let i = 0; i < n; i++) {
      const c = corners[from + i], f = (c / 3) | 0, k = c % 3;
      for (const other of [ids[f * 3 + (k + 1) % 3], ids[f * 3 + (k + 2) % 3]]) {
        const j = byOther.get(other);
        if (j === undefined) { byOther.set(other, i); continue; }
        const g = (corners[from + j] / 3) | 0;
        const dot = normal[f * 3] * normal[g * 3] + normal[f * 3 + 1] * normal[g * 3 + 1] + normal[f * 3 + 2] * normal[g * 3 + 2];
        if (!solid[f] || !solid[g] || dot >= cosCrease) parent[root(i)] = root(j);
      }
    }
    const groups = new Map();
    for (let i = 0; i < n; i++) {
      const r = root(i), c = corners[from + i], f = (c / 3) | 0, w = weight[c];
      let g = groups.get(r);
      if (!g) groups.set(r, g = {n: [0, 0, 0], corners: []});
      g.n[0] += normal[f * 3] * w; g.n[1] += normal[f * 3 + 1] * w; g.n[2] += normal[f * 3 + 2] * w;
      g.corners.push(c);
    }
    for (const g of groups.values()) {
      let l = Math.hypot(...g.n);
      if (!(l > 1e-12)) {
        // Only degenerate faces in this group: borrow the vertex's overall direction.
        g.n = [0, 0, 0];
        for (let i = 0; i < n; i++) { const c = corners[from + i], f = (c / 3) | 0; for (let j = 0; j < 3; j++) g.n[j] += normal[f * 3 + j] * weight[c]; }
        l = Math.hypot(...g.n) || 1;
      }
      const id = outPosition.length / 3;
      outPosition.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]);
      outNormal.push(g.n[0] / l, g.n[1] / l, g.n[2] / l);
      source.push(v);
      for (const c of g.corners) outIndex[c] = id;
    }
  }
  const result = new T.BufferGeometry();
  result.setAttribute('position', new T.Float32BufferAttribute(outPosition, 3));
  result.setAttribute('normal', new T.Float32BufferAttribute(outNormal, 3));
  result.setIndex(new T.BufferAttribute(outIndex, 1));
  result.userData.sourceVertex = source;
  return result;
}
