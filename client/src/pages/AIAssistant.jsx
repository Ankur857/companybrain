import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CitationModal } from '../components/CitationModal';
import {
  Send,
  Shield,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Lock,
  Sparkles,
  History,
  Bot,
  User,
  ExternalLink,
  Info,
  Clock,
  Zap,
  CornerDownRight
} from 'lucide-react';

export function AIAssistant() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCitationId, setSelectedCitationId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Load RAG history on tenant or user change
  useEffect(() => {
    api.getRAGHistory()
      .then((res) => {
        if (res.success) setHistory(res.history || []);
      })
      .catch(console.error);

    // Initial greeting message explaining active clearances
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `Hello ${user?.name}. I am CompanyBrain, your enterprise AI knowledge assistant for ${tenant?.name}.
Your active clearance:
• Role: ${user?.role_name}
• Department: ${user?.department}
• Access Groups: ${(user?.access_groups || []).map((g) => g.name).join(', ') || 'General'}

Every query you submit is verified against the CompanyBrain Policy Engine BEFORE external AI context assembly. Only knowledge you are cleared to view is retrieved.`,
        sources: [],
        decision: 'INFO',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [tenant, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText = null) => {
    const textToSend = (questionText || query).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const response = await api.queryRAG(textToSend, tenant?.id);

      const assistantMsg = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: response.answer,
        sources: response.sources || [],
        decision: response.decision || 'ALLOW',
        securityIndicators: response.securityIndicators,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh history list
      api.getRAGHistory().then((res) => {
        if (res.success) setHistory(res.history || []);
      });
    } catch (err) {
      showToast(err.message || 'Error processing RAG query', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'assistant',
          text: `Error: ${err.message}`,
          sources: [],
          decision: 'DENY',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openCitation = (id) => {
    setSelectedCitationId(id);
    setIsModalOpen(true);
  };

  const samplePrompts = [
    { text: 'What is the architecture of Project Alpha?', label: 'Project Alpha Arch (ALLOW)' },
    { text: 'Show me employee salary information and bonus allocations', label: 'HR Salaries (DENIED)' },
    { text: 'What are our employee healthcare benefits and 401(k) terms?', label: 'Benefits Policy' },
    { text: 'What are the enterprise API Gateway specifications?', label: 'API Specs' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-130px)]">
      {/* Left Sidebar: Query History & Clearance Card */}
      <div className="hidden lg:flex flex-col gap-4 h-full">
        {/* User Clearance Profile Card */}
        <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <Lock className="w-3.5 h-3.5" />
            <span>AUTHENTICATED CLEARANCE</span>
          </div>
          <div>
            <div className="font-bold text-white text-sm">{user?.name}</div>
            <div className="text-xs text-slate-400 font-mono">{tenant?.name}</div>
          </div>
          <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Role:</span>
              <span className="font-semibold text-white">{user?.role_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dept:</span>
              <span className="font-semibold text-white">{user?.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Access Groups:</span>
              <div className="flex gap-1 flex-wrap">
                {(user?.access_groups || []).map((g) => (
                  <span
                    key={g.id || g}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/20"
                  >
                    {g.name || g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="p-4 rounded-2xl glass-panel border border-white/10 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Tenant Query History
            </h3>
            <span className="text-[10px] text-slate-500">{history.length}</span>
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {history.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No queries recorded yet.</div>
            ) : (
              history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleSend(h.query)}
                  className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-slate-300 group flex items-start gap-2"
                >
                  <CornerDownRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{h.query}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-3 flex flex-col h-full rounded-2xl glass-panel border border-white/10 overflow-hidden">
        {/* Chat Header Bar */}
        <div className="px-6 py-3 border-b border-white/10 bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                CompanyBrain Knowledge Retrieval
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  SECURE RAG
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Isolated to: <strong className="text-slate-300">{tenant?.name}</strong>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Shield className="w-3.5 h-3.5" /> Zero-Leak Guarantee
            </span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400 px-1">
                {msg.sender === 'user' ? (
                  <>
                    <span className="font-semibold text-white">{user?.name}</span>
                    <span>• {msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-indigo-300">CompanyBrain Engine</span>
                    <span>• {msg.timestamp}</span>
                  </>
                )}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-3xl leading-relaxed text-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/20'
                    : msg.decision === 'DENY'
                    ? 'bg-rose-950/40 border border-rose-500/30 text-rose-200 rounded-bl-none'
                    : 'bg-slate-900/90 border border-white/10 text-slate-100 rounded-bl-none shadow-xl'
                }`}
              >
                {/* Decision Alert Banner if blocked */}
                {msg.decision === 'DENY' && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>PRE-RETRIEVAL POLICY ENGINE: ACCESS DENIED</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Security Metrics Strip */}
                {msg.securityIndicators && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {msg.securityIndicators.authorizedSourcesCount} authorized source(s)
                      </span>
                      {msg.securityIndicators.deniedSourcesCount > 0 && (
                        <span className="text-rose-400">
                          {msg.securityIndicators.deniedSourcesCount} restricted source(s) shielded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{msg.securityIndicators.processingTimeMs}ms</span>
                    </div>
                  </div>
                )}

                {/* Source Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Verified Source Citations ({msg.sources.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.sources.map((src, i) => (
                        <button
                          key={src.id || i}
                          onClick={() => openCitation(src.id)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-white/5 hover:border-indigo-500/40 text-left transition-all group"
                        >
                          <div className="truncate pr-2">
                            <div className="font-semibold text-xs text-slate-200 group-hover:text-indigo-300 truncate">
                              {i + 1}. {src.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {src.source_type} • {src.classification}
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-slate-300 text-sm flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Evaluating clearance with Policy Engine & querying authorized RAG sources...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-white/10 bg-slate-900/40 space-y-3 shrink-0">
          {/* Sample Prompts Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-mono text-[10px] uppercase shrink-0">Quick Queries:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(p.text)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-white/5 text-slate-300 text-xs shrink-0 transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Text Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask a question across authorized knowledge in ${tenant?.name || 'Company'}...`}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white text-sm transition-all placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/25 shrink-0"
            >
              <span>Query</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Citation Modal */}
      <CitationModal
        documentId={selectedCitationId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
