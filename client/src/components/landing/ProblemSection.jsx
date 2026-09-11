import React from 'react';
import {
  HelpCircle,
  FileQuestion,
  Search,
  AlertTriangle,
  Clock,
  Shuffle,
  Users,
  Database,
  FileText,
  Lock,
  ArrowDown
} from 'lucide-react';
import { Problem3DScene } from './3d/Problem3DScene';

export function ProblemSection() {
  return (
    <section className="relative py-24 bg-[#070a12] overflow-hidden border-t border-slate-800/80">
      {/* Background architectural grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-25 pointer-events-none" />

      {/* Ambient subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-mono mb-4">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>THE ENTERPRISE KNOWLEDGE CRISIS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Important knowledge shouldn't be <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-orange-400">
              this hard to find.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Company information is scattered across documents, disconnected databases, stale wiki pages, and team silos. New employees spend hours hunting for context while seasoned engineers repeat the same answers.
          </p>
        </div>

        {/* 3D Visual Scene: Scattered Floating Knowledge Space */}
        <div className="relative max-w-5xl mx-auto rounded-2xl bg-[#0b1220]/90 border border-slate-800 p-4 sm:p-6 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Interactive 3D Canvas */}
          <Problem3DScene />

          {/* Central User / Searching Icon */}
          <div className="relative z-20 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/90 border border-slate-600 flex items-center justify-center shadow-2xl shadow-black/50 animate-pulse-glow">
              <Users className="w-9 h-9 text-slate-300" />
            </div>
            <div className="mt-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
              New Team Member / Engineer
            </div>
            <div className="text-[11px] text-red-400/80 font-mono mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Average 1.8 hrs/day spent searching
            </div>
          </div>

          {/* Floating Fragmented File Cards around Central Visual */}
          {/* Card 1: Outdated Architecture PDF */}
          <div className="absolute top-8 left-4 sm:left-12 max-w-[220px] p-3 rounded-xl bg-slate-900/90 border border-red-500/20 text-xs shadow-lg animate-float-slow">
            <div className="flex items-center gap-2 text-red-400 font-mono text-[11px] mb-1">
              <FileText className="w-3.5 h-3.5" /> architecture_old_v1.pdf
            </div>
            <div className="text-[11px] text-slate-400">
              "Is this still the current gateway diagram or did we switch to Envoy last quarter?"
            </div>
            <div className="mt-2 text-[9px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded inline-block">
              Out of Sync
            </div>
          </div>

          {/* Card 2: Slack thread buried */}
          <div className="absolute top-10 right-4 sm:right-12 max-w-[240px] p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs shadow-lg animate-float-slow" style={{ animationDelay: '1.5s' }}>
            <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px] mb-1">
              <HelpCircle className="w-3.5 h-3.5" /> Thread: Payment Timeout Fix
            </div>
            <div className="text-[11px] text-slate-400">
              "Vikram answered this in a DM 6 months ago... where did that solution go?"
            </div>
            <div className="mt-2 text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded inline-block">
              Lost Institutional Memory
            </div>
          </div>

          {/* Card 3: Database Schema Confusion */}
          <div className="absolute bottom-8 left-6 sm:left-16 max-w-[230px] p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs shadow-lg animate-float-slow" style={{ animationDelay: '3s' }}>
            <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px] mb-1">
              <Database className="w-3.5 h-3.5 text-sky-400" /> prod_db_v2 (Postgres)
            </div>
            <div className="text-[11px] text-slate-400">
              Which tables are restricted under SOC2 tenant policies?
            </div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded inline-block">
              Unclear Boundaries
            </div>
          </div>

          {/* Card 4: Permission Denied Wall */}
          <div className="absolute bottom-8 right-6 sm:right-16 max-w-[220px] p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs shadow-lg animate-float-slow" style={{ animationDelay: '2.2s' }}>
            <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px] mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Access Boundary
            </div>
            <div className="text-[11px] text-slate-400">
              Need manager approval just to read API specification.
            </div>
            <div className="mt-2 text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded inline-block">
              Blocked Progress
            </div>
          </div>

          {/* 3-Step Impact Flow Below */}
          <div className="relative z-20 mt-12 w-full max-w-xl pt-6 border-t border-white/5">
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                <div className="font-bold">SCATTERED</div>
                <div className="text-[10px] text-red-400/80 mt-0.5">Siloed Data</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <div className="font-bold">SEARCHING</div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">Wasted Hours</div>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs">
                <div className="font-bold">CONFUSION</div>
                <div className="text-[10px] text-orange-400/80 mt-0.5">Duplicate Errors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
