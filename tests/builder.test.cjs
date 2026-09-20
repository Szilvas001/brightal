const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
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
  // Geometry-only extraction keeps tests independent of a WebGL/browser context.
  const src = fs.readFileSync("public/builder/renderer.js", "utf8");
  const geometryCode = src
    .slice(
      src.indexOf("export function outline"),
      src.indexOf("// Snell refraction"),
    )
    .replaceAll("export function", "function");
  const T = await import("three");
  const geometry = new Function("T", geometryCode + ";return gemGeometry;")(T);
  const { OPTIONS } = await state();
  for (const shape of OPTIONS.shape) {
    const { geometry: g, planes } = geometry(shape);
    assert.ok(planes.length > 16 && planes.length <= 64, shape);
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
