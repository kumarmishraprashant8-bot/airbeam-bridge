// frontend/src/components/Viewer/Meshes/StrapTruss.tsx
import React, { useMemo } from "react";
import type { Vector3 } from "three";
import type { Geometry, StrapsConfig, MaterialDef } from "../../../types";




type MaterialLookup = Record<string, MaterialDef>;

type StrapTrussProps = {
  straps: StrapsConfig;
  geometry: Geometry;
  materials?: MaterialLookup;
  forceMap?: number[]; // axial forces per strap index (N)
  onHover?: (info: any) => void;
  onClick?: (info: any) => void;
};

export default function StrapTruss({ straps, geometry, materials, forceMap = [], onHover, onClick }: StrapTrussProps) {
  if (!straps?.enabled) return null;

  const span = geometry?.span ?? 8000;
  const spacing = straps?.spacing ?? 300;
  const count = Math.max(0, Math.floor(span / spacing));
  const color = "#2c7be5";

  const positions = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= count; i++) arr.push(i * spacing - span / 2);
    return arr;
  }, [count, spacing, span]);

  const handleHover = (e: any, idx: number) => {
    e.stopPropagation();
    onHover?.({ type: "strap", id: `strap-${idx}`, data: { pretension: straps.pretension, force: forceMap[idx] ?? 0 }, point: e.point });
  };
  const handleClick = (e: any, idx: number) => {
    e.stopPropagation();
    onClick?.({ type: "strap", id: `strap-${idx}`, data: { pretension: straps.pretension, force: forceMap[idx] ?? 0 }, point: e.point });
  };

  return (
    <>
      {/* @ts-ignore */}
      <group>
        {positions.map((xPos, idx) => (
          // each strap as a thin cylinder across width
          // @ts-ignore
          <mesh key={idx} position={[xPos, -100, 0]} onPointerMove={(e) => handleHover(e, idx)} onClick={(e) => handleClick(e, idx)} castShadow>
            {/* @ts-ignore */}
            <cylinderGeometry args={[6, 6, geometry.clear_width ?? 1500, 8]} />
            {/* @ts-ignore */}
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </group>
    </>
  );
}

