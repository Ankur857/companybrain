import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Filter,
  Shield,
  Clock,
  User,
  Activity,
  FileCode,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function AuditLogs() {
  const { user, tenant } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const loadLogs = () => {
    setLoading(true);
    api.getAuditLogs({
      decision: decisionFilter,
      action: actionFilter,
      tenant_id: tenant?.id,
    })
      .then((res) => {
        if (res.success) setLogs(res.logs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, [tenant, decisionFilter, actionFilter]);

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'ALLOW':
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <CheckCircle2 className="w-3 h-3" /> ALLOW
          </span>
        );
      case 'DENY':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
            <XCircle className="w-3 h-3" /> DENIED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/5">
            {decision}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Audit Trail
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            Enterprise Security & Compliance Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Immutable compliance record capturing every RAG query, policy evaluation, connector synchronization, and document inspection.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-clean p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-mono text-[10px] uppercase">Decision:</span>
          {['ALL', 'ALLOW', 'DENY'].map((d) => (
            <button
              key={d}
              onClick={() => setDecisionFilter(d)}
              className={`px-3 py-1 rounded-lg font-mono text-xs transition-all ${
                decisionFilter === d
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-mono text-[10px] uppercase">Action:</span>
          {['ALL', 'RAG_QUERY', 'DOCUMENT_VIEW', 'CONNECTOR_SYNC', 'AUTH_LOGIN'].map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                actionFilter === a
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-clean overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-white/[0.06] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Decision</th>
                <th className="p-3.5">Policy Justification</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <div>Loading audit trail...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((l) => {
                  const isExpanded = expandedLogId === l.id;

                  return (
                    <React.Fragment key={l.id}>
                      <tr className="hover:bg-white/[0.02] transition-colors font-sans">
                        <td className="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(l.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                          {l.user_name || 'System Service'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/[0.06] font-mono text-[10px] text-indigo-300">
                            {l.action}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {getDecisionBadge(l.decision)}
                        </td>
                        <td className="p-3.5 max-w-md">
                          <div className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                            {l.reason}
                          </div>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : l.id)}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-white font-mono text-[11px] px-2 py-1 rounded bg-slate-900 border border-white/[0.06] transition-colors"
                          >
                            <FileCode className="w-3 h-3 text-indigo-400" />
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-t border-b border-indigo-500/10">
                          <td colSpan="6" className="p-4">
                            <div className="font-mono text-xs text-slate-300 space-y-2 animate-fade-in">
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                Event Payload & Security Context (Record #{l.id}):
                              </div>
                              <pre className="p-3 rounded-xl bg-black/60 border border-white/[0.06] text-emerald-400 text-[11px] overflow-x-auto leading-tight">
                                {JSON.stringify(l.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
