// approximator.js
// Exports: computeApprox(projectPayloadSubset, options) -> { maxDeflection_mm, deflection_mm[], strapForcesN[] }
// Inputs assumed in SI (mm, N, N/mm^2). Convert kN and kPa accordingly in UI before calling.

// Helper: build FD matrices and solve linear system
export function computeApprox(payload, opts = {}) {
  // payload subset required fields:
  // payload.geometry.span (mm)
  // payload.plates.top_thickness (mm), plates.material_id -> material E (N/mm^2)
  // payload.airbeam.height (mm), airbeam.membrane_thickness (mm), airbeam.pressure (kPa)
  // payload.straps.spacing (mm), straps.area (mm^2), straps.E (N/mm^2), straps.pretension (kN)
  // payload.loads.uniform_load_kN_per_m (kN/m) and point_loads
  // payload.supports list (positions)
  // materials map for E lookup
  const { span, clear_width } = payload.geometry;
  const L = span;
  const n = opts.nNodes || 201; // interior nodes = n
  const dx = L / (n - 1);

  // Effective EI: approximate deck as plate with equivalent beam EI = E_plate * I
  const top_t = payload.plates.top_thickness || 8; // mm
  const bottom_t = payload.plates.bottom_thickness || 0;
  const plateMat = payload.materials.find(m => m.id === payload.plates.material_id) || payload.materials[0];
  const E_plate = plateMat ? plateMat.E : 210000; // N/mm^2
  const width = clear_width || 1500; // mm

  // compute second moment of area for rectangular plate per unit width:
  // For a plate of width W and thickness t, I_about_centroid = (W * t^3) / 12; for beam per unit width, use I' = t^3/12 (per mm width)
  // Spread over width: total EI = E_plate * (I' * width_coefficient)
  const I_per_width = (top_t ** 3) / 12 + (bottom_t ** 3) / 12;
  const EI = E_plate * I_per_width * width; // N * mm^2

  // Airbeam axial tension T (N/mm) approx: p (kPa -> N/mm^2) * r (mm)
  const p_kPa = payload.airbeam.pressure;
  const p_Nmm2 = p_kPa * 0.001; // 1 kPa = 0.001 N/mm^2
  const r = (payload.airbeam.height || 300) / 2.0; // mm
  const T = p_Nmm2 * r; // N/mm (axial tension per unit width approximation)

  // Straps: per-strap axial stiffness and equivalent vertical spring per unit length
  const strapSpacing = payload.straps.spacing || 300; // mm
  const strapArea = payload.straps.area || 100; // mm^2
  const E_strap = (payload.straps.E || 200000); // N/mm^2
  const strapEA = E_strap * strapArea; // N
  // approximate strap local vertical stiffness k_local = EA / L_effective
  // choose L_effective ~ airbeam radius + plate thickness ~ r + top_t
  const L_eff = Math.max(5, r + top_t + 10); // mm
  const k_local = strapEA / L_eff; // N/mm
  // Convert to distributed per-length stiffness along span: k_dist = k_local * (1/spacing)
  const k_dist = k_local / strapSpacing; // N/mm per mm of span => N/mm^2, but we add as diag[k] to K after scaling by dx

  // Build second derivative D2 and fourth derivative D4 finite difference matrices (interior nodes)
  // We'll construct as dense arrays (n x n) for simplicity (n ~ 200).
  function zeros(n) { return Array(n).fill(0).map(() => Array(n).fill(0)); }
  const D2 = zeros(n);
  const D4 = zeros(n);

  // Interior nodes: central difference
  // d2w/dx2 ≈ (w_{i-1} - 2 w_i + w_{i+1}) / dx^2
  // d4w/dx4 ≈ (w_{i-2} - 4 w_{i-1} + 6 w_i - 4 w_{i+1} + w_{i+2}) / dx^4
  for (let i = 0; i < n; i++) {
    // we will treat boundary nodes as simply supported: w(0)=0 and w(L)=0 -> impose Dirichlet by removing those rows/cols
    if (i >= 2 && i <= n - 3) {
      D2[i][i - 1] = 1;
      D2[i][i] = -2;
      D2[i][i + 1] = 1;

      D4[i][i - 2] = 1;
      D4[i][i - 1] = -4;
      D4[i][i] = 6;
      D4[i][i + 1] = -4;
      D4[i][i + 2] = 1;
    } else {
      // near boundaries apply one-sided finite differences for stability (or keep zero and handle BC)
    }
  }

  // Convert D2, D4 to scaled operators
  const scaleD2 = 1.0 / (dx * dx);
  const scaleD4 = 1.0 / (dx * dx * dx * dx);

  // Assemble global stiffness K = EI*D4*scaleD4 - T*D2*scaleD2 + diag(k_dist*dx) (support springs)
  const K = zeros(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      K[i][j] = EI * D4[i][j] * scaleD4 - T * D2[i][j] * scaleD2;
    }
    // add strap distributed stiffness at diagonal for levered support if straps present
    // for simplicity we distribute k_dist across nodes (k_dist * dx)
    K[i][i] += k_dist * dx;
  }

  // Apply boundary conditions: simply supported w0 = wN-1 = 0
  // Remove first and last rows/cols and solve for interior DOFs
  const interiorSize = n - 2;
  const Kint = zeros(interiorSize);
  for (let i = 0; i < interiorSize; i++) {
    for (let j = 0; j < interiorSize; j++) {
      Kint[i][j] = K[i + 1][j + 1];
    }
  }

  // Build load vector f (N/mm) distributed across nodes
  const f = Array(interiorSize).fill(0);
  // uniform load q (kN/m -> N/mm): multiply by 1000 N/kN and divide by 1000 mm/m => q_kN_per_m * 1 N/mm
  const q_kN_per_m = payload.loads?.uniform_load_kN_per_m || 0;
  const q_N_per_mm = q_kN_per_m; // because kN/m * 1 N/mm mapping: 1 kN/m = 1 N/mm
  // distribute q over nodes: f_i = q * dx
  for (let i = 0; i < interiorSize; i++) {
    f[i] += q_N_per_mm * dx;
  }
  // add point loads (kN -> N)
  (payload.loads?.point_loads || []).forEach(pt => {
    const idxFloat = pt.position / dx;
    const idx = Math.round(idxFloat) - 1; // interior index
    if (idx >= 0 && idx < interiorSize) {
      f[idx] += pt.magnitude_kN * 1000; // N
    }
  });
  // vehicle axles: treat as point loads similar to above
  (payload.loads?.vehicle?.axles || []).forEach(ax => {
    const idx = Math.round(ax.offset / dx) - 1;
    if (idx >= 0 && idx < interiorSize) {
      f[idx] += ax.load_kN * 1000;
    }
  });

  // Solve linear system Kint * w = f
  // Use a naive Gaussian elimination (sufficient for n ~ 200). For production, replace with sparse solver.
  function solveLinear(A, b) {
    const nA = A.length;
    // clone
    const M = A.map(row => row.slice());
    const x = b.slice();
    for (let k = 0; k < nA; k++) {
      // pivot
      let pivot = M[k][k];
      if (Math.abs(pivot) < 1e-12) {
        // find swap
        for (let r = k + 1; r < nA; r++) {
          if (Math.abs(M[r][k]) > Math.abs(pivot)) {
            [M[k], M[r]] = [M[r], M[k]];
            [x[k], x[r]] = [x[r], x[k]];
            pivot = M[k][k];
            break;
          }
        }
      }
      if (Math.abs(pivot) < 1e-12) {
        // singular; return zeros
        return Array(nA).fill(0);
      }
      const invPivot = 1 / pivot;
      for (let j = k; j < nA; j++) M[k][j] *= invPivot;
      x[k] *= invPivot;
      for (let i = 0; i < nA; i++) {
        if (i === k) continue;
        const factor = M[i][k];
        for (let j = k; j < nA; j++) {
          M[i][j] -= factor * M[k][j];
        }
        x[i] -= factor * x[k];
      }
    }
    return x;
  }

  const w_int = solveLinear(Kint, f); // mm (deflection)
  // reconstruct full deflection array with zeros at boundaries
  const w = [0, ...w_int, 0];

  // strap force estimates: assume strap axial force increases proportional to midspan deflection difference
  // For each strap line, compute local vertical displacement at strap location (we used centerline only), approximate axial force:
  const numStraps = Math.max(1, Math.floor((width) / strapSpacing));
  const strapForces = Array(numStraps).fill(0);
  for (let i = 0; i < numStraps; i++) {
    // sample midspan deflection as representative
    const midIdx = Math.floor((n - 1) / 2);
    const displacement = w[midIdx]; // mm
    // assuming strap geometry: length ~ L_eff; axial strain = displacement / L_eff (small-angle approx)
    const axialStrain = displacement / L_eff;
    const axialForceN = axialStrain * E_strap * strapArea + (payload.straps.pretension || 0) * 1000;
    strapForces[i] = axialForceN;
  }

  // compute max deflection
  const maxDeflection = Math.max(...w.map(Math.abs));

  return {
    maxDeflection_mm: maxDeflection,
    deflection_mm: w,
    strapForces_N: strapForces,
    diagnostics: {
      EI,
      T,
      k_dist,
      solvedNodes: n
    }
  };
}
