import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Layers,
  Database,
  FileText,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Eye,
  Sliders,
  Terminal,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function InteractiveArchitecture() {
  const [activeScene, setActiveScene] = useState(1);
  const containerRef = useRef(null);

  const scenes = [
    {
      id: 1,
      tag: 'SCENE 01',
      title: 'The Neural Knowledge Core',
      description: 'The central CompanyBrain engine initializes in a private, tenant-isolated memory envelope.',
      badge: 'Core Online',
      accent: 'border-indigo-500/40 text-indigo-400',
    },
    {
      id: 2,
      tag: 'SCENE 02',
      title: 'Ingestion Alignment',
      description: 'Authorized data connectors for Google Drive and Supabase align to the central architecture.',
      badge: 'Connectors Linked',
      accent: 'border-sky-500/40 text-sky-400',
    },
    {
      id: 3,
      tag: 'SCENE 03',
      title: 'Active Data Ingestion Streams',
      description: 'Continuous vectorization streams structured tables and unstructured documents into secure embeddings.',
      badge: 'Encrypted Flow',
      accent: 'border-emerald-500/40 text-emerald-400',
    },
    {
      id: 4,
      tag: 'SCENE 04',
      title: 'Pre-RAG Policy Enforcement',
      description: 'Before any LLM sees the prompt, CompanyBrain applies strict Role-Based Access Control and RBAC filtering.',
      badge: 'Zero-Leakage Guard',
      accent: 'border-amber-500/40 text-amber-400',
    },
    {
      id: 5,
      tag: 'SCENE 05',
      title: 'AI Agent Synthesis',
      description: 'Gemini reasoning agent operates strictly over policy-cleared document slices with cited provenance.',
      badge: 'Model Grounding',
      accent: 'border-purple-500/40 text-purple-400',
    },
    {
      id: 6,
      tag: 'SCENE 06',
      title: 'Verified Enterprise UI Emerges',
      description: 'The answer appears directly within the unified Project Intelligence and Continuous Experience dashboard.',
      badge: 'Source-Backed',
      accent: 'border-cyan-500/40 text-cyan-400',
    },
    {
      id: 7,
      tag: 'SCENE 07',
      title: 'Transition into the Live Platform',
      description: 'Your team enters a live, permission-aware workspace ready for instant queries and verified institutional memory.',
      badge: 'Ready for Work',
      accent: 'border-indigo-400 text-indigo-300',
    },
  ];

  // Scroll observer to update active scene as user scrolls through this section
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress through container
      if (rect.top <= windowHeight * 0.4 && rect.bottom >= windowHeight * 0.2) {
        const totalHeight = rect.height - windowHeight * 0.5;
        const currentProgress = Math.max(0, Math.min(1, (-rect.top + windowHeight * 0.2) / totalHeight));
        const sceneIndex = Math.min(7, Math.max(1, Math.floor(currentProgress * 7) + 1));
        setActiveScene(sceneIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={containerRef} id="architecture" className="relative py-24 bg-[#070a12] border-t border-slate-800/80">
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono mb-4">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>SCROLL-DRIVEN ARCHITECTURAL EXPERIENCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Scrolling through the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              architecture of CompanyBrain.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Witness how raw enterprise files and relational data transform into verified, permission-checked intelligence across seven architectural stages.
          </p>

          {/* Interactive Scene Navigation Pill Tabs */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-8 overflow-x-auto pb-2">
            {scenes.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveScene(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  activeScene === s.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 font-semibold'
                    : 'bg-slate-900/80 border border-white/5 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                0{s.id}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Dynamic Interactive Visual Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Interactive Stage Visualizer */}
          <div className="lg:col-span-7 bg-[#0d1424] border border-slate-700/60 rounded-2xl p-6 sm:p-8 relative min-h-[460px] flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Top Bar with System Status */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-slate-300 tracking-wider">PIPELINE MONITOR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                  STAGE {activeScene} OF 7
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border bg-indigo-500/10 ${scenes[activeScene - 1].accent}`}>
                  {scenes[activeScene - 1].badge}
                </span>
              </div>
            </div>

            {/* Middle: Interactive Visual Representation per Scene */}
            <div className="relative py-8 flex items-center justify-center min-h-[260px]">
              {/* Scene 1: Central Core Appears */}
              {activeScene === 1 && (
                <div className="flex flex-col items-center animate-fade-in">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                    <div className="w-28 h-28 rounded-2xl bg-indigo-950/60 border-2 border-indigo-400/60 flex items-center justify-center transform rotate-45 shadow-2xl">
                      <Cpu className="w-12 h-12 text-indigo-300 transform -rotate-45" />
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-sm font-semibold text-white">CompanyBrain Core Engine</div>
                    <div className="text-xs text-slate-400 font-mono mt-1">Tenant isolation & cryptographic memory boundary</div>
                  </div>
                </div>
              )}

              {/* Scene 2: Google Drive & Supabase Move Toward Core */}
              {activeScene === 2 && (
                <div className="w-full flex items-center justify-between px-6 animate-fade-in">
                  {/* Google Drive */}
                  <div className="flex flex-col items-center p-3.5 rounded-xl bg-slate-900 border border-sky-500/40 shadow-lg shadow-sky-500/5">
                    <FileText className="w-7 h-7 text-sky-400 mb-1" />
                    <span className="text-xs font-semibold text-white">Google Drive</span>
                    <span className="text-[10px] text-slate-400">Documents & PDFs</span>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex-1 px-4 flex flex-col items-center">
                    <div className="w-full h-0.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    </div>
                    <span className="text-[10px] font-mono text-indigo-300 mt-2">Converging into Core</span>
                  </div>

                  {/* Supabase */}
                  <div className="flex flex-col items-center p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-500/5">
                    <Database className="w-7 h-7 text-emerald-400 mb-1" />
                    <span className="text-xs font-semibold text-white">Supabase</span>
                    <span className="text-[10px] text-slate-400">Application Tables</span>
                  </div>
                </div>
              )}

              {/* Scene 3: Data Streams Flow Into CompanyBrain */}
              {activeScene === 3 && (
                <div className="w-full flex flex-col items-center animate-fade-in">
                  <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                    <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-500/30">
                      <div className="flex items-center gap-2 text-sky-300 text-xs font-mono mb-1.5">
                        <FileText className="w-3.5 h-3.5" /> Drive Stream
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">architecture_v2.pdf (14 pages)</div>
                      <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-sky-400 h-full w-4/5 animate-pulse" />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-mono mb-1.5">
                        <Database className="w-3.5 h-3.5" /> Supabase Stream
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">projects, experiences, schemas</div>
                      <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-400 h-full w-full animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-300 font-mono flex items-center gap-2">
                    <Activity className="w-3 h-3 text-indigo-400 animate-spin" />
                    Chunking, embedding & tenant-tagging in progress
                  </div>
                </div>
              )}

              {/* Scene 4: Core Transforms into Secure RAG Layer */}
              {activeScene === 4 && (
                <div className="flex flex-col items-center max-w-md w-full animate-fade-in">
                  <div className="w-full p-4 rounded-xl bg-[#11192d] border border-amber-500/30 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-bold">
                        <Shield className="w-4 h-4 text-amber-400" /> POLICY ENGINE CLEARANCE
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        PRE-RAG PASS
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-300 py-1 border-b border-white/5">
                        <span>User Role: Rahul Sharma</span>
                        <span className="text-emerald-400">Authorized [Admin/Engineer]</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 py-1 border-b border-white/5">
                        <span>Project Scope: Project Alpha</span>
                        <span className="text-emerald-400">Access Granted</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 py-1">
                        <span>Restricted Slices: HR & Salary</span>
                        <span className="text-amber-400">Masked (0 Tokens Sent)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400 font-mono">
                    Zero unauthorized chunks ever enter the prompt context.
                  </div>
                </div>
              )}

              {/* Scene 5: AI Agent Appears Above Security Layer */}
              {activeScene === 5 && (
                <div className="flex flex-col items-center animate-fade-in max-w-md w-full">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border-2 border-purple-400/50 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    <Sparkles className="w-8 h-8 text-purple-300" />
                  </div>
                  <div className="text-sm font-semibold text-white">Gemini 3.5 AI Agent</div>
                  <div className="text-xs text-purple-300 font-mono mt-1">Grounding strictly on verified sources</div>
                  
                  <div className="mt-4 w-full p-3 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-300 font-mono">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Synthesizing Prompt</div>
                    <div>&gt; Context: 3 authorized docs + 1 verified experience</div>
                    <div className="text-emerald-400 mt-1">&gt; Hallucination check: 0.00% · Provenance verified</div>
                  </div>
                </div>
              )}

              {/* Scene 6: Product Dashboard Emerges */}
              {activeScene === 6 && (
                <div className="w-full max-w-lg p-4 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-2xl animate-fade-in">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-xs font-mono">
                    <span className="text-cyan-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" /> Project Alpha · Assistant
                    </span>
                    <span className="text-slate-400 text-[10px]">Verified 120ms</span>
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed font-sans">
                    <span className="font-semibold text-white">Project Alpha</span> uses an event-driven architecture with an API Gateway handling ingress, decoupled microservices over an event stream, and PostgreSQL/Redis managing state.
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      [doc] architecture_v2.pdf
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      [db] services.schema
                    </span>
                  </div>
                </div>
              )}

              {/* Scene 7: Transition to Product Experience */}
              {activeScene === 7 && (
                <div className="flex flex-col items-center text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_25px_rgba(52,211,153,0.3)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Platform Ready for Your Team</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
                    Connect Google Drive & Supabase, enforce instant security policies, and unlock institutional knowledge in minutes.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Launch CompanyBrain</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Bottom Bar Details */}
            <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>ACTIVE STAGE: {scenes[activeScene - 1].tag}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={activeScene === 1}
                  onClick={() => setActiveScene((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-white"
                >
                  Prev
                </button>
                <button
                  disabled={activeScene === 7}
                  onClick={() => setActiveScene((p) => Math.min(7, p + 1))}
                  className="px-2.5 py-1 rounded bg-indigo-600 disabled:opacity-30 hover:bg-indigo-500 text-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Right: Architectural Narrative Cards */}
          <div className="lg:col-span-5 space-y-3">
            {scenes.map((s) => {
              const isSelected = activeScene === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveScene(s.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/40 border-white/5 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {s.tag}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
