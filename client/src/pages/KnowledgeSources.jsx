import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { SecurityBadge } from '../components/SecurityBadge';
import { CitationModal } from '../components/CitationModal';
import {
  FileText,
  Search,
  CheckCircle2,
  Lock,
  ExternalLink,
  Shield,
  ShieldCheck,
  KeyRound,
  Users,
  Eye,
  FolderGit2,
  Building,
  Sparkles,
  X
} from 'lucide-react';

export function KnowledgeSources() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('ALL');
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Manage Access Drawer State
  const [managingDoc, setManagingDoc] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [docClassification, setDocClassification] = useState('INTERNAL');
  const [savingAccess, setSavingAccess] = useState(false);
  const [loadingAccessData, setLoadingAccessData] = useState(false);

  const loadDocuments = () => {
    setLoading(true);
    api.getDocuments()
      .then((res) => {
        if (res.success) setDocuments(res.documents || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
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

  const openManageAccess = async (doc) => {
    setManagingDoc(doc);
    setDocClassification(doc.classification || 'INTERNAL');
    setSelectedGroupIds(new Set(doc.required_groups || []));
    setSelectedUserIds(new Set(doc.metadata?.allowed_user_ids || []));
    setLoadingAccessData(true);

    try {
      const [groupsRes, usersRes] = await Promise.all([
        api.getGroups(),
        api.getUsers(),
      ]);
      if (groupsRes.success) setAvailableGroups(groupsRes.groups || []);
      if (usersRes.success) setAvailableUsers(usersRes.users || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load groups/users for access control.', 'error');
    } finally {
      setLoadingAccessData(false);
    }
  };

  const handleSaveAccess = async () => {
    if (!managingDoc) return;
    setSavingAccess(true);

    try {
      await api.updateDocument(managingDoc.id, {
        classification: docClassification,
        required_groups: Array.from(selectedGroupIds),
        allowed_user_ids: Array.from(selectedUserIds),
      });

      showToast(`Access rules saved for "${managingDoc.title}"!`, 'success');
      setManagingDoc(null);
      loadDocuments();
    } catch (err) {
      console.error(err);
      showToast(`Failed to update access rules: ${err.message}`, 'error');
    } finally {
      setSavingAccess(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Knowledge Base
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Indexed Enterprise Documents
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Normalized knowledge ingested across connected data silos. Each resource carries strict sensitivity classification and required access groups.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-clean p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, project, department..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Classification Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL'].map((cls) => {
            const isSelected = classificationFilter === cls;
            return (
              <button
                key={cls}
                onClick={() => setClassificationFilter(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                }`}
              >
                {cls === 'ALL' ? 'All Sensitivity' : cls.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-mono text-slate-500">Loading indexed documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center card-clean text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="font-semibold text-white text-sm">No matching documents</h3>
          <p className="text-xs text-slate-500 mt-1">Try refining your search terms or selecting a different classification filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            return (
              <div
                key={doc.id}
                className="card-clean card-interactive p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <SecurityBadge classification={doc.classification} size="xs" />
                    {doc.canAccess ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> CLEARANCE GRANTED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 font-medium">
                        <Lock className="w-3 h-3" /> RESTRICTED
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/[0.06] text-slate-300">
                        {doc.source_type}
                      </span>
                      <span>Dept: {doc.department || 'General'}</span>
                      {doc.project && <span>• {doc.project}</span>}
                    </div>
                  </div>

                  {/* Required Access Groups */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">
                      Required Groups:
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {doc.required_groups && doc.required_groups.length > 0 ? (
                        doc.required_groups.map((grp, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          >
                            {grp}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">Tenant-Wide (No Group Needed)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openDoc(doc)}
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{doc.canAccess ? 'View Source' : 'View Policy'}</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => openManageAccess(doc)}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Manage Access</span>
                      </button>
                    )}
                  </div>

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

      {/* Access Governance Modal for Knowledge Base Document */}
      {managingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-lg p-6 border border-indigo-500/30 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Access Governance
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {managingDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setManagingDoc(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Sensitivity Classification */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Sensitivity Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PUBLIC', label: 'PUBLIC', desc: 'All tenant users' },
                    { id: 'INTERNAL', label: 'INTERNAL', desc: 'Standard staff clearance' },
                    { id: 'CONFIDENTIAL', label: 'CONFIDENTIAL', desc: 'Department & team only' },
                    { id: 'HIGHLY_CONFIDENTIAL', label: 'HIGHLY CONFIDENTIAL', desc: 'Strict required groups only' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setDocClassification(lvl.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        docClassification === lvl.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-white/[0.06] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">{lvl.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {loadingAccessData ? (
                <div className="py-8 text-center text-slate-400">
                  <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-[11px] font-mono">Loading groups & users...</p>
                </div>
              ) : (
                <>
                  {/* Required Access Groups */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                        Required Access Groups
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {selectedGroupIds.size} selected
                      </span>
                    </div>
                    <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06] max-h-40 overflow-y-auto">
                      {availableGroups.length === 0 ? (
                        <p className="text-slate-500 text-[11px] p-2">No access groups found.</p>
                      ) : (
                        availableGroups.map((grp) => {
                          const isChecked = selectedGroupIds.has(grp.name) || selectedGroupIds.has(grp.id);
                          return (
                            <label
                              key={grp.id}
                              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const next = new Set(selectedGroupIds);
                                  if (e.target.checked) {
                                    next.add(grp.name);
                                  } else {
                                    next.delete(grp.name);
                                    next.delete(grp.id);
                                  }
                                  setSelectedGroupIds(next);
                                }}
                                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                              />
                              <span className="text-slate-200">{grp.name}</span>
                              <span className="text-[10px] font-mono text-slate-500 ml-auto">
                                {grp.description || 'Access group'}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Direct Allowed Users */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        Direct User Clearances
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {selectedUserIds.size} selected
                      </span>
                    </div>
                    <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06] max-h-40 overflow-y-auto">
                      {availableUsers.length === 0 ? (
                        <p className="text-slate-500 text-[11px] p-2">No users found.</p>
                      ) : (
                        availableUsers.map((usr) => (
                          <label
                            key={usr.id}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(usr.id)}
                              onChange={(e) => {
                                const next = new Set(selectedUserIds);
                                if (e.target.checked) next.add(usr.id);
                                else next.delete(usr.id);
                                setSelectedUserIds(next);
                              }}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                            />
                            <span className="text-slate-200">{usr.name}</span>
                            <span className="text-[10px] font-mono text-slate-500 ml-auto">
                              {usr.role_name || usr.department || 'Staff'}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setManagingDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAccess}
                disabled={savingAccess}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{savingAccess ? 'Saving Access...' : 'Save Access Rules'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
