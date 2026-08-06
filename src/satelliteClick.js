// satelliteClick.js
import * as THREE from "three";
import { clearAllOrbitLines, toggleOrbitLine } from "./satelliteOrbit.js";

let clickTimer = null;
let lastClickedMesh = null;

function collectSatelliteMeshes(globe) {
  const satMeshes = [];
  globe.traverse((child) => {
    if (child.isMesh && child.userData?.name && child.userData?.satrec) {
      satMeshes.push(child);
    }
  });
  return satMeshes;
}

/**
 * Creates or toggles a 3D coverage cone attached to the satellite mesh
 */
function toggleCoverageCone(satMesh, globeRadius = 100) {
  const existingCone = satMesh.getObjectByName("coverageCone");

  if (existingCone) {
    satMesh.remove(existingCone);
    existingCone.geometry.dispose();
    existingCone.material.dispose();
    return;
  }

  const satWorldPos = new THREE.Vector3();
  satMesh.getWorldPosition(satWorldPos);
  const distanceToCenter = satWorldPos.length();

  const altitude = Math.max(distanceToCenter - globeRadius, 5);
  const coneRadius = altitude * 0.75;
  const coneHeight = altitude;

  const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true);
  coneGeo.translate(0, -coneHeight / 2, 0);
  coneGeo.rotateX(-Math.PI / 2);

  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const coneMesh = new THREE.Mesh(coneGeo, coneMat);
  coneMesh.name = "coverageCone";
  coneMesh.lookAt(new THREE.Vector3(0, 0, 0));

  satMesh.add(coneMesh);
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

    const currentMesh = intersects[0].object;
    const satData = currentMesh.userData;

    // Check if this click is a double-click on the same satellite
    if (clickTimer && lastClickedMesh === currentMesh) {
      // --- DOUBLE CLICK DETECTED ---
      clearTimeout(clickTimer);
      clickTimer = null;
      lastClickedMesh = null;

      toggleCoverageCone(currentMesh);
    } else {
      // --- SINGLE CLICK (Delayed) ---
      clearTimeout(clickTimer);
      lastClickedMesh = currentMesh;

      clickTimer = setTimeout(() => {
        const lineColor = "#00FFFF";
        toggleOrbitLine(globe, satData, getSimulationDate(), lineColor);

        clickTimer = null;
        lastClickedMesh = null;
      }, 250); // 250ms threshold
    }
  });

  // Export helper function to clear all orbits & coverage cones
  return function resetSelection() {
    clearAllOrbitLines(globe);

    const satMeshes = collectSatelliteMeshes(globe);
    satMeshes.forEach((satMesh) => {
      const existingCone = satMesh.getObjectByName("coverageCone");
      if (existingCone) {
        satMesh.remove(existingCone);
        existingCone.geometry.dispose();
        existingCone.material.dispose();
      }
    });
  };
}
