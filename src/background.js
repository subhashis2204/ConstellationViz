import * as THREE from "three";

export function createStarfield(scene) {
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 150;
  const starPositions = new Float32Array(starsCount * 3);
  const universeRadius = 1500;

  for (let i = 0; i < starsCount; i++) {
    const u = Math.random();
    const v = Math.random();

    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);

    const x = universeRadius * Math.sin(phi) * Math.cos(theta);
    const y = universeRadius * Math.sin(phi) * Math.sin(theta);
    const z = universeRadius * Math.cos(phi);

    const stride = i * 3;
    starPositions[stride] = x;
    starPositions[stride + 1] = y;
    starPositions[stride + 2] = z;
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(starPositions, 3),
  );

  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: Math.random() * 2 + 1.2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });

  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);

  return starField;
}
