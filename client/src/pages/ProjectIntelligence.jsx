import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { AIProcessingState } from '../components/AIProcessingState';
import {
  FolderKanban,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Layers,
  FileText,
  Send,
  RefreshCw,
  Compass,
  Cpu,
  Database,
  Terminal,
  Server,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Bot,
  User as UserIcon,
  HelpCircle,
  GitFork,
  UploadCloud,
  FolderArchive,
  X,
  FileCode,
  Archive,
  Plus,
  Folder,
  Search,
} from 'lucide-react';

export function ProjectIntelligence() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [authorizedDocs, setAuthorizedDocs] = useState([]);
  const [docSearch, setDocSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assistant'); // 'assistant' | 'sources'
  
  // Intelligence State
  const [queryInput, setQueryInput] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // GitHub / Codebase Zip Upload Modal State
  const [showZipModal, setShowZipModal] = useState(false);
  const [zipFile, setZipFile] = useState(null);
  const [zipRepoName, setZipRepoName] = useState('');
  const [zipClassification, setZipClassification] = useState('Internal');
  const [uploadingZip, setUploadingZip] = useState(false);
  const [zipProgressText, setZipProgressText] = useState('');

  // Direct Document & Folder Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState('folder'); // 'folder' | 'file'
  const [uploadFolderName, setUploadFolderName] = useState('');
  const [folderFiles, setFolderFiles] = useState([]);
  const [folderReading, setFolderReading] = useState(false);
  const [folderReadProgress, setFolderReadProgress] = useState('');
  const [uploadFileObj, setUploadFileObj] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    content: '',
    department: 'Engineering',
    classification: 'INTERNAL',
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Link Existing Tenant Document Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [tenantDocs, setTenantDocs] = useState([]);
  const [selectedDocToLink, setSelectedDocToLink] = useState('');
  const [linkingDoc, setLinkingDoc] = useState(false);

  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name) || user?.is_super_admin || user?.role === 'admin';

  // Chat Conversation History
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Suggested Questions for Project Intelligence
  const projectSuggestions = [
    { label: 'What should I learn first?', query: 'What should I understand first to onboard onto this project?' },
    { label: 'Explain the architecture', query: 'Explain the architecture and high-level system topology of this project.' },
    { label: 'Summarize the project', query: 'Provide an executive summary of this project and its domain objectives.' },
    { label: 'What services are used?', query: 'What services, backend stack, queues, and caches are used in this project?' },
    { label: 'Explain the database', query: 'Explain the database schema, models, and data relations used in this project.' },
  ];

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, evaluating]);

  // Fetch Project details & verify authorization
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const [projRes, knowRes] = await Promise.all([
          api.getProject(id),
          api.getProjectKnowledge(id)
        ]);

        if (projRes.success) {
          setProject(projRes.project);
        }
        if (knowRes.success) {
          setAuthorizedDocs(knowRes.knowledge || []);
        }

        // Welcome message
        setMessages([
          {
            id: 'welcome',
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            content: `Hello **${user?.name || 'Engineer'}**! Welcome to **${projRes?.project?.name || 'this project'}** intelligence.
I have assembled all verified documents linked to this project that you have security clearance to access.
Use the quick action buttons above to explore the architecture, services, database, and APIs, or ask me any question below!`,
            sources: [],
            securityDetails: {
              level1: 'Direct/Group Membership Cleared',
              level2: 'Zero-Trust Document Clearance Applied'
            }
          }
        ]);
      } catch (err) {
        console.error('Failed to load project intelligence:', err);
        showToast('error', err.message || 'Access Denied: You do not have clearance for this project.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProjectData();
    }
  }, [id, tenant]);

  // Execute Quick Action or Freeform Query
  const handleExecuteUnderstanding = async (actionType = 'chat', customPrompt = null) => {
    const q = customPrompt !== null ? customPrompt : queryInput;
    if (!q && actionType === 'chat') return;

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `asst_${Date.now()}`;

    // Add user message to stream
    if (q) {
      setMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          sender: 'user',
          timestamp: new Date().toISOString(),
          content: q,
        }
      ]);
    }

    setCurrentAction(actionType);
    setEvaluating(true);
    setQueryInput('');

    try {
      let res;
      if (actionType === 'chat') {
        res = await api.queryProjectRAG(id, q);
      } else {
        res = await api.understandProject(id, actionType, q || undefined);
      }

      if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            content: res.answer,
            action: actionType,
            sources: res.sources || [],
            documents_consulted: res.documents_consulted || 0,
            securityDetails: {
              level1: 'Project Access Verified',
              level2: `${res.documents_consulted || res.sources?.length || res.securityIndicators?.authorizedSourcesCount || (res.success ? 1 : 0)} Documents Cleared via PolicyEngine`,
              execution_time_ms: res.execution_time_ms
            }
          }
        ]);
      }
    } catch (err) {
      console.error('Understanding error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          isError: true,
          content: `⚠️ **Authorization or Query Error:**\n${err.message || 'Unable to complete project intelligence query.'}`,
        }
      ]);
      showToast('error', err.message || 'Query failed');
    } finally {
      setEvaluating(false);
      setCurrentAction(null);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleZipFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      showToast('error', 'Please select a valid .zip archive file.');
      return;
    }
    setZipFile(file);
    if (!zipRepoName) {
      setZipRepoName(file.name.replace(/\.zip$/i, ''));
    }
  };

  const handleUploadZip = async (e) => {
    e.preventDefault();
    if (!zipFile) {
      showToast('error', 'Please select a repository .zip archive first.');
      return;
    }

    setUploadingZip(true);
    setZipProgressText('Reading archive file into memory...');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result;
          const base64 = typeof result === 'string' && result.includes(',')
            ? result.split(',')[1]
            : result;
          resolve(base64);
        };
        reader.onerror = (err) => reject(err);
      });

      reader.readAsDataURL(zipFile);
      const base64Data = await base64Promise;

      setZipProgressText('Unpacking codebase, filtering binaries & compiling architecture manifest...');
      const res = await api.uploadProjectZip(id, {
        zipData: base64Data,
        repositoryName: zipRepoName.trim() || zipFile.name.replace(/\.zip$/i, ''),
        classification: zipClassification
      });

      if (res.success) {
        showToast('success', `Repository "${res.repositoryName}" unpacked! Ingested ${res.files_ingested} files.`);
        
        // Refresh project knowledge list
        const knowRes = await api.getProjectKnowledge(id);
        if (knowRes.success) {
          setAuthorizedDocs(knowRes.knowledge || []);
        }

        // Add an executive summary message into the intelligence chat
        const categorySummary = Object.entries(res.category_breakdown || {})
          .map(([cat, count]) => `• **${cat}**: ${count} files`)
          .join('\n');

        setMessages((prev) => [
          ...prev,
          {
            id: `asst_zip_${Date.now()}`,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            content: `📦 **Repository Codebase Ingested Successfully!**\n\nI have unpacked and analyzed repository archive **${res.repositoryName}** (${res.files_ingested} code & doc files extracted):\n\n${categorySummary}\n\n✨ A master **Repository Architecture Manifest** has been synthesized and indexed. You can now immediately ask questions regarding schemas, API routes, configurations, and core components!`,
            sources: res.documents || [],
            documents_consulted: res.files_ingested,
            securityDetails: {
              level1: 'Direct Project Membership Cleared',
              level2: `${res.files_ingested} Codebase Artifacts Cleared via Zero-Trust Policy`
            }
          }
        ]);

        setShowZipModal(false);
        setZipFile(null);
        setZipRepoName('');
      }
    } catch (err) {
      console.error('Failed to upload codebase zip:', err);
      showToast('error', err.message || 'Failed to unpack and ingest codebase zip');
    } finally {
      setUploadingZip(false);
      setZipProgressText('');
    }
  };

  const handleSingleFileUploadChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileObj(file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setUploadForm((prev) => ({
      ...prev,
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
      reader.onload = () => {
        setUploadForm((prev) => ({
          ...prev,
          content: `[Enterprise Document: ${file.name}] (${(file.size / 1024).toFixed(1)} KB, type: ${file.type || 'application/octet-stream'}). Ingested directly for Project ${project?.name || ''} intelligence.`,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFolderUploadChange = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    setFolderReading(true);
    setFolderReadProgress('Discovering files in folder...');

    let detectedFolder = '';
    const firstRel = rawFiles[0].webkitRelativePath;
    if (firstRel && firstRel.includes('/')) {
      detectedFolder = firstRel.split('/')[0];
    } else {
      detectedFolder = `${project?.name || 'Project'}_Docs`;
    }

    setUploadFolderName(detectedFolder);

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
          content = `[Enterprise Document: ${file.name}] (${(file.size / 1024).toFixed(1)} KB, path: ${relPath}, type: ${file.type || 'application/octet-stream'}). Ingested directly for Project ${project?.name || ''} intelligence.`;
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

  const handleSubmitFolderOrDoc = async (e) => {
    e.preventDefault();
    setUploadingDoc(true);
    try {
      if (uploadMode === 'folder') {
        if (folderFiles.length === 0) {
          showToast('error', 'No valid documents found in selected folder.');
          setUploadingDoc(false);
          return;
        }

        const res = await api.uploadSupabaseFolder({
          folderName: uploadFolderName.trim() || project?.name || 'Project Docs',
          department: uploadForm.department,
          project: project?.name || 'Project Alpha',
          projectId: id,
          classification: uploadForm.classification,
          required_groups: [],
          allowed_user_ids: [],
          files: folderFiles,
        });

        if (res.success) {
          showToast('success', `Folder "${uploadFolderName}" with ${res.count} file(s) ingested into ${project?.name}!`);
          setShowUploadModal(false);
          setFolderFiles([]);
          setUploadFolderName('');

          // Refresh project knowledge
          const knowRes = await api.getProjectKnowledge(id);
          if (knowRes.success) {
            setAuthorizedDocs(knowRes.knowledge || []);
          }
        }
      } else {
        if (!uploadForm.title.trim() || !uploadForm.content.trim()) {
          showToast('error', 'Document title and content are required.');
          setUploadingDoc(false);
          return;
        }

        const res = await api.uploadSupabaseDoc({
          title: uploadForm.title.trim(),
          content: uploadForm.content,
          department: uploadForm.department,
          project: project?.name || 'Project Alpha',
          projectId: id,
          classification: uploadForm.classification,
          required_groups: [],
          allowed_user_ids: [],
          fileName: uploadFileObj?.name || `${uploadForm.title}.txt`,
          fileType: uploadFileObj?.type || 'text/plain',
        });

        if (res.success) {
          showToast('success', `Document "${uploadForm.title}" ingested into ${project?.name}!`);
          setShowUploadModal(false);
          setUploadForm({ title: '', content: '', department: 'Engineering', classification: 'INTERNAL' });
          setUploadFileObj(null);

          // Refresh project knowledge
          const knowRes = await api.getProjectKnowledge(id);
          if (knowRes.success) {
            setAuthorizedDocs(knowRes.knowledge || []);
          }
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  const openLinkModal = async () => {
    try {
      const knowRes = await api.getProjectKnowledge(id);
      const existingIds = new Set((knowRes.knowledge || []).map((k) => k.id || k.document_id));
      let candidateList = [];

      if (knowRes.allTenantDocs && knowRes.allTenantDocs.length > 0) {
        candidateList = knowRes.allTenantDocs.filter((d) => !existingIds.has(d.id));
      } else {
        const docsRes = await api.getDocuments();
        candidateList = (docsRes.documents || []).filter((d) => !existingIds.has(d.id));
      }

      setTenantDocs(candidateList);
      setSelectedDocToLink('');
      setShowLinkModal(true);
    } catch (err) {
      showToast('error', err.message || 'Failed to load available documents');
    }
  };

  const handleLinkDocument = async (e) => {
    e.preventDefault();
    if (!selectedDocToLink) return;

    setLinkingDoc(true);
    try {
      await api.addProjectKnowledge(id, { documentId: selectedDocToLink });
      showToast('success', 'Document linked to project successfully!');
      setShowLinkModal(false);
      setSelectedDocToLink('');

      const knowRes = await api.getProjectKnowledge(id);
      if (knowRes.success) {
        setAuthorizedDocs(knowRes.knowledge || []);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to link document');
    } finally {
      setLinkingDoc(false);
    }
  };

  const handleLinkAllDocuments = async () => {
    if (tenantDocs.length === 0) return;
    setLinkingDoc(true);
    try {
      const docIds = tenantDocs.map((d) => d.id);
      await api.addProjectKnowledge(id, { documentIds: docIds });
      showToast('success', `Linked all ${docIds.length} document(s) to ${project?.name || 'project'}!`);
      setShowLinkModal(false);
      const knowRes = await api.getProjectKnowledge(id);
      if (knowRes.success) {
        setAuthorizedDocs(knowRes.knowledge || []);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to link documents');
    } finally {
      setLinkingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-sm font-mono text-white">INITIALIZING PROJECT INTELLIGENCE...</div>
        <div className="text-xs text-slate-500 mt-1">
          Evaluating Level 1 (Project Membership) & Level 2 (Document Policies)
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card-clean p-12 text-center text-slate-400 max-w-xl mx-auto my-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Access Restricted</h3>
        <p className="text-xs text-slate-400 mb-6">
          You are not an authorized member of this project or the project does not exist within this tenant workspace.
        </p>
        <Link
          to="/projects"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Return Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/projects" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Projects</span>
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{project.name}</span>
          <span>/</span>
          <span className="text-indigo-400 font-mono">Intelligence Engine</span>
        </div>

        {/* Security Clearances Badge & Codebase Upload */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowZipModal(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              id="btn-upload-repo-zip"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Repo (.zip)</span>
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Level 1: Member Cleared</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Level 2: Pre-RAG Policy Active</span>
          </span>
        </div>
      </div>

      {/* Hero Banner with Project Details */}
      <div className="card-clean p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {project.code}
              </span>
              <span className="text-xs text-slate-500 font-mono">•</span>
              <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
              <span className="text-xs text-slate-500 font-mono">•</span>
              <span className="text-[10px] font-mono text-emerald-400 capitalize">{project.status}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span className="text-indigo-400">✨</span>
              <span>AI Agent • {project.name}</span>
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ask anything about this project. Answers are strictly synthesized from authorized project documentation.
            </p>

            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.08]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-white/[0.06] shrink-0">
            <div className="text-center px-2">
              <div className="text-xl font-bold text-white">
                {authorizedDocs.filter((d) => d.canAccess !== false).length}
              </div>
              <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">Authorized Docs</div>
            </div>
            <div className="h-8 w-px bg-white/[0.08]"></div>
            <div className="text-center px-2">
              <div className="text-xl font-bold text-emerald-400">{user?.role_name || 'Member'}</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">Your Clearance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Suggested Questions:
        </span>
        {projectSuggestions.map((s, idx) => (
          <button
            key={idx}
            disabled={evaluating}
            onClick={() => handleExecuteUnderstanding('chat', s.query)}
            className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs border border-white/[0.08] transition-all shrink-0 font-medium disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main Two-Column Layout: Chat on Left, Authorized Docs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Project Chat */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-[700px] card-clean p-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Project Intelligence Assistant</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                Pre-RAG Enforced
              </span>
            </div>
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome',
                    sender: 'assistant',
                    timestamp: new Date().toISOString(),
                    content: `Conversation reset. Ask me anything about **${project.name}**!`,
                    sources: []
                  }
                ]);
              }}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  )}

                  <div className={`max-w-[88%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : msg.isError
                          ? 'bg-rose-950/40 border border-rose-800/60 text-rose-200'
                          : 'bg-slate-800/90 border border-white/[0.06] text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {/* Markdown text representation */}
                      <div className="whitespace-pre-wrap font-sans space-y-2">
                        {msg.content}
                      </div>

                      {/* Sources Citations Drawer */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-1.5">
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Verified Sources Consulted ({msg.sources.length}):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, idx) => (
                              <div
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-white/[0.06] text-indigo-300 flex items-center gap-1"
                              >
                                <FileText className="w-2.5 h-2.5 text-slate-400" />
                                <span className="truncate max-w-[180px]">{src.title}</span>
                                <span className="font-mono text-[9px] text-slate-500">
                                  ({src.source_type || 'doc'})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Security Verification Footer */}
                      {!isUser && msg.securityDetails && (
                        <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-emerald-400/80">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {msg.securityDetails.level2 || 'Policy Cleared'}
                          </span>
                          {msg.securityDetails.execution_time_ms && (
                            <span>{msg.securityDetails.execution_time_ms}ms</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Copy Button */}
                    {!isUser && (
                      <div className="flex items-center gap-2 pl-1 text-[11px] text-slate-500">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy response</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              );
            })}

            {evaluating && (
              <AIProcessingState isProjectContext={true} projectName={project?.name} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteUnderstanding('chat');
            }}
            className="pt-3 border-t border-white/[0.06] flex items-center gap-2"
          >
            <input
              type="text"
              value={queryInput}
              disabled={evaluating}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={`Ask anything about ${project.name} (e.g. "How does authentication work?", "What database is used?")...`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={evaluating || !queryInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </form>
        </div>

        {/* Right Column: Authorized Project Knowledge Base */}
        <div className="space-y-4">
          <div className="card-clean p-4 h-[700px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Authorized Knowledge
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  {authorizedDocs.filter((d) => d.canAccess !== false).length} Cleared
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      title="Upload Folder or Documents directly to this project"
                      className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm"
                      id="btn-upload-project-docs"
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                    <button
                      onClick={() => openLinkModal()}
                      title="Link existing tenant documents to this project"
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-all border border-white/[0.08]"
                      id="btn-link-project-docs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Link</span>
                    </button>
                    <button
                      onClick={() => setShowZipModal(true)}
                      title="Upload GitHub repository .zip archive"
                      className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-indigo-300 transition-colors"
                      id="btn-upload-repo-zip-small"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
              These sources have passed Level 1 (Project Membership) and Level 2 (Policy Engine clearance). Answers strictly cite these sources.
            </p>

            {/* Quick Search in Authorized Knowledge */}
            {authorizedDocs.length > 5 && (
              <div className="relative mb-2.5">
                <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Filter authorized project files..."
                  className="w-full pl-7 pr-3 py-1 rounded-lg bg-slate-900/90 border border-white/[0.08] text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {authorizedDocs.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  <Lock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  No documents linked or cleared for your role.
                </div>
              ) : (
                authorizedDocs
                  .filter((item) => {
                    if (!docSearch.trim()) return true;
                    const q = docSearch.toLowerCase();
                    const doc = item.document || item;
                    return (
                      doc.title?.toLowerCase().includes(q) ||
                      doc.classification?.toLowerCase().includes(q) ||
                      doc.source_type?.toLowerCase().includes(q) ||
                      doc.content?.toLowerCase().includes(q)
                    );
                  })
                  .map((item) => {
                    const doc = item.document || item;
                    const isAllowed = item.canAccess !== false;

                    return (
                      <div
                        key={item.document_id || doc.id}
                        className={`p-3 rounded-lg border transition-all group ${
                          isAllowed
                            ? 'bg-slate-800/60 border-white/[0.04] hover:border-indigo-500/30 cursor-pointer'
                            : 'bg-slate-900/40 border-rose-900/20 opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (!isAllowed) {
                            showToast(item.accessReason || 'Access restricted by policy clearance.', 'error');
                            return;
                          }
                          handleExecuteUnderstanding(
                            'chat',
                            `Summarize the key architectural patterns and components described in "${doc.title}".`
                          );
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                              {doc.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-1">
                              <span className="text-indigo-400 uppercase">{doc.source_type}</span>
                              <span>•</span>
                              <span className={isAllowed ? 'text-emerald-400' : 'text-amber-400'}>{doc.classification}</span>
                              <span>•</span>
                              {isAllowed ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>Access Granted</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-rose-400" />
                                  <span>Restricted</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                        </div>

                        {doc.content && (
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5 leading-normal">
                            {doc.content}
                          </p>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Security Guarantee Card */}
            <div className="mt-4 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200">
              <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pre-RAG Isolation Guarantee</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                CompanyBrain pre-filters content in SQL and application policies before passing context to LLM models. Cross-project and cross-tenant knowledge leaks are mathematically prevented.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Codebase Zip Upload Modal */}
      {showZipModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-clean max-w-lg w-full p-6 relative border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Upload GitHub Codebase (.zip)</h3>
                  <p className="text-[11px] text-slate-400">
                    Ingest repository source code directly for AI architectural understanding.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !uploadingZip && setShowZipModal(false)}
                disabled={uploadingZip}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadZip} className="space-y-4">
              {/* File Drop / Select Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  GitHub Archive File (.zip)
                </label>
                <div className="relative border-2 border-dashed border-white/[0.12] hover:border-indigo-500/50 rounded-xl p-6 text-center transition-colors cursor-pointer bg-slate-900/40">
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    disabled={uploadingZip}
                    onChange={handleZipFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  {zipFile ? (
                    <div className="flex flex-col items-center gap-1.5 text-xs text-white">
                      <FileCode className="w-8 h-8 text-emerald-400" />
                      <span className="font-semibold text-emerald-300">{zipFile.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(zipFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to unpack
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-xs text-slate-400">
                      <UploadCloud className="w-8 h-8 text-indigo-400 mb-1" />
                      <span className="text-slate-200 font-medium">Click or drag GitHub .zip here</span>
                      <span className="text-[10px] text-slate-500">
                        Downloaded from GitHub via "Code &gt; Download ZIP"
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Repository Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Repository Name (Identifier)
                </label>
                <input
                  type="text"
                  value={zipRepoName}
                  disabled={uploadingZip}
                  onChange={(e) => setZipRepoName(e.target.value)}
                  placeholder="e.g. ecommerce-backend-main"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Classification */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Knowledge Classification
                </label>
                <select
                  value={zipClassification}
                  disabled={uploadingZip}
                  onChange={(e) => setZipClassification(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Internal">Internal (Company-wide access)</option>
                  <option value="Confidential">Confidential (Project members only)</option>
                  <option value="Restricted">Restricted (High-security clearance)</option>
                  <option value="Public">Public (All verified roles)</option>
                </select>
              </div>

              {/* Processing Info Banner */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
                <div className="text-white font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automatic Code Sanitization & Architecture Digest</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Extracts documentation, schemas (prisma, sql), API routes, configs (package.json, docker), and source code. Automatically strips noise directories (node_modules, dist, .git) and binary assets.
                </p>
              </div>

              {/* Progress status */}
              {uploadingZip && (
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2.5 text-xs text-indigo-300">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>{zipProgressText || 'Processing codebase archive...'}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  disabled={uploadingZip}
                  onClick={() => setShowZipModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingZip || !zipFile}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadingZip ? 'Ingesting Codebase...' : 'Extract & Ingest Codebase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Document or Folder Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-clean max-w-xl w-full p-6 relative border-slate-700 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Upload Knowledge: {project?.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Directly attach documents or entire folders to this project's intelligence base
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploadingDoc}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1 bg-slate-950/80 rounded-xl border border-white/[0.08] mb-4">
              <button
                type="button"
                onClick={() => setUploadMode('folder')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  uploadMode === 'folder'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Upload Entire Folder</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  uploadMode === 'file'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Upload Single File</span>
              </button>
            </div>

            <form onSubmit={handleSubmitFolderOrDoc} className="space-y-4 text-xs">
              {uploadMode === 'folder' ? (
                /* FOLDER UPLOAD ZONE */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium flex items-center justify-between">
                      <span>Select Local Directory / Folder</span>
                      <span className="text-[11px] font-mono text-indigo-400">Recursive Folder Upload</span>
                    </label>
                    <label className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-indigo-950/20 hover:bg-indigo-950/30 group">
                      <input
                        type="file"
                        webkitdirectory="true"
                        directory="true"
                        multiple
                        onChange={handleFolderUploadChange}
                        className="hidden"
                      />
                      <Folder className="w-9 h-9 text-indigo-400 group-hover:scale-105 transition-transform mb-2" />
                      {folderReading ? (
                        <div className="text-center">
                          <span className="text-indigo-300 font-medium block">{folderReadProgress}</span>
                          <span className="text-[11px] text-slate-500">Scanning directory files...</span>
                        </div>
                      ) : folderFiles.length > 0 ? (
                        <div className="text-center">
                          <span className="text-white font-medium block truncate max-w-xs">{uploadFolderName}</span>
                          <span className="text-[11px] font-mono text-emerald-400">
                            {folderFiles.length} files discovered • Ready to ingest
                          </span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-slate-200 font-medium block">Click to select folder from computer</span>
                          <span className="text-[11px] text-slate-500">
                            Uploads all documents, PDFs, specs, and code in the directory
                          </span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Folder Name Identifier */}
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Folder Identifier</label>
                    <input
                      type="text"
                      value={uploadFolderName}
                      onChange={(e) => setUploadFolderName(e.target.value)}
                      placeholder="e.g. Project_Alpha_Architecture"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs font-mono"
                    />
                  </div>

                  {/* Preview of Discovered Files */}
                  {folderFiles.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-slate-300 font-medium">
                        <span>Discovered Files ({folderFiles.length})</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {(folderFiles.reduce((acc, f) => acc + (f.sizeBytes || 0), 0) / 1024).toFixed(1)} KB Total
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06]">
                        {folderFiles.slice(0, 40).map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] p-1 rounded bg-slate-900/60 border border-white/[0.02]">
                            <span className="text-slate-300 truncate max-w-sm font-mono">{f.relativePath}</span>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                              {(f.sizeBytes / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        ))}
                        {folderFiles.length > 40 && (
                          <div className="text-[10px] font-mono text-slate-500 text-center py-1">
                            + {folderFiles.length - 40} more files
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
                        onChange={handleSingleFileUploadChange}
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
                          <span className="text-[11px] text-slate-500">File content will be read and ingested into this project</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Document Title *</label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="e.g. Architecture Overview.pdf"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium flex items-center justify-between">
                      <span>Document Content / Extracted Text *</span>
                      <span className="text-[10px] font-mono text-slate-500">{uploadForm.content.length} characters</span>
                    </label>
                    <textarea
                      rows={3}
                      value={uploadForm.content}
                      onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                      placeholder="Extracted file contents or description..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs font-mono resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Classification & Department Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Classification</label>
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

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Department</label>
                  <select
                    value={uploadForm.department}
                    onChange={(e) => setUploadForm({ ...uploadForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                    <option value="Security">Security</option>
                    <option value="Executive">Executive</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  disabled={uploadingDoc}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    uploadingDoc ||
                    folderReading ||
                    (uploadMode === 'folder' ? folderFiles.length === 0 : (!uploadForm.title.trim() || !uploadForm.content.trim()))
                  }
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  {uploadingDoc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadMode === 'folder' ? `Ingesting ${folderFiles.length} files...` : 'Uploading...'}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadMode === 'folder' ? `Upload Folder (${folderFiles.length} files)` : 'Upload to Project'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Link Existing Tenant Documents */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-clean max-w-md w-full p-6 relative border-slate-700 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Link Document to {project?.name}
                </h3>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkDocument} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Select Document from Company Knowledge</label>
                <select
                  value={selectedDocToLink}
                  onChange={(e) => setSelectedDocToLink(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                >
                  <option value="">Choose document to link...</option>
                  {tenantDocs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.source_type} • {d.classification})
                    </option>
                  ))}
                </select>
                {tenantDocs.length === 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">All company documents are already linked to this project.</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                {tenantDocs.length > 0 ? (
                  <button
                    type="button"
                    disabled={linkingDoc}
                    onClick={handleLinkAllDocuments}
                    className="px-3 py-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 hover:bg-indigo-900/60 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Link All ({tenantDocs.length})</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={linkingDoc || !selectedDocToLink}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    {linkingDoc ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Linking...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Link Selected</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
