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
  FolderPlus
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
      case 'sharepoint': return FileText;
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
            Knowledge Sources
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Connect your company's existing enterprise tools to CompanyBrain. Authenticate real user accounts, browse live files, select knowledge, and govern permissions.
          </p>
        </div>
      </div>

      {/* 3 Real Connector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {supportedTypes.map((typeDef) => {
          const Icon = getConnectorIcon(typeDef.type);
          const connectedInstance = connectors.find((c) => c.type === typeDef.type && c.status !== 'DISCONNECTED');
          const isConnected = Boolean(connectedInstance);
          const isSyncing = syncingId === connectedInstance?.id;

          return (
            <div
              key={typeDef.type}
              className={`card-clean p-5 flex flex-col justify-between space-y-4 relative transition-all ${
                isConnected
                  ? 'border-indigo-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="space-y-3.5">
                {/* Top Row: Icon & Status */}
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-indigo-400">
                    <Icon className="w-5 h-5" />
                  </div>

                  {isConnected ? (
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
                  <h3 className="text-sm font-semibold text-white">{typeDef.name}</h3>
                  {isConnected && connectedInstance.account?.email ? (
                    <div className="text-[11px] font-mono text-indigo-300 mt-1 truncate">
                      Account: {connectedInstance.account.email}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
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
                ) : !typeDef.isConfigured ? (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/20 text-[11px] text-amber-300/80 font-mono">
                    {typeDef.unconfiguredMessage}
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.06]">
                {isConnected ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          openFileBrowser(connectedInstance, 'root', 'Root', false, '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Browse</span>
                      </button>

                      <button
                        onClick={() => handleSync(connectedInstance)}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-white/10 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
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
                        if (typeDef.type === 'supabase') {
                          setActiveSetupType(typeDef);
                        } else if (typeDef.isConfigured) {
                          handleInitiateOAuth(typeDef);
                        } else {
                          setActiveSetupType(typeDef);
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>Connect</span>
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
    </div>
  );
}
