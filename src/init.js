import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { initScene } from "./initScene.js";
import { controlUI } from "./controlUI.js";
import { createStarfield } from "./background.js";
import { launchSitesPlotter } from "./launchSites.js";
import { setupHover } from "./hoverInteraction.js";
import { setupFocusInteraction } from "./focusInteration.js";
import { gsap } from "gsap";

const { scene, camera, renderer, orbitControl } = initScene();

// --- CRITICAL FIX FOR ORBIT CONTROLS ---
// Disable left-click camera orbiting so it doesn't fight your manual globe drag logic.
// This allows orbitControl to still manage smooth zooming and panning.
orbitControl.enableRotate = false;

const globe = new ThreeGlobe().globeImageUrl("./earth.jpg");
scene.add(globe);

const cloudGeometry = new THREE.SphereGeometry(101, 64, 64);
const cloudTexture = new THREE.TextureLoader().load("./earth_cloud_lite.jpg");
const cloudMaterial = new THREE.MeshStandardMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending,
});

const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
globe.add(cloudMesh); // Cloud is a child of the globe, rotating dynamically with it!

const starField = createStarfield(scene);

let activeMotionState = false;
let factor = 1;

const updateMotionState = function (state) {
  activeMotionState = state;
};

const getMotionStatus = function () {
  return activeMotionState;
};

const rotationSpeedMultiplier = function (mult) {
  factor = mult;
};

controlUI(
  globe,
  orbitControl,
  camera,
  getMotionStatus,
  updateMotionState,
  rotationSpeedMultiplier,
);

const launchSiteGrp = launchSitesPlotter(scene, globe);
const hover = setupHover(renderer, camera, launchSiteGrp);

let isFocusing = false;
function setFocusState(state) {
  isFocusing = state;
}

setupFocusInteraction(
  renderer,
  camera,
  globe,
  orbitControl,
  launchSiteGrp,
  setFocusState,
  getMotionStatus,
);

// --- DRAG INTERACTION VIA QUATERNIONS ---
let isDragging = false;
let mouse = { x: 0, y: 0 };

const axisY = new THREE.Vector3(0, 1, 0);
const axisX = new THREE.Vector3(1, 0, 0);

const qx = new THREE.Quaternion();
const qy = new THREE.Quaternion();

const canvas = document.querySelector("#Canvas");

canvas.addEventListener("mousedown", (event) => {
  // If we are currently focusing/snapping to a pad, do not let user drag disrupt it
  if (isFocusing) return;
  isDragging = true;
  mouse.x = event.offsetX;
  mouse.y = event.offsetY;
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDragging || isFocusing) return;

  const dx = event.offsetX - mouse.x;
  const dy = event.offsetY - mouse.y;

  const sensitivity = 0.003; // Slightly lowered for cleaner control

  // Track vectors relative to the world frame for intuitive dragging
  qx.setFromAxisAngle(axisX, dy * sensitivity);
  qy.setFromAxisAngle(axisY, dx * sensitivity);

  // Premultiplying creates an intuitive world-space manipulation mapping
  globe.quaternion.premultiply(qx);
  globe.quaternion.premultiply(qy);

  mouse.x = event.offsetX;
  mouse.y = event.offsetY;
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

// Cache reusable Quaternion elements for performance inside ticker loop
const autoRotationQ = new THREE.Quaternion();
const cloudDriftQ = new THREE.Quaternion();

const ticker = () => {
  hover.update();

  // Handle auto-rotation updates
  if (activeMotionState && !isFocusing && !isDragging) {
    // 1. Core Globe Spin on Y-axis
    autoRotationQ.setFromAxisAngle(axisY, 0.0005 * factor);
    globe.quaternion.multiply(autoRotationQ);

    // 2. Cloud Drift Relative To Earth Parent
    // Firing a slight incremental offset keeps the atmosphere alive without spiraling out of control
    cloudDriftQ.setFromAxisAngle(axisY, 0.0001 * factor);
    cloudMesh.quaternion.multiply(cloudDriftQ);
  }

  orbitControl.update(); // Keeps damping updates running smoothly
  renderer.render(scene, camera);
  window.requestAnimationFrame(ticker);
};

ticker();
