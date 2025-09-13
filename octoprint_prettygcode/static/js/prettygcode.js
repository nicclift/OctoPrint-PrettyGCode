;(function () {
  const root = document.getElementById("prettygcode-root");
  const host = document.getElementById("pgc-canvas");
  if (!root || !host || !window.THREE) {
    console.warn("[PrettyGCode] Missing root/host/THREE");
    return;
  }

  // Scene + Camera + Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    host.clientWidth / host.clientHeight,
    0.1,
    2000
  );
  camera.position.set(180, 160, 180);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(host.clientWidth, host.clientHeight);
  host.appendChild(renderer.domElement);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(2, 5, 3);
  scene.add(dir);

  // Build plate grid (220mm square, 10mm divisions)
  const grid = new THREE.GridHelper(220, 22);
  scene.add(grid);

  // OrbitControls (from r128 examples/js/controls/OrbitControls.js)
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;   // smooth motion
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.zoomSpeed = 1.0;
  controls.panSpeed = 0.8;

  // Animation loop
  (function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  })();

  // Handle resizing
  const ro = new ResizeObserver(() => {
    const w = host.clientWidth;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(host);
})();
