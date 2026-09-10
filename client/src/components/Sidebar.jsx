import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquareText,
  ShieldAlert,
  Building2,
  FileText,
  Network,
  Users,
  KeyRound,
  ShieldCheck,
  ClipboardList,
  GitFork,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'AI Assistant', icon: MessageSquareText, highlight: true },
    { to: '/demo', label: 'Security Demo', icon: ShieldAlert, badge: 'USP Test' },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/knowledge', label: 'Knowledge Sources', icon: FileText },
    { to: '/connectors', label: 'Connectors', icon: Network },
    { to: '/users', label: 'Users & Roles', icon: Users, adminOnly: true },
    { to: '/groups', label: 'Access Groups', icon: KeyRound, adminOnly: true },
    { to: '/policies', label: 'Policy Engine', icon: ShieldCheck, adminOnly: true },
    { to: '/audit', label: 'Audit Logs', icon: ClipboardList },
    { to: '/architecture', label: 'Architecture', icon: GitFork },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-white/10 flex flex-col shrink-0 min-h-[calc(100vh-61px)]">
      <div className="p-4 flex-1 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Enterprise Navigation
        </div>

        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : item.highlight
                    ? 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Security Governance Footer Badge */}
      <div className="p-4 border-t border-white/10">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero-Trust RAG Rule</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The LLM is never the authorization boundary. Context is filtered strictly before external processing.
          </p>
        </div>
      </div>
    </aside>
  );
}
