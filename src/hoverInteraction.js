import * as THREE from "three";

export function setupHover(renderer, camera, markersGroup) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let hoveredMarker = null;

  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  function update() {
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(markersGroup.children);

    if (intersects.length > 0) {
      const marker = intersects[0].object;

      if (marker !== hoveredMarker) {
        if (hoveredMarker) {
          hoveredMarker.material.color.set(0x00ffff);
          hoveredMarker.scale.set(1, 1, 1);
        }

        marker.material.color.set(0xffcc00);
        marker.scale.set(1.4, 1.4, 1.4);

        hoveredMarker = marker;
      }

      renderer.domElement.style.cursor = "pointer";
    } else {
      if (hoveredMarker) {
        hoveredMarker.material.color.set(0x00ffff);
        hoveredMarker.scale.set(1, 1, 1);
        hoveredMarker = null;
      }

      renderer.domElement.style.cursor = "default";
    }
  }

  return { update };
}
