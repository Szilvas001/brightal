// Shared, parameterised placement of every stone-holding element: claws,
// bezel posts, basket rings, melee rows and their grains. Every classic style
// calls these functions, so a rule holds for all of them or for none.
//
// Coordinates here are in "unit stone space": the cut has girdle radius 1 at
// y = 0, its table at y = +0.35 and its culet at y = -0.7. `planes` are the
// outward facet planes of the convex cut (n·p - w <= 0 inside).
import {outline} from './optics.mjs';
import {LIMITS, SCENE, shapeSymmetry} from './design-rules.mjs';

export const CLEARANCE = .012; // scene units between designed metal and a stone
export const GALLERY_Y = -.58;

// Lower bound of the distance from a point to the cut (negative inside).
export function clearance(planes, x, y, z) {
  let d = -Infinity;
  for (const p of planes) d = Math.max(d, p.x * x + p.y * y + p.z * z - p.w);
  return d;
}
// True when the whole segment stays at least `margin` away from the cut.
export function segmentClear(planes, a, b, margin) {
  let enter = 0, exit = 1;
  for (const p of planes) {
    const da = p.x * a[0] + p.y * a[1] + p.z * a[2] - p.w - margin, db = p.x * b[0] + p.y * b[1] + p.z * b[2] - p.w - margin;
    if (da > 0 && db > 0) return true;
    if (da > 0) enter = Math.max(enter, da / (da - db));
    if (db > 0) exit = Math.min(exit, da / (da - db));
    if (enter > exit) return true;
  }
  return enter > exit;
}
export const isMelee = scale => 2 * scale / SCENE < LIMITS.meleeMaxDiameterMm;
// Rod radius (scene units) for the claws, posts and rings of one stone.
export function rodRadius(scale) {
  const floor = (isMelee(scale) ? LIMITS.meleeRodDiameterMm : LIMITS.structuralRodDiameterMm) / 2 * SCENE;
  return isMelee(scale) ? Math.min(.26, Math.max(floor + .01, .17 * scale)) : Math.min(.44, Math.max(floor + .005, .085 * scale));
}
export function perimeter(shape) {
  let length = 0, previous = outline(shape, 0);
  for (let i = 1; i <= 256; i++) { const p = outline(shape, i / 256 * Math.PI * 2); length += Math.hypot(p[0] - previous[0], p[1] - previous[1]); previous = p; }
  return length;
}
// Largest claw arrangement that physically fits around the girdle. Claws may
// cover at most 62 % of the girdle; otherwise fall back 8 → 6 → 4 claws, and
// from double to single claws.
export function fitClaws(shape, scale, requested, double) {
  const r = rodRadius(scale), room = .62 * perimeter(shape) * scale;
  const options = [8, 6, 4].filter(n => n <= requested);
  if (double) for (const count of options) if (count * (4 * r + .12) <= room) return {count, double: true};
  for (const count of options) if (count * 2 * r <= room) return {count, double: false};
  return {count: 4, double: false};
}
// Smallest outline factor k >= kMin for which a wire of the given radius at
// height y clears the cut everywhere. Below the girdle this is "touching the
// pavilion from outside", i.e. a seat.
export function ringFactor(shape, planes, y, margin, kMin = .3) {
  const samples = Array.from({length: 96}, (_, i) => outline(shape, i / 96 * Math.PI * 2));
  for (let k = kMin; k < 3; k += .005) if (samples.every(([x, z]) => clearance(planes, x * k, y, z * k) >= margin)) return k;
  return 3;
}
// Lowest height at which a ball of radius `margin` centred above plan point
// (x, z) rests on the crown without entering it.
export function restingHeight(planes, x, z, margin) {
  let y = Infinity;
  for (const p of planes) if (p.y > 1e-6) y = Math.min(y, (p.w + margin - p.x * x - p.z * z) / p.y);
  return y;
}
// One claw / bezel post. It leaves the gallery ring, rises outside the girdle
// and bends over the crown; only its tip touches the stone.
export function postPath(shape, planes, angle, {scale, radius, galleryK, tipHeight, seat}) {
  const [ox, oz] = outline(shape, angle), reach = Math.hypot(ox, oz), margin = (radius + CLEARANCE) / scale;
  const tipK = 1 - .9 * radius / scale / reach;
  const tipY = tipHeight ?? restingHeight(planes, ox * tipK, oz * tipK, margin);
  const foot = [ox * galleryK, GALLERY_Y, oz * galleryK], tip = [ox * tipK, tipY, oz * tipK];
  const clear = path => path.slice(1).every((point, i) => segmentClear(planes, path[i], point, margin - 1e-6));
  // Step cuts bulge below the girdle: when the straight leg from the gallery
  // would graze the pavilion, the post bows outwards through an elbow.
  for (const elbow of [0, .08, .16, .26, .38, .52, .7]) {
    for (let k = 1 + margin / reach; k < 2.5; k += .004) {
      // A bezel post passes through the seat ring under the pavilion first.
      const lower = seat ? [[ox * seat.k, seat.y, oz * seat.k], [ox * k, seat.y, oz * k]] : [[ox * k, -.28, oz * k]];
      const bendK = Math.max(galleryK, seat ? seat.k : k) + elbow;
      const bend = elbow ? [[ox * bendK, (GALLERY_Y + lower[0][1]) / 2, oz * bendK]] : [];
      const path = [foot, ...bend, ...lower, [ox * k, tipY, oz * k], tip];
      if (clear(path)) return {points: path.map(p => p.map(v => v * scale)), shaftK: k, tipK, tipY, angle};
      if (!clear(path.slice(0, 2 + bend.length))) break; // the lower leg is the problem: try the next elbow
    }
  }
  throw new Error('No clear claw path for ' + shape);
}
// Angles of the claws around a cut: equal steps of the outline parameter,
// placed so the set is mirrored across both axes of the stone.
export function clawAngles(shape, scale, count, double, radius) {
  const angles = [];
  for (let i = 0; i < count; i++) {
    const a = 2 * Math.PI * (i + .5) / count;
    if (!double) { angles.push(a); continue; }
    const before = outline(shape, a - .001), after = outline(shape, a + .001);
    const tangent = Math.hypot(after[0] - before[0], after[1] - before[1]) / .002;
    const pair = Math.min(Math.PI / count * .45, (radius + .06) / (scale * tangent));
    angles.push(a - pair, a + pair);
  }
  return angles;
}
// Height of a bezel rim wire that sits on the crown edge all the way round.
export function rimHeight(shape, planes, scale, radius) {
  const margin = (radius + CLEARANCE) / scale; let y = -Infinity;
  for (let i = 0; i < 96; i++) {
    const [ox, oz] = outline(shape, i / 96 * Math.PI * 2), k = 1 - .9 * radius / scale / Math.hypot(ox, oz);
    y = Math.max(y, restingHeight(planes, ox * k, oz * k, margin));
  }
  return y;
}

