import * as THREE from "three";
import { LaunchStationCard } from "./cardStructure";

export function launchClickListener(camera, markersGroup) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markersGroup.children, false);

    if (!intersects.length) return;

    const clickedMarker = intersects[0].object;
    LaunchStationCard(clickedMarker.userData);

    // focusMarker(clickedMarker);
  });
}
