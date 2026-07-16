import * as THREE from "three";
import { gsap } from "gsap";

export function setupFocusInteraction(
  renderer,
  camera,
  globe,
  orbitControl,
  markersGroup,
  setFocusState,
  getMotionStatus,
) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener("click", (event) => {
    if (getMotionStatus()) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(markersGroup.children, false);

    if (!intersects.length) return;

    focusMarker(intersects[0].object);
  });

  function focusMarker(marker) {
    setFocusState(true);
    orbitControl.enabled = false; // Prevent user orbit during rotation

    // 1. Get the camera's directional vector relative to the globe's center
    const cameraDirection = camera.position.clone().normalize();

    // 2. CONVERT camera direction from World space into the Globe's LOCAL space
    // This is the crucial step that stops the "repeated-click drifting" bug!
    const inverseGlobeRotation = globe.quaternion.clone().invert();
    const localTargetDir = cameraDirection
      .clone()
      .applyQuaternion(inverseGlobeRotation);

    // 3. Get the marker's static local position (relative to its parent globe)
    const localMarkerDir = marker.position.clone().normalize();

    // 4. Calculate the local quaternion rotation required to line up the marker with the camera
    const localRotationOffset = new THREE.Quaternion().setFromUnitVectors(
      localMarkerDir,
      localTargetDir,
    );

    // 5. Apply this local rotation adjustment to the globe's current orientation
    const startQuaternion = globe.quaternion.clone();
    const targetQuaternion = startQuaternion
      .clone()
      .multiply(localRotationOffset);

    const state = { t: 0 };

    gsap.to(state, {
      t: 1,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        // Linearly slerp the globe rotation to the static target destination
        globe.quaternion.copy(startQuaternion).slerp(targetQuaternion, state.t);
        orbitControl.update();
      },
      onComplete: () => {
        orbitControl.enabled = true; // Hand back mouse control safely
        setFocusState(false);
      },
    });
  }
}
