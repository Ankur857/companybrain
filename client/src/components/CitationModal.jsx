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
        setError(err.message || 'Access to this source was denied by Policy Engine.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="card-clean w-full max-w-2xl shadow-2xl border border-white/[0.12] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-slate-950/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Verified Source Citation
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading && (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-mono text-slate-400">Evaluating authorization & fetching source...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" /> Policy Engine Restricted
              </div>
              <p className="text-slate-400">{error}</p>
            </div>
          )}

          {doc && !loading && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <SecurityBadge classification={doc.classification} size="xs" />
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/[0.06] text-slate-300">
                    {doc.source_type}
                  </span>
                  {doc.project && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {doc.project}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-white">{doc.title}</h3>
              </div>

              {/* Metadata strip */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Department:</span>
                  <span className="font-medium text-slate-200">{doc.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Owner:</span>
                  <span className="font-medium text-slate-200">{doc.owner || 'System'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Version:</span>
                  <span className="font-medium text-slate-200">v{doc.version || '1.0'}</span>
                </div>
              </div>

              {/* Document Excerpt */}
              <div>
                <div className="text-[11px] font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
                  Indexed Knowledge Content
                </div>
                <div className="p-4 rounded-xl bg-slate-950/90 border border-white/[0.06] font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {doc.content}
                </div>
              </div>

              {/* Security indicator */}
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 font-mono text-[11px]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Pre-retrieval verification passed. User clearance verified before context retrieval.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-slate-950/50 flex justify-between items-center text-xs text-slate-500">
          <div className="font-mono text-[11px]">
            Doc ID: <span className="text-slate-400">{documentId?.slice(0, 16)}...</span>
          </div>
          {doc?.source_url && (
            <a
              href={doc.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-medium text-xs"
            >
              Open raw source <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
