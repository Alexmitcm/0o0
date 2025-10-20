import { useEffect, useRef } from "react";
import { createNoise2D } from "simplex-noise";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface NeuralBackgroundProps {
  className?: string;
  /**
   * When true, background renders inside its parent container rather than fullscreen.
   */
  contained?: boolean;
  /**
   * Minimal mode: only render the central nucleus (stone) without stars/planets/sky dome.
   */
  minimal?: boolean;
  /**
   * Max frames per second. Higher is smoother but heavier.
   */
  maxFps?: number;
  /**
   * Renderer pixel ratio cap. 1 is fastest, devicePixelRatio may be too heavy.
   */
  pixelRatio?: number;
  /**
   * Geometry/detail preset.
   */
  detail?: "low" | "medium" | "high";
}

const NeuralBackground = ({
  className = "",
  contained = false,
  minimal = false,
  maxFps = 60,
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5),
  detail = "high"
}: NeuralBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<Effect | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const effect = new Effect(container, {
      detail,
      maxFps,
      minimal,
      pixelRatio
    });
    effectRef.current = effect;
    effect.init();

    return () => {
      effect.dispose();
      effectRef.current = null;
    };
  }, [detail, maxFps, minimal, pixelRatio]);

  return (
    <div
      className={`${contained ? "absolute inset-0" : "-z-10 fixed inset-0"} ${className}`}
      ref={containerRef}
    />
  );
};

class Effect {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private clock: THREE.Clock | null = null;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private options: {
    minimal: boolean;
    maxFps: number;
    pixelRatio: number;
    detail: "low" | "medium" | "high";
  };

  private time = 0;
  private delta = 0;
  private textures: Record<string, THREE.Texture> = {};

  private nucleus!: THREE.Mesh<
    THREE.IcosahedronGeometry,
    THREE.MeshPhongMaterial
  >;
  private originalPositions!: Float32Array;
  private nucleusPosition!: THREE.BufferAttribute;
  private noise = createNoise2D();
  private blobScale = 2;

  private sphereBg!: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;

  private pointStars!: THREE.Points;
  private pointStars2!: THREE.Points;
  private pointComet1!: THREE.Points;
  private planet1!: THREE.Points;
  private planet2!: THREE.Points;
  private planet3!: THREE.Points;
  private stars!: THREE.Points;
  private centerLogoSprite: THREE.Sprite | null = null;
  private logoFitFactor = 0.88; // portion of nucleus diameter used for logo size

  // keep declarations minimal; attributes accessed directly in loop

  private rafLimiter = 1 / 60;

  private animationStartTime3 = Date.now() + 6000;
  private animationStartTime6 = Date.now() + 15000;
  private expansionStartTime = Date.now() + 9000;
  private contractionStartTime = Date.now() + 20000;
  private contractionDuration = 8000;
  private centeringStartTime = Date.now() + 25000;
  private centeringDuration = 8000;
  private pointStarsContractStartTime = Date.now() + 25000;
  private pointStarsContractDuration = 6000;

  private readonly MAX_EXPANSION_DISTANCE = 95;
  private readonly TARGET_RADIUS = 95;

  private lastAdapt = performance.now();
  private framesSinceAdapt = 0;

  constructor(
    container: HTMLDivElement,
    options: {
      minimal: boolean;
      maxFps: number;
      pixelRatio: number;
      detail: "low" | "medium" | "high";
    }
  ) {
    this.container = container;
    this.options = options;
    this.rafLimiter = 1 / Math.max(1, options.maxFps || 60);
  }

