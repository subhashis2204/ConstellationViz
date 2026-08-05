// satelliteOrbit.js
import * as satellite from "satellite.js";
import * as THREE from "three";

const EARTH_RADIUS_KM = 6371;
const GLOBE_RADIUS = 100; // Default ThreeGlobe Earth sphere radius
const ORBIT_SAMPLES = 180;

let activeOrbitLines = [];

/**
 * Converts ECI Cartesian coordinates directly to ThreeGlobe local 3D coordinates
 * using a single fixed GMST snapshot. This completely bypasses Lat/Lng pole jumps.
 */
function eciToGlobeVector(positionEci, gmst) {
  const scale = GLOBE_RADIUS / EARTH_RADIUS_KM;

  const cosGmst = Math.cos(gmst);
  const sinGmst = Math.sin(gmst);

  // Rotate ECI around Earth's spin axis by GMST to align with Earth-fixed frame
  const xEcef = positionEci.x * cosGmst + positionEci.y * sinGmst;
  const yEcef = -positionEci.x * sinGmst + positionEci.y * cosGmst;
  const zEcef = positionEci.z;

  // ThreeGlobe 3D axis mapping:
  // Y-axis = North Pole (+Z_ecef)
  // Z-axis = Prime Meridian (+X_ecef)
  // X-axis = 90 deg East (+Y_ecef)
  return new THREE.Vector3(yEcef * scale, zEcef * scale, xEcef * scale);
}

function computeOrbitPoints(globe, satrec, refDate) {
  if (!satrec || !satrec.no || satrec.no <= 0) return [];

  // Calculate orbital period in milliseconds (satrec.no is in rad/min)
  const periodMinutes = (2 * Math.PI) / satrec.no;
  const periodMs = periodMinutes * 60 * 1000;

  // Take a single fixed GMST snapshot at refDate
  const gmst = satellite.gstime(refDate);

  const points = [];

  for (let i = 0; i < ORBIT_SAMPLES; i++) {
    const sampleDate = new Date(
      refDate.getTime() + (i / ORBIT_SAMPLES) * periodMs,
    );

    const positionAndVelocity = satellite.propagate(satrec, sampleDate);
    const pos = positionAndVelocity?.position;

    // Filter out valid numeric Cartesian ECI positions
    if (pos && typeof pos.x === "number" && !isNaN(pos.x)) {
      points.push(eciToGlobeVector(pos, gmst));
    }
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

  const existingIndex = activeOrbitLines.findIndex(
    (line) => line.userData?.name === satData.name,
  );

  // Toggle off if already active
  if (existingIndex !== -1) {
    const line = activeOrbitLines[existingIndex];
    globe.remove(line);
    line.geometry.dispose();
    line.material.dispose();
    activeOrbitLines.splice(existingIndex, 1);
    return false;
  }

  const points = computeOrbitPoints(globe, satData.satrec, refDate);
  if (points.length < 3) return false;

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
  });

  // LineLoop forms a smooth, closed 3D ellipse in space
  const orbitLine = new THREE.LineLoop(geometry, material);
  orbitLine.userData = { satData, name: satData.name };

  globe.add(orbitLine);
  activeOrbitLines.push(orbitLine);
  return true;
}

/**
 * Updates active orbit positions dynamically as simulation time progresses.
 */
export function updateActiveOrbitLines(globe, currentDate) {
  if (activeOrbitLines.length === 0) return;

  activeOrbitLines.forEach((line) => {
    const satData = line.userData?.satData;
    if (!satData?.satrec) return;

    const points = computeOrbitPoints(globe, satData.satrec, currentDate);
    if (points.length > 2) {
      line.geometry.setFromPoints(points);
      line.geometry.computeBoundingSphere();
    }
  });
}
