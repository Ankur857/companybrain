import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Network,
  Folder,
  FileText,
  Database,
  Layers,
  BookOpen,
  Users,
  Code,
  CheckCircle2,
  RefreshCw,
  Activity,
  Power,
  Play,
  Clock,
  ShieldCheck,
  AlertCircle,
  HardDrive
} from 'lucide-react';

export function Connectors() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();

  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [testModalData, setTestModalData] = useState(null);

  const loadConnectors = () => {
    setLoading(true);
    api.getConnectors()
      .then((res) => {
        if (res.success) setConnectors(res.connectors || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConnectors();
  }, [tenant]);

  const handleTest = async (connector) => {
    setTestingId(connector.id);
    try {
      const res = await api.testConnector(connector.id);
      setTestModalData(res);
      showToast(`Connection test passed for ${connector.name} (${res.testResult.latencyMs}ms)`, 'success');
    } catch (err) {
      showToast(`Connection test failed: ${err.message}`, 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (connector) => {
    setSyncingId(connector.id);
    try {
      const res = await api.syncConnector(connector.id);
      showToast(`Sync complete: ${res.indexedCount} document(s) ingested and normalized!`, 'success');
      loadConnectors();
    } catch (err) {
      showToast(`Sync error: ${err.message}`, 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const getConnectorIcon = (type) => {
    switch (type) {
      case 'google_drive': return Folder;
      case 'sharepoint': return FileText;
      case 'mongodb': return Database;
      case 'supabase': return Layers;
      case 'confluence': return BookOpen;
      case 'crm': return Users;
      case 'generic_api': default: return Code;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        );
      case 'DEMO / SAMPLE DATA':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono font-medium">
            <Activity className="w-3 h-3" /> Sample Active
          </span>
        );
      case 'SYNCING':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono font-medium animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-white/5 text-[11px] font-mono">
            <Power className="w-3 h-3" /> Idle
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Integrations
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            Enterprise Data Connectors
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Unified adapter framework connecting enterprise data repositories. Connectors ingest, map fields to canonical schema, and index into the tenant-isolated knowledge repository.
          </p>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map((c) => {
          const Icon = getConnectorIcon(c.type);
          const isSyncing = syncingId === c.id;
          const isTesting = testingId === c.id;

          return (
            <div
              key={c.id}
              className="card-clean card-interactive p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-center text-indigo-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  {getStatusBadge(c.status)}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">Adapter: {c.type}</div>
                </div>

                {/* Metrics */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Indexed Documents:</span>
                    <span className="font-semibold text-white font-mono">{c.document_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Sync Pipeline:</span>
                    <span className="font-mono text-indigo-300 text-[11px]">{c.sync_status || 'READY'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Last Updated:</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {c.last_sync_at ? new Date(c.last_sync_at).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTest(c)}
                  disabled={isTesting || isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 border border-white/[0.08] text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
                  <span>{isTesting ? 'Testing...' : 'Test'}</span>
                </button>

                <button
                  onClick={() => handleSync(c)}
                  disabled={isSyncing || isTesting}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Connection Details Modal */}
      {testModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-md p-5 border border-white/[0.12] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Connection Verified</h3>
                <p className="text-xs text-slate-400 font-mono">{testModalData.connector}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-white/[0.06] font-mono text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Latency:</span>
                <span className="text-emerald-400 font-semibold">{testModalData.testResult?.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="text-slate-200">{testModalData.testResult?.service || 'Connected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400">Authenticated & Ready</span>
              </div>
            </div>

            <button
              onClick={() => setTestModalData(null)}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
