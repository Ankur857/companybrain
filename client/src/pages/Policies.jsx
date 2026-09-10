import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  Lock,
  Code,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function Policies() {
  const { user, tenant, personas } = useAuth();
  const { showToast } = useToast();

  const [policies, setPolicies] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPolicyId, setExpandedPolicyId] = useState(null);

  // Policy Simulator States
  const [selectedPersonaEmail, setSelectedPersonaEmail] = useState('rahul@acme.com');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getPolicies(), api.getDocuments()])
      .then(([polRes, docRes]) => {
        if (polRes.success) setPolicies(polRes.policies || []);
        if (docRes.success) {
          setDocuments(docRes.documents || []);
          if (docRes.documents?.length > 0) {
            setSelectedDocId(docRes.documents[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenant]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const targetUser = personas.find((p) => p.email === selectedPersonaEmail);
      const targetDoc = documents.find((d) => d.id === selectedDocId);

      const res = await api.simulatePolicy(targetUser, targetDoc);
      if (res.success) {
        setSimResult(res.evaluation);
        showToast(`Policy simulated: ${res.evaluation.allowed ? 'ALLOW' : 'DENY'}`, res.evaluation.allowed ? 'success' : 'warning');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Zero-Trust Rules
          </span>
          <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          Centralized Policy Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          The Policy Engine enforces tenant isolation, sensitivity clearance, and access group membership BEFORE any RAG context is gathered or sent to an LLM.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Policies List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Enforced Security Policies ({policies.length})
            </h2>
          </div>

          {policies.map((p) => {
            const isExpanded = expandedPolicyId === p.id;

            return (
              <div key={p.id} className="card-clean p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                      <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Enforced at Pre-Retrieval
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{p.description}</p>

                {/* Collapsible rule payload */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => setExpandedPolicyId(isExpanded ? null : p.id)}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Rule Logic' : 'View Rule Logic'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-white/[0.06] font-mono text-xs text-slate-400 space-y-1 animate-fade-in">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Evaluation Rules:</div>
                      <pre className="text-indigo-300 text-[11px] overflow-x-auto leading-tight">
                        {JSON.stringify(p.rules, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Policy Simulator Sandbox */}
        <div className="card-clean p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Interactive Simulator</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Test how <code className="text-indigo-300 font-mono">PolicyEngine.canAccess(user, doc)</code> evaluates combinations of personas and sensitive documents in real time.
          </p>

          <div className="space-y-3.5 pt-1">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">User Persona:</label>
              <select
                value={selectedPersonaEmail}
                onChange={(e) => setSelectedPersonaEmail(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-white outline-none focus:border-indigo-500/50"
              >
                {personas.map((p) => (
                  <option key={p.email} value={p.email}>
                    {p.name} ({p.role} - {p.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Document Resource:</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-white outline-none focus:border-indigo-500/50"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.classification}] {d.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{simulating ? 'Evaluating...' : 'Simulate Authorization'}</span>
            </button>
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 animate-fade-in ${
              simResult.allowed
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
            }`}>
              <div className="flex items-center justify-between font-mono font-semibold">
                <span className="flex items-center gap-1.5">
                  {simResult.allowed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                  DECISION: {simResult.allowed ? 'ALLOW' : 'DENY'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                  {simResult.classification}
                </span>
              </div>
              <p className="leading-relaxed text-[11px]">{simResult.reason}</p>
              <div className="text-[10px] font-mono opacity-75 border-t border-white/10 pt-1">
                Triggered Rule: {simResult.policy}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
