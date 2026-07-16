import * as THREE from "three";
import { gsap } from "gsap";

export function controlUI(
  orbitControl,
  camera,
  getMotionStatus,
  updateMotionState,
  rotationSpeedMultiplier,
) {
  const stopMotionButton = document.querySelector("#stop-motion");
  const buttonText = document.querySelector("#buttonText");
  const buttonIcon = document.querySelector("#buttonIcon");
  const resetButton = document.querySelector("#reset");
  const sliderInput = document.querySelector(".slider input");
  const sliderText = document.querySelector(".sim-speed");
  const sliderComponent = document.querySelector(".slider");

  const playIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" /></svg>`;
  const pauseIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Zm7.5 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" /></svg>`;

  stopMotionButton.addEventListener("click", () => {
    // console.log("first line", orbitControl.autoRotate);

    // const isMotionActive = orbitControl.autoRotate;
    // orbitControl.autoRotate = !orbitControl.autoRotate;
    // console.log("second line", orbitControl.autoRotate);

    if (!getMotionStatus()) {
      buttonText.textContent = "Pause Motion";
      buttonIcon.innerHTML = pauseIconHtml;
      updateMotionState(true);

      sliderComponent.classList.remove("hidden");
    } else {
      buttonText.textContent = "Start Motion";
      buttonIcon.innerHTML = playIconHtml;
      updateMotionState(false);

      sliderComponent.classList.add("hidden");
    }
  });

  resetButton.addEventListener("click", () => {
    const defaultZoomDistance = 220;
    const centreOfWorld = new THREE.Vector3(0, 0, 0);
    const distance = camera.position.distanceTo(centreOfWorld);
    const theta = Math.atan2(camera.position.x, camera.position.z);
    const newX = defaultZoomDistance * Math.sin(theta);
    const newZ = defaultZoomDistance * Math.cos(theta);

    gsap.to(orbitControl.target, {
      x: 0,
      y: 0,
      z: 0,
      ease: "power2.out",
      duration: 1,
    });

    gsap.to(camera.position, {
      x: newX,
      y: 0,
      z: newZ,
      duration: 1,
      ease: "power2.out",
      onUpdate: () => orbitControl.update(),
    });
  });

  sliderInput.addEventListener("input", (event) => {
    sliderText.innerHTML = `x ${event.target.value}`;
    rotationSpeedMultiplier(event.target.value);
  });
}
