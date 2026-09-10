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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              CLEARANCE GROUPS
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-indigo-400" />
            Access Groups & Clearances
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access groups answer: "Who is allowed to access this data?" Users can belong to multiple groups to retrieve confidential project or department knowledge.
          </p>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((grp) => {
          const userIsInGroup = (user?.access_groups || []).some(
            (g) => g.id === grp.id || g.name === grp.name
          );

          return (
            <div
              key={grp.id}
              className={`p-6 rounded-2xl glass-panel border transition-all flex flex-col justify-between space-y-4 ${
                userIsInGroup ? 'border-indigo-500/40 bg-indigo-950/10' : 'border-white/10'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  {userIsInGroup ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> YOU ARE A MEMBER
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-white/5">
                      NOT A MEMBER
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{grp.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{grp.description || 'Access boundary group.'}</p>
                </div>

                {/* Members List */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Enrolled Members ({grp.membersCount || 0}):</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(grp.members || []).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-300"
                      >
                        <span className="font-semibold text-white">{m.name}</span>
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
