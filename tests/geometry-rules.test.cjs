// Regression gate for the ring-builder geometry rules A–F
// (public/builder/geometry-rules.mjs). A faulty model must not get out:
//   * every style's default design is inspected, including its STL/OBJ export;
//   * the two reported defects are pinned as explicit cases;
//   * planted defects prove that the checker really detects each rule class.
// The complete traversal (every style × setting × cut and every parameter at
// minimum / middle / maximum, ~3 800 designs) runs with
//   npm run test:geometry-rules        (or GEOMETRY_MATRIX=full npm test)
const test = require('node:test'), assert = require('node:assert/strict');

async function setup() {
  await (await import('../public/builder/kernel.mjs')).initKernel();
  return {
    ...(await import('../public/builder/geometry-rules.mjs')),
    ...(await import('../public/builder/catalog.mjs')),
    ...(await import('../public/builder/state.mjs')),
    ...(await import('../public/builder/design-rules.mjs')),
    T: await import('three'),
  };
}
const report = result => result.violations.map(v => `${v.rule}:${v.code}×${v.count} – ${v.details[0]}`).join('\n');
const codes = result => result.violations.map(v => v.code);

test('every style passes rules A–F with its default design, export included', async () => {
  const A = await setup();
  for (const style of A.OPTIONS.style) {
    const result = A.inspectDesign(A.stylePreset(style));
    assert.equal(result.valid, true, `${style}\n${report(result)}`);
  }
});

