import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// renderer
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(2, 2, 2);
camera.lookAt(0, 0, 0);

// light（これ無いと真っ黒事件⚠️）
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(3, 5, 3);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// texture
const loader = new THREE.TextureLoader();
const texture = loader.load("./texture/Stone.png");

texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;

// block
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial({ map: texture });
const block = new THREE.Mesh(geometry, material);
scene.add(block);

// render loop
function animate() {
  requestAnimationFrame(animate);

  block.rotation.y += 0.005; // ちょっと回す（生存確認用😏）
  renderer.render(scene, camera);
}
animate();

// resize対応
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