  init() {
    this.initThree();
    const texturePromise = this.loadTextures();
    this.createElements();
    if (!this.options.minimal) {
      this.createMovingStars();
      this.createPointElements();
    }
    this.initBannerInteractions();

    texturePromise.then(() => {
      (this.pointStars.material as THREE.PointsMaterial).map =
        this.textures.flare1;
      (this.pointStars2.material as THREE.PointsMaterial).map =
        this.textures.flare2;
      (this.pointComet1.material as THREE.PointsMaterial).map =
        this.textures.flare3;
      (this.planet1.material as THREE.PointsMaterial).map =
        this.textures.planet1;
      (this.planet2.material as THREE.PointsMaterial).map =
        this.textures.planet2;
      (this.planet3.material as THREE.PointsMaterial).map =
        this.textures.planet3;
      (this.nucleus.material as THREE.MeshPhongMaterial).map =
        this.textures.star;
      if (this.sphereBg) {
        (this.sphereBg.material as THREE.MeshBasicMaterial).map =
          this.textures.sky;
      }
      if (this.stars) {
        (this.stars.material as THREE.PointsMaterial).map =
          this.textures.flare2;
      }

      // Ensure materials update after maps are applied
      (this.pointStars.material as THREE.PointsMaterial).alphaTest = 0.3;
      (this.pointStars2.material as THREE.PointsMaterial).alphaTest = 0.3;
      (this.pointComet1.material as THREE.PointsMaterial).alphaTest = 0.3;
      (this.planet1.material as THREE.PointsMaterial).alphaTest = 0.3;
      (this.planet2.material as THREE.PointsMaterial).alphaTest = 0.3;
      (this.planet3.material as THREE.PointsMaterial).alphaTest = 0.3;
      (this.pointStars.material as THREE.PointsMaterial).needsUpdate = true;
      (this.pointStars2.material as THREE.PointsMaterial).needsUpdate = true;
      (this.pointComet1.material as THREE.PointsMaterial).needsUpdate = true;
      (this.planet1.material as THREE.PointsMaterial).needsUpdate = true;
      (this.planet2.material as THREE.PointsMaterial).needsUpdate = true;
      (this.planet3.material as THREE.PointsMaterial).needsUpdate = true;
      (this.nucleus.material as THREE.MeshPhongMaterial).needsUpdate = true;
      (this.sphereBg.material as THREE.MeshBasicMaterial).needsUpdate = true;
      (this.stars.material as THREE.PointsMaterial).needsUpdate = true;

      // Create a logo sprite that always faces camera and stays centered on nucleus
      this.initCenterLogo();
    });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    this.limitFPS(this.rafLimiter);
  }

  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.controls) this.controls.dispose();

    if (this.scene) {
      this.scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if ((mesh as any).geometry) (mesh as any).geometry.dispose?.();
        if ((mesh as any).material) {
          const mat = (mesh as any).material as
            | THREE.Material
            | THREE.Material[];
          if (Array.isArray(mat)) {
            for (const m of mat) m.dispose();
          } else mat.dispose();
        }
      });
    }
    if (this.renderer) {
      this.renderer.dispose();
      const canvas = this.renderer.domElement;
      if (canvas && canvas.parentElement === this.container) {
        this.container.removeChild(canvas);
      }
    }
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  private initThree() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      stencil: false
    });
    // Avoid white flash on mount by rendering black until textures load
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    const px = Math.max(0.75, Math.min(this.options.pixelRatio || 1, 2));
    this.renderer.setPixelRatio(px);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.camera = new THREE.PerspectiveCamera(
      55,
      Math.max(1, this.container.clientWidth) /
        Math.max(1, this.container.clientHeight),
      0.01,
      1000
    );
    this.camera.position.set(0, 0, 150);

    this.clock = new THREE.Clock();

    const directionalLight = new THREE.DirectionalLight("#fff", 2.2);
    directionalLight.position.set(0, 50, -20);
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight("#ffffff", 0.9);
    ambientLight.position.set(0, -20, -40);
    this.scene.add(ambientLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1.5;
    this.controls.maxDistance = 350;
    this.controls.minDistance = 150;
    this.controls.enablePan = false;
  }

  private loadTextures() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const textureMap: Record<string, string> = {
      flare1: "https://i.ibb.co/TRsJ1tm/p1.png",
      flare2: "https://i.ibb.co/YQcTCRG/p2.png",
      flare3: "https://i.ibb.co/v1S8YW7/p7.png",
      planet1: "https://i.ibb.co/s1cZDnM/planet1.webp",
      planet2: "https://i.ibb.co/Lt5Kn7y/planet2.webp",
      planet3: "https://i.ibb.co/T8V57p4/planet3.webp",
      sky: "https://i.ibb.co/HC0vxMw/sky2.jpg",
      star: "https://i.ibb.co/NpJzwns/star.jpg"
    };

    return Promise.all(
      Object.entries(textureMap).map(
        ([key, url]) =>
          new Promise<void>((resolve, reject) => {
            loader.load(
              url,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy =
                  this.options.detail === "low"
                    ? 4
                    : this.options.detail === "medium"
                      ? 8
                      : 16;
                this.textures[key] = tex;
                resolve();
              },
              undefined,
              (err) => reject(err)
            );
          })
      )
    );
  }

  private createElements() {
    if (!this.scene) return;

    const icoDetail =
      this.options.detail === "low"
        ? 6
        : this.options.detail === "medium"
          ? 8
          : 10;
    const icosahedronGeometry = new THREE.IcosahedronGeometry(20, icoDetail);
    this.originalPositions = new Float32Array(
      icosahedronGeometry.attributes.position.array
    );
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      dithering: true,
      emissive: new THREE.Color(0x333333),
      emissiveIntensity: 1.0,
      shininess: 0,
      specular: new THREE.Color(0x000000)
    });
    this.nucleus = new THREE.Mesh(icosahedronGeometry, material);
    this.nucleus.position.set(0, 0, 0);
    this.scene.add(this.nucleus);

    if (!this.options.minimal) {
      const seg =
        this.options.detail === "low"
          ? 24
          : this.options.detail === "medium"
            ? 36
            : 50;
      const geometrySphereBg = new THREE.SphereGeometry(800, seg, seg);
      const materialSphereBg = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.BackSide
      });
      this.sphereBg = new THREE.Mesh(geometrySphereBg, materialSphereBg);
      this.sphereBg.position.set(0, 0, 0);
      this.scene.add(this.sphereBg);
    }

    // Ensure stamped logo is centered on the nucleus
    this.scene.updateMatrixWorld(true);
    // Centered screen-space logo handled by initCenterLogo(); nothing to attach here.
  }

  private initCenterLogo() {
    if (!this.scene) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      "/logo.png",
      (tex) => {
        if (!this.scene) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.SpriteMaterial({
          depthTest: false,
          map: tex,
          opacity: 0.98,
          transparent: true
        });
        const sprite = new THREE.Sprite(mat);
        sprite.name = "nucleus_center_logo";
        // scale will be set every frame to fit the nucleus
        this.centerLogoSprite = sprite;
        this.scene.add(sprite);
        // Place and scale initially; loop will keep it aligned
        this.updateCenterLogoTransform();
      },
      undefined,
      () => {}
    );
  }

  private updateCenterLogoTransform() {
    if (!this.centerLogoSprite || !this.camera || !this.nucleus) return;
    this.centerLogoSprite.position.copy(this.nucleus.position);
    // Fit scale to current nucleus radius
    const geom = this.nucleus.geometry as THREE.IcosahedronGeometry;
    geom.computeBoundingSphere();
    const radius = geom.boundingSphere?.radius ?? 20;
    const diameter = radius * 2 * this.logoFitFactor;
    this.centerLogoSprite.scale.set(diameter, diameter, 1);
    this.centerLogoSprite.renderOrder = 9999;
    this.centerLogoSprite.lookAt(this.camera.position);
  }

  private createPointElements() {
    if (!this.scene) return;
    const createPointParticles = (opts: {
      size: number;
      total: number;
      transparent?: boolean;
      max?: number;
      min?: number;
      pointY?: number;
    }) => {
      const {
        size,
        total,
        transparent = true,
        max = 150,
        min = 70,
        pointY
      } = opts;
      const positions = new Float32Array(total * 3);
      const originalY = new Float32Array(total);

      for (let i = 0; i < total; i++) {
        const p = this.randomPointSphere(THREE.MathUtils.randInt(max, min));
        const idx = i * 3;
        positions[idx] = p.x;
        positions[idx + 2] = p.z;
        if (typeof pointY === "number") {
          positions[idx + 1] = pointY;
          originalY[i] = p.y;
        } else {
          positions[idx + 1] = p.y;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute(
        "originalY",
        new THREE.BufferAttribute(originalY, 1)
      );

      const blending = transparent
        ? THREE.AdditiveBlending
        : THREE.NormalBlending;
      const material = new THREE.PointsMaterial({
        alphaTest: 0.3,
        blending,
        depthWrite: false,
        size,
        transparent: true
      });
      return new THREE.Points(geometry, material);
    };

    const totalA =
      this.options.detail === "low"
        ? 120
        : this.options.detail === "medium"
          ? 160
          : 200;
    this.pointStars = createPointParticles({
      max: 130,
      min: 130,
      size: 0.5,
      total: totalA,
      transparent: true
    });
    this.scene.add(this.pointStars);

    const totalB =
      this.options.detail === "low"
        ? 280
        : this.options.detail === "medium"
          ? 420
          : 600;
    this.pointStars2 = createPointParticles({
      max: 33,
      min: 25,
      pointY: 0,
      size: 3,
      total: totalB,
      transparent: true
    });
    this.scene.add(this.pointStars2);

    this.pointComet1 = createPointParticles({
      max: 25,
      min: 25,
      size: 12,
      total: 1,
      transparent: true
    });
    this.scene.add(this.pointComet1);

    this.planet1 = createPointParticles({
      max: 60,
      min: 40,
      size: 9,
      total: 1,
      transparent: false
    });
    this.planet2 = createPointParticles({
      max: 60,
      min: 40,
      size: 12,
      total: 1,
      transparent: false
    });
    this.planet3 = createPointParticles({
      max: 60,
      min: 40,
      size: 12,
      total: 1,
      transparent: false
    });
    this.scene.add(this.planet1);
    this.scene.add(this.planet2);
    this.scene.add(this.planet3);
  }

  private createMovingStars() {
    if (!this.scene) return;
    const totalStars = 5;
    const positions = new Float32Array(totalStars * 3);
    const velocities = new Float32Array(totalStars);
    const startPositions = new Float32Array(totalStars * 3);

    for (let i = 0; i < totalStars; i++) {
      const radius = THREE.MathUtils.randFloat(200, 300);
      const p = this.randomPointSphere(radius);
      const idx = i * 3;
      positions[idx] = p.x;
      positions[idx + 1] = p.y;
      positions[idx + 2] = p.z;
      startPositions[idx] = p.x;
      startPositions[idx + 1] = p.y;
      startPositions[idx + 2] = p.z;
      velocities[i] = THREE.MathUtils.randInt(50, 400);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("velocity", new THREE.BufferAttribute(velocities, 1));
    geo.setAttribute(
      "startPosition",
      new THREE.BufferAttribute(startPositions, 3)
    );
    const mat = new THREE.PointsMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8,
      size: 14,
      transparent: true
    });
    this.stars = new THREE.Points(geo, mat);
    this.stars.name = "moving_stars";
    this.stars.visible = false;
    this.scene.add(this.stars);
  }

  private randomPointSphere(radius: number) {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const dx = radius * Math.sin(phi) * Math.cos(theta);
    const dy = radius * Math.sin(phi) * Math.sin(theta);
    const dz = radius * Math.cos(phi);
    return new THREE.Vector3(dx, dy, dz);
  }

  private handleResize() {
    if (!this.camera || !this.renderer) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private limitFPS(interval: number) {
    this.rafId = requestAnimationFrame(this.limitFPS.bind(this, interval));
    if (!this.clock) return;
    this.delta += this.clock.getDelta();
    if (this.delta > interval) {
      this.loop();
      this.delta = this.delta % interval;
    }
  }

  private updateNucleus() {
    if (!this.nucleus || !this.camera) return;
    if (Date.now() < this.animationStartTime3) return;
    const easing = Math.min(1, (Date.now() - this.animationStartTime3) / 2000);
    this.nucleusPosition = this.nucleus.geometry.attributes
      .position as THREE.BufferAttribute;
    for (let i = 0; i < this.nucleusPosition.count; i++) {
      const x = this.originalPositions[i * 3];
      const y = this.originalPositions[i * 3 + 1];
      const z = this.originalPositions[i * 3 + 2];
      const len = Math.sqrt(x * x + y * y + z * z);
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;
      const dist =
        20 +
        this.noise(nx + this.time * 0.0004, ny + this.time * 0.0004) *
          this.blobScale *
          easing;
      this.nucleusPosition.array[i * 3] = nx * dist;
      this.nucleusPosition.array[i * 3 + 1] = ny * dist;
      this.nucleusPosition.array[i * 3 + 2] = nz * dist;
    }
    this.nucleusPosition.needsUpdate = true;
    this.nucleus.geometry.computeVertexNormals();
  }

  private updateMovingStars() {
    if (Date.now() < this.animationStartTime6) return;
    if (!this.stars) return;
    const easing = Math.min(1, (Date.now() - this.animationStartTime6) / 4000);
    const pos = this.stars.geometry.attributes
      .position as THREE.BufferAttribute;
    const vel = this.stars.geometry.attributes
      .velocity as THREE.BufferAttribute;
    const startPos = this.stars.geometry.attributes
      .startPosition as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const idx = i * 2;
      const move = easing * ((0 - pos.array[idx]) / vel.array[i]);
      pos.array[idx] += move;
      pos.array[idx + 1] += easing * ((0 - pos.array[idx + 1]) / vel.array[i]);
      pos.array[idx + 2] += easing * ((0 - pos.array[idx + 2]) / vel.array[i]);
      vel.array[i] -= 0.05 * easing;
      if (
        pos.array[idx] <= 2 &&
        pos.array[idx] >= -2 &&
        pos.array[idx + 2] <= 2 &&
        pos.array[idx + 2] >= -2
      ) {
        pos.array[idx] = startPos.array[idx];
        pos.array[idx + 1] = startPos.array[idx + 1];
        pos.array[idx + 2] = startPos.array[idx + 2];
        vel.array[i] = 120;
      }
    }
    pos.needsUpdate = true;
    vel.needsUpdate = true;
  }

  private updatePointStars2() {
    const positions = this.pointStars2.geometry.attributes
      .position as THREE.BufferAttribute;
    const originalY = this.pointStars2.geometry.attributes
      .originalY as THREE.BufferAttribute;
    for (let i = 0; i < originalY.count; i++) {
      const currentY = positions.array[i * 3 + 1];
      const targetY = originalY.array[i];
      if (Date.now() >= this.animationStartTime3) {
        const newY = currentY + (targetY - currentY) * 0.02;
        positions.array[i * 3 + 1] = newY;
      }

      if (
        Date.now() >= this.expansionStartTime &&
        Date.now() < this.contractionStartTime
      ) {
        const x = positions.array[i * 3];
        const y = positions.array[i * 3 + 1];
        const z = positions.array[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);
        if (dist < this.MAX_EXPANSION_DISTANCE) {
          const ratio = dist / this.MAX_EXPANSION_DISTANCE;
          const factor = 1 + 0.002 * (1 - ratio);
          positions.array[i * 3] = x * factor;
          positions.array[i * 3 + 1] = y * factor;
          positions.array[i * 3 + 2] = z * factor;
        }
      }

      if (Date.now() >= this.contractionStartTime) {
        const t = Date.now() - this.contractionStartTime;
        const easing = Math.min(1, t / this.contractionDuration);
        const x = positions.array[i * 3];
        const y = positions.array[i * 3 + 1];
        const z = positions.array[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);
        const originalRadius = THREE.MathUtils.randFloat(25, 33);
        const nx = (x / dist) * originalRadius;
        const ny = (y / dist) * originalRadius;
        const nz = (z / dist) * originalRadius;
        const speed = 0.008 * easing;
        positions.array[i * 3] = x + (nx - x) * speed;
        positions.array[i * 3 + 1] = y + (ny - y) * speed;
        positions.array[i * 3 + 2] = z + (nz - z) * speed;
      }

      if (Date.now() >= this.centeringStartTime) {
        const t = Date.now() - this.centeringStartTime;
        const easing = Math.min(1, t / this.centeringDuration);
        const x = positions.array[i * 3];
        const y = positions.array[i * 3 + 1];
        const z = positions.array[i * 3 + 2];
        const speed = 0.008 * easing;
        positions.array[i * 3] = x + (0 - x) * speed;
        positions.array[i * 3 + 1] = y + (0 - y) * speed;
        positions.array[i * 3 + 2] = z + (0 - z) * speed;
        (this.pointStars2.material as THREE.PointsMaterial).opacity =
          1 - easing;
        if (easing >= 1) {
          this.pointStars2.visible = false;
          this.stars.visible = true;
        }
      }
    }
    positions.needsUpdate = true;
  }

  private updatePointStarsContraction() {
    const timeSince = Date.now() - this.pointStarsContractStartTime;
    const easing = Math.min(1, timeSince / this.pointStarsContractDuration);
    const positions = this.pointStars.geometry.attributes
      .position as THREE.BufferAttribute;
    (this.pointStars.material as THREE.PointsMaterial).size =
      0.4 + 0.7 * easing;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.array[i * 3];
      const y = positions.array[i * 3 + 1];
      const z = positions.array[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      const nx = x / dist;
      const ny = y / dist;
      const nz = z / dist;
      const tx = nx * this.TARGET_RADIUS;
      const ty = ny * this.TARGET_RADIUS;
      const tz = nz * this.TARGET_RADIUS;
      const speed = 0.008 * easing;
      positions.array[i * 3] = x + (tx - x) * speed;
      positions.array[i * 3 + 1] = y + (ty - y) * speed;
      positions.array[i * 3 + 2] = z + (tz - z) * speed;
    }
    positions.needsUpdate = true;
  }

  private updateRotations() {
    this.pointStars.rotation.y -= 0.0007;
    this.pointComet1.rotation.z -= 0.01;
    this.pointComet1.rotation.y += 0.001;
    this.pointStars2.rotation.x -= 0.001;
    this.planet1.rotation.y += 0.001;
    this.planet2.rotation.z += 0.003;
    this.planet3.rotation.x += 0.0005;
  }

  private loop() {
    if (!this.renderer || !this.scene || !this.camera || !this.clock) return;
    this.time = Date.now();
    this.updateNucleus();
    this.updateMovingStars();
    this.updatePointStars2();
    this.updateRotations();
    // Keep sky dome centered on camera so it surrounds the view (no white circle)
    this.sphereBg.position.copy(this.camera.position);
    this.updateCenterLogoTransform();
    if (Date.now() >= this.pointStarsContractStartTime) {
      this.updatePointStarsContraction();
    }

    // Adaptive performance: adjust autoRotateSpeed and stars opacity subtly
    this.framesSinceAdapt += 1;
    const now = performance.now();
    const elapsed = now - this.lastAdapt;
    if (elapsed >= 1200) {
      const fps = (this.framesSinceAdapt * 1000) / Math.max(1, elapsed);
      if (this.controls) {
        if (fps < 60 * 0.6) {
          this.controls.autoRotateSpeed = Math.max(
            0.8,
            this.controls.autoRotateSpeed - 0.2
          );
          (this.pointStars.material as THREE.PointsMaterial).opacity = Math.max(
            0.35,
            (this.pointStars.material as THREE.PointsMaterial).opacity - 0.05
          );
          (this.pointStars2.material as THREE.PointsMaterial).opacity =
            Math.max(
              0.4,
              (this.pointStars2.material as THREE.PointsMaterial).opacity - 0.05
            );
        } else if (fps > 60 * 0.9) {
          this.controls.autoRotateSpeed = Math.min(
            2.0,
            this.controls.autoRotateSpeed + 0.1
          );
          (this.pointStars.material as THREE.PointsMaterial).opacity = Math.min(
            0.8,
            (this.pointStars.material as THREE.PointsMaterial).opacity + 0.03
          );
          (this.pointStars2.material as THREE.PointsMaterial).opacity =
            Math.min(
              1,
              (this.pointStars2.material as THREE.PointsMaterial).opacity + 0.03
            );
        }
      }
      this.framesSinceAdapt = 0;
      this.lastAdapt = now;
    }

    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  }

  private initBannerInteractions() {
    const banner = document.querySelector(".banner");
    const hideBanner = () => {
      if (banner) {
        (banner as HTMLElement).style.opacity = "0";
        (banner as HTMLElement).style.transition = "opacity 0.5s ease";
        setTimeout(() => banner.remove(), 500);
      }
    };
    window.addEventListener("wheel", hideBanner, { once: true });
    if (this.renderer) {
      this.renderer.domElement.addEventListener("pointerdown", hideBanner, {
        once: true
      });
    }
  }
}

export default NeuralBackground;
