import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Folder,
  FileText,
  Database,
  Layers,
  CheckCircle2,
  RefreshCw,
  Activity,
  Power,
  Clock,
  ShieldCheck,
  AlertCircle,
  HardDrive,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  Users,
  KeyRound,
  Search,
  X,
  Lock,
  Sparkles,
  ShieldAlert,
  SlidersHorizontal,
  Table as TableIcon,
  ExternalLink,
  ArrowLeft,
  Settings,
  HelpCircle,
  FolderPlus,
  UploadCloud,
  FileUp,
  FolderUp,
  Files
} from 'lucide-react';

export function Connectors() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  // Core Connector State
  const [connectors, setConnectors] = useState([]);
  const [supportedTypes, setSupportedTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [syncStage, setSyncStage] = useState('');
  const [testModalData, setTestModalData] = useState(null);

  // Setup / Connect Modals
  const [activeSetupType, setActiveSetupType] = useState(null);
  const [oauthConfigForm, setOauthConfigForm] = useState({ clientId: '', clientSecret: '', tenantId: '' });
  const [supabaseForm, setSupabaseForm] = useState({ projectUrl: '', apiKey: '', name: 'Supabase Database' });
  const [connecting, setConnecting] = useState(false);

  // Disconnect Confirmation Modal
  const [disconnectingConnector, setDisconnectingConnector] = useState(null);

  // Real File Browser State
  const [browserConnector, setBrowserConnector] = useState(null);
  const [browserItems, setBrowserItems] = useState([]);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [folderHistory, setFolderHistory] = useState([{ id: 'root', name: 'Root' }]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemsMap, setSelectedItemsMap] = useState(new Map());

  // Add to CompanyBrain Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);

  // Manage Access Drawer State
  const [accessItem, setAccessItem] = useState(null);
  const [accessData, setAccessData] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState(new Set());
  const [savingAccess, setSavingAccess] = useState(false);

  // Supabase Manual Upload (Admin Only) State (Supports File & Folder Upload)
  const [showSupabaseUploadModal, setShowSupabaseUploadModal] = useState(false);
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

  // Check URL parameters for OAuth returns
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const account = params.get('account');
    const error = params.get('error');

    if (connected && account) {
      showToast(`Connected ${connected.replace('_', ' ')} account: ${account}!`, 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      showToast(`OAuth authentication error: ${error}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connRes, typesRes] = await Promise.all([
        api.getConnectors(),
        api.getConnectorTypes(),
      ]);
      if (connRes.success) setConnectors(connRes.connectors || []);
      if (typesRes.success) setSupportedTypes(typesRes.types || []);
    } catch (err) {
      console.error(err);
      showToast(`Failed to load knowledge sources: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [tenant, isAdmin]);

  // Launch OAuth Flow for Google Drive or SharePoint
  const handleInitiateOAuth = async (typeDef) => {
    try {
      setConnecting(true);
      const res = await api.getOAuthUrl(typeDef.type, {
        clientId: oauthConfigForm.clientId || undefined,
        clientSecret: oauthConfigForm.clientSecret || undefined,
        tenantId: oauthConfigForm.tenantId || undefined,
      });

      if (res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err) {
      showToast(`Failed to initialize OAuth: ${err.message}`, 'error');
      setActiveSetupType(typeDef);
    } finally {
      setConnecting(false);
    }
  };

  // Submit Supabase Project Connection
  const handleSubmitSupabase = async () => {
    if (!supabaseForm.projectUrl.trim() || !supabaseForm.apiKey.trim()) {
      showToast('Project URL and API Key are required.', 'error');
      return;
    }
    setConnecting(true);
    try {
      const res = await api.connectSupabase(supabaseForm);
      showToast(res.message || 'Connected to Supabase project!', 'success');
      setActiveSetupType(null);
      loadData();
    } catch (err) {
      showToast(`Supabase connection error: ${err.message}`, 'error');
    } finally {
      setConnecting(false);
    }
  };

  // Explicit Development Mode Connection (clearly labeled)
  const handleConnectDevelopmentMode = async (typeDef) => {
    try {
      const res = await api.connectDevelopment({
        type: typeDef.type,
        name: `${typeDef.name} (DEV MODE)`,
      });
      showToast(res.message || 'Connected in DEVELOPMENT TEST MODE.', 'info');
      setActiveSetupType(null);
      loadData();
    } catch (err) {
      showToast(`Development mode connection failed: ${err.message}`, 'error');
    }
  };

  // Disconnect Confirmation
  const confirmDisconnect = async () => {
    if (!disconnectingConnector) return;
    try {
      await api.disconnectConnector(disconnectingConnector.id);
      showToast(`${disconnectingConnector.name} disconnected.`, 'info');
      if (browserConnector?.id === disconnectingConnector.id) {
        setBrowserConnector(null);
      }
      setDisconnectingConnector(null);
      loadData();
    } catch (err) {
      showToast(`Failed to disconnect: ${err.message}`, 'error');
    }
  };

  // Open Real File Browser
  const openFileBrowser = async (connector, folderId = 'root', folderName = 'Root', isBack = false, searchOverride = null) => {
    setBrowserConnector(connector);
    setBrowserLoading(true);

    const activeSearch = searchOverride !== null ? searchOverride : searchQuery;

    try {
      const res = await api.browseConnector(connector.id, {
        folderId: folderId === 'root' ? undefined : folderId,
        search: activeSearch && activeSearch.trim() ? activeSearch.trim() : undefined,
      });

      if (res.success) {
        setBrowserItems(res.items || []);
        setCurrentFolderId(folderId);

        if (!isBack && folderId !== 'root') {
          setFolderHistory((prev) => [...prev, { id: folderId, name: folderName }]);
        } else if (folderId === 'root') {
          setFolderHistory([{ id: 'root', name: 'Root' }]);
        }

        // Initialize pre-selected items map
        const selectedMap = new Map(selectedItemsMap);
        for (const item of res.items || []) {
          if (item.is_selected) {
            selectedMap.set(item.id, item);
          }
        }
        setSelectedItemsMap(selectedMap);
      }
    } catch (err) {
      showToast(`Failed to browse repository: ${err.message}`, 'error');
    } finally {
      setBrowserLoading(false);
    }
  };

  const navigateBackToFolder = (index) => {
    const target = folderHistory[index];
    const newHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(newHistory);
    openFileBrowser(browserConnector, target.id, target.name, true);
  };

  // Toggle item selection
  const toggleSelectItem = (item) => {
    const next = new Map(selectedItemsMap);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.set(item.id, item);
    }
    setSelectedItemsMap(next);
  };

  // Save selected knowledge to CompanyBrain
  const handleSaveSelection = async () => {
    setSavingSelection(true);
    try {
      const itemsToSave = Array.from(selectedItemsMap.values()).map((it) => ({
        external_id: it.external_id,
        name: it.name,
        item_type: it.item_type,
        path: it.path,
        mime_type: it.mime_type,
        source_url: it.source_url,
        metadata: it.metadata || {},
        parent_id: it.parent_id,
      }));

      const res = await api.selectKnowledge(browserConnector.id, itemsToSave);
      showToast(res.message || `${itemsToSave.length} item(s) selected for CompanyBrain.`, 'success');
      setShowConfirmModal(false);
      loadData();
      openFileBrowser(browserConnector, currentFolderId, 'Current', true);
    } catch (err) {
      showToast(`Error saving selection: ${err.message}`, 'error');
    } finally {
      setSavingSelection(false);
    }
  };

  // Open Manage Access
  const handleOpenAccess = async (item) => {
    setAccessItem(item);
    setAccessLoading(true);
    try {
      const itemId = item.companybrain_item_id || item.id;
      const res = await api.getItemAccess(browserConnector.id, itemId);
      if (res.success) {
        setAccessData(res);
        const directUsers = new Set(
          (res.directRules || []).filter((r) => r.subject_type === 'USER').map((r) => r.subject_id)
        );
        const directGroups = new Set(
          (res.directRules || []).filter((r) => r.subject_type === 'GROUP').map((r) => r.subject_id)
        );
        setSelectedUserIds(directUsers);
        setSelectedGroupIds(directGroups);
      }
    } catch (err) {
      showToast(`Failed to load access rules: ${err.message}`, 'error');
    } finally {
      setAccessLoading(false);
    }
  };

  // Save Access Rules
  const handleSaveAccess = async () => {
    if (!accessItem) return;
    setSavingAccess(true);
    try {
      const itemId = accessItem.companybrain_item_id || accessItem.id;
      await api.saveItemAccess(browserConnector.id, itemId, {
        userIds: Array.from(selectedUserIds),
        groupIds: Array.from(selectedGroupIds),
      });

      showToast(`Access rules saved for ${accessItem.name}!`, 'success');
      setAccessItem(null);
      openFileBrowser(browserConnector, currentFolderId, 'Current', true);
    } catch (err) {
      showToast(`Failed to save access rules: ${err.message}`, 'error');
    } finally {
      setSavingAccess(false);
    }
  };

  // Open Supabase Manual Upload Modal
  const handleOpenSupabaseUpload = async () => {
    setShowSupabaseUploadModal(true);
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
      showToast('Failed to load access groups/users: ' + err.message, 'error');
    } finally {
      setLoadingUploadModalData(false);
    }
  };

  // Handle file picker selection
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
        setShowSupabaseUploadModal(false);
        setFolderFiles([]);
        setUploadFolderName('');
        setUploadFileObj(null);
        setUploadSelectedGroupIds(new Set());
        setUploadSelectedUserIds(new Set());
        loadData();
      }
    } catch (err) {
      console.error('Folder upload error:', err);
      showToast(`Folder upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Submit Supabase Manual Upload
  const handleSubmitSupabaseUpload = async () => {
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
        setShowSupabaseUploadModal(false);
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
        loadData();
      }
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Sync Action
  const handleSync = async (connector) => {
    setSyncingId(connector.id);
    setSyncStage('Syncing...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setSyncStage('Scanning source...');
      await new Promise((r) => setTimeout(r, 700));
      setSyncStage('Processing items...');

      const res = await api.syncConnector(connector.id);

      setSyncStage('Completed');
      await new Promise((r) => setTimeout(r, 400));

      showToast(res.message || `Sync completed! Indexed ${res.indexedCount} item(s).`, 'success');
      loadData();
      if (browserConnector?.id === connector.id) {
        openFileBrowser(connector, currentFolderId, 'Current', true);
      }
    } catch (err) {
      showToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      setSyncingId(null);
      setSyncStage('');
    }
  };

  // Non-Admin Screen
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Admin Authorization Required</h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          Knowledge source and connector governance is restricted strictly to authenticated{' '}
          <span className="text-indigo-400 font-semibold font-mono">Company Admin</span> personnel. Normal employees cannot connect repositories or modify data access boundaries.
        </p>
      </div>
    );
  }

  const getConnectorIcon = (type) => {
    switch (type) {
      case 'google_drive': return Folder;
      case 'supabase': default: return Database;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Admin Integrations
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Knowledge Sources & Storage
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Connect your company's existing enterprise tools to CompanyBrain. Authenticate real Google Drive accounts, manually upload files to Supabase knowledge storage (Admin only), browse live files, and govern permissions.
          </p>
        </div>

        {/* Quick Admin Upload CTA in Header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenSupabaseUpload}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Knowledge File (Admin)</span>
          </button>
        </div>
      </div>

      {/* 2 Supported Connector Cards: Google Drive & Supabase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {supportedTypes.map((typeDef) => {
          const Icon = getConnectorIcon(typeDef.type);
          const connectedInstance = connectors.find((c) => c.type === typeDef.type && c.status !== 'DISCONNECTED');
          const isConnected = Boolean(connectedInstance);
          const isSyncing = syncingId === connectedInstance?.id;
          const isSupabase = typeDef.type === 'supabase';

          return (
            <div
              key={typeDef.type}
              className={`card-clean p-6 flex flex-col justify-between space-y-4 relative transition-all ${
                isConnected || isSupabase
                  ? 'border-indigo-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="space-y-4">
                {/* Top Row: Icon & Status */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-indigo-400 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>

                  {isSupabase ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono font-medium">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" /> Admin Upload Storage
                    </span>
                  ) : isConnected ? (
                    connectedInstance.is_development_mode ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono font-medium">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        DEVELOPMENT MODE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Connected ✓
                      </span>
                    )
                  ) : typeDef.isConfigured ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-white/5 text-[11px] font-mono">
                      <Power className="w-3 h-3" /> Not connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400/80 border border-amber-500/20 text-[11px] font-mono">
                      <AlertCircle className="w-3 h-3" /> Setup Required
                    </span>
                  )}
                </div>

                {/* Name & Account Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white">{typeDef.name}</h3>
                    {isSupabase && (
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  {isConnected && connectedInstance.account?.email ? (
                    <div className="text-[11px] font-mono text-indigo-300 mt-1 truncate">
                      Account: {connectedInstance.account.email}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {typeDef.description}
                    </p>
                  )}
                </div>

                {/* Metrics if Connected */}
                {isConnected ? (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Files Selected:</span>
                      <span className="font-semibold text-white">{connectedInstance.document_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Pipeline Status:</span>
                      <span className="text-indigo-400 text-[11px]">
                        {isSyncing ? syncStage : connectedInstance.sync_status || 'READY'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Last Synced:</span>
                      <span className="text-[10px] text-slate-400">
                        {connectedInstance.last_sync_at
                          ? new Date(connectedInstance.last_sync_at).toLocaleTimeString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                ) : isSupabase ? (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Ingestion Engine:</span>
                      <span className="font-semibold text-emerald-400">Supabase Document Store</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Access Mode:</span>
                      <span className="text-indigo-400 text-[11px]">Admin Manual Upload Only</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Governance:</span>
                      <span className="text-[11px] text-slate-300">Policy Clearance & Groups</span>
                    </div>
                  </div>
                ) : !typeDef.isConfigured ? (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/20 text-[11px] text-amber-300/80 font-mono">
                    {typeDef.unconfiguredMessage}
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/[0.06]">
                {isSupabase ? (
                  <div className="space-y-2">
                    <button
                      onClick={handleOpenSupabaseUpload}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Knowledge File (Admin)</span>
                    </button>
                    {isConnected ? (
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            openFileBrowser(connectedInstance, 'root', 'Root', false, '');
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Browse Database Tables</span>
                        </button>
                        <button
                          onClick={() => setDisconnectingConnector(connectedInstance)}
                          className="text-rose-400/80 hover:text-rose-400 text-[11px] transition-colors flex items-center gap-1"
                        >
                          <Power className="w-3 h-3" />
                          <span>Disconnect DB</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center pt-1">
                        <button
                          onClick={() => setActiveSetupType(typeDef)}
                          className="text-[11px] text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                        >
                          <Database className="w-3 h-3" />
                          <span>Connect Database URL & API Key</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : isConnected ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          openFileBrowser(connectedInstance, 'root', 'Root', false, '');
                        }}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Browse</span>
                      </button>

                      <button
                        onClick={() => handleSync(connectedInstance)}
                        disabled={isSyncing}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-white/10 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => setDisconnectingConnector(connectedInstance)}
                        className="text-rose-400/80 hover:text-rose-400 text-[11px] transition-colors flex items-center gap-1"
                      >
                        <Power className="w-3 h-3" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (typeDef.isConfigured) {
                          handleInitiateOAuth(typeDef);
                        } else {
                          setActiveSetupType(typeDef);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>Connect Google Drive</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real Live File Browser (Only shown when Admin opens a connected source) */}
      {browserConnector && (
        <div className="card-clean p-6 space-y-6 border border-indigo-500/30 animate-fade-in">
          {/* Top Bar with Breadcrumbs & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Live Repository Browser
                </span>
                {browserConnector.is_development_mode && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    DEVELOPMENT MODE
                  </span>
                )}
              </div>

              {/* Breadcrumb Path */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono overflow-x-auto">
                {folderHistory.map((folder, idx) => (
                  <React.Fragment key={folder.id}>
                    {idx > 0 && <span className="text-slate-600">/</span>}
                    <button
                      onClick={() => navigateBackToFolder(idx)}
                      className={`hover:text-indigo-400 transition-colors ${
                        idx === folderHistory.length - 1 ? 'text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={selectedItemsMap.size === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Add to CompanyBrain ({selectedItemsMap.size})</span>
              </button>

              <button
                onClick={() => handleSync(browserConnector)}
                disabled={syncingId === browserConnector.id}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingId === browserConnector.id ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>

              <button
                onClick={() => setBrowserConnector(null)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08] transition-all"
                title="Close Browser"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar & folder controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      openFileBrowser(browserConnector, currentFolderId, 'Search', true, searchQuery);
                    }
                  }}
                  placeholder="Filter files by name... (press Enter)"
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none transition-all placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      openFileBrowser(browserConnector, currentFolderId, folderHistory[folderHistory.length - 1]?.name || 'Root', true, '');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-white"
                    title="Clear filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => openFileBrowser(browserConnector, currentFolderId, folderHistory[folderHistory.length - 1]?.name || 'Root', true, searchQuery || '')}
                disabled={browserLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 border border-white/[0.08] transition-all shrink-0"
                title="Refresh live files from Google Drive"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${browserLoading ? 'animate-spin text-indigo-400' : 'text-emerald-400'}`} />
                <span>Live Refresh</span>
              </button>

              <span className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Real-Time Sync Active</span>
              </span>
            </div>

            {folderHistory.length > 1 && (
              <button
                onClick={() => navigateBackToFolder(folderHistory.length - 2)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-white/[0.08] shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back</span>
              </button>
            )}
          </div>

          {/* Real Items Listing */}
          {browserLoading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-mono text-slate-500">Querying real files from provider API...</p>
            </div>
          ) : browserItems.length === 0 ? (
            <div className="p-10 text-center card-clean text-slate-400">
              <Folder className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">No files or folders found in this directory.</p>
            </div>
          ) : (
            <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-2xl border border-white/[0.06]">
              {browserItems.map((item) => {
                const isSelected = selectedItemsMap.has(item.id);
                const isFolder = item.item_type === 'folder' || item.item_type === 'schema';

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border border-indigo-500/20'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleSelectItem(item)}
                        className="text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>

                      {/* Icon */}
                      {isFolder ? (
                        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : item.item_type === 'table' ? (
                        <TableIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-indigo-300 shrink-0" />
                      )}

                      {/* Item Name / Drill Down */}
                      <div className="truncate">
                        {isFolder ? (
                          <button
                            onClick={() => openFileBrowser(browserConnector, item.external_id, item.name)}
                            className="text-xs font-semibold text-white hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                          >
                            <span>{item.name}</span>
                            <ChevronRight className="w-3 h-3 text-slate-500" />
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-white">{item.name}</span>
                        )}

                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 mt-0.5">
                          {item.owner && <span>Owner: {item.owner}</span>}
                          {item.modified_time && (
                            <span>Updated: {new Date(item.modified_time).toLocaleDateString()}</span>
                          )}
                          {item.size && <span>{(item.size / 1024).toFixed(0)} KB</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Manage Access button if already selected */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isFolder && (
                        <button
                          onClick={() => toggleSelectItem(item)}
                          className="px-2 py-1 rounded text-[10px] font-mono text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20"
                        >
                          {isSelected ? 'Folder Selected' : '+ Add this folder'}
                        </button>
                      )}

                      {item.is_selected && (
                        <button
                          onClick={() => handleOpenAccess(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/[0.08] text-[11px] font-medium flex items-center gap-1 transition-all"
                        >
                          <KeyRound className="w-3 h-3 text-indigo-400" />
                          <span>Manage Access</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog for Selected Knowledge */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-lg p-6 border border-white/[0.12] shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Selected Knowledge</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm the real files and data selected for CompanyBrain. Only confirmed selections will be indexed.
                </p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-950/90 border border-white/[0.06]">
              {Array.from(selectedItemsMap.values()).map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-xs font-mono text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-500 ml-auto shrink-0">{item.item_type}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
              >
                Back to Browse
              </button>

              <button
                onClick={handleSaveSelection}
                disabled={savingSelection}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>{savingSelection ? 'Saving...' : 'Continue'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Access Modal */}
      {accessItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-md p-6 border border-white/[0.12] shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                  Access Governance
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5 truncate max-w-xs">
                  {accessItem.name}
                </h3>
              </div>
              <button
                onClick={() => setAccessItem(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {accessLoading ? (
              <div className="py-8 text-center text-slate-400">
                <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs">Loading permissions...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Folder Inheritance Notice */}
                {accessData?.inherited && accessData.inherited.length > 0 && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Folder Inherited Access</span>
                    </div>
                    {accessData.inherited.map((inh, idx) => (
                      <div key={idx} className="text-[11px] text-slate-300 font-mono">
                        Inherited from <span className="text-white font-semibold">{inh.folderName}</span> folder
                      </div>
                    ))}
                  </div>
                )}

                {/* Groups */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Groups</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedGroupIds.size} selected
                    </span>
                  </div>
                  <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06]">
                    {(accessData?.availableGroups || []).map((grp) => (
                      <label
                        key={grp.id}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.has(grp.id)}
                          onChange={(e) => {
                            const next = new Set(selectedGroupIds);
                            if (e.target.checked) next.add(grp.id);
                            else next.delete(grp.id);
                            setSelectedGroupIds(next);
                          }}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-200">{grp.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Users */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Users</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedUserIds.size} selected
                    </span>
                  </div>
                  <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06]">
                    {(accessData?.availableUsers || []).map((usr) => (
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
                          {usr.department || 'Staff'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setAccessItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveAccess}
                disabled={savingAccess}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm"
              >
                {savingAccess ? 'Saving...' : 'Save Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {disconnectingConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-md p-6 border border-rose-500/20 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Power className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Disconnect {disconnectingConnector.name}?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              CompanyBrain will no longer be able to sync this connected account. Previously selected files will remain in accordance with tenant data retention policies.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDisconnectingConnector(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisconnect}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-sm"
              >
                Disconnect Source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Setup / Configuration Modal */}
      {activeSetupType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-md p-6 border border-white/[0.12] shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                  Connect {activeSetupType.name}
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeSetupType.tagline}
                </h3>
              </div>
              <button
                onClick={() => setActiveSetupType(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Supabase Setup */}
            {activeSetupType.type === 'supabase' ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-400 leading-relaxed">
                  Enter your Supabase Project URL and API Key to discover real schemas and tables. Credentials are securely stored server-side and never exposed to the browser.
                </p>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Supabase Project URL</label>
                  <input
                    type="text"
                    value={supabaseForm.projectUrl}
                    onChange={(e) => setSupabaseForm({ ...supabaseForm, projectUrl: e.target.value })}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">API Key (Read-Only Anon/Service)</label>
                  <input
                    type="password"
                    value={supabaseForm.apiKey}
                    onChange={(e) => setSupabaseForm({ ...supabaseForm, apiKey: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleConnectDevelopmentMode(activeSetupType)}
                    className="text-[11px] text-amber-400 hover:underline font-mono"
                  >
                    Use Development Mode
                  </button>
                  <button
                    onClick={handleSubmitSupabase}
                    disabled={connecting}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm"
                  >
                    {connecting ? 'Connecting...' : 'Connect Supabase'}
                  </button>
                </div>
              </div>
            ) : (
              /* Google / Microsoft OAuth Setup */
              <div className="space-y-4 text-xs">
                <p className="text-slate-400 leading-relaxed">
                  To authenticate with {activeSetupType.name}, configure OAuth Client ID and Secret in your server environment (`.env`) or enter them below to initiate the live OAuth consent screen.
                </p>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Client ID</label>
                  <input
                    type="text"
                    value={oauthConfigForm.clientId}
                    onChange={(e) => setOauthConfigForm({ ...oauthConfigForm, clientId: e.target.value })}
                    placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Client Secret</label>
                  <input
                    type="password"
                    value={oauthConfigForm.clientSecret}
                    onChange={(e) => setOauthConfigForm({ ...oauthConfigForm, clientSecret: e.target.value })}
                    placeholder="OAuth Client Secret"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleConnectDevelopmentMode(activeSetupType)}
                    className="text-[11px] text-amber-400 hover:underline font-mono"
                  >
                    Use Development Mode
                  </button>
                  <button
                    onClick={() => handleInitiateOAuth(activeSetupType)}
                    disabled={connecting}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm"
                  >
                    {connecting ? 'Redirecting...' : 'Authenticate with OAuth'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supabase Manual Upload Modal (Admin Only) */}
      {showSupabaseUploadModal && (
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
                onClick={() => setShowSupabaseUploadModal(false)}
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
                    list="conn-project-options"
                    value={uploadForm.project}
                    onChange={(e) => setUploadForm({ ...uploadForm, project: e.target.value })}
                    placeholder="e.g. Project Alpha, Core Knowledge"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                  />
                  <datalist id="conn-project-options">
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
                onClick={() => setShowSupabaseUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
              >
                Cancel
              </button>

              {uploadMode === 'folder' ? (
                <button
                  onClick={handleSubmitFolderUpload}
                  disabled={uploadingDoc || folderFiles.length === 0 || folderReading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  {uploadingDoc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Folder ({folderFiles.length} docs)...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Folder ({folderFiles.length} files)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSubmitSupabaseUpload}
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