// Evenly spaced points on a scaled outline, by arc length, arranged so the
// row has the same mirror axes as the cut itself (no stone on an axis).
export function symmetricRow(shape, radius, pitch, maxCount = 64) {
  const symmetry = shapeSymmetry(shape);
  const [from, to, copies] = symmetry.x && symmetry.z ? [0, Math.PI / 2, 4] : symmetry.x ? [-Math.PI / 2, Math.PI / 2, 2] : [0, 2 * Math.PI, 1];
  const n = 256, samples = Array.from({length: n + 1}, (_, i) => { const a = from + (to - from) * i / n, [x, z] = outline(shape, a); return [x * radius, z * radius]; });
  const cumulative = [0];
  for (let i = 1; i <= n; i++) cumulative.push(cumulative[i - 1] + Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]));
  const length = cumulative[n];
  const expand = points => copies === 4 ? points.flatMap(([x, z]) => [[x, z], [-x, z], [-x, -z], [x, -z]]) : copies === 2 ? points.flatMap(([x, z]) => [[x, z], [-x, z]]) : points;
  for (let count = Math.min(Math.floor(maxCount / copies), Math.floor(length / pitch)); count >= 1; count--) {
    const points = Array.from({length: count}, (_, i) => {
      const d = (i + .5) * length / count; let j = 1; while (cumulative[j] < d) j++;
      const f = (d - cumulative[j - 1]) / (cumulative[j] - cumulative[j - 1]);
      return samples[j - 1].map((v, k) => v + f * (samples[j][k] - v));
    });
    const all = expand(points);
    if (all.every((p, i) => all.every((q, j) => i === j || Math.hypot(p[0] - q[0], p[1] - q[1]) >= pitch - 1e-7))) return all;
  }
  return [];
}

