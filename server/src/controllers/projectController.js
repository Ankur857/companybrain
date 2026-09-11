import crypto from 'crypto';
import { db } from '../database/db.js';
import { RAGService } from '../services/rag/ragService.js';
import { PolicyEngine } from '../services/policy/policyEngine.js';
import { AuditService } from '../services/audit/auditService.js';
import { ArchiveService } from '../services/ingestion/archiveService.js';

export class ProjectController {
  /**
   * Helper: Check if a user is an authorized member of a project
   */
  static async checkProjectMembership(user, projectId) {
    if (['Company Admin', 'Super Admin'].includes(user.role_name)) {
      return true;
    }

    // Direct membership
    const { data: direct } = await db
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (direct) return true;

    // Group-based membership
    const { data: pGroups } = await db.from('project_groups').select('*').eq('project_id', projectId);
    const pGroupIds = new Set((pGroups || []).map((g) => g.group_id));

    const { data: uGroups } = await db.from('user_groups').select('*').eq('user_id', user.id);
    const uGroupIds = new Set((uGroups || []).map((g) => g.group_id));

    for (const gid of pGroupIds) {
      if (uGroupIds.has(gid)) return true;
    }

    return false;
  }

  /**
   * GET /api/projects
   * Returns projects for current tenant.
   * Employees only see projects they are authorized to access.
   */
  static async getAll(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const isAdmin = ['Company Admin', 'Super Admin'].includes(req.user.role_name);

      const { data: allProjects } = await db.from('projects').select('*').eq('tenant_id', tenantId);
      const projects = allProjects || [];

      const { data: allMembers } = await db.from('project_members').select('*');
      const { data: allGroups } = await db.from('project_groups').select('*');
      const { data: allKnowledge } = await db.from('project_knowledge').select('*');
      const { data: userGroupRows } = await db.from('user_groups').select('*').eq('user_id', req.user.id);
      const userGroupIds = new Set((userGroupRows || []).map((g) => g.group_id));

      const enriched = [];
      for (const p of projects) {
        const pMembers = (allMembers || []).filter((m) => m.project_id === p.id);
        const pGroups = (allGroups || []).filter((g) => g.project_id === p.id);
        const pKnowledge = (allKnowledge || []).filter((k) => k.project_id === p.id);

        const isDirectMember = pMembers.some((m) => m.user_id === req.user.id);
        const isGroupMember = pGroups.some((g) => userGroupIds.has(g.group_id));
        const isAuthorized = isAdmin || isDirectMember || isGroupMember;

        if (isAuthorized) {
          enriched.push({
            id: p.id,
            tenant_id: p.tenant_id,
            name: p.name,
            code: p.code || (p.name.includes('Alpha') ? 'ALPHA' : p.name.includes('Beta') ? 'BETA' : 'PROJECT'),
            description: p.description,
            owner_id: p.owner_id,
            status: p.status || 'ACTIVE',
            created_at: p.created_at,
            updated_at: p.updated_at,
            member_count: pMembers.length,
            group_count: pGroups.length,
            knowledge_count: pKnowledge.length,
            is_member: isDirectMember || isGroupMember,
          });
        }
      }

      return res.json({ success: true, projects: enriched });
    } catch (err) {
      console.error('ProjectController.getAll error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/projects/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found.' });
      }

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const hasAccess = await ProjectController.checkProjectMembership(req.user, id);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Access Denied: You are not assigned to this project.' });
      }

      const { data: pMembers } = await db.from('project_members').select('*').eq('project_id', id);
      const { data: pGroups } = await db.from('project_groups').select('*').eq('project_id', id);
      const { data: pKnowledge } = await db.from('project_knowledge').select('*').eq('project_id', id);

      return res.json({
        success: true,
        project: {
          ...project,
          code: project.code || (project.name.includes('Alpha') ? 'ALPHA' : project.name.includes('Beta') ? 'BETA' : 'PROJECT'),
          member_count: (pMembers || []).length,
          group_count: (pGroups || []).length,
          knowledge_count: (pKnowledge || []).length,
        },
      });
    } catch (err) {
      console.error('ProjectController.getById error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/projects
   * Admin only: Create a new project
   */
  static async create(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Project name is required.' });
      }

      const newId = crypto.randomUUID();
      const newProject = {
        id: newId,
        tenant_id: tenantId,
        name: name.trim(),
        description: description ? description.trim() : '',
        owner_id: req.user.id,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.from('projects').insert(newProject);

      // Auto-add creator as member
      await db.from('project_members').insert({
        project_id: newId,
        user_id: req.user.id,
        created_at: new Date().toISOString(),
      });

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'PROJECT_CREATED',
        resource_type: 'PROJECT',
        resource_id: newId,
        decision: 'SUCCESS',
        reason: `Administrator created project [${newProject.name}].`,
        metadata: { name: newProject.name },
      });

      return res.status(201).json({ success: true, project: newProject });
    } catch (err) {
      console.error('ProjectController.create error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/projects/:id
   * Admin only: Update project
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;
      const { name, description, status } = req.body;

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const updates = {
        updated_at: new Date().toISOString(),
      };
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description.trim();
      if (status !== undefined) updates.status = status;

      await db.from('projects').update(updates).eq('id', id);

      return res.json({ success: true, message: 'Project updated successfully.' });
    } catch (err) {
      console.error('ProjectController.update error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/projects/:id
   * Admin only: Archive project
   */
  static async archive(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      await db.from('projects').update({ status: 'ARCHIVED', updated_at: new Date().toISOString() }).eq('id', id);

      return res.json({ success: true, message: `Project "${project.name}" archived.` });
    } catch (err) {
      console.error('ProjectController.archive error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/projects/:id/members
   */
  static async getMembers(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const hasAccess = await ProjectController.checkProjectMembership(req.user, id);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Access Denied: You are not assigned to this project.' });
      }

      // Member user rows
      const { data: pMembers } = await db.from('project_members').select('*').eq('project_id', id);
      const memberUserIds = (pMembers || []).map((m) => m.user_id);

      const { data: allUsers } = await db.from('users').select('*').eq('tenant_id', tenantId);
      const members = (allUsers || []).filter((u) => memberUserIds.includes(u.id)).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role_name: u.role_name,
        department: u.department,
      }));

      // Member group rows
      const { data: pGroups } = await db.from('project_groups').select('*').eq('project_id', id);
      const memberGroupIds = (pGroups || []).map((g) => g.group_id);

      const { data: allGroups } = await db.from('groups').select('*').eq('tenant_id', tenantId);
      const groups = (allGroups || []).filter((g) => memberGroupIds.includes(g.id)).map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
      }));

      return res.json({
        success: true,
        members,
        users: members,
        groups,
        allAvailableUsers: (allUsers || []).map((u) => ({ id: u.id, name: u.name, email: u.email, department: u.department })),
        allAvailableGroups: (allGroups || []).map((g) => ({ id: g.id, name: g.name, description: g.description })),
      });
    } catch (err) {
      console.error('ProjectController.getMembers error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/projects/:id/members
   * Admin only: Assign user to project
   */
  static async addMember(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const tenantId = req.user.tenant_id;

      if (!userId) return res.status(400).json({ success: false, error: 'User ID is required.' });

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      // Check if already assigned
      const { data: existing } = await db
        .from('project_members')
        .select('*')
        .eq('project_id', id)
        .eq('user_id', userId)
        .single();

      if (!existing) {
        await db.from('project_members').insert({
          project_id: id,
          user_id: userId,
          created_at: new Date().toISOString(),
        });

        await AuditService.logEvent({
          tenant_id: tenantId,
          user_id: req.user.id,
          user_name: req.user.name,
          action: 'PROJECT_MEMBER_ADDED',
          resource_type: 'PROJECT',
          resource_id: id,
          decision: 'SUCCESS',
          reason: `Assigned user [${userId}] to project [${project.name}].`,
          metadata: { userId, projectId: id },
        });
      }

      return res.json({ success: true, message: 'User assigned to project successfully.' });
    } catch (err) {
      console.error('ProjectController.addMember error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/projects/:id/members/:userId
   * Admin only: Remove user from project
   */
  static async removeMember(req, res) {
    try {
      const { id, userId } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      await db.from('project_members').delete().eq('project_id', id).eq('user_id', userId);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'PROJECT_MEMBER_REMOVED',
        resource_type: 'PROJECT',
        resource_id: id,
        decision: 'SUCCESS',
        reason: `Removed user [${userId}] from project [${project.name}].`,
        metadata: { userId, projectId: id },
      });

      return res.json({ success: true, message: 'User removed from project.' });
    } catch (err) {
      console.error('ProjectController.removeMember error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/projects/:id/groups
   * Admin only: Assign group to project
   */
  static async addGroup(req, res) {
    try {
      const { id } = req.params;
      const { groupId } = req.body;
      const tenantId = req.user.tenant_id;

      if (!groupId) return res.status(400).json({ success: false, error: 'Group ID is required.' });

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const { data: existing } = await db
        .from('project_groups')
        .select('*')
        .eq('project_id', id)
        .eq('group_id', groupId)
        .single();

      if (!existing) {
        await db.from('project_groups').insert({
          project_id: id,
          group_id: groupId,
          created_at: new Date().toISOString(),
        });

        await AuditService.logEvent({
          tenant_id: tenantId,
          user_id: req.user.id,
          user_name: req.user.name,
          action: 'PROJECT_MEMBER_ADDED',
          resource_type: 'PROJECT_GROUP',
          resource_id: id,
          decision: 'SUCCESS',
          reason: `Assigned group [${groupId}] to project [${project.name}].`,
          metadata: { groupId, projectId: id },
        });
      }

      return res.json({ success: true, message: 'Group assigned to project successfully.' });
    } catch (err) {
      console.error('ProjectController.addGroup error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/projects/:id/groups/:groupId
   * Admin only: Remove group from project
   */
  static async removeGroup(req, res) {
    try {
      const { id, groupId } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      await db.from('project_groups').delete().eq('project_id', id).eq('group_id', groupId);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'PROJECT_MEMBER_REMOVED',
        resource_type: 'PROJECT_GROUP',
        resource_id: id,
        decision: 'SUCCESS',
        reason: `Removed group [${groupId}] from project [${project.name}].`,
        metadata: { groupId, projectId: id },
      });

      return res.json({ success: true, message: 'Group removed from project.' });
    } catch (err) {
      console.error('ProjectController.removeGroup error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/projects/:id/knowledge
   * Returns attached documents for project (filtered by user clearance)
   */
  static async getKnowledge(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const hasAccess = await ProjectController.checkProjectMembership(req.user, id);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'Access Denied: You are not assigned to this project.' });
      }

      const { data: pKnowledge } = await db.from('project_knowledge').select('*').eq('project_id', id);
      const attachedDocIds = new Set((pKnowledge || []).map((k) => k.document_id));

      const { data: allDocs } = await db.from('documents').select('*').eq('tenant_id', tenantId);

      // ONLY return documents explicitly attached to this project by the admin, excluding any mock/demo documents
      const attachedDocs = (allDocs || []).filter((d) => {
        if (!attachedDocIds.has(d.id)) return false;
        const isMock = d.is_demo === true || d.is_mock === true || d.id.startsWith('f1111111-') || d.id.startsWith('f2222222-') || d.id.startsWith('f3333333-');
        return !isMock;
      });

      // Evaluate clearance for current user
      const evaluated = attachedDocs.map((doc) => {
        const decision = PolicyEngine.canAccess(req.user, doc);
        const snippet = doc.content
          ? (doc.content.length > 250 ? doc.content.slice(0, 250) + '...' : doc.content)
          : '';
        return {
          id: doc.id,
          document_id: doc.id,
          project_id: id,
          title: doc.title,
          source_type: doc.source_type,
          source_url: doc.source_url,
          department: doc.department,
          project: doc.project,
          classification: doc.classification,
          content: snippet,
          canAccess: decision.allowed,
          accessReason: decision.reason,
          created_at: doc.created_at,
          metadata: doc.metadata || {},
          document: {
            id: doc.id,
            title: doc.title,
            source_type: doc.source_type,
            source_url: doc.source_url,
            department: doc.department,
            project: doc.project,
            classification: doc.classification,
            content: snippet,
          },
        };
      });

      return res.json({
        success: true,
        knowledge: evaluated,
        allTenantDocs: ['Company Admin', 'Super Admin'].includes(req.user.role_name)
          ? (allDocs || [])
              .filter((d) => !d.is_mock && !d.is_demo && !d.id.startsWith('f1111111-') && !d.id.startsWith('f2222222-') && !d.id.startsWith('f3333333-'))
              .map((d) => ({
                id: d.id,
                title: d.title,
                source_type: d.source_type,
                classification: d.classification,
                department: d.department,
                project: d.project,
              }))
          : [],
      });
    } catch (err) {
      console.error('ProjectController.getKnowledge error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/projects/:id/knowledge
   * Admin only: Attach connected document to project
   */
  static async addKnowledge(req, res) {
    try {
      const { id } = req.params;
      const { documentIds = [] } = req.body;
      const tenantId = req.user.tenant_id;

      const docList = Array.isArray(documentIds) ? documentIds : [req.body.documentId].filter(Boolean);
      if (docList.length === 0) {
        return res.status(400).json({ success: false, error: 'documentIds array is required.' });
      }

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      for (const docId of docList) {
        const { data: existing } = await db
          .from('project_knowledge')
          .select('*')
          .eq('project_id', id)
          .eq('document_id', docId)
          .single();

        if (!existing) {
          await db.from('project_knowledge').insert({
            project_id: id,
            document_id: docId,
            created_at: new Date().toISOString(),
          });
        }
      }

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'PROJECT_KNOWLEDGE_ADDED',
        resource_type: 'PROJECT',
        resource_id: id,
        decision: 'SUCCESS',
        reason: `Attached ${docList.length} document(s) to project [${project.name}].`,
        metadata: { attachedCount: docList.length, projectId: id },
      });

      return res.json({ success: true, message: `Attached ${docList.length} document(s) to project.` });
    } catch (err) {
      console.error('ProjectController.addKnowledge error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/projects/:id/knowledge/:docId
   * Admin only: Remove document from project
   */
  static async removeKnowledge(req, res) {
    try {
      const { id, docId } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      await db.from('project_knowledge').delete().eq('project_id', id).eq('document_id', docId);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'PROJECT_KNOWLEDGE_REMOVED',
        resource_type: 'PROJECT',
        resource_id: id,
        decision: 'SUCCESS',
        reason: `Removed document [${docId}] from project [${project.name}].`,
        metadata: { docId, projectId: id },
      });

      return res.json({ success: true, message: 'Document removed from project.' });
    } catch (err) {
      console.error('ProjectController.removeKnowledge error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/projects/:id/query
   * Natural language AI Chat scoped strictly to authorized project knowledge
   */
  static async queryProject(req, res) {
    try {
      const { id } = req.params;
      const { query } = req.body;

      if (!query || !query.trim()) {
        return res.status(400).json({ success: false, error: 'Query is required.' });
      }

      const result = await RAGService.executeProjectQuery({
        user: req.user,
        project_id: id,
        query: query.trim(),
        action_type: 'chat',
      });

      return res.status(result.decision === 'DENY' && !result.success ? 403 : 200).json(result);
    } catch (err) {
      console.error('ProjectController.queryProject error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/projects/:id/understand
   * Structured Project Intelligence generator (overview, architecture, services, database, apis, deployment, summary, onboarding)
   */
  static async understandProject(req, res) {
    try {
      const { id } = req.params;
      const { action = 'overview', query = '' } = req.body;

      const result = await RAGService.executeProjectQuery({
        user: req.user,
        project_id: id,
        query: query || action,
        action_type: action,
      });

      return res.status(result.decision === 'DENY' && !result.success ? 403 : 200).json(result);
    } catch (err) {
      console.error('ProjectController.understandProject error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/projects/:id/upload-zip
   * Admin only: Upload GitHub repo .zip file, unpack, and ingest files into Project Knowledge
   */
  static async uploadProjectZip(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;
      const { zipData, repositoryName, classification = 'INTERNAL', allowedGroupIds = [] } = req.body;

      if (!zipData) {
        return res.status(400).json({ success: false, error: 'Zip file data is required (base64 encoded).' });
      }

      const { data: project } = await db.from('projects').select('*').eq('id', id).single();
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      if (project.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      console.log(`[ProjectController] Unpacking repository zip for project: ${project.name}...`);
      const { repositoryName: repoName, totalFiles, manifest, files, categoryBreakdown } = await ArchiveService.unpackRepositoryZip(
        zipData,
        { repositoryName: repositoryName || project.name }
      );

      if (totalFiles === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid text or code files could be extracted from this zip archive.'
        });
      }

      // 1. Ingest Manifest Document
      const manifestId = crypto.randomUUID();
      const manifestDoc = {
        id: manifestId,
        tenant_id: tenantId,
        title: manifest.title,
        content: manifest.content,
        source_type: 'github_zip',
        source_url: `github://${repoName}/manifest`,
        department: 'Engineering',
        project: project.name,
        classification: classification || 'INTERNAL',
        owner: req.user.email,
        version: '1.0',
        metadata: {
          category: 'Documentation',
          repository: repoName,
          total_extracted_files: totalFiles,
          uploaded_by: req.user.name,
        },
        required_groups: allowedGroupIds.length > 0 ? allowedGroupIds : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await db.from('documents').insert(manifestDoc);
      await db.from('project_knowledge').insert({
        project_id: id,
        document_id: manifestId,
        created_at: new Date().toISOString(),
      });

      // 2. Ingest Extracted Code and Documentation Files
      let ingestedCount = 1;
      for (const f of files) {
        const docId = crypto.randomUUID();
        const docRecord = {
          id: docId,
          tenant_id: tenantId,
          title: `[${repoName}] ${f.path}`,
          content: f.content,
          source_type: 'github_zip',
          source_url: `github://${repoName}/${f.path}`,
          department: 'Engineering',
          project: project.name,
          classification: classification || 'INTERNAL',
          owner: req.user.email,
          version: '1.0',
          metadata: {
            filePath: f.path,
            fileName: f.fileName,
            category: f.category,
            repository: repoName,
            extension: f.extension,
            sizeBytes: f.sizeBytes,
          },
          required_groups: allowedGroupIds.length > 0 ? allowedGroupIds : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await db.from('documents').insert(docRecord);
        await db.from('project_knowledge').insert({
          project_id: id,
          document_id: docId,
          created_at: new Date().toISOString(),
        });
        ingestedCount++;
      }

      // Log Audit Event
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'PROJECT_KNOWLEDGE_ADDED',
        resource_type: 'PROJECT',
        resource_id: id,
        decision: 'ALLOW',
        reason: `Administrator ingested ${ingestedCount} repository code/doc files from GitHub zip into [${project.name}].`,
        metadata: {
          project_name: project.name,
          repository: repoName,
          files_ingested: ingestedCount,
        },
      });

      return res.status(201).json({
        success: true,
        message: `Successfully unpacked and ingested ${ingestedCount} code and documentation files into ${project.name}.`,
        repositoryName: repoName,
        files_ingested: ingestedCount,
        totalFiles: ingestedCount,
        manifest_id: manifestId,
        category_breakdown: categoryBreakdown || {},
      });
    } catch (err) {
      console.error('ProjectController.uploadProjectZip error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
