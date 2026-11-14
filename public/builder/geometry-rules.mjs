// Automatic geometry checker for rules A–F of the ring-builder specification.
// It works on the generated triangle meshes and exact Boolean solids, never on
// screenshots. `inspectDesign(config)` builds the ring once and returns every
// violated rule; an empty list is the acceptance condition used by the tests.
import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {getKernel} from './kernel.mjs';
import {buildRing} from './model.mjs';
import {unifyLegacy} from './solidify.mjs';
import {auditAssembly} from './assembly-audit.mjs';
import {validateMesh} from './validation.mjs';
import {gemGeometry, outline} from './optics.mjs';
import {modernLayout, MODERN_STYLES} from './contemporary.mjs';
import {normalize} from './state.mjs';
import {LIMITS, SCENE, expectedSymmetry, shapeSymmetry} from './design-rules.mjs';
import {exportMeshes} from './export-mesh.mjs';

const MM3 = SCENE ** 3;

function meshSolid(object, own) {
  const {Manifold, Mesh} = getKernel();
  let geo = object.geometry.clone();
  geo.applyMatrix4(object.matrixWorld);
  for (const key of Object.keys(geo.attributes)) if (key !== 'position') geo.deleteAttribute(key);
  const welded = mergeVertices(geo, 1e-5); geo.dispose(); geo = welded;
  const positions = Array.from(geo.attributes.position.array), indices = Array.from(geo.index.array), edge = new Map();
  for (let i = 0; i < indices.length; i += 3) for (let j = 0; j < 3; j++) {
    const a = indices[i + j], b = indices[i + (j + 1) % 3], key = a < b ? a + ':' + b : b + ':' + a;
    if (edge.has(key)) edge.delete(key); else edge.set(key, [a, b]);
  }
  const boundary = [...edge.values()];
  while (boundary.length) {
    const [a, b] = boundary.pop(), loop = [a, b]; let last = b;
    while (last !== a) {
      const at = boundary.findIndex(e => e[0] === last);
      if (at < 0) throw new Error('open element mesh');
      const next = boundary.splice(at, 1)[0][1]; loop.push(next); last = next;
    }
    loop.pop();
    const centre = positions.length / 3, mean = [0, 0, 0];
    for (const v of loop) for (let j = 0; j < 3; j++) mean[j] += positions[v * 3 + j] / loop.length;
    positions.push(...mean);
    for (let j = 0; j < loop.length; j++) indices.push(loop[(j + 1) % loop.length], loop[j], centre);
  }
  geo.dispose();
  const mesh = new Mesh({numProp: 3, vertProperties: new Float32Array(positions), triVerts: new Uint32Array(indices)});
  mesh.merge();
  const solid = own(new Manifold(mesh));
  if (solid.status() !== 'NoError') throw new Error('element is not a closed solid: ' + solid.status());
  return solid;
}
const volume = solid => solid.volume();
const boxOf = solid => { const b = solid.boundingBox(); return new T.Box3(new T.Vector3(...b.min), new T.Vector3(...b.max)); };

