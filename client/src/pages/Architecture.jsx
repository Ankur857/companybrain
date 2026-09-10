import React, { useState } from 'react';
import {
  GitFork,
  Shield,
  Building2,
  Network,
  Layers,
  FileText,
  KeyRound,
  Database,
  Lock,
  UserCheck,
  Search,
  Bot,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  ArrowDown,
  CheckCircle2
} from 'lucide-react';

export function Architecture() {
  const [selectedNode, setSelectedNode] = useState(null);

  const pipeline = [
    {
      id: 1,
      title: '1. Multi-Company Tenants',
      subtitle: 'Tenant Isolation',
      desc: 'Acme Technologies, Nova Finance, and Orbit Systems maintain completely partitioned database schemas. Cross-company access is strictly barred by server-side query filters.',
      icon: Building2,
      category: 'Isolation',
      color: 'border-indigo-500/40 text-indigo-300',
    },
    {
      id: 2,
      title: '2. Connectors Framework',
      subtitle: 'Data Ingestion',
      desc: 'Connects to Google Drive, SharePoint, MongoDB, Supabase, Confluence, CRM, and REST APIs. Connectors run on a unified adapter interface with connection testing and sync triggers.',
      icon: Network,
      category: 'Ingestion',
      color: 'border-cyan-500/40 text-cyan-300',
    },
    {
      id: 3,
      title: '3. Schema / Semantic Mapping',
      subtitle: 'Normalization Layer',
      desc: 'Transforms heterogeneous source fields (e.g. dept, division, org_unit -> department; emp_name, staff_name -> owner; project_code -> project) into a canonical enterprise schema.',
      icon: Layers,
      category: 'Transformation',
      color: 'border-blue-500/40 text-blue-300',
    },
    {
      id: 4,
      title: '4. Common Knowledge Model',
      subtitle: 'Canonical Document',
      desc: 'Every piece of indexed information is stored in a standardized document structure with tenant_id, source metadata, versioning, and group requirements.',
      icon: FileText,
      category: 'Data Model',
      color: 'border-purple-500/40 text-purple-300',
    },
    {
      id: 5,
      title: '5. Classification & Clearance',
      subtitle: 'Sensitivity Matrix',
      desc: 'Documents are tagged with PUBLIC, INTERNAL, CONFIDENTIAL, or HIGHLY_CONFIDENTIAL classifications, bound to explicit access groups (e.g. Engineering, HR, Project-Alpha).',
      icon: KeyRound,
      category: 'Security',
      color: 'border-amber-500/40 text-amber-300',
    },
    {
      id: 6,
      title: '6. Tenant-Isolated Knowledge Index',
      subtitle: 'PostgreSQL / Supabase',
      desc: 'PostgreSQL repository storing documents, chunks, permissions, and metadata. Queries enforce WHERE tenant_id = authenticatedUser.tenant_id at all times.',
      icon: Database,
      category: 'Storage',
      color: 'border-emerald-500/40 text-emerald-300',
    },
    {
      id: 7,
      title: '7. Authentication Gateway',
      subtitle: 'Bearer JWT Verification',
      desc: 'Employees authenticate with credentials. The server issues a cryptographically signed JWT containing verified userId, tenantId, and roleName. Frontend tenant_id is NEVER trusted.',
      icon: Lock,
      category: 'Auth',
      color: 'border-indigo-500/40 text-indigo-300',
    },
    {
      id: 8,
      title: '8. User Role & Access Groups',
      subtitle: 'Clearance Hydration',
      desc: 'Server hydrates the user clearance profile (e.g. Rahul -> Role: Employee, Department: Engineering, Access Groups: [Engineering, Project-Alpha]).',
      icon: UserCheck,
      category: 'Identity',
      color: 'border-cyan-500/40 text-cyan-300',
    },
    {
      id: 9,
      title: '9. Centralized Policy Engine',
      subtitle: 'Zero-Trust Gate (canAccess)',
      desc: 'Evaluates tenant boundary, account status, classification level, department clearance, and group intersection. CRITICAL: Evaluated BEFORE RAG context is compiled.',
      icon: Shield,
      category: 'Security Gate',
      color: 'border-rose-500/40 text-rose-300',
      highlight: true,
    },
    {
      id: 10,
      title: '10. Permission-Aware Retrieval',
      subtitle: 'Candidate Pruning',
      desc: 'Candidate search retrieves only documents that the user has explicit permission to view. Unauthorized documents are pruned entirely from the retrieval set.',
      icon: Search,
      category: 'Retrieval',
      color: 'border-blue-500/40 text-blue-300',
    },
    {
      id: 11,
      title: '11. Authorized Context Assembly',
      subtitle: 'Prompt Injection Defense',
      desc: 'Sanitized authorized sources are enclosed in XML delimiters with strict system instructions establishing documents as untrusted reference data, not instructions.',
      icon: FileText,
      category: 'Context',
      color: 'border-purple-500/40 text-purple-300',
    },
    {
      id: 12,
      title: '12. External RAG / LLM API',
      subtitle: 'Dedicated AI Abstraction',
      desc: 'Dispatches authorized prompt to external LLM (OpenAI, Anthropic, or open-weight vLLM). API keys reside exclusively in backend environment variables.',
      icon: Bot,
      category: 'Inference',
      color: 'border-amber-500/40 text-amber-300',
    },
    {
      id: 13,
      title: '13. Response Guard & DLP',
      subtitle: 'Output Validation',
      desc: 'Inspects generated answer, verifies source citations, detects unauthorized leaks, and guarantees responses are grounded only in authorized context.',
      icon: ShieldCheck,
      category: 'Guardrails',
      color: 'border-emerald-500/40 text-emerald-300',
    },
    {
      id: 14,
      title: '14. Answer + Citations + Audit Log',
      subtitle: 'Compliance & Citations',
      desc: 'Delivers verified answer with clickable source citations. Logs ALLOW or DENY decision, user ID, accessed source IDs, and latency into immutable audit storage.',
      icon: ClipboardList,
      category: 'Compliance',
      color: 'border-indigo-500/40 text-indigo-300',
    },
  ];

  const activeNode = selectedNode || pipeline[8]; // Default to Policy Engine

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            SYSTEM BLUEPRINT
          </span>
          <span className="text-xs text-slate-400 font-mono">14-Stage Enterprise Pipeline</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <GitFork className="w-6 h-6 text-indigo-400" />
          Interactive Architecture: Zero-Trust RAG Pipeline
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Click any stage node to inspect its architectural responsibility, security safeguards, and implementation mechanics.
        </p>
      </div>

      {/* Interactive Grid of Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipeline.map((item, idx) => {
          const Icon = item.icon;
          const isSelected = activeNode.id === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedNode(item)}
              className={`p-4 rounded-2xl glass-panel border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/30 shadow-xl shadow-indigo-500/15 ring-1 ring-indigo-500'
                  : item.highlight
                  ? 'border-rose-500/40 bg-rose-950/10 hover:border-rose-500/60'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg bg-slate-900 border flex items-center justify-center ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-400">
                    STAGE {item.id < 10 ? `0${item.id}` : item.id}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white leading-tight">{item.title}</h3>
                  <p className="text-[11px] font-mono text-indigo-400 mt-0.5">{item.subtitle}</p>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{item.category}</span>
                {isSelected && (
                  <span className="text-indigo-300 flex items-center gap-1 font-semibold">
                    ACTIVE <CheckCircle2 className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Deep-Dive Inspection Panel */}
      {activeNode && (
        <div className="p-6 rounded-2xl glass-panel border border-indigo-500/40 bg-indigo-950/20 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                {React.createElement(activeNode.icon, { className: 'w-5 h-5' })}
              </div>
              <div>
                <div className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
                  Stage {activeNode.id} Deep Dive
                </div>
                <h2 className="text-lg font-bold text-white">{activeNode.title}</h2>
              </div>
            </div>

            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-white/10">
              Layer: {activeNode.category}
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">{activeNode.desc}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 font-mono space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">Security Invariant:</span>
              <span className="text-emerald-400">
                {activeNode.id === 9
                  ? 'CRITICAL: PolicyEngine runs BEFORE external AI context assembly. The LLM is never the security boundary.'
                  : activeNode.id === 1
                  ? 'Tenants are cryptographically and query-wise isolated (WHERE tenant_id = authenticatedUser.tenant_id).'
                  : activeNode.id === 12
                  ? 'API Keys (RAG_API_KEY) exist exclusively in backend server memory and are never sent to React.'
                  : 'Strict validation of permissions and data integrity.'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 font-mono space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">Future Roadmap Readiness:</span>
              <span className="text-cyan-300">
                Designed to seamlessly replace external LLM with self-hosted vLLM, private pgvector, or local open-weight models without changing the frontend.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
