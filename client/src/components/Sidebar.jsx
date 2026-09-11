import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  FolderKanban,
  FileText,
  Users,
  KeyRound,
  ClipboardList,
  Settings,
  Shield,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { user, tenant, openAuthModal } = useAuth();
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  const primaryNav = [
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/knowledge', label: 'Knowledge Sources', icon: FileText },
  ];

  const adminNav = [
    { to: '/users', label: 'Users', icon: Users },
    { to: '/groups', label: 'Access Control', icon: KeyRound },
    { to: '/audit', label: 'Audit Logs', icon: ClipboardList },
  ];

  const renderStandardNav = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            isActive
              ? 'bg-slate-800 text-white font-semibold border border-white/[0.08] shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`
        }
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 shrink-0 text-slate-400" />
          <span>{item.label}</span>
        </div>
      </NavLink>
    );
  };

  return (
    <aside className="w-60 bg-slate-950 border-r border-white/[0.08] flex flex-col shrink-0 min-h-[calc(100vh-53px)]">
      <div className="p-3 flex-1 space-y-4">
        {/* HERO NAVIGATION ITEM: AI AGENT */}
        <div>
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40 font-bold'
                  : 'bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/50 font-semibold'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/25 border border-indigo-400/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <span className="text-xs tracking-tight font-bold text-white">AI Agent</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-400/30">
              CORE
            </span>
          </NavLink>
        </div>

        {/* PRIMARY SECTION */}
        <div className="space-y-1">
          {primaryNav.map(renderStandardNav)}
        </div>

        {/* ADMIN SECTION (Gated to Company Admin & Super Admin) */}
        {isAdmin && (
          <div className="pt-2">
            <div className="border-t border-white/[0.06] pt-3 pb-1 px-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Admin
            </div>
            <div className="space-y-1">
              {adminNav.map(renderStandardNav)}
            </div>
          </div>
        )}

        {/* SETTINGS SECTION */}
        <div className="pt-2">
          <div className="border-t border-white/[0.06] pt-3 pb-1 px-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            System
          </div>
          <NavLink
            to="/companies"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold border border-white/[0.08] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Settings</span>
            </div>
          </NavLink>
        </div>
      </div>

      {/* USER & SESSION FOOTER */}
      <div className="p-3 border-t border-white/[0.08] space-y-2">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/[0.06] text-[11px] text-slate-300 leading-relaxed">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
            <span>SESSION</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ACTIVE
            </span>
          </div>
          <div className="font-semibold text-white truncate">{user?.name || 'Guest User'}</div>
          <div className="text-[10px] text-indigo-300 truncate flex items-center justify-between mt-0.5">
            <span className="truncate">{tenant?.name || 'CompanyBrain'}</span>
            <span className="text-slate-500 font-mono text-[9px]">{user?.role_name || 'Member'}</span>
          </div>
        </div>

        <button
          onClick={openAuthModal}
          className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <KeyRound className="w-3 h-3 text-slate-400" />
          <span>Switch Persona / Auth</span>
        </button>
      </div>
    </aside>
  );
}
