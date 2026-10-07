import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("twinCanvas");
const container = document.getElementById("map-canvas-container");

if (!canvas || !container) {
  console.error("3D Twin: canvas/container not found.");
  throw new Error("3D Twin canvas not found.");
}

// --------------------------------------------------
// SCENE
// --------------------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08111f);

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);

camera.position.set(55, 48, 55);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --------------------------------------------------
// LIGHTING
// --------------------------------------------------

const ambientLight = new THREE.HemisphereLight(
  0xbfd8ff,
  0x172033,
  2.2
);

scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(40, 70, 25);
sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

scene.add(sun);

// --------------------------------------------------
// CAMPUS DATA
// --------------------------------------------------

const buildings = [
  {
    name: "AB1",
    x: -18,
    z: -8,
    width: 18,
    depth: 11,
    height: 12,
    occupancy: 72,
    floors: 3,
    description: "Academic Block 1",
   photo: "./assets/ab1.jpg",
  },
  {
    name: "AB2",
    x: 10,
    z: -10,
    width: 20,
    depth: 12,
    height: 15,
    occupancy: 64,
    floors: 4,
    description: "Academic Block 2",
    photo: "./assets/ab2.jpg"
  },
  {
    name: "Lab Complex",
    x: -13,
    z: 13,
    width: 22,
    depth: 10,
    height: 9,
    occupancy: 48,
    floors: 2,
    description: "Laboratory Complex",
    photo: "./assets/lab complex.jpg"
  },
  {
    name: "Architecture Building",
    x: 15,
    z: 13,
    width: 17,
    depth: 10,
    height: 11,
    occupancy: 57,
    floors: 3,
    description: "Architecture & Design Block",
    photo: "./assets/architecture.jpg"
  }
];

const buildingGroups = [];
const clickableMeshes = [];

// --------------------------------------------------
// MATERIALS
// --------------------------------------------------

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x14283b,
  roughness: 0.9
});

const buildingMaterial = new THREE.MeshStandardMaterial({
  color: 0x607d9b,
  roughness: 0.65,
  metalness: 0.15,
  transparent: false,
  opacity: 1,
  wireframe: false
});
const roofMaterial = new THREE.MeshStandardMaterial({
  color: 0x26394f,
  roughness: 0.7
});

const windowMaterial = new THREE.MeshStandardMaterial({
  color: 0x75d9ff,
  emissive: 0x0d526d,
  emissiveIntensity: 0.7,
  metalness: 0.4,
  roughness: 0.25
});

// --------------------------------------------------
// GROUND
// --------------------------------------------------

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(90, 1, 70),
  groundMaterial
);

ground.position.y = -0.5;
ground.receiveShadow = true;

scene.add(ground);

// --------------------------------------------------
// ROADS
// --------------------------------------------------

function createRoad(x, z, width, depth) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.12, depth),
    new THREE.MeshStandardMaterial({
      color: 0x263241,
      roughness: 1
    })
  );

  road.position.set(x, 0.06, z);
  road.receiveShadow = true;

  scene.add(road);
}

createRoad(0, 0, 80, 6);
createRoad(-30, 10, 6, 45);
createRoad(30, 10, 6, 45);

// --------------------------------------------------
// BUILDINGS
// --------------------------------------------------

function createBuilding(data) {
  const group = new THREE.Group();

  group.position.set(data.x, 0, data.z);

  // Main building
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(
      data.width,
      data.height,
      data.depth
    ),
    buildingMaterial.clone()
  );

  body.position.y = data.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;

  body.userData.building = data.name;

  group.add(body);
  clickableMeshes.push(body);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(
      data.width + 0.8,
      0.8,
      data.depth + 0.8
    ),
    roofMaterial
  );

  roof.position.y = data.height + 0.4;
  roof.castShadow = true;

  roof.userData.building = data.name;

  group.add(roof);
  clickableMeshes.push(roof);

  // Windows
  const windowRows = Math.max(2, Math.floor(data.height / 3));

  for (let row = 0; row < windowRows; row++) {
    const y = 2 + row * 3;

    if (y > data.height - 1) continue;

    const columns = Math.max(3, Math.floor(data.width / 3));

    for (let col = 0; col < columns; col++) {
      const x =
        -data.width / 2 +
        1.8 +
        col * ((data.width - 3.6) / Math.max(columns - 1, 1));

      const windowFront = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 0.15),
        windowMaterial
      );

      windowFront.position.set(
        x,
        y,
        data.depth / 2 + 0.08
      );

      windowFront.userData.building = data.name;

      group.add(windowFront);
      clickableMeshes.push(windowFront);
    }
  }

  // Entrance
  const entrance = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 3.2, 0.3),
    new THREE.MeshStandardMaterial({
      color: 0x182637,
      roughness: 0.4
    })
  );

  entrance.position.set(
    0,
    1.6,
    data.depth / 2 + 0.18
  );

  entrance.userData.building = data.name;

  group.add(entrance);
  clickableMeshes.push(entrance);

  // Building label
  const label = createLabel(data.name);

  label.position.set(
    0,
    data.height + 2,
    0
  );

  group.add(label);

  scene.add(group);
  buildingGroups.push(group);
}

