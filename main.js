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
camera.position.set(4, 4, 4);
camera.lookAt(0, 0, 0);

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

// テクスチャキャッシュ（同じPNGを何度もロードしない）
const textureCache = {};

// ====================
// setBlock API 🍋
// ====================
function setBlock(pos, rotate, texture) {
  const [x, y, z] = pos;
  const [roll, pitch, yaw] = rotate;

  // texture load (with cache)
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

  // position (center-based)
  block.position.set(
    x + 0.5,
    y + 0.5,
    z + 0.5
  );

  // rotation (roll, pitch, yaw)
  block.rotation.set(
    roll,
    pitch,
    yaw
  );

  scene.add(block);
  return block;
}

// ====================
// test block 🧱
// ====================
setBlock([0, 0, 0], [0, 0, 0], "Stone.png");

// ====================
// render loop
// ====================
function animate() {
  requestAnimationFrame(animate);
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
