// Single source of truth for the manufacturing limits and for every
// deliberately asymmetric design element. The geometry builders and the
// automatic checker (geometry-rules.mjs) both read these values.
import {outline} from './optics.mjs';

export const SCENE = .8; // scene units per millimetre

export const LIMITS = Object.freeze({
  // Claws, posts, basket ribs and rails that carry a stone of at least
  // MELEE_MAX_DIAMETER_MM: guide value from the specification.
  structuralRodDiameterMm: .8,
  // Grains/beads and the wires of melee stones (pavé, halo, hidden halo,
  // cluster satellites). The 0.8 mm guide cannot physically fit around a
  // 1–2 mm stone; 0.4 mm was the project's existing minimum feature.
  meleeRodDiameterMm: .4,
  meleeMaxDiameterMm: 2.4,
  // Every cross-section of the ring body must contain a disc this large.
  wallMm: 1,
  // Metal left between a seated stone's culet and the finger bore.
  culetFloorMm: .3,
  // Numerical tolerances (not goldsmith tolerances).
  penetrationMm3: .001,
  contactGapMm: .1,
  mirrorVolumeRatio: .001,
  boreMm: .03,
});

// Rule A: an element that is asymmetric on purpose must be listed here with
// the mirror plane it breaks and the reason. x = across the band (left/right
// when looking along the finger), z = along the finger axis (front/back).
export const INTENTIONAL_ASYMMETRY = Object.freeze({
  duet: {x: false, z: false, reason: 'Toi & Moi: two different stones, offset and turned towards each other'},
  asymmetric: {x: false, z: false, reason: 'Offset Constellation: stones are deliberately shifted off-centre'},
  scatter: {x: true, z: false, reason: 'Stardust: stones alternate between the two edges of the band'},
  aurora: {x: false, z: false, reason: 'Aurora: asymmetric raised crest'},
  wave: {x: false, z: false, reason: 'Liquid: the band is an S-shaped wave (point-symmetric, not mirror-symmetric)'},
  ribbon: {x: false, z: false, reason: 'Diamond Ribbon: stones follow an S-shaped wave'},
  curvedoval: {x: false, z: false, reason: 'Arc Oval: band sweeps past the stone in an S-curve'},
  wavebezel: {x: false, z: false, reason: 'Tidal Bezel: S-shaped band'},
  twist: {x: false, z: false, reason: 'Twisted ribbon'},
  braid: {x: false, z: false, reason: 'Braid: diagonal relief'},
  open: {x: false, z: false, reason: 'Sculpted Bypass: the central groove is cut diagonally'},
  ripple: {x: false, z: false, reason: 'Ripple: the edge wave travels round the band'},
  orbit: {x: false, z: false, reason: 'Orbit: the band sways in a travelling wave'},
  saddle: {x: true, z: false, reason: 'Saddle: the band bends towards one side of the finger'},
  shield: s => s.motifOffset ? {x: false, z: false, reason: 'Shield: the motif offset slider shifts the face off-centre'} : {x: false, z: true, reason: 'Shield: travelling relief pattern'},
  lotus: s => s.motifOffset ? {x: false, z: false, reason: 'Lotus: the motif offset slider shifts the petals off-centre'} : null,
  crown: {x: true, z: false, reason: 'Marquise Crown: the stone row arcs towards one edge'},
  chevron: {x: true, z: false, reason: 'Wishbone: the V points to one side'},
  contour: {x: true, z: false, reason: 'Nesting Arc: the contour points to one side'},
});

const mirrored = (shape, axis) => {
  // Does the cut's outline map onto itself when the given local axis flips?
  const points = Array.from({length: 96}, (_, i) => outline(shape, i / 96 * Math.PI * 2));
  return points.every(p => {
    const q = axis === 'x' ? [-p[0], p[1]] : [p[0], -p[1]];
    return points.some(r => Math.hypot(r[0] - q[0], r[1] - q[1]) < 1e-6);
  });
};
const cache = new Map();
export function shapeSymmetry(shape) {
  if (!cache.has(shape)) cache.set(shape, {x: mirrored(shape, 'x'), z: mirrored(shape, 'z')});
  return cache.get(shape);
}

// Mirror planes the finished ring is required to have for this configuration.
export function expectedSymmetry(s) {
  const planes = {x: true, z: true, reasons: []};
  const entry = INTENTIONAL_ASYMMETRY[s.style], style = typeof entry === 'function' ? entry(s) : entry;
  if (style) {
    for (const k of ['x', 'z']) if (!style[k]) planes[k] = false;
    planes.reasons.push(style.reason);
  }
  // A cut without a mirror axis (pear) removes the plane its tip points along.
  const breakBy = (shape, east, why) => {
    const sym = shapeSymmetry(shape);
    const world = east ? {x: sym.z, z: sym.x} : sym;
    for (const k of ['x', 'z']) if (!world[k] && planes[k]) { planes[k] = false; planes.reasons.push(why); }
  };
  const east = s.orientation === 'east' || s.style === 'eastwest';
  breakBy(s.shape, east, `${s.shape} centre cut has a single mirror axis`);
  const usesSide = s.sideMode !== 'none' || s.style === 'alternating' || s.accents === 'hidden';
  if (usesSide) breakBy(s.sideShape, false, `${s.sideShape} side cut has a single mirror axis`);
  return planes;
}
