import * as T from "three";
import {getKernel} from "./kernel.mjs";
import { buildContemporary, MODERN_STYLES } from './contemporary.mjs';
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { outline, gemGeometry, gemstoneMaterial } from "./optics.mjs";
import {CLEARANCE, GALLERY_Y, clearance, segmentClear, clawAngles, fitClaws, grainLayout, isMelee, postPath, rimHeight, ringFactor, rodRadius, symmetricRow} from './mounting.mjs';

export const METAL_COLORS = {
  yellow14: 0xf2d69b,
  yellow18: 0xf5cd83,
  white14: 0xe8e7e3,
  white18: 0xeeeae3,
  rose14: 0xf1c5ad,
  rose18: 0xeeb397,
  platinum: 0xe5e7eb,
};
const GRAIN = .165;               // grain / bead radius (0.41 mm diameter)
const HIDDEN_STONE = .32;         // hidden-halo melee radius (0.8 mm stones)
const HIDDEN_RAIL = HIDDEN_STONE * .75 + .1;

/** Independent procedural model: usable in scene, thumbnails and geometry tests.
 * Every metal mesh carries userData.role (and, where relevant, the stone it
 * holds and which rod ends must be embedded) for the geometry checker. */
export function buildRing(s, environment) {
  if (MODERN_STYLES.includes(s.style)) return buildContemporary(s, environment, METAL_COLORS);
  const group = new T.Group(),
    gems = [],
    materials = new Map();
  const mountings = [], contacts = [], bands = [], stonePlanes = new Map();
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
  // How far below the girdle the base of a claw head sits, in stone radii.
  const HEAD_DROP = 1.12;
  const tag = (o, role, holds, extra) => {
    o.userData.role = role;
    if (holds) o.userData.holds = holds;
    Object.assign(o.userData, extra || {});
    return o;
  };
  const solidMesh = (solid, mat, parent) => {
    const data = solid.getMesh(), geo = new T.BufferGeometry(), xyz = [];
    for (let i = 0; i < data.vertProperties.length; i += data.numProp) xyz.push(...data.vertProperties.slice(i, i + 3));
    geo.setAttribute('position', new T.Float32BufferAttribute(xyz, 3)); geo.setIndex(Array.from(data.triVerts)); geo.computeVertexNormals();
    return mesh(geo, mat, null, parent);
  };
  const beadGeo = new T.SphereGeometry(1, 20, 12);
  // One smooth, closed, tapering rod: a single swept surface with domed ends
  // (no joints, so no ridges), with a mirror-invariant tessellation.
  const rod = (points, radii, parent, mat) => {
    const {Manifold, Mesh} = getKernel(), sides = 20, path = points.map(p => new T.Vector3(...p)), n = path.length;
    const direction = i => path[Math.min(i + 1, n - 1)].clone().sub(path[Math.max(i - 1, 0)]).normalize();
    const xyz = [], index = [], rings = [];
    const reference = Math.abs(direction(0).y) > .999 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0);
    let u = reference.addScaledVector(direction(0), -reference.dot(direction(0))).normalize();
    const ring = (centre, tangent, radius, squeeze) => {
      u = u.clone().addScaledVector(tangent, -u.dot(tangent)).normalize();
      const v = new T.Vector3().crossVectors(tangent, u), first = xyz.length / 3;
      for (let j = 0; j < sides; j++) {
        const t = (j + .5) / sides * Math.PI * 2, offset = u.clone().multiplyScalar(Math.cos(t) * radius).addScaledVector(v, Math.sin(t) * radius);
        if (squeeze) offset.addScaledVector(squeeze.axis, offset.dot(squeeze.axis) * (squeeze.factor - 1));
        xyz.push(centre.x + offset.x, centre.y + offset.y, centre.z + offset.z);
      }
      rings.push(first);
    };
    const dome = (end, sign) => {
      const tangent = direction(end), steps = [1, 2, 3].map(k => k * Math.PI / 8);
      for (const a of sign < 0 ? steps.slice().reverse() : steps) ring(path[end].clone().addScaledVector(tangent, sign * radii[end] * Math.sin(a)), tangent, radii[end] * Math.cos(a));
    };
    dome(0, -1);
    for (let i = 0; i < n; i++) {
      const tangent = direction(i);
      let squeeze;
      if (i > 0 && i < n - 1) {
        // Mitre: keep the rod round along both legs of a bend.
        const before = path[i].clone().sub(path[i - 1]).normalize(), after = path[i + 1].clone().sub(path[i]).normalize(), bend = after.clone().sub(before);
        if (bend.lengthSq() > 1e-10) squeeze = {axis: bend.normalize(), factor: 1 / Math.max(.5, Math.sqrt((1 + before.dot(after)) / 2))};
      }
      ring(path[i], tangent, radii[i], squeeze);
    }
    dome(n - 1, 1);
    for (let k = 0; k + 1 < rings.length; k++) for (let j = 0; j < sides; j++) {
      const a = rings[k] + j, b = rings[k] + (j + 1) % sides, c = rings[k + 1] + j, d = rings[k + 1] + (j + 1) % sides;
      index.push(a, b, c, b, d, c);
    }
    const cap = (first, centre, flip) => {
      const apex = xyz.length / 3; xyz.push(centre.x, centre.y, centre.z);
      for (let j = 0; j < sides; j++) flip ? index.push(apex, first + (j + 1) % sides, first + j) : index.push(apex, first + j, first + (j + 1) % sides);
    };
    cap(rings[0], path[0].clone().addScaledVector(direction(0), -radii[0]), true);
    cap(rings.at(-1), path[n - 1].clone().addScaledVector(direction(n - 1), radii[n - 1]), false);
    let solid = new Manifold(new Mesh({numProp: 3, vertProperties: new Float32Array(xyz), triVerts: new Uint32Array(index)}));
    try {
      if (solid.status() !== 'NoError' || solid.volume() < 0) {
        // Opposite winding (depends on the frame's handedness): turn every triangle.
        solid.delete();
        for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
        solid = new Manifold(new Mesh({numProp: 3, vertProperties: new Float32Array(xyz), triVerts: new Uint32Array(index)}));
      }
      if (solid.status() !== 'NoError') throw new Error('Rod sweep is not a closed solid: ' + solid.status());
      const o = solidMesh(solid, mat, parent);
      o.userData.rod = {points: path, radius: Math.min(...radii), radii};
      return o;
    } finally { solid.delete(); }
  };
  const bead = (r, pos, parent = group, mat = head) => {
    const o = mesh(beadGeo, mat, pos, parent);
    o.scale.setScalar(Math.max(.16,r));
    o.userData.ball = {radius: Math.max(.16, r)};
    return o;
  };
  // Rods and closed rings are unions of rounded segments. Sweeping a thick
  // tube around a tight bend or an acute corner can fold its inner surface.
  const tube = (points, r, parent = group, mat = metal, closed = false) => {
    // `r` is one radius, or one radius per point for a tapered rod.
    const radii=points.map((_,i)=>Math.max(.16,Array.isArray(r)?r[i]:r)),tapered=Array.isArray(r);
    r=Math.min(...radii);
    const vectors=points.map(p=>new T.Vector3(...p));
    const {Manifold}=getKernel(),owned=[],own=o=>(owned.push(o),o),parts=[];
    try {
      // Orient the facets from a mirror-invariant reference, so mirrored rods
      // are exact mirror images down to their tessellation. The joint spheres
      // are turned with the rod as well: rods that start side by side then
      // never have coplanar facets or equators.
      const basis=(from,to)=>{
        const d=to.clone().sub(from).normalize(),reference=Math.abs(d.y)>.999?new T.Vector3(1,0,0):new T.Vector3(0,1,0);
        const u=reference.addScaledVector(d,-reference.dot(d)).normalize(),v=new T.Vector3().crossVectors(d,u);
        return new T.Matrix4().makeBasis(u,v,d);
      };
      const count=vectors.length;
      vectors.forEach((point,i)=>{
        const next=vectors[closed?(i+1)%count:Math.min(i+1,count-1)],previous=vectors[closed?(i+count-1)%count:Math.max(i-1,0)];
        const turn=next.distanceTo(previous)<1e-8?new T.Matrix4():basis(previous,next);
        parts.push(own(own(Manifold.sphere(radii[i],12)).transform(turn.setPosition(point).elements)));
      });
      for(let i=closed?0:1;i<count;i++){
        const k=(i+count-1)%count,from=vectors[k],length=vectors[i].distanceTo(from);if(length<1e-8)continue;
        parts.push(own(own(Manifold.cylinder(length,radii[k],radii[i],12)).transform(basis(from,vectors[i]).setPosition(from).elements)));
      }
      const o=solidMesh(own(Manifold.union(parts)),mat,parent);
      const path=new T.CurvePath();for(let i=1;i<vectors.length;i++)path.add(new T.LineCurve3(vectors[i-1],vectors[i]));o.geometry.parameters={path};
      o.userData[closed?'loop':'rod']={points:vectors,radius:r,...(tapered?{radii}:{})};
      return o;
    }finally{owned.reverse().forEach(o=>o.delete());}
  };
  const thick = s.thickness * .4,
    radius = (s.size / (2 * Math.PI)) * .8 + thick,
    width = s.width * .8,
    split = ["split","tension"].includes(s.style),
    // Each rail of a split shank keeps a manufacturable wall (1 mm guide).
    bandWidth = split ? Math.max(width * .55, 1.06 * .8) : width;
  const separation = a => (width * 0.65 + 0.55) * Math.pow(Math.max(0, Math.cos(a)), 2);
  // Cross-section of the shank: radius and axial offset at profile angle b
  // (b = 0 is the outside of the ring). Decorations use the same function, so
  // they sit on the real surface of every profile.
  // A plain shank under a claw head narrows gently towards the head, as on a
  // classic solitaire. Bands that carry stones, and split shanks, keep their width.
  const taperedShank = !split && s.accents === 'none' && s.setting !== 'bezel';
  const widthAt = a => bandWidth * (taperedShank ? 1 - .18 * Math.exp(-((Math.atan2(Math.sin(a), Math.cos(a)) / .55) ** 2)) : 1);
  const profilePoint = (b, a = Math.PI) => {
    const co = Math.cos(b), si = Math.sin(b), bandWidth = widthAt(a);
    return [radius + thick * (s.profile === "flat" ? Math.sign(co) * Math.pow(Math.abs(co), 0.35) : co),
      bandWidth * 0.5 * (s.profile === "knife" ? si * (0.62 + (0.38 * (1 - co)) / 2) : si)];
  };
  const band = (splitSign = 0) => {
    const vertices = [],
      indices = [],
      uN = 192,
      vN = 32;
    for (let i = 0; i <= uN; i++) {
      const a = (i / uN) * Math.PI * 2;
      for (let j = 0; j <= vN; j++) {
        const b = (j / vN) * Math.PI * 2;
        const [r, offset] = profilePoint(b, a), z = offset + splitSign * separation(a);
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
    const body = tag(mesh(smooth, metal), 'shank', null, {host: true});
    bands.push(body);
  };
  if (split) {
    band(-1);
    band(1);
  } else band();
  const cuts = new Map();
  const cut = shape => {
    if (!cuts.has(shape)) cuts.set(shape, gemGeometry(shape));
    return cuts.get(shape);
  };
  const gem = (
    shape,
    scale,
    pos,
    tone = "ice",
    hero = false,
    parent = group,
  ) => {
    const { geometry, planes } = cut(shape);
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
    o.userData.shape = shape;
    stonePlanes.set(o,planes);
    gems.push(o);
    return o;
  };
  const ringPoints = (shape, factor, y) => Array.from({ length: 64 }, (_, i) => {
    const [x, z] = outline(shape, (i / 64) * Math.PI * 2), k = typeof factor === 'function' ? factor(x, z) : factor;
    return [x * k, y, z * k];
  });
  // Closed horizontal wire following a cut's outline: a mitred sweep with a
  // mirror-invariant tessellation. Outlines with corners too sharp for the
  // wire radius (marquise tips) fall back to the union of rounded segments.
  const loop = (shape, factor, y, r, parent, mat = head) => {
    r = Math.max(.16, r);
    const points = ringPoints(shape, factor, y), n = points.length, sides = 12, xyz = [], index = [];
    let sweepable = true;
    for (let i = 0; i < n && sweepable; i++) {
      const a = points[(i + n - 1) % n], b = points[i], c = points[(i + 1) % n];
      const d1 = [b[0] - a[0], b[2] - a[2]], d2 = [c[0] - b[0], c[2] - b[2]], l1 = Math.hypot(...d1), l2 = Math.hypot(...d2);
      const cos = (d1[0] * d2[0] + d1[1] * d2[1]) / (l1 * l2), half = Math.acos(Math.min(1, Math.max(-1, cos))) / 2;
      if (r * Math.tan(half) > Math.min(l1, l2) * .45) { sweepable = false; break; }
      // In-plane normal of the mitre (bisector), stretched to keep the wire round along both segments.
      const tx = d1[0] / l1 + d2[0] / l2, tz = d1[1] / l1 + d2[1] / l2, tl = Math.hypot(tx, tz), nx = tz / tl, nz = -tx / tl, stretch = 1 / Math.cos(half);
      for (let j = 0; j < sides; j++) {
        const t = j / sides * Math.PI * 2;
        xyz.push(b[0] + nx * Math.cos(t) * r * stretch, b[1] + Math.sin(t) * r, b[2] + nz * Math.cos(t) * r * stretch);
        const k = i * sides + j, q = i * sides + (j + 1) % sides, next = ((i + 1) % n) * sides + j, nextQ = ((i + 1) % n) * sides + (j + 1) % sides;
        index.push(k, q, next, q, nextQ, next);
      }
    }
    if (!sweepable) return tube(points, r, parent, mat, true);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(xyz, 3)); geo.setIndex(index);
    // Outward orientation, whichever way the outline runs.
    let signed = 0; const p = geo.attributes.position;
    for (let i = 0; i < index.length; i += 3) {
      const [a, b, c] = [0, 1, 2].map(k => new T.Vector3().fromBufferAttribute(p, index[i + k]));
      signed += a.dot(b.cross(c));
    }
    if (signed < 0) { for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]]; geo.setIndex(index); }
    geo.computeVertexNormals();
    const o = mesh(geo, mat, null, parent);
    o.userData.loop = {points: points.map(q => new T.Vector3(...q)), radius: r};
    return o;
  };
  // Flat annular plate that follows a cut's outline: the seat of a melee row.
  const plate = (shape, factor, halfWidth, top, height, parent) => {
    const {CrossSection}=getKernel(),owned=[],own=o=>(owned.push(o),o);
    try {
      const section=own(new CrossSection([ringPoints(shape,factor,0).map(([x,,z])=>[x,z])]));
      const outer=own(section.offset(halfWidth,'Round',2,48)),inner=own(section.offset(-halfWidth,'Round',2,48));
      const solid=own(own(outer.subtract(inner)).extrude(height));
      return solidMesh(own(own(solid.rotate([90,0,0])).translate([0,top,0])),head,parent);
    }finally{owned.reverse().forEach(o=>o.delete());}
  };
  // A melee stone's grain: a bead that touches the girdle from outside, on a
  // peg that is embedded in the host metal.
  const grain = (anchor, g, parent, mat, holds) => tag(
    tube([anchor, g.position.map((v, i) => v + g.axis[i] * g.lift)], GRAIN, parent, mat),
    'grain', holds, {ends: [1, 0], melee: true});
  const grains = (row, options) => grainLayout(row, GRAIN, {planes: cut('round').planes, ...options});

  // One stone with its basket. The same construction serves centre stones,
  // side stones and cluster satellites, in every classic style:
  //   gallery ring → equally spaced posts → claw tips over the crown,
  //   or (bezel) posts that carry a seat ring and a rim on the crown edge.
  const setting = (shape, scale, pos, tone, rotation = 0, hero = true, hiddenHalo = false, centre = false) => {
    const assembly = new T.Group();
    assembly.position.set(...pos);
    assembly.rotation.y = rotation;
    group.add(assembly);
    const stone = gem(shape, scale, [0, 0, 0], tone, hero, assembly);
    stone.userData.set = s.setting;
    const {planes} = cut(shape), r = rodRadius(scale), melee = isMelee(scale), margin = (r + CLEARANCE) / scale;
    const railRadius = hiddenHalo ? Math.max(r, HIDDEN_RAIL) : r;
    const galleryK = Math.max(.72, ringFactor(shape, planes, GALLERY_Y, (railRadius + CLEARANCE) / scale));
    // A claw head has no basket ring of its own. The ring exists only where
    // something is carried on it: a bezel's posts, a hidden halo, a halo's ribs.
    // Side stones keep their small basket on posts; the classic head is the centre stone's.
    const classicHead = centre && s.setting !== "bezel";
    const basket = !classicHead || hiddenHalo || ["halo", "vintage"].includes(s.style);
    const gallery = basket ? tag(loop(shape, galleryK * scale, GALLERY_Y * scale, railRadius, assembly), 'gallery', stone, {melee, host: hiddenHalo}) : null;
    const posts = [];
    let baseCount = 8, stem = null;
    if (s.setting === "bezel") {
      const seatY = -(.018 + margin * 1.15), seatK = ringFactor(shape, planes, seatY, margin);
      const tipHeight = rimHeight(shape, planes, scale, r);
      for (let i = 0; i < 8; i++) {
        const post = postPath(shape, planes, i * Math.PI / 4, {scale, radius: r, galleryK, tipHeight, seat: {k: seatK, y: seatY}});
        posts.push(post);
        tag(tube(post.points, r, assembly, head), 'post', stone, {ends: [1, 1], melee});
      }
      tag(loop(shape, seatK * scale, seatY * scale, r, assembly), 'seat', stone, {melee});
      tag(loop(shape, (x, z) => scale - .9 * r / Math.hypot(x, z), tipHeight * scale, r, assembly), 'bezel', stone, {melee});
    } else if (!classicHead) {
      const fit = fitClaws(shape, scale, s.prongs, s.setting === "doubleclaw");
      baseCount = fit.count;
      for (const angle of clawAngles(shape, scale, fit.count, fit.double, r)) {
        const post = postPath(shape, planes, angle, {scale, radius: r, galleryK});
        posts.push(post);
        tag(tube(post.points, r, assembly, head), 'claw', stone, {ends: [1, 0], melee});
      }
    } else {
      // Classic claw head: every claw rises from one solid base under the
      // culet in a single smooth, tapering curve (thickest at the base), runs
      // up outside the girdle and bends only its tip over the crown. The base
      // itself is joined to the shank after all assemblies are placed.
      const fit = fitClaws(shape, scale, s.prongs, s.setting === "doubleclaw");
      baseCount = fit.count;
      const baseR = 1.6 * r, stemR = baseR * 1.2, spread = baseR * .4;
      const baseY = -HEAD_DROP * scale;
      stem = {y: baseY, radius: stemR};
      const wide = (baseR + CLEARANCE) / scale, free = p => clearance(planes, p.x / scale, p.y / scale, p.z / scale) * scale;
      const away = p => Math.hypot(p.x, p.z) > .05 * scale ? new T.Vector3(p.x, 0, p.z).normalize() : new T.Vector3(0, -1, 0);
      // A rod along straight legs with rounded corners, tapering from `from`
      // to `to`. The legs stay straight; a corner is rounded as far as the
      // stone allows, and if a leg itself would graze the stone, the inner
      // control points move outwards as a whole (never single samples, which
      // would leave the rod wavy). A claw's tip stays where it holds the stone.
      const sweep = (control, from, to, _count, keepLast) => {
        const points = control.map(p => new T.Vector3(...p));
        const build = fillet => {
          const path = [points[0].clone()];
          for (let i = 1; i < points.length - 1; i++) {
            const corner = points[i], before = points[i - 1], after = points[i + 1];
            const reach = Math.min(fillet, before.distanceTo(corner) * .45, after.distanceTo(corner) * .45);
            const start = corner.clone().add(before.clone().sub(corner).setLength(reach)), end = corner.clone().add(after.clone().sub(corner).setLength(reach));
            for (let k = 0; k <= 6; k++) { const t = k / 6; path.push(start.clone().multiplyScalar((1 - t) ** 2).addScaledVector(corner, 2 * t * (1 - t)).addScaledVector(end, t * t)); }
          }
          path.push(points.at(-1).clone());
          // Even spacing along the straight legs keeps the taper smooth.
          const dense = [path[0]];
          for (let i = 1; i < path.length; i++) {
            const steps = Math.max(1, Math.ceil(path[i].distanceTo(path[i - 1]) / (.35 * scale)));
            for (let k = 1; k <= steps; k++) dense.push(path[i - 1].clone().lerp(path[i], k / steps));
          }
          const lengths = [0];
          for (let i = 1; i < dense.length; i++) lengths.push(lengths[i - 1] + dense[i].distanceTo(dense[i - 1]));
          const radii = lengths.map(l => to + (from - to) * Math.pow(1 - l / lengths.at(-1), 1.4));
          const last = dense.length - 1;
          const clear = dense.every((p, i) => (keepLast && i === last) || (free(p) >= radii[i] + CLEARANCE + .03
            && (i === last || (keepLast && i + 1 === last) || free(p.clone().lerp(dense[i + 1], .5)) >= radii[i] + CLEARANCE + .03)));
          return {points: dense.map(p => p.toArray()), radii, clear};
        };
        let result;
        for (let push = 0; push < 80; push++) {
          for (const fillet of [2.2 * from, 1.4 * from, .8 * from, .4 * from]) { result = build(fillet); if (result.clear) return result; }
          for (let i = 1; i < points.length - (keepLast ? 2 : 1); i++) points[i].addScaledVector(away(points[i]), .012 * scale);
          if (keepLast && points.length > 2) { const shaftTop = points.at(-2); shaftTop.addScaledVector(away(shaftTop), .012 * scale); }
        }
        return result;
      };
      const direction = angle => { const [x, z] = outline(shape, angle), l = Math.hypot(x, z); return [x / l * spread, baseY, z / l * spread]; };
      // Where a claw meets the stone just under the girdle and hugs it: the
      // seat the stone rests in. Lower on a step cut whose pavilion is in the way.
      const hug = y => ringFactor(shape, planes, y, (1.2 * r + CLEARANCE + .02) / scale);
      const seatOf = (angle, foot) => {
        const [ox, oz] = outline(shape, angle);
        const y = [-.12, -.28, -.45].find(y => segmentClear(planes, foot.map(v => v / scale), [ox * hug(y), y, oz * hug(y)], wide)) ?? -.45;
        return [ox * hug(y) * scale, y * scale, oz * hug(y) * scale];
      };
      // Through the basket ring a hair off its centre line: two tubes that
      // share a centre point would meet in coincident facets.
      // The foot of a claw's upright part, just under the girdle.
      const shaftFoot = post => { const top = post.points.at(-2); return [top[0], -.03 * scale, top[2]]; };
      const throughRing = post => post.points[0].map((v, i) => i === 1 ? v - .007 * scale : v * 1.006);
      const angles = clawAngles(shape, scale, fit.count, fit.double, r);
      const claw = (angle, start, from) => {
        const post = postPath(shape, planes, angle, {scale, radius: r, galleryK});
        posts.push(post);
        const body = sweep([...start(post), ...post.points.slice(-2)], from, r, 22, true);
        tag(rod(body.points, body.radii, assembly, head), 'claw', stone, {ends: [1, 0], melee});
        // What stands near the claw (hidden-halo stones, halo rows) keeps clear of its real, tapered body.
        post.points = body.points; post.reach = from;
      };
      if (!fit.double) {
        for (const angle of angles) {
          const foot = direction(angle);
          claw(angle, post => basket ? [foot, throughRing(post), post.points[1]] : [foot, seatOf(angle, foot), shaftFoot(post)], baseR);
        }
      } else {
        // Double claws: each pair rises as ONE tapered trunk from the base and
        // forks into its two claws just under the girdle.
        for (let i = 0; i < angles.length; i += 2) {
          const centre = (angles[i] + angles[i + 1]) / 2, foot = direction(centre);
          const guide = postPath(shape, planes, centre, {scale, radius: r, galleryK});
          const fork = basket ? guide.points[1] : seatOf(centre, foot);
          const trunk = sweep(basket ? [foot, throughRing(guide), fork] : [foot, fork], baseR, 1.25 * r, 14, false);
          tag(rod(trunk.points, trunk.radii, assembly, head), 'post', stone, {ends: [1, 1], melee});
          const top = trunk.points.at(-1);
          posts.push({...guide, points: trunk.points, reach: baseR});
          for (const angle of [angles[i], angles[i + 1]]) claw(angle, post => {
            // Each branch leaves the trunk's end towards its own side (two rods
            // starting in the very same point would share coincident facets).
            const shaft = post.points.at(-2), side = new T.Vector3(shaft[0] - top[0], 0, shaft[2] - top[2]).normalize().multiplyScalar(.45 * r);
            return [[top[0] + side.x, top[1], top[2] + side.z], [shaft[0], Math.max(top[1] + .3 * r, -.03 * scale), shaft[2]]];
          }, 1.2 * r);
        }
      }
    }
    // Where the basket's posts stand (one angle per claw pair): anything else
    // that leaves the gallery starts there, clear of a hidden halo's stones.
    const postAngles = Array.from({length: baseCount}, (_, i) => s.setting === "bezel" ? i * Math.PI / 4 : 2 * Math.PI * (i + .5) / baseCount);
    const mount = {assembly, shape, scale, gallery, stone, galleryK, radius: r, melee, posts, planes, postAngles, stem};
    if (hiddenHalo) addHiddenHalo(mount);
    mountings.push(mount);
    return assembly;
  };
  // Hidden halo: the gallery ring itself becomes a pavé rail. Stones face
  // outwards between the posts; no stone is placed where a post passes.
  const addHiddenHalo = ({assembly, shape, scale, galleryK, posts}) => {
    const y = GALLERY_Y * scale, k = galleryK * scale;
    const samples = Array.from({length: 512}, (_, i) => outline(shape, i / 512 * Math.PI * 2).map(v => v * k));
    const frame = (x, z) => {
      let best = 0, distance = Infinity;
      samples.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - z); if (d < distance) { distance = d; best = i; } });
      const before = samples[(best + 511) % 512], after = samples[(best + 1) % 512];
      const along = new T.Vector3(after[0] - before[0], 0, after[1] - before[1]).normalize();
      const normal = new T.Vector3(along.z, 0, -along.x);
      if (normal.x * x + normal.z * z < 0) normal.negate();
      return {along, normal, anchor: [samples[best][0], y, samples[best][1]]};
    };
    const postSegments = posts.flatMap(p => p.points.slice(1).map((b, i) => new T.Line3(new T.Vector3(...p.points[i]), new T.Vector3(...b))));
    const row = [], nearest = new T.Vector3();
    for (const [x, z] of symmetricRow(shape, k, HIDDEN_STONE * 2 + .08, 48)) {
      const {along, normal} = frame(x, z);
      const centre = new T.Vector3(x, y, z).addScaledVector(normal, HIDDEN_RAIL - .03);
      const reach = posts.length ? Math.min(...postSegments.map(line => line.closestPointToPoint(centre, true, nearest).distanceTo(centre))) : Infinity;
      if (reach < HIDDEN_STONE * 1.05 + Math.max(...posts.map(p => p.reach ?? rodRadius(scale))) + .04) continue;
      const o = gem("round", HIDDEN_STONE, centre.toArray(), s.sideTone, false, assembly);
      o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), normal);
      o.userData.melee = 'hidden';
      row.push({centre: centre.toArray(), axis: normal.toArray(), along: along.toArray(), radius: HIDDEN_STONE, stone: o});
    }
    // Each grain stands on a peg that leaves the rail beside the stones: it is
    // anchored inside the rail, part-way towards the point straight behind it.
    if (row.length) for (const g of grains(row)) {
      const centre = frame(g.position[0], g.position[2]).anchor, behind = g.position.map((v, i) => v - g.axis[i] * (HIDDEN_RAIL - .03));
      grain(centre.map((v, i) => v + (behind[i] - v) * .55), g, assembly, head, row[0].stone);
    }
  };
  const size = 2.4 * Math.cbrt(s.carat),
    // The culet must clear the top of the ring body, whatever the stone size.
    // A claw head stands on its base: the base sits in the top of the shank.
    top = s.setting === "bezel"
      ? radius + Math.max(size * .7, thick + size * .7 + (s.accents !== 'none' ? s.accentSize * .14 + .32 : .12)) + s.height * 0.45
      : radius + thick * .5 + HEAD_DROP * size + (s.accents !== 'none' ? s.accentSize * .14 + .2 : 0) + s.height * 0.45;
  const rotation = s.orientation === "east" ? Math.PI / 2 : 0;
  const extentOf = object => { object.updateWorldMatrix(true, true); return new T.Box3().setFromObject(object); };
  if (s.style === "duet") {
    const other = 2.4 * Math.cbrt(s.sideCarat),
      gap = (size + other) * 0.54;
    const first=setting(s.shape, size, [-gap, top, 0.65], s.gemTone, rotation - 0.23, true, s.hiddenHalo, true);
    const second=setting(s.sideShape, other, [gap, top - 0.35, -0.65], s.sideTone, 0.3, true, s.hiddenHalo, true);
    const leftBox=extentOf(first),rightBox=extentOf(second);
    const apart=Math.max(0,(leftBox.max.x-rightBox.min.x+.12)/2);
    first.position.x-=apart+(s.sideMainGap||0)*.4;second.position.x+=apart+(s.sideMainGap||0)*.4;
  } else {
    const main = setting(s.shape, size, [0, top, 0], s.gemTone, rotation, true, s.hiddenHalo, true);
    const mainMount = mountings[0];
    if (["halo", "vintage"].includes(s.style)) {
      const haloR = s.haloSize * 0.4, r = mainMount.radius * 1.25; // the tapered claw is thicker below its tip
      // The halo starts outside the centre stone's claws, never through them.
      let ring = Math.max(size + haloR * 1.25, ...mainMount.posts.map(p => p.shaftK * size + (r + haloR + .04) / Math.hypot(...outline(s.shape, p.angle))));
      const depth = haloR * .7 + .42, rings = [];
      const row = [];
      let previous = [];
      for (let n = 0; n < (s.halo === "double" ? 2 : 1); n++) {
        const pitch = haloR * 2 + .04;
        // The second row stands far enough out that the grains between the
        // rows clear the stones of both rows, wherever they fall along the row.
        const reach = haloR + GRAIN + CLEARANCE;
        if (n) ring += Math.max(haloR * 2 + .06, Math.sqrt(reach * reach - pitch * pitch / 4) + reach + .01);
        let points = symmetricRow(s.shape, ring, pitch, 64);
        // The first row also keeps clear of the centre stone's claws: measured
        // stone by stone, because a scaled outline is not a constant offset.
        const shafts = mainMount.posts.map(p => { const [x, z] = outline(s.shape, p.angle); return [x * p.shaftK * size, z * p.shaftK * size]; });
        for (let attempt = 0; !n && attempt < 200 && points.some(p => shafts.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < haloR + r + .03)); attempt++) {
          ring += .02; points = symmetricRow(s.shape, ring, pitch, 64);
        }
        // On non-circular cuts a radial row step is not the stone-to-stone
        // clearance. Check both rows in the XZ plane.
        for (let attempt = 0; n && attempt < 100 && points.some(p => previous.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < pitch)); attempt++) {
          ring += .02; points = symmetricRow(s.shape, ring, pitch, 64);
        }
        previous = points;
        rings.push({ring, samples: ringPoints(s.shape, ring, 0).map(([x, , z]) => [x, z]), halfWidth: haloR * .6});
        // Tangent of the row at each stone, from the outline itself.
        points.forEach(([x, z]) => {
          const o = gem("round", haloR, [x, 0, z], s.sideTone, false, main);
          o.userData.melee = 'halo';
          const a = Math.atan2(z, x), e = .01, p = outline(s.shape, a + e), q = outline(s.shape, a - e);
          row.push({centre: [x, 0, z], axis: [0, 1, 0], along: [p[0] - q[0], 0, p[1] - q[1]], radius: haloR, stone: o, group: n});
        });
      }
      // The seat plate of each row is as wide as its outermost grain needs.
      const layout = row.length ? grains(row) : [];
      const distanceTo = (samples, x, z) => {
        let d = Infinity;
        for (let i = 0; i < samples.length; i++) {
          const a = samples[i], b = samples[(i + 1) % samples.length], ux = b[0] - a[0], uz = b[1] - a[1];
          const t = Math.min(1, Math.max(0, ((x - a[0]) * ux + (z - a[1]) * uz) / (ux * ux + uz * uz)));
          d = Math.min(d, Math.hypot(x - a[0] - t * ux, z - a[1] - t * uz));
        }
        return d;
      };
      for (const g of layout) {
        const distances = rings.map(r => distanceTo(r.samples, g.position[0], g.position[2]));
        const nearest = distances.indexOf(Math.min(...distances));
        rings[nearest].halfWidth = Math.max(rings[nearest].halfWidth, distances[nearest] + GRAIN + .04);
      }
      // Neighbouring rows share one continuous seat: their plates overlap
      // along the whole outline, also where an elongated cut spreads the rows.
      const spread = Math.max(...Array.from({length: 64}, (_, i) => Math.hypot(...outline(s.shape, i / 64 * Math.PI * 2))));
      for (let n = 1; n < rings.length; n++) {
        const need = (rings[n].ring - rings[n - 1].ring) * spread / 2 + .06;
        rings[n].halfWidth = Math.max(rings[n].halfWidth, need); rings[n - 1].halfWidth = Math.max(rings[n - 1].halfWidth, need);
      }
      rings.forEach(({ring, halfWidth}, n) => {
        tag(plate(s.shape, ring, Math.ceil(halfWidth * 50) / 50, 0, depth, main), 'melee-rail', null, {host: true});
        // Ribs join the gallery to the underside of the plate, below the culets.
        if (!n) for (const a of mainMount.postAngles) {
          const [x, z] = outline(s.shape, a);
          tag(tube([[x * mainMount.galleryK * size, GALLERY_Y * size, z * mainMount.galleryK * size], [x * ring, -(haloR * .7 + .2 + CLEARANCE), z * ring]], .2, main, head), 'rib', null, {ends: [1, 1], melee: true});
        }
      });
      for (const g of layout) grain([g.position[0], -depth / 2, g.position[2]], g, main, head, row[0].stone);
    }
    if (s.sideMode !== "none") {
      const scale = 2.4 * Math.cbrt(s.sideCarat), y = top - size * 0.22;
      const mainBox = extentOf(main), mainExtent = Math.max(Math.abs(mainBox.min.x), Math.abs(mainBox.max.x));
      for (const sign of [-1, 1]) {
        // Neighbouring baskets are placed by their measured extents, so the
        // claws of one stone never run through the stone beside it.
        const inward = box => sign > 0 ? -box.min.x : box.max.x, outward = box => sign > 0 ? box.max.x : -box.min.x;
        const side = setting(s.sideShape, scale, [0, y, 0], s.sideTone, 0, true);
        side.rotation.z = sign * -0.14;
        side.position.x = sign * (mainExtent + inward(extentOf(side)) + .06 + (s.sideMainGap || 0) * 0.8);
        const sideBox = extentOf(side);
        if (s.sideMode === "cluster")
          for (const z of [-1, 1]) {
            const satellite = setting("round", scale * 0.45, [side.position.x + sign * .3, y - 0.5, 0], s.sideTone);
            satellite.rotation.z = sign * -0.14;
            const box = extentOf(satellite);
            satellite.position.z = z * (Math.max(-sideBox.min.z, sideBox.max.z) + Math.max(-box.min.z, box.max.z) + .06 + (s.sideSpacing || 0) * 0.8);
          }
        if (s.sideMode === "five") {
          const o = setting(s.sideShape, scale * 0.65, [0, y - scale * 0.9, 0], s.sideTone, 0, false);
          o.rotation.z = sign * -0.4;
          o.position.x = sign * (outward(sideBox) + inward(extentOf(o)) + .06 + (s.sideSpacing || 0) * 0.8);
        }
      }
    }
  }
  if (["pave", "channel"].includes(s.accents)) {
    const gemR = s.accentSize * 0.4, surface = radius + thick + .02,
      angleMax =
        s.coverage === "full"
          ? Math.PI
          : s.coverage === "half"
            ? Math.PI / 2
            : 1.15;
    const spacing = (gemR * 2 + 0.11 + (s.sideSpacing || 0) * 0.8) / (radius + thick + .05),
      n = Math.floor(angleMax / spacing);
    // Accent stones begin beyond every basket: the posts of the centre and
    // side stones come down onto plain metal, never between or onto stones.
    const footprint = Math.max(size + (s.style === "duet" ? size * 0.5 : 0), ...mountings.map(m => { const box = extentOf(m.assembly); return Math.max(-box.min.x, box.max.x) + .1; }));
    const opening = Math.asin(Math.min(0.97, footprint / (radius + thick + .05)));
    // On a split shank each rail carries its own row while the rails are fully
    // apart, and one shared row once they have merged. No stone is set in the
    // short stretch where the rails are only partly merged: there is no seat.
    const rowHalf = gemR + (s.accentRows === 2 ? bandWidth * .24 : 0);
    const tracksAt = a => {
      if (!split) return [0];
      const apart = separation(a);
      return apart >= rowHalf + .06 ? [-apart, apart] : apart <= .04 ? [0] : [];
    };
    const row = [];
    for (let i = -n; i <= n; i++) {
      const baseAngle = i * spacing;
      if (Math.abs(baseAngle) < opening) continue;
      const a = baseAngle + Math.sign(i) * (s.sideMainGap || 0) * 0.8 / (radius + thick + .05);
      // A full circle closes at the palm side: the two ends keep one pitch apart.
      if (Math.abs(a) > (s.coverage === 'full' ? Math.PI - spacing / 2 : angleMax)) continue;
      for(const track of tracksAt(a)) for (let line = 0; line < s.accentRows; line++) {
        const z = track + (s.accentRows === 1 ? 0 : (line - 0.5) * bandWidth * 0.48);
        const o = gem(
          s.accents === "channel" ? "princess" : "round",
          gemR,
          [Math.sin(a) * surface, Math.cos(a) * surface, z],
          s.sideTone,
        );
        o.rotation.z = -a;
        o.userData.melee = s.accents;
        o.userData.onBand = true;
        row.push({centre: o.position.toArray(), axis: [Math.sin(a), Math.cos(a), 0], along: [Math.cos(a), -Math.sin(a), 0], radius: gemR, stone: o, group: Math.sign(track)});
      }
    }
    if (s.accents === "pave" && row.length) {
      // Grains stand on the band, in the gaps between the stones, and stay
      // inside the band's width.
      // A grain belongs to the rail of its stones and stays on that rail.
      const limit = ([x, y, z], rail) => {
        const track = rail * separation(Math.atan2(x, y)), room = Math.max(0, bandWidth / 2 - .02); // the grain's axis stays on the band
        return [x, y, track + Math.min(room, Math.max(-room, z - track))];
      };
      for (const g of grains(row, {limit})) {
        // The peg is rooted in the body of the rail, not at its thin edge.
        const a = Math.atan2(g.position[0], g.position[1]), track = g.group * separation(a), inside = bandWidth * .3;
        grain([Math.sin(a) * radius, Math.cos(a) * radius, track + Math.min(inside, Math.max(-inside, g.position[2] - track))], g, group, metal, row[0].stone);
      }
    }
    if(s.accents==='channel') {
      // Rails follow the actual stone rows, not the outer edge of a wide band.
      // Join each rail to the shank with a continuous web; otherwise a round
      // profile can leave two floating toruses above the curved shoulders.
      for(const sign of split?[-1,1]:[0])for(let line=0;line<s.accentRows;line++)for(const edge of [-1,1]){
        const z=(s.accentRows===1?0:(line-.5)*bandWidth*.48)+edge*(gemR*.9+.08);
        const positions=[],indices=[],count=192,m=12;
        for(let i=0;i<count;i++)for(let j=0;j<m;j++){
          const a=i/count*Math.PI*2,b=j/m*Math.PI*2;
          const r=radius+thick*.45+(thick*.55+.05)*Math.cos(b);
          positions.push(Math.sin(a)*r,Math.cos(a)*r,sign*separation(a)+z+.12*Math.sin(b));
          const k=i*m+j,q=i*m+(j+1)%m,next=((i+1)%count)*m+j,nextQ=((i+1)%count)*m+(j+1)%m;
          indices.push(k,q,next,q,nextQ,next);
        }
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
        tag(mesh(geo,metal,null,group),'rail',null,{host:true});
      }
    }
  }
  if (s.style === "vintage") {
    // Milgrain: a row of beads along both shoulders of the band, half sunk
    // into the surface of whichever profile is selected.
    const [edgeR, edgeZ] = profilePoint(1.08), [innerR, innerZ] = profilePoint(1.08 + .02);
    const slope = Math.hypot(innerR - edgeR, innerZ - edgeZ), normal = [(innerZ - edgeZ) / slope, -(innerR - edgeR) / slope];
    const beadR = edgeR - normal[0] * .07, beadZ = edgeZ - normal[1] * .07;
    for (let i = 0; i < 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      for (const side of [-1, 1])
        tag(bead(0.085, [Math.sin(a) * beadR, Math.cos(a) * beadR, side * beadZ], group, metal), 'milgrain');
    }
  }
  // Resolve supports only after every assembly rotation is final. Endpoints
  // are on the actual gallery and shank, not guessed in global coordinates.
  group.updateMatrixWorld(true);
  const obstacles=gems.map(g=>({inverse:g.matrixWorld.clone().invert(),scale:g.getWorldScale(new T.Vector3()).x,planes:stonePlanes.get(g),box:new T.Box3().setFromObject(g)}));
  const pathClear=(points,r)=>{
    const box=new T.Box3().setFromPoints(points).expandByScalar(r+.01);
    for(const stone of obstacles){
      if(!box.intersectsBox(stone.box))continue;
      const clearance=(r+.01)/stone.scale;
      const local=points.map(p=>p.clone().applyMatrix4(stone.inverse));
      for(let i=1;i<local.length;i++){
        let enter=0,exit=1;
        for(const plane of stone.planes){
          const distance=p=>plane.x*p.x+plane.y*p.y+plane.z*p.z-plane.w-clearance;
          const a=distance(local[i-1]),b=distance(local[i]);
          if(a>0&&b>0){enter=2;break;}
          if(a>0)enter=Math.max(enter,a/(a-b));
          if(b>0)exit=Math.min(exit,a/(a-b));
          if(enter>exit)break;
        }
        if(enter<=exit)return false;
      }
    }
    return true;
  };
  // Four posts carry every basket, one in each quadrant of the stone. All
  // four are described by the same canonical parameters and mapped into their
  // quadrant by mirroring, so the search for a clear route tries mirrored
  // candidates in the same order: a symmetric ring gets symmetric posts, and
  // on a split shank each rail receives exactly two of them.
  for(const {assembly,shape,scale,gallery,stone,galleryK,radius:r,stem} of mountings) {
    if(stem){
      // The base of a claw head grows out of the shank: one solid neck from
      // under the culet into the ring body (into both rails of a split shank).
      const centre=assembly.localToWorld(new T.Vector3(0,stem.y,0)),angle=Math.atan2(centre.x,centre.y);
      const tracks=split?[-separation(angle),separation(angle)]:[Math.min(bandWidth*.2,Math.max(-bandWidth*.2,centre.z))];
      const {Manifold}=getKernel();
      for(const track of tracks){
        const owned=[],own=o=>(owned.push(o),o);
        try{
          const upper=own(own(Manifold.sphere(stem.radius,24)).translate(centre.toArray()));
          const lower=own(own(Manifold.sphere(Math.min(thick*.9,bandWidth*.42),24)).translate([Math.sin(angle)*radius,Math.cos(angle)*radius,track]));
          tag(solidMesh(own(Manifold.hull([upper,lower])),head,group),'head-base',null,{melee:isMelee(scale)});
        }finally{owned.reverse().forEach(o=>o.delete());}
      }
      continue;
    }
    const quadrants=[[1,1],[-1,1],[-1,-1],[1,-1]];
    const route=([sx,sz],offset)=>{
      const quadrant=t=>sx>0?(sz>0?t:-t):(sz>0?Math.PI-t:Math.PI+t);
      const [x,z]=outline(shape,quadrant(Math.PI/4+offset));
      const end=assembly.localToWorld(new T.Vector3(x*scale*galleryK,GALLERY_Y*scale,z*scale*galleryK));
      const lean=Math.abs(end.x)>1e-6?Math.sign(end.x):sx,side=Math.abs(end.z)>1e-6?Math.sign(end.z):sz;
      const angle=Math.atan2(end.x,end.y);
      let fallback;
      // A narrow pavé band may require a foot between two neighbouring
      // accent stones, rather than directly beneath the gallery endpoint.
      for(const footOffset of [0,.06,-.06,.12,-.12,.2,.3]){
        const footAngle=angle+lean*footOffset;
        const track=split?side*separation(footAngle):0;
        for(const flank of [side,-side]){
          const start=new T.Vector3(Math.sin(footAngle)*radius,Math.cos(footAngle)*radius,track+flank*bandWidth*.2);
          for(const lift of [0,.4,.8,1.2]){
            const mid=start.clone().lerp(end,.5);
            mid.z=flank*(Math.max(Math.abs(start.z),Math.abs(end.z))+.12+lift);
            if(s.style==='cathedral')mid.y+=.3;
            const candidate={start,end,side,points:[start.clone(),mid,end.clone()]};
            fallback||=candidate;
            if(pathClear(candidate.points,r))return {...candidate,clear:true};
          }
        }
      }
      return {...fallback,clear:false};
    };
    // All four posts leave the basket at the same canonical position, mirrored
    // into their quadrants: when a neighbouring stone blocks one of them, the
    // attachment of all four moves together, so they stay evenly arranged.
    let routes;
    for(const offset of [0,.2,-.2,.4,-.4,.6,-.6]){
      const attempt=quadrants.map(q=>route(q,offset));
      routes||=attempt;
      if(attempt.every(a=>a.clear)){routes=attempt;break;}
    }
    for(const {start,end,side,points,clear} of routes){
      const support=tag(tube(points.map(v=>v.toArray()),r,group,head),'support',stone,{ends:[1,1],melee:isMelee(scale)});
      support.userData.stoneClearanceValid=clear;
      contacts.push({support,start,end,gallery,band:bands[split?(side<0?0:1):0]});
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
