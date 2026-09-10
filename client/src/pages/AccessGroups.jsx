import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  KeyRound,
  Users,
  Shield,
  Plus,
  UserCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

export function AccessGroups() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getGroups()
      .then((res) => {
        if (res.success) setGroups(res.groups || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenant]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Clearance Boundaries
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            Access Groups & Clearances
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Access groups answer: "Who is authorized to access this data?" Users inherit membership to retrieve confidential project or department knowledge.
          </p>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map((grp) => {
          const userIsInGroup = (user?.access_groups || []).some(
            (g) => g.id === grp.id || g.name === grp.name
          );

          return (
            <div
              key={grp.id}
              className={`card-clean p-5 flex flex-col justify-between space-y-4 transition-all ${
                userIsInGroup ? 'border-indigo-500/30 bg-indigo-950/15' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-center text-indigo-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  {userIsInGroup ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Member
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-white/[0.06]">
                      Not Enrolled
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">{grp.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{grp.description || 'Access boundary clearance group.'}</p>
                </div>

                {/* Members List */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Enrolled Members ({grp.membersCount || 0}):</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(grp.members || []).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-white/[0.04] text-xs text-slate-300"
                      >
                        <span className="font-medium text-white text-xs">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.department}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
