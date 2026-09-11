import React from 'react';
import { ArrowRight, Shield, Sparkles, Cpu, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FinalCTASection() {
  const scrollToArchitecture = () => {
    const el = document.getElementById('architecture');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-28 bg-[#070a12] border-t border-slate-800 overflow-hidden text-center">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Ambient center lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-r from-blue-600/10 via-indigo-600/15 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Simplified Central 3D Core Motif */}
        <div className="relative mx-auto w-24 h-24 mb-8 flex items-center justify-center">
          {/* Subtle spinning concentric rings */}
          <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute inset-2 rounded-full border border-sky-400/20 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
          
          <div className="w-16 h-16 rounded-2xl bg-[#0e1628]/90 border border-indigo-400/40 shadow-[0_0_30px_rgba(99,102,241,0.25)] flex items-center justify-center backdrop-blur-md">
            <Cpu className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
          Turn knowledge into{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            progress.
          </span>
        </h2>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Help your teams learn faster, work smarter, and keep company knowledge within reach.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={scrollToArchitecture}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium text-sm transition-all backdrop-blur-md"
          >
            <span>See how it works</span>
          </button>
        </div>

        {/* Enterprise Security Guarantee Indicator */}
        <div className="mt-12 flex items-center justify-center gap-6 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Zero training on customer data
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Tenant isolated
          </span>
        </div>
      </div>
    </section>
  );
}
