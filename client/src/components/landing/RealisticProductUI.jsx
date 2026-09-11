import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Layers,
  Server,
  Database,
  Code,
  Cloud,
  FileText,
  Shield,
  CheckCircle2,
  Send,
  ExternalLink,
  ChevronRight,
  Terminal,
  Activity,
  Award
} from 'lucide-react';
import { Solution3DConvergence } from './3d/Solution3DConvergence';
import { Product3DLayeredPreview } from './3d/Product3DLayeredPreview';

export function RealisticProductUI() {
  const [activeTab, setActiveTab] = useState('architecture');
  const [activeQuery, setActiveQuery] = useState('Explain the architecture');
  const [isAnswering, setIsAnswering] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'architecture', label: 'Architecture', icon: Server },
    { id: 'services', label: 'Services', icon: Code },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'apis', label: 'APIs', icon: Terminal },
    { id: 'deployment', label: 'Deployment', icon: Cloud },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'experience', label: 'Experience', icon: Award },
  ];

  const queries = [
    'Explain the architecture',
    'What services are involved?',
    'How does the database work?',
    'How is this deployed?',
  ];

  const queryAnswers = {
    'Explain the architecture': {
      summary: 'Project Alpha is an event-driven payment processing platform designed for high-concurrency resilience.',
      details: [
        'Ingress: Managed API Gateway handling rate limiting, mTLS, and client authentication.',
        'Core Engine: Decoupled Payment Service & Settlement Worker communicating over an event stream.',
        'Data Layer: Primary PostgreSQL 15 for transactional ledger entries, Redis cluster for idempotency lock state.',
        'Security: Strict tenant isolation with HMAC request signing and PCI-DSS tokenized storage.',
      ],
      sources: [
        { name: 'architecture_specification_v2.pdf', type: 'Google Drive', badge: 'Verified' },
        { name: 'payment_engine_schema.sql', type: 'Supabase', badge: 'Live DB' },
        { name: 'Idempotency Lock Experience #12', type: 'Verified Experience', badge: 'Team Solution' },
      ],
      clearedDocs: 3,
      restrictedDocs: 0,
    },
    'What services are involved?': {
      summary: 'Project Alpha consists of three core microservices operating within isolated container networks.',
      details: [
        'API Gateway: Routes public webhooks and client mobile/web transaction payloads.',
        'Transaction Orchestrator: Validates ledger balance, performs fraud heuristics, and coordinates with banking rails.',
        'Audit & Reconciliation Worker: Background processor guaranteeing end-of-day ledger consistency.',
      ],
      sources: [
        { name: 'services_manifest.json', type: 'Supabase', badge: 'Live DB' },
        { name: 'microservices_topology.pdf', type: 'Google Drive', badge: 'Verified' },
      ],
      clearedDocs: 2,
      restrictedDocs: 0,
    },
    'How does the database work?': {
      summary: 'The persistence layer uses a dual-tier storage strategy for ACID compliance and sub-10ms idempotency checks.',
      details: [
        'PostgreSQL: Stores ledger accounts, audit events, and encrypted customer payment tokens.',
        'Redis Cluster: Enforces atomic distributed locking on transaction IDs with automatic 30s TTL expiry.',
        'Connection Pooling: PgBouncer with transaction-level pooling to handle up to 5,000 req/sec.',
      ],
      sources: [
        { name: 'database_schema.sql', type: 'Supabase', badge: 'Live DB' },
        { name: 'concurrency_tuning_guide.pdf', type: 'Google Drive', badge: 'Verified' },
      ],
      clearedDocs: 2,
      restrictedDocs: 0,
    },
    'How is this deployed?': {
      summary: 'Continuous delivery runs on Docker containers orchestrated via Kubernetes with automated blue-green rollouts.',
      details: [
        'Container Registry: Private enterprise registry with vulnerability scanning upon push.',
        'Cluster Architecture: Multi-zone deployment across AWS us-east-1 and eu-west-1.',
        'Observability: Prometheus metrics and OpenTelemetry traces routed to centralized log aggregator.',
      ],
      sources: [
        { name: 'deployment_runbook_v3.md', type: 'Google Drive', badge: 'Verified' },
        { name: 'k8s_helm_values.yaml', type: 'Google Drive', badge: 'Verified' },
      ],
      clearedDocs: 2,
      restrictedDocs: 0,
    },
  };

  const currentAnswer = queryAnswers[activeQuery] || queryAnswers['Explain the architecture'];

  const handleQueryClick = (q) => {
    setIsAnswering(true);
    setActiveQuery(q);
    setTimeout(() => setIsAnswering(false), 200);
  };

  return (
    <section id="project-intelligence" className="relative py-24 bg-[#090e1a] border-t border-slate-800">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>REALISTIC ENTERPRISE PRODUCT UI</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Your company knowledge, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              ready when you are.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Ask complex architecture or operational questions in plain English. CompanyBrain synthesizes answers exclusively from authorized files and application tables with cryptographic provenance.
          </p>
        </div>

        {/* 3D Knowledge Convergence Demonstration */}
        <div className="mb-12 max-w-5xl mx-auto rounded-2xl bg-[#0b1220]/80 border border-slate-800 p-2 sm:p-4 shadow-2xl backdrop-blur-xl">
          <div className="text-center py-2 border-b border-white/5 font-mono text-xs text-indigo-300">
            3D CONVERGENCE: SCATTERED DATA → SECURE RAG → AI REASONING
          </div>
          <Solution3DConvergence />
        </div>

        {/* Realistic Application Interface Container */}
        <div className="rounded-2xl border border-slate-700/80 bg-[#0b1220] shadow-2xl overflow-hidden backdrop-blur-xl mb-12">
          {/* Mock Browser / Window Chrome Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#080d17] border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline-block">
                companybrain.internal/projects/alpha/understand
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" /> Pre-RAG Enforced
              </span>
              <span className="text-xs font-mono text-slate-400">Tenant: Acme Corp</span>
            </div>
          </div>

          {/* Project Header Bar (Inside the App) */}
          <div className="p-4 sm:p-6 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Project Alpha</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Payment Processing Platform
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hidden md:inline-block">
                  Production
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ultra-high throughput payment processing and event-driven microservices platform built for enterprise banking resilience.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Understand Project</span>
              </div>
            </div>
          </div>

          {/* Project Navigation Tabs (Matches CompanyBrain's exact structure) */}
          <div className="flex items-center gap-1 px-4 sm:px-6 bg-[#090f1d] border-b border-slate-800 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-500 text-white font-semibold bg-white/[0.02]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Intelligence Workspace Area */}
          <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Query Picker & Assistant Controls */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-2">
                  EXPLORE ARCHITECTURAL QUERIES
                </label>
                <div className="space-y-2">
                  {queries.map((q) => {
                    const isSelected = activeQuery === q;
                    return (
                      <button
                        key={q}
                        onClick={() => handleQueryClick(q)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-md shadow-indigo-500/5'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Bot className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                          {q}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Connected Knowledge Status Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="font-mono text-[11px] text-slate-400 mb-2 flex items-center justify-between">
                  <span>AUTHORIZED SOURCES</span>
                  <span className="text-emerald-400 font-semibold">100% Cleared</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <FileText className="w-3 h-3 text-sky-400" /> Google Drive Files
                    </span>
                    <span className="font-mono text-slate-400">4 Docs</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Database className="w-3 h-3 text-emerald-400" /> Supabase Schema
                    </span>
                    <span className="font-mono text-slate-400">12 Tables</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Award className="w-3 h-3 text-purple-400" /> Verified Experience
                    </span>
                    <span className="font-mono text-slate-400">1 Log</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: AI Answer Interface (Realistic CompanyBrain output) */}
            <div className="lg:col-span-8 flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-inner min-h-[380px]">
              {/* Question Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-xs">
                    Q
                  </span>
                  <span>"{activeQuery}"</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Latency: 142ms</span>
              </div>

              {/* Answer Body */}
              <div className={`py-4 transition-opacity duration-200 ${isAnswering ? 'opacity-40' : 'opacity-100'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex-shrink-0 flex items-center justify-center text-indigo-400 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-100 leading-relaxed">
                      {currentAnswer.summary}
                    </p>

                    <div className="space-y-2 pt-1">
                      {currentAnswer.details.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>

                    {/* Verified Provenance Sources Pill Box */}
                    <div className="pt-3 border-t border-white/5">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                        Verified Sources Consulted ({currentAnswer.sources.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentAnswer.sources.map((src, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 font-mono"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{src.name}</span>
                            <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300">
                              {src.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Query Input */}
              <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeQuery}
                  className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                />
                <button
                  onClick={() => handleQueryClick(activeQuery)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ask</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Exploded Depth Layer Perspective Preview */}
        <Product3DLayeredPreview />
      </div>
    </section>
  );
}
