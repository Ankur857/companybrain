import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FileText, Database, Shield, Zap, Activity } from 'lucide-react';

export function Integrations3DScene() {
  const mountRef = useRef(null);
  const [lastBurst, setLastBurst] = useState('both');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const lightSky = new THREE.PointLight(0x38bdf8, 3, 20);
    lightSky.position.set(-4, 3, 4);
    scene.add(lightSky);

    const lightGreen = new THREE.PointLight(0x34d399, 3, 20);
    lightGreen.position.set(4, -3, 4);
    scene.add(lightGreen);

    // Left Node: Google Drive 3D Prism
    const driveGroup = new THREE.Group();
    driveGroup.position.set(-2.8, 0, 0);
    scene.add(driveGroup);

    const driveGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.25, 6);
    const driveMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, roughness: 0.2 });
    const driveMesh = new THREE.Mesh(driveGeo, driveMat);
    driveMesh.rotation.x = Math.PI / 4;
    driveGroup.add(driveMesh);

    // Right Node: Supabase 3D Cylindrical Data Stack
    const supaGroup = new THREE.Group();
    supaGroup.position.set(2.8, 0, 0);
    scene.add(supaGroup);

    const supa1 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 24), new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669 }));
    const supa2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 24), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x047857 }));
    supa1.position.y = 0.25;
    supa2.position.y = -0.25;
    supaGroup.add(supa1, supa2);

    // Central Node: CompanyBrain Core
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);
    const coreMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9, 1),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x312e81, wireframe: true })
    );
    coreGroup.add(coreMesh);

    // Conduit Lines
    const curveL = new THREE.QuadraticBezierCurve3(driveGroup.position, new THREE.Vector3(-1.4, 0.8, 0), coreGroup.position);
    const lineLGeo = new THREE.BufferGeometry().setFromPoints(curveL.getPoints(30));
    const lineL = new THREE.Line(lineLGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }));
    scene.add(lineL);

    const curveR = new THREE.QuadraticBezierCurve3(supaGroup.position, new THREE.Vector3(1.4, -0.8, 0), coreGroup.position);
    const lineRGeo = new THREE.BufferGeometry().setFromPoints(curveR.getPoints(30));
    const lineR = new THREE.Line(lineRGeo, new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.35 }));
    scene.add(lineR);

    // Flowing Packets along conduits
    const packetCount = 30;
    const packetsLGeo = new THREE.BufferGeometry();
    const packetsLPos = new Float32Array(packetCount * 3);
    const progressL = new Float32Array(packetCount);
    for (let i = 0; i < packetCount; i++) progressL[i] = Math.random();
    packetsLGeo.setAttribute('position', new THREE.BufferAttribute(packetsLPos, 3));
    const packetsL = new THREE.Points(packetsLGeo, new THREE.PointsMaterial({ size: 0.1, color: 0x38bdf8 }));
    scene.add(packetsL);

    const packetsRGeo = new THREE.BufferGeometry();
    const packetsRPos = new Float32Array(packetCount * 3);
    const progressR = new Float32Array(packetCount);
    for (let i = 0; i < packetCount; i++) progressR[i] = Math.random();
    packetsRGeo.setAttribute('position', new THREE.BufferAttribute(packetsRPos, 3));
    const packetsR = new THREE.Points(packetsRGeo, new THREE.PointsMaterial({ size: 0.1, color: 0x34d399 }));
    scene.add(packetsR);

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

      // Rotations
      driveGroup.rotation.y = elapsed * 0.4;
      supaGroup.rotation.y = -elapsed * 0.4;
      coreGroup.rotation.y = elapsed * 0.3;
      coreGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.1;

      // Parallax
      scene.rotation.y += (targetX - scene.rotation.y) * 0.05;
      scene.rotation.x += (-targetY - scene.rotation.x) * 0.05;

      // Packets Left
      const pL = packetsLGeo.attributes.position.array;
      for (let i = 0; i < packetCount; i++) {
        progressL[i] += 0.01;
        if (progressL[i] > 1) progressL[i] = 0;
        const pt = curveL.getPoint(progressL[i]);
        pL[i * 3] = pt.x;
        pL[i * 3 + 1] = pt.y;
        pL[i * 3 + 2] = pt.z;
      }
      packetsLGeo.attributes.position.needsUpdate = true;

      // Packets Right
      const pR = packetsRGeo.attributes.position.array;
      for (let i = 0; i < packetCount; i++) {
        progressR[i] += 0.01;
        if (progressR[i] > 1) progressR[i] = 0;
        const pt = curveR.getPoint(progressR[i]);
        pR[i * 3] = pt.x;
        pR[i * 3 + 1] = pt.y;
        pR[i * 3 + 2] = pt.z;
      }
      packetsRGeo.attributes.position.needsUpdate = true;

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
    <div className="relative w-full h-[380px] sm:h-[420px] rounded-2xl bg-[#0b1220] border border-slate-800 p-4 overflow-hidden shadow-2xl mb-8">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Left Annotation */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-sky-500/40 text-sky-300 font-mono text-xs backdrop-blur-md">
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Google Drive · Continuous Ingestion</span>
        </div>
      </div>

      {/* Center Annotation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-xs backdrop-blur-md">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Pre-RAG Ingestion Boundary</span>
        </div>
      </div>

      {/* Right Annotation */}
      <div className="absolute top-6 right-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs backdrop-blur-md">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Supabase · Row-Level CDC Stream</span>
        </div>
      </div>
    </div>
  );
}
