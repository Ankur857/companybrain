import React, { useState, useEffect } from 'react';
import { X, ExternalLink, FileText, Shield, CheckCircle2, User, Building } from 'lucide-react';
import { api } from '../services/api';
import { SecurityBadge } from './SecurityBadge';

export function CitationModal({ documentId, isOpen, onClose }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !documentId) return;

    setLoading(true);
    setError(null);
    api.getDocument(documentId)
      .then((res) => {
        if (res.success) {
          setDoc(res.document);
        }
      })
      .catch((err) => {
        setError(err.message || 'Access to this source was denied.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Authorized Source Citation
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Evaluating policy authorization & fetching document...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <div className="font-semibold mb-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" /> Policy Guard Blocked
              </div>
              <p>{error}</p>
            </div>
          )}

          {doc && !loading && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <SecurityBadge classification={doc.classification} />
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                    {doc.source_type}
                  </span>
                  {doc.project && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/20">
                      Project: {doc.project}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white">{doc.title}</h3>
              </div>

              {/* Metadata strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 block mb-0.5">Department:</span>
                  <span className="font-medium text-white">{doc.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Owner:</span>
                  <span className="font-medium text-white">{doc.owner || 'System'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Version:</span>
                  <span className="font-medium text-white">{doc.version || '1.0'}</span>
                </div>
              </div>

              {/* Document Excerpt */}
              <div>
                <div className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                  Indexed Knowledge Content
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/5 font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {doc.content}
                </div>
              </div>

              {/* Security indicator */}
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Pre-retrieval verification passed. User clearance verified before context retrieval.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-900/40 flex justify-between items-center text-xs text-slate-400">
          <div>Document ID: <code className="font-mono text-slate-300">{documentId?.slice(0, 13)}...</code></div>
          {doc?.source_url && (
            <a
              href={doc.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Open external source <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
