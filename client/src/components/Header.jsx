import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Building2,
  ChevronDown,
  UserCheck,
  LogOut,
  Sparkles,
  Lock,
  CheckCircle2,
  Users
} from 'lucide-react';

export function Header() {
  const { user, tenant, companies, personas, switchTenant, quickLoginAs, logout } = useAuth();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const companyRef = useRef(null);
  const personaRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (companyRef.current && !companyRef.current.contains(e.target)) setShowCompanyMenu(false);
      if (personaRef.current && !personaRef.current.contains(e.target)) setShowPersonaMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Slogan */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                CompanyBrain
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Right information. Right person. Right permission.
            </p>
          </div>
        </div>

        {/* Center: Real-Time Security Status Badges */}
        <div className="hidden xl:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            Tenant Isolation: ACTIVE
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
            <Lock className="w-3 h-3 text-indigo-400" />
            Pre-RAG Policy Engine: ACTIVE
          </div>
        </div>

        {/* Right: Tenant Switcher, Persona Quick-Switch, and Profile */}
        <div className="flex items-center gap-3">
          {/* Active Company Selector */}
          <div className="relative" ref={companyRef}>
            <button
              onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-indigo-500/40 transition-all text-xs font-medium text-slate-200"
              title="Active Company Tenant"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              <div className="text-left hidden md:block">
                <div className="text-[10px] text-slate-400 leading-none">ACTIVE TENANT</div>
                <div className="font-semibold text-white">{tenant?.name || 'Company'}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showCompanyMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel border border-white/10 shadow-2xl p-2 z-50 animate-slide-up">
                <div className="px-3 py-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/5">
                  Tenant Isolation Boundary
                </div>
                <div className="py-1 space-y-1">
                  {companies.map((c) => {
                    const isSelected = tenant?.id === c.id;
                    const canSwitch = user?.role_name === 'Super Admin' || isSelected;

                    return (
                      <button
                        key={c.id}
                        disabled={!canSwitch}
                        onClick={() => {
                          if (canSwitch && !isSelected) switchTenant(c.id);
                          setShowCompanyMenu(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                            : canSwitch
                            ? 'hover:bg-white/5 text-slate-300'
                            : 'opacity-40 cursor-not-allowed text-slate-500'
                        }`}
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            {c.name}
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {c.documentsCount || 0} docs • {c.usersCount || 0} users
                          </div>
                        </div>
                        {!canSwitch && (
                          <span className="text-[9px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                            ISOLATED
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Persona Switcher (Crucial for Demo) */}
          <div className="relative" ref={personaRef}>
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-950/70 text-indigo-200 text-xs font-medium transition-all"
              title="Test as different employee persona"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Switch Demo Persona</span>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel border border-white/10 shadow-2xl p-2 z-50 animate-slide-up max-h-[80vh] overflow-y-auto">
                <div className="px-3 py-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/5">
                  1-Click Role & Clearance Personas
                </div>
                <div className="py-1 space-y-1">
                  {personas.map((p) => {
                    const isCurrent = user?.email === p.email;
                    return (
                      <button
                        key={p.email}
                        onClick={() => {
                          quickLoginAs(p.email);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all ${
                          isCurrent
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'hover:bg-white/5 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{p.name}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              isCurrent
                                ? 'bg-indigo-900 text-indigo-100'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {p.role}
                          </span>
                        </div>
                        <div className="text-[11px] opacity-80 flex items-center gap-1">
                          <span>{p.company}</span> • <span>{p.department}</span>
                        </div>
                        {p.groups?.length > 0 && (
                          <div className="mt-1 flex gap-1 flex-wrap">
                            {p.groups.map((g) => (
                              <span
                                key={g}
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/30 border border-white/5"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Current User Pill & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
              <div className="text-[10px] font-mono text-indigo-400 leading-tight">
                {user?.role_name}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
