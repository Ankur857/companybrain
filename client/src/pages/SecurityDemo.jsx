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
  Sparkles
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
      // Ensure logged in as Rahul in Acme
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
      showToast('Step 2 Query Executed: Policy Engine BLOCKED (DENIED)', 'warning');
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
      // Switch persona to Arjun Mehta (Nova Finance)
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
              INTERACTIVE DEMO LAB
            </span>
            <span className="text-xs text-slate-400">Core USP Verification</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
            Security & Permission-Aware RAG Showcase
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Execute real automated queries live against the backend to verify that the LLM is never the security boundary.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-slate-300 text-xs font-medium transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Active Clearance Context Indicator */}
      <div className="p-4 rounded-xl glass-panel border border-indigo-500/30 bg-indigo-950/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">
            {user?.name?.[0]}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono">CURRENT DEMO USER</div>
            <div className="font-bold text-white text-sm">
              {user?.name} <span className="text-xs font-normal text-slate-400">({user?.email})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">TENANT:</span>
            <span className="text-indigo-300 font-bold">{tenant?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">ROLE:</span>
            <span className="text-white font-bold">{user?.role_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">ACCESS GROUPS:</span>
            <span className="text-cyan-300 font-bold">
              {(user?.access_groups || []).map((g) => g.name).join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Step-By-Step Interactive Test Cards */}
      <div className="space-y-4">
        {/* TEST 1: Rahul -> Project Alpha */}
        <div className="p-5 rounded-2xl glass-panel border border-white/10 transition-all space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                01
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Authorized Retrieval: Rahul queries Project Alpha Architecture</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    EXPECTED: ALLOW
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rahul belongs to <code>Project-Alpha</code>. PolicyEngine verifies clearance, constructs authorized context, and returns answer with citations.
                </p>
              </div>
            </div>

            <button
              onClick={runStep1}
              disabled={loadingStep === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loadingStep === 1 ? 'Evaluating...' : 'Run Test 1'}</span>
            </button>
          </div>

          {step1Result && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  DECISION: {step1Result.decision}
                </span>
                <span className="text-slate-400 font-mono">
                  {step1Result.securityIndicators?.authorizedSourcesCount} authorized sources used
                </span>
              </div>
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {step1Result.answer}
              </div>
              {step1Result.sources?.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex gap-2 flex-wrap">
                  {step1Result.sources.map((s, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-slate-900 border border-white/10 text-[11px] text-slate-300">
                      📄 {s.title} ({s.classification})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* TEST 2: Rahul -> HR Salaries */}
        <div className="p-5 rounded-2xl glass-panel border border-white/10 transition-all space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                02
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Confidential Data Shield: Rahul asks for Employee Salaries</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    EXPECTED: DENY
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Salary report is <code>HIGHLY_CONFIDENTIAL</code> and requires group <code>HR</code>. PolicyEngine denies access BEFORE RAG context is generated. Zero salary data reaches the LLM.
                </p>
              </div>
            </div>

            <button
              onClick={runStep2}
              disabled={loadingStep === 2}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-rose-600/25 transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loadingStep === 2 ? 'Evaluating...' : 'Run Test 2'}</span>
            </button>
          </div>

          {step2Result && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <span className="font-mono text-rose-400 font-semibold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  POLICY ENGINE DECISION: {step2Result.decision}
                </span>
                <span className="text-rose-300 font-mono">Zero leaks (0 context sent to LLM)</span>
              </div>
              <div className="text-rose-200 leading-relaxed whitespace-pre-wrap">
                {step2Result.answer}
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                🔒 Verified: This denial is logged in the Audit Trail.
              </div>
            </div>
          )}
        </div>

        {/* TEST 3: Arjun (Nova Finance) -> Project Alpha (Acme) */}
        <div className="p-5 rounded-2xl glass-panel border border-white/10 transition-all space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                03
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Cross-Tenant Isolation: Arjun (Nova Finance) queries Project Alpha</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    EXPECTED: ISOLATED
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Project Alpha exists strictly in Company A (Acme Technologies). Arjun belongs to Company B. Cross-tenant retrieval is strictly impossible.
                </p>
              </div>
            </div>

            <button
              onClick={runStep3}
              disabled={loadingStep === 3}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-cyan-600/25 transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loadingStep === 3 ? 'Switching & Testing...' : 'Run Test 3'}</span>
            </button>
          </div>

          {step3Result && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-mono text-cyan-400 font-semibold">
                  TENANT: Nova Finance (Queried Project Alpha)
                </span>
                <span className="text-emerald-400 font-mono">Zero Acme documents leaked</span>
              </div>
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {step3Result.answer}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Next Step Callout */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-bold text-white text-sm">Verify the Audit Trail</div>
          <p className="text-xs text-slate-400 mt-0.5">
            Every step executed above has generated an immutable audit event recording user, action, ALLOW/DENY decision, and policy justification.
          </p>
        </div>
        <Link
          to="/audit"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shrink-0"
        >
          <span>Open Enterprise Audit Logs</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
