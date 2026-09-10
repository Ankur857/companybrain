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
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export function Architecture() {
  const [selectedNode, setSelectedNode] = useState(null);

  const pipeline = [
    {
      id: 1,
      title: '1. Multi-Company Tenants',
      subtitle: 'Tenant Partitioning',
      desc: 'Acme Technologies, Nova Finance, and Orbit Systems maintain completely partitioned database schemas. Cross-company access is strictly barred by server-side query filters.',
      icon: Building2,
      category: 'Isolation',
    },
    {
      id: 2,
      title: '2. Connectors Framework',
      subtitle: 'Data Ingestion',
      desc: 'Connects to Google Drive, SharePoint, MongoDB, Supabase, Confluence, CRM, and REST APIs. Connectors run on a unified adapter interface with connection testing and sync triggers.',
      icon: Network,
      category: 'Ingestion',
    },
    {
      id: 3,
      title: '3. Semantic Normalization',
      subtitle: 'Canonical Schema',
      desc: 'Transforms heterogeneous source fields (e.g. dept, division, org_unit -> department; emp_name, staff_name -> owner; project_code -> project) into a canonical enterprise schema.',
      icon: Layers,
      category: 'Transformation',
    },
    {
      id: 4,
      title: '4. Common Knowledge Model',
      subtitle: 'Canonical Documents',
      desc: 'Every piece of indexed information is stored in a standardized document structure with tenant_id, source metadata, versioning, and group requirements.',
      icon: FileText,
      category: 'Data Model',
    },
    {
      id: 5,
      title: '5. Classification & Clearance',
      subtitle: 'Sensitivity Matrix',
      desc: 'Documents are tagged with PUBLIC, INTERNAL, CONFIDENTIAL, or HIGHLY_CONFIDENTIAL classifications, bound to explicit access groups (e.g. Engineering, HR, Project-Alpha).',
      icon: KeyRound,
      category: 'Security',
    },
    {
      id: 6,
      title: '6. Isolated Knowledge Index',
      subtitle: 'PostgreSQL Database',
      desc: 'PostgreSQL repository storing documents, chunks, permissions, and metadata. Queries enforce WHERE tenant_id = authenticatedUser.tenant_id at all times.',
      icon: Database,
      category: 'Storage',
    },
    {
      id: 7,
      title: '7. Authentication Gateway',
      subtitle: 'Bearer JWT Verification',
      desc: 'Employees authenticate with credentials. The server issues a cryptographically signed JWT containing verified userId, tenantId, and roleName. Frontend tenant_id is NEVER trusted.',
      icon: Lock,
      category: 'Auth',
    },
    {
      id: 8,
      title: '8. User Clearance Hydration',
      subtitle: 'RBAC & Access Groups',
      desc: 'Server hydrates the user clearance profile (e.g. Rahul -> Role: Employee, Department: Engineering, Access Groups: [Engineering, Project-Alpha]).',
      icon: UserCheck,
      category: 'Identity',
    },
    {
      id: 9,
      title: '9. Centralized Policy Engine',
      subtitle: 'Zero-Trust Gate (canAccess)',
      desc: 'Evaluates tenant boundary, account status, classification level, department clearance, and group intersection. CRITICAL: Evaluated BEFORE RAG context is compiled.',
      icon: Shield,
      category: 'Security Gate',
      highlight: true,
    },
    {
      id: 10,
      title: '10. Permission-Aware Retrieval',
      subtitle: 'Candidate Pruning',
      desc: 'Candidate search retrieves only documents that the user has explicit permission to view. Unauthorized documents are pruned entirely from the retrieval set.',
      icon: Search,
      category: 'Retrieval',
    },
    {
      id: 11,
      title: '11. Authorized Context Assembly',
      subtitle: 'Prompt Injection Defense',
      desc: 'Sanitized authorized sources are enclosed in XML delimiters with strict system instructions establishing documents as untrusted reference data, not instructions.',
      icon: FileText,
      category: 'Context',
    },
    {
      id: 12,
      title: '12. External RAG / LLM API',
      subtitle: 'AI Provider Gateway',
      desc: 'Dispatches authorized prompt to external LLM (OpenAI, Anthropic, or open-weight vLLM). API keys reside exclusively in backend environment variables.',
      icon: Bot,
      category: 'Inference',
    },
    {
      id: 13,
      title: '13. Response Guard & DLP',
      subtitle: 'Output Validation',
      desc: 'Inspects generated answer, verifies source citations, detects unauthorized leaks, and guarantees responses are grounded only in authorized context.',
      icon: ShieldCheck,
      category: 'Guardrails',
    },
    {
      id: 14,
      title: '14. Citations & Audit Logging',
      subtitle: 'Compliance Recording',
      desc: 'Delivers verified answer with clickable source citations. Logs ALLOW or DENY decision, user ID, accessed source IDs, and latency into immutable audit storage.',
      icon: ClipboardList,
      category: 'Compliance',
    },
  ];

  const activeNode = selectedNode || pipeline[8]; // Default to Policy Engine

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            System Architecture
          </span>
          <span className="text-xs text-slate-400 font-mono">14-Stage Enterprise Pipeline</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <GitFork className="w-5 h-5 text-indigo-400" />
          Zero-Trust Permission-Aware RAG Pipeline
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Select any pipeline stage to inspect its security invariants, data flow, and implementation mechanics.
        </p>
      </div>

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {pipeline.map((item) => {
          const Icon = item.icon;
          const isSelected = activeNode.id === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedNode(item)}
              className={`card-clean p-4 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500/60 bg-indigo-950/20 ring-1 ring-indigo-500/40 shadow-sm'
                  : item.highlight
                  ? 'border-rose-500/30 bg-rose-950/10 hover:border-rose-500/50'
                  : 'hover:border-white/[0.12]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/[0.08] flex items-center justify-center text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-white/[0.04]">
                    STAGE {item.id < 10 ? `0${item.id}` : item.id}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-white leading-tight">{item.title}</h3>
                  <p className="text-[11px] font-mono text-indigo-300 mt-0.5">{item.subtitle}</p>
                </div>
              </div>

              <div className="pt-2.5 mt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{item.category}</span>
                {isSelected && (
                  <span className="text-indigo-400 flex items-center gap-1 font-semibold">
                    Inspecting <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Deep-Dive Inspection Panel */}
      {activeNode && (
        <div className="card-clean p-6 space-y-4 animate-fade-in border-indigo-500/30 bg-indigo-950/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                {React.createElement(activeNode.icon, { className: 'w-5 h-5' })}
              </div>
              <div>
                <div className="text-[11px] font-mono text-indigo-400 font-medium uppercase tracking-wider">
                  Stage {activeNode.id} Deep Dive
                </div>
                <h2 className="text-base font-bold text-white">{activeNode.title}</h2>
              </div>
            </div>

            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-white/[0.08]">
              Pipeline Layer: {activeNode.category}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">{activeNode.desc}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] font-mono space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">
                Security Invariant:
              </span>
              <span className="text-emerald-400 leading-relaxed block text-[11px]">
                {activeNode.id === 9
                  ? 'CRITICAL: PolicyEngine runs BEFORE external AI context assembly. The LLM is never the security boundary.'
                  : activeNode.id === 1
                  ? 'Tenants are strictly partitioned at the query level (WHERE tenant_id = authenticatedUser.tenant_id).'
                  : activeNode.id === 12
                  ? 'API Keys (RAG_API_KEY) exist exclusively in backend environment variables and never touch frontend code.'
                  : 'Zero-trust validation of permissions, classification metadata, and token boundaries.'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] font-mono space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">
                Production Extensibility:
              </span>
              <span className="text-slate-300 leading-relaxed block text-[11px]">
                The modular architecture easily supports self-hosted vLLM, private pgvector indexing, and external enterprise SSO (Okta, Azure AD) without breaking client contracts.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
