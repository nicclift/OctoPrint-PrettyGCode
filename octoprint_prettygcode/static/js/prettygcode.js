;(function () {
  const root = document.getElementById("prettygcode-root");
  const host = document.getElementById("pgc-canvas");
  if (!root || !host || !window.THREE) {
    console.warn("[PrettyGCode] Missing root/host/THREE");
    return;
  }

  // === Scene/Camera/Renderer ===
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 5000);
  camera.position.set(220, 180, 220);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  // Lights + plate grid
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(2, 5, 3); scene.add(dir);
  const grid = new THREE.GridHelper(220, 22); scene.add(grid);

  // OrbitControls (r128)
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true; controls.dampingFactor = 0.08;

  // Resize handling
  new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }).observe(host);

  // Render loop
  (function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  })();

  // === Minimal G-code pipeline ===

  // Color helper: map Z to color via simple gradient (low->blue, high->red)
  function colorForZ(z, zMin, zMax) {
    const t = (z - zMin) / Math.max(1e-6, (zMax - zMin));
    // simple lerp blue->red
    return new THREE.Color().setHSL((1 - t) * 2/3, 1.0, 0.5);
  }

  // Very small, single-pass parser for G0/G1. Returns arrays of line segments: [x,y,z] points and colors.
  function parseGcode(gcodeText) {
    const lines = gcodeText.split(/\r?\n/);
    let x = 0, y = 0, z = 0, e = 0, f = 0;
    const vertices = [];    // flat array [x,y,z, x,y,z, ...]
    const colors = [];      // flat array [r,g,b, r,g,b, ...]
    let zMin = +Infinity, zMax = -Infinity;

    // First pass to detect Z range (optional but helps color mapping)
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.length === 0 || l[0] === ';') continue;
      const up = l.toUpperCase();
      if (up.startsWith('G0') || up.startsWith('G1')) {
        const zm = up.match(/Z(-?\d+(\.\d+)?)/);
        if (zm) {
          const nz = parseFloat(zm[1]); if (!isNaN(nz)) { zMin = Math.min(zMin, nz); zMax = Math.max(zMax, nz); }
        }
      }
    }
    if (!isFinite(zMin)) { zMin = 0; zMax = 0.2; }

    // Second pass: build geometry
    let lastX = x, lastY = y, lastZ = z;
    for (let i = 0; i < lines.length; i++) {
      let l = lines[i];
      if (!l || l[0] === ';') continue;
      l = l.trim();
      const up = l.toUpperCase();
      if (!(up.startsWith('G0') || up.startsWith('G1'))) continue;

      const xm = up.match(/X(-?\d+(\.\d+)?)/);
      const ym = up.match(/Y(-?\d+(\.\d+)?)/);
      const zm = up.match(/Z(-?\d+(\.\d+)?)/);
      const em = up.match(/E(-?\d+(\.\d+)?)/);
      const fm = up.match(/F(-?\d+(\.\d+)?)/);

      if (xm) x = parseFloat(xm[1]);
      if (ym) y = parseFloat(ym[1]);
      if (zm) z = parseFloat(zm[1]);
      if (em) e = parseFloat(em[1]);
      if (fm) f = parseFloat(fm[1]);

      // Only draw if there was actual movement in XY or Z
      if ((x !== lastX) || (y !== lastY) || (z !== lastZ)) {
        // segment from last -> current
        vertices.push(lastX, lastY, lastZ, x, y, z);
        const c1 = colorForZ(lastZ, zMin, zMax); colors.push(c1.r, c1.g, c1.b);
        const c2 = colorForZ(z,     zMin, zMax); colors.push(c2.r, c2.g, c2.b);
        lastX = x; lastY = y; lastZ = z;
      }
    }
    return { vertices: new Float32Array(vertices), colors: new Float32Array(colors), zMin, zMax };
  }

  // Build a Line2 (fat lines) mesh from arrays
  function buildLineMesh(data) {
    const geometry = new THREE.LineGeometry();
    // LineGeometry expects pairs for each segment: we already pushed pairs (A,B)
    geometry.setPositions(data.vertices);
    geometry.setColors(data.colors);
    const material = new THREE.LineMaterial({
      linewidth: 2.0,          // in pixels
      vertexColors: true,
      dashed: false,
      transparent: false
    });
    // LineMaterial needs resolution set and updated on resize
    material.resolution.set(host.clientWidth, host.clientHeight);
    const mesh = new THREE.LineSegments2(geometry, material);
    // Keep resolution in sync
    new ResizeObserver(() => material.resolution.set(host.clientWidth, host.clientHeight)).observe(host);
    return mesh;
  }

  // Show a quick status in the overlay if present
  function setStatus(msg) {
    const el = document.querySelector('.pgc-status');
    if (el) el.textContent = msg;
  }

  // Fetch currently selected job → then download its G-code
  async function loadCurrentJobGcode() {
    try {
      setStatus('Querying current job…');
      const jobRes = await fetch('/api/job', { credentials: 'same-origin' });
      if (!jobRes.ok) throw new Error('job API failed');
      const job = await jobRes.json();

      const path = job?.job?.file?.path;
      const origin = job?.job?.file?.origin || 'local';
      if (!path) { setStatus('No file selected.'); return; }

      setStatus('Downloading G-code…');
      // Download raw gcode; same origin so cookies/session auth works
      const fileUrl = `/api/files/${encodeURIComponent(origin)}/${encodeURIComponent(path)}?download=true`;
      const fileRes = await fetch(fileUrl, { credentials: 'same-origin' });
      if (!fileRes.ok) throw new Error('file download failed');
      const gcodeText = await fileRes.text();

      setStatus('Parsing G-code…');
      const data = parseGcode(gcodeText);

      setStatus('Building geometry…');
      const mesh = buildLineMesh(data);
      scene.add(mesh);

      // Adjust camera to content bbox
      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3(); box.getSize(size);
      const center = new THREE.Vector3(); box.getCenter(center);
      controls.target.copy(center);
      camera.position.set(center.x + Math.max(220, size.length()), center.y + Math.max(160, size.length()*0.7), center.z + Math.max(220, size.length()));
      camera.lookAt(center);
      setStatus('PrettyGCode ready ✓');
    } catch (err) {
      console.error('[PrettyGCode] Load error', err);
      setStatus('Error loading G-code (see console).');
    }
  }

  // Kick it off
  loadCurrentJobGcode();
})();
