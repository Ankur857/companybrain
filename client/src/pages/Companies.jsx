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
  Plus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Companies() {
  const { user, tenant, switchTenant } = useAuth();
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Multi-Tenancy
            </span>
            <span className="text-xs text-slate-400">Strict Cryptographic & Query Partitioning</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Enterprise Tenants
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Enterprise organizations operating on isolated database partitions. Documents, users, access groups, and connectors are strictly scoped to their tenant boundary.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => showToast('Tenant provisioning is enabled for Super Admin', 'info')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Tenant</span>
          </button>
        )}
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {companies.map((c) => {
          const isCurrent = tenant?.id === c.id;
          const canAccess = isSuperAdmin || isCurrent;

          return (
            <div
              key={c.id}
              className={`card-clean p-5 flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-indigo-500/40 bg-indigo-950/15 ring-1 ring-indigo-500/30'
                  : 'hover:border-white/[0.12]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {c.name[0]}
                  </div>

                  {isCurrent ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Tenant
                    </span>
                  ) : canAccess ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-white/[0.06]">
                      Authorized
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Isolated
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">{c.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {c.description || 'Enterprise Workspace'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 mt-2 truncate">
                    ID: {c.id}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                    <span className="text-slate-500 text-[10px] block">Users</span>
                    <span className="font-semibold text-white text-xs">{c.usersCount || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                    <span className="text-slate-500 text-[10px] block">Documents</span>
                    <span className="font-semibold text-white text-xs">{c.documentsCount || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                    <span className="text-slate-500 text-[10px] block">Connectors</span>
                    <span className="font-semibold text-white text-xs">{c.connectorsCount || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/[0.04]">
                    <span className="text-slate-500 text-[10px] block">Access Groups</span>
                    <span className="font-semibold text-white text-xs">{c.groupsCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-white/[0.06] flex items-center gap-2">
                {isCurrent ? (
                  <Link
                    to="/knowledge"
                    className="w-full py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium text-center hover:bg-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Browse Knowledge</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : canAccess ? (
                  <button
                    onClick={() => handleSwitch(c.id)}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Switch Tenant Context</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="w-full py-2 rounded-xl bg-slate-950/60 border border-white/[0.04] text-slate-500 text-xs font-mono text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
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
