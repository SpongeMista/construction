import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('ascii-container');
  if (!container) {
    console.error('Container not found');
    return;
  }

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 100);
  camera.position.z = 8;
  camera.position.y = 0;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(container.offsetWidth, container.offsetHeight);

  // ASCII Effect with higher resolution
  const effect = new AsciiEffect(renderer, ' .:-+*=%@#', { 
    invert: true,
    resolution: 0.10,
    scale: 1,
    color: true
  });
  effect.setSize(container.offsetWidth, container.offsetHeight);
  effect.domElement.style.color = 'white';
  effect.domElement.style.backgroundColor = 'black';
  effect.domElement.style.fontFamily = 'monospace';
  effect.domElement.style.fontSize = '8px';
  effect.domElement.style.lineHeight = '8px';
  effect.domElement.style.letterSpacing = '0px';
  container.appendChild(effect.domElement);

  // Lighting (reduced intensity)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  let mesh;
  let group;
  let floatRange = 0.3; // Maximum up/down movement

  // Drag state
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let dragRotationY = 0;
  let dragRotationX = 0;
  let dragStartRotationY = 0;
  let dragStartRotationX = 0;
  let lerpRotationY = 0;
  let lerpRotationX = 0;
  let lerpActive = false;

  const fontLoader = new FontLoader();
  fontLoader.load(
    'https://unpkg.com/three@0.150.1/examples/fonts/helvetiker_bold.typeface.json',
    (font) => {
      const textGeo = new TextGeometry('B', {
        font: font,
        size: 3.5,
        height: 0.8,
        curveSegments: 16,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.08,
        bevelOffset: 0,
        bevelSegments: 8
      });
      textGeo.computeBoundingBox();
      const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
      mesh = new THREE.Mesh(textGeo, material);
      mesh.geometry.center(); // Center geometry for correct rotation and centering
      group = new THREE.Group();
      group.add(mesh);
      group.position.x = 0;
      group.position.y = 0;
      scene.add(group);
      addDragListeners();
      animate();
    },
    undefined,
    (error) => {
      console.error('Font loading failed, using fallback geometry:', error);
      createFallbackGeometry();
    }
  );

  function createFallbackGeometry() {
    group = new THREE.Group();
    const verticalGeo = new THREE.BoxGeometry(0.4, 5, 0.4);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const vertical = new THREE.Mesh(verticalGeo, material);
    group.add(vertical);
    const topCurveGeo = new THREE.TorusGeometry(1.2, 0.4, 12, 24, Math.PI);
    const topCurve = new THREE.Mesh(topCurveGeo, material);
    topCurve.position.set(1.2, 1.8, 0);
    topCurve.rotation.z = Math.PI / 2;
    group.add(topCurve);
    const bottomCurveGeo = new THREE.TorusGeometry(1.2, 0.4, 12, 24, Math.PI);
    const bottomCurve = new THREE.Mesh(bottomCurveGeo, material);
    bottomCurve.position.set(1.2, -1.8, 0);
    bottomCurve.rotation.z = Math.PI / 2;
    group.add(bottomCurve);
    group.position.x = 0;
    group.position.y = 0;
    scene.add(group);
    addDragListeners();
    animate();
  }

  function addDragListeners() {
    // Remove all custom cursor styling
    effect.domElement.style.cursor = '';
    effect.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      // Start drag from the current group rotation, not the last drag state
      dragStartRotationY = group.rotation.y;
      dragStartRotationX = group.rotation.x;
      dragRotationY = group.rotation.y;
      dragRotationX = group.rotation.x;
      lerpActive = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;
      dragRotationY = dragStartRotationY + deltaX * 0.01;
      dragRotationX = dragStartRotationX + deltaY * 0.01;
    });
    window.addEventListener('mouseup', () => {
      if (isDragging) {
        lerpActive = true;
        lerpRotationY = dragRotationY;
        lerpRotationX = dragRotationX;
      }
      isDragging = false;
    });
    // Touch support
    effect.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        // Start drag from the current group rotation, not the last drag state
        dragStartRotationY = group.rotation.y;
        dragStartRotationX = group.rotation.x;
        dragRotationY = group.rotation.y;
        dragRotationX = group.rotation.x;
        lerpActive = false;
      }
    });
    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - lastMouseX;
      const deltaY = e.touches[0].clientY - lastMouseY;
      dragRotationY = dragStartRotationY + deltaX * 0.01;
      dragRotationX = dragStartRotationX + deltaY * 0.01;
    });
    window.addEventListener('touchend', () => {
      if (isDragging) {
        lerpActive = true;
        lerpRotationY = dragRotationY;
        lerpRotationX = dragRotationX;
      }
      isDragging = false;
    });
  }

  function animate() {
    if (!group) return;
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001;
    // Animation: floating and rotating
    let floatY = Math.sin(time * 1.2) * floatRange;
    group.position.x = -0.25; // Nudge model slightly to the left
    group.position.y = floatY;
    // If dragging, use drag rotation; otherwise, use animated rotation
    if (isDragging) {
      group.rotation.y = dragRotationY;
      group.rotation.x = dragRotationX;
    } else if (lerpActive) {
      // Smoothly transition back to animation
      const targetY = Math.sin(time * 0.7) * 0.4;
      const targetX = Math.cos(time * 0.5) * 0.1;
      lerpRotationY += (targetY - lerpRotationY) * 0.08;
      lerpRotationX += (targetX - lerpRotationX) * 0.08;
      group.rotation.y = lerpRotationY;
      group.rotation.x = lerpRotationX;
      if (Math.abs(lerpRotationY - targetY) < 0.001 && Math.abs(lerpRotationX - targetX) < 0.001) {
        lerpActive = false;
      }
    } else {
      group.rotation.y = Math.sin(time * 0.7) * 0.4;
      group.rotation.x = Math.cos(time * 0.5) * 0.1;
      dragRotationY = group.rotation.y;
      dragRotationX = group.rotation.x;
    }
    effect.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    effect.setSize(width, height);
    // No need to recenter group, as geometry is always centered
  });
}); 