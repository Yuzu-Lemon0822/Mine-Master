import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// ====================
// basic setup
// ====================
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
scene.fog = new THREE.FogExp2(0x1a1a1a, 0.06);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// yaw / pitch 分離
const yawObject = new THREE.Object3D();
const pitchObject = new THREE.Object3D();
yawObject.add(pitchObject);
pitchObject.add(camera);
scene.add(yawObject);

yawObject.position.set(4, 4, 4);

// light
scene.add(new THREE.AmbientLight(0xcccccc, 0.4));
const dirLight = new THREE.DirectionalLight(0xcccccc, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// ====================
// shared resources
// ====================
const loader = new THREE.TextureLoader();
const geometry = new THREE.BoxGeometry(1, 1, 1);
const textureCache = {};

// ====================
// setBlock API 🍋
// ====================
function setBlock(x, y, z, texture) {
  if (!textureCache[texture]) {
    const tex = loader.load("./texture/" + texture + ".png");
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    textureCache[texture] = tex;
  }

  const material = new THREE.MeshLambertMaterial({
    map: textureCache[texture]
  });

  const block = new THREE.Mesh(geometry, material);
  block.position.set(x + 0.5, y + 0.5, z + 0.5);
  scene.add(block);
}

// ====================
// world parameters 🌍
// ====================
const CHUNK_SIZE = 8;
const VIEW_RADIUS = 2; // 周囲25チャンク

const wall = 1;
const random = [1, 5, 3, 9, 6, 2];

const oreData = [
  { type: "Coal_Ore", min: 0, max: 200, per: 0.10 },
  { type: "Copper_Ore", min: 50, max: 600, per: 0.08 },
  { type: "Iron_Ore", min: 100, max: 800, per: 0.08 },
  { type: "Gold_Ore", min: 250, max: 1500, per: 0.05 },
  { type: "Diamond_Ore", min: 500, max: 3000, per: 0.02 },
];

// ====================
// generate / ore
// ====================
function generate(x, z) {
  const tt = 2 * Math.PI / 360;
  let answer = (x + 1502);
  let idx = Math.floor(((x * 4.4721) + (z * 15.1567)) % 6);
  idx = (idx + 6) % 6;
  answer += ((x - z) * ((Math.floor(
    x + z * Math.sin(tt * ((z - 4536) * (x + 4972)))
  ) * ((((x - 268) * (z + 216)) % 37) + random[idx])) % 37));
  return answer % 2;
}

function pickOre(x, z) {
  const b = Math.abs(x) + Math.abs(z);
  let r = Math.random();
  let acc = 0;

  for (const d of oreData) {
    const t = Math.max(-1, Math.min(1, 2 * ((b - d.min) / (d.max - d.min)) - 1));
    const per = (1 - t * t) * d.per;
    acc += per;
    if (r < acc) return d.type;
  }
  return "Stone";
}

// ====================
// chunk system 🧱
// ====================
const chunks = new Map();

function generateChunk(cx, cz) {
  const baseX = cx * CHUNK_SIZE;
  const baseZ = cz * CHUNK_SIZE;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const wx = baseX + x;
      const wz = baseZ + z;

      setBlock(wx, 0, wz, "Stone"); // floor
      setBlock(wx, 5, wz, "Stone");  // ceiling

      if (generate(cx, cz) === wall) {
        for (let y = 1; y < 5; y++) {
          setBlock(wx, y, wz, pickOre(wx, wz));
        }
      }
    }
  }
}

function frame(playerX, playerZ) {
  const pcx = Math.floor(playerX / CHUNK_SIZE);
  const pcz = Math.floor(playerZ / CHUNK_SIZE);

  for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
    for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const key = `${cx},${cz}`;

      if (chunks.has(key)) continue;

      generateChunk(cx, cz);
      chunks.set(key, true);
    }
  }
}

// ====================
// input (keyboard)
// ====================
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// ====================
// camera rotation 🎯
// ====================
const rotateSpeed = 0.03;

function updateCameraRotation() {
  if (keys["ArrowLeft"]) yawObject.rotation.y += rotateSpeed;
  if (keys["ArrowRight"]) yawObject.rotation.y -= rotateSpeed;
  if (keys["ArrowUp"]) pitchObject.rotation.x += rotateSpeed;
  if (keys["ArrowDown"]) pitchObject.rotation.x -= rotateSpeed;

  pitchObject.rotation.x = Math.max(
    -Math.PI / 2,
    Math.min(Math.PI / 2, pitchObject.rotation.x)
  );
}

// ====================
// movement 🚶
// ====================
const velocity = new THREE.Vector3();
const speed = 0.1;

function updateMovement() {
  velocity.set(0, 0, 0);

  if (keys["KeyW"]) velocity.z -= speed;
  if (keys["KeyS"]) velocity.z += speed;
  if (keys["KeyA"]) velocity.x -= speed;
  if (keys["KeyD"]) velocity.x += speed;
  if (keys["Space"]) velocity.y += speed;
  if (keys["ShiftLeft"]) velocity.y -= speed;

  velocity.applyQuaternion(yawObject.quaternion);
  yawObject.position.add(velocity);
}

// ====================
// render loop
// ====================
let lastChunkX = null;
let lastChunkZ = null;

function animate() {
  requestAnimationFrame(animate);

  updateCameraRotation();
  updateMovement();

  const cx = Math.floor(yawObject.position.x / CHUNK_SIZE);
  const cz = Math.floor(yawObject.position.z / CHUNK_SIZE);

  if (cx !== lastChunkX || cz !== lastChunkZ) {
    frame(yawObject.position.x, yawObject.position.z);
    lastChunkX = cx;
    lastChunkZ = cz;
  }

  renderer.render(scene, camera);
}
animate();

// ====================
// resize
// ====================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
