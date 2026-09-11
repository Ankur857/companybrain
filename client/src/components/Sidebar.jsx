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
  const { user, tenant, openAuthModal } = useAuth();
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  const primaryItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/chat', label: 'AI Assistant', icon: MessageSquare, highlight: true },
    { to: '/demo', label: 'Security Lab', icon: ShieldAlert, badge: 'USP' },
  ];

  const manageItems = [
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/knowledge', label: 'Knowledge Base', icon: FileText },
    { to: '/connectors', label: 'Knowledge Sources', icon: Network, adminOnly: true },
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
    <aside className="w-60 bg-slate-900/90 border-r border-slate-700/60 flex flex-col shrink-0 min-h-[calc(100vh-53px)]">
      <div className="p-3 flex-1 space-y-5">
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

      {/* Prominent Login / Signup Action & Session Info */}
      <div className="p-3 border-t border-slate-700/60 space-y-2">
        <button
          onClick={openAuthModal}
          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Sign In / Register</span>
        </button>

        <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/60 text-[11px] text-slate-300 leading-relaxed">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
            <span>SESSION</span>
            <span className="text-emerald-400 font-semibold">ACTIVE</span>
          </div>
          <div className="font-semibold text-white truncate">{user?.name || 'Guest User'}</div>
          <div className="text-[10px] text-indigo-300 truncate">{tenant?.name || 'Acme Technologies'}</div>
        </div>
      </div>
    </aside>
  );
}
