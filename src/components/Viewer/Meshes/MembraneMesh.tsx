// frontend/src/components/Viewer/Meshes/MembraneMesh.tsx
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { CylinderGeometry } from "three";
import type { ProjectPayload } from "../../../types";




type MembraneProps = {
  airbeam: ProjectPayload["airbeam"];
  materials?: Record<string, any>;
  position?: [number, number, number];
  inflation?: { animate?: boolean; pressureOverride?: number };
  onHover?: (info: any) => void;
  onClick?: (info: any) => void;
};

export default function MembraneMesh({
  airbeam,
  materials,
  position = [0, 0, 0],
  inflation,
  onHover,
  onClick,
}: MembraneProps) {
  const meshRef = useRef<Mesh | null>(null);

  const baseRadius = (airbeam?.height ?? 300) / 2;
  const color = (materials?.[airbeam?.membrane_material_id ?? ""]?.color) ?? "#b87333";

  // Keep geometry stable via useMemo
  const geometry = useMemo(() => {
    // small LOD / segments selection
    const segments = Math.max(12, Math.floor((airbeam?.height ?? 300) / 10));
    // cylinder geometry args: radiusTop, radiusBottom, height, radialSegments
    return new CylinderGeometry(baseRadius, baseRadius, airbeam?.length ?? 8000, Math.max(8, segments));
  }, [baseRadius, airbeam?.height, airbeam?.length]);

  // simple inflation animation — animate radius using scale
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const p = inflation?.pressureOverride ?? airbeam?.pressure ?? 0;
    const animate = inflation?.animate ?? true;
    const baseScale = 1 + (p / 1000) * 0.02; // heuristic
    const wobble = animate ? 1 + 0.02 * Math.sin(clock.elapsedTime * 2) : 1;
    meshRef.current.scale.set(baseScale * wobble, 1, 1);
  });

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    onHover?.({ type: "membrane", data: { height: airbeam?.height } , point: e.point});
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.({ type: "membrane", data: { height: airbeam?.height }, point: e.point });
  };

  return (
    <>
      {/* r3f JSX sometimes triggers TS complaints if types missing; keeping code clear */}
      {/* @ts-ignore */}
      <group position={position as any}>
        {/* @ts-ignore */}
        <mesh ref={meshRef} onPointerMove={handlePointerMove} onClick={handleClick} castShadow receiveShadow>
          {/* Use BufferGeometry instance created above */}
          {/* @ts-ignore */}
          <primitive object={geometry} />
          {/* @ts-ignore */}
          <meshStandardMaterial color={color} transparent opacity={0.95} />
        </mesh>
      </group>
    </>
  );
}

