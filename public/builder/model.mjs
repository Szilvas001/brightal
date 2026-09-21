import * as T from "three";
import { buildContemporary, MODERN_STYLES } from './contemporary.mjs';
import { DAILY_STYLES } from "./state.mjs";
import { buildFashion, FASHION_STYLES } from "./fashion.mjs";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { outline, gemGeometry, gemstoneMaterial } from "./optics.mjs";

export const METAL_COLORS = {
  yellow14: 0xf2d69b,
  yellow18: 0xf5cd83,
  white14: 0xe8e7e3,
  white18: 0xeeeae3,
  rose14: 0xf1c5ad,
  rose18: 0xeeb397,
  platinum: 0xe5e7eb,
};

/** Independent procedural model: usable in scene, thumbnails and geometry tests. */
export function buildRing(s, environment) {
  if (MODERN_STYLES.includes(s.style)) return buildContemporary(s, environment, METAL_COLORS);
  if (FASHION_STYLES.includes(s.style)) {
    const material = (key) =>
      new T.MeshPhysicalMaterial({
        color: METAL_COLORS[key],
        metalness: 1,
        roughness:
          s.finish === "polished" ? 0.105 : s.finish === "satin" ? 0.29 : 0.4,
        anisotropy: s.finish === "brushed" ? 0.75 : 0,
      });
    return buildFashion(s, material(s.metal), material(s.secondaryMetal));
  }
  const group = new T.Group(),
    gems = [],
    materials = new Map();
  const mountings = [], contacts = [], bands = [];
  const metalFor = (key) => {
    if (!materials.has(key))
      materials.set(
        key,
        new T.MeshPhysicalMaterial({
          color: METAL_COLORS[key],
          metalness: 1,
          roughness:
            s.finish === "polished" ? 0.105 : s.finish === "satin" ? 0.29 : 0.4,
          // Bare polished metal, not a lacquer-coated plastic surface.
          clearcoat: 0,
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
  const beadGeo = new T.SphereGeometry(1, 20, 12);
  const bead = (r, pos, parent = group, mat = head) => {
    const o = mesh(beadGeo, mat, pos, parent);
    o.scale.setScalar(Math.max(.16,r));
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
        Math.max(.16,r),
        12,
        closed,
      ),
      mat,
      null,
      parent,
    );
  const thick = s.thickness * .4,
    radius = (s.size / (2 * Math.PI)) * .8 + thick,
    width = s.width * .8,
    isBand = ["band", "eternity", ...DAILY_STYLES].includes(s.style);
  const bandShift = a => {
    const top = Math.pow(Math.max(0, Math.cos(a)), 4);
    if(s.style==='chevron') return top*s.sculpt;
    if(s.style==='crown') return -top*s.sculpt;
    if(s.style==='ribbon') return Math.sin(a*2)*s.sculpt*.55;
    return 0;
  };
  const band = (splitSign = 0) => {
    const vertices = [],
      indices = [],
      uN = 192,
      vN = 32;
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
            separation + bandShift(a);
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
    // Weld the sweep's coincident seams before averaging normals: no false
    // dark line at the bottom of the band or along its polished profile.
    const smooth = mergeVertices(geo, 0.00001);
    smooth.computeVertexNormals();
    geo.dispose();
    const body = mesh(smooth, metal);
    body.userData.role = 'shank';
    bands.push(body);
  };
  if (["split","tension"].includes(s.style)) {
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
    // Every stone uses the identical facet-tracing optical pipeline, including
    // tiny pavé and hidden halos. Uniforms are per stone (camera in local space).
    const mat = gemstoneMaterial(
      planes,
      environment,
      tone,
      s.color,
      s.light,
      s.fire,
    );
    const o = mesh(geometry, mat, pos, parent);
    o.scale.setScalar(scale);
    o.userData.gem = true;
    o.userData.tone = tone;
    o.userData.hero = hero;
    gems.push(o);
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
    const fitting = Math.min(1, Math.max(0.4, scale / 1.5));
    const assembly = new T.Group();
    assembly.position.set(...pos);
    assembly.rotation.y = rotation;
    group.add(assembly);
    gem(shape, scale, [0, 0, 0], tone, hero, assembly);
    if (s.setting === "bezel") {
      seat(shape, scale * 1.02, assembly, scale * 0.05, 0.16 * fitting);
      seat(shape, scale * 0.94, assembly, -scale * 0.13, 0.13 * fitting);
      for(let i=0;i<8;i++) {
        const [x,z]=outline(shape,i*Math.PI/4);
        tube([[x*scale*.72,-scale*.32,z*scale*.72],[x*scale*.94,-scale*.13,z*scale*.94],[x*scale*1.02,scale*.05,z*scale*1.02]],.09*fitting,assembly,head);
      }
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
              [x * scale * 0.72, -scale * 0.32, z * scale * 0.72],
              tip,
            ],
            (s.setting === "doubleclaw" ? 0.07 : 0.11) * fitting,
            assembly,
            head,
          );
          const claw = bead(
            (s.setting === "doubleclaw" ? 0.11 : 0.15) * fitting,
            tip,
            assembly,
          );
          claw.scale.y *= 0.65;
        }
      }
    const gallery=seat(shape, scale * 0.72, assembly, -scale * 0.32, 0.115 * fitting);
    gallery.userData.role='gallery';
    mountings.push({assembly,shape,scale,gallery});
    return assembly;
  };
  const size = 2.4 * Math.cbrt(s.carat),
    top = radius + size * 0.7 + s.height * 0.45;
  const rotation = s.orientation === "east" ? Math.PI / 2 : 0;
  if(DAILY_STYLES.includes(s.style)) {
    const scale=2.4*Math.cbrt(s.dailyCarat),r=radius+thick+scale*.7+s.height*.18;
    const step=2*Math.asin(Math.min(.9,(scale*1.7+.18+s.dailySpacing)/r));
    for(let i=0;i<s.dailyCount;i++) {
      const a=(i-(s.dailyCount-1)/2)*step;
      const z=bandShift(a)+(s.style==='scatter'?(i%2?1:-1)*width*.48:0);
      const cut=s.style==='alternating'&&i%2?s.sideShape:s.shape;
      const stoneScale=s.style==='graduated'?scale*(1-.35*Math.abs(i-(s.dailyCount-1)/2)/Math.max(1,(s.dailyCount-1)/2)):scale;
      const turn=s.style==='eastwest'?Math.PI/2:s.style==='crown'?a*.45:rotation;
      const assembly=setting(cut,stoneScale,[Math.sin(a)*r,Math.cos(a)*r,z],s.alternateGems&&i%2?s.sideTone:s.gemTone,turn);
      assembly.rotation.z=-a;
    }
  }
  if (!isBand) {
    if (s.style === "duet") {
      const other = 2.4 * Math.cbrt(s.sideCarat),
        gap = (size + other) * 0.54;
      setting(s.shape, size, [-gap, top, 0.65], s.gemTone, rotation - 0.23);
      setting(s.sideShape, other, [gap, top - 0.35, -0.65], s.sideTone, 0.3);
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
          for(let i=0;i<4;i++) {
            const [x,z]=outline(s.shape,i*Math.PI/2);
            tube([[x*size*.72,-size*.32,z*size*.72],[x*perimeter,-.22,z*perimeter]],.105,main,head);
          }
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
            tube([[x*perimeter,-.22,z*perimeter],[x*(perimeter+haloR),-.06,z*(perimeter+haloR)]],.065,main,head);
          }
        }
      }
      if (s.hiddenHalo) {
        seat(s.shape, size * 0.78, main, -size * 0.36, 0.11);
        for(let i=0;i<4;i++) {
          const [x,z]=outline(s.shape,i*Math.PI/2);
          tube([[x*size*.72,-size*.32,z*size*.72],[x*size*.78,-size*.36,z*size*.78]],.085,main,head);
        }
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
          if (s.sideMode === "cluster")
            for (const z of [-1, 1]) {
              const satellite = setting(
                "round",
                scale * 0.45,
                [sign * (offset + 0.3), y - 0.5, z * scale * 1.2],
                s.sideTone,
              );
              satellite.rotation.z = sign * -0.14;
            }
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
          }
        }
      }
    }
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
      const tracks=['split','tension'].includes(s.style)?[-1,1].map(sign=>sign*(width*.65+.55)*Math.pow(Math.max(0,Math.cos(a)),2)):[0];
      for(const track of tracks) for (let row = 0; row < s.accentRows; row++) {
        const w=['split','tension'].includes(s.style)?width*.55:width;
        const z = track + (s.accentRows === 1 ? 0 : (row - 0.5) * w * 0.48);
        const o = gem(
          s.accents === "channel" ? "princess" : "round",
          gemR,
          [Math.sin(a) * (radius + 0.62), Math.cos(a) * (radius + 0.62), z],
          s.sideTone,
        );
        o.rotation.z = -a;
        if (s.accents !== "channel")
          for (const shift of [-1, 1]) {
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
            tube([[Math.sin(a+spacing*.46)*radius,Math.cos(a+spacing*.46)*radius,track],[Math.sin(a+spacing*.46)*(radius+.65),Math.cos(a+spacing*.46)*(radius+.65),z+shift*gemR*.7]],.05,group,metal);
          }
      }
    }
    if (s.accents === "channel" && s.style!=='split')
      for (const z of [-width * 0.44, width * 0.44]) {
        const rail = mesh(
          new T.TorusGeometry(radius + 0.55, 0.1, 8, 160),
          metal,
        );
        rail.position.z = z;
      }
    if(s.accents==='channel'&&s.style==='split') for(const sign of [-1,1]) for(const edge of [-1,1])
      tube(Array.from({length:128},(_,i)=>{const a=i/128*Math.PI*2;return [Math.sin(a)*(radius+.4),Math.cos(a)*(radius+.4),sign*(width*.65+.55)*Math.pow(Math.max(0,Math.cos(a)),2)+edge*width*.55*.44];}),.1,group,metal,true);
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
  // Resolve supports only after every assembly rotation is final. Endpoints
  // are on the actual gallery and shank, not guessed in global coordinates.
  group.updateMatrixWorld(true);
  for(const {assembly,shape,scale,gallery} of mountings) {
    for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
      const [x,z]=outline(shape,a);
      const end=assembly.localToWorld(new T.Vector3(x*scale*.72,-scale*.32,z*scale*.72));
      const angle=Math.atan2(end.x,end.y);
      const splitSign=end.z<0?-1:1;
      const track=['split','tension'].includes(s.style)?splitSign*(width*.65+.55)*Math.pow(Math.max(0,Math.cos(angle)),2):bandShift(angle);
      const start=new T.Vector3(Math.sin(angle)*radius,Math.cos(angle)*radius,track);
      const mid=start.clone().lerp(end,.5);
      if(s.style==='cathedral') mid.y+=.3;
      const support=tube([start.toArray(),mid.toArray(),end.toArray()],Math.min(.22,Math.max(.10,scale*.075)),group,head);
      support.userData.role='structural-support';
      contacts.push({support,start,end,gallery,band:bands[['split','tension'].includes(s.style)?(splitSign<0?0:1):0]});
    }
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
  return { group, gems, radius, width, metal, contacts, mountings };
}
