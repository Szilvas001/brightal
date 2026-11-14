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

test('reported defect 1: Suspended Bridge, 1.5 ct round – posts are mirrored, two per rail', async () => {
  const A = await setup(), {buildRing} = await import('../public/builder/model.mjs');
  const config = A.normalize({...A.stylePreset('tension'), shape: 'round', carat: 1.5});
  const result = A.inspectDesign(config);
  assert.equal(result.valid, true, report(result));
  const model = buildRing(config, null);
  try {
    const feet = model.contacts.map(c => Math.sign(c.start.z));
    assert.equal(model.contacts.length, 4);
    assert.equal(feet.filter(z => z > 0).length, 2);
    assert.equal(feet.filter(z => z < 0).length, 2);
    for (const c of model.contacts) assert.ok(model.contacts.some(o => Math.abs(o.start.x + c.start.x) < 1e-6 && Math.abs(o.start.z - c.start.z) < 1e-6), 'mirror post across x');
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
  // A: one support removed → posts and body are no longer mirrored.
  let result = inspect('solitaire', {}, raw => meshes(raw, 'support')[0].removeFromParent());
  assert.ok(codes(result).includes('SUPPORTS_NOT_MIRRORED') && codes(result).includes('BODY_NOT_MIRRORED'), report(result));
  // A: one claw turned around the stone → uneven angles.
  result = inspect('solitaire', {shape: 'round'}, raw => { const claw = meshes(raw, 'claw')[0]; claw.geometry.rotateY(.3); claw.userData.rod.points.forEach(p => p.applyAxisAngle(new T.Vector3(0, 1, 0), .3)); });
  assert.ok(codes(result).includes('CLAWS_NOT_MIRRORED') || codes(result).includes('CLAWS_UNEVEN_ANGLES'), report(result));
  // B: a support lifted off the shank → floating end.
  result = inspect('solitaire', {}, raw => { for (const o of meshes(raw, 'support')) { o.geometry.translate(0, .9, 0); o.userData.rod.points.forEach(p => { p.y += .9; }); } });
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
  result = inspect('trilogy', {}, raw => { raw.mountings[1].assembly.position.x *= .55; });
  assert.ok(codes(result).includes('STONES_INTERSECT') || codes(result).includes('METAL_THROUGH_STONE'), report(result));
  // D: something in the finger bore.
  result = inspect('solitaire', {}, raw => { const o = new T.Mesh(new T.SphereGeometry(.5, 12, 8), raw.metal); o.position.set(0, raw.radius - 1.1, 0); o.userData.role = 'milgrain'; raw.group.add(o); });
  assert.ok(codes(result).includes('BORE_OBSTRUCTED'), report(result));
  // D: a claw thinner than the limit.
  result = inspect('solitaire', {}, raw => { for (const claw of meshes(raw, 'claw')) { const tip = claw.userData.rod.points.at(-1); claw.geometry.translate(-tip.x, -tip.y, -tip.z).scale(.4, 1, .4).translate(tip.x, tip.y, tip.z); } });
  assert.ok(codes(result).includes('CLAW_TOO_THIN'), report(result));
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
