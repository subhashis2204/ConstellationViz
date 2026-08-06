import * as THREE from "three";
import ThreeGlobe from "three-globe";
import axios from "axios";
import { initScene, getCameraAltitudeKm } from "./initScene.js";
import { controlUI } from "./controlUI.js";
import { createStarfield } from "./background.js";
import { launchSitesPlotter } from "./launchSites.js";
import { setupHover } from "./hoverInteraction.js";
import { setupFocusInteraction } from "./focusInteration.js";
import { rotation } from "./rotation.js";
import { LaunchStationCard } from "./cardStructure.js";
import { launchClickListener } from "./clickListener.js";
import { equatorLine } from "./equatorLine.js";
import {
  clearAllOrbitLines,
  updateActiveOrbitLines,
} from "./satelliteOrbit.js";
import { setupSatelliteHover } from "./satelliteHover.js";
import {
  liveSatelliteDataset,
  plotSatellites,
  parseTLEData,
  updateSatellites,
  getSimulationDate,
} from "./satelliteLoader.js";
import { setupSatelliteClick } from "./satelliteClick.js";
import { gsap } from "gsap";

const { scene, camera, renderer, orbitControl } = initScene();
console.log(camera.position.z);

// Disabled Orbital Rotation - Enabled Quartenions for accuracy
orbitControl.enableRotate = false;

const globeContainer = new THREE.Group();
scene.add(globeContainer);

const globe = new ThreeGlobe().globeImageUrl(
  `${import.meta.env.BASE_URL}assets/earth.jpg`,
);
globeContainer.add(globe);

const tilt = new THREE.Quaternion();
tilt.setFromAxisAngle(
  new THREE.Vector3(0, 0, 1),
  THREE.MathUtils.degToRad(-23.44),
);

// globeContainer.quaternion.copy(tilt);

const cloudGeometry = new THREE.SphereGeometry(101, 64, 64);
const cloudTexture = new THREE.TextureLoader().load(
  `${import.meta.env.BASE_URL}assets/earth_cloud_lite.jpg`,
);
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

let datasetLabel = null;
const datasetSelect = document.querySelector("#dataset-select");
const datasetColor = document.querySelector("#color-picker");
const datasetSatelliteCount = document.querySelector("#sat-count-display");

const cameraAlt = document.querySelector("#camera-alt");

// -----------------------------------------------------------------

const pathlist = [
  { category: "ONEWEB", path: "./oneweb.txt", color: "#ffc8dd" },
  // {
  //   category: "GEOSAT",
  //   path: "./communication_satellites.txt",
  //   // limit: 500,
  //   color: "#caf0f8",
  // },
  // {
  //   category: "STARLINK",
  //   path: "./satellite.txt",
  //   limit: 500,
  //   color: "#57ffa5",
  // },
];

// async function satelliteDataLoader(pathlist) {
//   const fullData = {};

//   await Promise.all(
//     pathlist.map(async ({ category, path, limit, color }) => {
//       const { data } = await axios.get(path, {
//         responseType: "text",
//       });

//       let parsedData = parseTLEData(data);

//       if (limit) {
//         parsedData = parsedData.slice(0, limit);
//       }

//       fullData[category] = parsedData.map((row) => {
//         return {
//           ...row,
//           color,
//         };
//       });
//     }),
//   );

//   return fullData;
// }

async function satelliteDataLoader(datasetLabel) {
  const fullData = {};
  let dataset = await liveSatelliteDataset(datasetLabel);

  return dataset.map((row) => {
    return {
      ...row,
      color: datasetColor.value,
    };
  });
}

const updateSatHover = setupSatelliteHover(globe, camera, renderer);
const resetSatelliteOrbit = setupSatelliteClick(
  globe,
  camera,
  renderer,
  getSimulationDate,
);

datasetSelect.addEventListener("change", async (event) => {
  datasetLabel = event.target.value;

  datasetSatelliteCount.innerHTML = "Loading ...";

  clearAllOrbitLines(globe);

  const dataset = await satelliteDataLoader(datasetLabel);
  datasetSatelliteCount.innerHTML = dataset.length || "--";

  resetSatelliteOrbit();
  plotSatellites(globe, dataset);
});

const clearOrbitsBtn = document.querySelector("#clear-orbits-btn");
if (clearOrbitsBtn) {
  clearOrbitsBtn.addEventListener("click", () => {
    resetSatelliteOrbit();
  });
}
// --------------------------------------------------------------------

const axisY = new THREE.Vector3(0, 1, 0);
const axisX = new THREE.Vector3(1, 0, 0);

const qx = new THREE.Quaternion();
const qy = new THREE.Quaternion();

// Cache reusable Quaternion elements for performance inside ticker loop
const autoRotationQ = new THREE.Quaternion();
const cloudDriftQ = new THREE.Quaternion();

const clock = new THREE.Clock();

let altitude = getCameraAltitudeKm(camera);
cameraAlt.innerHTML = getCameraAltitudeKm(camera);

function updateCoverageCones(globe) {
  const origin = new THREE.Vector3(0, 0, 0);

  globe.traverse((child) => {
    if (child.isMesh && child.name === "coverageCone") {
      // Always point cone apex toward Earth's center (0,0,0)
      child.lookAt(origin);
    }
  });
}

const ticker = () => {
  hover.update();

  const globeSpinToggle = document.querySelector("#toggle-spin");

  if (altitude !== getCameraAltitudeKm(camera)) {
    altitude = getCameraAltitudeKm(camera);
    cameraAlt.innerHTML = altitude;
  }

  const delta = clock.getDelta(); // Frame time in seconds (~0.016s)

  if (activeMotionState && !isDragging) {
    updateSatellites(globe, factor, delta);
    // Keep active orbits attached & updated relative to current simulation date
    updateActiveOrbitLines(globe, getSimulationDate());
  } else {
    updateSatellites(globe, 0, delta);
  }

  // Ensure active coverage cones stay aligned toward Earth's center
  updateCoverageCones(globe);

  // Update satellite hover check on every frame
  updateSatHover();

  // Core Globe Spin
  if (
    globeSpinToggle.checked &&
    activeMotionState &&
    !isFocusing &&
    !isDragging
  ) {
    autoRotationQ.setFromAxisAngle(axisY, 0.0005 * factor);
    globe.quaternion.multiply(autoRotationQ);

    cloudDriftQ.setFromAxisAngle(axisY, 0.0001 * factor);
    cloudMesh.quaternion.multiply(cloudDriftQ);
  }

  orbitControl.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(ticker);
};

ticker();
