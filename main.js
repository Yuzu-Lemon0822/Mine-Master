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

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// 視点用のオブジェクト（yaw / pitch 分離）
const yawObject = new THREE.Object3D();
const pitchObject = new THREE.Object3D();
yawObject.add(pitchObject);
pitchObject.add(camera);
scene.add(yawObject);

yawObject.position.set(4, 4, 4);

// light
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
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
function setBlock(pos, rotate, texture) {
  const [x, y, z] = pos;
  const [roll, pitch, yaw] = rotate;

  if (!textureCache[texture]) {
    const tex = loader.load("./texture/" + texture);
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
  block.rotation.set(roll, pitch, yaw);

  scene.add(block);
  return block;
}

// ====================
// test blocks 🧱
// ====================
for (let x = -2; x <= 2; x++) {
  for (let z = -2; z <= 2; z++) {
    setBlock([x, 0, z], [0, 0, 0], "Stone.png");
  }
}
setBlock([0, 1, 0], [1, 1, 1], "Stone.png");

// ====================
// input (keyboard)
// ====================
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// ====================
// mouse look 🖱
// ====================
const sensitivity = 0.002;

canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== canvas) return;

  yawObject.rotation.y -= e.movementX * sensitivity;
  pitchObject.rotation.x -= e.movementY * sensitivity;

  // 上下見すぎ防止
  pitchObject.rotation.x = Math.max(
    -Math.PI / 2,
    Math.min(Math.PI / 2, pitchObject.rotation.x)
  );
});

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

  // カメラの向きに合わせて移動
  velocity.applyQuaternion(yawObject.quaternion);
  yawObject.position.add(velocity);
}

// ====================
// render loop
// ====================
function animate() {
  requestAnimationFrame(animate);

  updateMovement();
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
