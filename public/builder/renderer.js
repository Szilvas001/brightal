import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Closed, convex faceted cuts. Coordinates are in millimetre-proportional units.
export function outline(shape, a) {
  let x = Math.cos(a),
    z = Math.sin(a);
  if (shape === "oval") z *= 1.35;
  if (shape === "marquise") {
    x *= 0.78;
    z *= 1.65;
    x *= 0.68 + 0.32 * Math.abs(x);
  }
  if (shape === "pear") {
    x *= 0.82 * (1 - 0.3 * z);
    z *= 1.42;
  }
  if (["princess", "cushion", "emerald", "radiant"].includes(shape)) {
    const power = shape === "cushion" ? 0.5 : 0.24;
    x = Math.sign(x) * Math.pow(Math.abs(x), power) * 0.9;
    z =
      Math.sign(z) *
      Math.pow(Math.abs(z), power) *
      (shape === "emerald" || shape === "radiant" ? 1.25 : 0.9);
  }
  return [x, z];
}
export function gemGeometry(shape) {
  const n = 16,
    vertices = [],
    planes = [];
  const p = (i, r, y) => {
    const [x, z] = outline(shape, (2 * Math.PI * i) / n);
    return new T.Vector3(x * r, y, z * r);
  };
  const face = (a, b, c) => {
    let normal = new T.Vector3()
      .subVectors(b, a)
      .cross(new T.Vector3().subVectors(c, a))
      .normalize();
    if (normal.dot(a) < 0) {
      [b, c] = [c, b];
      normal.negate();
    }
    vertices.push(...a.toArray(), ...b.toArray(), ...c.toArray());
    const plane = new T.Vector4(normal.x, normal.y, normal.z, normal.dot(a));
    if (
      !planes.some(
        (q) =>
          Math.abs(q.x - plane.x) +
            Math.abs(q.y - plane.y) +
            Math.abs(q.z - plane.z) +
            Math.abs(q.w - plane.w) <
          0.0001,
      )
    )
      planes.push(plane);
  };
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    face(new T.Vector3(0, 0.36, 0), p(j, 0.53, 0.36), p(i, 0.53, 0.36));
    face(p(i, 0.53, 0.36), p(j, 0.53, 0.36), p(i, 1, 0));
    face(p(j, 0.53, 0.36), p(j, 1, 0), p(i, 1, 0));
    face(p(i, 1, 0), p(j, 1, 0), new T.Vector3(0, -0.7, 0));
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return { geometry, planes };
}

