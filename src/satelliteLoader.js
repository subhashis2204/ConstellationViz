// satelliteLoader.js
import * as satellite from "satellite.js";
import * as THREE from "three";
import axios from "axios";

export async function liveSatelliteDataset(satelliteLabel) {
  if (satelliteLabel == "none") return [];

  const expiry_time = 1 * 24 * 60 * 60 * 1000;
  const currentDate = new Date();
  const futureDate = currentDate.getTime() + expiry_time;

  const storage_key = `tle_data_${satelliteLabel}`;
  const CELESTRAK_URLs = `https://celestrak.org/NORAD/elements/gp.php?FORMAT=tle&GROUP=${satelliteLabel}`;

  const item = localStorage.getItem(storage_key);

  let data = null;
  if (item && JSON.parse(item).expiry > currentDate.getTime()) {
    data = JSON.parse(item).value;
    return parseTLEData(data);
  }

  const response = await axios.get(CELESTRAK_URLs);
  // console.log(response.data);

  data = { value: response.data, expiry: futureDate };
  localStorage.setItem(storage_key, JSON.stringify(data));

  let parsedData = parseTLEData(response.data);
  return parsedData;
}
/**
 * Parses raw TLE text data into satellite objects.
 */
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
      const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

      satellitesData.push({
        name: name,
        satrec: satrec,
        lat: 0,
        lng: 0,
        alt: 0.15, // Orbital height above Earth surface
        radius: 0.2,
      });
    } catch (error) {
      console.warn(`Skipping invalid TLE dataset for: ${name}`, error);
    }
  }

  return satellitesData;
}

/**
 * Configures ThreeGlobe custom layer for floating satellite meshes.
 */
export function plotSatellites(globe, satellites) {
  const satGeometry = new THREE.SphereGeometry(0.6, 12, 12);

  globe
    .customLayerData(satellites)
    .customThreeObject((data) => {
      const color = data.color || 0x00ffff;
      const satMaterial = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(satGeometry, satMaterial);
      // Attach metadata to mesh for raycaster detection
      mesh.userData = data;
      return mesh;
    })
    .customThreeObjectUpdate((mesh, data) => {
      const coords = globe.getCoords(data.lat, data.lng, data.alt);
      mesh.position.set(coords.x, coords.y, coords.z);
    });
}

// Track virtual time
let virtualTime = new Date().getTime();

export function getSimulationDate() {
  return new Date(virtualTime);
}

/**
 * Propagates satellite trajectories and updates custom layer mesh positions.
 */
export function updateSatellites(
  globe,
  speedFactor = 1,
  deltaInSeconds = 0.016,
) {
  // FIX 1: Read from customLayerData instead of pointsData
  const satellites = globe.customLayerData();
  if (!satellites || satellites.length === 0) return;

  // Advance virtual time
  virtualTime += deltaInSeconds * speedFactor * 10000;

  const currentDate = new Date(virtualTime);
  const gmst = satellite.gstime(currentDate);

  for (let i = 0; i < satellites.length; i++) {
    const d = satellites[i];
    if (!d.satrec) continue;

    const positionAndVelocity = satellite.propagate(d.satrec, currentDate);
    const positionEci = positionAndVelocity?.position;

    if (positionEci) {
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      d.lat = satellite.degreesLat(positionGd.latitude);
      d.lng = satellite.degreesLong(positionGd.longitude);
      // Normalized altitude relative to Earth radius (~6371 km)
      d.alt = Math.max(0.02, positionGd.height / 6371);
    }
  }

  // FIX 2: Trigger customLayerData update so ThreeGlobe recalculates 3D positions
  globe.customLayerData(satellites);
}
