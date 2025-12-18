import React from "react";

function Sparkline({ values, width = 200, height = 40 }: { values: number[]; width?: number; height?: number }) {
  if (!values || values.length === 0) return <svg width={width} height={height} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const len = values.length;
  const step = width / Math.max(1, len - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  });
  const path = `M ${points.join(" L ")}`;
  return (
    <svg width={width} height={height}>
      <rect width="100%" height="100%" fill="transparent" />
      <path d={path} stroke="#0b74de" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OutputPanel({ result, onDownload }: { result: any; onDownload?: (type: "json" | "csv") => void }) {
  if (!result) return <div style={{ padding: 12, width: 340 }}>Run an analysis to see outputs here.</div>;

  // example result structure: { checks: [{name,ok,msg}], deflectionProfile: [..], forces: {...}}
  const checks = result.checks ?? [];
  const defl = result.deflectionProfile ?? [];
  const reactions = result.reactions ?? {};

  // small helpers
  function downloadJSON() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_result.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    if (!defl || defl.length === 0) return;
    let csv = "x_mm,deflection_mm\n";
    defl.forEach((v: any) => {
      csv += `${v.x},${v.y}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deflection_profile.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 12, width: 340, boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h4 style={{ marginTop: 0 }}>Analysis Outputs</h4>

      <div style={{ marginBottom: 10 }}>
        <strong>Checks</strong>
        <div style={{ marginTop: 6 }}>
          {checks.map((c: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", alignItems: "center" }}>
              <div style={{ color: c.ok ? "#0a7" : "#d33" }}>{c.ok ? "PASS" : "FAIL"} — {c.name}</div>
              {c.ok ? null : <div style={{ color: "#d33", fontSize: 12 }}>{c.msg}</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <strong>Deflection profile</strong>
        <div style={{ marginTop: 8 }}>
          <Sparkline values={defl.map((d: any) => d.y)} width={300} height={60} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <strong>Reactions</strong>
        <div style={{ marginTop: 6, fontSize: 13 }}>
          {Object.entries(reactions).map(([k, v]: any) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
              <div>{k}</div>
              <div>{Number(v).toFixed(2)} kN</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={downloadJSON} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#0b74de", color: "#fff" }}>
          Download JSON
        </button>
        <button onClick={downloadCSV} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#fff", border: "1px solid #ddd" }}>
          Download CSV
        </button>
      </div>
    </div>
  );
}
