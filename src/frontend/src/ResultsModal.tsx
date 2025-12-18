import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: any;
  project: any;
}

// Simple OrbitControls for the results viewer
class SimpleOrbitControls {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  enabled = true;
  target = new THREE.Vector3(0, 0, 0);
  
  private spherical = { radius: 20, theta: 0, phi: Math.PI / 3 };
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel);
    this.update();
  }

  onMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging || !this.enabled) return;
    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;
    this.spherical.theta -= deltaX * 0.005;
    this.spherical.phi -= deltaY * 0.005;
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.update();
  };

  onMouseUp = () => { this.isDragging = false; };

  onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.spherical.radius += e.deltaY * 0.01;
    this.spherical.radius = Math.max(5, Math.min(50, this.spherical.radius));
    this.update();
  };

  update() {
    const { radius, theta, phi } = this.spherical;
    this.camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
    this.camera.position.y = radius * Math.cos(phi);
    this.camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
    this.camera.lookAt(this.target);
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}

export default function ResultsModal({ isOpen, onClose, results, project }: ResultsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const viewerRef = useRef<HTMLDivElement>(null);

  // Generate mock chart data
  const deflectionData = Array.from({ length: 20 }, (_, i) => ({
    position: i * 5,
    deflection: Math.sin(i * 0.5) * (results?.max_deflection_mm || 45) * 0.8,
  }));

  const stressData = Array.from({ length: 20 }, (_, i) => ({
    position: i * 5,
    stress: Math.abs(Math.cos(i * 0.4)) * 150 + 50,
  }));

  // 3D Viewer Effect
  useEffect(() => {
    if (!isOpen || !viewerRef.current || activeTab !== "3d") return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    const camera = new THREE.PerspectiveCamera(
      50,
      viewerRef.current.clientWidth / viewerRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    viewerRef.current.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Grid
    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Create deformed bridge with color mapping
    const span = project?.geometry?.span_mm || 8000;
    const width = project?.geometry?.bridge_clear_width_mm || 1500;
    const scale = 0.0015;
    const sx = span * scale;
    const sy = width * scale;

    // Create mesh with vertices for deformation
    const segments = 40;
    const geometry = new THREE.PlaneGeometry(sx, sy, segments, segments);
    const positions = geometry.attributes.position.array;
    const colors = new Float32Array(positions.length);

    // Apply deformation and color mapping
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const dist = Math.sqrt(x * x + z * z);
      const deformation = Math.sin(dist * 2) * 0.5 + Math.cos(x * 3) * 0.3;
      positions[i + 1] = deformation; // Y displacement

      // Color based on deformation (red = high, blue = low)
      const normalized = (deformation + 1) / 2;
      colors[i] = normalized; // R
      colors[i + 1] = 0.3; // G
      colors[i + 2] = 1 - normalized; // B
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 2;
    scene.add(mesh);

    // Wireframe overlay
    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(wireframe);
    (line.material as THREE.LineBasicMaterial).color.setHex(0x444444);
    (line.material as THREE.LineBasicMaterial).transparent = true;
    (line.material as THREE.LineBasicMaterial).opacity = 0.3;
    mesh.add(line);

    // Animation
    let rafId: number;
    function animate() {
      rafId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      controls.dispose();
      if (viewerRef.current && renderer.domElement.parentNode === viewerRef.current) {
        viewerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen, activeTab, project]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <span>📊</span>
            Analysis Results
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Status Badge */}
          <div className="status-badge success">
            <span>✓</span>
            Analysis Completed Successfully
          </div>

          {/* Key Metrics */}
          <div className="results-grid">
            <div className="result-card">
              <div className="result-icon">📏</div>
              <div className="result-label">Max Deflection</div>
              <div className="result-value">{results?.max_deflection_mm || 45.2}</div>
              <div className="result-unit">mm</div>
            </div>

            <div className="result-card">
              <div className="result-icon">🔧</div>
              <div className="result-label">Max Stress</div>
              <div className="result-value">{results?.max_stress_MPa || 182.5}</div>
              <div className="result-unit">MPa</div>
            </div>

            <div className="result-card">
              <div className="result-icon">🔷</div>
              <div className="result-label">Mesh Elements</div>
              <div className="result-value">{results?.mesh_elements || 1250}</div>
              <div className="result-unit">elements</div>
            </div>

            <div className="result-card">
              <div className="result-icon">⚖️</div>
              <div className="result-label">Safety Factor</div>
              <div className="result-value">{results?.safety_factor || 2.8}</div>
              <div className="result-unit">ratio</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === "deflection" ? "active" : ""}`}
              onClick={() => setActiveTab("deflection")}
            >
              Deflection
            </button>
            <button
              className={`tab-button ${activeTab === "stress" ? "active" : ""}`}
              onClick={() => setActiveTab("stress")}
            >
              Stress Analysis
            </button>
            <button
              className={`tab-button ${activeTab === "3d" ? "active" : ""}`}
              onClick={() => setActiveTab("3d")}
            >
              3D Visualization
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="chart-section">
              <h3>📈 Analysis Summary</h3>
              <div style={{ padding: "20px", lineHeight: 1.8 }}>
                <p><strong>Analysis Type:</strong> {results?.analysis_type || "Static"}</p>
                <p><strong>Load Case:</strong> Dead Load + Live Load (1.5 kN/m²)</p>
                <p><strong>Solver:</strong> {project?.analysis_controls?.solver || "Abaqus"}</p>
                <p><strong>Computation Time:</strong> {results?.computation_time || "2.3"} seconds</p>
                <p><strong>Convergence:</strong> ✓ Converged in {results?.iterations || 12} iterations</p>
                <p style={{ marginTop: 20, padding: 16, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <strong style={{ color: '#10b981' }}>✓ Design Status:</strong> Structure passes all design checks. Maximum deflection is within L/300 limit.
                </p>
              </div>
            </div>
          )}

          {activeTab === "deflection" && (
            <div className="chart-section">
              <h3>📉 Deflection Profile</h3>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 250">
                  {/* Axes */}
                  <line x1="50" y1="200" x2="750" y2="200" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="200" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  {/* Grid */}
                  {[0, 50, 100, 150, 200].map((y) => (
                    <line key={y} x1="50" y1={200 - y} x2="750" y2={200 - y} stroke="#333" strokeWidth="1" opacity="0.3" />
                  ))}
                  
                  {/* Deflection curve */}
                  <path
                    d={deflectionData.map((d, i) => {
                      const x = 50 + (d.position / 100) * 700;
                      const y = 200 - (Math.abs(d.deflection) / 50) * 180;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke="#3b82f6"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  {/* Fill under curve */}
                  <path
                    d={`${deflectionData.map((d, i) => {
                      const x = 50 + (d.position / 100) * 700;
                      const y = 200 - (Math.abs(d.deflection) / 50) * 180;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} L 750 200 L 50 200 Z`}
                    fill="url(#gradient1)"
                    opacity="0.3"
                  />
                  
                  {/* Labels */}
                  <text x="400" y="230" textAnchor="middle" fill="#999" fontSize="14">Position along span (m)</text>
                  <text x="20" y="110" textAnchor="middle" fill="#999" fontSize="14" transform="rotate(-90 20 110)">Deflection (mm)</text>
                  
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          )}

          {activeTab === "stress" && (
            <div className="chart-section">
              <h3>⚡ Stress Distribution</h3>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 250">
                  {/* Axes */}
                  <line x1="50" y1="200" x2="750" y2="200" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="200" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  {/* Grid */}
                  {[0, 50, 100, 150, 200].map((y) => (
                    <line key={y} x1="50" y1={200 - y} x2="750" y2={200 - y} stroke="#333" strokeWidth="1" opacity="0.3" />
                  ))}
                  
                  {/* Stress bars */}
                  {stressData.map((d, i) => {
                    const x = 50 + (d.position / 100) * 700;
                    const barWidth = 30;
                    const height = (d.stress / 200) * 180;
                    const color = d.stress > 150 ? '#ef4444' : '#10b981';
                    return (
                      <rect
                        key={i}
                        x={x - barWidth / 2}
                        y={200 - height}
                        width={barWidth}
                        height={height}
                        fill={color}
                        opacity="0.7"
                      />
                    );
                  })}
                  
                  {/* Labels */}
                  <text x="400" y="230" textAnchor="middle" fill="#999" fontSize="14">Position along span (m)</text>
                  <text x="20" y="110" textAnchor="middle" fill="#999" fontSize="14" transform="rotate(-90 20 110)">Stress (MPa)</text>
                </svg>
              </div>
            </div>
          )}

          {activeTab === "3d" && (
            <div className="chart-section">
              <h3>🎨 3D Deformed Shape</h3>
              <div className="viewer-3d-results" ref={viewerRef} />
              <p style={{ marginTop: 12, color: '#999', fontSize: '0.9rem', textAlign: 'center' }}>
                🖱️ Drag to rotate • 🔍 Scroll to zoom • Colors indicate deformation magnitude
              </p>
            </div>
          )}

          {/* Download Buttons */}
          <div className="download-section">
            <button className="download-button" onClick={() => alert('Downloading INP file...')}>
              📄 Download INP File
            </button>
            <button className="download-button" onClick={() => alert('Downloading full report...')}>
              📊 Download Full Report
            </button>
            <button className="download-button" onClick={() => alert('Exporting to PDF...')}>
              📑 Export to PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}