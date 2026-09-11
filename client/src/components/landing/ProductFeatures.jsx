import React from 'react';
import {
  MessageSquare,
  Cpu,
  ShieldCheck,
  Award,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Feature3DMicroScenes } from './3d/Feature3DMicroScenes';

export function ProductFeatures() {
  return (
    <section id="features" className="relative py-24 bg-[#070a12] border-t border-slate-800">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>INTERACTIVE 3D PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Built for enterprise clarity. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Interactive 3D Micro-Scenes.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Select each capability below to interact with its live 3D representation — from vector cosine spaces to cryptographic RBAC vaults and institutional memory lattices.
          </p>
        </div>

        {/* 4 Dedicated 3D Interactive Micro-Scenes */}
        <Feature3DMicroScenes />
      </div>
    </section>
  );
}

