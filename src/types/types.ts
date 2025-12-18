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
  span_mm?: number;
  span?: number; // Alternative property name used in some components
  bridge_clear_width_mm?: number;
  clear_width?: number; // Alternative property name
  taper_length_each_end_mm?: number;
};

// Airbeam configuration
export type Airbeam = {
  height_mm?: number;
  height?: number; // Alternative property name used in some components
  length?: number; // Length of the airbeam
  thickness_mm?: number;
  operating_pressure_kPa?: number;
  pressure?: number; // Alternative property name for pressure
  material_name?: string;
  membrane_material_id?: string; // Material ID for membrane
};

// Plates configuration
export type Plates = {
  top_thickness_mm?: number;
  top_thickness?: number; // Alternative property name used in some components
  bottom_thickness_mm?: number;
  bottom_thickness?: number; // Alternative property name
  material_name?: string;
  top_color?: string; // Color for top plate visualization
  bottom_color?: string; // Color for bottom plate visualization
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
  enabled?: boolean;
  type?: string;
  spacing?: number;
  area?: number;
  E?: number;
  pretension?: number;
  straps?: Strap[];
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