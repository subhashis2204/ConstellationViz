// satelliteLoader.js
import * as satellite from "satellite.js";
import * as THREE from "three";

export function parseTLEData(rawTxtData) {
  const lines = rawTxtData
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const satellitesData = [];

  for (let i = 0; i < lines.length; i += 3) {
    if (!lines[i + 1] || !lines[i + 2]) break;

    const name = lines[i].trim();
    const tleLine1 = lines[i + 1];
    const tleLine2 = lines[i + 2];

    try {
      // 1. Store the satrec reference
      const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

      satellitesData.push({
        name: name,
        satrec: satrec, // Saved for real-time propagation in ticker
        lat: 0,
        lng: 0,
        alt: 0,
      });
    } catch (error) {
      console.warn(`Skipping invalid TLE dataset for: ${name}`, error);
    }
  }

  return satellitesData;
}

export function plotSatellites(globe, satellites) {
  globe
    .customLayerData(satellites)
    .customThreeObject((data) => {
      const geometry = new THREE.SphereGeometry(0.3, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: data.color });
      return new THREE.Mesh(geometry, material);
    })
    .customThreeObjectUpdate((mesh, data) => {
      // Reposition the mesh whenever customLayerData triggers an update
      const coords = globe.getCoords(data.lat, data.lng, data.alt);
      mesh.position.set(coords.x, coords.y, coords.z);
    });
}

/**
 * Propagates satellite trajectories to the current time and updates ThreeGlobe positions.
 */
// Track virtual time (defaults to current system time)
let virtualTime = new Date().getTime();

export function updateSatellites(
  globe,
  speedFactor = 1,
  deltaInSeconds = 0.016,
) {
  const satellites = globe.customLayerData();
  if (!satellites || satellites.length === 0) return;

  // Advance virtual time: (delta seconds * multiplier * 1000 ms)
  virtualTime += deltaInSeconds * speedFactor * 10000;

  const currentDate = new Date(virtualTime);
  const gmst = satellite.gstime(currentDate);

  for (let i = 0; i < satellites.length; i++) {
    const d = satellites[i];
    if (!d.satrec) continue;

    const positionAndVelocity = satellite.propagate(d.satrec, currentDate);
    const positionEci = positionAndVelocity.position;

    if (positionEci) {
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);
      d.lat = satellite.degreesLat(positionGd.latitude);
      d.lng = satellite.degreesLong(positionGd.longitude);

      const normalizedAltitude = positionGd.height / 6378.1;
      d.alt = Math.min(normalizedAltitude, 0.6);
    }
  }

  // Trigger ThreeGlobe render updates
  globe.customLayerData(satellites);
}
