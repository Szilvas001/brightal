const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
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
      Buffer.from(fs.readFileSync("public/builder/state.js", "utf8")).toString(
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
