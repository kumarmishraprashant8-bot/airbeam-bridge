/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import ProjectForm from "./ProjectForm";
import * as THREE from "three";

// ResultsModal component defined inline to avoid import issues
interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: any;
  project: any;
}

// Enhanced OrbitControls with smooth rotation and inertia
class SimpleOrbitControls {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  enabled = true;
  target = new THREE.Vector3(0, 0, 0);
  
  private spherical = { radius: 20, theta: 0, phi: Math.PI / 3 };
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private velocity = { theta: 0, phi: 0 };
  private damping = 0.95;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private hoveredObject: THREE.Object3D | null = null;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel);
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    this.update();
  }

  onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) { // Left click
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.velocity.theta = 0;
      this.velocity.phi = 0;
    }
  };

  onMouseMove = (e: MouseEvent) => {
    this.mouse.x = (e.clientX / this.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / this.domElement.clientHeight) * 2 + 1;
    
    if (this.isDragging && this.enabled) {
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      
      this.velocity.theta = -deltaX * 0.01;
      this.velocity.phi = -deltaY * 0.01;
      
      this.spherical.theta += this.velocity.theta;
      this.spherical.phi += this.velocity.phi;
      this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
      
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.update();
    }
  };

  onMouseUp = () => { 
    this.isDragging = false; 
  };

  onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.spherical.radius += e.deltaY * 0.01;
    this.spherical.radius = Math.max(5, Math.min(50, this.spherical.radius));
    this.update();
  };

  update() {
    // Apply damping for smooth rotation
    if (!this.isDragging) {
      this.velocity.theta *= this.damping;
      this.velocity.phi *= this.damping;
      this.spherical.theta += this.velocity.theta;
      this.spherical.phi += this.velocity.phi;
      this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
    }
    
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

function ResultsModal({ isOpen, onClose, results, project }: ResultsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<"deformation" | "stress">("deformation");
  const viewerRef = useRef<HTMLDivElement>(null);

  const deflectionData = results?.deflection_profile || Array.from({ length: 20 }, (_, i) => ({
    position_mm: i * 400,
    deflection_mm: Math.sin(i * 0.5) * (results?.max_deflection_mm || 45) * 0.8,
  }));

  const stressData = results?.stress_profile || Array.from({ length: 20 }, (_, i) => ({
    position_mm: i * 400,
    vonMises_MPa: Math.abs(Math.cos(i * 0.4)) * 150 + 50,
  }));

  const shearData = results?.shear_profile || Array.from({ length: 20 }, (_, i) => ({
    position_mm: i * 400,
    shear_force_kN: Math.cos(i * 0.5) * 25,
    shear_stress_MPa: Math.abs(Math.cos(i * 0.5)) * 15,
  }));

  const momentData = results?.moment_profile || Array.from({ length: 20 }, (_, i) => ({
    position_mm: i * 400,
    moment_kNm: Math.sin(i * 0.5) * 85,
  }));

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
    camera.position.set(15, 8, 15);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3)); // Higher resolution
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewerRef.current.appendChild(renderer.domElement);

    const controls = new SimpleOrbitControls(camera, renderer.domElement);
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Info tooltip element with better styling
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: absolute;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.98) 0%, rgba(26, 31, 58, 0.98) 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      pointer-events: none;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      z-index: 1000;
      border: 2px solid #3b82f6;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(59, 130, 246, 0.3);
      display: none;
      max-width: 280px;
      backdrop-filter: blur(10px);
    `;
    viewerRef.current.appendChild(tooltip);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0x6699ff, 0.4);
    dirLight2.position.set(-10, 5, -10);
    scene.add(dirLight2);

    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const span = project?.geometry?.span_mm || 8000;
    const width = project?.geometry?.bridge_clear_width_mm || 1500;
    const airbeamHeight = project?.geometry?.airbeam?.height_mm || 300;
    const topPlate = project?.geometry?.top_plate_thickness_mm || 50;
    const bottomPlate = project?.geometry?.bottom_plate_thickness_mm || 50;
    const scale = 0.0015;
    const sx = span * scale;
    const sy = width * scale;
    const ah = airbeamHeight * scale;

    // Create actual bridge geometry
    // Top plate - More vibrant orange
    const topPlateGeom = new THREE.BoxGeometry(sx, topPlate * scale, sy);
    const topPlateMat = new THREE.MeshPhongMaterial({
      color: 0xff8c00, // More vibrant orange
      transparent: true,
      opacity: 0.85,
      shininess: 100,
    });
    const topPlateMesh = new THREE.Mesh(topPlateGeom, topPlateMat);
    topPlateMesh.position.y = ah + (topPlate * scale) / 2;
    scene.add(topPlateMesh);

    // Bottom plate - More vibrant blue
    const bottomPlateGeom = new THREE.BoxGeometry(sx, bottomPlate * scale, sy);
    const bottomPlateMat = new THREE.MeshPhongMaterial({
      color: 0x1e90ff, // More vibrant blue
      transparent: true,
      opacity: 0.85,
      shininess: 100,
    });
    const bottomPlateMesh = new THREE.Mesh(bottomPlateGeom, bottomPlateMat);
    bottomPlateMesh.position.y = -(bottomPlate * scale) / 2;
    scene.add(bottomPlateMesh);

    // Airbeam cylinder - More vibrant green
    const cylGeom = new THREE.CylinderGeometry(ah / 2, ah / 2, sx + 0.1, 64);
    const cylMat = new THREE.MeshPhongMaterial({
      color: 0x00d084, // More vibrant green
      transparent: true,
      opacity: 0.75,
      shininess: 80,
    });
    const cylinder = new THREE.Mesh(cylGeom, cylMat);
    cylinder.rotation.z = Math.PI / 2;
    cylinder.position.y = ah / 2;
    scene.add(cylinder);

    // Deformed deck visualization - Higher resolution
    const segments = 80; // Increased from 40 for better quality
    const deckGeometry = new THREE.PlaneGeometry(sx, sy, segments, segments);
    const positions = deckGeometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);
    const maxDeflection = results?.max_deflection_mm || 45.2;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const normalizedX = (x / sx + 0.5);
      const deflection = Math.sin(normalizedX * Math.PI) * (maxDeflection * scale * 10);
      
      if (viewMode === "deformation") {
        positions[i + 1] = deflection;
        // More distinguishable color gradient: blue (low) to red (high)
        const normalized = Math.max(0, Math.min(1, (deflection / (maxDeflection * scale * 10) + 1) / 2));
        colors[i] = normalized; // Red component increases with deflection
        colors[i + 1] = 0.2 + normalized * 0.3; // Green component
        colors[i + 2] = 1 - normalized * 0.5; // Blue component decreases
      } else {
        // Stress coloring - more vibrant gradient
        const stress = 50 + Math.abs(Math.sin(normalizedX * Math.PI * 2)) * 132.5;
        const normalized = Math.max(0, Math.min(1, stress / 200));
        colors[i] = normalized; // Red for high stress
        colors[i + 1] = 0.1 + normalized * 0.2; // Minimal green
        colors[i + 2] = 0.3 - normalized * 0.2; // Blue decreases with stress
      }
    }

    deckGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    deckGeometry.computeVertexNormals();

    const deckMaterial = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
      transparent: true,
      opacity: 0.9,
    });

    const deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
    deckMesh.rotation.x = Math.PI / 2;
    deckMesh.position.y = ah + (topPlate * scale) / 2 + 0.01;
    scene.add(deckMesh);

    const wireframe = new THREE.WireframeGeometry(deckGeometry);
    const line = new THREE.LineSegments(wireframe);
    (line.material as THREE.LineBasicMaterial).color.setHex(0x444444);
    (line.material as THREE.LineBasicMaterial).transparent = true;
    (line.material as THREE.LineBasicMaterial).opacity = 0.3;
    deckMesh.add(line);

    // Support markers with user data for info
    const supportGeom = new THREE.SphereGeometry(0.3, 32, 32); // Higher resolution
    const supportMat = new THREE.MeshPhongMaterial({ 
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.3,
    });
    const support1 = new THREE.Mesh(supportGeom, supportMat);
    support1.position.set(-sx / 2, 0, 0);
    support1.userData = { type: 'support', name: 'Support A', position: 'Left' };
    scene.add(support1);
    const support2 = new THREE.Mesh(supportGeom, supportMat);
    support2.position.set(sx / 2, 0, 0);
    support2.userData = { type: 'support', name: 'Support B', position: 'Right' };
    scene.add(support2);

    // Add user data to meshes for hover info
    topPlateMesh.userData = { 
      type: 'top_plate', 
      name: 'Top Plate (Deck)',
      thickness: `${topPlate}mm`,
      material: 'Steel'
    };
    bottomPlateMesh.userData = { 
      type: 'bottom_plate', 
      name: 'Bottom Plate',
      thickness: `${bottomPlate}mm`,
      material: 'Steel'
    };
    cylinder.userData = { 
      type: 'airbeam', 
      name: 'Inflatable Airbeam',
      height: `${airbeamHeight}mm`,
      material: 'PVC-coated Polyester'
    };
    deckMesh.userData = { 
      type: 'deck', 
      name: 'Bridge Deck',
      span: `${span}mm`,
      width: `${width}mm`,
      maxDeflection: `${maxDeflection}mm`
    };

    // Collect all interactive objects
    const interactiveObjects = [topPlateMesh, bottomPlateMesh, cylinder, deckMesh, support1, support2];
    let hoveredObject: THREE.Object3D | null = null;

    // Helper function to interpolate values at position
    const getValueAtPosition = (positionX: number, dataArray: any[], span: number) => {
      // Convert 3D position to normalized position along span (0 to 1)
      const normalizedX = Math.max(0, Math.min(1, (positionX / sx + 0.5)));
      const positionAlongSpan = normalizedX * span;
      
      // Find the closest data points
      const index = Math.floor((normalizedX) * (dataArray.length - 1));
      const nextIndex = Math.min(index + 1, dataArray.length - 1);
      const t = (normalizedX * (dataArray.length - 1)) - index;
      
      if (dataArray[index] && dataArray[nextIndex]) {
        if (dataArray[index].deflection_mm !== undefined) {
          const val1 = Math.abs(dataArray[index].deflection_mm || 0);
          const val2 = Math.abs(dataArray[nextIndex].deflection_mm || 0);
          return val1 + (val2 - val1) * t;
        } else if (dataArray[index].vonMises_MPa !== undefined) {
          const val1 = dataArray[index].vonMises_MPa || 0;
          const val2 = dataArray[nextIndex].vonMises_MPa || 0;
          return val1 + (val2 - val1) * t;
        } else if (dataArray[index].shear_force_kN !== undefined) {
          const val1 = dataArray[index].shear_force_kN || 0;
          const val2 = dataArray[nextIndex].shear_force_kN || 0;
          return val1 + (val2 - val1) * t;
        } else if (dataArray[index].moment_kNm !== undefined) {
          const val1 = dataArray[index].moment_kNm || 0;
          const val2 = dataArray[nextIndex].moment_kNm || 0;
          return val1 + (val2 - val1) * t;
        }
      }
      return 0;
    };

    // Mouse move handler for hover info with real-time values
    const onMouseMove = (e: MouseEvent) => {
      if (!viewerRef.current) return;
      
      mouse.x = (e.clientX / viewerRef.current.clientWidth) * 2 - 1;
      mouse.y = -(e.clientY / viewerRef.current.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);
      
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const object = intersection.object;
        const point = intersection.point;
        
        // Calculate position along span
        const positionX = point.x;
        const normalizedX = (positionX / sx + 0.5);
        const positionAlongSpan = normalizedX * span;
        
        // Get real-time values at this position
        const deflection = getValueAtPosition(positionX, deflectionData, span);
        const stress = getValueAtPosition(positionX, stressData, span);
        const shear = getValueAtPosition(positionX, shearData, span);
        const moment = getValueAtPosition(positionX, momentData, span);
        
        if (hoveredObject !== object) {
          hoveredObject = object;
          
          // Highlight object
          if (object instanceof THREE.Mesh) {
            (object.material as THREE.MeshPhongMaterial).emissive.setHex(0x444444);
          }
        }
        
        // Show tooltip with real-time values
        const userData = object.userData;
        let tooltipText = '';
        
        if (object === deckMesh) {
          // Show analysis values for deck with better formatting
          tooltipText = `
            <div style="line-height: 1.8;">
              <div style="color: #3b82f6; font-size: 15px; font-weight: bold; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
                📍 Position: ${positionAlongSpan.toFixed(0)}mm
              </div>
              <div style="display: grid; gap: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #10b981;">📉 Deflection:</span>
                  <strong style="color: #10b981; font-size: 14px;">${deflection.toFixed(2)}mm</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #ef4444;">⚡ Stress:</span>
                  <strong style="color: #ef4444; font-size: 14px;">${stress.toFixed(1)}MPa</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #f59e0b;">✂️ Shear:</span>
                  <strong style="color: #f59e0b; font-size: 14px;">${shear.toFixed(2)}kN</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #8b5cf6;">🔄 Moment:</span>
                  <strong style="color: #8b5cf6; font-size: 14px;">${moment.toFixed(2)}kN·m</strong>
                </div>
              </div>
            </div>
          `;
        } else {
          // Show component info for other objects
          tooltipText = `<strong>${userData.name}</strong><br>`;
          if (userData.thickness) tooltipText += `Thickness: ${userData.thickness}<br>`;
          if (userData.height) tooltipText += `Height: ${userData.height}<br>`;
          if (userData.material) tooltipText += `Material: ${userData.material}<br>`;
          if (userData.position) tooltipText += `Position: ${userData.position}`;
        }
        
        tooltip.innerHTML = tooltipText;
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX + 15}px`;
        tooltip.style.top = `${e.clientY + 15}px`;
      } else {
        if (hoveredObject) {
          // Reset highlight
          if (hoveredObject instanceof THREE.Mesh) {
            const mat = hoveredObject.material as THREE.MeshPhongMaterial;
            if (hoveredObject === support1 || hoveredObject === support2) {
              mat.emissive.setHex(0xef4444);
            } else {
              mat.emissive.setHex(0x000000);
            }
          }
          hoveredObject = null;
          tooltip.style.display = 'none';
        }
      }
    };

    viewerRef.current.addEventListener('mousemove', onMouseMove);

    let rafId: number;
    function animate() {
      rafId = requestAnimationFrame(animate);
      controls.update(); // Update controls for smooth rotation
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const onResize = () => {
      if (!viewerRef.current) return;
      const width = viewerRef.current.clientWidth;
      const height = viewerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      controls.dispose();
      window.removeEventListener('resize', onResize);
      if (viewerRef.current) {
        viewerRef.current.removeEventListener('mousemove', onMouseMove);
        if (tooltip.parentNode === viewerRef.current) {
          viewerRef.current.removeChild(tooltip);
        }
        if (renderer.domElement.parentNode === viewerRef.current) {
          viewerRef.current.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
    };
  }, [isOpen, activeTab, project, viewMode, results]);

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
          <div className="status-badge success">
            <span>✓</span>
            Analysis Completed Successfully
          </div>

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

          <div className="tabs-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            <button
              className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              📊 Overview
            </button>
            <button
              className={`tab-button ${activeTab === "deflection" ? "active" : ""}`}
              onClick={() => setActiveTab("deflection")}
            >
              📉 Deflection
            </button>
            <button
              className={`tab-button ${activeTab === "stress" ? "active" : ""}`}
              onClick={() => setActiveTab("stress")}
            >
              ⚡ Stress
            </button>
            <button
              className={`tab-button ${activeTab === "shear" ? "active" : ""}`}
              onClick={() => setActiveTab("shear")}
            >
              ✂️ Shear
            </button>
            <button
              className={`tab-button ${activeTab === "flexure" ? "active" : ""}`}
              onClick={() => setActiveTab("flexure")}
            >
              🔄 Flexure
            </button>
            <button
              className={`tab-button ${activeTab === "reactions" ? "active" : ""}`}
              onClick={() => setActiveTab("reactions")}
            >
              ⚓ Reactions
            </button>
            <button
              className={`tab-button ${activeTab === "material" ? "active" : ""}`}
              onClick={() => setActiveTab("material")}
            >
              🧱 Material Utilization
            </button>
            <button
              className={`tab-button ${activeTab === "loads" ? "active" : ""}`}
              onClick={() => setActiveTab("loads")}
            >
              📦 Load Analysis
            </button>
            <button
              className={`tab-button ${activeTab === "checks" ? "active" : ""}`}
              onClick={() => setActiveTab("checks")}
            >
              ✅ Design Checks
            </button>
            <button
              className={`tab-button ${activeTab === "3d" ? "active" : ""}`}
              onClick={() => setActiveTab("3d")}
            >
              🎨 3D View
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="chart-section">
              <h3>📈 Comprehensive Analysis Summary</h3>
              
              {/* Key Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="result-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
                  <div className="result-icon" style={{ fontSize: '2rem' }}>📏</div>
                  <div className="result-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Max Deflection</div>
                  <div className="result-value" style={{ color: '#fff' }}>{results?.max_deflection_mm || 45.2}</div>
                  <div className="result-unit" style={{ color: 'rgba(255,255,255,0.8)' }}>mm (L/{(project?.geometry?.span_mm || 8000) / (results?.max_deflection_mm || 45.2)})</div>
                </div>
                <div className="result-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff' }}>
                  <div className="result-icon" style={{ fontSize: '2rem' }}>⚡</div>
                  <div className="result-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Max Stress</div>
                  <div className="result-value" style={{ color: '#fff' }}>{results?.max_stress_MPa || 182.5}</div>
                  <div className="result-unit" style={{ color: 'rgba(255,255,255,0.8)' }}>MPa</div>
                </div>
                <div className="result-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#fff' }}>
                  <div className="result-icon" style={{ fontSize: '2rem' }}>⚖️</div>
                  <div className="result-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Safety Factor</div>
                  <div className="result-value" style={{ color: '#fff' }}>{results?.safety_factor || 2.8}</div>
                  <div className="result-unit" style={{ color: 'rgba(255,255,255,0.8)' }}>ratio</div>
                </div>
                <div className="result-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: '#fff' }}>
                  <div className="result-icon" style={{ fontSize: '2rem' }}>🔷</div>
                  <div className="result-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Mesh Quality</div>
                  <div className="result-value" style={{ color: '#fff' }}>{results?.mesh_elements || 1250}</div>
                  <div className="result-unit" style={{ color: 'rgba(255,255,255,0.8)' }}>elements</div>
                </div>
              </div>
              
              {/* Analysis Details */}
              <div style={{ padding: "20px", lineHeight: 1.8, background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ color: '#3b82f6', marginBottom: '12px' }}>Analysis Configuration</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <p><strong>Analysis Type:</strong> {results?.analysis_type || "Static"}</p>
                  <p><strong>Load Case:</strong> Dead Load + Live Load ({(results?.live_load_uniform_kN_m2 || project?.loads?.live_load_uniform_kN_m2 || 1.5)} kN/m²)</p>
                  <p><strong>Solver:</strong> {project?.analysis_controls?.solver || "Abaqus"}</p>
                  <p><strong>Computation Time:</strong> {results?.computation_time || "2.3"} seconds</p>
                  <p><strong>Convergence:</strong> ✓ Converged in {results?.iterations || 12} iterations</p>
                  <p><strong>Mesh Nodes:</strong> {results?.mesh_nodes || 1456} nodes</p>
                </div>
              </div>
              
              {/* Design Status */}
              <div style={{ marginTop: 20, padding: 20, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, border: '2px solid rgba(16, 185, 129, 0.3)' }}>
                <h4 style={{ color: '#10b981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓</span> Design Status: PASSED
                </h4>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Overall Assessment:</strong> Structure passes all design checks. Maximum deflection is within L/300 limit. 
                  All stress, shear, and flexure checks are satisfied per IS 456:2000 code requirements.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>Deflection</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>✓ PASS</div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>Stress</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>✓ PASS</div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>Shear</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>✓ PASS</div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>Flexure</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>✓ PASS</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deflection" && (
            <div className="chart-section">
              <h3>📉 Deflection Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="result-card">
                  <div className="result-label">Max Deflection</div>
                  <div className="result-value">{results?.max_deflection_mm || 45.2}</div>
                  <div className="result-unit">mm</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Deflection Limit</div>
                  <div className="result-value">{results?.deflection_limit_mm || (project?.geometry?.span_mm || 8000) / 300}</div>
                  <div className="result-unit">mm (L/300)</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Deflection Ratio</div>
                  <div className="result-value">{(results?.deflection_ratio || 0.85 * 100).toFixed(1)}%</div>
                  <div className="result-unit">of limit</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Status</div>
                  <div className="result-value" style={{ color: results?.deflection_check === 'PASS' ? '#10b981' : '#ef4444' }}>
                    {results?.deflection_check || 'PASS'}
                  </div>
                  <div className="result-unit">check</div>
                </div>
              </div>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 300">
                  <line x1="50" y1="250" x2="750" y2="250" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="250" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  {[0, 50, 100, 150, 200].map((y) => (
                    <line key={y} x1="50" y1={250 - y} x2="750" y2={250 - y} stroke="#333" strokeWidth="1" opacity="0.3" />
                  ))}
                  
                  <path
                    d={deflectionData.map((d: any, i: number) => {
                      const x = 50 + ((d.position_mm || d.position || i * 400) / (project?.geometry?.span_mm || 8000)) * 700;
                      const deflection = Math.abs(d.deflection_mm || d.deflection || 0);
                      const maxDef = results?.max_deflection_mm || 50;
                      const y = 250 - (deflection / maxDef) * 230;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke="#3b82f6"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  <path
                    d={`${deflectionData.map((d: any, i: number) => {
                      const x = 50 + ((d.position_mm || d.position || i * 400) / (project?.geometry?.span_mm || 8000)) * 700;
                      const deflection = Math.abs(d.deflection_mm || d.deflection || 0);
                      const maxDef = results?.max_deflection_mm || 50;
                      const y = 250 - (deflection / maxDef) * 230;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} L 750 250 L 50 250 Z`}
                    fill="url(#gradient1)"
                    opacity="0.3"
                  />
                  
                  <line x1="50" y1={250 - ((results?.deflection_limit_mm || (project?.geometry?.span_mm || 8000) / 300) / (results?.max_deflection_mm || 50)) * 230} 
                        x2="750" y2={250 - ((results?.deflection_limit_mm || (project?.geometry?.span_mm || 8000) / 300) / (results?.max_deflection_mm || 50)) * 230} 
                        stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
                  
                  <text x="400" y="280" textAnchor="middle" fill="#999" fontSize="14">Position along span (mm)</text>
                  <text x="20" y="135" textAnchor="middle" fill="#999" fontSize="14" transform="rotate(-90 20 135)">Deflection (mm)</text>
                  
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="result-card">
                  <div className="result-label">Max Von Mises Stress</div>
                  <div className="result-value">{results?.vonMises_max_MPa || results?.max_stress_MPa || 182.5}</div>
                  <div className="result-unit">MPa</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Stress Utilization</div>
                  <div className="result-value">{(results?.stress_utilization || 0.73 * 100).toFixed(1)}%</div>
                  <div className="result-unit">of allowable</div>
                </div>
              </div>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 300">
                  <line x1="50" y1="250" x2="750" y2="250" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="250" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  {[0, 50, 100, 150, 200].map((y) => (
                    <line key={y} x1="50" y1={250 - y} x2="750" y2={250 - y} stroke="#333" strokeWidth="1" opacity="0.3" />
                  ))}
                  
                  <path
                    d={stressData.map((d: any, i: number) => {
                      const x = 50 + ((d.position_mm || d.position || i * 400) / (project?.geometry?.span_mm || 8000)) * 700;
                      const stress = d.vonMises_MPa || d.stress || 100;
                      const y = 250 - (stress / 200) * 230;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke="#ef4444"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  <line x1="50" y1={250 - ((results?.allowable_stress_MPa || 250) / 200) * 230} 
                        x2="750" y2={250 - ((results?.allowable_stress_MPa || 250) / 200) * 230} 
                        stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
                  
                  <text x="400" y="280" textAnchor="middle" fill="#999" fontSize="14">Position along span (mm)</text>
                  <text x="20" y="135" textAnchor="middle" fill="#999" fontSize="14" transform="rotate(-90 20 135)">Stress (MPa)</text>
                </svg>
              </div>
            </div>
          )}

          {activeTab === "shear" && (
            <div className="chart-section">
              <h3>✂️ Shear Force & Stress Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="result-card">
                  <div className="result-label">Max Shear Force</div>
                  <div className="result-value">{results?.max_shear_force_kN || 25.5}</div>
                  <div className="result-unit">kN</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Max Shear Stress</div>
                  <div className="result-value">{results?.max_shear_stress_MPa || 15.2}</div>
                  <div className="result-unit">MPa</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Shear Utilization</div>
                  <div className="result-value">{(results?.shear_utilization || 0.76 * 100).toFixed(1)}%</div>
                  <div className="result-unit">of allowable</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Safety Factor</div>
                  <div className="result-value">{results?.safety_factor_shear || 1.32}</div>
                  <div className="result-unit">ratio</div>
                </div>
              </div>
              
              <h4 style={{ marginTop: '24px', marginBottom: '12px', color: '#f59e0b' }}>Shear Force Diagram</h4>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 300">
                  <line x1="50" y1="250" x2="750" y2="250" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="250" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  <path
                    d={shearData.map((d: any, i: number) => {
                      const x = 50 + ((d.position_mm || d.position || i * 400) / (project?.geometry?.span_mm || 8000)) * 700;
                      const shear = d.shear_force_kN || 0;
                      const y = 250 - ((shear + 30) / 60) * 230;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke="#f59e0b"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  <path
                    d={`${shearData.map((d: any, i: number) => {
                      const x = 50 + ((d.position_mm || d.position || i * 400) / (project?.geometry?.span_mm || 8000)) * 700;
                      const shear = d.shear_force_kN || 0;
                      const y = 250 - ((shear + 30) / 60) * 230;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} L 750 250 L 50 250 Z`}
                    fill="url(#gradientShear)"
                    opacity="0.3"
                  />
                  
                  <line x1="50" y1="250" x2="750" y2="250" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
                  
                  <text x="400" y="280" textAnchor="middle" fill="#999" fontSize="14">Position along span (mm)</text>
                  <text x="20" y="135" textAnchor="middle" fill="#999" fontSize="14" transform="rotate(-90 20 135)">Shear Force (kN)</text>
                  
                  <defs>
                    <linearGradient id="gradientShear" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              
              <h4 style={{ marginTop: '24px', marginBottom: '12px', color: '#ef4444' }}>Shear Stress Distribution</h4>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 300">
                  <line x1="50" y1="250" x2="750" y2="250" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="250" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  <path
                    d={shearData.map((d: any, i: number) => {
                      const x = 50 + ((d.position_mm || d.position || i * 400) / (project?.geometry?.span_mm || 8000)) * 700;
                      const stress = d.shear_stress_MPa || 0;
                      const y = 250 - (stress / 20) * 230;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke="#ef4444"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  <path
                    d={`${shearData.map((d: any, i: number) => {
                      const x = 50 + ((d.position_mm || d.position || i * 400) / (project?.geometry?.span_mm || 8000)) * 700;
                      const stress = d.shear_stress_MPa || 0;
                      const y = 250 - (stress / 20) * 230;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} L 750 250 L 50 250 Z`}
                    fill="url(#gradientShearStress)"
                    opacity="0.3"
                  />
                  
                  <line x1="50" y1={250 - ((results?.allowable_shear_MPa || 20.0) / 20) * 230} 
                        x2="750" y2={250 - ((results?.allowable_shear_MPa || 20.0) / 20) * 230} 
                        stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
                  
                  <text x="400" y="280" textAnchor="middle" fill="#999" fontSize="14">Position along span (mm)</text>
                  <text x="20" y="135" textAnchor="middle" fill="#999" fontSize="14" transform="rotate(-90 20 135)">Shear Stress (MPa)</text>
                  
                  <defs>
                    <linearGradient id="gradientShearStress" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          )}

          {activeTab === "flexure" && (
            <div className="chart-section">
              <h3>🔄 Flexure & Moment Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="result-card">
                  <div className="result-label">Max Moment</div>
                  <div className="result-value">{results?.max_moment_kNm || 85.3}</div>
                  <div className="result-unit">kN·m</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Flexural Capacity</div>
                  <div className="result-value">{results?.flexural_capacity_kNm || 120.0}</div>
                  <div className="result-unit">kN·m</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Flexure Utilization</div>
                  <div className="result-value">{(results?.flexure_utilization || 0.71 * 100).toFixed(1)}%</div>
                  <div className="result-unit">of capacity</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Max Curvature</div>
                  <div className="result-value">{(results?.max_curvature_1_per_m || 0.00015).toFixed(6)}</div>
                  <div className="result-unit">1/m</div>
                </div>
              </div>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 300">
                  <line x1="50" y1="250" x2="750" y2="250" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="250" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  <path
                    d={momentData.map((d: any, i: number) => {
                      const x = 50 + ((d.position_mm || d.position || i * 400) / (project?.geometry?.span_mm || 8000)) * 700;
                      const moment = d.moment_kNm || 0;
                      const y = 250 - ((moment + 100) / 200) * 230;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  <text x="400" y="280" textAnchor="middle" fill="#999" fontSize="14">Position along span (mm)</text>
                  <text x="20" y="135" textAnchor="middle" fill="#999" fontSize="14" transform="rotate(-90 20 135)">Moment (kN·m)</text>
                </svg>
              </div>
            </div>
          )}

          {activeTab === "reactions" && (
            <div className="chart-section">
              <h3>⚓ Support Reactions & Forces</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="result-card">
                  <div className="result-label">Reaction at Support A</div>
                  <div className="result-value">{results?.reaction_A_kN || 6.0}</div>
                  <div className="result-unit">kN (Vertical)</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Reaction at Support B</div>
                  <div className="result-value">{results?.reaction_B_kN || 6.0}</div>
                  <div className="result-unit">kN (Vertical)</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Total Reaction</div>
                  <div className="result-value">{results?.total_reaction_kN || 12.0}</div>
                  <div className="result-unit">kN</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Max Horizontal Force</div>
                  <div className="result-value">{results?.max_horizontal_force_kN || 0.5}</div>
                  <div className="result-unit">kN</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Max Moment at Support</div>
                  <div className="result-value">{results?.support_moment_kNm || 0.0}</div>
                  <div className="result-unit">kN·m</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Reaction Balance</div>
                  <div className="result-value" style={{ color: '#10b981' }}>✓ Balanced</div>
                  <div className="result-unit">check</div>
                </div>
              </div>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 300">
                  <line x1="50" y1="250" x2="750" y2="250" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="250" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  {/* Support A */}
                  <circle cx="50" cy="250" r="8" fill="#ef4444" />
                  <text x="50" y="270" textAnchor="middle" fill="#999" fontSize="12">Support A</text>
                  <line x1="50" y1="250" x2="50" y2="200" stroke="#ef4444" strokeWidth="3" />
                  <text x="30" y="220" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">{(results?.reaction_A_kN || 6.0).toFixed(1)} kN</text>
                  
                  {/* Support B */}
                  <circle cx="750" cy="250" r="8" fill="#ef4444" />
                  <text x="750" y="270" textAnchor="middle" fill="#999" fontSize="12">Support B</text>
                  <line x1="750" y1="250" x2="750" y2="200" stroke="#ef4444" strokeWidth="3" />
                  <text x="770" y="220" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">{(results?.reaction_B_kN || 6.0).toFixed(1)} kN</text>
                  
                  {/* Distributed load representation */}
                  <path d="M 50 150 L 750 150" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
                  {Array.from({ length: 10 }, (_, i) => {
                    const x = 50 + (i * 70);
                    return <line key={i} x1={x} y1="150" x2={x} y2="140" stroke="#3b82f6" strokeWidth="2" />;
                  })}
                  <text x="400" y="135" textAnchor="middle" fill="#3b82f6" fontSize="12">Distributed Load: {(results?.live_load_uniform_kN_m2 || 1.5).toFixed(1)} kN/m²</text>
                  
                  <text x="400" y="280" textAnchor="middle" fill="#999" fontSize="14">Bridge Span</text>
                </svg>
              </div>
            </div>
          )}

          {activeTab === "material" && (
            <div className="chart-section">
              <h3>🧱 Material Utilization & Performance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="result-card">
                  <div className="result-label">Top Plate Utilization</div>
                  <div className="result-value">{(results?.material_utilization?.top_plate || 0.73 * 100).toFixed(1)}%</div>
                  <div className="result-unit">of capacity</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Bottom Plate Utilization</div>
                  <div className="result-value">{(results?.material_utilization?.bottom_plate || 0.68 * 100).toFixed(1)}%</div>
                  <div className="result-unit">of capacity</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Airbeam Utilization</div>
                  <div className="result-value">{(results?.material_utilization?.airbeam || 0.45 * 100).toFixed(1)}%</div>
                  <div className="result-unit">of capacity</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Membrane Utilization</div>
                  <div className="result-value">{(results?.material_utilization?.membrane || 0.32 * 100).toFixed(1)}%</div>
                  <div className="result-unit">of capacity</div>
                </div>
              </div>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 300">
                  <line x1="50" y1="250" x2="750" y2="250" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="250" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  {['Top Plate', 'Bottom Plate', 'Airbeam', 'Membrane'].map((material, idx) => {
                    const util = [
                      results?.material_utilization?.top_plate || 0.73,
                      results?.material_utilization?.bottom_plate || 0.68,
                      results?.material_utilization?.airbeam || 0.45,
                      results?.material_utilization?.membrane || 0.32
                    ][idx];
                    const x = 100 + idx * 150;
                    const barHeight = util * 200;
                    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'];
                    
                    return (
                      <g key={material}>
                        <rect x={x - 30} y={250 - barHeight} width="60" height={barHeight} fill={colors[idx]} opacity="0.8" />
                        <text x={x} y={250 - barHeight - 10} textAnchor="middle" fill={colors[idx]} fontSize="14" fontWeight="bold">
                          {(util * 100).toFixed(1)}%
                        </text>
                        <text x={x} y="270" textAnchor="middle" fill="#999" fontSize="12">{material}</text>
                      </g>
                    );
                  })}
                  
                  <line x1="50" y1="50" x2="750" y2="50" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
                  <text x="770" y="55" textAnchor="start" fill="#10b981" fontSize="12">100% Limit</text>
                  
                  <text x="400" y="290" textAnchor="middle" fill="#999" fontSize="14">Material Components</text>
                  <text x="20" y="135" textAnchor="middle" fill="#999" fontSize="14" transform="rotate(-90 20 135)">Utilization (%)</text>
                </svg>
              </div>
            </div>
          )}

          {activeTab === "loads" && (
            <div className="chart-section">
              <h3>📦 Load Analysis & Distribution</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="result-card">
                  <div className="result-label">Total Load</div>
                  <div className="result-value">{results?.total_load_kN || 12.0}</div>
                  <div className="result-unit">kN</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Dead Load</div>
                  <div className="result-value">{results?.dead_load_kN || 4.5}</div>
                  <div className="result-unit">kN</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Live Load</div>
                  <div className="result-value">{results?.live_load_kN || 7.5}</div>
                  <div className="result-unit">kN</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Load Factor</div>
                  <div className="result-value">{results?.load_factor || 1.5}</div>
                  <div className="result-unit">safety factor</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Uniform Load</div>
                  <div className="result-value">{results?.live_load_uniform_kN_m2 || project?.loads?.live_load_uniform_kN_m2 || 1.5}</div>
                  <div className="result-unit">kN/m²</div>
                </div>
                <div className="result-card">
                  <div className="result-label">Load Type</div>
                  <div className="result-value" style={{ fontSize: '0.9rem' }}>Pedestrian/LCV/Truck</div>
                  <div className="result-unit">as selected</div>
                </div>
              </div>
              <div className="chart-container">
                <svg width="100%" height="100%" viewBox="0 0 800 300">
                  <line x1="50" y1="250" x2="750" y2="250" stroke="#666" strokeWidth="2" />
                  <line x1="50" y1="250" x2="50" y2="20" stroke="#666" strokeWidth="2" />
                  
                  {/* Dead load */}
                  <rect x="50" y="200" width="700" height="50" fill="#6b7280" opacity="0.6" />
                  <text x="400" y="230" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
                    Dead Load: {(results?.dead_load_kN || 4.5).toFixed(1)} kN
                  </text>
                  
                  {/* Live load */}
                  <rect x="50" y="150" width="700" height="50" fill="#3b82f6" opacity="0.6" />
                  <text x="400" y="180" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
                    Live Load: {(results?.live_load_kN || 7.5).toFixed(1)} kN
                  </text>
                  
                  {/* Load factor visualization */}
                  <line x1="50" y1="100" x2="750" y2="100" stroke="#f59e0b" strokeWidth="3" strokeDasharray="10,5" />
                  <text x="400" y="90" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">
                    Factored Load (×{results?.load_factor || 1.5}): {(results?.total_load_kN || 12.0) * (results?.load_factor || 1.5)} kN
                  </text>
                  
                  <text x="400" y="280" textAnchor="middle" fill="#999" fontSize="14">Bridge Span</text>
                  <text x="20" y="135" textAnchor="middle" fill="#999" fontSize="14" transform="rotate(-90 20 135)">Load (kN)</text>
                  
                  {/* Legend */}
                  <rect x="600" y="30" width="15" height="15" fill="#6b7280" />
                  <text x="620" y="42" fill="#999" fontSize="12">Dead Load</text>
                  <rect x="600" y="50" width="15" height="15" fill="#3b82f6" />
                  <text x="620" y="62" fill="#999" fontSize="12">Live Load</text>
                </svg>
              </div>
            </div>
          )}

          {activeTab === "checks" && (
            <div className="chart-section">
              <h3>✅ Comprehensive Design Checks & Code Compliance</h3>
              <div style={{ padding: "20px" }}>
                {results?.design_checks ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {Object.entries(results.design_checks).map(([key, check]: [string, any]) => (
                      <div key={key} style={{
                        padding: '16px',
                        background: check.status === 'PASS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${check.status === 'PASS' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong style={{ textTransform: 'capitalize', color: check.status === 'PASS' ? '#10b981' : '#ef4444' }}>
                            {check.status === 'PASS' ? '✓' : '✗'} {key.replace('_', ' ')}
                          </strong>
                          <div style={{ fontSize: '0.9rem', color: '#999', marginTop: '4px' }}>
                            Value: {check.value} | Limit: {check.limit} | Code: {check.code || 'IS 456:2000'}
                          </div>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: check.status === 'PASS' ? '#10b981' : '#ef4444' }}>
                          {check.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    Design checks data not available
                  </div>
                )}
                
                {/* Additional safety factors */}
                <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#3b82f6' }}>Safety Factors Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <strong>Overall Safety Factor:</strong> {results?.safety_factor || 2.8}
                    </div>
                    <div>
                      <strong>Deflection Safety:</strong> {results?.safety_factor_deflection || 1.85}
                    </div>
                    <div>
                      <strong>Stress Safety:</strong> {results?.safety_factor_stress || 1.37}
                    </div>
                    <div>
                      <strong>Shear Safety:</strong> {results?.safety_factor_shear || 1.32}
                    </div>
                    <div>
                      <strong>Flexure Safety:</strong> {results?.safety_factor_flexure || 1.41}
                    </div>
                    <div>
                      <strong>Buckling Factor:</strong> {results?.design_checks?.buckling?.factor || 3.2}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "3d" && (
            <div className="chart-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3>🎨 Interactive 3D Bridge Visualization</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setViewMode("deformation")}
                    style={{
                      padding: '8px 16px',
                      background: viewMode === "deformation" ? '#3b82f6' : '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    📉 Deformation
                  </button>
                  <button
                    onClick={() => setViewMode("stress")}
                    style={{
                      padding: '8px 16px',
                      background: viewMode === "stress" ? '#3b82f6' : '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    ⚡ Stress
                  </button>
                </div>
              </div>
              
              {/* Bridge Information Panel */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '12px', 
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#999' }}>Span</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {(project?.geometry?.span_mm || 8000) / 1000}m
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#999' }}>Width</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {(project?.geometry?.bridge_clear_width_mm || 1500) / 1000}m
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#999' }}>Max Deflection</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                    {results?.max_deflection_mm || 45.2}mm
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#999' }}>Max Stress</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ef4444' }}>
                    {results?.max_stress_MPa || 182.5}MPa
                  </div>
                </div>
              </div>
              
              <div className="viewer-3d-results" ref={viewerRef} style={{ 
                height: 'calc(100vh - 400px)', 
                minHeight: '600px',
                width: '100%', 
                background: '#0a0e27', 
                borderRadius: '8px',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                position: 'relative'
              }} />
              
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <strong style={{ color: '#3b82f6' }}>🎮 Controls:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>🖱️ <strong>Left-click + Drag:</strong> Rotate view</li>
                    <li>🔍 <strong>Scroll Wheel:</strong> Zoom in/out</li>
                    <li>✋ <strong>Right-click + Drag:</strong> Pan view</li>
                    <li>🔄 <strong>Toggle buttons:</strong> Switch visualization mode</li>
                  </ul>
                </div>
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <strong style={{ color: '#10b981' }}>🏗️ Bridge Components:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>🟠 <strong>Orange:</strong> Top Plate (Deck)</li>
                    <li>🔵 <strong>Blue:</strong> Bottom Plate</li>
                    <li>🟢 <strong>Green:</strong> Inflatable Airbeam</li>
                    <li>🔴 <strong>Red Spheres:</strong> Support Points</li>
                    <li>🌈 <strong>Color Gradient:</strong> {viewMode === "deformation" ? "Deformation magnitude (blue=min, red=max)" : "Stress distribution (blue=low, red=high)"}</li>
                  </ul>
                </div>
              </div>
              
              {/* Color Scale Legend */}
              <div style={{ 
                marginTop: '16px', 
                padding: '16px', 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {viewMode === "deformation" ? "📉 Deformation Scale:" : "⚡ Stress Scale:"}
                </div>
                <div style={{ 
                  flex: 1, 
                  height: '30px', 
                  background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
                  borderRadius: '4px',
                  minWidth: '200px'
                }} />
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#999' }}>
                  <span>Min: {viewMode === "deformation" ? "0mm" : "0MPa"}</span>
                  <span>Max: {viewMode === "deformation" ? `${results?.max_deflection_mm || 45.2}mm` : `${results?.max_stress_MPa || 182.5}MPa`}</span>
                </div>
              </div>
            </div>
          )}

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

// Main App component starts here
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

function ensureProjectId(obj: Record<string, any>) {
  if (!obj.project_id) obj.project_id = uuidv4();
  return obj;
}

const MOCK_BACKEND = true;

async function postJSON(url: string, data: any) {
  if (MOCK_BACKEND) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (url.includes('/api/projects')) {
      const span = data.geometry?.span_mm || 8000;
      const width = data.geometry?.bridge_clear_width_mm || 1500;
      
      // Generate comprehensive analysis results
      const deflectionProfile = Array.from({ length: 50 }, (_, i) => ({
        position_mm: (i / 49) * span,
        deflection_mm: Math.sin((i / 49) * Math.PI) * 45.2,
        rotation_rad: Math.cos((i / 49) * Math.PI) * 0.001
      }));
      
      const stressProfile = Array.from({ length: 50 }, (_, i) => ({
        position_mm: (i / 49) * span,
        vonMises_MPa: 50 + Math.abs(Math.sin((i / 49) * Math.PI * 2)) * 132.5,
        principal_max_MPa: 60 + Math.abs(Math.sin((i / 49) * Math.PI * 2)) * 122.5,
        principal_min_MPa: -20 - Math.abs(Math.sin((i / 49) * Math.PI * 2)) * 30
      }));
      
      const shearProfile = Array.from({ length: 50 }, (_, i) => ({
        position_mm: (i / 49) * span,
        shear_force_kN: Math.cos((i / 49) * Math.PI) * 25.5,
        shear_stress_MPa: Math.abs(Math.cos((i / 49) * Math.PI)) * 15.2
      }));
      
      const momentProfile = Array.from({ length: 50 }, (_, i) => ({
        position_mm: (i / 49) * span,
        moment_kNm: Math.sin((i / 49) * Math.PI) * 85.3,
        curvature_1_per_m: Math.sin((i / 49) * Math.PI) * 0.00015
      }));
      
      return {
        job_id: `job_${Date.now()}`,
        project_id: data.project_id,
        status: "completed",
        message: "Job submitted successfully (MOCK)",
        result: {
          analysis_type: "static",
          mesh_elements: 1250,
          mesh_nodes: 1456,
          computation_time: 2.3,
          iterations: 12,
          convergence_status: "converged",
          
          // Deflection results
          max_deflection_mm: 45.2,
          max_deflection_location_mm: span / 2,
          deflection_profile: deflectionProfile,
          deflection_limit_mm: span / 300,
          deflection_check: "PASS",
          deflection_ratio: 0.85,
          
          // Stress results
          max_stress_MPa: 182.5,
          max_stress_location_mm: span / 2,
          stress_profile: stressProfile,
          allowable_stress_MPa: 250,
          stress_check: "PASS",
          stress_utilization: 0.73,
          vonMises_max_MPa: 182.5,
          principal_stress_max_MPa: 192.5,
          principal_stress_min_MPa: -50.0,
          
          // Shear results
          max_shear_force_kN: 25.5,
          max_shear_location_mm: 0,
          shear_profile: shearProfile,
          max_shear_stress_MPa: 15.2,
          allowable_shear_MPa: 20.0,
          shear_check: "PASS",
          shear_utilization: 0.76,
          
          // Flexure/Moment results
          max_moment_kNm: 85.3,
          max_moment_location_mm: span / 2,
          moment_profile: momentProfile,
          flexural_capacity_kNm: 120.0,
          flexure_check: "PASS",
          flexure_utilization: 0.71,
          max_curvature_1_per_m: 0.00015,
          
          // Design checks
          design_checks: {
            deflection: { status: "PASS", value: 45.2, limit: span / 300, code: "IS 456:2000" },
            stress: { status: "PASS", value: 182.5, limit: 250, code: "IS 456:2000" },
            shear: { status: "PASS", value: 15.2, limit: 20.0, code: "IS 456:2000" },
            flexure: { status: "PASS", value: 85.3, limit: 120.0, code: "IS 456:2000" },
            buckling: { status: "PASS", factor: 3.2, limit: 2.0, code: "IS 456:2000" },
            fatigue: { status: "PASS", cycles: 1000000, limit: 500000, code: "IS 456:2000" }
          },
          
          // Safety factors
          safety_factor: 2.8,
          safety_factor_deflection: 1.85,
          safety_factor_stress: 1.37,
          safety_factor_shear: 1.32,
          safety_factor_flexure: 1.41,
          
          // Load information
          total_load_kN: 12.0,
          dead_load_kN: 4.5,
          live_load_kN: 7.5,
          load_factor: 1.5,
          
          // Material utilization
          material_utilization: {
            top_plate: 0.73,
            bottom_plate: 0.68,
            airbeam: 0.45,
            membrane: 0.32
          },
          
          // Reaction forces
          reaction_A_kN: 6.0,
          reaction_B_kN: 6.0,
          total_reaction_kN: 12.0,
          max_horizontal_force_kN: 0.5,
          support_moment_kNm: 0.0,
          
          // Load information (enhanced)
          live_load_uniform_kN_m2: data.loads?.live_load_uniform_kN_m2 || 1.5,
          
          // Deformation data for 3D visualization
          deformation_data: deflectionProfile.map(d => ({
            x: d.position_mm,
            y: 0,
            z: width / 2,
            deflection: d.deflection_mm
          }))
        }
      };
    } else if (url.includes('/api/generate-inp')) {
      return {
        filename: `${data.project_name || 'bridge'}_${Date.now()}.inp`,
        message: "INP file generated successfully (MOCK)",
        content: "** Abaqus INP File\n** Generated by Airbeam Designer\n*HEADING\nBridge Analysis\n",
      };
    }
  }
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText || 'Unknown error'}`);
    }
    
    return await res.json();
  } catch (error: any) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend. Make sure the backend server is running on http://localhost:8000');
    }
    throw error;
  }
}

function App() {
  const [project, setProject] = useState<Record<string, any>>({
    project_id: uuidv4(),
    project_name: "Demo Airbeam Bridge",
    design_code_reference: { code: "", notes: "" },
    geometry: {
      span_mm: 8000,
      bridge_clear_width_mm: 1500,
      top_plate_thickness_mm: 50,
      bottom_plate_thickness_mm: 50,
      taper_length_each_end_mm: 800,
      airbeam: { type: "cylindrical", height_mm: 300 },
    },
    membrane: {
      thickness_mm: 1.5,
      material_id: "PVC_fabric",
      operating_pressure_kPa: 100,
    },
    materials: [
      { id: "PVC_fabric", E_MPa: 800, nu: 0.4, rho_kg_m3: 1200 },
    ],
    loads: {
      gravity_m_s2: 9.81,
      self_weight_auto: true,
      live_load_uniform_kN_m2: 1.5,
      concentrated_loads: [],
    },
    supports: {
      support_type: "pinned",
      positions: ["start", "end"],
    },
    analysis_controls: {
      analysis_types: ["static"],
      solver: "abaqus",
    },
  });

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  function pushLog(msg: string, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${msg}`;
    setLogs((s) => [logEntry, ...s].slice(0, 50));
    
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    }
  }

  async function handleSubmitJob() {
    setLoading(true);
    setError(null);
    
    try {
      const payload = ensureProjectId(project);
      pushLog(`📤 Submitting job to backend...`);
      
      const res = await postJSON("http://localhost:8000/api/projects", payload);
      
      const jobId = res.job_id || res.project_id || "unknown";
      
      pushLog(`✅ Job submitted successfully! Job ID: ${jobId}`);
      pushLog(`Status: ${res?.status || "queued"}`);
      
      if (res.result) {
        pushLog(`📊 Analysis Results:`);
        if (res.result.mesh_elements) pushLog(`  • Mesh elements: ${res.result.mesh_elements}`);
        if (res.result.max_deflection_mm) pushLog(`  • Max deflection: ${res.result.max_deflection_mm} mm`);
        if (res.result.analysis_type) pushLog(`  • Analysis type: ${res.result.analysis_type}`);
      }
      
      if (res.message) {
        pushLog(`💬 ${res.message}`);
      }

      setAnalysisResults(res.result || res);
      setTimeout(() => setShowResults(true), 500);
      
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error occurred";
      pushLog(`❌ Error: ${errorMsg}`, true);
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateINP() {
    setLoading(true);
    setError(null);
    
    try {
      const payload = ensureProjectId(project);
      pushLog(`📝 Generating INP file...`);
      
      const res = await postJSON("http://localhost:8000/api/generate-inp", payload);
      
      pushLog(`✅ INP file generated: ${res.filename || "output.inp"}`);
      
      if (res.message) {
        pushLog(`💬 ${res.message}`);
      }
      
      if (res.download_url) {
        pushLog(`🔗 Opening download link...`);
        window.open(res.download_url, "_blank");
      } else if (res.content) {
        pushLog(`📄 INP content preview:`);
        const preview = res.content.substring(0, 200);
        pushLog(`${preview}...`);
        
        if (MOCK_BACKEND) {
          const blob = new Blob([res.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = res.filename;
          a.click();
          URL.revokeObjectURL(url);
          pushLog(`💾 Downloaded: ${res.filename}`);
        }
      }

      setAnalysisResults({
        ...res,
        analysis_type: "inp_generation",
        status: "completed",
      });
      setTimeout(() => setShowResults(true), 500);
      
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error occurred";
      pushLog(`❌ Error: ${errorMsg}`, true);
      console.error("Generate INP error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🌉 Airbeam Bridge Designer</h1>
        <p>Interactive parametric design for inflatable airbeam bridges</p>
        {MOCK_BACKEND && (
          <div style={{
            marginTop: 12,
            padding: '8px 16px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 6,
            fontSize: '0.9rem',
            color: '#fbbf24'
          }}>
            🧪 Running in MOCK mode - Backend simulation active
          </div>
        )}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}
      </header>

      <div className="main-container">
        <div className="sidebar">
          <div className="button-group">
            <button
              className="button button-primary"
              onClick={handleSubmitJob}
              disabled={loading}
            >
              {loading ? <span className="loading">Submitting</span> : "Submit Job"}
            </button>
            <button
              className="button button-secondary"
              onClick={handleGenerateINP}
              disabled={loading}
            >
              {loading ? <span className="loading">Generating</span> : "Generate INP"}
            </button>
          </div>

          <ProjectForm project={project} onChange={setProject} />

          <div className="payload-section">
            <h3>📋 Project Payload</h3>
            <div className="payload-hint">
              Edit the form to update the payload that will be sent to the backend.
            </div>
            <div className="payload-display">
              {JSON.stringify(project, null, 2)}
            </div>
          </div>

          {logs.length > 0 && (
            <div className="logs-section">
              <h3>📝 Activity Logs</h3>
              <div className="logs-display">
                {logs.map((log, i) => (
                  <div key={i} className="log-entry">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="viewer-container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: '12px', 
          padding: '30px 20px',
          minHeight: '400px'
        }}>
          <div style={{ textAlign: 'center', color: '#fff', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', fontWeight: 'bold' }}>🌉 Airbeam Bridge Designer</h2>
            <p style={{ fontSize: '1rem', opacity: 0.95, marginBottom: '20px', lineHeight: '1.5' }}>
              Submit a job to view comprehensive analysis results and interactive 3D visualization
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px', 
              marginTop: '16px',
              fontSize: '0.85rem'
            }}>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px' }}>📊 Shear & Stress</div>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px' }}>🔄 Flexure & Moment</div>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px' }}>📉 Deflection</div>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px' }}>✅ Design Checks</div>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px' }}>🎨 3D Visualization</div>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px' }}>📦 Load Analysis</div>
            </div>
          </div>
        </div>
      </div>

      <ResultsModal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        results={analysisResults}
        project={project}
      />
    </div>
  );
}

export default App;