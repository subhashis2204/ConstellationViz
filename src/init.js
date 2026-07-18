import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { initScene } from "./initScene.js";
import { controlUI } from "./controlUI.js";
import { createStarfield } from "./background.js";
import { launchSitesPlotter } from "./launchSites.js";
import { setupHover } from "./hoverInteraction.js";
import { setupFocusInteraction } from "./focusInteration.js";
import { rotation } from "./rotation.js";
import { LaunchStationCard } from "./cardStructure.js";
import { launchClickListener } from "./clickListener.js";
import { equatorLine } from "./equatorLine.js";
import { gsap } from "gsap";

const { scene, camera, renderer, orbitControl } = initScene();

// Disabled Orbital Rotation - Enabled Quartenions for accuracy
orbitControl.enableRotate = false;

const globeContainer = new THREE.Group();
scene.add(globeContainer);

const globe = new ThreeGlobe().globeImageUrl("./earth.jpg");
globeContainer.add(globe);

const tilt = new THREE.Quaternion();
tilt.setFromAxisAngle(
  new THREE.Vector3(0, 0, 1),
  THREE.MathUtils.degToRad(-23.44),
);

globeContainer.quaternion.copy(tilt);

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

function getFocusState() {
  return isFocusing;
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

function setDragging(state) {
  isDragging = state;
}

function getDragging() {
  return isDragging;
}

rotation(globe, setDragging, getDragging, getFocusState);

launchClickListener(camera, launchSiteGrp);
const equator = equatorLine();
globe.add(equator);

const axisY = new THREE.Vector3(0, 1, 0);
const axisX = new THREE.Vector3(1, 0, 0);

const qx = new THREE.Quaternion();
const qy = new THREE.Quaternion();

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
