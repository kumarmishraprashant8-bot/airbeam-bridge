import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// AdvancedViewer: a drop-in, non-invasive React component to replace or sit beside the existing Viewer.
// - Uses plain three.js (no extra dependencies) so it won't force new installs
// - Adds interactive features: hover tooltips, click-to-add point loads, uniform load slider,
//   earthquake (harmonic) excitation, soil spring visualization, force arrows and color-mapped membrane
// - Exposes a compact control panel on the left (can be docked) and does NOT change your current app structure.

// USAGE
// 1) Save this file as frontend/src/components/AdvancedViewer.tsx
// 2) In App.tsx or wherever you want the advanced viewer, import: import AdvancedViewer from "./components/AdvancedViewer";
// 3) Replace <Viewer payload={payload} /> with <AdvancedViewer payload={payload} /> or render both side-by-side.
// 4) No new npm installs required (uses three, which your project already uses). Restart frontend if needed.

// NOTES
// - The engineering calculations inside are intentionally approximate (fast, visual) — exact FEA belongs in the backend.
// - Styling is embedded for convenience; adapt to your CSS system if desired.

type Payload = Record<string, any>;

export default function AdvancedViewer({ payload }: { payload: Payload }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [uniformLoad, setUniformLoad] = useState<number>(Number(payload?.loads?.live_load_uniform_kN_m2 ?? 1.5));
  const [earthquakeAmp, setEarthquakeAmp] = useState<number>(0);
  const [soilK, setSoilK] = useState<number>(1000);
  const [pointLoads, setPointLoads] = useState<Array<{ x: number; kN: number }>>([]);
  const [isPlaying, setIsPlaying] = useState(true);

  // small utility to generate the geometry data (scaled to camera)
  const geomData = useMemo(() => {
    const span = Number(payload?.geometry?.span_l_mm || 8000);
    const width = Number(payload?.geometry?.bridge_clear_width_mm || 1500);
    const airh = Number(payload?.airbeam?.airbeam_height_mm || 300);
    const scale = 0.01; // matches your original viewer scale
    return {
      span: span * scale,
      width: width * scale,
      airh: airh * scale,
    };
  }, [payload]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 5000);

// Proper engineering-style isometric view
camera.position.set(
  geomData.span * 0.6,
  geomData.span * 0.35,
  geomData.span * 0.6
);

camera.lookAt(0, 0, 0);


    scene.background = new THREE.Color(0x0b0f14);
    // Ground grid for scale reference
const grid = new THREE.GridHelper(50, 50, 0x333333, 0x1a1a1a);
grid.position.y = -0.01;
scene.add(grid);

// Axes helper (X-red, Y-green, Z-blue)
const axes = new THREE.AxesHelper(5);
scene.add(axes);


const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
keyLight.position.set(4, 6, 2);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x66ccff, 0.6);
rimLight.position.set(-4, 2, -3);
scene.add(rimLight);

    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(0.5, 1, 0.5);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();


    // create membrane plane (dynamic vertices for color mapping)
    const segX = 40;
    const segY = 10;
    const geom = new THREE.PlaneGeometry(geomData.span, geomData.width, segX, segY);
    geom.rotateX(-Math.PI / 2);

    // store baseline y positions
    const baseVertices = new Float32Array(geom.attributes.position.array.length);
    baseVertices.set(geom.attributes.position.array);

    // vertex color attribute
    const colors = new Float32Array((segX + 1) * (segY + 1) * 3);
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, metalness: 0.05, roughness: 0.7 });
    const membrane = new THREE.Mesh(geom, mat);
    membrane.position.y = 0;
    scene.add(membrane);
    // 👇 PASTE THIS BELOW
