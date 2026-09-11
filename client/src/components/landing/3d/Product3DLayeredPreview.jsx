import React, { useState } from 'react';
import {
  Layers,
  Server,
  Database,
  Code,
  Sparkles,
  Shield,
  CheckCircle2,
  Terminal,
  Activity,
  Maximize2
} from 'lucide-react';

export function Product3DLayeredPreview() {
  const [exploded, setExploded] = useState(false);
  const [tilt, setTilt] = useState({ x: 8, y: -6 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: 10 - py * 16,
      y: -8 + px * 20,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 8, y: -6 });
  };

  return (
    <div className="relative w-full py-8">
      {/* 3D View Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>3D PERSPECTIVE ENGINE</span>
        </div>
        <button
          onClick={() => setExploded(!exploded)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-medium hover:bg-indigo-600/30 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{exploded ? 'Collapse to Plane' : 'Explode 3D Depth Layers'}</span>
        </button>
      </div>

      {/* 3D Perspective Stage */}
      <div
        className="perspective-1200 w-full min-h-[500px] flex items-center justify-center p-4 cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="preserve-3d transition-transform duration-300 ease-out w-full max-w-4xl relative"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          {/* LAYER 0: Base Frame Glass Chassis (Z = 0) */}
          <div className="rounded-2xl bg-[#080d1a] border border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Window Chrome Header */}
            <div className="px-5 py-3.5 bg-[#060a14] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
                  companybrain.internal/projects/alpha
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Pre-RAG Enforced</span>
              </div>
            </div>

            {/* Inner App Canvas */}
            <div className="p-6 space-y-6">
              {/* LAYER 1: Floating Project Title Banner */}
              <div
                className={`p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-transform duration-500 ${
                  exploded ? 'shadow-2xl' : ''
                }`}
                style={{
                  transform: exploded ? 'translateZ(30px)' : 'translateZ(0px)',
                }}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-white tracking-tight">Project Alpha</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Payment Processing Platform
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Event-driven microservices platform operating over Kafka and PostgreSQL.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">Owner: Core Architecture Team</span>
              </div>

              {/* LAYER 2: Middle Content (Architecture Graph & Assistant Workspace) */}
              <div
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 transition-transform duration-500 ${
                  exploded ? 'shadow-2xl' : ''
                }`}
                style={{
                  transform: exploded ? 'translateZ(60px)' : 'translateZ(0px)',
                }}
              >
                {/* Microservice Architecture Topology */}
                <div className="md:col-span-5 p-4 rounded-xl bg-[#0e172a] border border-indigo-500/30 space-y-3">
                  <div className="text-xs font-mono text-indigo-300 flex items-center justify-between">
                    <span>TOPOLOGY VISUALIZER</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-sky-400" /> API Gateway</span>
                      <span className="text-[10px] text-emerald-400">HEALTHY</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5"><Code className="w-3.5 h-3.5 text-indigo-400" /> Payment Engine</span>
                      <span className="text-[10px] text-emerald-400">99.99% SLA</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-emerald-400" /> Postgres + Redis</span>
                      <span className="text-[10px] text-emerald-400">SYNCED</span>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Real-time Answer Interface */}
                <div className="md:col-span-7 p-4 rounded-xl bg-[#0f172a] border border-cyan-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs font-mono">
                      <span className="text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> CompanyBrain Assistant
                      </span>
                      <span className="text-slate-500 text-[10px]">120ms latency</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-2.5 leading-relaxed">
                      "Project Alpha routes ingress traffic through Kong API Gateway into decoupled Payment and Settlement workers. Idempotency is enforced via distributed Redis locks with a 30s TTL."
                    </p>
                  </div>

                  {/* LAYER 3: Verified Source Badges Floating on Top */}
                  <div
                    className={`pt-3 border-t border-white/5 flex flex-wrap gap-2 transition-transform duration-500 ${
                      exploded ? 'shadow-xl' : ''
                    }`}
                    style={{
                      transform: exploded ? 'translateZ(90px)' : 'translateZ(0px)',
                    }}
                  >
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-[10px] font-mono text-sky-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>[doc] architecture_v2.pdf</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>[db] payment_ledger.sql</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
