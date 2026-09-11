import React, { useState } from 'react';
import {
  FileText,
  Database,
  ArrowRight,
  Check,
  Lock,
  Layers,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';

export function IntegrationsSection() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <section id="integrations" className="relative py-24 bg-[#090e1a] border-t border-slate-800">
      {/* Architectural subtle grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-mono mb-4">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>SUPPORTED NATIVE CONNECTORS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Bring your knowledge together.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Direct, verified connectors for unstructured documentation and live relational data. Only what is connected and permitted is ever indexed.
          </p>
        </div>

        {/* The Two Supported Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Google Drive */}
          <div
            onMouseEnter={() => setHoveredCard('drive')}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative rounded-2xl bg-[#0d1424] border border-sky-500/30 p-8 shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-sky-500/10 hover:border-sky-500/60 overflow-hidden cursor-pointer"
            style={{ perspective: 1000 }}
          >
            {/* Ambient top light */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none group-hover:opacity-100 opacity-40 transition-opacity" />

            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-md">
                <FileText className="w-7 h-7" />
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                Active Connector
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">Google Drive</h3>
            <p className="text-sm font-medium text-sky-300/90 mt-2">
              "Connect your documents, PDFs and files."
            </p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Syncs architecture specifications, RFCs, design docs, onboarding guidelines, and PDF runbooks with continuous permission verification.
            </p>

            {/* Live Data Flow Indicator */}
            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>INGESTION STATUS</span>
                <span className="text-sky-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  Streaming Chunks
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-700 ${
                    hoveredCard === 'drive' ? 'w-full' : 'w-3/4'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>OAuth 2.0 Token Vault</span>
                <span>Incremental Delta Sync</span>
              </div>
            </div>
          </div>

          {/* Card 2: Supabase */}
          <div
            onMouseEnter={() => setHoveredCard('supabase')}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative rounded-2xl bg-[#0d1424] border border-emerald-500/30 p-8 shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-emerald-500/10 hover:border-emerald-500/60 overflow-hidden cursor-pointer"
            style={{ perspective: 1000 }}
          >
            {/* Ambient top light */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:opacity-100 opacity-40 transition-opacity" />

            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
                <Database className="w-7 h-7" />
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active Connector
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">Supabase</h3>
            <p className="text-sm font-medium text-emerald-300/90 mt-2">
              "Connect application data and structured information."
            </p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Indexes PostgreSQL tables, project manifests, team experiences, and structured business records with automated schema mapping and row-level filtering.
            </p>

            {/* Live Data Flow Indicator */}
            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>SYNC PIPELINE</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  PostgreSQL CDC Ready
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ${
                    hoveredCard === 'supabase' ? 'w-full' : 'w-4/5'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Direct SSL Connection</span>
                <span>Row-Level Security Respected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transparent Enterprise Policy Note */}
        <div className="mt-12 text-center max-w-xl mx-auto">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>CompanyBrain strictly connects only with authorized systems configured by your admin.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
