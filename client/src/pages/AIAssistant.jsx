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
  Clock,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

export function AIAssistant() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCitationId, setSelectedCitationId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.getRAGHistory()
      .then((res) => {
        if (res.success) setHistory(res.history || []);
      })
      .catch(console.error);

    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `Hello ${user?.name}. I am CompanyBrain, your enterprise AI knowledge assistant for ${tenant?.name}.

You are logged in with **${user?.role_name}** clearance in the **${user?.department}** department.
Your verified access groups: ${(user?.access_groups || []).map((g) => g.name).join(', ') || 'None'}.

Every question you submit is verified against the CompanyBrain Policy Engine before context is compiled. You will only receive answers sourced from documentation you are authorized to view.`,
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
    <div className="flex h-[calc(100vh-100px)] max-w-7xl mx-auto gap-6">
      {/* Collapsible History Drawer */}
      {showHistory && (
        <div className="w-72 card-clean p-4 flex flex-col shrink-0 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Query History
            </span>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Close
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 text-xs">
            {history.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No past queries in this session.</div>
            ) : (
              history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    handleSend(h.query);
                    setShowHistory(false);
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-white/[0.04] text-slate-300 transition-colors line-clamp-2 leading-relaxed"
                >
                  {h.query}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Conversation Canvas */}
      <div className="flex-1 card-clean flex flex-col overflow-hidden">
        {/* Top Chat Subheader */}
        <div className="px-6 py-3 border-b border-white/[0.06] bg-slate-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                showHistory
                  ? 'bg-indigo-600 text-white border-transparent'
                  : 'bg-slate-900 border-white/[0.06] text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Query History"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
            <div className="text-xs text-slate-400">
              Workspace: <strong className="text-slate-200 font-medium">{tenant?.name}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Shield className="w-3 h-3" /> Zero-Leak Enforced
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-2 max-w-2xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                        : msg.decision === 'DENY'
                        ? 'bg-rose-950/30 border border-rose-500/25 text-rose-200 rounded-bl-none'
                        : 'bg-slate-900/80 border border-white/[0.06] text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {/* Deny Banner */}
                    {msg.decision === 'DENY' && (
                      <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-rose-500/20 text-rose-400 text-xs font-mono font-medium">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>POLICY ENGINE: RETRIEVAL BLOCKED</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Source Citation Chips */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2">
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          Authorized Citations ({msg.sources.length}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src, i) => (
                            <button
                              key={src.id || i}
                              onClick={() => openCitation(src.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-white/[0.08] hover:border-indigo-500/40 text-left transition-colors group"
                            >
                              <span className="text-xs text-slate-300 group-hover:text-indigo-300 font-medium">
                                {src.title}
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Meta Info */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 px-1">
                    <span>{msg.timestamp}</span>
                    {msg.securityIndicators && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400/80">
                          {msg.securityIndicators.authorizedSourcesCount} authorized source(s)
                        </span>
                        <span>•</span>
                        <span>{msg.securityIndicators.processingTimeMs}ms</span>
                      </>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0 mt-0.5">
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/[0.06] text-slate-400 text-xs flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Evaluating clearance with Policy Engine & querying authorized sources...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer Bottom Area */}
        <div className="p-4 border-t border-white/[0.06] bg-slate-900/30 space-y-3 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2.5">
            {/* Quick Prompts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Suggestions:</span>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => handleSend(p.text)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-white/[0.06] hover:border-white/15 transition-colors shrink-0 font-medium"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
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
                placeholder={`Ask anything across authorized knowledge in ${tenant?.name || 'Company'}...`}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950/90 border border-white/[0.08] focus:border-indigo-500 text-slate-100 text-sm outline-none transition-colors placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium text-sm flex items-center gap-2 transition-colors shrink-0 shadow-sm"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Citation Inspector Modal */}
      <CitationModal
        documentId={selectedCitationId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
