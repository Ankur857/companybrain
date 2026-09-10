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
  Lock,
  Search
} from 'lucide-react';

export function UsersPage() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getUsers()
      .then((res) => {
        if (res.success) setUsers(res.users || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenant]);

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase()) ||
    u.role_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Identity Directory
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Users & Roles Management
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Role-based access control (RBAC) and access group clearance memberships for tenant personnel.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card-clean p-3 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, department..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none transition-all placeholder:text-slate-500"
          />
        </div>
        <div className="text-xs font-mono text-slate-400 pr-2">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Users Table */}
      <div className="card-clean overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-white/[0.06] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Clearance Groups</th>
                <th className="p-3.5">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <div>Loading user directory...</div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
                          {u.name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs">{u.name}</div>
                          <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-200">
                      {u.department || 'General'}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                        <Shield className="w-3 h-3" />
                        {u.role_name}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {(u.access_groups || []).map((g) => (
                          <span
                            key={g.id || g}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-white/[0.06]"
                          >
                            {g.name || g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
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