function stoneInfo(gem, own) {
  const {Manifold} = getKernel();
  const p = gem.geometry.attributes.position, vertices = [];
  for (let i = 0; i < p.count; i++) vertices.push(new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(gem.matrixWorld));
  const solid = own(Manifold.hull(vertices.map(v => v.toArray())));
  const centre = new T.Vector3().setFromMatrixPosition(gem.matrixWorld);
  const scale = new T.Vector3().setFromMatrixScale(gem.matrixWorld);
  const shape = gem.userData.shape || 'round';
  // Girdle half-extents in scene units (the cut is modelled with radius 1).
  const extent = Array.from({length: 64}, (_, i) => outline(shape, i / 64 * Math.PI * 2));
  const halfX = Math.max(...extent.map(e => Math.abs(e[0]))) * scale.x, halfZ = Math.max(...extent.map(e => Math.abs(e[1]))) * scale.z;
  return {gem, solid, vertices, centre, scale, shape, inverse: gem.matrixWorld.clone().invert(), box: boxOf(solid),
    planes: gemGeometry(shape).planes, diameterMm: 2 * Math.min(halfX, halfZ) / SCENE, uniform: Math.abs(scale.x - scale.y) < 1e-6 && Math.abs(scale.x - scale.z) < 1e-6};
}
// Signed distance lower bound from a point to the convex cut, in scene units.
function stoneDistance(stone, world) {
  const local = world.clone().applyMatrix4(stone.inverse);
  let d = -Infinity;
  for (const plane of stone.planes) d = Math.max(d, plane.x * local.x + plane.y * local.y + plane.z * local.z - plane.w);
  return d * stone.scale.x;
}
function inOutline(shape, x, z) {
  // Point-in-polygon against the cut's girdle outline (unit stone space).
  let inside = false; const n = 128;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = outline(shape, i / n * Math.PI * 2), b = outline(shape, j / n * Math.PI * 2);
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
const rodWorld = o => o.userData.rod.points.map(p => p.clone().applyMatrix4(o.parent.matrixWorld));
function measuredRodRadius(object, path, tipOnly = false) {
  // Largest distance from any mesh vertex to the rod's centre line; for a
  // tapered rod, measured at its thin end (the last segment) only.
  const p = object.geometry.attributes.position, v = new T.Vector3(), closest = new T.Vector3(); let r = 0;
  const segments = path.slice(1).map((b, i) => new T.Line3(path[i], b));
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).applyMatrix4(object.matrixWorld);
    let d = Infinity;
    let nearest = -1;
    segments.forEach((s, k) => { s.closestPointToPoint(v, true, closest); const distance = closest.distanceTo(v); if (distance < d) { d = distance; nearest = k; } });
    if (!tipOnly || nearest === segments.length - 1) r = Math.max(r, d);
  }
  return r;
}

// Largest normalised odd volume moment about the planes x=0 and z=0, from the
// divergence theorem with a degree-5 quadrature on every triangle (exact for
// the monomials used). Zero for a mirror-symmetric closed body.
const QUADRATURE = (() => {
  const r = Math.sqrt(15), a = (6 - r) / 21, b = (6 + r) / 21, wa = (155 - r) / 1200, wb = (155 + r) / 1200;
  return [[1 / 3, 1 / 3, 1 / 3, 9 / 40], [a, a, 1 - 2 * a, wa], [a, 1 - 2 * a, a, wa], [1 - 2 * a, a, a, wa], [b, b, 1 - 2 * b, wb], [b, 1 - 2 * b, b, wb], [1 - 2 * b, b, b, wb]];
})();
const ODD = [[1, 0, 0], [1, 1, 0], [1, 0, 1], [1, 2, 0], [1, 0, 2], [1, 1, 1], [3, 0, 0], [1, 3, 0], [3, 1, 0], [1, 2, 1], [1, 1, 2], [3, 0, 1], [1, 0, 3]];
export function oddMoments(object) {
  const p = object.geometry.attributes.position, index = object.geometry.index, count = index ? index.count : p.count;
  const box = new T.Box3().setFromBufferAttribute(p), L = box.getSize(new T.Vector3()).length() / 2;
  const sums = {x: ODD.map(() => 0), z: ODD.map(() => 0)}; let volume = 0;
  const v = [new T.Vector3(), new T.Vector3(), new T.Vector3()], e1 = new T.Vector3(), e2 = new T.Vector3(), n = new T.Vector3();
  for (let i = 0; i < count; i += 3) {
    for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(p, index ? index.getX(i + k) : i + k).divideScalar(L);
    n.crossVectors(e1.subVectors(v[1], v[0]), e2.subVectors(v[2], v[0])).multiplyScalar(.5);
    volume += n.x * (v[0].x + v[1].x + v[2].x) / 3;
    for (const [u, w, t, weight] of QUADRATURE) {
      const x = u * v[0].x + w * v[1].x + t * v[2].x, y = u * v[0].y + w * v[1].y + t * v[2].y, z = u * v[0].z + w * v[1].z + t * v[2].z;
      ODD.forEach(([a, b, c], m) => {
        // odd in x: g = x^a y^b z^c, integrated along x; odd in z: g = z^a y^b x^c, integrated along z.
        sums.x[m] += weight * n.x * x ** (a + 1) / (a + 1) * y ** b * z ** c;
        sums.z[m] += weight * n.z * z ** (a + 1) / (a + 1) * y ** b * x ** c;
      });
    }
  }
  return {x: Math.max(...sums.x.map(Math.abs)) / volume, z: Math.max(...sums.z.map(Math.abs)) / volume};
}

