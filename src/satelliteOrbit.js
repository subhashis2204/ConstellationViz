// satelliteOrbit.js
import * as satellite from "satellite.js";
import * as THREE from "three";

const EARTH_RADIUS_KM = 6371;
const ORBIT_SAMPLES = 180;

// Array to hold all active orbit lines
let activeOrbitLines = [];

function computeOrbitPoints(globe, satrec, refDate) {
  const gmst = satellite.gstime(refDate);
  const periodMinutes = (2 * Math.PI) / satrec.no;
  const periodMs = periodMinutes * 60 * 1000;
  const points = [];

  for (let i = 0; i < ORBIT_SAMPLES; i++) {
    const sampleDate = new Date(
      refDate.getTime() + (i / ORBIT_SAMPLES) * periodMs,
    );
    const positionAndVelocity = satellite.propagate(satrec, sampleDate);
    const positionEci = positionAndVelocity?.position;
    if (!positionEci) continue;

    const geodetic = satellite.eciToGeodetic(positionEci, gmst);
    const lat = satellite.degreesLat(geodetic.latitude);
    const lng = satellite.degreesLong(geodetic.longitude);
    const alt = Math.max(0.02, geodetic.height / EARTH_RADIUS_KM);
    const coords = globe.getCoords(lat, lng, alt);
    points.push(new THREE.Vector3(coords.x, coords.y, coords.z));
  }

  return points;
}

/**
 * Clears ALL active orbit lines from the globe.
 */
export function clearAllOrbitLines(globe) {
  activeOrbitLines.forEach((line) => {
    globe.remove(line);
    line.geometry.dispose();
    line.material.dispose();
  });
  activeOrbitLines = [];
}

/**
 * Toggles or adds an orbit line for a specific satellite.
 */
export function toggleOrbitLine(globe, satData, refDate, color = 0x00ffff) {
  if (!satData?.satrec || !satData?.name) return;

  // Check if orbit line already exists for this satellite
  const existingIndex = activeOrbitLines.findIndex(
    (line) => line.userData?.name === satData.name,
  );

  // If already visible, remove it (toggle off)
  if (existingIndex !== -1) {
    const line = activeOrbitLines[existingIndex];
    globe.remove(line);
    line.geometry.dispose();
    line.material.dispose();
    activeOrbitLines.splice(existingIndex, 1);
    return false; // Orbit toggled off
  }

  // Draw new orbit line
  const points = computeOrbitPoints(globe, satData.satrec, refDate);
  if (points.length < 2) return false;

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
  });

  const orbitLine = new THREE.LineLoop(geometry, material);
  // Tag line with satellite name for tracking
  orbitLine.userData = { name: satData.name };

  globe.add(orbitLine);
  activeOrbitLines.push(orbitLine);
  return true; // Orbit toggled on
}
