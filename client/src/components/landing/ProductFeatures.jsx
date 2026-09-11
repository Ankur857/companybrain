import React from 'react';
import {
  MessageSquare,
  Cpu,
  ShieldCheck,
  Award,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export function ProductFeatures() {
  const features = [
    {
      id: 'ask-anything',
      icon: MessageSquare,
      title: 'Ask Anything',
      description: 'Get accurate, source-backed answers from your company knowledge.',
      detail: 'Direct citation links back to source PDFs, markdown files, and relational rows.',
      badge: 'Zero Hallucinations',
      accent: 'group-hover:border-blue-500/50 group-hover:shadow-blue-500/10 text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    },
    {
      id: 'project-intelligence',
      icon: Cpu,
      title: 'Project Intelligence',
      description: 'Understand architecture, services, APIs and dependencies faster.',
      detail: 'Accelerate developer onboarding from weeks to minutes with synthesized project graphs.',
      badge: 'Deep Architecture',
      accent: 'group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/10 text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    },
    {
      id: 'secure-knowledge',
      icon: ShieldCheck,
      title: 'Secure Knowledge',
      description: 'Permission-aware access keeps information within the right boundaries.',
      detail: 'RBAC policies enforced before retrieval. Multi-tenant cryptographic isolation by default.',
      badge: 'Pre-RAG Enforced',
      accent: 'group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/10 text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      id: 'verified-experiences',
      icon: Award,
      title: 'Verified Experiences',
      description: 'Learn from real problems and solutions shared by your team.',
      detail: 'Peer review workflow captures critical fixes before knowledge is lost to employee turnover.',
      badge: 'Institutional Memory',
      accent: 'group-hover:border-purple-500/50 group-hover:shadow-purple-500/10 text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-[#070a12] border-t border-slate-800">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>CORE PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Built for enterprise clarity. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Designed for verified precision.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Every layer of CompanyBrain is architected to eliminate search friction, enforce security boundaries, and elevate team velocity.
          </p>
        </div>

        {/* 4 Premium Feature Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className={`group relative p-8 rounded-2xl bg-[#0d1424] border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${feat.accent}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feat.iconBg} transition-transform group-hover:scale-110 duration-200`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-400">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-indigo-200 transition-colors">
                  {feat.title}
                </h3>

                <p className="text-sm font-medium text-slate-200 mt-2 leading-relaxed">
                  "{feat.description}"
                </p>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {feat.detail}
                </p>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Production-tested architecture</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
