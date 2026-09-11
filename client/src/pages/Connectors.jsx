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
  Table as TableIcon
} from 'lucide-react';

export function Connectors() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  // Core Connector State
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [syncStage, setSyncStage] = useState('');
  const [testModalData, setTestModalData] = useState(null);

  // Connect Modal State
  const [connectModalType, setConnectModalType] = useState(null);
  const [connectForm, setConnectForm] = useState({ name: '', isDemo: true, config: {} });
  const [connecting, setConnecting] = useState(false);

  // Active Connector Explorer State
  const [activeConnectorId, setActiveConnectorId] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [itemSearch, setItemSearch] = useState('');

  // Knowledge Selection State
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);

  // Manage Access Drawer State
  const [accessDrawerItem, setAccessDrawerItem] = useState(null);
  const [accessData, setAccessData] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState(new Set());
  const [savingAccess, setSavingAccess] = useState(false);

  const supportedTypes = [
    {
      type: 'google_drive',
      name: 'Google Drive',
      tagline: 'Connect company Google Drive',
      description: 'Index shared enterprise drives, Project Alpha engineering specs, and HR materials.',
      icon: Folder,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    },
    {
      type: 'sharepoint',
      name: 'SharePoint',
      tagline: 'Connect Microsoft SharePoint',
      description: 'Ingest company intranet sites, engineering libraries, and global HR compliance policies.',
      icon: FileText,
      color: 'from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/30',
      badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    },
    {
      type: 'supabase',
      name: 'Supabase',
      tagline: 'Connect Supabase/PostgreSQL data',
      description: 'Direct SQL table ingestion with schema inspection and row-level security mapping.',
      icon: Database,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    },
  ];

  // Load Connectors
  const loadConnectors = () => {
    setLoading(true);
    api.getConnectors()
      .then((res) => {
        if (res.success) setConnectors(res.connectors || []);
      })
      .catch((err) => {
        console.error(err);
        showToast(`Failed to load connectors: ${err.message}`, 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) {
      loadConnectors();
    }
  }, [tenant, isAdmin]);

  // Load Items for Active Connector
  const loadItems = async (connectorId) => {
    setItemsLoading(true);
    try {
      const res = await api.getConnectorItems(connectorId);
      if (res.success) {
        setItems(res.items || []);
        // Initialize selected item IDs
        const preSelected = new Set(
          (res.items || []).filter((i) => i.is_selected).map((i) => i.id)
        );
        setSelectedItemIds(preSelected);

        // Auto-expand all folders
        const expandMap = {};
        for (const it of res.items || []) {
          if (it.item_type === 'folder' || it.item_type === 'schema') {
            expandMap[it.external_id] = true;
          }
        }
        setExpandedFolders(expandMap);
      }
    } catch (err) {
      showToast(`Error browsing items: ${err.message}`, 'error');
    } finally {
      setItemsLoading(false);
    }
  };

  const handleOpenBrowser = (connector) => {
    setActiveConnectorId(connector.id);
    loadItems(connector.id);
  };

  // Open Connect Modal
  const handleOpenConnect = (typeDef) => {
    setConnectModalType(typeDef);
    setConnectForm({
      name: `${tenant?.name || 'Company'} ${typeDef.name}`,
      isDemo: true,
      config: {},
    });
  };

  // Submit Connect
  const handleSubmitConnect = async () => {
    if (!connectForm.name.trim()) {
      showToast('Connector name is required.', 'error');
      return;
    }
    setConnecting(true);
    try {
      const res = await api.createConnector({
        type: connectModalType.type,
        name: connectForm.name,
        isDemo: connectForm.isDemo,
        configuration: connectForm.config,
      });

      showToast(
        res.isDemo
          ? `Connected to ${connectForm.name} in Demo mode!`
          : `Connected to ${connectForm.name} successfully!`,
        'success'
      );
      setConnectModalType(null);
      loadConnectors();
    } catch (err) {
      showToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      setConnecting(false);
    }
  };

  // Test Connection
  const handleTest = async (connector) => {
    setTestingId(connector.id);
    try {
      const res = await api.testConnector(connector.id);
      setTestModalData(res);
      showToast(
        `Connection verified for ${connector.name} (${res.testResult?.latencyMs}ms)`,
        'success'
      );
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingId(null);
    }
  };

  // Disconnect
  const handleDisconnect = async (connector) => {
    if (!window.confirm(`Are you sure you want to disconnect ${connector.name}?`)) return;
    try {
      await api.disconnectConnector(connector.id);
      showToast(`${connector.name} disconnected.`, 'info');
      if (activeConnectorId === connector.id) {
        setActiveConnectorId(null);
      }
      loadConnectors();
    } catch (err) {
      showToast(`Disconnect failed: ${err.message}`, 'error');
    }
  };

  // Sync Action with Progress Steps
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

      showToast(
        `Sync completed: ${res.indexedCount} knowledge item(s) ingested into CompanyBrain!`,
        'success'
      );
      loadConnectors();
      if (activeConnectorId === connector.id) {
        loadItems(connector.id);
      }
    } catch (err) {
      showToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      setSyncingId(null);
      setSyncStage('');
    }
  };

  // Toggle Folder Collapse
  const toggleFolder = (extId) => {
    setExpandedFolders((prev) => ({ ...prev, [extId]: !prev[extId] }));
  };

  // Item Checkbox Selection
  const toggleItemSelection = (item) => {
    const next = new Set(selectedItemIds);
    const willSelect = !next.has(item.id);

    // If selecting/deselecting a folder or schema, cascade to children
    const cascadeChildIds = (parentExtId, select) => {
      for (const it of items) {
        if (it.parent_id === parentExtId) {
          if (select) next.add(it.id);
          else next.delete(it.id);
          if (it.item_type === 'folder' || it.item_type === 'schema') {
            cascadeChildIds(it.external_id, select);
          }
        }
      }
    };

    if (willSelect) {
      next.add(item.id);
      if (item.item_type === 'folder' || item.item_type === 'schema') {
        cascadeChildIds(item.external_id, true);
      }
    } else {
      next.delete(item.id);
      if (item.item_type === 'folder' || item.item_type === 'schema') {
        cascadeChildIds(item.external_id, false);
      }
    }

    setSelectedItemIds(next);
  };

  // Save Knowledge Selection Confirmation
  const handleSaveKnowledgeSelection = async () => {
    setSavingSelection(true);
    try {
      const selectedArray = Array.from(selectedItemIds);
      // Update selected items
      await api.selectConnectorItems(activeConnectorId, selectedArray, true);

      // Deselect unselected items
      const unselectedArray = items
        .filter((i) => !selectedItemIds.has(i.id) && i.is_selected)
        .map((i) => i.id);

      if (unselectedArray.length > 0) {
        await api.selectConnectorItems(activeConnectorId, unselectedArray, false);
      }

      showToast('Knowledge selection saved to CompanyBrain! Ready for access assignment or sync.', 'success');
      setShowConfirmModal(false);
      loadItems(activeConnectorId);
      loadConnectors();
    } catch (err) {
      showToast(`Error saving selection: ${err.message}`, 'error');
    } finally {
      setSavingSelection(false);
    }
  };

  // Open Manage Access Drawer
  const handleOpenAccess = async (item) => {
    setAccessDrawerItem(item);
    setAccessLoading(true);
    try {
      const res = await api.getItemAccess(activeConnectorId || item.connector_id, item.id);
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
    if (!accessDrawerItem) return;
    setSavingAccess(true);
    try {
      await api.saveItemAccess(
        activeConnectorId || accessDrawerItem.connector_id,
        accessDrawerItem.id,
        {
          userIds: Array.from(selectedUserIds),
          groupIds: Array.from(selectedGroupIds),
        }
      );

      showToast(`Access rules updated for ${accessDrawerItem.name}!`, 'success');
      setAccessDrawerItem(null);
      if (activeConnectorId) {
        loadItems(activeConnectorId);
      }
    } catch (err) {
      showToast(`Failed to save access rules: ${err.message}`, 'error');
    } finally {
      setSavingAccess(false);
    }
  };

  // Non-Admin Zero Trust Screen
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Admin Authorization Required
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          Knowledge source and connector governance is restricted to authenticated{' '}
          <span className="text-indigo-400 font-semibold font-mono">Company Admin</span>{' '}
          personnel. Normal employees cannot connect repositories or modify data access boundaries.
        </p>
        <div className="pt-2 text-xs font-mono text-slate-500">
          Enforced by CompanyBrain Pre-Retrieval Policy Engine
        </div>
      </div>
    );
  }

  const activeConnector = connectors.find((c) => c.id === activeConnectorId);

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
            Connectors & Knowledge Sources
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Connect your company data sources, browse repositories, select files and tables, assign fine-grained user and group access with folder inheritance, and sync into CompanyBrain.
          </p>
        </div>
      </div>

      {/* 3 Supported Connector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {supportedTypes.map((typeDef) => {
          const Icon = typeDef.icon;
          const connectedInstance = connectors.find((c) => c.type === typeDef.type && c.status !== 'DISCONNECTED');
          const isConnected = Boolean(connectedInstance);
          const isSyncing = syncingId === connectedInstance?.id;
          const isTesting = testingId === connectedInstance?.id;

          return (
            <div
              key={typeDef.type}
              className={`card-clean p-5 flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
                isConnected
                  ? 'border-indigo-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="space-y-3.5">
                {/* Top Row: Icon & Status Badge */}
                <div className="flex items-start justify-between">
                  <div
                    className={`w-11 h-11 rounded-xl bg-slate-900 border flex items-center justify-center ${typeDef.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {isConnected ? (
                    connectedInstance.is_demo ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono font-medium">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Demo connection
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-white/5 text-[11px] font-mono">
                      <Power className="w-3 h-3" /> Not Connected
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    {connectedInstance ? connectedInstance.name : typeDef.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {typeDef.description}
                  </p>
                </div>

                {/* Metrics if Connected */}
                {isConnected && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Selected Items:</span>
                      <span className="font-semibold text-white">{connectedInstance.document_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px]">Status:</span>
                      <span className="text-indigo-400 text-[11px]">
                        {isSyncing ? syncStage || 'Syncing...' : connectedInstance.sync_status || 'READY'}
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
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.06]">
                {isConnected ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenBrowser(connectedInstance)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Browse</span>
                      </button>

                      <button
                        onClick={() => handleSync(connectedInstance)}
                        disabled={isSyncing || isTesting}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-white/10 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                      <button
                        onClick={() => handleTest(connectedInstance)}
                        disabled={isTesting}
                        className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                      >
                        <Activity className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>Test</span>
                      </button>

                      <button
                        onClick={() => handleDisconnect(connectedInstance)}
                        className="text-rose-400/80 hover:text-rose-400 transition-colors flex items-center gap-1"
                      >
                        <Power className="w-3 h-3" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenConnect(typeDef)}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>{typeDef.tagline}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Connector Data Browser (Claude-style Tree View) */}
      {activeConnector && (
        <div className="card-clean p-6 space-y-6 border border-indigo-500/30 animate-fade-in">
          {/* Header of Active Browser */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Data Browser
                </span>
                {activeConnector.is_demo && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    Demo connection
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{activeConnector.name}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({items.length} items discovered)
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={selectedItemIds.size === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Add to CompanyBrain ({selectedItemIds.size})</span>
              </button>

              <button
                onClick={() => handleSync(activeConnector)}
                disabled={syncingId === activeConnector.id}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingId === activeConnector.id ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>

              <button
                onClick={() => setActiveConnectorId(null)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08] transition-all"
                title="Close Browser"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Filter files, folders, or tables..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] focus:border-indigo-500/50 text-xs text-white outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Hierarchical Items Tree */}
          {itemsLoading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-mono text-slate-500">Scanning source hierarchy...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center card-clean text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">No items discovered in this connector.</p>
            </div>
          ) : (
            <div className="space-y-1 bg-slate-950/50 p-3 rounded-2xl border border-white/[0.06]">
              {items
                .filter((item) => !itemSearch || item.name.toLowerCase().includes(itemSearch.toLowerCase()) || item.path.toLowerCase().includes(itemSearch.toLowerCase()))
                .map((item) => {
                  const isSelected = selectedItemIds.has(item.id);
                  const isFolder = item.item_type === 'folder' || item.item_type === 'schema';
                  const isExpanded = Boolean(expandedFolders[item.external_id]);

                  // Indentation depth based on path slashes
                  const depth = Math.max(0, (item.path.match(/\//g) || []).length - 1);

                  // Calculate access rules summary
                  const directUsers = item.access?.directUsers || [];
                  const directGroups = item.access?.directGroups || [];
                  const inherited = item.access?.inherited || [];

                  const hasDirectAccess = directUsers.length > 0 || directGroups.length > 0;
                  const hasInheritedAccess = inherited.length > 0;

                  return (
                    <div
                      key={item.id}
                      style={{ paddingLeft: `${depth * 1.5}rem` }}
                      className={`flex items-center justify-between py-2 px-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-indigo-600/10 border border-indigo-500/20'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Expand / Collapse Button for Folders */}
                        {isFolder ? (
                          <button
                            onClick={() => toggleFolder(item.external_id)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <div className="w-3.5 h-3.5" />
                        )}

                        {/* Selection Checkbox */}
                        <button
                          onClick={() => toggleItemSelection(item)}
                          className="text-slate-400 hover:text-indigo-400 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>

                        {/* Item Icon */}
                        {isFolder ? (
                          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : item.item_type === 'table' ? (
                          <TableIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-indigo-300 shrink-0" />
                        )}

                        {/* Name & Path */}
                        <div className="truncate">
                          <span className="text-xs font-medium text-white mr-2">{item.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                            {item.path}
                          </span>
                        </div>
                      </div>

                      {/* Right-hand Access Summary & Manage Access Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Inherited badge */}
                        {hasInheritedAccess && (
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-white/5"
                            title={`Inherited from: ${inherited.map((inh) => inh.folderName).join(', ')}`}
                          >
                            Inherited
                          </span>
                        )}

                        {/* Assigned badges */}
                        {hasDirectAccess && (
                          <div className="flex items-center gap-1">
                            {directGroups.slice(0, 2).map((g) => (
                              <span
                                key={g.id}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                              >
                                {g.name}
                              </span>
                            ))}
                            {directUsers.slice(0, 1).map((u) => (
                              <span
                                key={u.id}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                              >
                                {u.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Manage Access Button */}
                        <button
                          onClick={() => handleOpenAccess(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/[0.08] text-[11px] font-medium flex items-center gap-1 transition-all"
                        >
                          <KeyRound className="w-3 h-3 text-indigo-400" />
                          <span>Manage Access</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for "Add to CompanyBrain" */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-lg p-6 border border-white/[0.12] shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Selected Knowledge</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm the files and data selected for CompanyBrain. Connecting a source does not automatically make every file available; only confirmed selections are prepared for ingestion.
                </p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Confirmed Items */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-950/90 border border-white/[0.06]">
              {items
                .filter((item) => selectedItemIds.has(item.id))
                .map((item) => (
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
                onClick={handleSaveKnowledgeSelection}
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

      {/* Manage Access Modal / Drawer */}
      {accessDrawerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-md p-6 border border-white/[0.12] shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                  Access Management
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5 truncate max-w-xs">
                  {accessDrawerItem.name}
                </h3>
                <div className="text-[11px] font-mono text-slate-400">{accessDrawerItem.path}</div>
              </div>
              <button
                onClick={() => setAccessDrawerItem(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {accessLoading ? (
              <div className="py-8 text-center text-slate-400">
                <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs">Loading access rules...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Inherited Permissions Banner */}
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

                {/* Groups Section */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Groups Access</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedGroupIds.size} selected
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06]">
                    {(accessData?.availableGroups || []).map((grp) => {
                      const isChecked = selectedGroupIds.has(grp.id);
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
                              if (e.target.checked) next.add(grp.id);
                              else next.delete(grp.id);
                              setSelectedGroupIds(next);
                            }}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span className="text-slate-200 font-medium">{grp.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Users Section */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Individual Users</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedUserIds.size} selected
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06]">
                    {(accessData?.availableUsers || []).map((usr) => {
                      const isChecked = selectedUserIds.has(usr.id);
                      return (
                        <label
                          key={usr.id}
                          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
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
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setAccessDrawerItem(null)}
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

      {/* Connect Configuration Modal */}
      {connectModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-md p-6 border border-white/[0.12] shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                  New Integration
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {connectModalType.tagline}
                </h3>
              </div>
              <button
                onClick={() => setConnectModalType(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Connector Name */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Connector Display Name</label>
                <input
                  type="text"
                  value={connectForm.name}
                  onChange={(e) => setConnectForm({ ...connectForm, name: e.target.value })}
                  placeholder="e.g. Acme Google Drive"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                />
              </div>

              {/* Demo Mode Toggle */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Demo Connection Mode
                  </span>
                  <input
                    type="checkbox"
                    checked={connectForm.isDemo}
                    onChange={(e) => setConnectForm({ ...connectForm, isDemo: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Loads realistic enterprise files, folders, and schemas stored directly in Supabase for testing without requiring live OAuth keys.
                </p>
              </div>

              {/* Live Credential Inputs if not demo */}
              {!connectForm.isDemo && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-950 border border-white/[0.06]">
                  {connectModalType.type === 'google_drive' && (
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px]">Service Account Email / Key</label>
                      <input
                        type="text"
                        placeholder="service-account@iam.gserviceaccount.com"
                        onChange={(e) =>
                          setConnectForm({
                            ...connectForm,
                            config: { ...connectForm.config, serviceAccountKey: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.06] text-white text-xs"
                      />
                    </div>
                  )}

                  {connectModalType.type === 'sharepoint' && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[11px]">Microsoft Azure Tenant ID</label>
                        <input
                          type="text"
                          placeholder="e.g. 8f4b-..."
                          onChange={(e) =>
                            setConnectForm({
                              ...connectForm,
                              config: { ...connectForm.config, tenantId: e.target.value },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.06] text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[11px]">Client ID</label>
                        <input
                          type="text"
                          placeholder="Azure App Client ID"
                          onChange={(e) =>
                            setConnectForm({
                              ...connectForm,
                              config: { ...connectForm.config, clientId: e.target.value },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.06] text-white text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {connectModalType.type === 'supabase' && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[11px]">Supabase Project URL</label>
                        <input
                          type="text"
                          placeholder="https://your-project.supabase.co"
                          onChange={(e) =>
                            setConnectForm({
                              ...connectForm,
                              config: { ...connectForm.config, projectUrl: e.target.value },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.06] text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[11px]">API Key (Read-Only Anon/Service)</label>
                        <input
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1Ni..."
                          onChange={(e) =>
                            setConnectForm({
                              ...connectForm,
                              config: { ...connectForm.config, apiKey: e.target.value },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/[0.06] text-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConnectModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitConnect}
                disabled={connecting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm"
              >
                {connecting ? 'Connecting...' : 'Connect Source'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Connection Details Modal */}
      {testModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-md p-5 border border-white/[0.12] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Connection Verified</h3>
                <p className="text-xs text-slate-400 font-mono">{testModalData.connector}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-white/[0.06] font-mono text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Latency:</span>
                <span className="text-emerald-400 font-semibold">{testModalData.testResult?.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="text-slate-200">{testModalData.testResult?.service || 'Connected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400">Authenticated & Ready</span>
              </div>
            </div>

            <button
              onClick={() => setTestModalData(null)}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
