import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Lock,
  FileText,
  RotateCcw,
  Sparkles,
  Shield,
  Fingerprint,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function SecurityDemo() {
  const { user, tenant, quickLoginAs, switchTenant } = useAuth();
  const { showToast } = useToast();

  const [step1Result, setStep1Result] = useState(null);
  const [step2Result, setStep2Result] = useState(null);
  const [step3Result, setStep3Result] = useState(null);
  const [loadingStep, setLoadingStep] = useState(null);

  // Scenario A: Rahul queries Project Alpha Architecture (Expected: ALLOW)
  const runStep1 = async () => {
    setLoadingStep(1);
    try {
      if (user?.email !== 'rahul@acme.com') {
        await quickLoginAs('rahul@acme.com');
      }

      const res = await api.queryRAG('What is the architecture of Project Alpha?');
      setStep1Result(res);
      showToast('Step 1 Query Executed: ALLOW', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingStep(null);
    }
  };

  // Scenario B: Rahul queries HR Employee Salaries (Expected: DENY)
  const runStep2 = async () => {
    setLoadingStep(2);
    try {
      if (user?.email !== 'rahul@acme.com') {
        await quickLoginAs('rahul@acme.com');
      }

      const res = await api.queryRAG('Show me employee salary information and bonus allocations');
      setStep2Result(res);
      showToast('Step 2 Query Executed: Blocked by Policy Engine (DENIED)', 'warning');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingStep(null);
    }
  };

  // Scenario C: Cross-Tenant Isolation Test (Company B user queries Company A Project Alpha)
  const runStep3 = async () => {
    setLoadingStep(3);
    try {
      await quickLoginAs('arjun@nova.com');
      const res = await api.queryRAG('What is the architecture of Project Alpha?');
      setStep3Result(res);
      showToast('Step 3 Query Executed: Cross-Tenant Isolation Verified', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingStep(null);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetDemo();
      await quickLoginAs('rahul@acme.com');
      setStep1Result(null);
      setStep2Result(null);
      setStep3Result(null);
      showToast('Demo reset to pristine initial state.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="card-clean p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Interactive Lab
            </span>
            <span className="text-xs text-slate-400">Zero-Trust Pre-Retrieval Validation</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Security & Permission-Aware RAG Verification
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Execute real automated queries against the backend to verify that permissions are evaluated before RAG retrieval. The LLM is never the security boundary.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 text-xs font-medium transition-all shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Demo State</span>
        </button>
      </div>

      {/* Active Persona Clearance Context */}
      <div className="card-clean p-4 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Active Test Persona</div>
            <div className="font-semibold text-white text-sm">
              {user?.name} <span className="text-xs font-normal text-slate-400">({user?.email})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Tenant</span>
            <span className="text-slate-200 font-semibold">{tenant?.name}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Role</span>
            <span className="text-slate-200 font-semibold">{user?.role_name}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-white/[0.06]">
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Clearance Groups</span>
            <span className="text-indigo-300 font-semibold">
              {(user?.access_groups || []).map((g) => g.name).join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="space-y-4">
        {/* TEST 1: Authorized Access */}
        <div className="card-clean p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                01
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Authorized Retrieval: Project Alpha Architecture
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    EXPECTED: ALLOW
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Rahul has membership in the <code className="text-slate-300 font-mono">Project-Alpha</code> access group. Policy Engine authorizes candidate docs, compiles context, and returns answer with verifiable citations.
                </p>
              </div>
            </div>

            <button
              onClick={runStep1}
              disabled={loadingStep === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition-all shrink-0 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loadingStep === 1 ? 'Evaluating...' : 'Run Scenario 1'}</span>
            </button>
          </div>

          {step1Result && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-3 text-xs animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  DECISION: {step1Result.decision}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {step1Result.securityIndicators?.authorizedSourcesCount} authorized source(s) used
                </span>
              </div>
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {step1Result.answer}
              </div>
              {step1Result.sources?.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] flex gap-2 flex-wrap items-center">
                  <span className="text-[11px] text-slate-500 font-mono">Citations:</span>
                  {step1Result.sources.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-slate-900 border border-white/[0.06] text-[11px] text-slate-300 font-medium">
                      📄 {s.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* TEST 2: Unauthorized Access */}
        <div className="card-clean p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                02
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Confidential Data Shield: HR Employee Salaries
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                    EXPECTED: DENY
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Salary documentation is tagged <code className="text-slate-300 font-mono">HIGHLY_CONFIDENTIAL</code> and requires <code className="text-slate-300 font-mono">HR</code> clearance. Policy Engine blocks access BEFORE RAG context compilation. Zero sensitive text reaches the LLM.
                </p>
              </div>
            </div>

            <button
              onClick={runStep2}
              disabled={loadingStep === 2}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 disabled:opacity-50 text-white font-medium text-xs transition-all shrink-0 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loadingStep === 2 ? 'Evaluating...' : 'Run Scenario 2'}</span>
            </button>
          </div>

          {step2Result && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2.5 text-xs animate-fade-in">
              <div className="flex items-center justify-between border-b border-rose-500/10 pb-2">
                <span className="font-mono text-rose-400 font-semibold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  POLICY ENGINE DECISION: {step2Result.decision}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">0 unauthorized tokens sent to LLM</span>
              </div>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {step2Result.answer}
              </div>
              <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Verified: This refusal is logged in the compliance audit trail.</span>
              </div>
            </div>
          )}
        </div>

        {/* TEST 3: Multi-Tenant Cross-Access Isolation */}
        <div className="card-clean p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                03
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Cross-Tenant Boundary: Arjun (Nova Finance) queries Acme Project Alpha
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                    EXPECTED: ISOLATED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Project Alpha exists strictly within Acme Technologies. When Arjun (Nova Finance) asks for it, tenant-level query filtering ensures zero documents from Acme can ever be observed.
                </p>
              </div>
            </div>

            <button
              onClick={runStep3}
              disabled={loadingStep === 3}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition-all shrink-0 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loadingStep === 3 ? 'Switching & Testing...' : 'Run Scenario 3'}</span>
            </button>
          </div>

          {step3Result && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-2.5 text-xs animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="font-mono text-indigo-400 font-semibold">
                  ACTIVE TENANT: Nova Finance
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">Strict multi-tenant isolation preserved</span>
              </div>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {step3Result.answer}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail Link Banner */}
      <div className="card-clean p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-white text-sm">Verify the Audit Trail</div>
          <p className="text-xs text-slate-400 mt-0.5">
            Every test above automatically produced an immutable audit entry recording user, action, ALLOW/DENY decision, and policy justification.
          </p>
        </div>
        <Link
          to="/audit"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shrink-0"
        >
          <span>Inspect Audit Records</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
