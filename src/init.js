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
globe.add(cloudMesh);

const starField = createStarfield(scene);

// orbitControl.autoRotate = true;
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

const ticker = () => {
  hover.update();

  if (activeMotionState && !isFocusing) {
    globe.rotation.y += 0.0005 * factor;

    cloudMesh.rotation.y += 0.0002 * factor;
    cloudMesh.rotation.x += 0.0001 * factor;
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(ticker);
};

ticker();
