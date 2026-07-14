import * as THREE from "three";
import { gsap } from "gsap";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import ThreeGlobe from "three-globe";

const canvas = document.querySelector("#Canvas");
const stopMotionButton = document.querySelector("#stop-motion");

// Keep track of whether the motion should be playing or paused
let isMotionActive = false;
const buttonText = document.querySelector("#buttonText");
const buttonIcon = document.querySelector("#buttonIcon");
const resetButton = document.querySelector("#reset");

// 1. Initialize the Globe
const globe = new ThreeGlobe().globeImageUrl("./earth.jpg");

// 2. Add the Cloud Layer ☁️
const cloudGeometry = new THREE.SphereGeometry(101, 64, 64); // 101 radius makes it sit just slightly above the globe (radius 100)

const cloudTexture = new THREE.TextureLoader().load("./earth_cloud_lite.jpg"); // Path to your cloud texture

const cloudMaterial = new THREE.MeshStandardMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.4, // Adjust how prominent you want the clouds to be
  blending: THREE.AdditiveBlending, // Makes the clouds catch light beautifully
});

const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04040c); // Deep space blue/black
scene.add(globe);
scene.add(cloudMesh);

// 2. ADD LIGHTS HERE 💡
const ambientLight = new THREE.AmbientLight(0xffffff, 2 + 0.7); // Soft overall light
scene.add(ambientLight);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5); // Mimics sunlight
// directionalLight.position.set(5, 3, 5);
// scene.add(directionalLight);

// 3. Camera Setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 0, 220);
scene.add(camera);

// 4. Controls
const orbitControl = new OrbitControls(camera, canvas);
orbitControl.enableDamping = true;
orbitControl.minPolarAngle = Math.PI / 3;
orbitControl.maxPolarAngle = (2 * Math.PI) / 3;

// orbitControl.autoRotate = true;
orbitControl.autoRotateSpeed = 0.5; // Adjust speed here

// 5. Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); // added antialias for smoother edges
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // handles high-DPI displays

// gsap.to(globe.rotation, {
//   duration: 120,
//   repeat: -1,
//   y: Math.PI * 2,
//   ease: "none",
// });

// 6. Animation Loop
const ticker = () => {
  if (isMotionActive) {
    cloudMesh.rotation.y += 0.0002;
    cloudMesh.rotation.x += 0.0001;
  }

  orbitControl.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(ticker);
};

ticker();

// 7. Optional: Handle Window Resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const playIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" /></svg>`;
const pauseIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Zm7.5 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" /></svg>`;

stopMotionButton.addEventListener("click", () => {
  isMotionActive = !isMotionActive;

  orbitControl.autoRotate = isMotionActive;

  if (isMotionActive) {
    buttonText.textContent = "Pause Motion";
    buttonIcon.innerHTML = pauseIconHtml;
  } else {
    buttonText.textContent = "Start Motion";
    buttonIcon.innerHTML = playIconHtml;
  }
});

resetButton.addEventListener("click", () => {
  const centreOfWorld = new THREE.Vector3(0, 0, 0);
  // 1. Calculate the current distance from the camera to the target
  const distance = camera.position.distanceTo(centreOfWorld);

  // 2. Figure out the current horizontal angle (yaw) on the XZ plane
  const theta = Math.atan2(camera.position.x, camera.position.z);

  // 3. Calculate the new X and Z positions at Y = 0 that preserve that exact distance
  const newX = distance * Math.sin(theta);
  const newZ = distance * Math.cos(theta);

  gsap.to(orbitControl.target, {
    x: 0,
    y: 0,
    z: 0,
    ease: "power2.out",
    duration: 1,
  });

  gsap.to(camera.position, {
    x: newX,
    y: 0,
    z: newZ,
    duration: 1,
    ease: "power2.out",
    onUpdate: () => orbitControl.update(),
  });
});
