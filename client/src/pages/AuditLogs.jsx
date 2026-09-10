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
  Search
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
          <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> ALLOW
          </span>
        );
      case 'DENY':
      case 'FAILED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> DENIED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/5">
            {decision}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              SECURITY AUDIT TRAIL
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-400" />
            Enterprise Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable compliance record of every RAG query, policy evaluation decision, connector sync, and document view.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-mono text-[10px] uppercase">Decision Filter:</span>
          {['ALL', 'ALLOW', 'DENY'].map((d) => (
            <button
              key={d}
              onClick={() => setDecisionFilter(d)}
              className={`px-3 py-1.5 rounded-xl font-mono transition-all ${
                decisionFilter === d
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-mono text-[10px] uppercase">Action Filter:</span>
          {['ALL', 'RAG_QUERY', 'DOCUMENT_VIEW', 'CONNECTOR_SYNC', 'AUTH_LOGIN'].map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] transition-all ${
                actionFilter === a
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Decision</th>
                <th className="p-4">Reason / Policy Justification</th>
                <th className="p-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <div>Loading audit logs...</div>
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
                      <tr className="hover:bg-white/5 transition-colors font-sans">
                        <td className="p-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(l.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="p-4 font-semibold text-white whitespace-nowrap">
                          {l.user_name || 'System'}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 font-mono text-[11px] text-indigo-300">
                            {l.action}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {getDecisionBadge(l.decision)}
                        </td>
                        <td className="p-4 max-w-md">
                          <div className="line-clamp-2 text-slate-300 text-xs leading-relaxed">
                            {l.reason}
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : l.id)}
                            className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] underline flex items-center gap-1"
                          >
                            <FileCode className="w-3 h-3" />
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-t border-b border-indigo-500/20">
                          <td colSpan="6" className="p-4">
                            <div className="font-mono text-xs text-slate-300 space-y-2">
                              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                                Event Payload & Security Metadata (ID: {l.id}):
                              </div>
                              <pre className="p-3 rounded-xl bg-black/60 border border-white/5 text-emerald-400 text-[11px] overflow-x-auto">
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
