import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  Mail,
  User,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowLeft
} from 'lucide-react';

export function LoginPage() {
  const { user, login, signup, quickLoginAs, personas, companies } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [signupMode, setSignupMode] = useState('JOIN_TENANT'); // 'JOIN_TENANT' | 'NEW_TENANT'
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [selectedTenantId, setSelectedTenantId] = useState(companies[0]?.id || '');
  const [companyName, setCompanyName] = useState('');

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleSignupSubmit = async (e) => {
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
    if (success) {
      navigate('/dashboard');
    }
  };

  const handlePersonaClick = async (personaEmail) => {
    setLoading(true);
    const success = await quickLoginAs(personaEmail);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col lg:flex-row">
      {/* LEFT COLUMN: 3D Visual & Security Statement */}
      <div className="lg:w-1/2 bg-[#090e1d] border-r border-slate-800 relative p-8 lg:p-14 flex flex-col justify-between overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        {/* Ambient Glow */}
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Back to Landing Link & Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Landing Page</span>
          </Link>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            ENTERPRISE GATEWAY
          </span>
        </div>

        {/* Center: Brand Motif & Security Architecture Statement */}
        <div className="relative z-10 py-12 max-w-md mx-auto">
          {/* Subtle 3D Brain / Core Visual */}
          <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-spin" style={{ animationDuration: '24s' }} />
            <div className="absolute inset-3 rounded-full border border-sky-400/25 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
            <div className="w-20 h-20 rounded-2xl bg-[#0f172a] border border-indigo-400/50 shadow-[0_0_35px_rgba(99,102,241,0.3)] flex items-center justify-center backdrop-blur-md">
              <Shield className="w-10 h-10 text-indigo-400" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Company<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Brain</span>
            </h1>
            <p className="mt-2 text-sm text-slate-300 font-medium">
              "Your company knowledge. One intelligent partner."
            </p>
          </div>

          {/* Security & Product Statements */}
          <div className="mt-8 space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white block">Pre-RAG PolicyEngine:</span>
                Documents outside your authorized RBAC clearance are filtered before token retrieval.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white block">Verified Connectors:</span>
                Directly bound to Google Drive and Supabase with live change data capture.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white block">Continuous Experience Capture:</span>
                Institutional fixes reviewed and indexed for natural-language team recall.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer on Left */}
        <div className="relative z-10 text-xs font-mono text-slate-500 flex items-center justify-between border-t border-white/5 pt-4">
          <span>Tenant Isolation Active</span>
          <span>SOC2 Type II Aligned</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Real Authentication Form */}
      <div className="lg:w-1/2 bg-[#070a12] p-8 lg:p-14 flex flex-col justify-center max-w-xl mx-auto w-full">
        <div className="w-full space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {tab === 'login' ? 'Sign in to your workspace' : 'Create an enterprise account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {tab === 'login'
                ? 'Enter your enterprise credentials or choose a quick demo persona below.'
                : 'Join an existing company tenant or provision a new isolated workspace.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`py-2 rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={`py-2 rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Workspace
            </button>
          </div>

          {/* LOGIN FORM */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] font-mono text-indigo-400 cursor-pointer hover:underline">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@company.com"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Risk">Risk</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Workspace Mode</label>
                  <select
                    value={signupMode}
                    onChange={(e) => setSignupMode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="JOIN_TENANT">Join Existing</option>
                    <option value="NEW_TENANT">New Company</option>
                  </select>
                </div>
              </div>

              {signupMode === 'JOIN_TENANT' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Company</label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Financial Technologies"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account & Continue'}
              </button>
            </form>
          )}

          {/* 1-CLICK DEMO PERSONA SELECTOR */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-center mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Or 1-Click Instant Demo Login
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {personas && personas.length > 0 ? (
                personas.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePersonaClick(p.email)}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-left transition-all group"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {p.role} · {p.department}
                    </div>
                  </button>
                ))
              ) : (
                // Fallback default persona buttons
                <>
                  <button
                    type="button"
                    onClick={() => handlePersonaClick('rahul@acme.com')}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-left transition-all"
                  >
                    <div className="text-xs font-semibold text-white">Rahul Sharma</div>
                    <div className="text-[10px] text-slate-400 font-mono">Platform Lead (Admin)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaClick('priya@acme.com')}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-left transition-all"
                  >
                    <div className="text-xs font-semibold text-white">Priya Patel</div>
                    <div className="text-[10px] text-slate-400 font-mono">Risk Analyst</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaClick('vikram@acme.com')}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-left transition-all"
                  >
                    <div className="text-xs font-semibold text-white">Vikram Rao</div>
                    <div className="text-[10px] text-slate-400 font-mono">Compliance Officer</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaClick('ananya@acme.com')}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-left transition-all"
                  >
                    <div className="text-xs font-semibold text-white">Ananya Sen</div>
                    <div className="text-[10px] text-slate-400 font-mono">Security Engineer</div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
