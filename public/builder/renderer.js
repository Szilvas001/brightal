import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createStudioEnvironment } from "./optics.mjs";
import { buildRing } from "./model.mjs";

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
    this.studioTexture = createStudioEnvironment();
    const pmrem = new T.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromEquirectangular(this.studioTexture);
    this.scene.environment = this.environment.texture;
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
    const model = buildRing(s, this.studioTexture);
    this.group.add(model.group);
    this.gems = model.gems;
    const { radius, width } = model;
    const mesh = (geometry, material) => {
      const o = new T.Mesh(geometry, material);
      this.group.add(o);
      return o;
    };
    if (s.engraving) {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 128;
      const ctx = c.getContext("2d");
      ctx.font =
        s.engravingFont === "script"
          ? "italic 52px cursive"
          : s.engravingFont === "modern"
            ? "48px sans-serif"
            : "52px Georgia";
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
      s.light === "evening" ? 0.7 : s.light === "daylight" ? 1.1 : 0.85;
    this.scene.environmentRotation.y = -(s.light === "evening"
      ? 0.7
      : s.light === "daylight"
        ? -0.5
        : 0);
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
    this.studioTexture.dispose();
    this.shadow.geometry.dispose();
    this.shadow.material.dispose();
    this.shadowTexture.dispose();
    this.renderer.domElement.removeEventListener("webglcontextlost", this.lost);
    this.renderer.domElement.removeEventListener("keydown", this.keyHandler);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
