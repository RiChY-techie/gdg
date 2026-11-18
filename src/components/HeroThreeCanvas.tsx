import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Cpu, Pause, Play, RotateCcw } from 'lucide-react';

type ViewMode = 'assembled' | 'exploded' | 'blueprint';

// Pre-allocated scratch helpers for zero GC in the animation loop
const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();

function createCircuitPlateTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0c1322';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Radial vignette
  const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, size * 0.5);
  grad.addColorStop(0, 'rgba(37, 99, 235, 0.16)');
  grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.3)');
  grad.addColorStop(1, 'rgba(9, 13, 22, 0.98)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Concentric technical rings
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.22)';
  ctx.lineWidth = 1.25;
  [84, 136, 188, 236].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Orthogonal circuit bus traces
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 65, cy + Math.sin(angle) * 65);
    ctx.lineTo(cx + Math.cos(angle) * 236, cy + Math.sin(angle) * 236);
    ctx.stroke();
  }

  // Degree ticks on outer ring
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI * 2) / 36;
    const inner = i % 3 === 0 ? 176 : 182;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * 188, cy + Math.sin(a) * 188);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createChevronGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.36, 0.42);
  shape.lineTo(0.18, 0.06);
  shape.lineTo(0.18, -0.06);
  shape.lineTo(-0.36, -0.42);
  shape.lineTo(-0.5, -0.26);
  shape.lineTo(-0.08, 0);
  shape.lineTo(-0.5, 0.26);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

