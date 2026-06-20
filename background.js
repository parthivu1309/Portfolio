(function initBackground() {
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLAvailable()) {
    // Fallback: CSS animated gradient background
    document.body.style.background = 'radial-gradient(ellipse at 20% 50%, rgba(88,166,255,0.05) 0%, #0d1117 60%)';
    return; // Skip entire Three.js init
  }

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile, // Disable antialiasing on mobile
    alpha: true,
    powerPreference: 'low-power'
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 30);

  const scene = new THREE.Scene();

  // --- LAYER 1: Geometric Nodes ---
  const nodeCount = isMobile ? 20 : 50;
  const geometricNodes = [];
  
  const geometries = [
    new THREE.IcosahedronGeometry(0.3, 0),
    new THREE.OctahedronGeometry(0.25, 0),
    new THREE.TetrahedronGeometry(0.2, 0)
  ];
  
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x58a6ff,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });

  for (let i = 0; i < nodeCount; i++) {
    const geo = geometries[Math.floor(Math.random() * geometries.length)];
    const mesh = new THREE.Mesh(geo, nodeMaterial);
    
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 15 + Math.random() * 25;
    
    mesh.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi) - 15
    );

    mesh.userData = {
      rotX: (Math.random() - 0.5) * 0.008,
      rotY: (Math.random() - 0.5) * 0.008,
      rotZ: (Math.random() - 0.5) * 0.005,
      floatSpeed: 0.0003 + Math.random() * 0.0004,
      floatOffset: Math.random() * Math.PI * 2,
      originalY: mesh.position.y
    };
    
    geometricNodes.push(mesh);
    scene.add(mesh);
  }

  // --- LAYER 2: Network Graph ---
  const networkGroup = new THREE.Group();
  const graphNodeCount = isMobile ? 10 : 22;
  const graphPositions = [];

  for (let i = 0; i < graphNodeCount; i++) {
    graphPositions.push(new THREE.Vector3(
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 50,
      -15 + (Math.random() - 0.5) * 10
    ));
  }

  const dotGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.5 });
  
  graphPositions.forEach(pos => {
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
    networkGroup.add(dot);
  });

  const lineMat = new THREE.LineBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.12 });
  const threshold = 22;

  for (let i = 0; i < graphNodeCount; i++) {
    for (let j = i + 1; j < graphNodeCount; j++) {
      if (graphPositions[i].distanceTo(graphPositions[j]) < threshold) {
        const geo = new THREE.BufferGeometry().setFromPoints([graphPositions[i], graphPositions[j]]);
        const line = new THREE.Line(geo, lineMat);
        networkGroup.add(line);
      }
    }
  }

  networkGroup.userData = {
    rotX: 0.00008,
    rotY: 0.00015
  };
  scene.add(networkGroup);

  // --- LAYER 3: Star Field ---
  const starCount = isMobile ? 300 : 900;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3 + 0] = (Math.random() - 0.5) * 200;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    starPositions[i * 3 + 2] = -40 - Math.random() * 40;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xe6edf3,
    size: 0.08,
    transparent: true,
    opacity: 0.6
  });
  
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // --- LAYER 4: Cricket Sphere (Hero Only) ---
  const ballGeo = new THREE.IcosahedronGeometry(4, 1);
  const ballMat = new THREE.MeshBasicMaterial({
    color: 0xf0883e,
    wireframe: true,
    transparent: true,
    opacity: 0.06
  });
  const cricketSphere = new THREE.Mesh(ballGeo, ballMat);
  cricketSphere.position.set(15, -5, -25);
  scene.add(cricketSphere);

  // --- INTERACTION STATE ---
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let scrollProgress = 0;

  if (!isMobile && !prefersReducedMotion) {
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  window.addEventListener('scroll', () => {
    // Avoid division by zero
    const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    scrollProgress = window.scrollY / maxScroll;
    
    // Opacity modulation
    const heroOpacity = 1 - Math.max(0, (scrollProgress - 0.2) / 0.1);
    geometricNodes.forEach(m => {
      m.material.opacity = 0.35 * Math.max(0.4, heroOpacity);
    });
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
  });

  // --- ANIMATION LOOP ---
  const clock = new THREE.Clock();
  let lastTime = 0;
  const targetFPS = isMobile ? 30 : 60;
  const frameInterval = 1000 / targetFPS;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clock.stop();
    } else {
      clock.start();
    }
  });

  function animate(currentTime) {
    requestAnimationFrame(animate);
    
    const delta = currentTime - lastTime;
    if (delta < frameInterval) return;
    lastTime = currentTime - (delta % frameInterval);

    if (prefersReducedMotion) {
       // Just render static if user prefers reduced motion
       renderer.render(scene, camera);
       return;
    }

    const elapsed = clock.getElapsedTime();

    geometricNodes.forEach(mesh => {
      mesh.rotation.x += mesh.userData.rotX;
      mesh.rotation.y += mesh.userData.rotY;
      mesh.rotation.z += mesh.userData.rotZ;
      mesh.position.y = mesh.userData.originalY + Math.sin(elapsed * mesh.userData.floatSpeed * 600 + mesh.userData.floatOffset) * 0.8;
    });

    networkGroup.rotation.y += networkGroup.userData.rotY;
    networkGroup.rotation.x += networkGroup.userData.rotX;

    stars.rotation.y += 0.00003;

    cricketSphere.rotation.x += 0.0008;
    cricketSphere.rotation.y += 0.0012;

    if (!isMobile) {
      targetX += (mouseX * 2.5 - targetX) * 0.05;
      targetY += (mouseY * 1.5 - targetY) * 0.05;
      camera.position.x = targetX;
      camera.position.y = targetY;
    }

    camera.position.z = 30 - scrollProgress * 12;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  // Start loop
  requestAnimationFrame(animate);
})();
