// satelliteClick.js
import * as THREE from "three";
import { clearAllOrbitLines, toggleOrbitLine } from "./satelliteOrbit.js";

function collectSatelliteMeshes(globe) {
  const satMeshes = [];
  globe.traverse((child) => {
    if (child.isMesh && child.userData?.name && child.userData?.satrec) {
      satMeshes.push(child);
    }
  });
  return satMeshes;
}

export function setupSatelliteClick(
  globe,
  camera,
  renderer,
  getSimulationDate,
) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  renderer.domElement.addEventListener("click", (event) => {
    const satMeshes = collectSatelliteMeshes(globe);
    if (satMeshes.length === 0) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(satMeshes, false);

    if (intersects.length === 0) return;

    const mesh = intersects[0].object;
    const satData = mesh.userData;

    const lineColor = "#00FFFF";
    toggleOrbitLine(globe, satData, getSimulationDate(), lineColor);
  });

  // Export helper function to clear all orbits externally
  return function resetSelection() {
    clearAllOrbitLines(globe);
  };
}
