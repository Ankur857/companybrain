import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SecurityBadge } from '../components/SecurityBadge';
import { CitationModal } from '../components/CitationModal';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Lock,
  ExternalLink,
  Shield,
  Eye,
  Plus
} from 'lucide-react';

export function KnowledgeSources() {
  const { user, tenant } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('ALL');
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getDocuments()
      .then((res) => {
        if (res.success) setDocuments(res.documents || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenant]);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      (doc.department && doc.department.toLowerCase().includes(search.toLowerCase())) ||
      (doc.project && doc.project.toLowerCase().includes(search.toLowerCase()));

    const matchesClass =
      classificationFilter === 'ALL' || doc.classification === classificationFilter;

    return matchesSearch && matchesClass;
  });

  const openDoc = (doc) => {
    setSelectedDocId(doc.id);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              TENANT KNOWLEDGE REPOSITORY
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Knowledge Sources & Documents
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Common knowledge representation normalized from connectors. Each document is tagged with classification and required access groups.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, project, or department..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 focus:border-indigo-500 text-xs text-white outline-none transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Classification Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL'].map((cls) => (
            <button
              key={cls}
              onClick={() => setClassificationFilter(cls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 ${
                classificationFilter === cls
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid / Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-mono">Loading tenant knowledge catalog...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-white/10 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="font-bold text-white text-base">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1">Try refining your search filter or syncing data connectors.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            return (
              <div
                key={doc.id}
                className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <SecurityBadge classification={doc.classification} size="xs" />
                    {doc.canAccess ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> CLEARANCE GRANTED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/30">
                        <Lock className="w-3 h-3" /> RESTRICTED
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/5">
                        {doc.source_type}
                      </span>
                      <span>Dept: {doc.department || 'General'}</span>
                      {doc.project && <span>• Proj: {doc.project}</span>}
                    </div>
                  </div>

                  {/* Required Access Groups */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">
                      Required Access Groups:
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {doc.required_groups && doc.required_groups.length > 0 ? (
                        doc.required_groups.map((grp, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-500/20"
                          >
                            {grp}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">None (Public to Tenant)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => openDoc(doc)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{doc.canAccess ? 'Inspect Content' : 'Inspect Policy Rule'}</span>
                  </button>

                  <span className="text-[10px] font-mono text-slate-500">v{doc.version || '1.0'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <CitationModal
        documentId={selectedDocId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
