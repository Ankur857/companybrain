import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Problem3DScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (e) {
      return;
    }

    // Ambient & warning accent lights
    const ambientLight = new THREE.AmbientLight(0x334155, 1.2);
    scene.add(ambientLight);

    const warnLight1 = new THREE.PointLight(0xf43f5e, 2.5, 15);
    warnLight1.position.set(-4, 3, 2);
    scene.add(warnLight1);

    const warnLight2 = new THREE.PointLight(0xf59e0b, 2.0, 15);
    warnLight2.position.set(4, -2, 2);
    scene.add(warnLight2);

    // Group for scattered floating document planes & database cards
    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);

    const items = [];
    const itemCount = 14;

    // Plane geometry representing documents/data chunks
    const planeGeo = new THREE.PlaneGeometry(1.3, 0.9);
    const boxGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);

    for (let i = 0; i < itemCount; i++) {
      const isBox = i % 3 === 0;
      const geo = isBox ? boxGeo : planeGeo;
      
      const mat = new THREE.MeshStandardMaterial({
        color: isBox ? 0x1e293b : 0x0f172a,
        emissive: isBox ? 0x38bdf8 : 0xf43f5e,
        emissiveIntensity: 0.25,
        wireframe: i % 2 === 0,
        transparent: true,
        opacity: 0.75,
        roughness: 0.3,
      });

      const mesh = new THREE.Mesh(geo, mat);

      // Distribute in a spherical/cloud cluster
      const angle = (i / itemCount) * Math.PI * 2;
      const radius = 2.4 + Math.random() * 1.8;
      const zOffset = (Math.random() - 0.5) * 3.5;

      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.75,
        zOffset
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Random rotational velocity and drift parameters
      const vel = {
        rx: (Math.random() - 0.5) * 0.008,
        ry: (Math.random() - 0.5) * 0.008,
        rz: (Math.random() - 0.5) * 0.008,
        baseY: mesh.position.y,
        phase: Math.random() * Math.PI * 2,
      };

      objectsGroup.add(mesh);
      items.push({ mesh, vel });
    }

    // Broken connection lines (showing disconnected silos)
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xf43f5e,
      dashSize: 0.2,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.3,
    });

    for (let i = 0; i < 6; i++) {
      const p1 = items[i].mesh.position;
      const p2 = items[(i + 3) % itemCount].mesh.position;
      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      scene.add(line);
    }

    // Mouse parallax
    let targetX = 0;
    let targetY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.6;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.6;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Visibility Observer to pause when scrolled out of view
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    let frameId;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Parallax easing
      objectsGroup.rotation.y += (targetX - objectsGroup.rotation.y) * 0.04;
      objectsGroup.rotation.x += (-targetY - objectsGroup.rotation.x) * 0.04;

      // Drift and tumble
      items.forEach(({ mesh, vel }) => {
        mesh.rotation.x += vel.rx;
        mesh.rotation.y += vel.ry;
        mesh.rotation.z += vel.rz;
        mesh.position.y = vel.baseY + Math.sin(elapsed * 1.2 + vel.phase) * 0.15;
      });

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
    <div className="relative w-full h-[440px] sm:h-[480px]">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* 3D Visual Floating Indicators */}
      <div className="absolute top-4 left-6 z-20 pointer-events-none">
        <span className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 font-mono text-[10px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          Scattered Documents (Unindexed)
        </span>
      </div>

      <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Disconnected Database Silos
        </span>
      </div>
    </div>
  );
}