buildings.forEach(createBuilding);

// --------------------------------------------------
// LABELS
// --------------------------------------------------

function createLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(5, 15, 30, 0.9)";
  ctx.roundRect(10, 25, 492, 70, 18);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(text, 256, 60);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });

  const sprite = new THREE.Sprite(material);

  sprite.scale.set(9, 2.25, 1);

  return sprite;
}

// --------------------------------------------------
// CAMPUS PATHS
// --------------------------------------------------

function createPath(x, z, width, depth) {
  const path = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.16, depth),
    new THREE.MeshStandardMaterial({
      color: 0x8c9aaa,
      roughness: 0.9
    })
  );

  path.position.set(x, 0.09, z);
  scene.add(path);
}

createPath(0, -8, 7, 40);
createPath(-13, 12, 28, 4);
createPath(14, 12, 25, 4);

// --------------------------------------------------
// TREES
// --------------------------------------------------

function createTree(x, z) {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 3, 8),
    new THREE.MeshStandardMaterial({
      color: 0x6b4630
    })
  );

  trunk.position.y = 1.5;

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0x2e7d52,
      roughness: 1
    })
  );

  leaves.position.y = 4;

  group.add(trunk, leaves);

  group.position.set(x, 0, z);

  scene.add(group);
}

[
  [-35, -22],
  [-27, 25],
  [0, 25],
  [34, -22],
  [36, 25],
  [-40, 0],
  [40, 0]
].forEach(([x, z]) => createTree(x, z));

// --------------------------------------------------
// CONTROLS
// --------------------------------------------------

const controls = new OrbitControls(camera, canvas);

controls.enableDamping = true;
controls.dampingFactor = 0.06;

controls.minDistance = 20;
controls.maxDistance = 100;

controls.maxPolarAngle = Math.PI / 2.05;

controls.target.set(0, 5, 0);

// --------------------------------------------------
// CLICKING
// --------------------------------------------------

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedBuilding = null;

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();

  mouse.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  mouse.y =
    -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(
    clickableMeshes,
    false
  );

  if (!hits.length) return;

  const name = hits[0].object.userData.building;

  selectBuilding(name);
});

// --------------------------------------------------
// BUILDING SELECTION
// --------------------------------------------------

function selectBuilding(name) {
  selectedBuilding = name;

  buildingGroups.forEach((group) => {
    const buildingName = group.children.find(
      (child) => child.userData.building
    )?.userData.building;

    group.children.forEach((child) => {
      if (!child.material || !child.material.emissive) return;

      if (buildingName === name) {
        child.material.emissive.set(0x1e8fff);
        child.material.emissiveIntensity = 0.55;
      } else {
        child.material.emissive.set(0x000000);
        child.material.emissiveIntensity = 0;
      }
    });
  });

  const data = buildings.find(
    (building) => building.name === name
  );

  if (data) {
    showBuildingInfo(data);
  }
}

// --------------------------------------------------
// INFO PANEL
// --------------------------------------------------

function showBuildingInfo(data) {
  let panel = document.getElementById("twin-building-info");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "twin-building-info";

    panel.style.position = "absolute";
    panel.style.right = "18px";
    panel.style.top = "18px";
    panel.style.width = "250px";
    panel.style.padding = "18px";
    panel.style.borderRadius = "14px";
    panel.style.background = "rgba(8, 17, 31, 0.94)";
    panel.style.color = "#ffffff";
    panel.style.backdropFilter = "blur(12px)";
    panel.style.boxShadow = "0 12px 35px rgba(0,0,0,.35)";
    panel.style.zIndex = "10";

    container.appendChild(panel);
  }

  panel.innerHTML = `
    <div style="
      font-size:11px;
      letter-spacing:1.5px;
      opacity:.65;
      margin-bottom:6px;
    ">
      SELECTED BUILDING
    </div>

    <div style="
      font-size:22px;
      font-weight:700;
      margin-bottom:10px;
    ">
      ${data.name}
    </div>
    <img
  src="${data.photo}"
  alt="${data.name}"
  style="
    width:100%;
    height:140px;
    object-fit:cover;
    border-radius:10px;
    margin-bottom:14px;
    display:block;
  "
/>

    <div style="opacity:.8;margin-bottom:12px;">
      ${data.description}
    </div>

    <div style="
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:8px;
      font-size:13px;
    ">
      <div>
        <strong>${data.floors}</strong><br>
        <span style="opacity:.6;">Floors</span>
      </div>

      <div>
        <strong>${data.occupancy}%</strong><br>
        <span style="opacity:.6;">Demo occupancy</span>
      </div>
    </div>

    <div style="
      margin-top:14px;
      font-size:11px;
      opacity:.5;
    ">
      Occupancy values are demo data until connected to the team's backend.
    </div>
  `;
}

// --------------------------------------------------
// RESIZE
// --------------------------------------------------

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

window.addEventListener("resize", resize);

// --------------------------------------------------
// ANIMATION
// --------------------------------------------------

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
}

resize();
animate();

console.log("Campus 3D Twin loaded.");
window.__twinDebug = { scene, buildingGroups, renderer };