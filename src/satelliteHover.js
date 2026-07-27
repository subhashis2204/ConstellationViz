// satelliteHover.js
import * as THREE from "three";

export function setupSatelliteHover(globe, camera, renderer) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const tooltip = document.getElementById("sat-tooltip");
  const tooltipName = document.getElementById("sat-tooltip-name");

  let hoveredMesh = null;
  const originalColor = new THREE.Color();

  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (tooltip && !tooltip.classList.contains("hidden")) {
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY - 12}px`;
    }
  });

  return function updateHover() {
    // 1. Gather ONLY satellite meshes created by customLayerData
    const satMeshes = [];
    globe.traverse((child) => {
      if (
        child.isMesh &&
        child.userData &&
        child.userData.name &&
        child.userData.satrec
      ) {
        satMeshes.push(child);
      }
    });

    if (satMeshes.length === 0) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(satMeshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;

      if (hoveredMesh !== mesh) {
        // Reset previously hovered satellite
        if (hoveredMesh && hoveredMesh.material) {
          hoveredMesh.material.color.copy(originalColor);
          hoveredMesh.scale.set(1, 1, 1);
        }

        // Highlight new satellite
        hoveredMesh = mesh;
        originalColor.copy(mesh.material.color);
        mesh.material.color.set(0xff0055);
        mesh.scale.set(1.8, 1.8, 1.8);

        if (tooltip && tooltipName) {
          tooltipName.textContent = mesh.userData.name;
          tooltip.classList.remove("hidden");
        }
      }

      if (renderer) renderer.domElement.style.cursor = "pointer";
      return;
    }

    // Un-highlight satellite when mouse leaves
    if (hoveredMesh) {
      if (hoveredMesh.material) {
        hoveredMesh.material.color.copy(originalColor);
        hoveredMesh.scale.set(1, 1, 1);
      }
      hoveredMesh = null;
      if (tooltip) tooltip.classList.add("hidden");
      if (renderer) renderer.domElement.style.cursor = "default";
    }
  };
}
