import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  Users,
  Network,
  FileText,
  KeyRound,
  CheckCircle2,
  Shield,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Companies() {
  const { user, tenant, switchTenant } = useAuth();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const loadCompanies = () => {
    setLoading(true);
    api.getCompanies()
      .then((res) => {
        if (res.success) setCompanies(res.companies || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCompanies();
  }, [tenant]);

  const handleSwitch = async (id) => {
    const success = await switchTenant(id);
    if (success) {
      loadCompanies();
    }
  };

  const isSuperAdmin = user?.role_name === 'Super Admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Multi-Tenant Companies
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Segmented enterprise environments. Data, users, groups, connectors, and documents are 100% isolated by tenant boundary.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => showToast('Tenant provisioning is enabled for Super Admin', 'info')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Company</span>
          </button>
        )}
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {companies.map((c) => {
          const isCurrent = tenant?.id === c.id;
          const canAccess = isSuperAdmin || isCurrent;

          return (
            <div
              key={c.id}
              className={`p-6 rounded-2xl glass-panel border flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/10 bg-indigo-950/20'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-lg">
                    {c.name[0]}
                  </div>

                  {isCurrent ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ACTIVE CONTEXT
                    </span>
                  ) : canAccess ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                      AUTHORIZED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-500/20">
                      STRICTLY ISOLATED
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{c.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.description || 'Enterprise Organization'}</p>
                  <div className="text-[10px] font-mono text-slate-500 mt-2 truncate">
                    TENANT ID: {c.id}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Users</span>
                    <span className="font-bold text-white text-sm">{c.usersCount || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Documents</span>
                    <span className="font-bold text-white text-sm">{c.documentsCount || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Connectors</span>
                    <span className="font-bold text-white text-sm">{c.connectorsCount || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Access Groups</span>
                    <span className="font-bold text-white text-sm">{c.groupsCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-white/5 flex items-center gap-2">
                {isCurrent ? (
                  <Link
                    to="/knowledge"
                    className="w-full py-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-semibold text-center hover:bg-indigo-600/40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Explore Tenant Knowledge</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : canAccess ? (
                  <button
                    onClick={() => handleSwitch(c.id)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Switch to this Tenant</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-slate-500 text-xs font-mono text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cross-Tenant Restricted</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
