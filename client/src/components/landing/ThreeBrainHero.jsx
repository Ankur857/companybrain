import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Database, FileText, Shield, Sparkles, Layers, Lock, Cpu } from 'lucide-react';

export function ThreeBrainHero() {
  const mountRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState(1); // 0: Knowledge, 1: Secure RAG, 2: AI Agent

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 520;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 9.5);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to CSS 3D', e);
      return;
    }

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0x6366f1, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x38bdf8, 3, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 3, 20);
    pointLight2.position.set(-5, -4, 4);
    scene.add(pointLight2);

    // --- CENTRAL COMPANYBRAIN 3D GLASS CORE ---
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // 1. Inner glowing crystalline nucleus
    const innerGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x4f46e5,
      emissive: 0x312e81,
      emissiveIntensity: 0.6,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
      shininess: 90,
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    brainGroup.add(innerCore);

    // 2. Glass Architectural Polyhedron Cage
    const outerGeo = new THREE.IcosahedronGeometry(1.85, 1);
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 1.0,
    });
    const outerCage = new THREE.Mesh(outerGeo, outerMat);
    brainGroup.add(outerCage);

    // 3. Floating points / Synaptic vertices
    const pointsGeo = new THREE.BufferGeometry();
    const posArr = outerGeo.attributes.position.array;
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const pointsMat = new THREE.PointsMaterial({
      size: 0.09,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });
    const vertexPoints = new THREE.Points(pointsGeo, pointsMat);
    brainGroup.add(vertexPoints);

    // 4. Concentric Architectural Gyro Rings
    const ringGeo1 = new THREE.TorusGeometry(2.35, 0.018, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.3 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    brainGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.65, 0.015, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    brainGroup.add(ring2);

    // --- SATELLITE NODES ---
    // Google Drive Node (Upper Left)
    const driveGroup = new THREE.Group();
    driveGroup.position.set(-3.6, 2.1, 0.5);
    scene.add(driveGroup);
    const driveSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6, roughness: 0.2 })
    );
    driveGroup.add(driveSphere);

    // Supabase Node (Lower Left)
    const supaGroup = new THREE.Group();
    supaGroup.position.set(-3.5, -2.1, 0.5);
    scene.add(supaGroup);
    const supaSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669, emissiveIntensity: 0.5, roughness: 0.2 })
    );
    supaGroup.add(supaSphere);

    // --- DATA STREAM PARTICLES (Google Drive & Supabase into CompanyBrain) ---
    const streamParticleCount = 60;
    
    // Drive stream
    const driveStreamGeo = new THREE.BufferGeometry();
    const drivePositions = new Float32Array(streamParticleCount * 3);
    const driveProgress = new Float32Array(streamParticleCount);
    for (let i = 0; i < streamParticleCount; i++) {
      driveProgress[i] = Math.random();
    }
    driveStreamGeo.setAttribute('position', new THREE.BufferAttribute(drivePositions, 3));
    const driveStreamMat = new THREE.PointsMaterial({
      size: 0.075,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });
    const driveStream = new THREE.Points(driveStreamGeo, driveStreamMat);
    scene.add(driveStream);

    // Supabase stream
    const supaStreamGeo = new THREE.BufferGeometry();
    const supaPositions = new Float32Array(streamParticleCount * 3);
    const supaProgress = new Float32Array(streamParticleCount);
    for (let i = 0; i < streamParticleCount; i++) {
      supaProgress[i] = Math.random();
    }
    supaStreamGeo.setAttribute('position', new THREE.BufferAttribute(supaPositions, 3));
    const supaStreamMat = new THREE.PointsMaterial({
      size: 0.075,
      color: 0x34d399,
      transparent: true,
      opacity: 0.85,
    });
    const supaStream = new THREE.Points(supaStreamGeo, supaStreamMat);
    scene.add(supaStream);

    // Bezier curve calculations for streams
    const curveDrive = new THREE.CubicBezierCurve3(
      driveGroup.position,
      new THREE.Vector3(-1.8, 1.4, 0.2),
      new THREE.Vector3(-0.9, 0.6, 0.1),
      brainGroup.position
    );

    const curveSupa = new THREE.CubicBezierCurve3(
      supaGroup.position,
      new THREE.Vector3(-1.8, -1.4, 0.2),
      new THREE.Vector3(-0.9, -0.6, 0.1),
      brainGroup.position
    );

    // Subtle line rails
    const driveLineGeo = new THREE.BufferGeometry().setFromPoints(curveDrive.getPoints(40));
    const driveLine = new THREE.Line(
      driveLineGeo,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22 })
    );
    scene.add(driveLine);

    const supaLineGeo = new THREE.BufferGeometry().setFromPoints(curveSupa.getPoints(40));
    const supaLine = new THREE.Line(
      supaLineGeo,
      new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.22 })
    );
    scene.add(supaLine);

    // --- MOUSE TILT INTERACTION ---
    let targetX = 0;
    let targetY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 0.45;
      targetY = y * 0.45;
    };
    window.addEventListener('mousemove', onMouseMove);

    // --- ANIMATION LOOP ---
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth brain rotation
      brainGroup.rotation.y = elapsed * 0.18;
      brainGroup.rotation.x = Math.sin(elapsed * 0.25) * 0.1;

      ring1.rotation.z = elapsed * 0.22;
      ring2.rotation.z = -elapsed * 0.18;

      // Mouse parallax dampening
      brainGroup.position.x += (targetX - brainGroup.position.x) * 0.05;
      brainGroup.position.y += (-targetY - brainGroup.position.y) * 0.05;

      // Node subtle hovering
      driveGroup.position.y = 2.1 + Math.sin(elapsed * 1.5) * 0.08;
      supaGroup.position.y = -2.1 + Math.cos(elapsed * 1.5) * 0.08;

      // Update Drive stream particles
      const dPos = driveStreamGeo.attributes.position.array;
      for (let i = 0; i < streamParticleCount; i++) {
        driveProgress[i] += 0.008;
        if (driveProgress[i] > 1) driveProgress[i] = 0;
        const pt = curveDrive.getPoint(driveProgress[i]);
        dPos[i * 3] = pt.x;
        dPos[i * 3 + 1] = pt.y;
        dPos[i * 3 + 2] = pt.z;
      }
      driveStreamGeo.attributes.position.needsUpdate = true;

      // Update Supabase stream particles
      const sPos = supaStreamGeo.attributes.position.array;
      for (let i = 0; i < streamParticleCount; i++) {
        supaProgress[i] += 0.008;
        if (supaProgress[i] > 1) supaProgress[i] = 0;
        const pt = curveSupa.getPoint(supaProgress[i]);
        sPos[i * 3] = pt.x;
        sPos[i * 3 + 1] = pt.y;
        sPos[i * 3 + 2] = pt.z;
      }
      supaStreamGeo.attributes.position.needsUpdate = true;

      // Pulse inner core scale
      const scale = 1 + Math.sin(elapsed * 2) * 0.04;
      innerCore.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
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
      cancelAnimationFrame(animationFrameId);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] lg:h-[580px] flex flex-col items-center justify-center">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating HTML Annotation Card: Google Drive */}
      <div className="absolute top-12 left-2 sm:left-4 z-20 pointer-events-none animate-float-slow">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-sky-500/30 backdrop-blur-md shadow-lg shadow-sky-500/5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white tracking-wide">Google Drive</div>
            <div className="text-[10px] text-slate-400 font-mono">Documents & Files</div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping ml-1" />
        </div>
      </div>

      {/* Floating HTML Annotation Card: Supabase */}
      <div className="absolute bottom-28 left-2 sm:left-4 z-20 pointer-events-none animate-float-slow" style={{ animationDelay: '2s' }}>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-500/5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white tracking-wide">Supabase</div>
            <div className="text-[10px] text-slate-400 font-mono">Application Data</div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
        </div>
      </div>

      {/* Central Brand Badge Floating over Core */}
      <div className="absolute top-6 right-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-indigo-500/20 text-[11px] text-indigo-300 font-mono backdrop-blur-md">
          <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Core Neural Architecture</span>
        </div>
      </div>

      {/* THREE SUBTLE ARCHITECTURAL LAYERS BELOW COMPANYBRAIN */}
      <div className="absolute bottom-2 inset-x-4 z-20 max-w-md mx-auto">
        <div className="bg-[#0e1626]/90 border border-slate-700/60 rounded-xl p-2.5 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
            {/* Layer 1: Knowledge */}
            <div
              className={`p-2 rounded-lg border transition-all ${
                activeLayer === 0
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 shadow-sm'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-slate-600'
              }`}
              onClick={() => setActiveLayer(0)}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5 text-slate-300">
                <FileText className="w-3 h-3 text-sky-400" />
                <span className="font-semibold text-[10px] text-white">DATA</span>
              </div>
              <div className="text-[9px] text-slate-400">Company Knowledge</div>
            </div>

            {/* Layer 2: Secure RAG */}
            <div
              className={`p-2 rounded-lg border transition-all relative ${
                activeLayer === 1
                  ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-200 shadow-sm'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-slate-600'
              }`}
              onClick={() => setActiveLayer(1)}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5 text-slate-300">
                <Lock className="w-3 h-3 text-indigo-400" />
                <span className="font-semibold text-[10px] text-indigo-200">SECURITY</span>
              </div>
              <div className="text-[9px] text-indigo-300 font-semibold">SECURE RAG</div>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1 rounded bg-indigo-500 text-[8px] text-white font-bold">
                POLICY
              </div>
            </div>

            {/* Layer 3: AI Agent */}
            <div
              className={`p-2 rounded-lg border transition-all ${
                activeLayer === 2
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 shadow-sm'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-slate-600'
              }`}
              onClick={() => setActiveLayer(2)}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5 text-slate-300">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="font-semibold text-[10px] text-white">INTELLIGENCE</span>
              </div>
              <div className="text-[9px] text-slate-400">AI AGENT</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 px-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Real-time synchronization
            </span>
            <span className="font-mono text-indigo-400">Company Data → Security → AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
