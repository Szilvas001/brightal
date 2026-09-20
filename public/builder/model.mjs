import * as T from "three";
import {
  outline,
  gemGeometry,
  gemstoneMaterial,
  GEM_TONES,
} from "./optics.mjs";

export const METAL_COLORS = {
  yellow14: 0xd8b678,
  yellow18: 0xe7be74,
  white14: 0xd5d9df,
  white18: 0xe2e4e7,
  rose14: 0xdba58c,
  rose18: 0xe0a18a,
  platinum: 0xe5e7eb,
};

/** Independent procedural model: usable in scene, thumbnails and geometry tests. */
export function buildRing(s, environment) {
  const group = new T.Group(),
    gems = [],
    geometries = new Map(),
    materials = new Map();
  const metalFor = (key) => {
    if (!materials.has(key))
      materials.set(
        key,
        new T.MeshPhysicalMaterial({
          color: METAL_COLORS[key],
          metalness: 1,
          roughness:
            s.finish === "polished" ? 0.105 : s.finish === "satin" ? 0.29 : 0.4,
          clearcoat: s.finish === "polished" ? 0.28 : 0,
          anisotropy: s.finish === "brushed" ? 0.75 : 0,
        }),
      );
    return materials.get(key);
  };
  const metal = metalFor(s.metal),
    head = metalFor(s.headMetal === "match" ? s.metal : s.headMetal);
  const mesh = (geo, mat, pos, parent = group) => {
    const o = new T.Mesh(geo, mat);
    if (pos) o.position.set(...pos);
    parent.add(o);
    return o;
  };
  const beadGeo = new T.SphereGeometry(1, 12, 8);
  const bead = (r, pos, parent = group, mat = head) => {
    const o = mesh(beadGeo, mat, pos, parent);
    o.scale.setScalar(r);
    return o;
  };
  const tube = (points, r, parent = group, mat = metal, closed = false) =>
    mesh(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(
          points.map((p) => new T.Vector3(...p)),
          closed,
          "centripetal",
        ),
        Math.max(24, points.length * 3),
        r,
        8,
        closed,
      ),
      mat,
      null,
      parent,
    );
  const radius = (s.size / (2 * Math.PI)) * 0.8,
    width = s.width * 0.8,
    thick = 0.62,
    isBand = ["band", "eternity"].includes(s.style);
  const band = (splitSign = 0) => {
    const vertices = [],
      indices = [],
      uN = 160,
      vN = 20;
    for (let i = 0; i <= uN; i++) {
      const a = (i / uN) * Math.PI * 2;
      for (let j = 0; j <= vN; j++) {
        const b = (j / vN) * Math.PI * 2,
          co = Math.cos(b),
          si = Math.sin(b);
        const r =
          radius +
          thick *
            (s.profile === "flat"
              ? Math.sign(co) * Math.pow(Math.abs(co), 0.35)
              : co);
        const separation =
          splitSign *
          (width * 0.65 + 0.55) *
          Math.pow(Math.max(0, Math.cos(a)), 2);
        const w = width * (splitSign ? 0.55 : 1),
          z =
            w *
              0.5 *
              (s.profile === "knife"
                ? si * (0.62 + (0.38 * (1 - co)) / 2)
                : si) +
            separation;
        vertices.push(Math.sin(a) * r, Math.cos(a) * r, z);
        if (i < uN && j < vN) {
          const k = i * (vN + 1) + j;
          indices.push(k, k + 1, k + vN + 1, k + 1, k + vN + 2, k + vN + 1);
        }
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    mesh(geo, metal);
  };
  if (s.style === "split") {
    band(-1);
    band(1);
  } else band();
  const cuts = new Map();
  const gem = (
    shape,
    scale,
    pos,
    tone = "ice",
    hero = false,
    parent = group,
  ) => {
    if (!cuts.has(shape)) cuts.set(shape, gemGeometry(shape));
    const { geometry, planes } = cuts.get(shape);
    let mat;
    if (hero)
      mat = gemstoneMaterial(
        planes,
        environment,
        tone,
        s.color,
        s.light,
        s.fire,
      );
    else {
      const key = "gem-" + tone;
      if (!materials.has(key))
        materials.set(
          key,
          new T.MeshPhysicalMaterial({
            color: GEM_TONES[tone].color,
            roughness: 0.04,
            metalness: 0.15,
            clearcoat: 1,
            envMapIntensity: 2,
            ior: GEM_TONES[tone].ior,
          }),
        );
      mat = materials.get(key);
    }
    const o = mesh(geometry, mat, pos, parent);
    o.scale.setScalar(scale);
    o.userData.gem = true;
    o.userData.tone = tone;
    if (hero) gems.push(o);
    return o;
  };
  const seat = (shape, scale, parent, y = -0.25, r = 0.12) => {
    const points = Array.from({ length: 64 }, (_, i) => {
      const [x, z] = outline(shape, (i / 64) * Math.PI * 2);
      return [x * scale, y, z * scale];
    });
    return tube(points, r, parent, head, true);
  };
  const setting = (shape, scale, pos, tone, rotation = 0, hero = true) => {
    const assembly = new T.Group();
    assembly.position.set(...pos);
    assembly.rotation.y = rotation;
    group.add(assembly);
    gem(shape, scale, [0, 0, 0], tone, hero, assembly);
    if (s.setting === "bezel") {
      seat(shape, scale * 1.02, assembly, scale * 0.05, 0.16);
      seat(shape, scale * 0.94, assembly, -scale * 0.13, 0.13);
    } else
      for (let i = 0; i < s.prongs; i++) {
        const a = (2 * Math.PI * (i + 0.5)) / s.prongs;
        for (const delta of s.setting === "doubleclaw"
          ? [-0.055, 0.055]
          : [0]) {
          const [x, z] = outline(shape, a + delta),
            tip = [x * scale * 0.995, scale * 0.12, z * scale * 0.995];
          tube(
            [
              [x * scale * 0.36, -scale * 0.66, z * scale * 0.36],
              [x * scale * 0.8, -scale * 0.25, z * scale * 0.8],
              tip,
            ],
            s.setting === "doubleclaw" ? 0.07 : 0.11,
            assembly,
            head,
          );
          bead(s.setting === "doubleclaw" ? 0.11 : 0.15, tip, assembly);
        }
      }
    seat(shape, scale * 0.72, assembly, -scale * 0.32, 0.115);
    return assembly;
  };
  const size = 2.4 * Math.cbrt(s.carat),
    top = radius + size * 0.7 + s.height * 0.45;
  const rotation = s.orientation === "east" ? Math.PI / 2 : 0;
  if (!isBand) {
    if (s.style === "duet") {
      const other = 2.4 * Math.cbrt(s.sideCarat),
        gap = (size + other) * 0.54;
      setting(s.shape, size, [-gap, top, 0.65], s.gemTone, rotation - 0.23);
      setting(s.sideShape, other, [gap, top - 0.35, -0.65], s.sideTone, 0.3);
      tube(
        [
          [-radius * 0.7, radius * 0.6, 0],
          [-size, top - 1, 0],
          [0, top - 1.5, 0],
          [other, top - 1.2, 0],
          [radius * 0.7, radius * 0.6, 0],
        ],
        0.22,
      );
    } else {
      const main = setting(s.shape, size, [0, top, 0], s.gemTone, rotation);
      if (["halo", "vintage"].includes(s.style)) {
        const haloR = s.haloSize * 0.4;
        for (let row = 0; row < (s.halo === "double" ? 2 : 1); row++) {
          const perimeter = size + haloR * 1.25 + row * haloR * 2.1;
          const n = Math.min(
            56,
            Math.max(
              18,
              Math.round((2 * Math.PI * perimeter) / (haloR * 2.15)),
            ),
          );
          seat(s.shape, perimeter, main, -0.22, 0.12);
          for (let i = 0; i < n; i++) {
            const [x, z] = outline(s.shape, (2 * Math.PI * i) / n);
            gem(
              "round",
              haloR,
              [x * perimeter, 0, z * perimeter],
              s.sideTone,
              false,
              main,
            );
            bead(
              0.085,
              [x * (perimeter + haloR), -0.06, z * (perimeter + haloR)],
              main,
            );
          }
        }
      }
      if (s.hiddenHalo) {
        seat(s.shape, size * 0.78, main, -size * 0.36, 0.11);
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2,
            [x, z] = outline(s.shape, a);
          const o = gem(
            "round",
            0.18,
            [x * size * 0.78, -size * 0.33, z * size * 0.78],
            s.sideTone,
            false,
            main,
          );
          o.quaternion.setFromUnitVectors(
            new T.Vector3(0, 1, 0),
            new T.Vector3(x, 0, z).normalize(),
          );
        }
      }
      if (s.sideMode !== "none") {
        const scale = 2.4 * Math.cbrt(s.sideCarat),
          extent = rotation
            ? Math.max(
                ...Array.from({ length: 32 }, (_, i) =>
                  Math.abs(outline(s.shape, (i / 32) * Math.PI * 2)[1]),
                ),
              )
            : 1;
        const offset = size * extent + scale * 1.05 + 0.25;
        for (const sign of [-1, 1]) {
          const y = top - size * 0.22;
          const side = setting(
            s.sideShape,
            scale,
            [sign * offset, y, 0],
            s.sideTone,
            0,
            true,
          );
          side.rotation.z = sign * -0.14;
          tube(
            [
              [sign * radius * 0.72, radius * 0.65, 0],
              [sign * offset, y - scale * 0.75, 0],
              [sign * size * 0.7, top - size * 0.7, 0],
            ],
            0.19,
          );
          if (s.sideMode === "cluster")
            for (const z of [-1, 1])
              gem(
                "round",
                scale * 0.45,
                [sign * (offset + 0.3), y - 0.5, z * scale * 1.2],
                s.sideTone,
              );
          if (s.sideMode === "five") {
            const o = setting(
              s.sideShape,
              scale * 0.65,
              [sign * (offset + scale * 1.85), y - scale * 0.9, 0],
              s.sideTone,
              0,
              false,
            );
            o.rotation.z = sign * -0.4;
            tube(
              [
                [sign * radius * 0.85, radius * 0.4, 0],
                [sign * (offset + scale * 1.8), y - scale * 1.45, 0],
                [sign * offset, y - scale * 0.75, 0],
              ],
              0.14,
            );
          }
        }
      }
    }
    if (s.style === "cathedral")
      for (const sign of [-1, 1])
        for (const z of [-width * 0.32, width * 0.32])
          tube(
            [
              [sign * radius * 0.91, radius * 0.25, z],
              [sign * radius * 0.75, radius * 0.9, z],
              [sign * size * 0.55, top - size * 0.45, z],
            ],
            0.23,
          );
  }
  const hasPave = ["pave", "channel"].includes(s.accents);
  if (hasPave) {
    const gemR = s.accentSize * 0.4,
      angleMax =
        s.coverage === "full"
          ? Math.PI
          : s.coverage === "half"
            ? Math.PI / 2
            : 1.15;
    const spacing = (gemR * 2 + 0.11) / (radius + 0.65),
      n = Math.floor(angleMax / spacing);
    const opening = isBand
      ? 0
      : Math.asin(
          Math.min(
            0.8,
            (size + (s.style === "duet" ? size * 0.5 : 0)) / (radius + 0.65),
          ),
        );
    for (let i = -n; i <= n; i++) {
      const a = i * spacing;
      if (!isBand && Math.abs(a) < opening) continue;
      for (let row = 0; row < s.accentRows; row++) {
        const z = s.accentRows === 1 ? 0 : (row - 0.5) * width * 0.48;
        const o = gem(
          s.accents === "channel" ? "princess" : "round",
          gemR,
          [Math.sin(a) * (radius + 0.62), Math.cos(a) * (radius + 0.62), z],
          s.sideTone,
        );
        o.rotation.z = -a;
        if (s.accents !== "channel")
          for (const shift of [-1, 1])
            bead(
              0.075,
              [
                Math.sin(a + spacing * 0.46) * (radius + 0.65),
                Math.cos(a + spacing * 0.46) * (radius + 0.65),
                z + shift * gemR * 0.7,
              ],
              group,
              metal,
            );
      }
    }
    if (s.accents === "channel")
      for (const z of [-width * 0.44, width * 0.44]) {
        const rail = mesh(
          new T.TorusGeometry(radius + 0.55, 0.1, 8, 160),
          metal,
        );
        rail.position.z = z;
      }
  }
  if (s.style === "vintage")
    for (let i = 0; i < 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      for (const z of [-width * 0.44, width * 0.44])
        bead(
          0.085,
          [Math.sin(a) * (radius + 0.35), Math.cos(a) * (radius + 0.35), z],
          group,
          metal,
        );
    }
  // Geometry/materials created but unused in a particular permutation are released too.
  if (!group.getObjectByProperty("geometry", beadGeo)) beadGeo.dispose();
  for (const mat of materials.values()) {
    let used = false;
    group.traverse((o) => {
      if (o.material === mat) used = true;
    });
    if (!used) mat.dispose();
  }
  group.updateMatrixWorld(true);
  return { group, gems, radius, width, metal };
}
