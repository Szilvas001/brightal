const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
test('mountings intersect real shank and gallery meshes at extreme sizes and rotations', async () => {
  const T=await import('three');
  const {buildRing}=await import('../public/builder/model.mjs');
  const {normalize}=await state();
  const direction=new T.Vector3(.371,.529,.763).normalize();
  const inside=(point,mesh)=>{
    const old=mesh.material.side;mesh.material.side=T.DoubleSide;
    const hits=new T.Raycaster(point,direction,0,100).intersectObject(mesh,false);
    mesh.material.side=old;
    return new Set(hits.map(h=>Math.round(h.distance*1e5))).size%2===1;
  };
  for(const style of ['solitaire','halo','trilogy','vintage','duet','cathedral','split'])
    for(const setting of ['claw','bezel','doubleclaw'])
      for(const extreme of [false,true]) {
        const model=buildRing(normalize({style,setting,shape:extreme?'pear':'emerald',orientation:extreme?'east':'north',carat:extreme?5:.3,size:extreme?44:72,height:extreme?2.5:.5,width:extreme?1.6:5,sideMode:'cluster',sideCarat:extreme?1.5:.1,hiddenHalo:true,halo:'double'}),null);
        assert.ok(model.contacts.length>=4,style);
        assert.equal(model.contacts.length,model.mountings.length*4);
        for(const contact of model.contacts) {
          assert.ok(inside(contact.start,contact.band),`${style}/${setting}: support must enter shank`);
          assert.ok(inside(contact.end,contact.gallery),`${style}/${setting}: support must enter gallery`);
          const path=contact.support.geometry.parameters.path;
          assert.ok(path.getPoint(0).distanceTo(contact.start)<1e-8);
          assert.ok(path.getPoint(1).distanceTo(contact.end)<1e-8);
        }
        const geo=new Set(),mat=new Set();model.group.traverse(o=>{if(o.isMesh){geo.add(o.geometry);mat.add(o.material);}});geo.forEach(g=>g.dispose());mat.forEach(m=>m.dispose());
      }
});
test("fashion controls change geometry and incompatible gemstone state is cleared", async () => {
  const { buildRing } = await import("../public/builder/model.mjs");
  const { normalize, FASHION_STYLES, description } = await state();
  const { FASHION_STYLES: rendered } =
    await import("../public/builder/fashion.mjs");
  assert.deepEqual(FASHION_STYLES, rendered);
  const controls = {
    wave: ["sculpt", 0.4, 2.5],
    rope: ["rhythm", 2, 8],
    dome: ["sculpt", 0.4, 2.5],
    signet: ["faceSize", 5, 11],
    open: ["gap", 0.3, 1.5],
    stack: ["layers", 2, 4],
  };
  for (const style of FASHION_STYLES) {
    const config = normalize({
      style,
      hiddenHalo: true,
      sideMode: "cluster",
      accents: "pave",
    });
    assert.equal(config.hiddenHalo, false);
    assert.equal(config.sideMode, "none");
    assert.equal(config.accents, "none");
    assert.ok(description(config).length < 1000);
    const [key, min, max] = controls[style];
    const signature = (value) => {
      const { group } = buildRing(normalize({ ...config, [key]: value }), null);
      let signature = 0,
        count = 0;
      const geo = new Set(),
        mat = new Set();
      group.traverse((o) => {
        if (!o.isMesh) return;
        count++;
        geo.add(o.geometry);
        mat.add(o.material);
        o.geometry.computeBoundingBox();
        const b = o.geometry.boundingBox;
        signature += b.max.x + b.max.y + b.max.z + o.position.y;
        const vertices = o.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 17)
          signature += vertices[i] * ((i % 97) + 1);
      });
      geo.forEach((g) => g.dispose());
      mat.forEach((m) => m.dispose());
      return `${count}/${signature}`;
    };
    assert.notEqual(signature(min), signature(max), style);
  }
});
test("advanced compatibility constraints and legacy hidden halos", async () => {
  const { normalize } = await state();
  assert.equal(normalize({ accents: "hidden" }).hiddenHalo, true);
  assert.equal(
    normalize({ style: "eternity", hiddenHalo: true }).hiddenHalo,
    false,
  );
  assert.equal(normalize({ style: "eternity" }).coverage, "full");
  assert.equal(normalize({ style: "trilogy" }).sideMode, "pair");
  assert.equal(normalize({ sideCarat: 0.35 }).sideCarat, 0.35);
  assert.equal(normalize({ sideCarat: 999 }).sideCarat, 1.5);
  const narrow = normalize({ width: 1.6, accentRows: 2, accentSize: 2 });
  assert.ok(narrow.accentSize * (narrow.accentRows + 0.4) <= narrow.width);
});
test("all styles and side layouts build finite renderable models", async () => {
  const { buildRing } = await import("../public/builder/model.mjs");
  const { OPTIONS, normalize } = await state();
  for (const style of OPTIONS.style)
    for (const sideMode of OPTIONS.sideMode) {
      const { group, gems } = buildRing(
        normalize({
          style,
          sideMode,
          hiddenHalo: true,
          accents: "pave",
          accentRows: 2,
        }),
        null,
      );
      let meshes = 0;
      const geometries = new Set(),
        materials = new Set();
      group.traverse((o) => {
        if (!o.isMesh) return;
        meshes++;
        assert.ok(
          Array.from(o.geometry.attributes.position.array).every(
            Number.isFinite,
          ),
          style,
        );
        assert.ok(o.scale.toArray().every(Number.isFinite), style);
        geometries.add(o.geometry);
        materials.add(o.material);
        if (o.userData.gem) {
          assert.ok(
            o.material.isShaderMaterial,
            "Every accent must trace refraction",
          );
          assert.ok(
            gems.includes(o),
            "Every stone must receive camera updates",
          );
          assert.ok(o.material.uniforms.count.value > 16);
        }
      });
      assert.ok(meshes >= 1, style);
      assert.equal(
        new Set(gems.map((g) => g.material.uniforms.localEye.value)).size,
        gems.length,
        "Stone-local eye coordinates must never be shared",
      );
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    }
});
// Load browser ESM in the CommonJS server project without altering its package type.
async function state() {
  return import(
    "data:text/javascript;base64," +
      Buffer.from(fs.readFileSync("public/builder/state.mjs", "utf8")).toString(
        "base64",
      )
  );
}
test("untrusted shared state is bounded and normalized", async () => {
  const { normalize, DEFAULT } = await state();
  assert.deepEqual(normalize(null), DEFAULT);
  const s = normalize({
    style: "unknown",
    carat: 999,
    width: -1,
    size: "invalid",
    prongs: 400,
    engraving: "x".repeat(400),
    metal: "javascript:alert(1)",
  });
  assert.equal(s.style, DEFAULT.style);
  assert.equal(s.carat, 5);
  assert.equal(s.width, 1.6);
  assert.equal(s.size, 54);
  assert.equal(s.prongs, 4);
  assert.equal(s.engraving.length, 24);
  assert.equal(s.metal, DEFAULT.metal);
});
test("preset and Unicode share round-trips preserve design", async () => {
  const { normalize, PRESETS, description } = await state();
  for (const p of PRESETS) {
    const s = normalize({ ...p.config, engraving: "Örökké ♡" });
    const encoded = new URLSearchParams({ design: JSON.stringify(s) });
    const decoded = normalize(
      JSON.parse(new URLSearchParams(encoded.toString()).get("design")),
    );
    assert.deepEqual(s, decoded);
    assert.ok(description(s).length < 1000);
  }
});
test("wedding band does not retain an invisible hidden halo", async () => {
  const { normalize } = await state();
  assert.equal(normalize({ style: "band", accents: "hidden" }).accents, "none");
});
test("all cuts produce finite closed outward-facing geometry within shader plane budget", async () => {
  const { gemGeometry: geometry } =
    await import("../public/builder/optics.mjs");
  const { OPTIONS } = await state();
  for (const shape of OPTIONS.shape) {
    const { geometry: g, planes } = geometry(shape);
    assert.ok(planes.length > 16 && planes.length <= 128, shape);
    const pos = g.attributes.position.array;
    assert.ok(Array.from(pos).every(Number.isFinite));
    for (const plane of planes) {
      assert.ok(plane.w > 0, shape);
      for (let i = 0; i < pos.length; i += 3)
        assert.ok(
          plane.x * pos[i] +
            plane.y * pos[i + 1] +
            plane.z * pos[i + 2] -
            plane.w <
            0.0001,
          shape + " must be convex for internal tracing",
        );
    }
    g.dispose();
  }
});
