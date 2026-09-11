import React from 'react';
import { Shield, ExternalLink, Github, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingFooter() {
  return (
    <footer className="bg-[#050811] border-t border-slate-900 text-slate-400 text-xs py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight">CompanyBrain</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                  ENTERPRISE
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              The permission-aware enterprise intelligence platform. Connect documents, enforce security policies, and empower your team with verified institutional knowledge.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>All Systems Operational · SOC2 Type II Aligned</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs font-mono uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#integrations" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security Architecture</a></li>
              <li><a href="#project-intelligence" className="hover:text-white transition-colors">Project Intelligence</a></li>
              <li><a href="#experience" className="hover:text-white transition-colors">Verified Experience</a></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs font-mono uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#architecture" className="hover:text-white transition-colors">System Architecture</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security Whitepaper</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">API Reference</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Support Portal</Link></li>
            </ul>
          </div>

          {/* Company & Legal Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs font-mono uppercase tracking-wider">Company & Legal</h4>
            <ul className="space-y-2">
              <li><span className="hover:text-white transition-colors cursor-pointer">About CompanyBrain</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Security Disclosure</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
          <div>
            © {new Date().getFullYear()} CompanyBrain Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Google Drive &amp; Supabase Certified Connectors</span>
            <span>Pre-RAG Enforced</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