test('reported defect 1: Suspended Bridge, 1.5 ct round – the head is carried symmetrically, by both rails', async () => {
  const A = await setup(), {buildRing} = await import('../public/builder/model.mjs');
  const config = A.normalize({...A.stylePreset('tension'), shape: 'round', carat: 1.5});
  const result = A.inspectDesign(config);
  assert.equal(result.valid, true, report(result));
  const model = buildRing(config, null);
  try {
    // The reported ring had three posts on one rail and one on the other. The
    // head now grows out of the shank through one neck per rail, mirror images.
    model.group.updateMatrixWorld(true);
    const necks = []; model.group.traverse(o => { if (o.userData.role === 'head-base') necks.push(new A.T.Box3().setFromObject(o)); });
    assert.equal(necks.length, 2);
    const [front, back] = necks.sort((a, b) => b.max.z - a.max.z);
    for (const axis of ['x', 'y']) { assert.ok(Math.abs(front.min[axis] - back.min[axis]) < 1e-4); assert.ok(Math.abs(front.max[axis] - back.max[axis]) < 1e-4); }
    assert.ok(Math.abs(front.max.z + back.min.z) < 1e-4 && Math.abs(front.min.z + back.max.z) < 1e-4, 'necks mirrored across the band');
    assert.ok(Math.abs(front.min.x + front.max.x) < 1e-4, 'neck centred under the stone');
    // Four claws, or (keret) the four legs of the collar.
    const carriers = []; model.group.traverse(o => { if (['claw', 'post'].includes(o.userData.role)) carriers.push(o); });
    assert.equal(carriers.length, 4);
  } finally { model.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
});

test('reported defect 2: pavé grains stand between the stones, never inside one', async () => {
  const A = await setup(), {buildRing} = await import('../public/builder/model.mjs'), T = A.T;
  for (const patch of [{}, {accentRows: 2, width: 3}, {accentSize: 2, width: 4}, {coverage: 'full'}, {sideSpacing: .8}]) {
    const config = A.normalize({...A.stylePreset('pave'), ...patch});
    const result = A.inspectDesign(config, {exportCheck: false});
    assert.equal(result.valid, true, JSON.stringify(patch) + '\n' + report(result));
    const model = buildRing(config, null);
    try {
      model.group.updateMatrixWorld(true);
      const stones = model.gems.filter(g => g.userData.melee === 'pave').map(g => ({centre: g.getWorldPosition(new T.Vector3()), radius: g.getWorldScale(new T.Vector3()).x}));
      const grains = []; model.group.traverse(o => { if (o.userData.role === 'grain') grains.push(o); });
      assert.ok(stones.length > 0 && grains.length >= stones.length, 'pavé has grains');
      for (const grain of grains) {
        const tip = grain.userData.rod.points.at(-1).clone().applyMatrix4(grain.parent.matrixWorld);
        // The grain axis stays outside every girdle circle: it rises from metal beside the stone.
        for (const stone of stones) assert.ok(tip.distanceTo(stone.centre) > stone.radius * .98, 'grain axis inside a stone');
      }
    } finally { model.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
  }
});

test('the checker reports planted defects of every rule class', async () => {
  const A = await setup(), T = A.T;
  const inspect = (style, patch, mutate) => A.inspectDesign(A.normalize({...A.stylePreset(style), ...patch}), {exportCheck: false, mutate});
  const meshes = (raw, role) => { const found = []; raw.group.traverse(o => { if (o.isMesh && o.userData.role === role) found.push(o); }); return found; };
  // A: one cathedral shoulder removed → the elements are no longer mirrored.
  const row = {sideMode: 'pair', setting: 'claw'};
  let result = inspect('trilogy', row, raw => meshes(raw, 'shoulder')[0].removeFromParent());
  assert.ok(codes(result).includes('ELEMENTS_NOT_MIRRORED'), report(result));
  // A: one claw turned around the stone → uneven angles.
  result = inspect('solitaire', {shape: 'round'}, raw => { const claw = meshes(raw, 'claw')[0]; claw.geometry.rotateY(.3); claw.userData.rod.points.forEach(p => p.applyAxisAngle(new T.Vector3(0, 1, 0), .3)); });
  assert.ok(codes(result).includes('CLAWS_NOT_MIRRORED') || codes(result).includes('CLAWS_UNEVEN_ANGLES'), report(result));
  // B: the shoulders lifted off the shank → floating ends.
  result = inspect('trilogy', row, raw => { for (const o of meshes(raw, 'shoulder')) { o.geometry.translate(0, .9, 0); o.userData.rod.points.forEach(p => { p.y += .9; }); } });
  assert.ok(codes(result).includes('END_NOT_EMBEDDED') || codes(result).includes('NOT_ONE_CLOSED_SOLID'), report(result));
  // C: a pavé grain moved into its stone.
  result = inspect('pave', {}, raw => {
    const grain = meshes(raw, 'grain')[0], stone = raw.gems.find(g => g.userData.melee === 'pave');
    const shift = stone.position.clone().sub(grain.userData.rod.points.at(-1));
    grain.geometry.translate(shift.x, shift.y, shift.z); grain.userData.rod.points.forEach(p => p.add(shift));
  });
  assert.ok(codes(result).includes('METAL_THROUGH_STONE'), report(result));
  // C: a claw that starts under the stone.
  result = inspect('solitaire', {}, raw => { const claw = meshes(raw, 'claw')[0]; claw.geometry.scale(.6, 1, .6); claw.userData.rod.points.forEach(p => { p.x *= .6; p.z *= .6; }); });
  assert.ok(codes(result).includes('METAL_THROUGH_STONE') && codes(result).includes('CLAW_STARTS_INSIDE_GIRDLE'), report(result));
  // C: two stones pushed into each other.
  result = inspect('trilogy', {}, raw => { raw.mountings[1].assembly.position.copy(raw.mountings[0].assembly.position).x += .6; });
  assert.ok(codes(result).includes('STONES_INTERSECT') || codes(result).includes('METAL_THROUGH_STONE'), report(result));
  // D: something in the finger bore.
  result = inspect('solitaire', {}, raw => { const o = new T.Mesh(new T.SphereGeometry(.5, 12, 8), raw.metal); o.position.set(0, raw.radius - 1.1, 0); o.userData.role = 'milgrain'; raw.group.add(o); });
  assert.ok(codes(result).includes('BORE_OBSTRUCTED'), report(result));
  // D: a claw thinner than the limit.
  result = inspect('solitaire', {}, raw => { for (const claw of meshes(raw, 'claw')) {
    // Every vertex moves towards the claw's own centre line: the same claw, 40 % as thick.
    const path = claw.userData.rod.points, p = claw.geometry.attributes.position, v = new T.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const near = path.reduce((best, q) => q.distanceTo(v) < best.distanceTo(v) ? q : best); v.sub(near).multiplyScalar(.4).add(near); p.setXYZ(i, v.x, v.y, v.z); }
  } });
  assert.ok(codes(result).includes('CLAW_TOO_THIN'), report(result));
  // A: a claw whose tip lies flat across the crown is a hook.
  result = inspect('solitaire', {}, raw => { for (const claw of meshes(raw, 'claw')) { const p = claw.userData.rod.points; p.at(-1).y = p.at(-2).y; } });
  assert.ok(codes(result).includes('CLAW_HOOKED'), report(result));
  // A: a claw with a sharp corner in its sweep.
  result = inspect('solitaire', {}, raw => { const p = meshes(raw, 'claw')[0].userData.rod.points, i = p.length >> 1; p[i].x += .8; });
  assert.ok(codes(result).includes('CLAW_KINKED'), report(result));
});

test('shading normals: flat faces stay flat, real edges stay sharp, slivers do not tilt a surface', async () => {
  const A = await setup(), T = A.T, {creasedNormals} = await import('../public/builder/shading.mjs');
  const {mergeVertices} = await import('three/addons/utils/BufferGeometryUtils.js');
  const weld = g => { for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k); return mergeVertices(g, 1e-6); };
  // A cube: every corner normal is exactly its face normal.
  const cube = creasedNormals(weld(new T.BoxGeometry(2, 2, 2)));
  assert.equal(cube.attributes.position.count, 24);
  for (let i = 0; i < 24; i++) { const n = new T.Vector3().fromBufferAttribute(cube.attributes.normal, i); assert.ok(Math.max(Math.abs(n.x), Math.abs(n.y), Math.abs(n.z)) > .999999); }
  // A sphere: one normal per vertex, pointing away from the centre.
  const ball = creasedNormals(weld(new T.SphereGeometry(1, 48, 32)));
  for (let i = 0; i < ball.attributes.position.count; i++) {
    const p = new T.Vector3().fromBufferAttribute(ball.attributes.position, i), n = new T.Vector3().fromBufferAttribute(ball.attributes.normal, i);
    assert.ok(n.dot(p.normalize()) > .995);
  }
  // A finished ring: on the plain part of the shank no shading normal strays
  // from the true surface direction (it did, by tens of degrees, next to slivers).
  const result = A.inspectDesign(A.normalize(A.stylePreset('solitaire')), {exportCheck: false, keepModel: true});
  const metal = []; result.model.group.traverse(o => { if (o.userData.role === 'unified-metal') metal.push(o); });
  const g = metal[0].geometry, index = g.index.array, P = g.attributes.position, N = g.attributes.normal;
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), face = new T.Vector3(), n = new T.Vector3();
  let worst = 0, counted = 0;
  for (let i = 0; i < index.length; i += 3) {
    a.fromBufferAttribute(P, index[i]); b.fromBufferAttribute(P, index[i + 1]); c.fromBufferAttribute(P, index[i + 2]);
    if (Math.max(a.y, b.y, c.y) > 0) continue; // lower half of the ring: plain shank only
    face.crossVectors(b.clone().sub(a), c.clone().sub(a));
    if (face.length() < 1e-6) continue;
    face.normalize();
    for (const k of [0, 1, 2]) { worst = Math.max(worst, face.angleTo(n.fromBufferAttribute(N, index[i + k])) * 180 / Math.PI); counted++; }
  }
  assert.ok(counted > 1000 && worst < 12, `shank normals deviate by up to ${worst.toFixed(1)}°`);
  result.model.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
});

test('intentional asymmetry is declared, and only for styles that need it', async () => {
  const A = await setup();
  for (const style of ['solitaire', 'halo', 'pave', 'tension', 'split', 'trilogy', 'cathedral', 'bezel', 'hiddenhalo', 'eternity', 'band', 'bezelrow', 'graduated', 'dome', 'signet', 'stack'])
    assert.deepEqual({x: true, z: true}, (({x, z}) => ({x, z}))(A.expectedSymmetry(A.normalize({...A.stylePreset(style), shape: 'round'}))), style);
  for (const style of Object.keys(A.INTENTIONAL_ASYMMETRY)) assert.ok(A.OPTIONS.style.includes(style), style);
});

test('complete traversal of every combination (GEOMETRY_MATRIX=full)', {skip: process.env.GEOMETRY_MATRIX !== 'full'}, async () => {
  const A = await setup(), {matrix} = await import('../scripts/check-geometry-rules.mjs');
  const failures = [];
  for (const c of matrix()) { const result = A.inspectDesign(c.config, {exportCheck: c.label === 'default'}); if (!result.valid) failures.push(`${c.style} [${c.label}] ${codes(result).join(',')}`); }
  assert.deepEqual(failures, []);
});
