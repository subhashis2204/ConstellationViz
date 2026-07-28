// satelliteHover.js
import * as THREE from "three";
import * as satellite from "satellite.js";
import prettyMilliseconds from "pretty-ms";

const EARTH_RADIUS_KM = 6378.137;

export function getTelemetryData(satrec, date = new Date()) {
  const positionAndVelocity = satellite.propagate(satrec, date);
  const positionEci = positionAndVelocity.position;
  const velocityEci = positionAndVelocity.velocity;

  if (!positionEci || !velocityEci) return null;

  // 1. Geodetic Coordinates (Lat, Lng, Height)
  const gmst = satellite.gstime(date);
  const positionGd = satellite.eciToGeodetic(positionEci, gmst);

  // 2. Calculated Metrics
  const speedKmS = Math.sqrt(
    velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2,
  );

  const periodMinutes = (2 * Math.PI) / satrec.no;
  const periodMs = Math.round(periodMinutes * 60 * 1000); // Converted to milliseconds

  const inclinationDeg = satrec.inclo * (180 / Math.PI);

  return {
    latitude: satellite.degreesLat(positionGd.latitude).toFixed(2),
    longitude: satellite.degreesLong(positionGd.longitude).toFixed(2),
    altitudeKm: positionGd.height.toFixed(1),
    apogeeKm: (satrec.alta * EARTH_RADIUS_KM).toFixed(1),
    perigeeKm: (satrec.altp * EARTH_RADIUS_KM).toFixed(1),
    speedKmS: speedKmS.toFixed(2),
    speedKmH: Math.round(speedKmS * 3600).toLocaleString(),
    periodMinutes: periodMinutes.toFixed(1),
    periodSec: prettyMilliseconds(periodMs, { secondsDecimalDigits: 0 }),
    inclinationDeg: inclinationDeg.toFixed(1),
    eccentricity: satrec.ecco.toFixed(5),
  };
}

function updateTooltip(sat) {
  const tooltipAlt = document.getElementById("tooltip-alt");
  const tooltipSpeed = document.getElementById("tooltip-speed");
  const tooltipInc = document.getElementById("tooltip-inc");
  const tooltipPeriod = document.getElementById("tooltip-period");

  tooltipAlt.textContent = `${sat.altitudeKm} km`;
  tooltipSpeed.textContent = `${sat.speedKmS} km/s`;
  tooltipInc.textContent = `${sat.inclinationDeg}°`;
  tooltipPeriod.textContent = `${sat.periodSec}`;
}

export function setupSatelliteHover(globe, camera, renderer) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const tooltip = document.getElementById("sat-tooltip");
  const tooltipName = document.getElementById("tooltip-name");

  let hoveredMesh = null;
  const originalColor = new THREE.Color();

  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (tooltip) {
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

          const satdetails = getTelemetryData(mesh.userData.satrec);
          updateTooltip(satdetails);
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
