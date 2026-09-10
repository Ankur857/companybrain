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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="card-clean w-full max-w-lg shadow-2xl border border-white/[0.12] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">CompanyBrain Identity Access</h2>
              <p className="text-[11px] text-slate-400 font-mono">Zero-Trust Authentication & Multi-Tenancy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 rounded-xl bg-slate-950/60 border border-white/[0.06] text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`py-1.5 rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`py-1.5 rounded-lg transition-all ${
              tab === 'signup'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {tab === 'login' ? (
            /* ================= LOGIN TAB ================= */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Corporate Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. rahul@acme.com"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none placeholder:text-slate-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none placeholder:text-slate-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Quick Persona Access for Testing */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Demo Quick-Switch Personas:</span>
                  <span className="text-slate-600">Password: Password123!</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {personas.slice(0, 4).map((p) => (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => handleQuickPersona(p.email)}
                      className="text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-white/[0.06] transition-all text-xs"
                    >
                      <div className="font-semibold text-white truncate text-[11px]">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{p.role} • {p.company}</div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* ================= SIGNUP TAB ================= */
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Signup Mode Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignupMode('JOIN_TENANT')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    signupMode === 'JOIN_TENANT'
                      ? 'border-indigo-500/50 bg-indigo-950/20 text-white'
                      : 'border-white/[0.06] bg-slate-950/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Join Company</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Register as an employee</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupMode('NEW_TENANT')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    signupMode === 'NEW_TENANT'
                      ? 'border-indigo-500/50 bg-indigo-950/20 text-white'
                      : 'border-white/[0.06] bg-slate-950/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>New Enterprise</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Provision isolated tenant</div>
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                {signupMode === 'NEW_TENANT' ? (
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Company / Organization Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Stark Industries"
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none placeholder:text-slate-500 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Select Company</label>
                    <select
                      value={selectedTenantId}
                      onChange={(e) => setSelectedTenantId(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-white/[0.08] text-xs text-white outline-none focus:border-indigo-500/50"
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
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none placeholder:text-slate-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Corporate Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alex@company.com"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none placeholder:text-slate-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Engineering"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none placeholder:text-slate-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none placeholder:text-slate-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>
                  {loading
                    ? 'Creating Account...'
                    : signupMode === 'NEW_TENANT'
                    ? 'Provision Enterprise Tenant'
                    : 'Register Account'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Zero-Trust: Pre-retrieval policy gates enforced immediately</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
