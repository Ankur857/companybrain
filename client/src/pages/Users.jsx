import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Users,
  UserCheck,
  Shield,
  Plus,
  Mail,
  Building,
  KeyRound,
  CheckCircle2,
  Lock
} from 'lucide-react';

export function UsersPage() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getUsers()
      .then((res) => {
        if (res.success) setUsers(res.users || []);
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
              TENANT USER DIRECTORY
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Users & Roles Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Role-based access control (RBAC) and access group membership assignments for tenant personnel.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Department</th>
                <th className="p-4">Role</th>
                <th className="p-4">Access Groups</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <div>Loading users...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No users found in this tenant.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{u.name}</div>
                      <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {u.email}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-200">
                      {u.department || 'General'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        <Shield className="w-3 h-3" />
                        {u.role_name}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {(u.access_groups || []).map((g) => (
                          <span
                            key={g.id || g}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5"
                          >
                            {g.name || g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> {u.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
