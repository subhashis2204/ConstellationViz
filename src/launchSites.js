import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { launchSites } from "./dataset";

function createMarker() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
    }),
  );
}

export function launchSitesPlotter(scene, globe) {
  const markersGroup = new THREE.Group();

  globe.add(markersGroup);
  // scene.add(markersGroup);

  launchSites.forEach((site) => {
    const pos = globe.getCoords(site.lat, site.lng, 0.01);

    const marker = createMarker();
    marker.position.copy(pos);
    marker.lookAt(0, 0, 0);

    marker.userData = site;
    markersGroup.add(marker);
  });
}
