import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Building2,
  FileText,
  Network,
  Users,
  KeyRound,
  FileSearch,
  ClipboardList,
  GitFork,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  const primaryItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/chat', label: 'AI Assistant', icon: MessageSquare, highlight: true },
    { to: '/demo', label: 'Security Lab', icon: ShieldAlert, badge: 'USP' },
  ];

  const manageItems = [
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/knowledge', label: 'Knowledge Base', icon: FileText },
    { to: '/connectors', label: 'Connectors', icon: Network },
    { to: '/users', label: 'Users & Roles', icon: Users, adminOnly: true },
    { to: '/groups', label: 'Access Groups', icon: KeyRound, adminOnly: true },
    { to: '/policies', label: 'Policy Engine', icon: ShieldCheck, adminOnly: true },
    { to: '/audit', label: 'Audit Trail', icon: ClipboardList },
    { to: '/architecture', label: 'Architecture', icon: GitFork },
  ];

  const renderNav = (item) => {
    if (item.adminOnly && !isAdmin) return null;
    const Icon = item.icon;

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            isActive
              ? 'bg-indigo-600 text-white shadow-sm'
              : item.highlight
              ? 'text-indigo-400 hover:bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`
        }
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/20">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside className="w-60 bg-slate-950/60 border-r border-white/[0.06] flex flex-col shrink-0 min-h-[calc(100vh-53px)]">
      <div className="p-3 flex-1 space-y-6">
        {/* Core Actions */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Platform
          </div>
          {primaryItems.map(renderNav)}
        </div>

        {/* Management & Governance */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Governance & Data
          </div>
          {manageItems.map(renderNav)}
        </div>
      </div>

      {/* Clean Bottom Policy Badge */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-white/[0.04] text-[11px] text-slate-400 leading-relaxed">
          <div className="flex items-center gap-1.5 text-indigo-400 font-medium mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Zero-Trust Policy</span>
          </div>
          Authorization runs before retrieval. Zero restricted data is exposed to LLM.
        </div>
      </div>
    </aside>
  );
}
