import * as T from "three";
import {getKernel} from "./kernel.mjs";
import {supportLayout} from "./support-layout.mjs";
import {hiddenHaloLayout} from "./halo-layout.mjs";
import {MIN_ROD_RADIUS,MIN_PRONG_RADIUS} from "./manufacturing-policy.mjs";
import {spacedOutline} from "./stone-spacing.mjs";
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
  const beadGeo = new T.SphereGeometry(1, 20, 12);
  const bead = (r, pos, parent = group, mat = head) => {
    const o = mesh(beadGeo, mat, pos, parent);
    o.scale.setScalar(Math.max(.16,r));
    return o;
  };
  const rodMeshes=new Map();
  const tube = (points, r, parent = group, mat = metal, closed = false) => {
    r=Math.max(MIN_ROD_RADIUS,r);
    const vectors=points.map(p=>new T.Vector3(...p));
    if(closed)return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(vectors,true,'centripetal'),Math.max(24,points.length*3),r,12,true),mat,null,parent);
    const keyFor=(sx,sz)=>JSON.stringify([r,points.map(([x,y,z])=>[x*sx,y,z*sz].map(v=>Math.round(v*1e8)/1e8))]);
    // Mirrored paths must reuse mirrored triangles as well. Independently
    // orienting a polygonal cylinder produces a different facet phase even
    // when its centreline is perfectly symmetric.
    for(const [sx,sz]of [[1,1],[-1,1],[1,-1],[-1,-1]]){
      const source=rodMeshes.get(keyFor(sx,sz));if(!source)continue;
      const geo=source.clone().applyMatrix4(new T.Matrix4().makeScale(sx,1,sz));
      if(sx*sz<0){const indices=Array.from(geo.index.array);for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];geo.setIndex(indices);}
      geo.computeVertexNormals();const path=new T.CurvePath();for(let i=1;i<vectors.length;i++)path.add(new T.LineCurve3(vectors[i-1],vectors[i]));geo.parameters={path};
      return mesh(geo,mat,null,parent);
    }
    // Construct open rods from unions of closed rounded segments. Sweeping a
    // thick tube around a tight bend can invert its inner surface even though
    // its edge counts still look closed after a Boolean operation.
    const {Manifold}=getKernel(),owned=[],own=o=>(owned.push(o),o),parts=[];
    try {
      for(const point of vectors)parts.push(own(own(Manifold.sphere(r,12)).translate(point.toArray())));
      for(let i=1;i<vectors.length;i++){
        const delta=vectors[i].clone().sub(vectors[i-1]);if(delta.length()<1e-8)continue;
        const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),delta.clone().normalize());
        const transform=new T.Matrix4().makeRotationFromQuaternion(q).setPosition(vectors[i-1]);
        parts.push(own(own(Manifold.cylinder(delta.length(),r,r,12)).transform(transform.elements)));
      }
      const solid=own(Manifold.union(parts)),data=solid.getMesh(),geo=new T.BufferGeometry(),xyz=[];
      for(let i=0;i<data.vertProperties.length;i+=data.numProp)xyz.push(...data.vertProperties.slice(i,i+3));
      geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setIndex(Array.from(data.triVerts));geo.computeVertexNormals();
      const path=new T.CurvePath();for(let i=1;i<vectors.length;i++)path.add(new T.LineCurve3(vectors[i-1],vectors[i]));geo.parameters={path};rodMeshes.set(keyFor(1,1),geo);
      return mesh(geo,mat,null,parent);
    }finally{owned.reverse().forEach(o=>o.delete());}
  };
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
    stonePlanes.set(o,planes);
    gems.push(o);
    return o;
  };
  const seat = (shape, scale, parent, y = -0.25, r = 0.12) => {
    r=Math.max(MIN_ROD_RADIUS,r);
    const points = Array.from({ length: 64 }, (_, i) => {
      const [x, z] = outline(shape, (i / 64) * Math.PI * 2);
      return [x * scale, y, z * scale];
    });
    if(shape==='marquise') {
      // A swept tube folds over itself at the two acute tips. Offset a planar
      // section instead, so even pointed seats are closed, non-crossing solids.
      const {CrossSection}=getKernel(),owned=[],own=o=>(owned.push(o),o);
      try {
        const section=own(new CrossSection([points.map(([x,,z])=>[x,z])]));
        const outer=own(section.offset(r,'Round',2,64)),inner=own(section.offset(-r,'Round',2,64));
        const rim=own(outer.subtract(inner)),solid=own(rim.extrude(2*r));
        const turned=own(solid.rotate([90,0,0])),placed=own(turned.translate([0,y+r,0]));
        const data=placed.getMesh(),geo=new T.BufferGeometry(),xyz=[];
        for(let i=0;i<data.vertProperties.length;i+=data.numProp)xyz.push(...data.vertProperties.slice(i,i+3));
        geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setIndex(Array.from(data.triVerts));geo.computeVertexNormals();
        return mesh(geo,head,null,parent);
      }finally{owned.reverse().forEach(o=>o.delete());}
    }
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
        const rib=tube([[x*scale*.72,-scale*.58,z*scale*.72],[x*scale*.94,-scale*.13,z*scale*.94],[x*scale*1.02,scale*.05,z*scale*1.02]],.09*fitting,assembly,head);
        rib.userData.role='setting-rib';
      }
    } else
      for (let i = 0; i < s.prongs; i++) {
        const a = (2 * Math.PI * (i + 0.5)) / s.prongs;
        // Keep the two claws physically separate at the girdle. A fixed
        // angle collapsed both claws together on small or elongated stones.
        const before = outline(shape, a - .001), after = outline(shape, a + .001);
        const tangentLength = Math.hypot(after[0] - before[0], after[1] - before[1]) / .002;
        const pairAngle = Math.min(Math.PI / s.prongs * .4, .18 / (scale * tangentLength));
        for (const delta of s.setting === "doubleclaw"
          ? [-pairAngle, pairAngle]
          : [0]) {
          const [x, z] = outline(shape, a + delta),
            tip = [x * scale * 0.995, scale * 0.12, z * scale * 0.995];
          const prong=tube(
            [
              [x * scale * 0.72, -scale * 0.58, z * scale * 0.72],
              [x * scale * 1.10, -scale * 0.28, z * scale * 1.10],
              [x * scale * 1.10, scale * 0.04, z * scale * 1.10],
              tip,
            ],
            Math.max(MIN_PRONG_RADIUS,(s.setting === "doubleclaw" ? 0.10 : 0.16) * fitting),
            assembly,
            head,
          );
          prong.userData.role='prong';
          const claw = bead(
            (s.setting === "doubleclaw" ? 0.11 : 0.15) * fitting,
            tip,
            assembly,
          );
          claw.scale.y *= 0.65;
        }
      }
    const gallery=seat(shape, scale * 0.72, assembly, -scale * 0.58, 0.16 * fitting);
    gallery.userData.role='gallery';
    mountings.push({assembly,shape,scale,gallery});
    return assembly;
  };
  const addHiddenHalo = (main, shape, size) => {
    const layout=hiddenHaloLayout(main,shape,size);
    seat(shape, layout.radius, main, layout.y, 0.18);
    for(let i=0;i<4;i++) {
      const [x,z]=outline(shape,i*Math.PI/2);
      tube([[x*size*.72,-size*.58,z*size*.72],[x*layout.radius,layout.y,z*layout.radius]],.085,main,head);
    }
    for (const point of layout.points) {
      const [x,z]=point.map(v=>v/layout.radius);
      const o = gem(
        "round",
        0.18,
        [x * layout.radius, layout.y, z * layout.radius],
        s.sideTone,
        false,
        main,
      );
      o.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        new T.Vector3(x, 0, z).normalize(),
      );
    }
  };
  const size = 2.4 * Math.cbrt(s.carat),
    top = radius + Math.max(size*.7, thick+size*.58+(s.accents!=='none'?s.accentSize*.14+.4:.2)) + s.height * .8;
  const rotation = s.orientation === "east" ? Math.PI / 2 : 0;
  if(DAILY_STYLES.includes(s.style)) {
    const scale=2.4*Math.cbrt(s.dailyCarat),r=radius+thick+scale*.7+s.height*.8;
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
      const first=setting(s.shape, size, [-gap, top, 0.65], s.gemTone, rotation - 0.23);
      const second=setting(s.sideShape, other, [gap, top - 0.35, -0.65], s.sideTone, 0.3);
      group.updateMatrixWorld(true);
      const leftBox=new T.Box3().setFromObject(first),rightBox=new T.Box3().setFromObject(second);
      const separation=Math.max(0,(leftBox.max.x-rightBox.min.x+.12)/2);
      first.position.x-=separation+(s.sideMainGap||0)*.4;second.position.x+=separation+(s.sideMainGap||0)*.4;
      if(s.hiddenHalo) {addHiddenHalo(first,s.shape,size);addHiddenHalo(second,s.sideShape,other);}
    } else {
      const main = setting(s.shape, size, [0, top, 0], s.gemTone, rotation);
      if (["halo", "vintage"].includes(s.style)) {
        const haloR = s.haloSize * 0.4;
        let previousHaloPoints=[];
        for (let row = 0; row < (s.halo === "double" ? 2 : 1); row++) {
          let perimeter = size + haloR * 1.25 + row * haloR * 2.1;
          const pointsAt=r=>spacedOutline(s.shape,r,haloR*2+(s.shape==='round'?.01:.08),56,Math.min(56,Math.max(18,Math.round(2*Math.PI*r/(haloR*2.15)))));
          let haloPoints=pointsAt(perimeter);
          // On pear and other non-circular cuts a radial row step is not the
          // actual stone-to-stone clearance. Check both rows in the XZ plane.
          for(let attempt=0;row&&attempt<100&&haloPoints.some(p=>previousHaloPoints.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<haloR*2+.04));attempt++){
            perimeter+=.02;haloPoints=pointsAt(perimeter);
          }
          previousHaloPoints=haloPoints;
          seat(s.shape, perimeter, main, -0.22, 0.12);
          for(let i=0;i<4;i++) {
            const [x,z]=outline(s.shape,i*Math.PI/2);
            tube([[x*size*.72,-size*.58,z*size*.72],[x*perimeter,-.22,z*perimeter]],.105,main,head);
          }
          for (const point of haloPoints) {
            const [x,z]=point.map(v=>v/perimeter);
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
      if (s.hiddenHalo) addHiddenHalo(main,s.shape,size);
      if (s.sideMode !== "none") {
        const scale = 2.4 * Math.cbrt(s.sideCarat),
          extent = rotation
            ? Math.max(
                ...Array.from({ length: 32 }, (_, i) =>
                  Math.abs(outline(s.shape, (i / 32) * Math.PI * 2)[1]),
                ),
              )
            : 1;
        main.updateWorldMatrix(true,true);
        const mainBox=new T.Box3().setFromObject(main);
        const mainExtent=Math.max(size*extent,Math.abs(mainBox.min.x),Math.abs(mainBox.max.x));
        const offset = mainExtent + scale * 1.2 + 0.25 + (s.sideMainGap || 0) * 0.8;
        const sideExtentZ=Math.max(...Array.from({length:64},(_,i)=>Math.abs(outline(s.sideShape,i/64*Math.PI*2)[1])));
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
                [sign * (offset + 0.3), y - 0.5, z * (scale * (sideExtentZ + .45) + .15 + (s.sideSpacing || 0) * 0.8)],
                s.sideTone,
              );
              satellite.rotation.z = sign * -0.14;
            }
          if (s.sideMode === "five") {
            const o = setting(
              s.sideShape,
              scale * 0.65,
              [sign * (offset + scale * 1.85 + (s.sideSpacing || 0) * 0.8), y - scale * 0.9, 0],
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
    const prongSpacing = (gemR * 2 + 0.11) / (radius + thick + .05);
    const spacing = (gemR * 2 + 0.11 + (s.sideSpacing || 0) * 0.8) / (radius + thick + .05),
      n = Math.floor(angleMax / spacing);
    const opening = isBand
      ? 0
      : Math.asin(
          Math.min(
            0.8,
            (size + (s.style === "duet" ? size * 0.5 : 0)) / (radius + thick + .05),
          ),
        );
    for (let i = -n; i <= n; i++) {
      const baseAngle = i * spacing;
      if (!isBand && Math.abs(baseAngle) < opening) continue;
      const a = baseAngle + (isBand ? 0 : Math.sign(i) * (s.sideMainGap || 0) * 0.8 / (radius + thick + .05));
      if (Math.abs(a) > angleMax) continue;
      const tracks=['split','tension'].includes(s.style)?[-1,1].map(sign=>sign*(width*.65+.55)*Math.pow(Math.max(0,Math.cos(a)),2)):[0];
      for(const track of tracks) for (let row = 0; row < s.accentRows; row++) {
        const w=['split','tension'].includes(s.style)?width*.55:width;
        const z = track + (s.accentRows === 1 ? 0 : (row - 0.5) * w * 0.48);
        const o = gem(
          s.accents === "channel" ? "princess" : "round",
          gemR,
          [Math.sin(a) * (radius + thick + .02), Math.cos(a) * (radius + thick + .02), z],
          s.sideTone,
        );
        o.rotation.z = -a;
        if (s.accents !== "channel")
          for (const shift of [-1, 1]) {
            bead(
              0.075,
              [
                Math.sin(a + Math.sign(a || 1) * prongSpacing * 0.5) * (radius + thick + .05),
                Math.cos(a + Math.sign(a || 1) * prongSpacing * 0.5) * (radius + thick + .05),
                z + shift * gemR * 0.7,
              ],
              group,
              metal,
            );
            tube([[Math.sin(a+Math.sign(a||1)*prongSpacing*.5)*radius,Math.cos(a+Math.sign(a||1)*prongSpacing*.5)*radius,z+shift*gemR*.7],[Math.sin(a+Math.sign(a||1)*prongSpacing*.5)*(radius+thick+.05),Math.cos(a+Math.sign(a||1)*prongSpacing*.5)*(radius+thick+.05),z+shift*gemR*.7]],.05,group,metal);
          }
      }
    }
    if(s.accents==='channel') {
      // Rails follow the actual stone rows, not the outer edge of a wide band.
      // Join each rail to the shank with a continuous web; otherwise a round
      // profile can leave two floating toruses above the curved shoulders.
      const split=['split','tension'].includes(s.style),w=width*(split?.55:1);
      for(const sign of split?[-1,1]:[0])for(let row=0;row<s.accentRows;row++)for(const edge of [-1,1]){
        const z=(s.accentRows===1?0:(row-.5)*w*.48)+edge*(gemR*.9+.08);
        const positions=[],indices=[],n=192,m=12;
        for(let i=0;i<n;i++)for(let j=0;j<m;j++){
          const a=i/n*Math.PI*2,b=j/m*Math.PI*2;
          const r=radius+thick*.45+(thick*.55+.05)*Math.cos(b);
          positions.push(Math.sin(a)*r,Math.cos(a)*r,sign*(width*.65+.55)*Math.pow(Math.max(0,Math.cos(a)),2)+z+bandShift(a)+.12*Math.sin(b));
          const k=i*m+j,q=i*m+(j+1)%m,next=((i+1)%n)*m+j,nextQ=((i+1)%n)*m+(j+1)%m;
          indices.push(k,q,next,q,nextQ,next);
        }
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
        mesh(geo,metal,null,group);
      }
    }
  }
  if (s.style === "vintage")
    for (let i = 0; i < 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      for (const z of [-width * 0.44, width * 0.44])
        bead(
          0.085,
          [Math.sin(a) * (radius + thick - .25), Math.cos(a) * (radius + thick - .25), z],
          group,
          metal,
        );
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
  for(const {assembly,shape,scale,gallery} of mountings) {
    const split=['split','tension'].includes(s.style);
    const routes=supportLayout({assembly,shape,scale,width,radius,split,bandShift,cathedral:s.style==='cathedral',pathClear});
    for(const {start,end,points,splitSign,r,clear} of routes){
      const support=tube(points.map(v=>v.toArray()),r,group,head);
      support.userData.stoneClearanceValid=clear;
      support.userData.role='structural-support';
      contacts.push({support,start,end,gallery,band:bands[split?(splitSign<0?0:1):0]});
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
