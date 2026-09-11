import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sparkles,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  FolderKanban,
  FileText,
  User,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Filter,
  X,
  Send,
  Edit3,
  Trash2,
  ExternalLink,
  ThumbsUp,
  HelpCircle,
  Wand2,
  RefreshCw,
} from 'lucide-react';

export function Experience() {
  const { user, tenant } = useAuth();
  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  // Active Tab: 'verified' | 'my-submissions' | 'approvals'
  const [activeTab, setActiveTab] = useState('verified');

  // Approvals Subtab: 'PENDING' | 'APPROVED' | 'REJECTED'
  const [approvalSubTab, setApprovalSubTab] = useState('PENDING');

  // Data States
  const [experiences, setExperiences] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [adminApprovals, setAdminApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [authorizedProjects, setAuthorizedProjects] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [selectedDetailExperience, setSelectedDetailExperience] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingExperience, setRejectingExperience] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Add/Edit Form State
  const [authorizedOptions, setAuthorizedOptions] = useState({ projects: [], documents: [] });
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [form, setForm] = useState({
    title: '',
    project_id: '',
    related_document_id: '',
    problem: '',
    solution: '',
    additional_context: '',
  });
  const [aiDraftNotes, setAiDraftNotes] = useState('');
  const [aiAssisting, setAiAssisting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Load Verified Experiences
  const loadVerifiedExperiences = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedProjectFilter) params.projectId = selectedProjectFilter;

      const res = await api.getExperiences(params);
      if (res.success) {
        setExperiences(res.experiences || []);
      }
    } catch (err) {
      console.error('Failed to load experiences:', err);
      showToast(err.message || 'Failed to load experiences', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load My Submissions
  const loadMySubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.getMyExperienceSubmissions();
      if (res.success) {
        setMySubmissions(res.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Admin Approvals
  const loadAdminApprovals = async (status = approvalSubTab) => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const res = await api.getAdminExperienceApprovals(status);
      if (res.success) {
        setAdminApprovals(res.experiences || []);
      }
    } catch (err) {
      console.error('Failed to load admin approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Authorized Options for Form
  const loadAuthorizedFormOptions = async (projectId = '') => {
    try {
      setLoadingOptions(true);
      const res = await api.getExperienceAuthorizedOptions(projectId);
      if (res.success) {
        setAuthorizedOptions(res);
        setAuthorizedProjects(res.projects || []);
        if (!form.project_id && res.projects?.length > 0) {
          setForm((prev) => ({
            ...prev,
            project_id: res.projects[0].id,
          }));
          // Fetch documents for first project
          const docRes = await api.getExperienceAuthorizedOptions(res.projects[0].id);
          if (docRes.success) {
            setAuthorizedOptions((prev) => ({ ...prev, documents: docRes.documents || [] }));
            if (docRes.documents?.length > 0) {
              setForm((prev) => ({ ...prev, related_document_id: docRes.documents[0].id }));
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'verified') {
      loadVerifiedExperiences();
    } else if (activeTab === 'my-submissions') {
      loadMySubmissions();
    } else if (activeTab === 'approvals') {
      loadAdminApprovals(approvalSubTab);
    }
  }, [activeTab, approvalSubTab, tenant, selectedProjectFilter]);

  // Load options initially for filters
  useEffect(() => {
    api.getExperienceAuthorizedOptions().then((res) => {
      if (res.success) {
        setAuthorizedProjects(res.projects || []);
      }
    }).catch(console.error);
  }, [tenant]);

  // Handle Project selection change in Form
  const handleProjectChange = async (projectId) => {
    setForm((prev) => ({ ...prev, project_id: projectId, related_document_id: '' }));
    try {
      setLoadingOptions(true);
      const res = await api.getExperienceAuthorizedOptions(projectId);
      if (res.success) {
        setAuthorizedOptions((prev) => ({ ...prev, documents: res.documents || [] }));
        if (res.documents?.length > 0) {
          setForm((prev) => ({ ...prev, related_document_id: res.documents[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingExperience(null);
    setForm({
      title: '',
      project_id: authorizedProjects[0]?.id || '',
      related_document_id: '',
      problem: '',
      solution: '',
      additional_context: '',
    });
    setAiDraftNotes('');
    setShowAddModal(true);
    loadAuthorizedFormOptions(authorizedProjects[0]?.id || '');
  };

  // Open Edit Modal for existing submission
  const handleOpenEditModal = (exp) => {
    setEditingExperience(exp);
    setForm({
      title: exp.title,
      project_id: exp.project_id,
      related_document_id: exp.related_document_id,
      problem: exp.problem,
      solution: exp.solution,
      additional_context: exp.additional_context || '',
    });
    setShowAddModal(true);
    loadAuthorizedFormOptions(exp.project_id);
  };

  // Submit Experience Form
  const handleSubmitExperience = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast('Please enter an experience title.', 'error');
    if (!form.project_id) return showToast('Please select an authorized project.', 'error');
    if (!form.related_document_id) return showToast('Please select a related authorized document.', 'error');
    if (!form.problem.trim()) return showToast('Please describe the problem encountered.', 'error');
    if (!form.solution.trim()) return showToast('Please explain the solution applied.', 'error');

    setActionLoading(true);
    try {
      if (editingExperience) {
        const res = await api.updateExperience(editingExperience.id, form);
        if (res.success) {
          showToast('Experience updated successfully. Resubmitted for Admin review.', 'success');
          setShowAddModal(false);
          loadMySubmissions();
        }
      } else {
        const res = await api.createExperience(form);
        if (res.success) {
          showToast('Experience submitted! It is now pending administrator verification.', 'success');
          setShowAddModal(false);
          if (activeTab === 'my-submissions') {
            loadMySubmissions();
          } else {
            setActiveTab('my-submissions');
          }
        }
      }
    } catch (err) {
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // AI Assist: Transform notes into structured problem/solution
  const handleAiAssist = async () => {
    if (!aiDraftNotes.trim()) {
      showToast('Please type some rough notes first to structure.', 'info');
      return;
    }
    setAiAssisting(true);
    try {
      const res = await api.aiAssistExperience({
        notes: aiDraftNotes,
        projectId: form.project_id,
        documentId: form.related_document_id,
      });

      if (res.success && res.structured) {
        setForm((prev) => ({
          ...prev,
          title: res.structured.title || prev.title,
          problem: res.structured.problem || prev.problem,
          solution: res.structured.solution || prev.solution,
          additional_context: res.structured.additional_context || prev.additional_context,
        }));
        showToast('Draft structured with AI assistance!', 'success');
      }
    } catch (err) {
      showToast(`AI Assistance: ${err.message}`, 'error');
    } finally {
      setAiAssisting(false);
    }
  };

  // Admin Approve Experience
  const handleApprove = async (exp) => {
    setActionLoading(true);
    try {
      const res = await api.approveExperience(exp.id);
      if (res.success) {
        showToast(`Approved experience: "${exp.title}"`, 'success');
        loadAdminApprovals();
        loadVerifiedExperiences();
      }
    } catch (err) {
      showToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Reject Experience
  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a reason for rejection.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.rejectExperience(rejectingExperience.id, rejectionReason.trim());
      if (res.success) {
        showToast('Experience rejected with feedback recorded.', 'info');
        setShowRejectModal(false);
        setRejectingExperience(null);
        setRejectionReason('');
        loadAdminApprovals();
      }
    } catch (err) {
      showToast(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Detail View
  const handleOpenDetail = async (exp) => {
    try {
      const res = await api.getExperience(exp.id);
      if (res.success) {
        setSelectedDetailExperience(res.experience);
      } else {
        setSelectedDetailExperience(exp);
      }
    } catch (err) {
      setSelectedDetailExperience(exp);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium flex items-center gap-2.5 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/30'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
              : 'bg-slate-900/90 text-slate-200 border-white/10'
          }`}
        >
          {toast.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Continuous Learning
            </span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Experience
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Learn from problems your team has already solved. Real technical solutions strictly connected to verified company documents.
          </p>
        </div>

        {/* Action Button: Add Experience */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Experience</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'verified'
              ? 'bg-slate-800 text-white font-semibold border border-white/10 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified Experiences</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-white/5">
            {experiences.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my-submissions')}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'my-submissions'
              ? 'bg-slate-800 text-white font-semibold border border-white/10 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <span>My Submissions</span>
          {mySubmissions.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-white/5">
              {mySubmissions.length}
            </span>
          )}
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-slate-800 text-white font-semibold border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Approvals</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              Review
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: VERIFIED EXPERIENCES (PUBLIC KNOWLEDGE) */}
      {activeTab === 'verified' && (
        <div className="space-y-6">
          {/* Search & Project Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search verified problems, solutions, titles, or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadVerifiedExperiences()}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Project Filter Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-xs text-slate-300 outline-none"
              >
                <option value="">All Authorized Projects</option>
                {authorizedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadVerifiedExperiences}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          {/* Experience Grid */}
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="inline-block w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-mono text-slate-400">Loading verified team experiences...</p>
            </div>
          ) : experiences.length === 0 ? (
            <div className="card-clean p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No verified experiences found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {searchQuery || selectedProjectFilter
                  ? 'No experiences matched your search criteria. Try a different search term or project.'
                  : 'Be the first on your team to document a technical solution! Every submission is verified by an admin and shared with authorized colleagues.'}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Experience</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => handleOpenDetail(exp)}
                  className="card-clean p-5 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all cursor-pointer group bg-gradient-to-b from-slate-900/90 to-slate-950/90"
                >
                  <div className="space-y-3">
                    {/* Header: Project Badge, Verified Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-white/5 flex items-center gap-1">
                        <FolderKanban className="w-3 h-3 text-indigo-400" />
                        {exp.project.name}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                      {exp.title}
                    </h3>

                    {/* Related Knowledge Source */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-slate-500">Related document:</span>
                      <span className="text-slate-300 truncate font-mono">{exp.related_document.title}</span>
                    </div>

                    {/* Problem Snippet */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400/80 font-bold">
                        Problem Faced
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {exp.problem}
                      </p>
                    </div>

                    {/* Solution Snippet */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 font-bold">
                        Solution Applied
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {exp.solution}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Author & Date */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <User className="w-3 h-3 text-slate-500" />
                      Shared by <span className="text-white font-medium">{exp.author.name}</span>
                    </span>
                    <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SUBMISSIONS */}
      {activeTab === 'my-submissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              My Submissions & Status
            </h2>
            <button
              onClick={loadMySubmissions}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-mono">Loading your submissions...</p>
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="card-clean p-10 text-center space-y-3">
              <p className="text-xs text-slate-400">You haven't submitted any experiences yet.</p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
              >
                + Submit An Experience
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="card-clean p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{sub.title}</span>
                      {sub.status === 'APPROVED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> APPROVED
                        </span>
                      ) : sub.status === 'REJECTED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> REJECTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> PENDING REVIEW
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
                      <span>Project: <strong className="text-slate-200">{sub.project_name}</strong></span>
                      <span>•</span>
                      <span>Doc: <strong className="text-slate-200">{sub.document_title}</strong></span>
                      <span>•</span>
                      <span>Submitted: {new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Rejection Reason display */}
                    {sub.status === 'REJECTED' && sub.rejection_reason && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 mt-2">
                        <span className="font-bold font-mono">Feedback from Administrator: </span>
                        {sub.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenDetail(sub)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium cursor-pointer"
                    >
                      View
                    </button>
                    {(sub.status === 'REJECTED' || sub.status === 'PENDING') && (
                      <button
                        onClick={() => handleOpenEditModal(sub)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit & Resubmit</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN APPROVALS DASHBOARD (ADMIN ONLY) */}
      {isAdmin && activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Subtabs for Approvals: PENDING, APPROVED, REJECTED */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <button
              onClick={() => setApprovalSubTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                approvalSubTab === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Verification
            </button>
            <button
              onClick={() => setApprovalSubTab('APPROVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                approvalSubTab === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Approved History
            </button>
            <button
              onClick={() => setApprovalSubTab('REJECTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                approvalSubTab === 'REJECTED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rejected
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-mono">Loading approval submissions...</p>
            </div>
          ) : adminApprovals.length === 0 ? (
            <div className="card-clean p-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs">No experiences in {approvalSubTab} status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {adminApprovals.map((exp) => (
                <div
                  key={exp.id}
                  className="card-clean p-6 space-y-4 border border-white/[0.08] hover:border-white/20 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {exp.project_name}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{exp.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                        <span>Author: <strong className="text-slate-200">{exp.author_name}</strong></span>
                        <span>•</span>
                        <span>Related Document: <strong className="text-slate-200">{exp.document_title}</strong></span>
                        <span>•</span>
                        <span>Submitted: {new Date(exp.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Approve / Reject Actions for PENDING */}
                    {exp.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(exp)}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setRejectingExperience(exp);
                            setRejectionReason('');
                            setShowRejectModal(true);
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.04]">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                        Problem Faced
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">{exp.problem}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                        Solution Applied
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">{exp.solution}</p>
                    </div>
                  </div>

                  {exp.additional_context && (
                    <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-white/[0.04]">
                      <span className="font-mono font-semibold text-slate-300">Lessons Learned: </span>
                      {exp.additional_context}
                    </div>
                  )}

                  {exp.rejection_reason && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                      <span className="font-bold font-mono">Rejection Reason: </span>
                      {exp.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT EXPERIENCE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-2xl p-6 border border-white/[0.12] shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {editingExperience ? 'Edit Experience' : 'Contribute Team Knowledge'}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {editingExperience ? 'Revise Your Experience' : 'Add Your Experience'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every experience must connect to an existing authorized project document.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExperience} className="space-y-4 text-xs">
              {/* Experience Title */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">
                  Experience Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. How we solved API timeout issues in high-load order processing"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                />
              </div>

              {/* Project & Related Document Selectors (Strictly Authorized Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Authorized Projects Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Project</span> <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={form.project_id}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs"
                  >
                    {authorizedOptions.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Only projects you are authorized to access are shown.
                  </p>
                </div>

                {/* Authorized Documents Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Related Knowledge Document</span> <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={form.related_document_id}
                    onChange={(e) => setForm({ ...form, related_document_id: e.target.value })}
                    required
                    disabled={loadingOptions || authorizedOptions.documents.length === 0}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs disabled:opacity-50"
                  >
                    {authorizedOptions.documents.length === 0 ? (
                      <option value="">No authorized documents found</option>
                    ) : (
                      authorizedOptions.documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} ({d.classification})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Must connect to existing CompanyBrain knowledge you can access.
                  </p>
                </div>
              </div>

              {/* Optional AI Assistant Helper */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                    Optional: AI Experience Assistant
                  </span>
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={aiAssisting || !aiDraftNotes.trim()}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{aiAssisting ? 'Structuring...' : 'Help me write this'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={aiDraftNotes}
                  onChange={(e) => setAiDraftNotes(e.target.value)}
                  placeholder="Type quick rough notes here (e.g. 'API timed out on big batch checkout, fixed with pagination & redis queue')..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/[0.08] text-white text-xs outline-none"
                />
              </div>

              {/* Problem Description */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">
                  Problem Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  placeholder="Describe the problem you faced..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Solution Description */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">
                  Solution Applied <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.solution}
                  onChange={(e) => setForm({ ...form, solution: e.target.value })}
                  placeholder="Explain how you solved the problem..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Additional Context / Lessons Learned */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">
                  Additional Context & Lessons Learned (Optional)
                </label>
                <textarea
                  rows={2}
                  value={form.additional_context}
                  onChange={(e) => setForm({ ...form, additional_context: e.target.value })}
                  placeholder="Add any useful context, limitations, or lessons learned..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-indigo-500 text-white outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Submitting...' : 'Submit for Approval'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPERIENCE DETAIL VIEW */}
      {selectedDetailExperience && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-2xl p-6 border border-white/[0.12] shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {selectedDetailExperience.project_name || selectedDetailExperience.project?.name}
                  </span>
                  {selectedDetailExperience.status === 'APPROVED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ✓ Verified Experience
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
                      <Clock className="w-3.5 h-3.5" /> {selectedDetailExperience.status}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">
                  {selectedDetailExperience.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDetailExperience(null)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Related Knowledge Clearance Check & Document View */}
            <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Related Knowledge Source:</span>
                  <span className="text-white font-mono">
                    {selectedDetailExperience.document_title || selectedDetailExperience.related_document?.title}
                  </span>
                </div>
                {selectedDetailExperience.can_access_document === false && (
                  <span className="text-rose-400 text-[10px] font-mono flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Access Revoked
                  </span>
                )}
              </div>

              {selectedDetailExperience.can_access_document === false ? (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-mono">
                  ⚠️ You no longer have access to this knowledge source (Policy clearance denied).
                </div>
              ) : selectedDetailExperience.document?.content ? (
                <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 text-[11px] max-h-28 overflow-y-auto leading-relaxed border border-white/5 font-mono">
                  {selectedDetailExperience.document.content.slice(0, 400)}...
                </div>
              ) : null}
            </div>

            {/* Problem Section */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
                Problem Faced
              </span>
              <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedDetailExperience.problem}
              </div>
            </div>

            {/* Solution Section */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                Solution Applied
              </span>
              <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedDetailExperience.solution}
              </div>
            </div>

            {/* Additional Context / Lessons Learned */}
            {selectedDetailExperience.additional_context && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1">
                  Lessons Learned & Context
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.04] text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedDetailExperience.additional_context}
                </div>
              </div>
            )}

            {/* Footer Metadata */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Shared by <strong className="text-white">{selectedDetailExperience.author_name || selectedDetailExperience.author?.name}</strong></span>
              <span>Submitted: {new Date(selectedDetailExperience.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADMIN REJECT REASON DIALOG */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card-clean w-full max-w-md p-6 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Reject Experience</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Provide actionable feedback explaining what details or corrections are needed.
                </p>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">
                Rejection Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Solution needs more technical detail or configuration snippets."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.08] focus:border-rose-500 text-white outline-none text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
