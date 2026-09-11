import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Award, AlertCircle, FileText, UserCheck, CheckCircle2, Lock } from 'lucide-react';

export function Experience3DWorkflow() {
  const mountRef = useRef(null);
  const [activeStep, setActiveStep] = useState(3); // Default on Verified

  const steps = [
    {
      id: 0,
      title: 'Problem Encountered',
      desc: 'Edge case or bug encountered during active development or production operation.',
      icon: AlertCircle,
      color: 0xf43f5e,
      tag: 'Step 1',
    },
    {
      id: 1,
      title: 'Structured Solution',
      desc: 'Engineer documents the root cause, fix snippet, and contextual project dependencies.',
      icon: FileText,
      color: 0x38bdf8,
      tag: 'Step 2',
    },
    {
      id: 2,
      title: 'Admin Peer Review',
      desc: 'Tech Lead or Architect validates the accuracy of the proposed resolution.',
      icon: UserCheck,
      color: 0x818cf8,
      tag: 'Step 3',
    },
    {
      id: 3,
      title: 'Verified Experience',
      desc: 'Indexed into CompanyBrain for natural-language retrieval with inherited project RBAC.',
      icon: CheckCircle2,
      color: 0x10b981,
      tag: 'Step 4',
    },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const light = new THREE.PointLight(0xa855f7, 3, 20);
    light.position.set(0, 3, 5);
    scene.add(light);

    // 4 Milestone Nodes in 3D Space
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const nodes = [];
    const spacing = 1.6;

    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * spacing;
      const geo = i === 0
        ? new THREE.TetrahedronGeometry(0.4)
        : i === 1
        ? new THREE.OctahedronGeometry(0.4)
        : i === 2
        ? new THREE.BoxGeometry(0.5, 0.5, 0.5)
        : new THREE.DodecahedronGeometry(0.45);

      const mat = new THREE.MeshStandardMaterial({
        color: steps[i].color,
        emissive: steps[i].color,
        emissiveIntensity: 0.5,
        wireframe: i !== 3,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, 0);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.65, 0.02, 16, 40),
        new THREE.MeshBasicMaterial({ color: steps[i].color, transparent: true, opacity: 0.5 })
      );
      ring.position.copy(mesh.position);
      ring.rotation.x = Math.PI / 3;

      nodeGroup.add(mesh);
      nodeGroup.add(ring);
      nodes.push({ mesh, ring, origX: x });
    }

    // Connecting Energy Beam
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      nodes[0].mesh.position,
      nodes[1].mesh.position,
      nodes[2].mesh.position,
      nodes[3].mesh.position,
    ]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4 }));
    nodeGroup.add(line);

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
      nodeGroup.rotation.y += (targetX - nodeGroup.rotation.y) * 0.05;
      nodeGroup.rotation.x += (-targetY - nodeGroup.rotation.x) * 0.05;

      // Rotate nodes & rings
      nodes.forEach((n, idx) => {
        n.mesh.rotation.y = elapsed * 0.6 + idx;
        n.mesh.rotation.x = Math.sin(elapsed * 0.5 + idx) * 0.2;
        n.ring.rotation.z = -elapsed * 0.4;

        const isCurrent = idx === activeStep;
        const scale = isCurrent ? 1.3 : 1.0;
        n.mesh.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
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
    <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl bg-[#0b1021] border border-slate-800 p-4 overflow-hidden shadow-2xl mb-8">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Status */}
      <div className="absolute top-4 inset-x-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-mono text-purple-300 backdrop-blur-md">
          <Award className="w-3.5 h-3.5 text-purple-400" />
          <span>3D KNOWLEDGE VERIFICATION LIFECYCLE</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          {steps[activeStep].tag}: {steps[activeStep].title}
        </span>
      </div>

      {/* Interactive Step Buttons */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {steps.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setActiveStep(idx)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
              activeStep === idx
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-500/30'
                : 'bg-slate-900/80 border border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>
    </div>
  );
}
