import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandIntro } from '../components/landing/BrandIntro';
import { ThreeBrainHero } from '../components/landing/ThreeBrainHero';
import { InteractiveArchitecture } from '../components/landing/InteractiveArchitecture';
import { ProblemSection } from '../components/landing/ProblemSection';
import { RealisticProductUI } from '../components/landing/RealisticProductUI';
import { ProductFeatures } from '../components/landing/ProductFeatures';
import { IntegrationsSection } from '../components/landing/IntegrationsSection';
import { SecuritySection } from '../components/landing/SecuritySection';
import { ExperienceSection } from '../components/landing/ExperienceSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { LandingFooter } from '../components/landing/LandingFooter';
import {
  Shield,
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export function LandingPage() {
  const { user } = useAuth();
  const [showBrandIntro, setShowBrandIntro] = useState(() => {
    // Only show once per browser session to maintain elite responsiveness
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

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white relative">
      {/* 1. Brand Intro Reveal Animation (1.2s on initial visit) */}
      {showBrandIntro && <BrandIntro onComplete={handleIntroComplete} />}

      {/* 2. Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#070a12]/85 backdrop-blur-xl border-b border-slate-800/80">
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

          {/* Desktop Center Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <button onClick={() => scrollToSection('architecture')} className="hover:text-white transition-colors">
              Product
            </button>
            <button onClick={() => scrollToSection('project-intelligence')} className="hover:text-white transition-colors">
              Solutions
            </button>
            <button onClick={() => scrollToSection('security')} className="hover:text-white transition-colors">
              Security
            </button>
            <button onClick={() => scrollToSection('integrations')} className="hover:text-white transition-colors">
              Integrations
            </button>
            <button onClick={() => scrollToSection('experience')} className="hover:text-white transition-colors">
              Experience
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
            <button
              onClick={() => scrollToSection('architecture')}
              className="block w-full text-left py-2 text-sm text-slate-300"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('project-intelligence')}
              className="block w-full text-left py-2 text-sm text-slate-300"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="block w-full text-left py-2 text-sm text-slate-300"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection('integrations')}
              className="block w-full text-left py-2 text-sm text-slate-300"
            >
              Integrations
            </button>
            <button
              onClick={() => scrollToSection('experience')}
              className="block w-full text-left py-2 text-sm text-slate-300"
            >
              Experience
            </button>
            <div className="pt-3 border-t border-white/5 flex gap-2">
              <Link
                to="/login"
                className="flex-1 text-center py-2 rounded-lg bg-slate-800 text-xs font-medium text-white"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className="flex-1 text-center py-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 3. Hero Section with Interactive 3D WebGL Visualization */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Positioning & Copy */}
            <div className="lg:col-span-6 space-y-6 text-left">
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
                  onClick={() => scrollToSection('architecture')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium text-sm transition-colors backdrop-blur-md"
                >
                  <span>See how it works</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs font-mono text-slate-400">
                <div>
                  <div className="text-white font-bold text-sm">Pre-RAG</div>
                  <div className="text-[11px] text-slate-500">Security Enforced</div>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Google Drive &amp; Supabase</div>
                  <div className="text-[11px] text-slate-500">Direct Connectors</div>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Zero Leakage</div>
                  <div className="text-[11px] text-slate-500">Tenant Isolation</div>
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

      {/* 4. Problem Section: The Knowledge Crisis */}
      <ProblemSection />

      {/* 5. Scroll-driven 3D Architecture Storytelling (7 Scenes) */}
      <InteractiveArchitecture />

      {/* 6. Realistic Product UI: Project Intelligence Showcase */}
      <RealisticProductUI />

      {/* 7. Product Features (4 Blocks) */}
      <ProductFeatures />

      {/* 8. Supported Native Integrations (Google Drive & Supabase) */}
      <IntegrationsSection />

      {/* 9. Security Section (7-Step Interactive Pipeline) */}
      <SecuritySection />

      {/* 10. Experience Feature Section (Institutional Memory) */}
      <ExperienceSection />

      {/* 11. Final Cinematic CTA */}
      <FinalCTASection />

      {/* 12. Minimal Enterprise Footer */}
      <LandingFooter />
    </div>
  );
}
