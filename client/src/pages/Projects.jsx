import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FolderKanban,
  Plus,
  Users,
  FileText,
  KeyRound,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
  Lock,
  Layers,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  AlertCircle
} from 'lucide-react';

export function Projects() {
  const { user, tenant } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    description: '',
    tags: '',
    repository_url: ''
  });
  
  // Manage Members Modal
  const [activeProjectForMembers, setActiveProjectForMembers] = useState(null);
  const [projectMembers, setProjectMembers] = useState({ users: [], groups: [] });
  const [allTenantUsers, setAllTenantUsers] = useState([]);
  const [allTenantGroups, setAllTenantGroups] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [selectedRoleForUser, setSelectedRoleForUser] = useState('contributor');
  const [selectedGroupToAdd, setSelectedGroupToAdd] = useState('');

  // Manage Knowledge Modal
  const [activeProjectForKnowledge, setActiveProjectForKnowledge] = useState(null);
  const [projectKnowledge, setProjectKnowledge] = useState([]);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocToAdd, setSelectedDocToAdd] = useState('');

  const isAdmin = ['Company Admin', 'Super Admin'].includes(user?.role_name);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.getProjects();
      if (res.success) {
        setProjects(res.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      showToast('error', err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [tenant]);

  // Handle Project Creation
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.code.trim()) {
      showToast('error', 'Project name and code are required');
      return;
    }

    try {
      const res = await api.createProject({
        name: createForm.name.trim(),
        code: createForm.code.trim().toUpperCase(),
        description: createForm.description.trim(),
        tags: createForm.tags ? createForm.tags.split(',').map((t) => t.trim()) : [],
        repository_url: createForm.repository_url.trim()
      });

      if (res.success) {
        showToast('success', `Project "${res.project.name}" created successfully`);
        setShowCreateModal(false);
        setCreateForm({ name: '', code: '', description: '', tags: '', repository_url: '' });
        fetchProjects();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to create project');
    }
  };

  // Open Manage Members
  const openManageMembers = async (project) => {
    setActiveProjectForMembers(project);
    try {
      const [memRes, usersRes, grpRes] = await Promise.all([
        api.getProjectMembers(project.id),
        api.getUsers(),
        api.getGroups()
      ]);
      if (memRes.success) setProjectMembers(memRes);
      if (usersRes.success) setAllTenantUsers(usersRes.users || []);
      if (grpRes.success) setAllTenantGroups(grpRes.groups || []);
    } catch (err) {
      showToast('error', err.message || 'Failed to load members');
    }
  };

  // Add Member
  const handleAddMember = async () => {
    if (!selectedUserToAdd || !activeProjectForMembers) return;
    try {
      await api.addProjectMember(activeProjectForMembers.id, {
        userId: selectedUserToAdd,
        role: selectedRoleForUser
      });
      showToast('success', 'Member added to project');
      setSelectedUserToAdd('');
      const updated = await api.getProjectMembers(activeProjectForMembers.id);
      if (updated.success) setProjectMembers(updated);
      fetchProjects();
    } catch (err) {
      showToast('error', err.message || 'Failed to add member');
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId) => {
    if (!activeProjectForMembers) return;
    try {
      await api.removeProjectMember(activeProjectForMembers.id, userId);
      showToast('success', 'Member removed');
      const updated = await api.getProjectMembers(activeProjectForMembers.id);
      if (updated.success) setProjectMembers(updated);
      fetchProjects();
    } catch (err) {
      showToast('error', err.message || 'Failed to remove member');
    }
  };

  // Add Group
  const handleAddGroup = async () => {
    if (!selectedGroupToAdd || !activeProjectForMembers) return;
    try {
      await api.addProjectGroup(activeProjectForMembers.id, {
        groupId: selectedGroupToAdd
      });
      showToast('success', 'Access group granted project clearance');
      setSelectedGroupToAdd('');
      const updated = await api.getProjectMembers(activeProjectForMembers.id);
      if (updated.success) setProjectMembers(updated);
      fetchProjects();
    } catch (err) {
      showToast('error', err.message || 'Failed to add group');
    }
  };

  // Remove Group
  const handleRemoveGroup = async (groupId) => {
    if (!activeProjectForMembers) return;
    try {
      await api.removeProjectGroup(activeProjectForMembers.id, groupId);
      showToast('success', 'Group clearance revoked');
      const updated = await api.getProjectMembers(activeProjectForMembers.id);
      if (updated.success) setProjectMembers(updated);
      fetchProjects();
    } catch (err) {
      showToast('error', err.message || 'Failed to remove group');
    }
  };

  // Open Manage Knowledge
  const openManageKnowledge = async (project) => {
    setActiveProjectForKnowledge(project);
    try {
      const [kRes, docsRes] = await Promise.all([
        api.getProjectKnowledge(project.id),
        api.getDocuments()
      ]);
      if (kRes.success) setProjectKnowledge(kRes.knowledge || []);
      if (docsRes.success) setAvailableDocs(docsRes.documents || []);
    } catch (err) {
      showToast('error', err.message || 'Failed to load project knowledge');
    }
  };

  // Add Knowledge
  const handleAddKnowledge = async () => {
    if (!selectedDocToAdd || !activeProjectForKnowledge) return;
    try {
      await api.addProjectKnowledge(activeProjectForKnowledge.id, {
        documentId: selectedDocToAdd
      });
      showToast('success', 'Document linked to project');
      setSelectedDocToAdd('');
      const updated = await api.getProjectKnowledge(activeProjectForKnowledge.id);
      if (updated.success) setProjectKnowledge(updated.knowledge || []);
      fetchProjects();
    } catch (err) {
      showToast('error', err.message || 'Failed to attach document');
    }
  };

  // Remove Knowledge
  const handleRemoveKnowledge = async (docId) => {
    if (!activeProjectForKnowledge) return;
    try {
      await api.removeProjectKnowledge(activeProjectForKnowledge.id, docId);
      showToast('success', 'Document unlinked from project');
      const updated = await api.getProjectKnowledge(activeProjectForKnowledge.id);
      if (updated.success) setProjectKnowledge(updated.knowledge || []);
      fetchProjects();
    } catch (err) {
      showToast('error', err.message || 'Failed to unlink document');
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Project Intelligence
            </span>
            <span className="text-xs text-slate-500 font-mono">•</span>
            <span className="text-xs text-slate-400 font-mono">{tenant?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            Projects & Workspace Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Accelerate developer onboarding and project understanding. Freshers can explore architecture, services, APIs, databases, and ask project-scoped questions with strict Level 1 (Membership) and Level 2 (Policy) pre-RAG clearance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name, code or tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-medium">{filteredProjects.length}</span> accessible project{filteredProjects.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-xs font-mono">Evaluating project clearances...</div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card-clean p-12 text-center text-slate-400">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery
              ? 'No projects match your search query.'
              : 'You have not been assigned to any projects yet. Contact your administrator for access.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="card-clean p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-all group relative overflow-hidden"
            >
              {/* Top Accent Gradient */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-cyan-500 to-transparent opacity-40 group-hover:opacity-100 transition-opacity"></div>

              <div>
                {/* Status & Code */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                    {project.code}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                    {project.status || 'Active'}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                  {project.description || 'Enterprise project repository & knowledge base.'}
                </p>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.05]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/[0.05] text-[11px] text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      <strong className="text-white font-medium">{project.members_count || 0}</strong> Members
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      <strong className="text-white font-medium">{project.knowledge_count || 0}</strong> Sources
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                {/* Primary: Understand Project */}
                <button
                  onClick={() => navigate(`/projects/${project.id}/understand`)}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-indigo-500/20"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Understand Project</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Admin Management Links */}
                {isAdmin && (
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      onClick={() => openManageMembers(project)}
                      className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <Users className="w-3 h-3" />
                      <span>Access</span>
                    </button>
                    <span className="text-slate-700">•</span>
                    <button
                      onClick={() => openManageKnowledge(project)}
                      className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Knowledge</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Project */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-clean max-w-lg w-full p-6 relative border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Create New Project</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Alpha"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Code / Identifier <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ALPHA"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.08] text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Core mission, architecture summary, or business context..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="backend, payments, nodejs, postgres"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Members (Users & Groups) */}
      {activeProjectForMembers && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-clean max-w-2xl w-full p-6 relative border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">
                    Access Clearances: {activeProjectForMembers.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure direct members or access groups (Level 1 Project Authorization).
                </p>
              </div>
              <button
                onClick={() => setActiveProjectForMembers(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Members Section */}
            <div className="space-y-4 mb-6">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Direct User Members</span>
              </h4>

              <div className="flex items-center gap-2">
                <select
                  value={selectedUserToAdd}
                  onChange={(e) => setSelectedUserToAdd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select an employee...</option>
                  {allTenantUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role_name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRoleForUser}
                  onChange={(e) => setSelectedRoleForUser(e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="contributor">Contributor</option>
                  <option value="fresher">Fresher</option>
                  <option value="lead">Lead</option>
                  <option value="reviewer">Reviewer</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!selectedUserToAdd}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              {/* Members List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(projectMembers.users || []).map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-white/[0.04]"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{m.user?.name || m.user_id}</div>
                      <div className="text-[10px] text-slate-400">
                        {m.user?.email} • <span className="text-indigo-400 capitalize">{m.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Access Groups Section */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Assigned Access Groups (Group Inherited)</span>
              </h4>

              <div className="flex items-center gap-2">
                <select
                  value={selectedGroupToAdd}
                  onChange={(e) => setSelectedGroupToAdd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select an access group to grant project clearance...</option>
                  {allTenantGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} - {g.description}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddGroup}
                  disabled={!selectedGroupToAdd}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  Authorize Group
                </button>
              </div>

              {/* Groups List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(projectMembers.groups || []).map((g) => (
                  <div
                    key={g.group_id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-white/[0.04]"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{g.group?.name || g.group_id}</div>
                      <div className="text-[10px] text-slate-400">{g.group?.description}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveGroup(g.group_id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Revoke group clearance"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/[0.08] mt-6">
              <button
                onClick={() => setActiveProjectForMembers(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manage Knowledge (Documents) */}
      {activeProjectForKnowledge && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-clean max-w-2xl w-full p-6 relative border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">
                    Knowledge Sources: {activeProjectForKnowledge.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Link authorized documents from Google Drive, Supabase, or live connectors.
                </p>
              </div>
              <button
                onClick={() => setActiveProjectForKnowledge(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attach Document Form */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2">
                <select
                  value={selectedDocToAdd}
                  onChange={(e) => setSelectedDocToAdd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select document to link...</option>
                  {availableDocs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.source_type} • {d.classification})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddKnowledge}
                  disabled={!selectedDocToAdd}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  Link Document
                </button>
              </div>

              {/* Document List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {projectKnowledge.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No documents linked to this project yet.
                  </div>
                ) : (
                  projectKnowledge.map((k) => (
                    <div
                      key={k.document_id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-white/[0.04]"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="text-xs font-medium text-white truncate">
                          {k.document?.title || k.document_id}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-indigo-400 uppercase">
                            {k.document?.source_type}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400">
                            {k.document?.classification}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveKnowledge(k.document_id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors shrink-0"
                        title="Unlink document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/[0.08]">
              <button
                onClick={() => setActiveProjectForKnowledge(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
