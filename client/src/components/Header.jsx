import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import {
  Shield,
  Building2,
  ChevronDown,
  LogOut,
  Users,
  Check,
  CheckCircle2,
  Lock,
  UserPlus,
  LogIn
} from 'lucide-react';

export function Header() {
  const { user, tenant, companies, personas, switchTenant, quickLoginAs, logout, openAuthModal } = useAuth();
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
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/60 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand Link to AI Agent */}
        <Link to="/chat" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shadow-sm group-hover:border-indigo-400/50 transition-colors">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                CompanyBrain
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                ENTERPRISE
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:block">
              Permission-aware AI knowledge platform
            </span>
          </div>
        </Link>

        {/* Center: Subtle Security Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/[0.06] text-[11px] text-slate-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Tenant Isolation Enforced</span>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-400">Pre-RAG Policy Engine</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Active Company Selector */}
          <div className="relative" ref={companyRef}>
            <button
              onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-200 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-white max-w-[130px] truncate">{tenant?.name || 'Company'}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showCompanyMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-50 animate-fade-in">
                <div className="px-2.5 py-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Company Tenants
                </div>
                <div className="space-y-0.5">
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
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-medium'
                            : canSwitch
                            ? 'text-slate-300 hover:bg-white/[0.06]'
                            : 'opacity-40 cursor-not-allowed text-slate-500'
                        }`}
                      >
                        <div className="truncate">
                          <div className="truncate font-medium">{c.name}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {c.documentsCount || 0} docs • {c.usersCount || 0} users
                          </div>
                        </div>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        ) : !canSwitch ? (
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-500">
                            LOCKED
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Demo Persona Switcher */}
          <div className="relative" ref={personaRef}>
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 text-indigo-300 text-xs font-medium transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Persona</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-50 animate-fade-in max-h-96 overflow-y-auto">
                <div className="px-2.5 py-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Switch User Persona
                </div>
                <div className="space-y-0.5">
                  {personas.map((p) => {
                    const isCurrent = user?.email === p.email;
                    return (
                      <button
                        key={p.email}
                        onClick={() => {
                          quickLoginAs(p.email);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                          isCurrent
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{p.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isCurrent ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {p.role}
                          </span>
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isCurrent ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {p.company} • {p.department}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sign In / Register Action (Always clearly visible) */}
          <button
            onClick={openAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>

          {/* User Profile Info & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
              <div
                className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0"
                title={`${user.name} (${user.email})`}
              >
                {user.name?.[0] || 'U'}
              </div>
              <span className="text-xs text-slate-200 font-medium hidden xl:inline max-w-[110px] truncate">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/[0.08] transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
