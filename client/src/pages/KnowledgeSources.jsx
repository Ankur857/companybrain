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
  RefreshCw,
  Folder,
  FolderUp,
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  FileCode,
  Files
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
  const [docClassification, setDocClassification] = useState('INTERNAL');
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [loadingAccessData, setLoadingAccessData] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);

  // Supabase Manual Upload Modal State (Supports File & Folder Upload)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState('folder'); // 'file' | 'folder'
  const [uploadFolderName, setUploadFolderName] = useState('');
  const [folderFiles, setFolderFiles] = useState([]);
  const [folderReading, setFolderReading] = useState(false);
  const [folderReadProgress, setFolderReadProgress] = useState('');
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

  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderSearch, setFolderSearch] = useState('');

  const getDocFolderName = (doc) => {
    if (doc.metadata?.folderName && doc.metadata.folderName !== 'General' && doc.metadata.folderName !== 'Enterprise Knowledge') {
      return doc.metadata.folderName;
    }
    if (doc.title && doc.title.startsWith('[')) {
      const match = doc.title.match(/^\[(.*?)\]/);
      if (match) return match[1];
    }
    return null;
  };

  // Group documents into Folders vs Standalone Files
  const { folders, standaloneFiles } = React.useMemo(() => {
    const foldersMap = {};
    const standalone = [];

    filteredDocs.forEach((doc) => {
      const folderName = getDocFolderName(doc);
      if (folderName) {
        if (!foldersMap[folderName]) {
          foldersMap[folderName] = {
            id: `folder-${folderName}`,
            name: folderName,
            isFolder: true,
            source_type: doc.source_type,
            department: doc.department || 'Engineering',
            project: doc.project || folderName,
            files: [],
            totalSizeBytes: 0,
            updated_at: doc.updated_at,
          };
        }
        foldersMap[folderName].files.push(doc);
        foldersMap[folderName].totalSizeBytes += doc.metadata?.sizeBytes || 0;
        if (new Date(doc.updated_at) > new Date(foldersMap[folderName].updated_at)) {
          foldersMap[folderName].updated_at = doc.updated_at;
        }
      } else {
        standalone.push(doc);
      }
    });

    // Sort files within each folder in alphabetical / sequential order by relativePath or title
    Object.values(foldersMap).forEach((f) => {
      f.files.sort((a, b) => {
        const nameA = (a.metadata?.relativePath || a.metadata?.fileName || a.title).toLowerCase();
        const nameB = (b.metadata?.relativePath || b.metadata?.fileName || b.title).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    });

    return {
      folders: Object.values(foldersMap).sort((a, b) => a.name.localeCompare(b.name)),
      standaloneFiles: standalone,
    };
  }, [filteredDocs]);

  const activeFolderData = currentFolder
    ? folders.find((f) => f.name === currentFolder.name) || currentFolder
    : null;

  const folderFilteredFiles = React.useMemo(() => {
    if (!activeFolderData) return [];
    if (!folderSearch.trim()) return activeFolderData.files;
    const q = folderSearch.toLowerCase();
    return activeFolderData.files.filter((f) => {
      const title = f.title.toLowerCase();
      const path = (f.metadata?.relativePath || f.metadata?.fileName || '').toLowerCase();
      return title.includes(q) || path.includes(q);
    });
  }, [activeFolderData, folderSearch]);

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

  const handleFolderUploadChange = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    setFolderReading(true);
    setFolderReadProgress(`Discovering files in folder...`);

    // Detect folder root name from webkitRelativePath
    let detectedFolder = '';
    const firstRel = rawFiles[0].webkitRelativePath;
    if (firstRel && firstRel.includes('/')) {
      detectedFolder = firstRel.split('/')[0];
    } else {
      detectedFolder = 'Knowledge_Folder';
    }

    setUploadFolderName(detectedFolder);
    setUploadForm((prev) => ({
      ...prev,
      project: prev.project && prev.project !== 'Core' ? prev.project : detectedFolder,
    }));

    const processed = [];
    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      setFolderReadProgress(`Reading file ${i + 1} of ${rawFiles.length}: ${file.name}`);

      const relPath = file.webkitRelativePath || file.name;
      // Skip hidden system files and noise
      if (file.name.startsWith('.') || relPath.includes('/.git/') || relPath.includes('node_modules/')) {
        continue;
      }

      const isText =
        file.type.startsWith('text/') ||
        /\.(txt|md|json|csv|js|ts|jsx|tsx|html|css|py|java|go|rb|php|xml|yaml|yml|sql|prisma|sh|env|log)$/i.test(file.name);

      let content = '';
      try {
        if (isText) {
          content = await file.text();
        } else {
          content = `[Enterprise Document: ${file.name}] (${(file.size / 1024).toFixed(1)} KB, path: ${relPath}, type: ${file.type || 'application/octet-stream'}). Ingested directly into Supabase Knowledge Storage for CompanyBrain semantic retrieval and policy-governed RAG access.`;
        }
      } catch (err) {
        content = `[Document: ${file.name}] (${(file.size / 1024).toFixed(1)} KB, path: ${relPath})`;
      }

      processed.push({
        fileName: file.name,
        relativePath: relPath,
        fileType: file.type || 'text/plain',
        sizeBytes: file.size,
        content,
      });
    }

    setFolderFiles(processed);
    setFolderReading(false);
    setFolderReadProgress('');
  };

  const handleSubmitFolderUpload = async () => {
    if (folderFiles.length === 0) {
      showToast('No valid documents found in selected folder.', 'error');
      return;
    }

    setUploadingDoc(true);
    try {
      const res = await api.uploadSupabaseFolder({
        folderName: uploadFolderName.trim() || 'Uploaded Folder',
        department: uploadForm.department,
        project: uploadForm.project || uploadFolderName.trim(),
        classification: uploadForm.classification,
        required_groups: Array.from(uploadSelectedGroupIds),
        allowed_user_ids: Array.from(uploadSelectedUserIds),
        files: folderFiles,
      });

      if (res.success) {
        showToast(
          `Folder "${uploadFolderName || 'Uploaded Folder'}" with ${res.count} document(s) uploaded to Supabase successfully!`,
          'success'
        );
        setShowUploadModal(false);
        setFolderFiles([]);
        setUploadFolderName('');
        setUploadFileObj(null);
        setUploadSelectedGroupIds(new Set());
        setUploadSelectedUserIds(new Set());
        loadDocuments();
      }
    } catch (err) {
      console.error('Folder upload error:', err);
      showToast(`Folder upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingDoc(false);
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

      {/* Folder View OR Top-Level Knowledge Sources Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-mono text-slate-500">Loading indexed documents...</p>
        </div>
      ) : activeFolderData ? (
        /* ================= FOLDER DRILL-DOWN ORDERED VIEW ================= */
        <div className="space-y-4">
          {/* Breadcrumb & Folder Header Bar */}
          <div className="card-clean p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-indigo-500/25 bg-slate-900/90 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCurrentFolder(null);
                  setFolderSearch('');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/[0.08] shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Knowledge Sources</span>
              </button>
              <span className="text-slate-600 font-mono">/</span>
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-400 fill-amber-400/20 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{activeFolderData.name}</span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/25">
                      {activeFolderData.files.length} {activeFolderData.files.length === 1 ? 'file' : 'files'} in order
                    </span>
                  </h2>
                </div>
              </div>
            </div>

            {/* In-Folder Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                placeholder={`Search within ${activeFolderData.name}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Sequential Ordered List of Files */}
          {folderFilteredFiles.length === 0 ? (
            <div className="p-8 text-center card-clean text-slate-400 space-y-2 border border-white/[0.08]">
              <FileText className="w-6 h-6 mx-auto text-slate-600" />
              <p className="text-xs">No files matched your search inside this folder.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {folderFilteredFiles.map((file, index) => {
                const cleanFileName =
                  file.metadata?.relativePath ||
                  file.metadata?.fileName ||
                  file.title.replace(/^\[.*?\]\s*/, '');

                return (
                  <div
                    key={file.id}
                    className="card-clean p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/[0.06] hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Order Index Pill */}
                      <span className="w-6 h-6 rounded-md bg-slate-900 border border-white/[0.08] text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* File Icon */}
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <FileCode className="w-4 h-4" />
                      </div>

                      {/* File Name & Details */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {cleanFileName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400 flex-wrap">
                          <span className="text-slate-500 uppercase">{file.source_type}</span>
                          <span>•</span>
                          <span>Dept: {file.department || 'Engineering'}</span>
                          {file.metadata?.sizeBytes ? (
                            <>
                              <span>•</span>
                              <span>{(file.metadata.sizeBytes / 1024).toFixed(1)} KB</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <SecurityBadge classification={file.classification} size="xs" />

                      {file.canAccess ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> CLEARANCE
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 font-medium">
                          <Lock className="w-3 h-3" /> RESTRICTED
                        </span>
                      )}

                      <button
                        onClick={() => openDoc(file)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-white/[0.08] text-[11px] font-medium flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => openManageAccess(file)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-white/[0.08] text-[11px] font-medium flex items-center gap-1 transition-all"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : folders.length === 0 && standaloneFiles.length === 0 ? (
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
                : 'Only genuine files that you add from Google Drive or manually upload to Supabase (Admin) are displayed here.'}
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
        /* ================= TOP-LEVEL KNOWLEDGE SOURCES (FOLDERS & STANDALONE FILES) ================= */
        <div className="space-y-6">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider px-1">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>Uploaded Knowledge Folders ({folders.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setCurrentFolder(folder);
                      setFolderSearch('');
                    }}
                    className="card-clean card-interactive p-5 flex flex-col justify-between space-y-4 border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 hover:border-amber-500/40 cursor-pointer group shadow-sm transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25 font-bold">
                          <Folder className="w-3 h-3 text-amber-400 fill-amber-400/20" /> FOLDER
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {folder.files.length} {folder.files.length === 1 ? 'file' : 'files'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                          <span>{folder.name}</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          Click to view all {folder.files.length} documents inside this folder in sequential order.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 flex-wrap pt-1">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/[0.06] text-slate-300">
                          {folder.source_type}
                        </span>
                        <span>Dept: {folder.department}</span>
                        {folder.project && <span>• {folder.project}</span>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-amber-400 font-semibold group-hover:text-amber-300">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Open Folder</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standalone Files Section */}
          {standaloneFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider px-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Standalone Files ({standaloneFiles.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {standaloneFiles.map((doc) => (
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
                ))}
              </div>
            </div>
          )}
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
                {/* Mode Selector: Single Document vs Entire Folder */}
                <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setUploadMode('folder')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                      uploadMode === 'folder'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FolderUp className="w-4 h-4" />
                    <span>Upload Entire Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                      uploadMode === 'file'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Upload Single File</span>
                  </button>
                </div>

                {uploadMode === 'folder' ? (
                  /* ENTIRE FOLDER UPLOAD ZONE */
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-medium flex items-center justify-between">
                        <span>Select or Drop Folder</span>
                        <span className="text-[11px] font-mono text-slate-400">All nested files will be read & indexed</span>
                      </label>
                      <label className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-900/50">
                        <input
                          type="file"
                          webkitdirectory=""
                          directory=""
                          multiple
                          onChange={handleFolderUploadChange}
                          className="hidden"
                        />
                        <FolderUp className="w-9 h-9 text-indigo-400 mb-2" />
                        {folderFiles.length > 0 ? (
                          <div className="text-center">
                            <span className="text-white font-semibold block text-sm">
                              📁 {uploadFolderName}
                            </span>
                            <span className="text-[11px] font-mono text-emerald-400">
                              {folderFiles.length} file(s) discovered • Ready to ingest
                            </span>
                          </div>
                        ) : folderReading ? (
                          <div className="text-center">
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                            <span className="text-xs text-indigo-300">{folderReadProgress}</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-slate-200 font-medium block">Click to select a Folder from your computer</span>
                            <span className="text-[11px] text-slate-500 mt-0.5">
                              Reads all nested documents, code, PDFs, and data files inside the folder
                            </span>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* Folder Name Identifier */}
                    <div className="space-y-1">
                      <label className="text-slate-300 font-medium">Folder / Knowledge Name *</label>
                      <input
                        type="text"
                        value={uploadFolderName}
                        onChange={(e) => setUploadFolderName(e.target.value)}
                        placeholder="e.g. Project_Documentation, Compliance_Policies"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs font-mono"
                      />
                    </div>

                    {/* Preview of Detected Files in Folder */}
                    {folderFiles.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span>Discovered Files ({folderFiles.length})</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {(folderFiles.reduce((acc, f) => acc + (f.sizeBytes || 0), 0) / 1024).toFixed(1)} KB Total
                          </span>
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06]">
                          {folderFiles.slice(0, 50).map((f, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] p-1 rounded bg-slate-900/60 border border-white/[0.02]">
                              <span className="text-slate-300 truncate max-w-sm font-mono">{f.relativePath}</span>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                                {(f.sizeBytes / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          ))}
                          {folderFiles.length > 50 && (
                            <div className="text-[10px] font-mono text-slate-500 text-center py-1">
                              + {folderFiles.length - 50} more files
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* SINGLE FILE UPLOAD ZONE */
                  <div className="space-y-3">
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
                  </div>
                )}

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
                    list="ks-project-options"
                    value={uploadForm.project}
                    onChange={(e) => setUploadForm({ ...uploadForm, project: e.target.value })}
                    placeholder="e.g. Project Alpha, Core Knowledge"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                  />
                  <datalist id="ks-project-options">
                    <option value="Project Alpha" />
                    <option value="Project Stealth Finance" />
                    <option value="Project Beta" />
                    <option value="Project Gamma" />
                    <option value="Core Knowledge" />
                  </datalist>
                </div>

                {/* Content preview/edit (Single File mode only) */}
                {uploadMode === 'file' && (
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
                )}

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
                onClick={uploadMode === 'folder' ? handleSubmitFolderUpload : handleSubmitUpload}
                disabled={
                  uploadingDoc ||
                  (uploadMode === 'folder'
                    ? folderFiles.length === 0 || !uploadFolderName.trim()
                    : !uploadForm.title.trim() || !uploadForm.content.trim())
                }
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                {uploadingDoc ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{uploadMode === 'folder' ? 'Uploading Folder...' : 'Uploading...'}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>
                      {uploadMode === 'folder'
                        ? `Upload Folder (${folderFiles.length} Docs)`
                        : 'Upload to Supabase'}
                    </span>
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
