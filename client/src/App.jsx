import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';

import { Dashboard } from './pages/Dashboard';
import { AIAssistant } from './pages/AIAssistant';
import { SecurityDemo } from './pages/SecurityDemo';
import { Companies } from './pages/Companies';
import { KnowledgeSources } from './pages/KnowledgeSources';
import { Connectors } from './pages/Connectors';
import { UsersPage } from './pages/Users';
import { AccessGroups } from './pages/AccessGroups';
import { Policies } from './pages/Policies';
import { AuditLogs } from './pages/AuditLogs';
import { Architecture } from './pages/Architecture';
import { Projects } from './pages/Projects';
import { ProjectIntelligence } from './pages/ProjectIntelligence';

export default function App() {
  const { loading, user, isAuthModalOpen, closeAuthModal } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="font-mono text-sm tracking-wider text-slate-200">
          INITIALIZING COMPANYBRAIN PLATFORM...
        </div>
        <div className="text-xs text-slate-400 mt-1">Verifying tenant boundaries & Policy Engine</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1120] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-[calc(100vh-53px)]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<AIAssistant />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id/understand" element={<ProjectIntelligence />} />
            <Route path="/demo" element={<SecurityDemo />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/knowledge" element={<KnowledgeSources />} />
            <Route path="/connectors" element={<Connectors />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/groups" element={<AccessGroups />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
