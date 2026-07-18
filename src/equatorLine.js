import * as THREE from "three";

export function equatorLine() {
  let points = [];
  const radius = 101;
  for (let i = 0; i < 360; i++) {
    const theta = THREE.MathUtils.degToRad(i);
    const point = new THREE.Vector3(
      radius * Math.sin(theta),
      0,
      radius * Math.cos(theta),
    );

    points.push(point);
  }

  console.log(points);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xff0000,
  });
  const equator = new THREE.LineLoop(geometry, material);

  return equator;
}