// Snell refraction, Fresnel reflectance and up to five internal facet bounces.
// Spectral exit offsets approximate dispersion; this is a real-time preview, not optical CAD.
const vertex = `varying vec3 p; varying vec3 n; varying vec3 eye; uniform vec3 localEye;
void main(){p=position;n=normal;eye=localEye;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment = `precision highp float;
varying vec3 p; varying vec3 n; varying vec3 eye;
uniform vec4 planes[64]; uniform int count; uniform mat3 worldRotation; uniform vec3 tint; uniform float mood;
vec3 studio(vec3 d){
 d=normalize(worldRotation*d);
 vec3 base=mix(vec3(.075,.09,.12),vec3(.8,.84,.9),smoothstep(-.4,.9,d.y));
 float box=pow(max(0.,dot(d,normalize(vec3(-.6,.8,.5)))),22.);
 float strip=pow(max(0.,dot(d,normalize(vec3(.9,.25,-.4)))),90.);
 float point=pow(max(0.,dot(d,normalize(vec3(-.4,.3,-.8)))),260.);
 return base*.8+vec3(1.0,.96,.88)*box*4.+vec3(.8,.9,1.)*strip*5.+vec3(1.,.87,.7)*point*(5.+mood*5.);
}
void main(){
 vec3 normal=normalize(n),incident=normalize(p-eye);
 float f=.172+(1.-.172)*pow(1.-max(0.,dot(-incident,normal)),5.);
 vec3 result=studio(reflect(incident,normal))*f;
 vec3 ray=refract(incident,normal,1./2.417),pos=p+ray*.002;
 float energy=1.-f;
 for(int bounce=0;bounce<5;bounce++){
   float nearest=10000.;vec3 hitNormal=normal;
   for(int i=0;i<64;i++){
     if(i>=count)break;
     float denom=dot(planes[i].xyz,ray);
     if(denom>.0001){float t=(planes[i].w-dot(planes[i].xyz,pos))/denom;
       if(t>.0001&&t<nearest){nearest=t;hitNormal=planes[i].xyz;}}
   }
   if(nearest>9000.)break;
   pos+=ray*nearest;
   vec3 outRay=refract(ray,-hitNormal,2.417);
   if(dot(outRay,outRay)>.01){
     vec3 red=refract(ray,-hitNormal,2.407),blue=refract(ray,-hitNormal,2.435);
     vec3 spectrum=vec3(studio(length(red)>.01?red:outRay).r,studio(outRay).g,studio(length(blue)>.01?blue:outRay).b);
     result+=spectrum*energy*.82;energy*=.18;
   }
   ray=reflect(ray,hitNormal);pos+=ray*.002;
 }
 result+=studio(ray)*energy*.5;
 gl_FragColor=vec4(result*tint,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export class RingRenderer {
  constructor(host, onError) {
    this.host = host;
    this.disposed = false;
    this.dirty = true;
    this.visible = true;
    this.gems = [];
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.setAttribute("aria-label", "Interactive 3D ring");
    this.renderer.domElement.tabIndex = 0;
    host.appendChild(this.renderer.domElement);
    this.lost = (e) => {
      e.preventDefault();
      onError();
    };
    this.renderer.domElement.addEventListener("webglcontextlost", this.lost);
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(32, 1, 0.1, 150);
    this.camera.position.set(18, 17, 25);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 17;
    this.controls.maxDistance = 55;
    this.controls.autoRotateSpeed = 0.65;
    this.controls.addEventListener("change", () => {
      this.dirty = true;
    });
    const room = new RoomEnvironment(),
      pmrem = new T.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    room.dispose();
    pmrem.dispose();
    this.scene.add(new T.HemisphereLight(0xffffff, 0x8b7564, 2));
    this.key = new T.DirectionalLight(0xffffff, 3);
    this.key.position.set(-5, 14, 12);
    this.scene.add(this.key);
    this.group = new T.Group();
    this.scene.add(this.group);
    // Soft contact shadow, generated locally (no external textures or tracking).
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const cx = c.getContext("2d");
    const gr = cx.createRadialGradient(64, 64, 3, 64, 64, 64);
    gr.addColorStop(0, "rgba(64,42,26,.25)");
    gr.addColorStop(1, "rgba(64,42,26,0)");
    cx.fillStyle = gr;
    cx.fillRect(0, 0, 128, 128);
    this.shadowTexture = new T.CanvasTexture(c);
    this.shadow = new T.Mesh(
      new T.PlaneGeometry(24, 20),
      new T.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = -7.7;
    this.scene.add(this.shadow);
    this.resize = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      if (width && height) {
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.dirty = true;
      }
    });
    this.resize.observe(host);
    this.visibility = new IntersectionObserver((entries) => {
      this.visible = entries[0].isIntersecting;
      this.dirty = true;
    });
    this.visibility.observe(host);
    this.keyHandler = (e) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-"].includes(
          e.key,
        )
      ) {
        e.preventDefault();
        if (e.key === "+" || e.key === "-")
          this.zoom(e.key === "+" ? 0.88 : 1.12);
        else {
          const offset = this.camera.position.clone().sub(this.controls.target);
          const spherical = new T.Spherical().setFromVector3(offset);
          spherical.theta +=
            e.key === "ArrowLeft" ? 0.12 : e.key === "ArrowRight" ? -0.12 : 0;
          spherical.phi +=
            e.key === "ArrowUp" ? -0.12 : e.key === "ArrowDown" ? 0.12 : 0;
          spherical.makeSafe();
          this.camera.position
            .copy(this.controls.target)
            .add(new T.Vector3().setFromSpherical(spherical));
          this.dirty = true;
        }
      }
    };
    this.renderer.domElement.addEventListener("keydown", this.keyHandler);
    this.last = 0;
    this.slow = 0;
    this.renderCount = 0;
    this.sampleStart = 0;
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
  }
  disposeModel() {
    const geo = new Set(),
      mat = new Set(),
      tex = new Set();
    this.group.traverse((o) => {
      if (o.geometry) geo.add(o.geometry);
      if (o.material) {
        mat.add(o.material);
        if (o.material.map) tex.add(o.material.map);
      }
    });
    geo.forEach((x) => x.dispose());
    mat.forEach((x) => x.dispose());
    tex.forEach((x) => x.dispose());
    this.group.clear();
    this.gems = [];
  }
  update(s) {
    this.config = s;
    this.controls.autoRotate = s.rotate;
    this.disposeModel();
    const colors = {
      yellow14: 0xd9b477,
      yellow18: 0xe8be73,
      white14: 0xd5d9df,
      white18: 0xe2e4e7,
      rose14: 0xdba58c,
      rose18: 0xe0a18a,
      platinum: 0xe5e7eb,
    };
    const metal = new T.MeshPhysicalMaterial({
      color: colors[s.metal],
      metalness: 1,
      roughness:
        s.finish === "polished" ? 0.12 : s.finish === "satin" ? 0.32 : 0.43,
      clearcoat: s.finish === "polished" ? 0.4 : 0,
      anisotropy: s.finish === "brushed" ? 0.7 : 0,
    });
    let smallGem;
    const mesh = (g, m, pos) => {
      const o = new T.Mesh(g, m);
      if (pos) o.position.set(...pos);
      this.group.add(o);
      return o;
    };
    const radius = (s.size / (2 * Math.PI)) * 0.8,
      width = s.width * 0.8,
      thick = 0.65;
    // Sweep a comfort-fit cross-section around the finger axis, with editable width/profile.
    const points = [],
      indices = [],
      uN = 160,
      vN = 16;
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
              ? Math.sign(co) * Math.pow(Math.abs(co), 0.4)
              : co);
        const z =
          width *
          0.5 *
          (s.profile === "knife" ? si * (0.65 + (0.35 * (1 - co)) / 2) : si);
        points.push(Math.sin(a) * r, Math.cos(a) * r, z);
        if (i < uN && j < vN) {
          const k = i * (vN + 1) + j;
          indices.push(k, k + 1, k + vN + 1, k + 1, k + vN + 2, k + vN + 1);
        }
      }
    }
    const band = new T.BufferGeometry();
    band.setAttribute("position", new T.Float32BufferAttribute(points, 3));
    band.setIndex(indices);
    band.computeVertexNormals();
    mesh(band, metal);
    const size = 2.4 * Math.cbrt(s.carat),
      top = radius + 1.7;
    const sphere = (r, pos) => mesh(new T.SphereGeometry(r, 12, 8), metal, pos);
    const rod = (a, b, r) => {
      const start = new T.Vector3(...a),
        end = new T.Vector3(...b),
        delta = end.clone().sub(start);
      const o = mesh(
        new T.CylinderGeometry(r, r * 0.8, delta.length(), 12),
        metal,
      );
      o.position.copy(start).add(end).multiplyScalar(0.5);
      o.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        delta.normalize(),
      );
    };
    const gemstone = (shape, scale, pos, hero = false) => {
      const { geometry, planes } = gemGeometry(shape);
      let material;
      if (!hero) {
        smallGem ||= new T.MeshPhysicalMaterial({
          color: 0xf4f8ff,
          metalness: 0.05,
          roughness: 0.035,
          ior: 2.417,
          clearcoat: 1,
          envMapIntensity: 2.8,
        });
        material = smallGem;
      }
      if (hero) {
        const list = planes.slice();
        while (list.length < 64) list.push(new T.Vector4());
        material = new T.ShaderMaterial({
          vertexShader: vertex,
          fragmentShader: fragment,
          uniforms: {
            planes: { value: list },
            count: { value: planes.length },
            localEye: { value: new T.Vector3() },
            worldRotation: { value: new T.Matrix3() },
            tint: {
              value: new T.Color(
                1,
                1 - (s.color.charCodeAt(0) - 68) * 0.009,
                1 - (s.color.charCodeAt(0) - 68) * 0.025,
              ),
            },
            mood: { value: s.light === "evening" ? 1 : 0 },
          },
        });
      }
      const o = mesh(geometry, material, pos);
      o.scale.setScalar(scale);
      if (hero) this.gems.push(o);
      return o;
    };
    if (s.style !== "band") {
      gemstone(s.shape, size, [0, top, 0], true);
      for (let i = 0; i < s.prongs; i++) {
        const a = (2 * Math.PI * (i + 0.5)) / s.prongs,
          [x, z] = outline(s.shape, a);
        const end = [x * size * 1.01, top + 0.15, z * size * 1.01];
        rod([x * size * 0.45, radius - 0.1, z * size * 0.45], end, 0.13);
        sphere(0.18, end);
      }
      const collar = mesh(
        new T.TorusGeometry(size * 0.64, 0.115, 8, 64),
        metal,
        [0, top - 0.55, 0],
      );
      collar.rotation.x = Math.PI / 2;
      if (["halo", "vintage"].includes(s.style))
        for (let i = 0; i < 24; i++) {
          const [x, z] = outline(s.shape, (2 * Math.PI * i) / 24);
          gemstone("round", 0.33, [
            x * (size + 0.55),
            top - 0.03,
            z * (size + 0.55),
          ]);
          sphere(0.105, [x * (size + 0.9), top - 0.09, z * (size + 0.9)]);
        }
      if (s.style === "trilogy")
        for (const sign of [-1, 1]) {
          gemstone(
            s.shape === "emerald" ? "emerald" : "round",
            size * 0.5,
            [sign * size * 1.6, top - 0.8, 0],
            true,
          );
          for (const z of [-1, 1])
            rod(
              [sign * size * 1.35, radius - 0.6, z * 0.3],
              [sign * size * 1.6, top - 0.65, z * size * 0.52],
              0.11,
            );
        }
      if (s.accents === "hidden")
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          const o = gemstone("round", 0.18, [
            Math.cos(a) * size * 0.76,
            top - 0.5,
            Math.sin(a) * size * 0.76,
          ]);
          o.rotation.z = Math.PI / 2;
        }
    }
    if (
      s.accents === "pave" ||
      s.accents === "channel" ||
      s.style === "pave" ||
      s.style === "vintage"
    ) {
      for (let i = -15; i <= 15; i++) {
        const a = i * 0.088;
        if (s.style !== "band" && Math.abs(a) < 0.4) continue;
        const o = gemstone("round", Math.min(0.34, width * 0.26), [
          Math.sin(a) * (radius + 0.65),
          Math.cos(a) * (radius + 0.65),
          0,
        ]);
        o.rotation.z = -a;
      }
      if (s.accents === "channel")
        for (const z of [-width * 0.37, width * 0.37]) {
          const rail = mesh(
            new T.TorusGeometry(radius + 0.52, 0.12, 8, 160),
            metal,
          );
          rail.position.z = z;
        }
    }
    if (s.style === "vintage")
      for (let i = 0; i < 110; i++) {
        const a = (i / 110) * Math.PI * 2;
        for (const z of [-width * 0.44, width * 0.44])
          sphere(0.095, [
            Math.sin(a) * (radius + 0.35),
            Math.cos(a) * (radius + 0.35),
            z,
          ]);
      }
    if (s.engraving) {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 128;
      const ctx = c.getContext("2d");
      ctx.font = "52px Georgia";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#503b29";
      ctx.fillText(s.engraving, 512, 64);
      const texture = new T.CanvasTexture(c);
      texture.colorSpace = T.SRGBColorSpace;
      const o = mesh(
        new T.CylinderGeometry(
          radius - 0.66,
          radius - 0.66,
          width * 0.85,
          96,
          1,
          true,
          Math.PI * 0.64,
          Math.PI * 0.72,
        ),
        new T.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: T.BackSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        }),
      );
      o.rotation.x = Math.PI / 2;
    }
    this.scene.environmentIntensity =
      s.light === "evening" ? 0.75 : s.light === "daylight" ? 1.7 : 1.25;
    this.key.color.set(s.light === "evening" ? 0xffd7ae : 0xffffff);
    this.renderer.toneMappingExposure = s.light === "evening" ? 0.95 : 1.15;
    this.shadow.position.y = -radius - 0.75;
    this.dirty = true;
  }
  frame(time) {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    if (!this.visible || document.hidden) {
      this.last = time;
      return;
    }
    this.controls.update(Math.min((time - this.last) / 1000, 0.05));
    this.last = time;
    if (!this.dirty && !this.controls.autoRotate) return;
    this.scene.updateMatrixWorld();
    for (const gem of this.gems) {
      gem.material.uniforms.localEye.value.copy(this.camera.position);
      gem.worldToLocal(gem.material.uniforms.localEye.value);
      gem.material.uniforms.worldRotation.value.setFromMatrix4(gem.matrixWorld);
    }
    const start = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.renderCount++;
    this.dirty = false;
    if (this.controls.autoRotate) {
      if (!this.sampleStart) this.sampleStart = time;
      if (this.renderCount % 60 === 0) {
        this.renderer.domElement.dataset.fps = (
          60000 /
          (time - this.sampleStart)
        ).toFixed(1);
        this.sampleStart = time;
      }
    } else this.sampleStart = 0;
    if (performance.now() - start > 25) this.slow++;
    else this.slow = Math.max(0, this.slow - 1);
    if (this.slow > 25 && this.renderer.getPixelRatio() > 1) {
      this.renderer.setPixelRatio(1);
      this.slow = 0;
      this.dirty = true;
    }
  }
  view(name) {
    const v = {
      hero: [18, 17, 25],
      top: [0, 35, 0.01],
      front: [0, 4, 36],
      side: [36, 7, 0],
    }[name] || [18, 17, 25];
    this.camera.position.set(...v);
    this.controls.target.set(0, 1, 0);
    this.controls.update();
    this.dirty = true;
  }
  zoom(factor) {
    const d = this.camera.position.clone().sub(this.controls.target);
    d.setLength(T.MathUtils.clamp(d.length() * factor, 17, 55));
    this.camera.position.copy(this.controls.target).add(d);
    this.dirty = true;
  }
  capture() {
    this.dirty = true;
    this.scene.updateMatrixWorld();
    for (const gem of this.gems) {
      gem.material.uniforms.localEye.value.copy(this.camera.position);
      gem.worldToLocal(gem.material.uniforms.localEye.value);
      gem.material.uniforms.worldRotation.value.setFromMatrix4(gem.matrixWorld);
    }
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL("image/png");
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resize.disconnect();
    this.visibility.disconnect();
    this.controls.dispose();
    this.disposeModel();
    this.environment.dispose();
    this.shadow.geometry.dispose();
    this.shadow.material.dispose();
    this.shadowTexture.dispose();
    this.renderer.domElement.removeEventListener("webglcontextlost", this.lost);
    this.renderer.domElement.removeEventListener("keydown", this.keyHandler);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
