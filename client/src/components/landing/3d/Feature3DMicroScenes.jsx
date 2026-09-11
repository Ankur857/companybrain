import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MessageSquare, Cpu, ShieldCheck, Award, ChevronRight } from 'lucide-react';

export function Feature3DMicroScenes() {
  const [activeFeature, setActiveFeature] = useState(0);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const groupsRef = useRef([]);

  const features = [
    {
      id: 0,
      title: 'Ask Anything',
      subtitle: 'Semantic Vector Retrieval',
      desc: 'Get accurate, source-backed answers with clickable citations into PDFs, markdown, and tables.',
      badge: 'Zero Hallucinations',
      icon: MessageSquare,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      id: 1,
      title: 'Project Intelligence',
      subtitle: '3D Architecture Graph',
      desc: 'Understand architecture, services, APIs and dependencies faster with synthesized topological maps.',
      badge: 'Deep Topology',
      icon: Cpu,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      id: 2,
      title: 'Secure Knowledge',
      subtitle: 'Pre-RAG Policy Vault',
      desc: 'Permission-aware access keeps information within the right boundaries before retrieval tokens are generated.',
      badge: 'RBAC Enforced',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 3,
      title: 'Verified Experiences',
      subtitle: 'Institutional Memory Lattice',
      desc: 'Capture, peer-review, and preserve troubleshooting fixes before knowledge walks out the door.',
      badge: 'Peer-Reviewed',
      icon: Award,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

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

    const keyLight = new THREE.PointLight(0x6366f1, 3, 20);
    keyLight.position.set(4, 4, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 2, 20);
    fillLight.position.set(-4, -3, 4);
    scene.add(fillLight);

    // --- 4 DISTINCT 3D FEATURE GROUPS ---
    const group0 = new THREE.Group(); // Vector Space (Ask Anything)
    const group1 = new THREE.Group(); // 3D Architecture Topology (Project Intelligence)
    const group2 = new THREE.Group(); // Security Cryptographic Vault (Secure Knowledge)
    const group3 = new THREE.Group(); // Memory Crystal Lattice (Verified Experiences)

    groupsRef.current = [group0, group1, group2, group3];
    groupsRef.current.forEach((g) => scene.add(g));

    // SCENE 0: Vector Search Space (Central query node with laser rays to citations)
    const queryNodeGeo = new THREE.SphereGeometry(0.5, 24, 24);
    const queryNodeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });
    const queryNode = new THREE.Mesh(queryNodeGeo, queryNodeMat);
    group0.add(queryNode);

    // Floating document chunks with rays
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const rad = 2.0 + (i % 3) * 0.4;
      const x = Math.cos(angle) * rad;
      const y = Math.sin(angle) * rad;
      const z = (Math.sin(i) * 0.8);

      const chunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x818cf8, wireframe: i % 2 === 0 })
      );
      chunk.position.set(x, y, z);
      group0.add(chunk);

      // Laser citation line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
      group0.add(new THREE.Line(lineGeo, lineMat));
    }

    // SCENE 1: Project Intelligence Architecture (Gateway -> Services -> DB)
    const gw = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x312e81 }));
    gw.position.set(0, 1.6, 0);
    group1.add(gw);

    const svc1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    svc1.position.set(-1.4, 0, 0);
    group1.add(svc1);

    const svc2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x818cf8 }));
    svc2.position.set(1.4, 0, 0);
    group1.add(svc2);

    const db = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 24), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46 }));
    db.position.set(0, -1.6, 0);
    group1.add(db);

    // Connecting pipes
    const p1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([gw.position, svc1.position]), new THREE.LineBasicMaterial({ color: 0x818cf8 }));
    const p2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([gw.position, svc2.position]), new THREE.LineBasicMaterial({ color: 0x818cf8 }));
    const p3 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([svc1.position, db.position]), new THREE.LineBasicMaterial({ color: 0x10b981 }));
    const p4 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([svc2.position, db.position]), new THREE.LineBasicMaterial({ color: 0x10b981 }));
    group1.add(p1, p2, p3, p4);

    // SCENE 2: Secure Knowledge Vault (Concentric multi-tenant shield rings)
    const vaultCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), new THREE.MeshStandardMaterial({ color: 0x10b981, wireframe: true }));
    group2.add(vaultCore);

    const shieldRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 16, 60), new THREE.MeshStandardMaterial({ color: 0x34d399 }));
    shieldRing1.rotation.x = Math.PI / 3;
    group2.add(shieldRing1);

    const shieldRing2 = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.04, 16, 60), new THREE.MeshStandardMaterial({ color: 0x059669 }));
    shieldRing2.rotation.y = Math.PI / 4;
    group2.add(shieldRing2);

    // SCENE 3: Verified Experiences (Crystalline institutional memory helix)
    for (let i = 0; i < 14; i++) {
      const t = (i / 14) * Math.PI * 4;
      const hx = Math.cos(t) * 1.5;
      const hz = Math.sin(t) * 1.5;
      const hy = (i - 7) * 0.35;

      const crystal = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.25),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x581c87, emissiveIntensity: 0.5 })
      );
      crystal.position.set(hx, hy, hz);
      group3.add(crystal);
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

      // Manage visibility per active feature
      groupsRef.current.forEach((g, idx) => {
        g.visible = idx === activeFeature;
      });

      // Active group animation & rotation
      const currentGroup = groupsRef.current[activeFeature];
      if (currentGroup) {
        currentGroup.rotation.y = elapsed * 0.3;
        currentGroup.rotation.x = Math.sin(elapsed * 0.25) * 0.12;

        currentGroup.position.x += (targetX - currentGroup.position.x) * 0.05;
        currentGroup.position.y += (-targetY - currentGroup.position.y) * 0.05;
      }

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
  }, [activeFeature]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left: 3D Interactive Micro-Scene Canvas */}
      <div className="lg:col-span-6 bg-[#0c1322] border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl relative min-h-[440px] flex flex-col justify-between overflow-hidden">
        {/* Top Status */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-300">
              3D VISUALIZATION: {features[activeFeature].title.toUpperCase()}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
            {features[activeFeature].badge}
          </span>
        </div>

        {/* WebGL Canvas */}
        <div className="relative flex-1 w-full min-h-[300px] flex items-center justify-center">
          <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
        </div>

        {/* Micro-Scene Subtitle */}
        <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{features[activeFeature].subtitle}</span>
          <span className="text-indigo-400">Drag to rotate 3D view</span>
        </div>
      </div>

      {/* Right: 4 Interactive Feature Selector Cards */}
      <div className="lg:col-span-6 space-y-3">
        {features.map((feat) => {
          const isSelected = activeFeature === feat.id;
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              onClick={() => setActiveFeature(feat.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500/60 shadow-xl shadow-indigo-500/10'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-white/[0.03] border-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-base font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {feat.title}
                    </h4>
                    <span className="text-xs font-mono text-indigo-400">
                      {feat.subtitle}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    VIEWING 3D
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed pl-13">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
