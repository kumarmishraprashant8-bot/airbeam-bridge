// frontend/src/components/Viewer/Meshes/PlateShell.tsx
import React, { useMemo } from "react";
import type { Vector3 } from "three";
import type { Geometry, Plates } from "../../../types";




type PlateShellProps = {
  geometry: Geometry;
  plates: Plates;
  meshSize?: number;
  onHover?: (info: { type: "plate"; id: string; data: any; point?: Vector3 }) => void;
  onClick?: (info: { type: "plate"; id: string; data: any; point?: Vector3 }) => void;
};

export default function PlateShell({ geometry, plates, meshSize = 20, onHover, onClick }: PlateShellProps) {
  const span = geometry?.span ?? 8000;
  const width = geometry?.clear_width ?? 1500;
  const thickness = plates?.top_thickness ?? 8;
  const color = plates?.top_color ?? "#2b6cb0";

  // simple plane subdivisions can be created via args
  const planeArgs = useMemo(() => [span, width, Math.max(1, Math.floor(span / meshSize)), Math.max(1, Math.floor(width / meshSize))], [span, width, meshSize]);

  const handleHover = (e: any) => {
    e.stopPropagation();
    onHover?.({ type: "plate", id: "top", data: { thickness }, point: e.point });
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.({ type: "plate", id: "top", data: { thickness }, point: e.point });
  };

  return (
    <>
      {/* @ts-ignore */}
      <group>
        {/* @ts-ignore */}
        <mesh onPointerMove={handleHover} onClick={handleClick} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          {/* @ts-ignore */}
          <planeGeometry args={planeArgs as any} />
          {/* @ts-ignore */}
          <meshStandardMaterial color={color} opacity={0.95} transparent />
        </mesh>
      </group>
    </>
  );
}

