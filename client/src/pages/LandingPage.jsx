import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandIntro } from '../components/landing/BrandIntro';
import { ThreeBrainHero } from '../components/landing/ThreeBrainHero';
import { RealisticProductUI } from '../components/landing/RealisticProductUI';
import { LandingFooter } from '../components/landing/LandingFooter';
import {
  Shield,
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  MessageSquare,
  Cpu,
  ShieldCheck,
  Award,
  FileText,
  Database,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';

export function LandingPage() {
  const { user } = useAuth();
  const [showBrandIntro, setShowBrandIntro] = useState(() => {
    return !sessionStorage.getItem('companybrain_intro_viewed');
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleIntroComplete = () => {
    sessionStorage.setItem('companybrain_intro_viewed', 'true');
    setShowBrandIntro(false);
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: MessageSquare,
      title: 'Ask Anything',
      description: 'Get accurate, source-backed answers from your company knowledge.',
      detail: 'Direct citation links back to source PDFs, markdown files, and relational rows.',
      badge: 'Zero Hallucinations',
      accent: 'border-blue-500/30 text-blue-400',
    },
    {
      icon: Cpu,
      title: 'Project Intelligence',
      description: 'Understand architecture, services, APIs and dependencies faster.',
      detail: 'Synthesizes microservices topologies and database schemas in seconds.',
      badge: 'Deep Topology',
      accent: 'border-indigo-500/30 text-indigo-400',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Knowledge',
      description: 'Permission-aware access keeps information within the right boundaries.',
      detail: 'Pre-RAG RBAC filtering masks unauthorized documents before model retrieval.',
      badge: 'Pre-RAG Enforced',
      accent: 'border-emerald-500/30 text-emerald-400',
    },
    {
      icon: Award,
      title: 'Verified Experiences',
      description: 'Learn from real problems and solutions shared by your team.',
      detail: 'Peer-reviewed institutional memory captures fixes before staff turnover.',
      badge: 'Institutional Memory',
      accent: 'border-purple-500/30 text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white relative">
      {/* 1. Brand Intro Reveal Animation (1.2s on initial visit) */}
      {showBrandIntro && <BrandIntro onComplete={handleIntroComplete} />}

      {/* 2. Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#070a12]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#0e1628] border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm group-hover:border-indigo-400 transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">Company</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-bold text-base">
                Brain
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08] ml-1">
                ENTERPRISE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <button onClick={() => scrollToSection('product')} className="hover:text-white transition-colors">
              Product
            </button>
            <button onClick={() => scrollToSection('capabilities')} className="hover:text-white transition-colors">
              Capabilities
            </button>
            <button onClick={() => scrollToSection('security')} className="hover:text-white transition-colors">
              Security
            </button>
            <button onClick={() => scrollToSection('connectors')} className="hover:text-white transition-colors">
              Connectors
            </button>
          </nav>

          {/* Right Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 bg-[#070a12] border-b border-slate-800 space-y-3">
            <button onClick={() => scrollToSection('product')} className="block w-full text-left py-2 text-sm text-slate-300">
              Product
            </button>
            <button onClick={() => scrollToSection('capabilities')} className="block w-full text-left py-2 text-sm text-slate-300">
              Capabilities
            </button>
            <button onClick={() => scrollToSection('security')} className="block w-full text-left py-2 text-sm text-slate-300">
              Security
            </button>
            <button onClick={() => scrollToSection('connectors')} className="block w-full text-left py-2 text-sm text-slate-300">
              Connectors
            </button>
            <div className="pt-3 border-t border-white/5 flex gap-2">
              <Link to="/login" className="flex-1 text-center py-2 rounded-lg bg-slate-800 text-xs font-medium text-white">
                Sign in
              </Link>
              <Link to="/login" className="flex-1 text-center py-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 3. Hero Section with Interactive 3D WebGL Visualization */}
      <section className="relative pt-12 pb-16 lg:pt-18 lg:pb-20 overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Hero Positioning & Copy */}
            <div className="lg:col-span-6 space-y-5 text-left">
              {/* Tag Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>ENTERPRISE KNOWLEDGE PLATFORM</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Your company knowledge.{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                  One intelligent partner.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-xl">
                CompanyBrain helps teams find answers, understand projects, and learn faster — using their own documents and data, with enterprise-grade security.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to={user ? '/dashboard' : '/login'}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  <span>{user ? 'Open Dashboard' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => scrollToSection('product')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium text-sm transition-colors backdrop-blur-md"
                >
                  <span>See how it works</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-5 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs font-mono text-slate-400">
                <div>
                  <div className="text-white font-bold text-sm">Pre-RAG</div>
                  <div className="text-[11px] text-slate-500">Security Enforced</div>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Google Drive &amp; Supabase</div>
                  <div className="text-[11px] text-slate-500">Native Connectors</div>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Zero Leakage</div>
                  <div className="text-[11px] text-slate-500">Tenant Isolated</div>
                </div>
              </div>
            </div>

            {/* Right Hero: Interactive 3D WebGL CompanyBrain Core */}
            <div className="lg:col-span-6 relative">
              <ThreeBrainHero />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Realistic Product UI: Project Intelligence Showcase */}
      <div id="product">
        <RealisticProductUI />
      </div>

      {/* 5. Core Platform Capabilities (4 Clean Cards) */}
      <section id="capabilities" className="py-20 bg-[#070a12] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>PLATFORM CAPABILITIES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Built for enterprise velocity.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              Eliminate search friction and capture institutional memory within strict security boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#0b1220] border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">{feat.title}</h3>
                  <p className="text-xs font-medium text-slate-300 mt-1.5">"{feat.description}"</p>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{feat.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Security & Supported Connectors Unified Section */}
      <section id="security" className="py-20 bg-[#090e1a] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono mb-3">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>SECURITY &amp; CONNECTORS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              AI that works within your boundaries.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              The AI only sees what the user is authorized to access. Connect Google Drive and Supabase with zero data leakage.
            </p>
          </div>

          <div id="connectors" className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* Google Drive */}
            <div className="p-6 rounded-2xl bg-[#0c1324] border border-sky-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Active Connector
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Google Drive</h3>
              <p className="text-xs font-medium text-sky-300/90 mt-1">"Connect your documents, PDFs and files."</p>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Syncs architecture specs, RFCs, and runbooks with continuous permission verification.
              </p>
            </div>

            {/* Supabase */}
            <div className="p-6 rounded-2xl bg-[#0c1324] border border-emerald-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Active Connector
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Supabase</h3>
              <p className="text-xs font-medium text-emerald-300/90 mt-1">"Connect application data and structured tables."</p>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                Indexes PostgreSQL tables, project manifests, and verified experiences with row-level filtering.
              </p>
            </div>
          </div>

          {/* Pre-RAG Pipeline Pill Diagram */}
          <div className="max-w-4xl mx-auto p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-400">ENFORCEMENT:</span>
            <span className="text-sky-400 font-bold">USER</span>
            <span className="text-slate-600">→</span>
            <span className="text-indigo-400 font-bold">AUTH</span>
            <span className="text-slate-600">→</span>
            <span className="text-amber-400 font-bold">POLICY ENGINE</span>
            <span className="text-slate-600">→</span>
            <span className="text-emerald-400 font-bold">AUTHORIZED KNOWLEDGE</span>
            <span className="text-slate-600">→</span>
            <span className="text-purple-400 font-bold">GEMINI 3.5</span>
            <span className="text-slate-600">→</span>
            <span className="text-cyan-400 font-bold">ANSWER</span>
          </div>
        </div>
      </section>

      {/* 7. Final Concise CTA */}
      <section className="py-20 bg-[#070a12] border-t border-slate-800 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Turn knowledge into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              progress.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Help your teams learn faster, work smarter, and keep company knowledge within reach.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => scrollToSection('product')}
              className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors"
            >
              See how it works
            </button>
          </div>
        </div>
      </section>

      {/* 8. Minimal Enterprise Footer */}
      <LandingFooter />
    </div>
  );
}