// Grains (beads) for a group of round melee stones.
//  * Two neighbouring stones share two grains, one on each side of the gap
//    between them, tangent to both girdles (closed form, no search).
//  * A stone without a neighbour in a direction gets two grains of its own
//    on that side.
//  * A grain is then pushed out of every other stone it would enter; where
//    `limit` (e.g. the band edge) keeps it from moving far enough, it is
//    raised until it rests on the crown instead.
// A grain therefore always rises from the metal BETWEEN or beside stones and
// never from inside one. Every step is independent of the order of `stones`
// and commutes with mirroring, so a mirrored row gets mirrored grains.
//   stones: [{centre:[x,y,z], axis:[x,y,z], along:[x,y,z], radius, group?}]
//     (`group` separates rows on different rails: grains are shared only
//      within a group and are handed back with their group)
//   returns [{position:[x,y,z] (girdle plane), axis:[x,y,z], lift, group}]
export function grainLayout(stones, grainRadius, {limit, planes} = {}) {
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], sub = (a, b) => add(a, b, -1);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], length = a => Math.hypot(...a);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = a => { const l = length(a) || 1; return a.map(v => v / l); };
  const reach = stone => stone.radius + grainRadius + CLEARANCE;
  let grains = [];
  const neighbour = stones.map(() => ({plus: false, minus: false}));
  for (let i = 0; i < stones.length; i++) for (let j = i + 1; j < stones.length; j++) {
    const a = stones[i], b = stones[j], span = sub(b.centre, a.centre), half = length(span) / 2;
    const tangent = (reach(a) + reach(b)) / 2;
    if (half >= tangent - 1e-6 || dot(a.axis, b.axis) < .5 || (a.group ?? 0) !== (b.group ?? 0)) continue;
    const axis = unit(add(a.axis, b.axis)), across = unit(cross(axis, span)), middle = add(a.centre, span, .5);
    const offset = Math.sqrt(tangent * tangent - half * half);
    for (const side of [1, -1]) grains.push({position: add(middle, across, side * offset), axis, group: a.group ?? 0});
    // Which side of each stone is now served (only neighbours along the row count).
    const ca = dot(unit(span), unit(a.along)), cb = dot(unit(span), unit(b.along));
    if (Math.abs(ca) > .5) neighbour[i][ca > 0 ? 'plus' : 'minus'] = true;
    if (Math.abs(cb) > .5) neighbour[j][cb > 0 ? 'minus' : 'plus'] = true;
  }
  stones.forEach((stone, i) => {
    const along = unit(stone.along), across = unit(cross(stone.axis, stone.along)), d = reach(stone) * Math.SQRT1_2;
    for (const [flag, u] of [['plus', 1], ['minus', -1]]) if (!neighbour[i][flag])
      for (const v of [1, -1]) grains.push({position: add(add(stone.centre, along, u * d), across, v * d), axis: stone.axis, group: stone.group ?? 0});
  });
  for (let pass = 0; pass < 80; pass++) {
    let moved = 0;
    grains = grains.map(g => {
      let shift = [0, 0, 0];
      for (const stone of stones) {
        const offset = sub(g.position, stone.centre), axial = dot(offset, stone.axis);
        if (Math.abs(axial) > stone.radius) continue;
        const radial = add(offset, stone.axis, -axial), distance = length(radial);
        if (distance < reach(stone) - 1e-9) shift = add(shift, unit(radial), reach(stone) - distance);
      }
      let position = add(g.position, shift);
      if (limit) position = limit(position, g.group);
      moved = Math.max(moved, length(sub(position, g.position)));
      return {...g, position};
    });
    if (moved < 1e-7) break;
  }
  // Height of the grain centre above the girdle plane: half a radius where it
  // stands clear, otherwise resting on the crown facets of the stone below it.
  const rest = (ratio, margin) => {
    let y = -Infinity;
    for (let i = 0; i < 16; i++) y = Math.max(y, restingHeight(planes, ratio * Math.cos(i * Math.PI / 8), ratio * Math.sin(i * Math.PI / 8), margin));
    return y;
  };
  return grains.map(g => {
    let lift = grainRadius * .5;
    if (planes) for (const stone of stones) {
      const offset = sub(g.position, stone.centre), axial = dot(offset, stone.axis);
      if (Math.abs(axial) > stone.radius) continue;
      const distance = length(add(offset, stone.axis, -axial));
      if (distance < reach(stone) - 1e-6) lift = Math.max(lift, axial + stone.radius * rest(distance / stone.radius, (grainRadius + CLEARANCE) / stone.radius));
    }
    return {...g, lift};
  });
}
