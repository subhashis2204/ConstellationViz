import * as THREE from "three";
import ThreeGlobe from "three-globe";

export function rotation(globe, setDragging, getDragging, getFocusState) {
  let mouse = { x: 0, y: 0 };

  const axisY = new THREE.Vector3(0, 1, 0);
  const axisX = new THREE.Vector3(1, 0, 0);

  const qx = new THREE.Quaternion();
  const qy = new THREE.Quaternion();

  const canvas = document.querySelector("#Canvas");
  canvas.addEventListener("mousedown", (event) => {
    let isFocusing = getFocusState();
    // If we are currently focusing/snapping to a pad, do not let user drag disrupt it
    if (isFocusing) return;
    setDragging(true);
    mouse.x = event.offsetX;
    mouse.y = event.offsetY;
  });

  canvas.addEventListener("mousemove", (event) => {
    let isDragging = getDragging();
    let isFocusing = getFocusState();
    if (!isDragging || isFocusing) return;

    const dx = event.offsetX - mouse.x;
    const dy = event.offsetY - mouse.y;

    const sensitivity = 0.003; // Slightly lowered for cleaner control

    // Track vectors relative to the world frame for intuitive dragging
    qx.setFromAxisAngle(axisX, dy * sensitivity);
    qy.setFromAxisAngle(axisY, dx * sensitivity);

    // Premultiplying creates an intuitive world-space manipulation mapping
    globe.quaternion.premultiply(qx);
    globe.quaternion.premultiply(qy);

    mouse.x = event.offsetX;
    mouse.y = event.offsetY;
  });

  window.addEventListener("mouseup", () => {
    setDragging(false);
  });
}