export const HeroThreeCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('assembled');
  const [paused, setPaused] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  const modeRef = useRef<ViewMode>('assembled');
  const pausedRef = useRef(false);
  const resetTriggerRef = useRef(0);

  useEffect(() => {
    modeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      pausedRef.current = true;
      setPaused(true);
    }

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    const bgHex = 0x0b1220;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.045);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTex;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    const defaultCamPos = new THREE.Vector3(3.4, 2.55, 4.3);
    const defaultTarget = new THREE.Vector3(0, 1.18, 0);
    camera.position.copy(defaultCamPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(defaultTarget);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.update();

    // Studio 3-point + hemisphere lighting
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.3);
    keyLight.position.set(4.5, 7, 4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.1);
    rimLight.position.set(-4, 3.5, -4);
    scene.add(rimLight);

    // Track disposables
    const disposables: Array<{ dispose: () => void }> = [envTex];
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Ground circuit plate (y = 0)
    const circuitTex = createCircuitPlateTexture(maxAniso);
    const shadowTex = createContactShadowTexture();
    disposables.push(circuitTex, shadowTex);

    const groundGeo = new THREE.CircleGeometry(4.6, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      map: circuitTex,
      roughness: 0.72,
      metalness: 0.25,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    disposables.push(groundGeo, groundMat);

    // Soft radial contact shadow directly beneath monument (offset +0.02 on Y to prevent Z-fighting)
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    scene.add(shadowPlane);
    disposables.push(shadowGeo, shadowMat);

    // Composite Procedural Monument Group (grounded bottom-center at y = 0.02)
    const monument = new THREE.Group();
    monument.position.y = 0.02;
    scene.add(monument);

    // 1. Stepped Lathe Plinth (anodized aluminum)
    const plinthPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1.18, 0),
      new THREE.Vector2(1.15, 0.12),
      new THREE.Vector2(0.95, 0.16),
      new THREE.Vector2(0.92, 0.28),
      new THREE.Vector2(0.72, 0.34),
      new THREE.Vector2(0, 0.34),
    ];
    const plinthGeo = new THREE.LatheGeometry(plinthPoints, 32);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.26,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.castShadow = true;
    plinthMesh.receiveShadow = true;
    monument.add(plinthMesh);
    disposables.push(plinthGeo, plinthMat);

    // 2. Beveled Hexagonal Chassis Deck
    const hexShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * 0.78;
      const py = Math.sin(a) * 0.78;
      if (i === 0) hexShape.moveTo(px, py);
      else hexShape.lineTo(px, py);
    }
    hexShape.closePath();

    const chassisGeo = new THREE.ExtrudeGeometry(hexShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
    chassisGeo.rotateX(-Math.PI / 2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.45,
      roughness: 0.56,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.y = 0.38;
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    monument.add(chassisMesh);
    disposables.push(chassisGeo, chassisMat);

    // 3. Precision Gold-Amber Collar Ring
    const collarGeo = new THREE.TorusGeometry(0.62, 0.045, 16, 48);
    collarGeo.rotateX(Math.PI / 2);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xfbbc04,
      metalness: 0.92,
      roughness: 0.18,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.y = 0.62;
    collarMesh.castShadow = true;
    monument.add(collarMesh);
    disposables.push(collarGeo, collarMat);

    // 4. Central Optical Crystal Core + Inner Neural Prism
    const coreGroup = new THREE.Group();
    coreGroup.position.y = 1.28;
    monument.add(coreGroup);

    const crystalGeo = new THREE.IcosahedronGeometry(0.5, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      metalness: 0.05,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.55,
      transmission: isSoftwareGl ? 0 : 0.88,
      thickness: 1.2,
      attenuationColor: new THREE.Color(0x1d4ed8),
      attenuationDistance: 1.5,
      transparent: true,
      opacity: isSoftwareGl ? 0.52 : 1,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.castShadow = true;
    coreGroup.add(crystalMesh);
    disposables.push(crystalGeo, crystalMat);

    const innerGeo = new THREE.OctahedronGeometry(0.24, 0);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 1.2,
      metalness: 0.35,
      roughness: 0.25,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);
    disposables.push(innerGeo, innerMat);

    // 5-8. Four GDG-colored Beveled Chevron Wing Brackets orbiting the core
    const chevronGeo = createChevronGeometry();
    disposables.push(chevronGeo);

    const gdgColors = [0x4285f4, 0xea4335, 0xfbbc04, 0x34a853];
    const chevronRig = new THREE.Group();
    chevronRig.position.y = 1.28;
    monument.add(chevronRig);

    const chevrons: THREE.Mesh[] = [];
    const chevronMaterials: THREE.MeshStandardMaterial[] = [];

    gdgColors.forEach((hex, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: hex,
        metalness: 0.42,
        roughness: 0.32,
      });
      const mesh = new THREE.Mesh(chevronGeo, mat);
      const angle = (idx * Math.PI) / 2;
      mesh.userData.baseAngle = angle;
      mesh.position.set(Math.cos(angle) * 0.85, 0, Math.sin(angle) * 0.85);
      mesh.rotation.y = -angle;
      mesh.scale.setScalar(0.68);
      mesh.castShadow = true;
      chevronRig.add(mesh);
      chevrons.push(mesh);
      chevronMaterials.push(mat);
      disposables.push(mat);
    });

    // 9. Upper Orbital Gyro Ring
    const ringGeo = new THREE.TorusGeometry(1.18, 0.022, 12, 72);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.88,
      roughness: 0.22,
    });
    const gyroRing = new THREE.Mesh(ringGeo, ringMat);
    gyroRing.position.y = 1.28;
    gyroRing.rotation.x = Math.PI * 0.38;
    gyroRing.rotation.z = Math.PI * 0.12;
    monument.add(gyroRing);
    disposables.push(ringGeo, ringMat);

    // 10. InstancedMesh: 24 Orbiting Compute Nodes
    const nodeCount = 24;
    const nodeGeo = new THREE.IcosahedronGeometry(0.055, 0);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.35,
    });
    const instancedNodes = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
    instancedNodes.frustumCulled = false;

    const palette = [
      new THREE.Color(0x60a5fa),
      new THREE.Color(0xf87171),
      new THREE.Color(0xfbbf24),
      new THREE.Color(0x4ade80),
    ];
    for (let i = 0; i < nodeCount; i++) {
      instancedNodes.setColorAt(i, palette[i % palette.length]);
    }
    if (instancedNodes.instanceColor) instancedNodes.instanceColor.needsUpdate = true;
    instancedNodes.computeBoundingSphere();
    monument.add(instancedNodes);
    disposables.push(nodeGeo, nodeMat);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // State targets for smooth exponential damping
    let explodeFactor = 0;
    let elapsedSim = 0;
    let lastTime = performance.now();
    let lastResetCount = resetTriggerRef.current;
    let frameId = 0;
    let disposed = false;

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!pausedRef.current) {
        elapsedSim += dt;
      }

      // Reset camera on demand
      if (lastResetCount !== resetTriggerRef.current) {
        lastResetCount = resetTriggerRef.current;
        camera.position.copy(defaultCamPos);
        controls.target.copy(defaultTarget);
        controls.update();
      }

      const mode = modeRef.current;
      const targetExplode = mode === 'exploded' ? 1 : 0;
      explodeFactor = THREE.MathUtils.damp(explodeFactor, targetExplode, 6, dt);

      const isWireframe = mode === 'blueprint';
      chassisMat.wireframe = isWireframe;
      plinthMat.wireframe = isWireframe;
      chevronMaterials.forEach((m) => {
        m.wireframe = isWireframe;
      });

      // Smoothly separate composite layers when exploded
      chassisMesh.position.y = 0.38 + explodeFactor * 0.16;
      collarMesh.position.y = 0.62 + explodeFactor * 0.34;
      coreGroup.position.y = 1.28 + explodeFactor * 0.42;
      chevronRig.position.y = 1.28 + explodeFactor * 0.42;
      gyroRing.position.y = 1.28 + explodeFactor * 0.56;

      // Core & chevron rotation
      coreGroup.rotation.y = elapsedSim * 0.42;
      coreGroup.rotation.x = Math.sin(elapsedSim * 0.65) * 0.14;
      innerMesh.rotation.y = -elapsedSim * 0.85;
      chevronRig.rotation.y = -elapsedSim * 0.22;
      gyroRing.rotation.z = Math.PI * 0.12 + elapsedSim * 0.28;

      const radialSpread = 0.88 + explodeFactor * 0.55;
      chevrons.forEach((mesh) => {
        const a = mesh.userData.baseAngle as number;
        mesh.position.set(Math.cos(a) * radialSpread, 0, Math.sin(a) * radialSpread);
      });

      // Update InstancedMesh nodes with zero allocations
      for (let i = 0; i < nodeCount; i++) {
        const orbitAngle = (i / nodeCount) * Math.PI * 2 + elapsedSim * (0.28 + (i % 3) * 0.08);
        const radius = 1.38 + (i % 3) * 0.22 + explodeFactor * 0.35;
        const yPos = 1.15 + Math.sin(elapsedSim * 1.4 + i * 0.7) * 0.38 + explodeFactor * 0.3;
        _pos.set(Math.cos(orbitAngle) * radius, yPos, Math.sin(orbitAngle) * radius);
        _euler.set(elapsedSim + i, elapsedSim * 0.7 + i, 0);
        _quat.setFromEuler(_euler);
        const s = 0.8 + (i % 4) * 0.15;
        _scale.set(s, s, s);
        _mat4.compose(_pos, _quat, _scale);
        instancedNodes.setMatrixAt(i, _mat4);
      }
      instancedNodes.instanceMatrix.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0B1220] p-8 text-center text-slate-200">
        <Cpu className="w-10 h-10 text-blue-400 mb-3" aria-hidden="true" />
        <p className="font-display text-lg font-semibold">RIT CSE Compute Core</p>
        <p className="mt-1 text-xs text-slate-400 max-w-xs">
          Interactive 3D viewport requires WebGL acceleration. Explore our events and student builds
          below.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[360px] sm:min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#0B1220] dark:border-slate-800">
      {/* Dedicated empty ref mount container outside React HUD */}
      <div
        ref={mountRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D RIT CSE Compute Core sculpture. Drag to orbit."
      />

      {/* Minimal Top-Left Scene Label (no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-3.5 left-3.5 rounded-lg border border-slate-700/80 bg-[#0B1220]/90 px-3 py-1.5 text-xs text-slate-200">
        <span className="font-medium">Interactive 3D Core</span>
        <span className="mx-1.5 text-slate-500" aria-hidden="true">
          ·
        </span>
        <span className="text-slate-400">Drag to orbit</span>
      </div>

      {/* Collapsible Bottom Control Dock (solid/rgba surface, zero backdrop-filter over WebGL) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center max-w-[94%]">
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          aria-expanded={!dockCollapsed}
          className="mb-1.5 inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-[#0F172A]/95 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" aria-hidden="true" />
              <span>Show 3D Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#0F172A]/95 p-1.5 shadow-lg">
            {(
              [
                { id: 'assembled', label: 'Assembled' },
                { id: 'exploded', label: 'Exploded' },
                { id: 'blueprint', label: 'Blueprint' },
              ] as const
            ).map((item) => {
              const active = viewMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setViewMode(item.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            <span className="h-4 w-px bg-slate-700 mx-0.5" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume 3D rotation' : 'Pause 3D rotation'}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{paused ? 'Play' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('assembled');
                resetTriggerRef.current += 1;
              }}
              aria-label="Reset 3D camera view"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
