// hoverInteraction.js
import * as THREE from "three";

export function setupHover(renderer, camera, markersGroup) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const tooltip = document.getElementById("launch-tooltip");
  const tooltipName = document.getElementById("launch-tooltip-name");

  let hoveredMarker = null;

  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Follow mouse position for tooltip
    if (tooltip) {
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY - 12}px`;
    }
  });

  function update() {
    if (!markersGroup || !markersGroup.children.length) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markersGroup.children, false);

    if (intersects.length > 0) {
      const marker = intersects[0].object;

      if (marker !== hoveredMarker) {
        // Reset previous marker
        if (hoveredMarker) {
          hoveredMarker.material.color.set(0xfefae0);
          hoveredMarker.scale.set(1, 1, 1);
        }

        // Highlight launch station
        hoveredMarker = marker;
        hoveredMarker.material.color.set(0xffcc00);
        hoveredMarker.scale.set(1.5, 1.5, 1.5);

        // Populate and display tooltip
        if (tooltip && tooltipName && marker.userData && marker.userData.name) {
          tooltipName.textContent = marker.userData.name;
          tooltip.classList.remove("hidden");
        }
      }

      renderer.domElement.style.cursor = "pointer";
    } else {
      // Un-highlight when cursor leaves station
      if (hoveredMarker) {
        hoveredMarker.material.color.set(0xfefae0);
        hoveredMarker.scale.set(1, 1, 1);
        hoveredMarker = null;

        if (tooltip) tooltip.classList.add("hidden");
        if (renderer.domElement.style.cursor === "pointer") {
          renderer.domElement.style.cursor = "default";
        }
      }
    }
  }

  return { update };
}