// `mutate` receives the raw (uncut) model before any check; the regression
// tests use it to plant known defects and prove that the checker reports them.
export function inspectDesign(input, {exportCheck = true, keepModel = false, mutate} = {}) {
  const s = normalize(input), {Manifold} = getKernel();
  const owned = [], own = x => (owned.push(x), x);
  const violations = [], metrics = {};
  const add = (rule, code, detail) => {
    const found = violations.find(v => v.code === code);
    if (found) { found.count++; if (found.details.length < 3) found.details.push(detail); }
    else violations.push({rule, code, count: 1, details: [detail]});
  };
  let model, clock = Date.now();
  const mark = name => { (metrics.timingMs ||= {})[name] = Date.now() - clock; clock = Date.now(); };
  try {
    const legacy = !MODERN_STYLES.includes(s.style);
    const raw = buildRing(s, null);
    mutate?.(raw);
    raw.group.updateMatrixWorld(true);
    const stones = [], elements = [];
    raw.group.traverse(o => { if (o.isMesh && o.userData.gem) stones.push(stoneInfo(o, own)); });
    const stoneOf = new Map(stones.map(x => [x.gem, x]));
    if (legacy) raw.group.traverse(o => {
      if (!o.isMesh || o.userData.gem) return;
      const e = {object: o, role: o.userData.role || 'untagged', host: !!o.userData.host, holds: stoneOf.get(o.userData.holds), ends: o.userData.ends,
        melee: !!o.userData.melee};
      try { e.solid = meshSolid(o, own); e.box = boxOf(e.solid); } catch (error) { add('D', 'ELEMENT_NOT_CLOSED', `${e.role}: ${error.message}`); return; }
      if (o.userData.rod) { e.path = rodWorld(o); e.radius = measuredRodRadius(o, e.path, !!o.userData.rod.radii); }
      if (o.userData.ball) { e.centre = new T.Vector3().setFromMatrixPosition(o.matrixWorld); e.radius = o.userData.ball.radius; }
      elements.push(e);
    });
    const shanks = elements.filter(e => e.role === 'shank');
    const inner = s.size / (2 * Math.PI) * SCENE;

    mark('build');
    // ── C: stone / metal relation on the raw, uncut elements ────────────────
    for (const e of elements) {
      if (e.host) continue;
      for (const stone of stones) {
        if (!e.box.intersectsBox(stone.box)) continue;
        const part = e.solid.intersect(stone.solid);
        try { const v = volume(part) / MM3; if (v > LIMITS.penetrationMm3) add('C', 'METAL_THROUGH_STONE', `${e.role} penetrates a ${stone.gem.userData.melee || (stone.gem.userData.hero === false ? 'side' : 'centre')} ${stone.shape} stone by ${v.toFixed(4)} mm³`); }
        finally { part.delete(); }
      }
    }
    for (const e of elements.filter(e => e.role === 'claw' && e.holds && e.path)) {
      const stone = e.holds, local = e.path.map(p => p.clone().applyMatrix4(stone.inverse));
      for (let i = 1; i < local.length; i++) {
        const a = local[i - 1], b = local[i];
        if ((a.y <= 0) !== (b.y <= 0)) {
          const t = a.y / (a.y - b.y), x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
          if (inOutline(stone.shape, x, z)) add('C', 'CLAW_STARTS_INSIDE_GIRDLE', `claw crosses the girdle plane inside the ${stone.shape} outline`);
        }
      }
      const tip = local.at(-1);
      if (!(tip.y > .018 && inOutline(stone.shape, tip.x, tip.z))) add('C', 'CLAW_TIP_NOT_OVER_CROWN', `claw tip is not above the crown of the ${stone.shape} stone`);
      const gap = (stoneDistance(stone, e.path.at(-1)) - e.radius) / SCENE;
      if (gap > LIMITS.contactGapMm) add('C', 'CLAW_TIP_NOT_TOUCHING', `claw tip is ${gap.toFixed(2)} mm away from the stone`);
    }
    for (const stone of stones) {
      const reach = Math.min(...stone.vertices.map(v => Math.hypot(v.x, v.y)));
      metrics.minimumCuletFloorMm = Math.min(metrics.minimumCuletFloorMm ?? Infinity, (reach - inner) / SCENE);
      if (reach < inner + LIMITS.culetFloorMm * SCENE) add('C', 'CULET_REACHES_BORE', `${stone.shape} stone is ${((reach - inner) / SCENE).toFixed(2)} mm from the finger bore`);
      if (legacy && !stone.gem.userData.onBand) for (const shank of shanks) {
        if (!shank.box.intersectsBox(stone.box)) continue;
        const part = shank.solid.intersect(stone.solid);
        try { const v = volume(part) / MM3; if (v > LIMITS.penetrationMm3) add('C', 'STONE_INSIDE_SHANK', `${stone.shape} stone sinks ${v.toFixed(3)} mm³ into the ring body`); }
        finally { part.delete(); }
      }
    }
    // Stones and grains set into the band must stay inside the band's width.
    if (legacy && shanks.length) {
      const bins = new Map();
      for (const shank of shanks) {
        const p = shank.object.geometry.attributes.position, v = new T.Vector3();
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(shank.object.matrixWorld);
          const key = Math.round(Math.atan2(v.x, v.y) / (Math.PI / 96)), bin = bins.get(key) || [Infinity, -Infinity];
          bin[0] = Math.min(bin[0], v.z); bin[1] = Math.max(bin[1], v.z); bins.set(key, bin);
        }
      }
      const within = (points, what) => {
        for (const v of points) {
          const bin = bins.get(Math.round(Math.atan2(v.x, v.y) / (Math.PI / 96)));
          if (bin && (v.z < bin[0] - .02 || v.z > bin[1] + .02)) { add('C', 'OVERHANGS_BAND', `${what} extends ${(Math.max(bin[0] - v.z, v.z - bin[1]) / SCENE).toFixed(2)} mm beyond the band edge`); return; }
        }
      };
      for (const stone of stones.filter(x => x.gem.userData.onBand)) within(stone.vertices, `${stone.gem.userData.melee || 'band'} stone`);
      for (const e of elements.filter(e => e.role === 'grain' && e.holds?.gem.userData.onBand))
        within([(e.centre || e.path.at(-1)).clone()], 'pavé grain axis');
    }
    if (!legacy) {
      const layout = modernLayout(s);
      for (const stone of layout.stones) {
        const east = Math.abs(Math.sin(stone.rotation)) > .5;
        const half = (east ? stone.width : stone.length) / 2 + s.bezelWall;
        const over = Math.abs(stone.z - layout.shift(stone.angle)) + half - layout.widthAt(stone.angle) / 2;
        if (over > .02 && !['signet'].includes(s.style)) add('C', 'OVERHANGS_BAND', `${stone.shape} bezel extends ${over.toFixed(2)} mm beyond the band edge`);
      }
    }

    mark('rawStone');
    // ── A: claws and supports of each mounting ──────────────────────────────
    const byStone = role => {
      const groups = new Map();
      for (const e of elements.filter(e => e.role === role && e.holds)) groups.set(e.holds, [...(groups.get(e.holds) || []), e]);
      return groups;
    };
    const localSet = (stone, points) => points.map(p => p.clone().applyMatrix4(stone.inverse));
    const invariant = (points, axis, tolerance = 2e-3) => points.every(p => points.some(q =>
      Math.abs(q.x - (axis === 'x' ? -p.x : p.x)) < tolerance && Math.abs(q.z - (axis === 'z' ? -p.z : p.z)) < tolerance && Math.abs(q.y - p.y) < tolerance));
    for (const [stone, claws] of byStone('claw')) {
      const tips = localSet(stone, claws.map(c => c.path.at(-1))), feet = localSet(stone, claws.map(c => c.path[0]));
      const symmetry = shapeSymmetry(stone.shape);
      for (const axis of ['x', 'z']) if (symmetry[axis] && !(invariant(tips, axis) && invariant(feet, axis)))
        add('A', 'CLAWS_NOT_MIRRORED', `${claws.length} claws on a ${stone.shape} stone are not mirrored across its ${axis} axis`);
      if (stone.shape === 'round') {
        const angles = tips.map(p => Math.atan2(p.z, p.x)).sort((a, b) => a - b);
        const gaps = angles.map((a, i) => (angles[(i + 1) % angles.length] - a + 2 * Math.PI) % (2 * Math.PI) || 2 * Math.PI);
        const distinct = [...new Set(gaps.map(g => g.toFixed(3)))];
        // Single claws: one gap value. Double claws: two alternating values.
        if (distinct.length > (s.setting === 'doubleclaw' ? 2 : 1)) add('A', 'CLAWS_UNEVEN_ANGLES', `claw gaps ${distinct.join('/')} rad on a round stone`);
      }
      const radii = claws.map(c => c.radius), lengths = claws.map(c => c.path.slice(1).reduce((sum, p, i) => sum + p.distanceTo(c.path[i]), 0));
      if (Math.max(...radii) - Math.min(...radii) > .004) add('A', 'CLAWS_UNEQUAL_THICKNESS', `claw radii ${Math.min(...radii).toFixed(3)}–${Math.max(...radii).toFixed(3)}`);
      // Claws that are mirror images of each other (only across axes the cut really has).
      const key = p => `${(symmetry.x ? Math.abs(p.x) : p.x).toFixed(2)}:${(symmetry.z ? Math.abs(p.z) : p.z).toFixed(2)}`, orbit = new Map();
      tips.forEach((p, i) => orbit.set(key(p), [...(orbit.get(key(p)) || []), lengths[i]]));
      for (const group of orbit.values()) if (Math.max(...group) - Math.min(...group) > .004) add('A', 'CLAWS_UNEQUAL_LENGTH', `mirrored claws differ by ${((Math.max(...group) - Math.min(...group)) / SCENE).toFixed(3)} mm`);
    }
    const expected = expectedSymmetry(s);
    const supports = elements.filter(e => e.role === 'support' && e.path);
    for (const [stone, group] of byStone('support')) {
      if (group.length < 3) add('A', 'TOO_FEW_SUPPORTS', `${group.length} posts under a ${stone.shape} stone`);
      const ends = localSet(stone, group.map(g => g.path.at(-1)));
      const symmetry = shapeSymmetry(stone.shape);
      for (const axis of ['x', 'z']) if (symmetry[axis] && !invariant(ends, axis, .02))
        add('A', 'SUPPORTS_NOT_MIRRORED_ON_BASKET', `posts leave the ${stone.shape} basket asymmetrically across its ${axis} axis`);
    }
    for (const axis of ['x', 'z']) {
      if (!expected[axis]) continue;
      const flip = p => new T.Vector3(axis === 'x' ? -p.x : p.x, p.y, axis === 'z' ? -p.z : p.z);
      const same = (a, b) => a.length === b.length && a.every((p, i) => p.distanceTo(b[i]) < .03);
      for (const support of supports) {
        const image = support.path.map(flip);
        if (!supports.some(o => same(o.path, image) || same([...o.path].reverse(), image))) {
          const feet = supports.map(o => Math.sign(Math.round(o.path[0][axis] * 100)));
          add('A', 'SUPPORTS_NOT_MIRRORED', `posts are not mirrored across ${axis}=0 (feet on − side: ${feet.filter(f => f < 0).length}, on + side: ${feet.filter(f => f > 0).length}, centred: ${feet.filter(f => !f).length})`);
          break;
        }
      }
      // Every raw element has a mirror image of the same role, position and size.
      for (const e of elements) {
        const centre = e.box.getCenter(new T.Vector3()), size = e.box.getSize(new T.Vector3()), image = flip(centre);
        if (!elements.some(o => o.role === e.role && o.box.getCenter(new T.Vector3()).distanceTo(image) < .01 && o.box.getSize(new T.Vector3()).distanceTo(size) < .01)) {
          add('A', 'ELEMENTS_NOT_MIRRORED', `${e.role} at (${centre.toArray().map(v => (v / SCENE).toFixed(2)).join(', ')}) mm has no mirror image across ${axis}=0`);
          break;
        }
      }
      const centres = stones.map(x => ({c: x.centre, r: x.scale.x, shape: x.shape}));
      if (!centres.every(a => centres.some(b => b.shape === a.shape && Math.abs(b.r - a.r) < 1e-3 && b.c.distanceTo(flip(a.c)) < .02)))
        add('A', 'STONES_NOT_MIRRORED', `stone layout is not mirrored across ${axis}=0`);
    }

    mark('claws');
    // ── D (as designed): rod diameters measured on the meshes ───────────────
    for (const e of elements.filter(e => e.path || e.centre)) {
      if (e.role === 'milgrain') continue; // decorative texture, not a wall
      const melee = e.melee || ['grain', 'grain-stem'].includes(e.role) || (e.holds && e.holds.diameterMm < LIMITS.meleeMaxDiameterMm);
      const limit = melee ? LIMITS.meleeRodDiameterMm : LIMITS.structuralRodDiameterMm, diameter = 2 * e.radius / SCENE;
      const name = ['claw', 'claw-tip'].includes(e.role) ? 'CLAW' : 'ROD';
      if (diameter < limit - .005) add('D', `${name}_TOO_THIN`, `${e.role} ${diameter.toFixed(2)} mm < ${limit} mm (${melee ? 'melee' : 'structural'})`);
      metrics.minimumRodMm = Math.min(metrics.minimumRodMm ?? Infinity, diameter);
    }
    // Raw connectivity: every declared rod end must be buried in another element.
    const sphere = (centre, r) => own(own(Manifold.sphere(r, 16)).translate(centre.toArray()));
    const endProbes = [];
    for (const e of elements.filter(e => e.path && e.ends)) e.ends.forEach((buried, k) => {
      if (!buried) return;
      const point = k ? e.path.at(-1) : e.path[0], probe = sphere(point, e.radius * .5), probeBox = boxOf(probe);
      const others = elements.filter(o => o !== e && o.box.intersectsBox(probeBox)).map(o => o.solid);
      // Carve every neighbouring element out of the small probe; what is left is not embedded.
      let rest = probe;
      for (const other of others) rest = own(rest.subtract(other));
      const fraction = 1 - volume(rest) / volume(probe);
      if (fraction < .85) add('B', 'END_NOT_EMBEDDED', `${e.role} ${k ? 'upper' : 'lower'} end is only ${(fraction * 100).toFixed(0)}% inside the element it should join`);
      endProbes.push({probe, role: e.role, k});
    });

    mark('ends');
    // ── Finished solid ──────────────────────────────────────────────────────
    model = unifyLegacy(raw);
    const audit = model.engineering.assemblyValidation = auditAssembly(model, s);
    const engineering = model.engineering;
    const metalMeshes = []; model.group.traverse(o => { if (o.isMesh && !o.userData.gem) metalMeshes.push(o); });
    if (!engineering.meshValidation?.valid || engineering.status === 'requires_cad_repair' || metalMeshes.length !== 1)
      add('B', 'NOT_ONE_CLOSED_SOLID', engineering.reason || `${metalMeshes.length} metal meshes; ${JSON.stringify({components: engineering.meshValidation?.checks?.[0]?.components, boundaryEdges: engineering.meshValidation?.checks?.[0]?.boundaryEdges})}`);
    // Same tolerance as a penetration: below it a loose chip is a numerical sliver, not a part.
    if ((engineering.removedDebrisMm3 || 0) > LIMITS.penetrationMm3) add('B', 'DETACHED_METAL_REMOVED', `${engineering.removedDebrisMm3.toFixed(5)} mm³ of metal was cut loose by a stone and discarded`);
    if (audit.issues.includes('STONES_INTERSECT')) add('C', 'STONES_INTERSECT', `${audit.stones.collisions.length} overlapping stone pairs, worst ${Math.max(...audit.stones.collisions.map(c => c.overlapMm3)).toFixed(4)} mm³`);
    if (audit.issues.includes('METAL_INTERSECTS_STONE')) add('C', 'FINAL_METAL_INTERSECTS_STONE', `${audit.metal.collisions.length} stones, worst ${Math.max(...audit.metal.collisions.map(c => c.overlapMm3)).toFixed(4)} mm³`);
    if (audit.issues.includes('SUPPORT_INTERSECTS_STONE')) add('C', 'SUPPORT_BLOCKED_BY_STONE', `${audit.blockedSupports} posts have no clear route`);
    if (audit.issues.includes('FINGER_CLEARANCE')) add('D', 'BORE_OBSTRUCTED', `inner radius ${audit.minimumBoreRadiusMm.toFixed(3)} mm, requested ${audit.requestedBoreRadiusMm.toFixed(3)} mm`);
    metrics.boreMarginMm = audit.minimumBoreRadiusMm - audit.requestedBoreRadiusMm;

    mark('unify');
    if (metalMeshes.length === 1 && engineering.meshValidation?.valid) {
      const body = meshSolid(metalMeshes[0], own), bodyVolume = volume(body);
      metrics.metalVolumeMm3 = bodyVolume / MM3;
      const check = validateMesh(metalMeshes[0].geometry);
      if (!check.valid) add('D', 'MESH_NOT_MANIFOLD', JSON.stringify({boundaryEdges: check.boundaryEdges, inconsistentEdges: check.inconsistentEdges, nonManifoldVertices: check.nonManifoldVertices, degenerate: check.degenerate, signedVolume: check.signedVolume}));
      if (!(check.signedVolume > 0)) add('D', 'NORMALS_INVERTED', `signed volume ${check.signedVolume}`);
      // Ends must still be solid metal after the stone seats were cut.
      if (endProbes.length) {
        // One Boolean against the whole body, then cheap per-probe intersections.
        const near = own(body.intersect(own(Manifold.union(endProbes.map(e => e.probe)))));
        for (const {probe, role, k} of endProbes) {
          const part = own(near.intersect(probe)), fraction = volume(part) / volume(probe);
          if (fraction < .85) add('B', 'END_CUT_AWAY', `${role} ${k ? 'upper' : 'lower'} end is ${(fraction * 100).toFixed(0)}% metal after the stone seat was cut`);
        }
      }
    mark('endsCut');
      // A: mirror symmetry of the whole metal body.
      metrics.mirror = {};
      // Fast path: a body with a mirror plane has vanishing odd volume moments
      // about it. They are integrated exactly over the closed mesh; only when
      // one is non-zero is the (slow) exact Boolean comparison needed.
      const odd = oddMoments(metalMeshes[0]);
      metrics.oddMoments = odd;
      const vertexMirrored = axis => odd[axis] < 5e-6;
      for (const axis of ['x', 'z']) {
        if (!expected[axis]) continue; // deliberately asymmetric plane: nothing to verify
        if (vertexMirrored(axis)) { metrics.mirror[axis] = 0; continue; }
        const image = own(body.mirror(axis === 'x' ? [1, 0, 0] : [0, 0, 1])), common = own(body.intersect(image));
        const ratio = 1 - volume(common) / bodyVolume;
        metrics.mirror[axis] = ratio;
        if (ratio > LIMITS.mirrorVolumeRatio) add('A', 'BODY_NOT_MIRRORED', `${(ratio * 100).toFixed(3)}% of the metal has no mirror image across ${axis}=0`);
      }
    mark('mirror');
      // C: every stone is seated (metal below the girdle) and retained (metal
      // above it), with no open half-turn through which it could leave.
      const shells = stones.map(stone => own(Manifold.hull(stone.vertices.map(v => v.clone().sub(stone.centre).multiplyScalar(1.04).add(v.clone().sub(stone.centre).normalize().multiplyScalar(LIMITS.contactGapMm * SCENE)).add(stone.centre).toArray()))));
      // One Boolean against the whole body, then a small one per stone.
      const nearStones = stones.length ? own(body.intersect(own(Manifold.union(shells)))) : null;
      for (const [index, stone] of stones.entries()) {
        const touch = own(nearStones.intersect(shells[index])), data = touch.getMesh();
        const above = [], below = [];
        for (let i = 0; i < data.vertProperties.length; i += data.numProp) {
          const p = new T.Vector3(data.vertProperties[i], data.vertProperties[i + 1], data.vertProperties[i + 2]).applyMatrix4(stone.inverse);
          (p.y > .018 ? above : below).push(Math.atan2(p.z, p.x));
        }
        const largestGap = angles => {
          if (!angles.length) return 2 * Math.PI;
          angles.sort((a, b) => a - b);
          return Math.max(...angles.map((a, i) => i + 1 < angles.length ? angles[i + 1] - a : angles[0] + 2 * Math.PI - a));
        };
        const kind = stone.gem.userData.melee || (stone.gem.userData.hero === false ? 'side' : 'centre');
        if (largestGap(below) > Math.PI * 1.12) add('C', 'STONE_NOT_SEATED', `${kind} ${stone.shape} stone has no metal seat under ${(largestGap(below) * 180 / Math.PI).toFixed(0)}° of its girdle`);
        if (largestGap(above) > Math.PI * 1.12) add('C', 'STONE_NOT_RETAINED', `${kind} ${stone.shape} stone has no metal over the girdle across ${(largestGap(above) * 180 / Math.PI).toFixed(0)}°`);
      }
    mark('seated');
      // D: every radial cross-section of the ring body contains a 1 mm disc.
      const sectionSources = legacy ? shanks.map(x => x.solid) : [body];
      const blocked = legacy ? [] : modernLayout(s).stones.map(x => [x.angle, Math.asin(Math.min(1, (Math.max(x.length, x.width) / 2 + s.bezelWall + .4) / (s.size / (2 * Math.PI))))]);
      let thinnest = Infinity;
      for (let i = 0; i < 24; i++) {
        const a = (i + .5) / 24 * Math.PI * 2;
        if (blocked.some(([centre, half]) => Math.abs(Math.atan2(Math.sin(a - centre), Math.cos(a - centre))) < half)) continue;
        for (const source of sectionSources) {
          const turned = own(own(source.rotate([0, 0, a * 180 / Math.PI])).rotate([0, 90, 0]));
          const section = own(turned.slice(0));
          for (const piece of section.decompose()) {
            own(piece);
            const bounds = piece.bounds();
            if ((bounds.min[1] + bounds.max[1]) / 2 < 0 || piece.area() < 1e-4) continue;
            // Bisection on the inward offset that erases the piece = inscribed radius.
            let low = 0, high = 4;
            for (let k = 0; k < 9; k++) { const mid = (low + high) / 2, shrunk = piece.offset(-mid, 'Round', 2, 24); if (shrunk.isEmpty()) high = mid; else low = mid; shrunk.delete(); }
            thinnest = Math.min(thinnest, 2 * low / SCENE);
          }
        }
      }
      if (Number.isFinite(thinnest)) {
        metrics.minimumWallMm = thinnest;
        if (thinnest < LIMITS.wallMm - .02) add('D', 'WALL_TOO_THIN', `ring body cross-section holds only a ${thinnest.toFixed(2)} mm disc (< ${LIMITS.wallMm} mm)`);
      }
    mark('wall');
      // F: the export must be this exact solid, closed, with stones separate.
      if (exportCheck) {
        const exported = exportMeshes(model);
        const stl = new DataView(exported.stl.buffer, exported.stl.byteOffset, exported.stl.byteLength), triangles = stl.getUint32(80, true);
        const positions = new Float32Array(triangles * 9);
        for (let i = 0; i < triangles; i++) for (let k = 0; k < 9; k++) positions[i * 9 + k] = stl.getFloat32(84 + i * 50 + 12 + k * 4, true);
        const welded = new T.BufferGeometry(); welded.setAttribute('position', new T.BufferAttribute(positions, 3));
        const result = validateMesh(welded); result.signedVolume *= MM3; // millimetres → scene units for the comparison below
        const source = metalMeshes[0].geometry, sourceTriangles = (source.index ? source.index.count : source.attributes.position.count) / 3;
        if (Math.abs(triangles - sourceTriangles) > sourceTriangles * .001) add('F', 'EXPORT_DIFFERS_FROM_VIEW', `STL has ${triangles} triangles, the displayed metal has ${sourceTriangles}`);
        if (!result.valid) add('F', 'EXPORT_NOT_WATERTIGHT', JSON.stringify({boundaryEdges: result.boundaryEdges, inconsistentEdges: result.inconsistentEdges, components: result.components, nonManifoldVertices: result.nonManifoldVertices, degenerate: result.degenerate}));
        if (Math.abs(result.signedVolume / MM3 - metrics.metalVolumeMm3) > Math.max(.01, metrics.metalVolumeMm3 * 1e-4)) add('F', 'EXPORT_DIFFERS_FROM_VIEW', `STL volume ${(result.signedVolume / MM3).toFixed(3)} mm³ ≠ displayed ${metrics.metalVolumeMm3.toFixed(3)} mm³`);
        welded.dispose();
        if (exported.objects.filter(o => o.kind === 'gemstone').length !== stones.length || exported.objects.filter(o => o.kind === 'metal').length !== 1)
          add('F', 'EXPORT_BODIES_WRONG', `OBJ has ${exported.objects.filter(o => o.kind === 'metal').length} metal and ${exported.objects.filter(o => o.kind === 'gemstone').length} stone objects for ${stones.length} stones`);
      }
    }
    mark('export');
    metrics.stones = stones.length;
  } catch (error) {
    add('B', 'BUILD_FAILED', error.message);
  } finally {
    for (let i = owned.length - 1; i >= 0; i--) { try { owned[i].delete(); } catch { /* already released */ } }
    if (!keepModel) model?.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  }
  return {valid: violations.length === 0, violations, metrics, config: s, ...(keepModel ? {model} : {})};
}
