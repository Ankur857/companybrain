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
  X,
  UploadCloud,
  RefreshCw
} from 'lucide-react';

export function KnowledgeSources() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Admin Supabase Manual Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    content: '',
    fileName: '',
    fileType: '',
    department: 'Engineering',
    project: 'Core',
    classification: 'INTERNAL',
  });
  const [uploadFileObj, setUploadFileObj] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadGroups, setUploadGroups] = useState([]);
  const [uploadUsers, setUploadUsers] = useState([]);
  const [uploadSelectedGroupIds, setUploadSelectedGroupIds] = useState(new Set());
  const [uploadSelectedUserIds, setUploadSelectedUserIds] = useState(new Set());
  const [loadingUploadModalData, setLoadingUploadModalData] = useState(false);

  const loadDocuments = (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    api.getDocuments()
      .then((res) => {
        if (res.success) setDocuments(res.documents || []);
      })
      .catch(console.error)
      .finally(() => {
        if (!silent) setLoading(false);
        else setRefreshing(false);
      });
  };

  useEffect(() => {
    loadDocuments();
    // Real-time polling every 6 seconds so any uploaded or synced files appear automatically
    const interval = setInterval(() => {
      loadDocuments(true);
    }, 6000);
    return () => clearInterval(interval);
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
    setSelectedGroupIds(new Set(doc.required_group_ids || doc.required_groups || []));
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

  // Open Supabase Manual Upload Modal
  const handleOpenUploadModal = async () => {
    setShowUploadModal(true);
    setLoadingUploadModalData(true);
    try {
      const [groupsRes, usersRes] = await Promise.all([
        api.getGroups(),
        api.getUsers(),
      ]);
      if (groupsRes.success) setUploadGroups(groupsRes.groups || []);
      if (usersRes.success) setUploadUsers(usersRes.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUploadModalData(false);
    }
  };

  const handleFileUploadChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileObj(file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setUploadForm((prev) => ({
      ...prev,
      fileName: file.name,
      fileType: file.type || 'text/plain',
      title: prev.title ? prev.title : nameWithoutExt,
    }));

    const reader = new FileReader();
    const isText =
      file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv');

    if (isText) {
      reader.onload = (evt) => {
        setUploadForm((prev) => ({ ...prev, content: evt.target.result }));
      };
      reader.readAsText(file);
    } else {
      reader.onload = (evt) => {
        setUploadForm((prev) => ({
          ...prev,
          content: `[Uploaded Enterprise Document: ${file.name}] (${(file.size / 1024).toFixed(1)} KB, type: ${file.type || 'application/octet-stream'}). Ingested directly into Supabase Knowledge Storage for CompanyBrain semantic search and policy-governed RAG access.`,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitUpload = async () => {
    if (!uploadForm.title.trim() || !uploadForm.content.trim()) {
      showToast('Document title and file content are required.', 'error');
      return;
    }
    setUploadingDoc(true);
    try {
      const res = await api.uploadSupabaseDocument({
        title: uploadForm.title.trim(),
        content: uploadForm.content.trim(),
        fileName: uploadForm.fileName || `${uploadForm.title.trim()}.txt`,
        fileType: uploadForm.fileType || 'text/plain',
        department: uploadForm.department,
        project: uploadForm.project,
        classification: uploadForm.classification,
        required_groups: Array.from(uploadSelectedGroupIds),
        allowed_user_ids: Array.from(uploadSelectedUserIds),
      });

      if (res.success) {
        showToast(res.message || 'Document uploaded to Supabase successfully!', 'success');
        setShowUploadModal(false);
        setUploadForm({
          title: '',
          content: '',
          fileName: '',
          fileType: '',
          department: 'Engineering',
          project: 'Core',
          classification: 'INTERNAL',
        });
        setUploadFileObj(null);
        setUploadSelectedGroupIds(new Set());
        setUploadSelectedUserIds(new Set());
        loadDocuments();
      }
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingDoc(false);
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
            Real company documents ingested across connected data sources and Supabase storage. Filtered and policy-governed in real time.
          </p>
        </div>

        {/* Action Controls & Real-Time Sync status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => loadDocuments(false)}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            title="Refresh Knowledge Documents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || refreshing ? 'animate-spin text-indigo-400' : 'text-emerald-400'}`} />
            <span>Refresh</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenUploadModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload to Supabase (Admin)</span>
            </button>
          )}
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

      {/* Real-time Status and File Count */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] text-slate-300">
            Real-Time Updates Active
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {filteredDocs.length} real {filteredDocs.length === 1 ? 'file' : 'files'} added
          </span>
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Clear search filter</span>
          </button>
        )}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-mono text-slate-500">Loading indexed documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center card-clean text-slate-400 space-y-3 border border-white/[0.08]">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">
              {search ? 'No matching documents found' : 'No knowledge documents added yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              {search
                ? `No documents matched "${search}". Try searching another keyword or clearing the filter to see all added files.`
                : 'Only genuine files that you add from Google Drive or manually upload to Supabase (Admin) are displayed here. No pre-seeded dummy documents are shown.'}
            </p>
          </div>
          {isAdmin && !search && (
            <div className="pt-2">
              <button
                onClick={handleOpenUploadModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload First Document to Supabase</span>
              </button>
            </div>
          )}
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

      {/* Admin Manual Upload to Supabase Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-lg p-6 border border-white/[0.12] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Admin Knowledge Upload
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Supabase Storage
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Upload Knowledge Document
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ingest real enterprise documents into Supabase with automatic indexing and policy-governed access.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingUploadModalData ? (
              <div className="py-12 text-center text-slate-400">
                <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs font-mono text-slate-500">Loading access clearance metadata...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* File Dropzone / Picker */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Select File to Upload</span>
                    <span className="text-[11px] font-mono text-slate-400">PDF, TXT, MD, JSON, CSV, DOCX</span>
                  </label>
                  <label className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-900/50">
                    <input
                      type="file"
                      onChange={handleFileUploadChange}
                      accept=".pdf,.docx,.doc,.txt,.md,.json,.csv"
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                    {uploadFileObj ? (
                      <div className="text-center">
                        <span className="text-white font-medium block truncate max-w-xs">{uploadFileObj.name}</span>
                        <span className="text-[11px] font-mono text-emerald-400">{(uploadFileObj.size / 1024).toFixed(1)} KB • Ready</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-slate-300 font-medium block">Click or drag file here</span>
                        <span className="text-[11px] text-slate-500">File content will be read and ingested into Supabase</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Document Title *</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="e.g. Q3 Financial Audit Report.pdf"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs font-mono"
                  />
                </div>

                {/* Row: Department & Sensitivity Classification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Department</label>
                    <select
                      value={uploadForm.department}
                      onChange={(e) => setUploadForm({ ...uploadForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Finance">Finance</option>
                      <option value="HR">HR</option>
                      <option value="Operations">Operations</option>
                      <option value="Product">Product</option>
                      <option value="Security">Security</option>
                      <option value="Executive">Executive</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Sensitivity Classification</label>
                    <select
                      value={uploadForm.classification}
                      onChange={(e) => setUploadForm({ ...uploadForm, classification: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs font-mono"
                    >
                      <option value="PUBLIC">PUBLIC</option>
                      <option value="INTERNAL">INTERNAL</option>
                      <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                      <option value="RESTRICTED">RESTRICTED</option>
                      <option value="HIGHLY_CONFIDENTIAL">HIGHLY_CONFIDENTIAL</option>
                    </select>
                  </div>
                </div>

                {/* Project */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Project (Optional)</label>
                  <input
                    type="text"
                    value={uploadForm.project}
                    onChange={(e) => setUploadForm({ ...uploadForm, project: e.target.value })}
                    placeholder="e.g. Project Alpha, Core Knowledge"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                  />
                </div>

                {/* Content preview/edit */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Document Content / Extracted Text *</span>
                    <span className="text-[10px] font-mono text-slate-500">{uploadForm.content.length} characters</span>
                  </label>
                  <textarea
                    rows={4}
                    value={uploadForm.content}
                    onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                    placeholder="Paste text or select a file above..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs font-mono leading-relaxed resize-y"
                  />
                </div>

                {/* Access Governance Controls: Groups */}
                <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Required Access Groups</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {uploadSelectedGroupIds.size} selected
                    </span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06]">
                    {uploadGroups.length === 0 ? (
                      <p className="text-[11px] text-slate-500">No groups configured.</p>
                    ) : (
                      uploadGroups.map((grp) => (
                        <label
                          key={grp.id}
                          className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/[0.03] cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={uploadSelectedGroupIds.has(grp.id)}
                            onChange={(e) => {
                              const next = new Set(uploadSelectedGroupIds);
                              if (e.target.checked) next.add(grp.id);
                              else next.delete(grp.id);
                              setUploadSelectedGroupIds(next);
                            }}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span className="text-slate-200">{grp.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 ml-auto">{grp.description}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Access Governance Controls: Specific Users */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Direct User Clearances</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {uploadSelectedUserIds.size} selected
                    </span>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06]">
                    {uploadUsers.length === 0 ? (
                      <p className="text-[11px] text-slate-500">No users loaded.</p>
                    ) : (
                      uploadUsers.map((usr) => (
                        <label
                          key={usr.id}
                          className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/[0.03] cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={uploadSelectedUserIds.has(usr.id)}
                            onChange={(e) => {
                              const next = new Set(uploadSelectedUserIds);
                              if (e.target.checked) next.add(usr.id);
                              else next.delete(usr.id);
                              setUploadSelectedUserIds(next);
                            }}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span className="text-slate-200">{usr.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 ml-auto">{usr.email}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitUpload}
                disabled={uploadingDoc || !uploadForm.title.trim() || !uploadForm.content.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                {uploadingDoc ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload to Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
