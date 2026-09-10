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
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export function Policies() {
  const { user, tenant, personas } = useAuth();
  const { showToast } = useToast();

  const [policies, setPolicies] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            GOVERNANCE RULES
          </span>
          <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          Centralized Policy Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          The Policy Engine evaluates tenant isolation, classification clearance, and required access groups BEFORE RAG context compilation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Policies List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Active Tenant Policies ({policies.length})
          </h2>

          {policies.map((p) => (
            <div key={p.id} className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{p.name}</h3>
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ENFORCED IN REAL-TIME
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  ENABLED
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{p.description}</p>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 font-mono text-xs text-slate-400 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Evaluation Rules:</div>
                <pre className="text-indigo-300 text-[11px] overflow-x-auto">
                  {JSON.stringify(p.rules, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Live Policy Simulator Sandbox */}
        <div className="p-5 rounded-2xl glass-panel border border-indigo-500/40 bg-indigo-950/20 space-y-4 h-fit">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Interactive Policy Simulator</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Test how <code className="text-indigo-300">PolicyEngine.canAccess(user, doc)</code> evaluates combinations of personas and sensitive documents in real time.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Select User Persona:</label>
              <select
                value={selectedPersonaEmail}
                onChange={(e) => setSelectedPersonaEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
              >
                {personas.map((p) => (
                  <option key={p.email} value={p.email}>
                    {p.name} ({p.role} - {p.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Select Document Resource:</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
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
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 mt-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{simulating ? 'Evaluating...' : 'Simulate Policy Decision'}</span>
            </button>
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 animate-fade-in ${
              simResult.allowed
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex items-center justify-between font-mono font-bold">
                <span className="flex items-center gap-1.5">
                  {simResult.allowed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  DECISION: {simResult.allowed ? 'ALLOW' : 'DENY'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                  {simResult.classification}
                </span>
              </div>
              <p className="leading-relaxed">{simResult.reason}</p>
              <div className="text-[10px] font-mono opacity-70 border-t border-white/10 pt-1">
                Triggered Policy: {simResult.policy}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
