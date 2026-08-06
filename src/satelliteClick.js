// satelliteClick.js
import * as THREE from "three";
import { clearAllOrbitLines, toggleOrbitLine } from "./satelliteOrbit.js";

let lastClickTime = 0;
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
  // Check if satellite already has a cone mesh attached
  const existingCone = satMesh.getObjectByName("coverageCone");

  if (existingCone) {
    satMesh.remove(existingCone);
    existingCone.geometry.dispose();
    existingCone.material.dispose();
    return;
  }

  // Calculate distance from satellite to Earth's center (0,0,0)
  const satWorldPos = new THREE.Vector3();
  satMesh.getWorldPosition(satWorldPos);
  const distanceToCenter = satWorldPos.length();

  // Altitude above Earth surface
  const altitude = Math.max(distanceToCenter - globeRadius, 5);

  // Cone dimensions (swath footprint based on altitude)
  const coneRadius = altitude * 0.75; // Adjust angle footprint factor here
  const coneHeight = altitude;

  // Create Cone Mesh (pointing down)
  const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true); // open-ended cone
  coneGeo.translate(0, -coneHeight / 2, 0); // Shift origin to apex (satellite position)
  coneGeo.rotateX(-Math.PI / 2); // Orient along -Z axis toward Earth

  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const coneMesh = new THREE.Mesh(coneGeo, coneMat);
  coneMesh.name = "coverageCone";

  // Orient cone pointing toward Earth center (0,0,0)
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

    const currentTime = performance.now();
    const isDoubleClick =
      intersects.length > 0 &&
      intersects[0].object === lastClickedMesh &&
      currentTime - lastClickTime < 300; // 300ms double click threshold

    if (intersects.length === 0) return;

    const mesh = intersects[0].object;
    const satData = mesh.userData;

    if (isDoubleClick) {
      // DOUBLE CLICK: Toggle Coverage Cone
      toggleCoverageCone(mesh);
    } else {
      // SINGLE CLICK: Toggle Orbit Path Line
      const lineColor = "#00FFFF";
      toggleOrbitLine(globe, satData, getSimulationDate(), lineColor);
    }

    lastClickTime = currentTime;
    lastClickedMesh = mesh;
  });

  // Export helper function to clear all orbits & coverage cones
  return function resetSelection() {
    clearAllOrbitLines(globe);

    // Remove all coverage cones from satellite meshes
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
