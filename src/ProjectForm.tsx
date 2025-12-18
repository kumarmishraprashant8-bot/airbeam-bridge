import React, { useState } from "react";

interface ProjectFormProps {
  project: Record<string, any>;
  onChange: (p: Record<string, any>) => void;
}

export default function ProjectForm({ project, onChange }: ProjectFormProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    geometry: true,
    materials: false,
    loads: false,
    environmental: false,
    dynamic: false,
    airbeam_advanced: false,
    structural_advanced: false,
    supports: false,
    analysis: false,
    design: false,
    load_combinations: false,
  });

  function get(path: string, defaultVal: any = "") {
    const keys = path.split(".");
    let val = project;
    for (const k of keys) {
      if (val && typeof val === "object" && k in val) val = val[k];
      else return defaultVal;
    }
    return val ?? defaultVal;
  }

  function update(path: string, value: any) {
    const keys = path.split(".");
    const newProj = JSON.parse(JSON.stringify(project));
    let current = newProj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newProj);
  }

  function toggleSection(section: string) {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }

  function quickFillPedestrian() {
    onChange({
      ...project,
      project_name: "Pedestrian Airbeam Bridge",
      geometry: {
        span_mm: 8000,
        bridge_clear_width_mm: 1800,
        top_plate_thickness_mm: 2,
        bottom_plate_thickness_mm: 2,
        taper_length_each_end_mm: 750,
        airbeam: { type: "cylindrical", height_mm: 150, diameter_mm: 300 },
        number_of_airbeams: 1,
        lateral_spacing_mm: 0,
      },
      loads: {
        ...get("loads", {}),
        live_load_uniform_kN_m2: 5.0,
        vehicle_loads: [],
      },
    });
  }

  function quickFillLCV() {
    onChange({
      ...project,
      project_name: "LCV Airbeam Bridge",
      geometry: {
        span_mm: 8000,
        bridge_clear_width_mm: 3500,
        top_plate_thickness_mm: 2,
        bottom_plate_thickness_mm: 2,
        taper_length_each_end_mm: 750,
        airbeam: { type: "cylindrical", height_mm: 150, diameter_mm: 400 },
        number_of_airbeams: 2,
        lateral_spacing_mm: 1500,
      },
      loads: {
        ...get("loads", {}),
        live_load_uniform_kN_m2: 3.0,
        vehicle_loads: [{ type: "LCV", axle_loads_kN: [15, 15], axle_spacing_mm: [2500] }],
      },
    });
  }

  function quickFillTruck() {
    onChange({
      ...project,
      project_name: "Heavy Truck Airbeam Bridge",
      geometry: {
        span_mm: 12000,
        bridge_clear_width_mm: 4000,
        top_plate_thickness_mm: 3,
        bottom_plate_thickness_mm: 3,
        taper_length_each_end_mm: 1000,
        airbeam: { type: "cylindrical", height_mm: 200, diameter_mm: 500 },
        number_of_airbeams: 3,
        lateral_spacing_mm: 1000,
      },
      loads: {
        ...get("loads", {}),
        live_load_uniform_kN_m2: 4.0,
        vehicle_loads: [{ type: "Truck", axle_loads_kN: [40, 80, 80], axle_spacing_mm: [3600, 1200] }],
      },
    });
  }

  const SectionHeader = ({ title, section, icon }: any) => (
    <div
      onClick={() => toggleSection(section)}
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "12px 16px",
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        fontWeight: 700,
        fontSize: 15,
        userSelect: "none",
      }}
    >
      <span>{icon} {title}</span>
      <span style={{ fontSize: 20 }}>{expandedSections[section] ? "−" : "+"}</span>
    </div>
  );

  return (
    <div style={{ padding: "0 8px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={quickFillPedestrian}
          style={{
            flex: 1,
            padding: "10px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          🚶 Pedestrian
        </button>
        <button
          onClick={quickFillLCV}
          style={{
            flex: 1,
            padding: "10px",
            background: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          🚗 LCV
        </button>
        <button
          onClick={quickFillTruck}
          style={{
            flex: 1,
            padding: "10px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          🚛 Truck
        </button>
      </div>

      <SectionHeader title="General Information" section="general" icon="📋" />
      {expandedSections.general && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Project Name</label>
            <input
              value={get("project_name", "")}
              onChange={(e) => update("project_name", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Design Code</label>
            <select
              value={get("design_code_reference.code", "IS:456-2000")}
              onChange={(e) => update("design_code_reference.code", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="IS:456-2000">IS 456:2000 (India)</option>
              <option value="IRC:6-2017">IRC 6:2017 (Indian Roads)</option>
              <option value="AASHTO-LRFD">AASHTO LRFD (US)</option>
              <option value="EUROCODE-1">Eurocode 1 (EU)</option>
              <option value="BS-5400">BS 5400 (UK)</option>
              <option value="ACI-318">ACI 318 (US Concrete)</option>
              <option value="CUSTOM">Custom/Other</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Project Notes</label>
            <textarea
              value={get("design_code_reference.notes", "")}
              onChange={(e) => update("design_code_reference.notes", e.target.value)}
              rows={3}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", resize: "vertical" }}
              placeholder="Add any project-specific notes..."
            />
          </div>
        </div>
      )}

      <SectionHeader title="Geometry & Configuration" section="geometry" icon="📐" />
      {expandedSections.geometry && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#667eea" }}>Bridge Dimensions</h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Span (mm)</label>
              <input
                type="number"
                value={get("geometry.span_mm", 8000)}
                onChange={(e) => update("geometry.span_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Clear Width (mm)</label>
              <input
                type="number"
                value={get("geometry.bridge_clear_width_mm", 1500)}
                onChange={(e) => update("geometry.bridge_clear_width_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Plate Configuration</h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Top Plate (mm)</label>
              <input
                type="number"
                value={get("geometry.top_plate_thickness_mm", 50)}
                onChange={(e) => update("geometry.top_plate_thickness_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Bottom Plate (mm)</label>
              <input
                type="number"
                value={get("geometry.bottom_plate_thickness_mm", 50)}
                onChange={(e) => update("geometry.bottom_plate_thickness_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Airbeam Configuration</h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Type</label>
              <select
                value={get("geometry.airbeam.type", "cylindrical")}
                onChange={(e) => update("geometry.airbeam.type", e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="cylindrical">Cylindrical</option>
                <option value="elliptical">Elliptical</option>
                <option value="rectangular">Rectangular</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Number</label>
              <input
                type="number"
                min="1"
                max="5"
                value={get("geometry.number_of_airbeams", 1)}
                onChange={(e) => update("geometry.number_of_airbeams", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Height (mm)</label>
              <input
                type="number"
                value={get("geometry.airbeam.height_mm", 300)}
                onChange={(e) => update("geometry.airbeam.height_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Diameter (mm)</label>
              <input
                type="number"
                value={get("geometry.airbeam.diameter_mm", 300)}
                onChange={(e) => update("geometry.airbeam.diameter_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Taper Length (mm)</label>
              <input
                type="number"
                value={get("geometry.taper_length_each_end_mm", 800)}
                onChange={(e) => update("geometry.taper_length_each_end_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Lateral Spacing (mm)</label>
              <input
                type="number"
                value={get("geometry.lateral_spacing_mm", 0)}
                onChange={(e) => update("geometry.lateral_spacing_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Cross-Section Details</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Width (mm) - Rectangular</label>
              <input
                type="number"
                value={get("geometry.airbeam.width_mm", 300)}
                onChange={(e) => update("geometry.airbeam.width_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Major Axis (mm) - Elliptical</label>
              <input
                type="number"
                value={get("geometry.airbeam.major_axis_mm", 400)}
                onChange={(e) => update("geometry.airbeam.major_axis_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Minor Axis (mm) - Elliptical</label>
              <input
                type="number"
                value={get("geometry.airbeam.minor_axis_mm", 300)}
                onChange={(e) => update("geometry.airbeam.minor_axis_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Wall Thickness (mm)</label>
              <input
                type="number"
                step="0.1"
                value={get("geometry.airbeam.wall_thickness_mm", 1.5)}
                onChange={(e) => update("geometry.airbeam.wall_thickness_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>End Conditions</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Start End Type</label>
              <select
                value={get("geometry.end_conditions.start", "Open")}
                onChange={(e) => update("geometry.end_conditions.start", e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Reinforced">Reinforced</option>
                <option value="Capped">Capped</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>End Type</label>
              <select
                value={get("geometry.end_conditions.end", "Open")}
                onChange={(e) => update("geometry.end_conditions.end", e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Reinforced">Reinforced</option>
                <option value="Capped">Capped</option>
              </select>
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Additional Dimensions</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Deck Thickness (mm)</label>
              <input
                type="number"
                step="0.1"
                value={get("geometry.deck_thickness_mm", 10)}
                onChange={(e) => update("geometry.deck_thickness_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Side Wall Height (mm)</label>
              <input
                type="number"
                value={get("geometry.side_wall_height_mm", 100)}
                onChange={(e) => update("geometry.side_wall_height_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Camber (mm)</label>
              <input
                type="number"
                value={get("geometry.camber_mm", 0)}
                onChange={(e) => update("geometry.camber_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Sag Ratio</label>
              <input
                type="number"
                step="0.01"
                value={get("geometry.sag_ratio", 0.1)}
                onChange={(e) => update("geometry.sag_ratio", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
        </div>
      )}

      <SectionHeader title="Material Properties" section="materials" icon="🧪" />
      {expandedSections.materials && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Membrane Thickness (mm)</label>
              <input
                type="number"
                step="0.1"
                value={get("membrane.thickness_mm", 1.5)}
                onChange={(e) => update("membrane.thickness_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Pressure (kPa)</label>
              <input
                type="number"
                value={get("membrane.operating_pressure_kPa", 100)}
                onChange={(e) => update("membrane.operating_pressure_kPa", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Material Type</label>
            <select
              value={get("membrane.material_type", "PVC")}
              onChange={(e) => update("membrane.material_type", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="PVC">PVC Coated Polyester</option>
              <option value="TPU">TPU (Thermoplastic)</option>
              <option value="Polyester">High-Strength Polyester</option>
              <option value="Kevlar">Kevlar Reinforced</option>
              <option value="Custom">Custom Material</option>
            </select>
          </div>

          {(get("materials", [{ id: "PVC_fabric", E_MPa: 800, nu: 0.4, rho_kg_m3: 1200 }]) as any[]).map((mat: any, idx: number) => (
            <div key={idx} style={{ padding: 12, background: "white", borderRadius: 6, border: "1px solid #e5e7eb", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontWeight: 700 }}>Material #{idx + 1}</label>
                <input
                  type="text"
                  value={mat.id || ""}
                  onChange={(e) => {
                    const mats = [...get("materials", [])];
                    mats[idx] = { ...mats[idx], id: e.target.value };
                    update("materials", mats);
                  }}
                  placeholder="Material ID"
                  style={{ width: "60%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                />
              </div>
              <h5 style={{ margin: "8px 0 8px 0", color: "#667eea", fontSize: 13 }}>Elastic Properties</h5>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>E (MPa)</label>
                  <input
                    type="number"
                    value={mat.E_MPa ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], E_MPa: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Poisson (ν)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={mat.nu ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], nu: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>G (Shear Modulus, MPa)</label>
                  <input
                    type="number"
                    value={mat.G_MPa ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], G_MPa: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Density (kg/m³)</label>
                  <input
                    type="number"
                    value={mat.rho_kg_m3 ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], rho_kg_m3: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
              </div>
              <h5 style={{ margin: "8px 0 8px 0", color: "#667eea", fontSize: 13 }}>Strength Properties</h5>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Tensile Strength (MPa)</label>
                  <input
                    type="number"
                    value={mat.tensile_strength_MPa ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], tensile_strength_MPa: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Compressive Strength (MPa)</label>
                  <input
                    type="number"
                    value={mat.compressive_strength_MPa ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], compressive_strength_MPa: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Shear Strength (MPa)</label>
                  <input
                    type="number"
                    value={mat.shear_strength_MPa ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], shear_strength_MPa: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Yield Strength (MPa)</label>
                  <input
                    type="number"
                    value={mat.yield_strength_MPa ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], yield_strength_MPa: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
              </div>
              <h5 style={{ margin: "8px 0 8px 0", color: "#667eea", fontSize: 13 }}>Advanced Properties</h5>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Creep Coefficient</label>
                  <input
                    type="number"
                    step="0.01"
                    value={mat.creep_coefficient ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], creep_coefficient: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Thermal Expansion (1/°C)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={mat.thermal_expansion ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], thermal_expansion: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Fatigue Limit (MPa)</label>
                  <input
                    type="number"
                    value={mat.fatigue_limit_MPa ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], fatigue_limit_MPa: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Fracture Toughness (MPa√m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mat.fracture_toughness ?? ""}
                    onChange={(e) => {
                      const mats = [...get("materials", [])];
                      mats[idx] = { ...mats[idx], fracture_toughness: Number(e.target.value) };
                      update("materials", mats);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const mats = get("materials", []);
              update("materials", [...mats, { id: `Material_${mats.length + 1}`, E_MPa: 800, nu: 0.4, rho_kg_m3: 1200 }]);
            }}
            style={{
              width: "100%",
              padding: 10,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Add Material
          </button>
        </div>
      )}

      <SectionHeader title="Loading Conditions" section="loads" icon="⚖️" />
      {expandedSections.loads && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Uniform Live Load (kN/m²)</label>
            <input
              type="number"
              step="0.1"
              value={get("loads.live_load_uniform_kN_m2", 1.5)}
              onChange={(e) => update("loads.live_load_uniform_kN_m2", Number(e.target.value))}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            />
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Vehicle Loads</h4>
          
          {(get("loads.vehicle_loads", []) as any[]).map((veh: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 12, padding: 12, background: "white", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontWeight: 700 }}>Vehicle #{idx + 1}</label>
                <button
                  onClick={() => {
                    const vehs = [...get("loads.vehicle_loads", [])];
                    vehs.splice(idx, 1);
                    update("loads.vehicle_loads", vehs);
                  }}
                  style={{ background: "#ef4444", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Type</label>
                <select
                  value={veh.type || "Custom"}
                  onChange={(e) => {
                    const vehs = [...get("loads.vehicle_loads", [])];
                    vehs[idx] = { ...vehs[idx], type: e.target.value };
                    update("loads.vehicle_loads", vehs);
                  }}
                  style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                >
                  <option value="Car">Car</option>
                  <option value="LCV">Light Commercial Vehicle</option>
                  <option value="Truck">Truck</option>
                  <option value="IRC-Class-A">IRC Class A</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Axle Loads (kN)</label>
                <input
                  value={(veh.axle_loads_kN || []).join(", ")}
                  onChange={(e) => {
                    const vehs = [...get("loads.vehicle_loads", [])];
                    vehs[idx] = { ...vehs[idx], axle_loads_kN: e.target.value.split(",").map(v => Number(v.trim())).filter(v => !isNaN(v)) };
                    update("loads.vehicle_loads", vehs);
                  }}
                  placeholder="e.g., 15, 15"
                  style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                />
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              const vehs = get("loads.vehicle_loads", []);
              update("loads.vehicle_loads", [...vehs, { type: "Custom", axle_loads_kN: [20] }]);
            }}
            style={{
              width: "100%",
              padding: 10,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Add Vehicle Load
          </button>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Concentrated Loads</h4>
          {(get("loads.concentrated_loads", []) as any[]).map((load: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 12, padding: 12, background: "white", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontWeight: 700 }}>Point Load #{idx + 1}</label>
                <button
                  onClick={() => {
                    const loads = [...get("loads.concentrated_loads", [])];
                    loads.splice(idx, 1);
                    update("loads.concentrated_loads", loads);
                  }}
                  style={{ background: "#ef4444", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Load (kN)</label>
                  <input
                    type="number"
                    value={load.magnitude_kN || ""}
                    onChange={(e) => {
                      const loads = [...get("loads.concentrated_loads", [])];
                      loads[idx] = { ...loads[idx], magnitude_kN: Number(e.target.value) };
                      update("loads.concentrated_loads", loads);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Position (mm)</label>
                  <input
                    type="number"
                    value={load.position_mm || ""}
                    onChange={(e) => {
                      const loads = [...get("loads.concentrated_loads", [])];
                      loads[idx] = { ...loads[idx], position_mm: Number(e.target.value) };
                      update("loads.concentrated_loads", loads);
                    }}
                    style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const loads = get("loads.concentrated_loads", []);
              update("loads.concentrated_loads", [...loads, { magnitude_kN: 10, position_mm: 4000 }]);
            }}
            style={{
              width: "100%",
              padding: 10,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            + Add Concentrated Load
          </button>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Distributed Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Line Load (kN/m)</label>
              <input
                type="number"
                step="0.1"
                value={get("loads.line_load_kN_m", 0)}
                onChange={(e) => update("loads.line_load_kN_m", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Dead Load Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("loads.dead_load_factor", 1.2)}
                onChange={(e) => update("loads.dead_load_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
        </div>
      )}

      <SectionHeader title="Environmental Loads" section="environmental" icon="🌪️" />
      {expandedSections.environmental && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#667eea" }}>Wind Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Wind Speed (m/s)</label>
              <input
                type="number"
                step="0.1"
                value={get("environmental.wind.speed_m_s", 25)}
                onChange={(e) => update("environmental.wind.speed_m_s", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Wind Direction (deg)</label>
              <input
                type="number"
                value={get("environmental.wind.direction_deg", 0)}
                onChange={(e) => update("environmental.wind.direction_deg", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Wind Pressure (kPa)</label>
              <input
                type="number"
                step="0.1"
                value={get("environmental.wind.pressure_kPa", 0.5)}
                onChange={(e) => update("environmental.wind.pressure_kPa", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Gust Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("environmental.wind.gust_factor", 1.5)}
                onChange={(e) => update("environmental.wind.gust_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Wind Load Code</label>
            <select
              value={get("environmental.wind.code", "ASCE-7")}
              onChange={(e) => update("environmental.wind.code", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="ASCE-7">ASCE 7 (US)</option>
              <option value="EN-1991-1-4">Eurocode EN 1991-1-4</option>
              <option value="IS-875-Part3">IS 875 Part 3 (India)</option>
              <option value="AS-NZS-1170">AS/NZS 1170 (Australia)</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Earthquake Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Seismic Zone</label>
              <select
                value={get("environmental.earthquake.zone", "Zone-II")}
                onChange={(e) => update("environmental.earthquake.zone", e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="Zone-I">Zone I (Low)</option>
                <option value="Zone-II">Zone II (Moderate)</option>
                <option value="Zone-III">Zone III (Severe)</option>
                <option value="Zone-IV">Zone IV (Very Severe)</option>
                <option value="Zone-V">Zone V (Extreme)</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>PGA (g)</label>
              <input
                type="number"
                step="0.01"
                value={get("environmental.earthquake.pga_g", 0.16)}
                onChange={(e) => update("environmental.earthquake.pga_g", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Response Spectrum Type</label>
              <select
                value={get("environmental.earthquake.spectrum_type", "Elastic")}
                onChange={(e) => update("environmental.earthquake.spectrum_type", e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="Elastic">Elastic</option>
                <option value="Inelastic">Inelastic</option>
                <option value="Site-Specific">Site-Specific</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Importance Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("environmental.earthquake.importance_factor", 1.0)}
                onChange={(e) => update("environmental.earthquake.importance_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Seismic Code</label>
            <select
              value={get("environmental.earthquake.code", "IS-1893")}
              onChange={(e) => update("environmental.earthquake.code", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="IS-1893">IS 1893 (India)</option>
              <option value="ASCE-7">ASCE 7 (US)</option>
              <option value="EN-1998">Eurocode EN 1998</option>
              <option value="NZS-1170">NZS 1170 (New Zealand)</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Snow & Ice Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Snow Load (kN/m²)</label>
              <input
                type="number"
                step="0.1"
                value={get("environmental.snow.load_kN_m2", 0)}
                onChange={(e) => update("environmental.snow.load_kN_m2", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Snow Density (kg/m³)</label>
              <input
                type="number"
                value={get("environmental.snow.density_kg_m3", 200)}
                onChange={(e) => update("environmental.snow.density_kg_m3", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Ice Thickness (mm)</label>
              <input
                type="number"
                value={get("environmental.ice.thickness_mm", 0)}
                onChange={(e) => update("environmental.ice.thickness_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Ice Density (kg/m³)</label>
              <input
                type="number"
                value={get("environmental.ice.density_kg_m3", 900)}
                onChange={(e) => update("environmental.ice.density_kg_m3", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Temperature Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Min Temperature (°C)</label>
              <input
                type="number"
                value={get("environmental.temperature.min_C", -20)}
                onChange={(e) => update("environmental.temperature.min_C", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Max Temperature (°C)</label>
              <input
                type="number"
                value={get("environmental.temperature.max_C", 50)}
                onChange={(e) => update("environmental.temperature.max_C", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Thermal Expansion Coeff (1/°C)</label>
              <input
                type="number"
                step="0.00001"
                value={get("environmental.temperature.expansion_coeff", 0.0001)}
                onChange={(e) => update("environmental.temperature.expansion_coeff", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Reference Temp (°C)</label>
              <input
                type="number"
                value={get("environmental.temperature.reference_C", 20)}
                onChange={(e) => update("environmental.temperature.reference_C", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Water & Flood Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Water Depth (mm)</label>
              <input
                type="number"
                value={get("environmental.water.depth_mm", 0)}
                onChange={(e) => update("environmental.water.depth_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Water Velocity (m/s)</label>
              <input
                type="number"
                step="0.1"
                value={get("environmental.water.velocity_m_s", 0)}
                onChange={(e) => update("environmental.water.velocity_m_s", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Flood Level (mm above deck)</label>
            <input
              type="number"
              value={get("environmental.water.flood_level_mm", 0)}
              onChange={(e) => update("environmental.water.flood_level_mm", Number(e.target.value))}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            />
          </div>
        </div>
      )}

      <SectionHeader title="Dynamic & Impact Loads" section="dynamic" icon="💥" />
      {expandedSections.dynamic && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#667eea" }}>Impact Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Impact Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("dynamic.impact.factor", 1.3)}
                onChange={(e) => update("dynamic.impact.factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Impact Duration (ms)</label>
              <input
                type="number"
                value={get("dynamic.impact.duration_ms", 100)}
                onChange={(e) => update("dynamic.impact.duration_ms", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Impact Load Type</label>
            <select
              value={get("dynamic.impact.type", "Vehicle")}
              onChange={(e) => update("dynamic.impact.type", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Vehicle">Vehicle Impact</option>
              <option value="Falling">Falling Object</option>
              <option value="Blast">Blast Load</option>
              <option value="Collision">Collision</option>
            </select>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Vibration Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Frequency (Hz)</label>
              <input
                type="number"
                step="0.1"
                value={get("dynamic.vibration.frequency_Hz", 5)}
                onChange={(e) => update("dynamic.vibration.frequency_Hz", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Amplitude (mm)</label>
              <input
                type="number"
                step="0.1"
                value={get("dynamic.vibration.amplitude_mm", 1)}
                onChange={(e) => update("dynamic.vibration.amplitude_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Vibration Type</label>
            <select
              value={get("dynamic.vibration.type", "Harmonic")}
              onChange={(e) => update("dynamic.vibration.type", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Harmonic">Harmonic</option>
              <option value="Random">Random</option>
              <option value="Transient">Transient</option>
              <option value="Pedestrian">Pedestrian-Induced</option>
            </select>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Fatigue Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Cycles</label>
              <input
                type="number"
                value={get("dynamic.fatigue.cycles", 1000000)}
                onChange={(e) => update("dynamic.fatigue.cycles", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Stress Range (MPa)</label>
              <input
                type="number"
                step="0.1"
                value={get("dynamic.fatigue.stress_range_MPa", 50)}
                onChange={(e) => update("dynamic.fatigue.stress_range_MPa", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Fatigue Category</label>
            <select
              value={get("dynamic.fatigue.category", "Category-A")}
              onChange={(e) => update("dynamic.fatigue.category", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Category-A">Category A (Best)</option>
              <option value="Category-B">Category B</option>
              <option value="Category-C">Category C</option>
              <option value="Category-D">Category D</option>
              <option value="Category-E">Category E (Worst)</option>
            </select>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Blast Loads</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Peak Pressure (kPa)</label>
              <input
                type="number"
                step="0.1"
                value={get("dynamic.blast.peak_pressure_kPa", 0)}
                onChange={(e) => update("dynamic.blast.peak_pressure_kPa", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Duration (ms)</label>
              <input
                type="number"
                value={get("dynamic.blast.duration_ms", 10)}
                onChange={(e) => update("dynamic.blast.duration_ms", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
        </div>
      )}

      <SectionHeader title="Advanced Airbeam Properties" section="airbeam_advanced" icon="🎈" />
      {expandedSections.airbeam_advanced && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#667eea" }}>Pressure Properties</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Min Pressure (kPa)</label>
              <input
                type="number"
                step="0.1"
                value={get("airbeam_advanced.pressure.min_kPa", 50)}
                onChange={(e) => update("airbeam_advanced.pressure.min_kPa", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Max Pressure (kPa)</label>
              <input
                type="number"
                step="0.1"
                value={get("airbeam_advanced.pressure.max_kPa", 150)}
                onChange={(e) => update("airbeam_advanced.pressure.max_kPa", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Pressure Loss Rate (kPa/day)</label>
              <input
                type="number"
                step="0.1"
                value={get("airbeam_advanced.pressure.loss_rate_kPa_per_day", 0.5)}
                onChange={(e) => update("airbeam_advanced.pressure.loss_rate_kPa_per_day", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Inflation Rate (kPa/min)</label>
              <input
                type="number"
                step="0.1"
                value={get("airbeam_advanced.pressure.inflation_rate_kPa_per_min", 10)}
                onChange={(e) => update("airbeam_advanced.pressure.inflation_rate_kPa_per_min", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Material Aging & Degradation</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>UV Degradation Factor</label>
              <input
                type="number"
                step="0.01"
                value={get("airbeam_advanced.aging.uv_degradation_factor", 0.95)}
                onChange={(e) => update("airbeam_advanced.aging.uv_degradation_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Aging Time (years)</label>
              <input
                type="number"
                step="0.1"
                value={get("airbeam_advanced.aging.time_years", 0)}
                onChange={(e) => update("airbeam_advanced.aging.time_years", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Creep Factor</label>
              <input
                type="number"
                step="0.01"
                value={get("airbeam_advanced.aging.creep_factor", 1.0)}
                onChange={(e) => update("airbeam_advanced.aging.creep_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Fatigue Reduction Factor</label>
              <input
                type="number"
                step="0.01"
                value={get("airbeam_advanced.aging.fatigue_reduction", 1.0)}
                onChange={(e) => update("airbeam_advanced.aging.fatigue_reduction", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Temperature Effects</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Temp Effect on E (1/°C)</label>
              <input
                type="number"
                step="0.0001"
                value={get("airbeam_advanced.temperature.e_modulus_coeff", -0.001)}
                onChange={(e) => update("airbeam_advanced.temperature.e_modulus_coeff", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Temp Effect on Strength (1/°C)</label>
              <input
                type="number"
                step="0.0001"
                value={get("airbeam_advanced.temperature.strength_coeff", -0.001)}
                onChange={(e) => update("airbeam_advanced.temperature.strength_coeff", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Connection & Seam Properties</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Seam Efficiency (%)</label>
              <input
                type="number"
                step="0.1"
                value={get("airbeam_advanced.connection.seam_efficiency_percent", 85)}
                onChange={(e) => update("airbeam_advanced.connection.seam_efficiency_percent", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Connection Strength Factor</label>
              <input
                type="number"
                step="0.01"
                value={get("airbeam_advanced.connection.strength_factor", 1.0)}
                onChange={(e) => update("airbeam_advanced.connection.strength_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Seam Type</label>
            <select
              value={get("airbeam_advanced.connection.seam_type", "Welded")}
              onChange={(e) => update("airbeam_advanced.connection.seam_type", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Welded">Welded</option>
              <option value="Sewn">Sewn</option>
              <option value="Bonded">Bonded</option>
              <option value="RF-Welded">RF Welded</option>
            </select>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Reinforcement</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Reinforcement Pattern</label>
              <select
                value={get("airbeam_advanced.reinforcement.pattern", "None")}
                onChange={(e) => update("airbeam_advanced.reinforcement.pattern", e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="None">None</option>
                <option value="Circumferential">Circumferential</option>
                <option value="Longitudinal">Longitudinal</option>
                <option value="Grid">Grid Pattern</option>
                <option value="Spiral">Spiral</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Reinforcement Strength (kN)</label>
              <input
                type="number"
                step="0.1"
                value={get("airbeam_advanced.reinforcement.strength_kN", 0)}
                onChange={(e) => update("airbeam_advanced.reinforcement.strength_kN", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
        </div>
      )}

      <SectionHeader title="Advanced Structural Properties" section="structural_advanced" icon="🏗️" />
      {expandedSections.structural_advanced && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#667eea" }}>Stiffness & Modifiers</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Stiffness Modifier X</label>
              <input
                type="number"
                step="0.01"
                value={get("structural_advanced.stiffness.modifier_x", 1.0)}
                onChange={(e) => update("structural_advanced.stiffness.modifier_x", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Stiffness Modifier Y</label>
              <input
                type="number"
                step="0.01"
                value={get("structural_advanced.stiffness.modifier_y", 1.0)}
                onChange={(e) => update("structural_advanced.stiffness.modifier_y", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Stiffness Modifier Z</label>
              <input
                type="number"
                step="0.01"
                value={get("structural_advanced.stiffness.modifier_z", 1.0)}
                onChange={(e) => update("structural_advanced.stiffness.modifier_z", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Shear Modifier</label>
              <input
                type="number"
                step="0.01"
                value={get("structural_advanced.stiffness.shear_modifier", 1.0)}
                onChange={(e) => update("structural_advanced.stiffness.shear_modifier", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Damping Properties</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Damping Ratio (%)</label>
              <input
                type="number"
                step="0.1"
                value={get("structural_advanced.damping.ratio_percent", 2.0)}
                onChange={(e) => update("structural_advanced.damping.ratio_percent", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Rayleigh Alpha</label>
              <input
                type="number"
                step="0.0001"
                value={get("structural_advanced.damping.rayleigh_alpha", 0.1)}
                onChange={(e) => update("structural_advanced.damping.rayleigh_alpha", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Rayleigh Beta</label>
              <input
                type="number"
                step="0.0001"
                value={get("structural_advanced.damping.rayleigh_beta", 0.001)}
                onChange={(e) => update("structural_advanced.damping.rayleigh_beta", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Damping Type</label>
              <select
                value={get("structural_advanced.damping.type", "Rayleigh")}
                onChange={(e) => update("structural_advanced.damping.type", e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="Rayleigh">Rayleigh</option>
                <option value="Modal">Modal</option>
                <option value="Proportional">Proportional</option>
                <option value="Frequency-Dependent">Frequency-Dependent</option>
              </select>
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Natural Frequencies</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>1st Mode (Hz)</label>
              <input
                type="number"
                step="0.1"
                value={get("structural_advanced.frequencies.mode1_Hz", 5)}
                onChange={(e) => update("structural_advanced.frequencies.mode1_Hz", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>2nd Mode (Hz)</label>
              <input
                type="number"
                step="0.1"
                value={get("structural_advanced.frequencies.mode2_Hz", 15)}
                onChange={(e) => update("structural_advanced.frequencies.mode2_Hz", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>3rd Mode (Hz)</label>
              <input
                type="number"
                step="0.1"
                value={get("structural_advanced.frequencies.mode3_Hz", 30)}
                onChange={(e) => update("structural_advanced.frequencies.mode3_Hz", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Target Frequency (Hz)</label>
              <input
                type="number"
                step="0.1"
                value={get("structural_advanced.frequencies.target_Hz", 10)}
                onChange={(e) => update("structural_advanced.frequencies.target_Hz", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Buckling & Stability</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Buckling Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("structural_advanced.buckling.factor", 1.0)}
                onChange={(e) => update("structural_advanced.buckling.factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Stability Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("structural_advanced.buckling.stability_factor", 1.0)}
                onChange={(e) => update("structural_advanced.buckling.stability_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Buckling Analysis Type</label>
            <select
              value={get("structural_advanced.buckling.type", "Linear")}
              onChange={(e) => update("structural_advanced.buckling.type", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Linear">Linear</option>
              <option value="Nonlinear">Nonlinear</option>
              <option value="Eigenvalue">Eigenvalue</option>
            </select>
          </div>
        </div>
      )}

      <SectionHeader title="Load Combinations" section="load_combinations" icon="🔀" />
      {expandedSections.load_combinations && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#667eea" }}>Load Factors</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Dead Load Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("load_combinations.factors.dead", 1.2)}
                onChange={(e) => update("load_combinations.factors.dead", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Live Load Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("load_combinations.factors.live", 1.6)}
                onChange={(e) => update("load_combinations.factors.live", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Wind Load Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("load_combinations.factors.wind", 1.3)}
                onChange={(e) => update("load_combinations.factors.wind", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Earthquake Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("load_combinations.factors.earthquake", 1.0)}
                onChange={(e) => update("load_combinations.factors.earthquake", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Snow Load Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("load_combinations.factors.snow", 1.5)}
                onChange={(e) => update("load_combinations.factors.snow", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Temperature Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("load_combinations.factors.temperature", 1.2)}
                onChange={(e) => update("load_combinations.factors.temperature", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Combination Methods</h4>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Ultimate Limit State</label>
            <select
              value={get("load_combinations.uls.method", "Additive")}
              onChange={(e) => update("load_combinations.uls.method", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Additive">Additive</option>
              <option value="SRSS">SRSS (Square Root Sum of Squares)</option>
              <option value="ABS">Absolute Sum</option>
              <option value="Envelope">Envelope</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Serviceability Limit State</label>
            <select
              value={get("load_combinations.sls.method", "Additive")}
              onChange={(e) => update("load_combinations.sls.method", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Additive">Additive</option>
              <option value="SRSS">SRSS</option>
              <option value="Frequent">Frequent</option>
              <option value="Quasi-Permanent">Quasi-Permanent</option>
            </select>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Load Cases</h4>
          {(get("load_combinations.cases", []) as any[]).map((case_: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 12, padding: 12, background: "white", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontWeight: 700 }}>Load Case #{idx + 1}</label>
                <button
                  onClick={() => {
                    const cases = [...get("load_combinations.cases", [])];
                    cases.splice(idx, 1);
                    update("load_combinations.cases", cases);
                  }}
                  style={{ background: "#ef4444", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Name</label>
                <input
                  value={case_.name || ""}
                  onChange={(e) => {
                    const cases = [...get("load_combinations.cases", [])];
                    cases[idx] = { ...cases[idx], name: e.target.value };
                    update("load_combinations.cases", cases);
                  }}
                  placeholder="e.g., ULS-1"
                  style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Loads (comma-separated)</label>
                <input
                  value={(case_.loads || []).join(", ")}
                  onChange={(e) => {
                    const cases = [...get("load_combinations.cases", [])];
                    cases[idx] = { ...cases[idx], loads: e.target.value.split(",").map(s => s.trim()).filter(Boolean) };
                    update("load_combinations.cases", cases);
                  }}
                  placeholder="e.g., Dead, Live, Wind"
                  style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const cases = get("load_combinations.cases", []);
              update("load_combinations.cases", [...cases, { name: "New Case", loads: [] }]);
            }}
            style={{
              width: "100%",
              padding: 10,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Add Load Case
          </button>
        </div>
      )}

      <SectionHeader title="Supports & Boundary" section="supports" icon="⚓" />
      {expandedSections.supports && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Support Type</label>
            <select
              value={get("supports.support_type", "pinned")}
              onChange={(e) => update("supports.support_type", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="pinned">Pinned (Hinge)</option>
              <option value="roller">Roller</option>
              <option value="fixed">Fixed</option>
              <option value="elastic">Elastic Foundation</option>
              <option value="spring">Spring Support</option>
              <option value="guided">Guided</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Soil Bearing Capacity (kN/m²)</label>
              <input
                type="number"
                value={get("supports.soil_bearing_capacity_kN_m2", 150)}
                onChange={(e) => update("supports.soil_bearing_capacity_kN_m2", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Spring Stiffness (kN/m)</label>
              <input
                type="number"
                value={get("supports.spring_stiffness_kN_m", 10000)}
                onChange={(e) => update("supports.spring_stiffness_kN_m", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Foundation Properties</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Foundation Width (mm)</label>
              <input
                type="number"
                value={get("supports.foundation.width_mm", 1000)}
                onChange={(e) => update("supports.foundation.width_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Foundation Depth (mm)</label>
              <input
                type="number"
                value={get("supports.foundation.depth_mm", 500)}
                onChange={(e) => update("supports.foundation.depth_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Soil Type</label>
            <select
              value={get("supports.foundation.soil_type", "Medium")}
              onChange={(e) => update("supports.foundation.soil_type", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Soft">Soft</option>
              <option value="Medium">Medium</option>
              <option value="Stiff">Stiff</option>
              <option value="Rock">Rock</option>
            </select>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Anchor Properties</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Anchor Type</label>
              <select
                value={get("supports.anchor.type", "Mechanical")}
                onChange={(e) => update("supports.anchor.type", e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="Mechanical">Mechanical</option>
                <option value="Chemical">Chemical</option>
                <option value="Gravity">Gravity</option>
                <option value="Ballast">Ballast</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Anchor Capacity (kN)</label>
              <input
                type="number"
                value={get("supports.anchor.capacity_kN", 50)}
                onChange={(e) => update("supports.anchor.capacity_kN", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
        </div>
      )}

      <SectionHeader title="Analysis Controls" section="analysis" icon="⚙️" />
      {expandedSections.analysis && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Solver</label>
            <select
              value={get("analysis_controls.solver", "abaqus")}
              onChange={(e) => update("analysis_controls.solver", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="abaqus">Abaqus/Standard</option>
              <option value="abaqus-explicit">Abaqus/Explicit</option>
              <option value="ansys">ANSYS Mechanical</option>
              <option value="nastran">MSC Nastran</option>
              <option value="opensees">OpenSees</option>
              <option value="sap2000">SAP2000</option>
            </select>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Analysis Types</h4>
          {["static", "modal", "buckling", "dynamic", "nonlinear", "transient", "frequency", "response-spectrum"].map(type => (
            <div key={type} style={{ marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={(get("analysis_controls.analysis_types", []) as string[]).includes(type)}
                onChange={(e) => {
                  const types = get("analysis_controls.analysis_types", []) as string[];
                  if (e.target.checked) {
                    update("analysis_controls.analysis_types", [...types, type]);
                  } else {
                    update("analysis_controls.analysis_types", types.filter((t: string) => t !== type));
                  }
                }}
                id={`analysis_${type}`}
              />
              <label htmlFor={`analysis_${type}`} style={{ marginLeft: 8, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                {type.replace("-", " ")}
              </label>
            </div>
          ))}

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Mesh Settings</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Element Size (mm)</label>
              <input
                type="number"
                value={get("analysis_controls.mesh.element_size_mm", 50)}
                onChange={(e) => update("analysis_controls.mesh.element_size_mm", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Element Type</label>
              <select
                value={get("analysis_controls.mesh.element_type", "Shell")}
                onChange={(e) => update("analysis_controls.mesh.element_type", e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="Shell">Shell</option>
                <option value="Solid">Solid</option>
                <option value="Beam">Beam</option>
                <option value="Membrane">Membrane</option>
              </select>
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Solver Settings</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Max Iterations</label>
              <input
                type="number"
                value={get("analysis_controls.solver_settings.max_iterations", 100)}
                onChange={(e) => update("analysis_controls.solver_settings.max_iterations", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Convergence Tolerance</label>
              <input
                type="number"
                step="0.0001"
                value={get("analysis_controls.solver_settings.tolerance", 0.001)}
                onChange={(e) => update("analysis_controls.solver_settings.tolerance", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Solution Method</label>
            <select
              value={get("analysis_controls.solver_settings.method", "Newton-Raphson")}
              onChange={(e) => update("analysis_controls.solver_settings.method", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Newton-Raphson">Newton-Raphson</option>
              <option value="Modified-Newton">Modified Newton</option>
              <option value="Arc-Length">Arc-Length</option>
              <option value="Direct">Direct</option>
            </select>
          </div>
        </div>
      )}

      <SectionHeader title="Design Checks" section="design" icon="✅" />
      {expandedSections.design && (
        <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 6, marginTop: 8 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#667eea" }}>Deflection Limits</h4>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Serviceability Limit</label>
            <select
              value={get("design_checks.deflection_limit", "L/300")}
              onChange={(e) => update("design_checks.deflection_limit", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="L/180">L/180</option>
              <option value="L/240">L/240</option>
              <option value="L/300">L/300</option>
              <option value="L/360">L/360</option>
              <option value="L/500">L/500</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Max Deflection (mm)</label>
            <input
              type="number"
              value={get("design_checks.max_deflection_mm", 0)}
              onChange={(e) => update("design_checks.max_deflection_mm", Number(e.target.value))}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              placeholder="Custom limit (0 = use ratio)"
            />
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Safety Factors</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Overall Safety Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("design_checks.safety_factor", 2.5)}
                onChange={(e) => update("design_checks.safety_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Material Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("design_checks.material_factor", 1.2)}
                onChange={(e) => update("design_checks.material_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Load Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("design_checks.load_factor", 1.5)}
                onChange={(e) => update("design_checks.load_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Buckling Factor</label>
              <input
                type="number"
                step="0.1"
                value={get("design_checks.buckling_factor", 2.0)}
                onChange={(e) => update("design_checks.buckling_factor", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Stress Limits</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Max Stress (MPa)</label>
              <input
                type="number"
                step="0.1"
                value={get("design_checks.max_stress_MPa", 200)}
                onChange={(e) => update("design_checks.max_stress_MPa", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Max Shear Stress (MPa)</label>
              <input
                type="number"
                step="0.1"
                value={get("design_checks.max_shear_stress_MPa", 100)}
                onChange={(e) => update("design_checks.max_shear_stress_MPa", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>

          <h4 style={{ margin: "16px 0 12px 0", color: "#667eea" }}>Design Life & Durability</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Design Life (years)</label>
              <input
                type="number"
                value={get("design_checks.design_life_years", 20)}
                onChange={(e) => update("design_checks.design_life_years", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Fatigue Life (cycles)</label>
              <input
                type="number"
                value={get("design_checks.fatigue_life_cycles", 1000000)}
                onChange={(e) => update("design_checks.fatigue_life_cycles", Number(e.target.value))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 4 }}>Durability Class</label>
            <select
              value={get("design_checks.durability_class", "Standard")}
              onChange={(e) => update("design_checks.durability_class", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
            >
              <option value="Low">Low</option>
              <option value="Standard">Standard</option>
              <option value="High">High</option>
              <option value="Very-High">Very High</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}