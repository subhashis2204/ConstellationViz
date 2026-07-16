import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function initScene() {
  const canvas = document.querySelector("#Canvas");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04040c);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000,
  );
  camera.position.set(0, 0, 220);
  scene.add(camera);

  const ambientLight = new THREE.AmbientLight(0xffffff, 2.7);
  scene.add(ambientLight);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const orbitControl = new OrbitControls(camera, canvas);
  orbitControl.enableDamping = true;
  // orbitControl.minPolarAngle = Math.PI / 3;
  // orbitControl.maxPolarAngle = (2 * Math.PI) / 3;
  // orbitControl.autoRotateSpeed = 0.05;
  orbitControl.maxDistance = 400;

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, orbitControl };
}