const edges = new THREE.EdgesGeometry(membrane.geometry);
const edgeLines = new THREE.LineSegments(
  edges,
  new THREE.LineBasicMaterial({
    color: 0x00ff88,
    opacity: 0.6,
    transparent: true,
  })
);
membrane.add(edgeLines);

    // airbeam cylinder
    const cylGeom = new THREE.CylinderGeometry(geomData.airh, geomData.airh, geomData.span + 0.01, 32);
    const cylMat = new THREE.MeshStandardMaterial({ color: 0xffb74d, metalness: 0.1, roughness: 0.8 });
    const cyl = new THREE.Mesh(cylGeom, cylMat);
    cyl.rotateZ(Math.PI / 2);
    cyl.position.set(0, geomData.airh * 0.5, 0);
    scene.add(cyl);

    // support representation (springs)
    const supportGroup = new THREE.Group();
    scene.add(supportGroup);

    // arrow helpers for point loads
    const arrowGroup = new THREE.Group();
    scene.add(arrowGroup);

    // raycaster for hover/click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // helper: update vertex colors by simple "stress" proxy (deflection magnitude)
    function updateVertexColors() {
      const pos = geom.attributes.position as THREE.BufferAttribute;
      const col = geom.attributes.color as THREE.BufferAttribute;
      const n = pos.count;
      let maxDisp = 0;
      for (let i = 0; i < n; i++) {
        const y = pos.getY(i);
        maxDisp = Math.max(maxDisp, Math.abs(y));
      }
      for (let i = 0; i < n; i++) {
        const y = pos.getY(i);
        const t = Math.min(1, Math.abs(y) / (maxDisp + 1e-6));
        // blue->green->yellow->red
        const r = Math.min(1, t * 2);
        const g = Math.min(1, (1 - Math.abs(t - 0.5) * 2));
        const b = 1 - t;
        col.setXYZ(i, r, g, b);
      }
      col.needsUpdate = true;
    }

    // small physics-like step: apply uniform load + point loads + soil springs + earthquake
    let time = 0;
    function applyLoads(dt: number) {
      const pos = geom.attributes.position as THREE.BufferAttribute;
      const n = pos.count;

      // reset to base
      for (let i = 0; i < n; i++) {
        pos.setY(i, baseVertices[i * 3 + 1]);
      }

      // compute uniform downward displacement (very approximate)
      const uniformDisp = -uniformLoad * 0.00008; // tuned scale

      // apply uniform
      for (let i = 0; i < n; i++) {
        pos.setY(i, pos.getY(i) + uniformDisp);
      }

      // point loads from state
      const width = geomData.width;
      const span = geomData.span;
      // map x position to geometry index
      const vertsX = segX + 1;
      const vertsY = segY + 1;
      for (const pl of pointLoads) {
        const xNorm = (pl.x / (payload.geometry?.span_l_mm ?? 8000)) * span; // pl.x expected in mm
        // find nearest column
        // convert pl.x (mm) -> local -span/2..span/2
        const localX = (pl.x - (payload.geometry?.span_l_mm ?? 8000) / 2) * 0.0015;
        // apply gaussian influence along X
        for (let iy = 0; iy < vertsY; iy++) {
          for (let ix = 0; ix < vertsX; ix++) {
            const idx = ix + iy * vertsX;
            const vx = (ix / (vertsX - 1) - 0.5) * span;
            const dist = Math.abs(vx - localX);
            const influence = Math.exp(-Math.pow(dist / (span * 0.08), 2));
            const add = -pl.kN * 0.0003 * influence;
            pos.setY(idx, pos.getY(idx) + add);
          }
        }
      }

      // earthquake harmonic: shift by sin(time)
      if (earthquakeAmp > 0) {
        const amp = earthquakeAmp * 0.00005; // tuned
        for (let i = 0; i < n; i++) {
          pos.setY(i, pos.getY(i) + Math.sin(time * 4 + i * 0.1) * amp);
        }
      }

      pos.needsUpdate = true;
    }

    // update support springs visualization
    function updateSupports() {
      supportGroup.clear();
      const positions = payload.supports?.support_positions_mm || [0, (payload.geometry?.span_l_mm || 8000)];
      for (const p of positions) {
        const localX = (p - (payload.geometry?.span_l_mm || 8000) / 2) * 0.0015;
        const geomS = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8);
        const matS = new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.2, roughness: 0.6 });
        const s = new THREE.Mesh(geomS, matS);
        s.position.set(localX, -0.04, 0);
        supportGroup.add(s);

        // soil spring line proportional to soilK
        const springLen = Math.min(0.3, 0.001 + 0.00008 * soilK);
        const springGeom = new THREE.CylinderGeometry(0.003, 0.003, springLen, 6);
        const spring = new THREE.Mesh(springGeom, new THREE.MeshStandardMaterial({ color: 0xffaa00 }));
        spring.position.set(localX, -0.04 - springLen / 2, 0);
        supportGroup.add(spring);
      }
    }

    // draw point load arrows
    function updateArrows() {
      arrowGroup.clear();
      for (const pl of pointLoads) {
        const localX = (pl.x - (payload.geometry?.span_l_mm || 8000) / 2) * 0.0015;
        const origin = new THREE.Vector3(localX, 0.1, 0);
        const dir = new THREE.Vector3(0, -1, 0);
        const len = Math.min(0.6, 0.05 + Math.abs(pl.kN) * 0.02);
        const arrow = new THREE.ArrowHelper(dir, origin, len, 0xff2222, 0.08, 0.06);
        arrowGroup.add(arrow);
      }
    }

    updateVertexColors();
    updateSupports();
    updateArrows();

    // pointer interactions
    function onPointerMove(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(membrane);
      if (hits.length > 0) {
        const pt = hits[0].point;
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "block";
          tooltipRef.current.style.left = `${e.clientX + 12}px`;
          tooltipRef.current.style.top = `${e.clientY + 12}px`;
          tooltipRef.current.innerHTML = `x: ${ ( (pt.x / geomData.span + 0.5) * (payload.geometry?.span_l_mm || 8000) ).toFixed(0) } mm<br>z: ${ ( (pt.z / geomData.width + 0.5) * (payload.geometry?.bridge_clear_width_mm || 1500) ).toFixed(0) } mm`;
        }
      } else {
        if (tooltipRef.current) tooltipRef.current.style.display = "none";
      }
    }

    function onClick(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(membrane);
      if (hits.length > 0) {
        const pt = hits[0].point;
        const x_mm = ((pt.x / geomData.span + 0.5) * (payload.geometry?.span_l_mm || 8000));
        // default point load 10 kN
        setPointLoads((s) => [...s, { x: Math.max(0, Math.min(payload.geometry?.span_l_mm || 8000, x_mm)), kN: 10 }]);
      }
    }

    renderer.domElement.addEventListener("mousemove", onPointerMove);
    renderer.domElement.addEventListener("click", onClick);

    // animation loop
    let raf = 0;
    let last = performance.now();
    function animate(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      if (isPlaying) time += dt;
      applyLoads(dt);
      updateVertexColors();
      updateSupports();
      updateArrows();
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);

    // resize handler
    function onResize() {
      const W = container.clientWidth;
      const H = container.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener("resize", onResize);

    // cleanup
    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("mousemove", onPointerMove);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [containerRef, geomData, uniformLoad, pointLoads, earthquakeAmp, soilK, isPlaying, payload]);

  // reflect pointLoads visually within effect via state change
  useEffect(() => {
    // When point loads change we need to trigger a frame — the three loop reads the state
    // No-op here — state update already triggers re-render; the three-loop picks up new state.
  }, [pointLoads]);

  return (
  <div
    style={{
      position: "absolute",
      top: 12,
      right: 12,
      bottom: 12,
      width: 340,
      background: "#ffffff",
      borderRadius: 12,
      boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
      padding: 14,
      overflowY: "auto",
      zIndex: 20,
      fontFamily: "Inter, system-ui, sans-serif",
    }}
  >

      <div style={{ width: 320, padding: 12, boxSizing: "border-box", background: "#fff", color: "#111", borderRadius: 8, boxShadow: "0 6px 18px rgba(2,6,23,0.08)" }}>
        <h3 style={{ margin: "6px 0" }}>Advanced Controls</h3>
        <div
  style={{
    marginBottom: 10,
    padding: "8px 10px",
    background: "#0b1220",
    color: "#9be7ff",
    borderRadius: 8,
    fontSize: 12,
  }}
>
  <strong>Interactive structural visualization</strong>
  <br />
  <span style={{ color: "#ccc" }}>
    Hover: coordinates · Click: point load · Sliders: parametric response
  </span>
</div>

        <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>Interactive loads, earthquake, soil springs, and point loads.</div>
        <label style={{ display: "block", marginBottom: 6 }}>Uniform live load (kN/m²)</label>
        <input type="range" min={0} max={10} step={0.1} value={uniformLoad} onChange={(e) => setUniformLoad(Number(e.target.value))} style={{ width: "100%" }} />
        <div style={{ fontSize: 13, marginBottom: 10 }}>{uniformLoad.toFixed(2)} kN/m²</div>

        <label style={{ display: "block", marginBottom: 6 }}>Earthquake amplitude</label>
        <input type="range" min={0} max={50} step={1} value={earthquakeAmp} onChange={(e) => setEarthquakeAmp(Number(e.target.value))} style={{ width: "100%" }} />
        <div style={{ fontSize: 13, marginBottom: 10 }}>{earthquakeAmp} units</div>

        <label style={{ display: "block", marginBottom: 6 }}>Soil stiffness (kN/m)</label>
        <input type="range" min={100} max={10000} step={50} value={soilK} onChange={(e) => setSoilK(Number(e.target.value))} style={{ width: "100%" }} />
        <div style={{ fontSize: 13, marginBottom: 10 }}>{soilK} kN/m</div>

        <div style={{ marginTop: 8 }}>Click on the membrane to add a 10 kN point load at that location.<br/>Use the arrows in the scene to identify point loads.</div>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button onClick={() => setPointLoads([])} style={{ padding: "6px 8px" }}>Clear point loads</button>
          <button onClick={() => setIsPlaying((s) => !s)} style={{ padding: "6px 8px" }}>{isPlaying ? 'Pause' : 'Play'}</button>
        </div>

        <hr style={{ margin: "12px 0" }} />
        <div style={{ fontSize: 13 }}>
          <strong>Added point loads</strong>
          <ul style={{ maxHeight: 160, overflow: 'auto', paddingLeft: 18 }}>
            {pointLoads.map((p, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                x: {Math.round(p.x)} mm — {p.kN} kN {' '}
                <button onClick={() => setPointLoads((s) => s.filter((_, idx) => idx !== i))} style={{ marginLeft: 6 }}>Remove</button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          Tip: Hover the membrane to see coordinates. Click to add point loads. Use the sliders for quick parametric exploration.
        </div>
      </div>

      <div
  ref={containerRef}
  style={{
    position: "absolute",
    inset: 0,
    zIndex: 1,
  }}
>

        <div ref={tooltipRef} style={{ position: 'fixed', display: 'none', background: '#111', color: '#fff', padding: '6px 8px', borderRadius: 6, pointerEvents: 'none', fontSize: 12 }} />
      </div>
    </div>
  );
}
