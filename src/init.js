import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { initScene } from "./initScene.js";
import { controlUI } from "./controlUI.js";
import { createStarfield } from "./background.js";
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
scene.add(cloudMesh);

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
  orbitControl,
  camera,
  getMotionStatus,
  updateMotionState,
  rotationSpeedMultiplier,
);

const ticker = () => {
  if (activeMotionState) {
    globe.rotation.y += 0.0005 * factor;

    cloudMesh.rotation.y += 0.0002 * factor;
    cloudMesh.rotation.x += 0.0001 * factor;
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(ticker);
};

ticker();
