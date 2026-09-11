import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  Key,
  FileCheck,
  Sliders,
  Cpu,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lock,
  EyeOff
} from 'lucide-react';

export function SecuritySection() {
  const [selectedStep, setSelectedStep] = useState(2); // Default on Access Policy

  const pipelineSteps = [
    {
      id: 0,
      title: 'USER',
      subtitle: 'Employee identity',
      icon: UserCheck,
      color: 'text-sky-400',
      border: 'border-sky-500/40',
      description: 'The employee signs in using corporate SSO or email credentials. Identity and active tenant context are established.',
      technical: 'JWT bearer tokens signed with RS256, strictly scoped to a unique organization tenant ID.',
    },
    {
      id: 1,
      title: 'AUTHENTICATION',
      subtitle: 'Tenant isolation',
      icon: Key,
      color: 'text-blue-400',
      border: 'border-blue-500/40',
      description: 'Every request is cryptographically bounded to the user’s organization. Cross-company access is architecturally prevented at the database and memory layer.',
      technical: 'Row-level multi-tenancy and scoped schema separation across all vector and relational queries.',
    },
    {
      id: 2,
      title: 'ACCESS POLICY',
      subtitle: 'PolicyEngine filter',
      icon: Sliders,
      color: 'text-indigo-400',
      border: 'border-indigo-500/50',
      description: 'The internal PolicyEngine evaluates RBAC groups (Engineering, Compliance, Risk, Finance) before any document search begins.',
      technical: 'Pre-RAG document masking: files outside the user’s clearance group are omitted from the retrieval pool completely.',
    },
    {
      id: 3,
      title: 'AUTHORIZED KNOWLEDGE',
      subtitle: 'Cleared slices only',
      icon: FileCheck,
      color: 'text-emerald-400',
      border: 'border-emerald-500/40',
      description: 'Only documents and database tables the user has explicit clearance to view are fetched into memory for semantic matching.',
      technical: 'Vector cosine similarity search runs strictly on the pre-filtered sub-index.',
    },
    {
      id: 4,
      title: 'RAG',
      subtitle: 'Secure context assembly',
      icon: Lock,
      color: 'text-amber-400',
      border: 'border-amber-500/40',
      description: 'Retrieved text chunks are stripped of PII and assembled into a bounded prompt with cryptographic source references.',
      technical: 'Context length pruning and candidate token budgeting to prevent prompt injection and data exfiltration.',
    },
    {
      id: 5,
      title: 'AI AGENT',
      subtitle: 'Model reasoning',
      icon: Cpu,
      color: 'text-purple-400',
      border: 'border-purple-500/40',
      description: 'Gemini reasoning agent synthesizes the response based solely on the authorized context slices provided.',
      technical: 'Zero model training on customer data; state-of-the-art hallucination mitigation heuristics.',
    },
    {
      id: 6,
      title: 'ANSWER',
      subtitle: 'Source-backed output',
      icon: CheckCircle,
      color: 'text-cyan-400',
      border: 'border-cyan-500/40',
      description: 'The user receives an accurate response with clickable source links, fully compliant with audit logging.',
      technical: 'Full audit trails logged with requester ID, document hashes, and policy evaluation results.',
    },
  ];

  return (
    <section id="security" className="relative py-24 bg-[#070a12] border-t border-slate-800">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono mb-4">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>ENTERPRISE-GRADE BOUNDARIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            AI that works within <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
              your boundaries.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            The fundamental guarantee of CompanyBrain: <br />
            <span className="text-white font-semibold">
              The AI only sees what the user is authorized to access.
            </span>
          </p>
        </div>

        {/* Interactive Animated Architecture Pipeline Diagram */}
        <div className="bg-[#0b1220] border border-slate-700/80 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Horizontal / Wrapped Pipeline Flow */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const isCurrent = selectedStep === idx;
              return (
                <div key={step.id} className="relative flex flex-col items-center">
                  <button
                    onClick={() => setSelectedStep(idx)}
                    className={`w-full p-3 rounded-xl border text-center transition-all flex flex-col items-center relative ${
                      isCurrent
                        ? `bg-slate-800/90 ${step.border} shadow-lg shadow-indigo-500/10`
                        : 'bg-slate-900/50 border-white/5 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.03] mb-2 ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-white tracking-wider">
                      {step.title}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans mt-0.5">
                      {step.subtitle}
                    </span>

                    {/* Active Pip */}
                    {isCurrent && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400" />
                    )}
                  </button>

                  {/* Flow Arrow indicator between items on desktop */}
                  {idx < pipelineSteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 z-20 pointer-events-none">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Interactive Inspector for Selected Stage */}
          <div className="p-6 sm:p-8 rounded-xl bg-slate-900/90 border border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  STEP {selectedStep + 1} OF 7
                </span>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  {pipelineSteps[selectedStep].title} — {pipelineSteps[selectedStep].subtitle}
                </h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {pipelineSteps[selectedStep].description}
              </p>
              <div className="pt-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Engine Enforcement Architecture
                </div>
                <div className="text-xs font-mono text-emerald-400 bg-black/40 p-3 rounded-lg border border-emerald-500/20">
                  {pipelineSteps[selectedStep].technical}
                </div>
              </div>
            </div>

            <div className="md:col-span-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Boundary Status
                </span>
                <span className="text-emerald-400">ENFORCED</span>
              </div>
              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500">Isolation Layer:</span> Multi-Tenant DB Partitioning
              </div>
              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500">Pre-RAG Check:</span> Active RBAC Matrix
              </div>
              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500">LLM Visibility:</span> Zero Unapproved Context
              </div>
            </div>
          </div>

          {/* Security Principle Callout */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-200">
              <EyeOff className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                <strong>Data Privacy Guarantee:</strong> Your enterprise data is never used to train public models. Responses are synthesized in isolated compute sessions.
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
              Designed with SOC2 & ISO 27001 Controls
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
