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
  Lock,
  Clock,
  ExternalLink,
  FolderKanban,
  Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAudits, setRecentAudits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pendingExperiencesCount, setPendingExperiencesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDashboardStats(),
      api.getAuditLogs({ limit: 6 }),
      api.getProjects().catch(() => ({ success: false, projects: [] })),
      isAdmin ? api.getAdminExperienceApprovals('PENDING').catch(() => ({ experiences: [] })) : Promise.resolve({ experiences: [] }),
    ])
      .then(([statsRes, auditsRes, projRes, expsRes]) => {
        if (statsRes.success) setStats(statsRes.stats);
        if (auditsRes.success) setRecentAudits(auditsRes.logs || []);
        if (projRes.success) setProjects(projRes.projects || []);
        if (expsRes?.experiences) setPendingExperiencesCount(expsRes.experiences.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenant, isAdmin]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-indigo-400">ORGANIZATION WORKSPACE</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-medium text-slate-300">{tenant?.name}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Security & Knowledge Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            CompanyBrain isolates enterprise knowledge by company tenant, pre-filters access by policy, and guarantees that models never see unauthorized information.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/chat"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open AI Assistant</span>
          </Link>
          <Link
            to="/demo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-white/[0.08] hover:border-white/20 text-slate-200 text-xs font-medium transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Security Lab</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-clean p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Documents Indexed</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.indexedDocuments ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Common knowledge model</div>
        </div>

        <div className="card-clean p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Data Sources</span>
            <Network className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.connectedSources ?? 0} <span className="text-xs text-slate-500 font-normal">/ {stats?.totalSources ?? 0}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Connected connectors</div>
        </div>

        <div className="card-clean p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Active Members</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.totalUsers ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across {stats?.accessGroupsCount ?? 0} access groups</div>
        </div>

        <div className="card-clean p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Queries Protected</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.queriesTotal ?? 0}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <span>{stats?.allowedQueries ?? 0} allowed</span>
            <span>•</span>
            <span className="text-rose-400/80">{stats?.deniedQueries ?? 0} blocked</span>
          </div>
        </div>
      </div>

      {/* Admin Experience Approvals Banner / Card */}
      {isAdmin && (
        <div className="card-clean p-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Experience Approvals</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                  {pendingExperiencesCount} Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Employees have submitted real technical experiences awaiting administrative verification.
              </p>
            </div>
          </div>
          <Link
            to="/experience"
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <span>Review Submissions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Projects & Fast Onboarding Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Assigned Projects & Fast Onboarding
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/20">
                PROJECT INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore system architecture, services, databases, and APIs for projects you are cleared to access.
            </p>
          </div>
          <Link
            to="/projects"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="card-clean p-6 text-center text-xs text-slate-500">
            No projects assigned yet. Explore knowledge base or contact your workspace administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 3).map((proj) => (
              <div
                key={proj.id}
                className="card-clean p-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                      {proj.code}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {proj.knowledge_count || 0} Sources Cleared
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mb-1">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {proj.description || 'Enterprise project repository & knowledge base.'}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/projects/${proj.id}/understand`)}
                  className="w-full py-2 px-3 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Understand Project</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Governance & Recent Queries 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Controls Status */}
        <div className="card-clean p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              Security Architecture
            </h2>
            <Link to="/architecture" className="text-[11px] text-indigo-400 hover:text-indigo-300">
              Pipeline →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/70 border border-white/[0.04] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200">Tenant Isolation</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ENFORCED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Database queries strictly scoped to current tenant. Zero cross-company retrieval.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/70 border border-white/[0.04] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200">Pre-Retrieval Policy Engine</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Clearance evaluated before RAG assembly. The LLM is never the authorization layer.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/70 border border-white/[0.04] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200">Response Guard & DLP</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  MONITORING
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Citations verified against authorized pool. Prevents leakage of restricted titles.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/70 border border-white/[0.04] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200">AI Model Credentials</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                  BACKEND-ONLY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                API keys reside exclusively in server memory. Zero client-side API exposure.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Access & Query Audit Log */}
        <div className="lg:col-span-2 card-clean p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Recent Query Decisions
            </h2>
            <Link to="/audit" className="text-[11px] text-indigo-400 hover:text-indigo-300">
              View All Logs →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 font-mono text-[10px] uppercase border-b border-white/[0.04]">
                  <th className="pb-2">User</th>
                  <th className="pb-2">Query / Action</th>
                  <th className="pb-2">Policy Decision</th>
                  <th className="pb-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {recentAudits.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">
                      No query activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentAudits.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-medium text-slate-200 whitespace-nowrap">
                        {item.user_name}
                      </td>
                      <td className="py-3 max-w-xs truncate pr-4 text-slate-400">
                        {item.metadata?.query || item.reason || item.action}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        {item.decision === 'ALLOW' || item.decision === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> ALLOW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <XCircle className="w-3 h-3" /> DENIED
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right text-[10px] font-mono text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
