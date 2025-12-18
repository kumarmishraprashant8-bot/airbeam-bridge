import React, { useMemo, useState } from "react";

type Geometry = {
  span_l_mm?: number;
  bridge_clear_width_mm?: number;
  top_plate_thickness_mm?: number;
  bottom_plate_thickness_mm?: number;
  taper_length_each_end_mm?: number;
  membrane_thickness_mm?: number;
  airbeam_height_mm?: number;
};

type Loads = {
  gravity?: number;
  uniform_live_load_kN_m2?: number;
  concentrated_loads?: string; // csv as "x,kN;x,kN"
};

type Payload = {
  project?: { id?: string; name?: string; notes?: string };
  geometry?: Geometry;
  loads?: Loads;
  supports?: { support_positions_mm?: number[] };
  // add more fields if needed
};

export default function InteractiveInputPanel({
  initial,
  onPayloadChange,
  onRunAnalysis,
}: {
  initial?: Payload;
  onPayloadChange?: (p: Payload) => void;
  onRunAnalysis?: (p: Payload) => Promise<any>;
}) {
  const [payload, setPayload] = useState<Payload>(() => initial ?? {
    project: { id: "demo-1", name: "Demo Airbeam Bridge" },
    geometry: {
      span_l_mm: 8000,
      bridge_clear_width_mm: 1500,
      airbeam_height_mm: 300,
      membrane_thickness_mm: 1.5,
    },
    loads: {
      gravity: 9.81,
      uniform_live_load_kN_m2: 4.2,
      concentrated_loads: "",
    },
    supports: { support_positions_mm: [0, 8000] },
  });

  const [openGroups, setOpenGroups] = useState({
    project: true,
    geometry: true,
    loads: true,
    supports: false,
  });

  const [running, setRunning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // lightweight validation
  function validateLocal(p: Payload) {
    const e: string[] = [];
    const g = p.geometry;
    if (!g) e.push("Geometry missing");
    else {
      if (!g.span_l_mm || g.span_l_mm <= 0) e.push("Span must be > 0");
      if (!g.bridge_clear_width_mm || g.bridge_clear_width_mm <= 0) e.push("Clear width must be > 0");
      if (!g.membrane_thickness_mm || g.membrane_thickness_mm <= 0) e.push("Membrane thickness must be > 0");
    }
    setErrors(e);
    return e.length === 0;
  }

  // wire change and callback
  function setPayloadField(updater: (prev: Payload) => Payload) {
    setPayload((prev) => {
      const next = updater(prev);
      onPayloadChange?.(next);
      validateLocal(next);
      return next;
    });
  }

  // summary derived properties
  const summary = useMemo(() => {
    const g = payload.geometry || {};
    const span = g.span_l_mm ?? 0;
    const width = g.bridge_clear_width_mm ?? 0;
    const aspect = span > 0 ? (width / span).toFixed(2) : "—";
    return {
      span,
      width,
      aspect,
      checks: [
        { id: "clearwidth", ok: width >= 1000, text: "Clear width >= 1000 mm" },
        { id: "span", ok: span <= 20000, text: "Span <= 20 m" },
      ],
    };
  }, [payload]);

  async function run() {
    if (!validateLocal(payload)) return;
    setRunning(true);
    setAnalysisResult(null);
    try {
      if (onRunAnalysis) {
        const res = await onRunAnalysis(payload);
        setAnalysisResult(res);
      } else {
        // default: call backend
        const r = await fetch("http://localhost:5002/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await r.json();
        setAnalysisResult(json);
      }
    } catch (err) {
      setAnalysisResult({ error: String(err) });
    } finally {
      setRunning(false);
    }
  }

  // small input row
  function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <div style={{ width: 140, fontSize: 13, color: "#333" }}>{label}</div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, width: 320, boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h3 style={{ margin: "2px 0 10px 0" }}>Project Inputs</h3>

      {/* quick summary card */}
      <div style={{ background: "#f8fbfd", padding: 10, borderRadius: 8, marginBottom: 10, border: "1px solid #e6eef4" }}>
        <div style={{ fontSize: 13, color: "#0b3a4a" }}>{payload.project?.name}</div>
        <div style={{ fontSize: 12, color: "#6b7d86" }}>Span: {summary.span} mm • Width: {summary.width} mm</div>
        <div style={{ marginTop: 8 }}>
          {summary.checks.map((c) => (
            <div key={c.id} style={{ fontSize: 12, color: c.ok ? "#0a7" : "#d33" }}>
              {c.ok ? "✓" : "✕"} {c.text}
            </div>
          ))}
        </div>
      </div>

      {/* collapsible panels */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>Geometry</strong>
          <button onClick={() => setOpenGroups((s) => ({ ...s, geometry: !s.geometry }))} style={{ fontSize: 12 }}>
            {openGroups.geometry ? "Hide" : "Show"}
          </button>
        </div>

        {openGroups.geometry && (
          <div style={{ marginTop: 8 }}>
            <Row label="Span (mm)">
              <input
                value={payload.geometry?.span_l_mm ?? ""}
                onChange={(e) => setPayloadField((p) => ({ ...p, geometry: { ...p.geometry, span_l_mm: Number(e.target.value) } }))}
                style={{ width: "100%" }}
                type="number"
              />
            </Row>
            <Row label="Clear width (mm)">
              <input
                value={payload.geometry?.bridge_clear_width_mm ?? ""}
                onChange={(e) =>
                  setPayloadField((p) => ({ ...p, geometry: { ...p.geometry, bridge_clear_width_mm: Number(e.target.value) } }))
                }
                style={{ width: "100%" }}
                type="number"
              />
            </Row>
            <Row label="Airbeam height (mm)">
              <input
                value={payload.geometry?.airbeam_height_mm ?? ""}
                onChange={(e) => setPayloadField((p) => ({ ...p, geometry: { ...p.geometry, airbeam_height_mm: Number(e.target.value) } }))}
                style={{ width: "100%" }}
                type="number"
              />
            </Row>
          </div>
        )}
      </div>

      {/* Loads */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>Loads</strong>
          <button onClick={() => setOpenGroups((s) => ({ ...s, loads: !s.loads }))} style={{ fontSize: 12 }}>
            {openGroups.loads ? "Hide" : "Show"}
          </button>
        </div>

        {openGroups.loads && (
          <div style={{ marginTop: 8 }}>
            <Row label="Gravity (m/s²)">
              <input
                value={payload.loads?.gravity ?? ""}
                onChange={(e) => setPayloadField((p) => ({ ...p, loads: { ...p.loads, gravity: Number(e.target.value) } }))}
                type="number"
                style={{ width: "100%" }}
              />
            </Row>

            <Row label="Uniform live (kN/m²)">
              <input
                value={payload.loads?.uniform_live_load_kN_m2 ?? ""}
                onChange={(e) =>
                  setPayloadField((p) => ({ ...p, loads: { ...p.loads, uniform_live_load_kN_m2: Number(e.target.value) } }))
                }
                type="number"
                style={{ width: "100%" }}
              />
            </Row>

            <Row label="Concentrated loads">
              <input
                value={payload.loads?.concentrated_loads ?? ""}
                onChange={(e) => setPayloadField((p) => ({ ...p, loads: { ...p.loads, concentrated_loads: e.target.value } }))}
                placeholder="x1,kN;x2,kN (comma/semicolon)"
                style={{ width: "100%" }}
              />
            </Row>
          </div>
        )}
      </div>

      {/* supports */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>Supports</strong>
          <button onClick={() => setOpenGroups((s) => ({ ...s, supports: !s.supports }))} style={{ fontSize: 12 }}>
            {openGroups.supports ? "Hide" : "Show"}
          </button>
        </div>

        {openGroups.supports && (
          <div style={{ marginTop: 8 }}>
            <Row label="Support positions (mm)">
              <input
                value={(payload.supports?.support_positions_mm ?? []).join(",")}
                onChange={(e) =>
                  setPayloadField((p) => ({ ...p, supports: { ...p.supports, support_positions_mm: e.target.value.split(",").map((s) => Number(s)) } }))
                }
                style={{ width: "100%" }}
                placeholder="0,8000"
              />
            </Row>
          </div>
        )}
      </div>

      {/* errors */}
      {errors.length > 0 && (
        <div style={{ background: "#fff3f3", color: "#7a1b1b", padding: 8, borderRadius: 6, marginBottom: 10 }}>
          {errors.map((er, i) => (
            <div key={i} style={{ fontSize: 13 }}>
              {er}
            </div>
          ))}
        </div>
      )}

      {/* action row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
        <button
          onClick={() => run()}
          disabled={running || errors.length > 0}
          style={{
            flex: 1,
            background: "#0b74de",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: running || errors.length > 0 ? "not-allowed" : "pointer",
          }}
        >
          {running ? "Running..." : "Run Analysis"}
        </button>
        <button
          onClick={() => {
            // quick preview: just send payload to viewer via callback
            onPayloadChange?.(payload);
          }}
          style={{
            background: "#fff",
            border: "1px solid #d0d7de",
            padding: "8px 12px",
            borderRadius: 8,
          }}
        >
          Preview
        </button>
      </div>

      {/* show a small result panel */}
      <div style={{ marginTop: 12 }}>
        {analysisResult ? (
          <div style={{ background: "#f6fff9", padding: 10, borderRadius: 8, fontSize: 13 }}>
            <div><strong>Analysis result</strong></div>
            <div style={{ marginTop: 6 }}>{analysisResult.message ?? "OK"}</div>
            <pre style={{ fontSize: 11, maxHeight: 120, overflow: "auto", background: "#fff", padding: 8 }}>{JSON.stringify(analysisResult, null, 2)}</pre>
          </div>
        ) : (
          <div style={{ color: "#6b7280", fontSize: 13 }}>No analysis run yet. Use Run Analysis to get full checks & graphs.</div>
        )}
      </div>
    </div>
  );
}
