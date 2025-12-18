// frontend/src/types.ts

// Material definition
export type MaterialDef = {
  name: string;
  E_MPa: number;
  poisson?: number;
  density_kg_m3?: number;
};

// Material lookup by name
export type MaterialLookup = Record<string, MaterialDef>;

// Geometry configuration
export type Geometry = {
  span_mm: number;
  bridge_clear_width_mm: number;
  taper_length_each_end_mm: number;
};

// Airbeam configuration
export type Airbeam = {
  height_mm: number;
  thickness_mm: number;
  operating_pressure_kPa: number;
  material_name: string;
};

// Plates configuration
export type Plates = {
  top_thickness_mm: number;
  bottom_thickness_mm: number;
  material_name: string;
};

// Single strap definition
export type Strap = {
  x_mm: number;
  spacing_mm: number;
  width_mm: number;
  thickness_mm: number;
  material_name: string;
  pretension_N: number;
};

// Straps configuration
export type StrapsConfig = {
  enabled: boolean;
  straps: Strap[];
};

// Loads configuration
export type Loads = {
  gravity_m_s2: number;
  self_weight_auto: boolean;
  live_load_uniform_kN_m2: number;
  concentrated_loads: Array<{ x_mm: number; value_kN: number }>;
};

// Supports configuration
export type Supports = {
  support_type: string;
  left_x_mm: number;
  right_x_mm: number;
};

// Analysis controls
export type AnalysisControls = {
  analysis_types: string[];
  mesh_size_mm: number;
  solver: string;
};

// Design code reference
export type DesignCodeReference = {
  code: string;
  notes: string;
};

// Complete project payload
export type ProjectPayload = {
  project_id: string;
  project_name: string;
  geometry: Geometry;
  airbeam: Airbeam;
  plates: Plates;
  straps: StrapsConfig;
  materials: MaterialDef[];
  loads: Loads;
  supports: Supports;
  analysis_controls: AnalysisControls;
  design_code_reference: DesignCodeReference;
};