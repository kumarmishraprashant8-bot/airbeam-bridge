// frontend/src/api/export.ts
export async function requestPdfExport(projectId: string, payload: {
  project?: any;
  results?: any;
  images?: { deflection_plot_png?: string; contour_screenshot_png?: string };
  report_title?: string;
}) {
  const url = `/api/projects/${encodeURIComponent(projectId)}/export/pdf`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Export failed: ${res.status} ${text}`);
  }
  const blob = await res.blob();
  // trigger download
  const a = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  a.href = objectUrl;
  a.download = `${projectId}_report.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
