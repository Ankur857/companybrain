import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Sparkles, Database, FileText, ArrowRight } from 'lucide-react';

export function Solution3DConvergence() {
  const mountRef = useRef(null);
  const [stage, setStage] = useState('converge'); // 'scatter' | 'converge' | 'rag'

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 9);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (e) {
      return;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0x4338ca, 1.0);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 3, 20);
    pointLight.position.set(3, 4, 5);
    scene.add(pointLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 2.5, 20);
    purpleLight.position.set(-3, -3, 4);
    scene.add(purpleLight);

    // Central CompanyBrain Core
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x4f46e5,
      emissive: 0x312e81,
      emissiveIntensity: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Inner Glowing Core Sphere
    const innerGeo = new THREE.SphereGeometry(0.8, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // RAG Security Ring around core
    const ragRingGeo = new THREE.TorusGeometry(2.1, 0.03, 16, 80);
    const ragRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    const ragRing = new THREE.Mesh(ragRingGeo, ragRingMat);
    ragRing.rotation.x = Math.PI / 2.5;
    coreGroup.add(ragRing);

    // AI Agent Crown Ring
    const aiRingGeo = new THREE.TorusGeometry(2.6, 0.02, 16, 80);
    const aiRingMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4 });
    const aiRing = new THREE.Mesh(aiRingGeo, aiRingMat);
    aiRing.rotation.y = Math.PI / 3;
    coreGroup.add(aiRing);

    // Converging Particle System (100 particles representing data chunks)
    const particleCount = 90;
    const particlesGeo = new THREE.BufferGeometry();
    const currentPositions = new Float32Array(particleCount * 3);
    const sourcePositions = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Scattered origin positions
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.5 + Math.random() * 2.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.7;
      const z = (Math.random() - 0.5) * 3;

      sourcePositions[i * 3] = x;
      sourcePositions[i * 3 + 1] = y;
      sourcePositions[i * 3 + 2] = z;

      currentPositions[i * 3] = x;
      currentPositions[i * 3 + 1] = y;
      currentPositions[i * 3 + 2] = z;

      // Target core radius
      const targetAngle = Math.random() * Math.PI * 2;
      const targetRad = 0.9 + Math.random() * 0.4;
      targetPositions[i * 3] = Math.cos(targetAngle) * targetRad;
      targetPositions[i * 3 + 1] = Math.sin(targetAngle) * targetRad;
      targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;

      speeds[i] = 0.006 + Math.random() * 0.008;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.09,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

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

      // Rotate central core
      coreGroup.rotation.y = elapsed * 0.25;
      coreGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.12;

      ragRing.rotation.z = elapsed * 0.35;
      aiRing.rotation.z = -elapsed * 0.25;

      // Parallax
      coreGroup.position.x += (targetX - coreGroup.position.x) * 0.05;
      coreGroup.position.y += (-targetY - coreGroup.position.y) * 0.05;

      // Animate convergence of particles
      const pos = particlesGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const sp = speeds[i];

        // Lerp towards target
        pos[idx] += (targetPositions[idx] - pos[idx]) * sp;
        pos[idx + 1] += (targetPositions[idx + 1] - pos[idx + 1]) * sp;
        pos[idx + 2] += (targetPositions[idx + 2] - pos[idx + 2]) * sp;

        // If particle reached core, respawn back at source to create continuous loop
        const dx = pos[idx] - targetPositions[idx];
        const dy = pos[idx + 1] - targetPositions[idx + 1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.15) {
          pos[idx] = sourcePositions[idx];
          pos[idx + 1] = sourcePositions[idx + 1];
          pos[idx + 2] = sourcePositions[idx + 2];
        }
      }
      particlesGeo.attributes.position.needsUpdate = true;

      // Pulse inner core
      const pulse = 1 + Math.sin(elapsed * 2.5) * 0.06;
      innerMesh.scale.set(pulse, pulse, pulse);

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
    <div className="relative w-full h-[460px] sm:h-[500px]">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Flow Labels */}
      <div className="absolute top-4 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-sky-500/30 text-sky-300 font-mono text-xs backdrop-blur-md">
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Files &amp; Tables Converging</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-purple-500/30 text-purple-300 font-mono text-xs backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Secure RAG → AI Agent Grounding</span>
        </div>
      </div>
    </div>
  );
}
