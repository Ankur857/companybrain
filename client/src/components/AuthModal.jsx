import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  Mail,
  User,
  Building2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Briefcase
} from 'lucide-react';

export function AuthModal({ isOpen, onClose }) {
  const { user, tenant, companies, personas, login, signup, quickLoginAs } = useAuth();

  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [signupMode, setSignupMode] = useState('JOIN_TENANT'); // 'JOIN_TENANT' | 'NEW_TENANT'
  const [loading, setLoading] = useState(false);

  // Login Form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [selectedTenantId, setSelectedTenantId] = useState(companies[0]?.id || '');
  const [companyName, setCompanyName] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoading(true);
    const success = await login(loginEmail, loginPassword);
    setLoading(false);
    if (success) onClose();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      mode: signupMode,
      name,
      email,
      password,
      department,
      ...(signupMode === 'JOIN_TENANT'
        ? { tenantId: selectedTenantId || companies[0]?.id }
        : { companyName }),
    };

    const success = await signup(payload);
    setLoading(false);
    if (success) onClose();
  };

  const handleQuickPersona = async (pEmail) => {
    setLoading(true);
    const success = await quickLoginAs(pEmail);
    setLoading(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-14 sm:pt-20 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-lg shadow-2xl border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col mb-10 transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">CompanyBrain Access Portal</h2>
              <p className="text-[11px] text-slate-300 font-mono">Zero-Trust Authentication & Multi-Tenancy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-5 rounded-xl bg-slate-800/90 border border-slate-700/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`py-2 rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign In to Account
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`py-2 rounded-lg transition-all ${
              tab === 'signup'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {tab === 'login' ? (
            /* ================= LOGIN TAB ================= */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Corporate Work Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. rahul@acme.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-indigo-400 text-xs text-white outline-none placeholder:text-slate-400 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-indigo-400 text-xs text-white outline-none placeholder:text-slate-400 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Quick Persona Access for Testing */}
              <div className="pt-4 border-t border-slate-700/60 space-y-2">
                <div className="text-[11px] font-mono text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Demo Personas (One-Click):</span>
                  <span className="text-indigo-300 font-normal">Password123!</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {personas.slice(0, 4).map((p) => (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => handleQuickPersona(p.email)}
                      className="text-left p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/40 transition-all text-xs"
                    >
                      <div className="font-bold text-white truncate text-xs">{p.name}</div>
                      <div className="text-[10px] text-indigo-300 font-mono truncate">{p.role} • {p.company}</div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* ================= SIGNUP TAB ================= */
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Signup Mode Selector */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSignupMode('JOIN_TENANT')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    signupMode === 'JOIN_TENANT'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm ring-1 ring-indigo-500/40'
                      : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>Join Company</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Register as an employee</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupMode('NEW_TENANT')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    signupMode === 'NEW_TENANT'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm ring-1 ring-indigo-500/40'
                      : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>New Enterprise</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Provision isolated tenant</div>
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                {signupMode === 'NEW_TENANT' ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1">Company / Organization Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Stark Industries"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-indigo-400 text-xs text-white outline-none placeholder:text-slate-400 transition-all font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1">Select Enterprise Company</label>
                    <select
                      value={selectedTenantId}
                      onChange={(e) => setSelectedTenantId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-600 text-xs text-white outline-none focus:border-indigo-400 font-medium"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-indigo-400 text-xs text-white outline-none placeholder:text-slate-400 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Corporate Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alex@company.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-indigo-400 text-xs text-white outline-none placeholder:text-slate-400 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Engineering"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-indigo-400 text-xs text-white outline-none placeholder:text-slate-400 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-600 focus:border-indigo-400 text-xs text-white outline-none placeholder:text-slate-400 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md mt-2"
              >
                <span>
                  {loading
                    ? 'Creating Account...'
                    : signupMode === 'NEW_TENANT'
                    ? 'Provision Enterprise Tenant'
                    : 'Create Account & Sign In'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Trust: Enforced with pre-retrieval clearance policies</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
