import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function FinalCTA3DScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (e) {
      return;
    }

    const ambientLight = new THREE.AmbientLight(0x4338ca, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x38bdf8, 3, 20);
    pointLight1.position.set(4, 3, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 3, 20);
    pointLight2.position.set(-4, -3, 5);
    scene.add(pointLight2);

    // Central 3D Core
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const icosaGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const icosaMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x312e81,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const icosaMesh = new THREE.Mesh(icosaGeo, icosaMat);
    coreGroup.add(icosaMesh);

    const nucleusGeo = new THREE.SphereGeometry(0.7, 24, 24);
    const nucleusMat = new THREE.MeshBasicMaterial({ color: 0x4f46e5 });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    coreGroup.add(nucleus);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.02, 16, 60), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 }));
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.015, 16, 60), new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4 }));
    ring2.rotation.y = Math.PI / 4;
    coreGroup.add(ring2);

    // Star/knowledge particles
    const particleCount = 100;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 12;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.06, color: 0x818cf8, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Mouse parallax
    let targetX = 0;
    let targetY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.5;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Visibility Observer
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(container);

    let frameId;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      coreGroup.rotation.y = elapsed * 0.25;
      coreGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.1;
      ring1.rotation.z = elapsed * 0.3;
      ring2.rotation.z = -elapsed * 0.2;

      coreGroup.position.x += (targetX - coreGroup.position.x) * 0.05;
      coreGroup.position.y += (-targetY - coreGroup.position.y) * 0.05;

      // Pulse nucleus
      const sc = 1 + Math.sin(elapsed * 2) * 0.05;
      nucleus.scale.set(sc, sc, sc);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      cancelAnimationFrame(frameId);
      if (renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[260px] sm:h-[300px] flex items-center justify-center">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
