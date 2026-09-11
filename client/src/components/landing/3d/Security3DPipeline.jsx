import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Lock, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

export function Security3DPipeline() {
  const mountRef = useRef(null);
  const [activeStep, setActiveStep] = useState(2); // Default to PolicyEngine

  const steps = [
    { id: 0, label: 'USER', sub: 'SSO & Identity Token', color: 0x38bdf8, hex: '#38bdf8' },
    { id: 1, label: 'AUTHENTICATION', sub: 'Tenant Cryptographic Isolation', color: 0x60a5fa, hex: '#60a5fa' },
    { id: 2, label: 'ACCESS POLICY', sub: 'Pre-RAG PolicyEngine RBAC Gate', color: 0x818cf8, hex: '#818cf8' },
    { id: 3, label: 'AUTHORIZED KNOWLEDGE', sub: 'Pre-Cleared Slices Only', color: 0x34d399, hex: '#34d399' },
    { id: 4, label: 'RAG', sub: 'Context Length & Token Assembly', color: 0xfbbf24, hex: '#fbbf24' },
    { id: 5, label: 'AI AGENT', sub: 'Gemini 3.5 Reasoner', color: 0xc084fc, hex: '#c084fc' },
    { id: 6, label: 'ANSWER', sub: 'Source-Backed Cryptographic Output', color: 0x22d3ee, hex: '#22d3ee' },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 650;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 8.5);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (e) {
      return;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x818cf8, 2.5, 20);
    pointLight.position.set(0, 4, 6);
    scene.add(pointLight);

    // 7 Nodes in a horizontal 3D row with Z-depth curve
    const nodes = [];
    const stepCount = steps.length;
    const totalWidth = 7.0;

    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    for (let i = 0; i < stepCount; i++) {
      const x = (i - (stepCount - 1) / 2) * (totalWidth / (stepCount - 1));
      const z = -Math.abs(i - 3) * 0.35; // Gentle arc in Z

      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Node mesh
      const geo = i === 2 ? new THREE.OctahedronGeometry(0.4) : new THREE.CylinderGeometry(0.32, 0.32, 0.15, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: steps[i].color,
        emissive: steps[i].color,
        emissiveIntensity: 0.4,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 4;
      group.add(mesh);

      // Orbit ring for each node
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.015, 8, 32),
        new THREE.MeshBasicMaterial({ color: steps[i].color, transparent: true, opacity: 0.4 })
      );
      group.add(ring);

      nodesGroup.add(group);
      nodes.push({ group, mesh, ring, origX: x, origZ: z });
    }

    // Pipeline connecting rail
    const curvePoints = nodes.map(n => n.group.position);
    const railCurve = new THREE.CatmullRomCurve3(curvePoints);
    const railGeo = new THREE.BufferGeometry().setFromPoints(railCurve.getPoints(60));
    const rail = new THREE.Line(railGeo, new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.3 }));
    scene.add(rail);

    // Flowing Verification Signal (Travels through pipeline)
    const signalMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    scene.add(signalMesh);

    // Mouse parallax
    let targetX = 0;
    let targetY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.4;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.4;
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

      // Parallax
      camera.position.x += (targetX * 2 - camera.position.x) * 0.05;
      camera.position.y += (1.2 + -targetY * 1.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Signal travel along rail
      const signalProgress = (elapsed * 0.2) % 1.0;
      const pt = railCurve.getPoint(signalProgress);
      signalMesh.position.copy(pt);

      // Node subtle floating & spin
      nodes.forEach((n, idx) => {
        n.mesh.rotation.y = elapsed * 0.5 + idx;
        n.ring.rotation.z = -elapsed * 0.4;
        
        // Highlight active step
        const isCurrent = idx === activeStep;
        const targetScale = isCurrent ? 1.35 : 1.0;
        n.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
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
  }, [activeStep]);

  return (
    <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl bg-[#090f1d] border border-slate-800 p-4 overflow-hidden shadow-2xl mb-8">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Banner */}
      <div className="absolute top-4 inset-x-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300 backdrop-blur-md">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>3D ZERO-LEAKAGE ENFORCEMENT PIPELINE</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          Step {activeStep + 1} of 7: {steps[activeStep].label}
        </span>
      </div>

      {/* Interactive Step Clickers below 3D viewport */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-center gap-1.5 overflow-x-auto pb-1">
        {steps.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setActiveStep(idx)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all whitespace-nowrap ${
              activeStep === idx
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/30'
                : 'bg-slate-900/80 border border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
