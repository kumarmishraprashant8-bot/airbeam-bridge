// frontend/src/Viewer.tsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// OrbitControls implementation
class OrbitControls {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  enabled = true;
  target = new THREE.Vector3(0, 0, 0);
  minDistance = 5;
  maxDistance = 50;
  
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
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    
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
    
    // Clamp phi to prevent flipping
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    
    this.update();
  };

  onMouseUp = () => {
    this.isDragging = false;
  };

  onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.spherical.radius += e.deltaY * 0.01;
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
    this.update();
  };

  update() {
    const { radius, theta, phi } = this.spherical;
    
    this.camera.position.x = this.target.x + radius * Math.sin(phi) * Math.sin(theta);
    this.camera.position.y = this.target.y + radius * Math.cos(phi);
    this.camera.position.z = this.target.z + radius * Math.sin(phi) * Math.cos(theta);
    
    this.camera.lookAt(this.target);
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}

interface ViewerProps {
  project: Record<string, any>;
}

export default function Viewer({ project }: ViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x6699ff, 0.4);
    dirLight2.position.set(-10, 5, -10);
    scene.add(dirLight2);

    // Grid helper
    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Axes helper for orientation
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Extract geometry from project
    const span = project?.geometry?.span_mm || 8000;
    const width = project?.geometry?.bridge_clear_width_mm || 1500;
    const airbeamHeight = project?.geometry?.airbeam?.height_mm || 300;
    const topPlate = project?.geometry?.top_plate_thickness_mm || 50;
    const bottomPlate = project?.geometry?.bottom_plate_thickness_mm || 50;

    // Scale factor for visualization (mm -> scene units)
    const scale = 0.0015;
    const sx = span * scale;
    const sy = width * scale;
    const ah = airbeamHeight * scale;

    // Create bridge geometry
    // Top plate
    const topPlateGeom = new THREE.BoxGeometry(sx, topPlate * scale, sy);
    const topPlateMat = new THREE.MeshPhongMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.8,
      shininess: 30,
    });
    const topPlateMesh = new THREE.Mesh(topPlateGeom, topPlateMat);
    topPlateMesh.position.y = ah + (topPlate * scale) / 2;
    scene.add(topPlateMesh);

    // Add edges to top plate
    const topPlateEdges = new THREE.EdgesGeometry(topPlateGeom);
    const topPlateLines = new THREE.LineSegments(
      topPlateEdges,
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true })
    );
    topPlateMesh.add(topPlateLines);

    // Bottom plate
    const bottomPlateGeom = new THREE.BoxGeometry(sx, bottomPlate * scale, sy);
    const bottomPlateMat = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.8,
      shininess: 30,
    });
    const bottomPlateMesh = new THREE.Mesh(bottomPlateGeom, bottomPlateMat);
    bottomPlateMesh.position.y = -(bottomPlate * scale) / 2;
    scene.add(bottomPlateMesh);

    // Add edges to bottom plate
    const bottomPlateEdges = new THREE.EdgesGeometry(bottomPlateGeom);
    const bottomPlateLines = new THREE.LineSegments(
      bottomPlateEdges,
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true })
    );
    bottomPlateMesh.add(bottomPlateLines);

    // Airbeam: draw a long cylinder at centerline
    const cylGeom = new THREE.CylinderGeometry(ah / 2, ah / 2, sx + 0.1, 32);
    const cylMat = new THREE.MeshPhongMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.7,
      shininess: 50,
    });
    const cylinder = new THREE.Mesh(cylGeom, cylMat);
    cylinder.rotation.z = Math.PI / 2;
    cylinder.position.y = ah / 2;
    scene.add(cylinder);

    // Membrane visualization (simplified as a plane)
    const membraneGeom = new THREE.PlaneGeometry(sx, sy, 20, 20);
    const membraneMat = new THREE.MeshPhongMaterial({
      color: 0xec4899,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      shininess: 100,
    });
    const membraneMesh = new THREE.Mesh(membraneGeom, membraneMat);
    membraneMesh.rotation.x = Math.PI / 2;
    membraneMesh.position.y = ah;
    scene.add(membraneMesh);

    // Support markers (simple spheres at ends)
    const supportGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const supportMat = new THREE.MeshPhongMaterial({ 
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.3,
    });

    const support1 = new THREE.Mesh(supportGeom, supportMat);
    support1.position.set(-sx / 2, 0, 0);
    scene.add(support1);

    const support2 = new THREE.Mesh(supportGeom, supportMat);
    support2.position.set(sx / 2, 0, 0);
    scene.add(support2);

    // Add text labels (using sprites)
    function createTextLabel(text: string, position: THREE.Vector3) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 64;
      
      context.fillStyle = '#ffffff';
      context.font = 'bold 24px Arial';
      context.textAlign = 'center';
      context.fillText(text, 128, 40);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(2, 0.5, 1);
      
      return sprite;
    }

    const label1 = createTextLabel('Support A', new THREE.Vector3(-sx / 2, -1, 0));
    scene.add(label1);

    const label2 = createTextLabel('Support B', new THREE.Vector3(sx / 2, -1, 0));
    scene.add(label2);

    // Animation loop
    let rafId: number;
    function animate() {
      rafId = requestAnimationFrame(animate);
      
      // Subtle pulsing animation for supports
      const pulse = Math.sin(Date.now() * 0.002) * 0.1 + 1;
      support1.scale.setScalar(pulse);
      support2.scale.setScalar(pulse);
      
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const onResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [project]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}