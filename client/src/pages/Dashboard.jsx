import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Building2,
  Users,
  Network,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Activity,
  ArrowRight,
  ShieldAlert,
  Zap,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user, tenant } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then((res) => {
        if (res.success) setStats(res.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenant]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="p-6 rounded-2xl glass-panel border border-white/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ACTIVE TENANT CONTEXT
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {tenant?.id?.slice(0, 8)}...</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {tenant?.name || 'CompanyBrain Enterprise'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Secure enterprise AI intelligence layer. Pre-RAG authorization guarantees employees only receive answers grounded in knowledge they are cleared to access.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/demo"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 hover:opacity-95 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Launch Security Demo</span>
            </Link>
            <Link
              to="/chat"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-slate-200 text-xs font-medium transition-all"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Ask AI Assistant</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Security Governance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-panel border border-emerald-500/20 bg-emerald-950/20">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>TENANT ISOLATION</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
          <div className="text-lg font-bold text-emerald-300">ACTIVE</div>
          <p className="text-[11px] text-slate-400 mt-1">Cross-tenant queries strictly blocked at database query layer.</p>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-indigo-500/20 bg-indigo-950/20">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>PRE-RAG POLICY ENGINE</span>
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-indigo-300">ENFORCED</div>
          <p className="text-[11px] text-slate-400 mt-1">Documents verified against user clearance before LLM context is compiled.</p>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-cyan-500/20 bg-cyan-950/20">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>AUDIT LOGGING</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-cyan-300">RECORDING</div>
          <p className="text-[11px] text-slate-400 mt-1">Every ALLOW and DENY query decision is immutably logged for compliance.</p>
        </div>

        <div className="p-4 rounded-xl glass-panel border border-amber-500/20 bg-amber-950/20">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>AI INTEGRATION</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-300">
            {stats?.securityStatus?.aiProvider || 'Backend Protected'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">External API keys remain on backend. Frontend never contacts LLM directly.</p>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono">TENANTS</div>
            <div className="text-2xl font-bold text-white mt-0.5">{stats?.totalCompanies ?? 3}</div>
            <div className="text-[11px] text-slate-500">Segmented companies</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono">ACTIVE USERS</div>
            <div className="text-2xl font-bold text-white mt-0.5">{stats?.totalUsers ?? 0}</div>
            <div className="text-[11px] text-slate-500">In this company tenant</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono">SOURCES CONNECTED</div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {stats?.connectedSources ?? 0} / {stats?.totalSources ?? 0}
            </div>
            <div className="text-[11px] text-slate-500">Google Drive, SharePoint, etc.</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono">INDEXED DOCUMENTS</div>
            <div className="text-2xl font-bold text-white mt-0.5">{stats?.indexedDocuments ?? 0}</div>
            <div className="text-[11px] text-slate-500">Common knowledge model</div>
          </div>
        </div>
      </div>

      {/* Query Governance Stats & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queries Ratio Card */}
        <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Query Authorization Activity
            </h3>
            <span className="text-xs text-slate-400 font-mono">All Time</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Allowed Queries</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.allowedQueries ?? 0}</div>
              <div className="text-[10px] text-slate-400 mt-1">Passed pre-retrieval clearance</div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20">
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium mb-1">
                <XCircle className="w-4 h-4" />
                <span>Blocked Queries</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.deniedQueries ?? 0}</div>
              <div className="text-[10px] text-slate-400 mt-1">Shielded by Policy Engine</div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <Link
              to="/audit"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View detailed audit trail <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Core Architecture Principle Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Core Architecture: Zero-Trust Security Pipeline
            </h3>
            <Link to="/architecture" className="text-xs text-indigo-400 hover:underline">
              Full Diagram →
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <span>USER QUERY</span>
              <span>→</span>
              <span>AUTHENTICATION</span>
              <span>→</span>
              <span>TENANT ISOLATION</span>
              <span>→</span>
              <span>POLICY ENGINE</span>
            </div>
            <div className="text-slate-400 pl-4 border-l-2 border-indigo-500/40">
              ↳ "Right information. Right person. Right permission."
              <br />
              ↳ Unauthorized documents are strictly removed <span className="text-amber-400">BEFORE</span> context assembly.
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span>AUTHORIZED CONTEXT ONLY</span>
              <span>→</span>
              <span>EXTERNAL RAG / LLM</span>
              <span>→</span>
              <span>RESPONSE GUARD</span>
              <span>→</span>
              <span>AUDIT LOG</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Unlike standard RAG architectures that feed all company documents to an LLM and prompt it to behave, CompanyBrain treats authorization as an immutable backend software boundary. The LLM receives zero unauthorized reference tokens.
          </p>
        </div>
      </div>
    </div>
  );
}
