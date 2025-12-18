// frontend/src/api/projects.ts
// Small UUIDv4 generator — no external dependency needed
function uuidv4(): string {
  // RFC4122-compliant v4 UUID generator (crypto if available)
  if (typeof crypto !== "undefined" && (crypto as any).getRandomValues) {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    // set version bits (4) and variant bits (RFC4122)
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const hex = Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("");
    return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`;
  }
  // fallback (not crypto-strong)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const API_BASE = process.env.REACT_APP_API_URL || "";

export async function createProject(payload: Record<string, any>) {
  if (!payload.project_id) payload.project_id = uuidv4();

  const res = await fetch(`${API_BASE}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let body;
    try { body = await res.json(); } catch { body = { detail: res.statusText }; }
    throw new Error(body.detail || JSON.stringify(body) || res.statusText);
  }
  return res.json();
}
