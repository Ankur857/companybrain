import crypto from 'crypto';
import { db } from '../database/db.js';
import { ProjectController } from './projectController.js';
import { PolicyEngine } from '../services/policy/policyEngine.js';
import { AuditService } from '../services/audit/auditService.js';
import { aiService } from '../services/ai/aiService.js';

export class ExperienceController {
  /**
   * GET /api/experiences
   * Retrieve all public VERIFIED experiences.
   * STRICT VISIBILITY RULE:
   * 1. experience.status === 'APPROVED'
   * 2. experience.tenant_id === req.user.tenant_id
   * 3. Current user has access to associated project (checkProjectMembership)
   * 4. Current user has access to associated document (PolicyEngine.canAccess)
   * APPROVED + AUTHORIZED = VISIBLE
   * APPROVED + UNAUTHORIZED = NOT VISIBLE
   * PENDING / REJECTED = NOT VISIBLE
   */
  static async getAll(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { search, projectId, documentId, authorId } = req.query;

      // 1. Fetch approved experiences strictly for this tenant
      const { data: allExps } = await db
        .from('experiences')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'APPROVED');

      const experiences = allExps || [];

      // 2. Fetch projects and documents for metadata and clearance
      const { data: tenantProjects } = await db.from('projects').select('*').eq('tenant_id', tenantId);
      const projectMap = new Map((tenantProjects || []).map((p) => [p.id, p]));

      const { data: tenantDocs } = await db.from('documents').select('*').eq('tenant_id', tenantId);
      const docMap = new Map((tenantDocs || []).map((d) => [d.id, d]));

      // 3. Filter experiences by current user's authorization to BOTH project and document
      const authorizedExperiences = [];

      for (const exp of experiences) {
        // Project filter if supplied
        if (projectId && exp.project_id !== projectId) continue;
        // Document filter if supplied
        if (documentId && exp.related_document_id !== documentId) continue;
        // Author filter if supplied
        if (authorId && exp.author_id !== authorId) continue;

        // Verify project authorization
        const hasProjectAccess = await ProjectController.checkProjectMembership(req.user, exp.project_id);
        if (!hasProjectAccess) {
          continue; // User is not authorized for this project
        }

        // Verify document authorization
        const doc = docMap.get(exp.related_document_id);
        if (!doc) {
          continue; // Associated document does not exist in tenant
        }

        const docAccess = PolicyEngine.canAccess(req.user, doc);
        if (!docAccess.allowed) {
          continue; // User is not authorized to access this document
        }

        // Search text matching across title, problem, solution, additional_context
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          const matchTitle = (exp.title || '').toLowerCase().includes(q);
          const matchProblem = (exp.problem || '').toLowerCase().includes(q);
          const matchSolution = (exp.solution || '').toLowerCase().includes(q);
          const matchContext = (exp.additional_context || '').toLowerCase().includes(q);
          const matchAuthor = (exp.author_name || '').toLowerCase().includes(q);
          if (!matchTitle && !matchProblem && !matchSolution && !matchContext && !matchAuthor) {
            continue;
          }
        }

        const project = projectMap.get(exp.project_id);

        authorizedExperiences.push({
          id: exp.id,
          title: exp.title,
          problem: exp.problem,
          solution: exp.solution,
          additional_context: exp.additional_context,
          status: exp.status,
          verified: true,
          created_at: exp.created_at,
          updated_at: exp.updated_at,
          reviewed_at: exp.reviewed_at,
          author: {
            id: exp.author_id,
            name: exp.author_name,
          },
          project: {
            id: exp.project_id,
            name: project ? project.name : 'Unknown Project',
            code: project ? project.code : 'PROJECT',
          },
          related_document: {
            id: doc.id,
            title: doc.title,
            source_type: doc.source_type,
            classification: doc.classification,
          },
        });
      }

      // Sort latest first
      authorizedExperiences.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Audit access check
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'EXPERIENCE_ACCESS_CHECKED',
        resource_type: 'EXPERIENCE',
        decision: 'ALLOW',
        reason: `User [${req.user.name}] queried verified experiences. Returned ${authorizedExperiences.length} authorized item(s).`,
        metadata: {
          searchQuery: search || null,
          returnedCount: authorizedExperiences.length,
        },
      });

      return res.json({
        success: true,
        experiences: authorizedExperiences,
        total: authorizedExperiences.length,
      });
    } catch (err) {
      console.error('ExperienceController.getAll error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/experiences/authorized-options
   * Returns ONLY the projects and documents that the CURRENT USER is authorized to access.
   * Used by the Add Experience form to guarantee users cannot select unauthorized items.
   */
  static async getAuthorizedOptions(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { projectId } = req.query;

      // 1. Get projects authorized for this user
      const { data: allProjects } = await db.from('projects').select('*').eq('tenant_id', tenantId);
      const authorizedProjects = [];

      for (const p of allProjects || []) {
        const hasAccess = await ProjectController.checkProjectMembership(req.user, p.id);
        if (hasAccess) {
          authorizedProjects.push({
            id: p.id,
            name: p.name,
            code: p.code || 'PROJECT',
            description: p.description,
          });
        }
      }

      // 2. Get documents authorized for this user
      const targetProjectId = projectId || (authorizedProjects.length > 0 ? authorizedProjects[0].id : null);
      let authorizedDocuments = [];

      if (targetProjectId) {
        // Verify user can access this target project
        const hasProjAccess = await ProjectController.checkProjectMembership(req.user, targetProjectId);
        if (hasProjAccess) {
          const { data: pKnowledge } = await db
            .from('project_knowledge')
            .select('*')
            .eq('project_id', targetProjectId);
          const attachedDocIds = new Set((pKnowledge || []).map((k) => k.document_id));

          const { data: allDocs } = await db.from('documents').select('*').eq('tenant_id', tenantId);
          const targetProj = authorizedProjects.find((p) => p.id === targetProjectId);

          const candidateDocs = (allDocs || []).filter((d) => {
            const isAttached = attachedDocIds.has(d.id);
            const isProjectMatch =
              targetProj &&
              ((d.project && d.project.toLowerCase() === targetProj.name.toLowerCase()) ||
                d.metadata?.projectId === targetProjectId ||
                d.metadata?.project_id === targetProjectId);
            return isAttached || isProjectMatch;
          });

          // Filter strictly by PolicyEngine clearance
          for (const doc of candidateDocs) {
            const decision = PolicyEngine.canAccess(req.user, doc);
            if (decision.allowed) {
              authorizedDocuments.push({
                id: doc.id,
                title: doc.title,
                source_type: doc.source_type,
                classification: doc.classification,
                department: doc.department,
              });
            }
          }
        }
      }

      return res.json({
        success: true,
        projects: authorizedProjects,
        documents: authorizedDocuments,
      });
    } catch (err) {
      console.error('ExperienceController.getAuthorizedOptions error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/experiences
   * Submit a new experience for Admin approval.
   * Enforces:
   * - Tenant isolation (tenant_id from req.user)
   * - Authorized project verification (checkProjectMembership)
   * - Authorized document verification (PolicyEngine.canAccess)
   * - Initial status = PENDING
   */
  static async create(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { title, project_id, related_document_id, problem, solution, additional_context } = req.body;

      // 1. Validation
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Experience title is required.' });
      }
      if (!project_id || !project_id.trim()) {
        return res.status(400).json({ success: false, error: 'Project selection is required.' });
      }
      if (!related_document_id || !related_document_id.trim()) {
        return res.status(400).json({ success: false, error: 'Related document selection is required.' });
      }
      if (!problem || !problem.trim()) {
        return res.status(400).json({ success: false, error: 'Problem description is required.' });
      }
      if (!solution || !solution.trim()) {
        return res.status(400).json({ success: false, error: 'Solution explanation is required.' });
      }

      // 2. Strict Project Access Enforcement
      const { data: project } = await db.from('projects').select('*').eq('id', project_id).single();
      if (!project || project.tenant_id !== tenantId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You cannot create an experience for an unauthorized or cross-tenant project.',
        });
      }

      const hasProjectAccess = await ProjectController.checkProjectMembership(req.user, project_id);
      if (!hasProjectAccess) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You are not an authorized member of this project.',
        });
      }

      // 3. Strict Document Access Enforcement
      const { data: doc } = await db.from('documents').select('*').eq('id', related_document_id).single();
      if (!doc || doc.tenant_id !== tenantId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: The selected knowledge document does not exist or belongs to another tenant.',
        });
      }

      const docAccess = PolicyEngine.canAccess(req.user, doc);
      if (!docAccess.allowed) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Policy clearance denied for document [${doc.title}]. Reason: ${docAccess.reason}`,
        });
      }

      // 4. Create experience in PENDING status
      const newExperience = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        project_id,
        related_document_id,
        author_id: req.user.id,
        author_name: req.user.name,
        title: title.trim(),
        problem: problem.trim(),
        solution: solution.trim(),
        additional_context: (additional_context || '').trim(),
        status: 'PENDING',
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.from('experiences').insert(newExperience);

      // 5. Audit log
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'EXPERIENCE_SUBMITTED',
        resource_type: 'EXPERIENCE',
        resource_id: newExperience.id,
        decision: 'SUCCESS',
        reason: `User [${req.user.name}] submitted experience "${newExperience.title}" for project [${project.name}] referencing document [${doc.title}]. Status: PENDING.`,
        metadata: {
          experienceId: newExperience.id,
          projectId: project_id,
          projectName: project.name,
          documentId: related_document_id,
          documentTitle: doc.title,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Experience submitted successfully and is pending administrator review.',
        experience: newExperience,
      });
    } catch (err) {
      console.error('ExperienceController.create error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/experiences/my-submissions
   * Returns current user's submitted experiences (Pending, Approved, Rejected)
   */
  static async getMySubmissions(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { data: allExps } = await db
        .from('experiences')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('author_id', req.user.id);

      const experiences = allExps || [];

      // Enrich with project and document names
      const { data: projects } = await db.from('projects').select('*').eq('tenant_id', tenantId);
      const projectMap = new Map((projects || []).map((p) => [p.id, p]));

      const { data: docs } = await db.from('documents').select('*').eq('tenant_id', tenantId);
      const docMap = new Map((docs || []).map((d) => [d.id, d]));

      const enriched = experiences.map((exp) => {
        const project = projectMap.get(exp.project_id);
        const doc = docMap.get(exp.related_document_id);
        return {
          ...exp,
          project_name: project ? project.name : 'Unknown Project',
          document_title: doc ? doc.title : 'Unknown Document',
        };
      });

      enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return res.json({ success: true, submissions: enriched });
    } catch (err) {
      console.error('ExperienceController.getMySubmissions error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/experiences/admin/approvals
   * Admin-only: View experiences pending approval or review history
   */
  static async getAdminApprovals(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { status = 'PENDING' } = req.query;

      let queryBuilder = db.from('experiences').select('*').eq('tenant_id', tenantId);
      if (status !== 'ALL') {
        queryBuilder = queryBuilder.eq('status', status.toUpperCase());
      }

      const { data: exps } = await queryBuilder;
      const experiences = exps || [];

      // Enrich with project, document, and author info
      const { data: projects } = await db.from('projects').select('*').eq('tenant_id', tenantId);
      const projectMap = new Map((projects || []).map((p) => [p.id, p]));

      const { data: docs } = await db.from('documents').select('*').eq('tenant_id', tenantId);
      const docMap = new Map((docs || []).map((d) => [d.id, d]));

      const enriched = experiences.map((exp) => {
        const project = projectMap.get(exp.project_id);
        const doc = docMap.get(exp.related_document_id);
        return {
          ...exp,
          project_name: project ? project.name : 'Unknown Project',
          document_title: doc ? doc.title : 'Unknown Document',
        };
      });

      enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return res.json({ success: true, experiences: enriched });
    } catch (err) {
      console.error('ExperienceController.getAdminApprovals error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/experiences/:id
   * Get experience detail. Dynamically validates project and document clearance.
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: exp } = await db.from('experiences').select('*').eq('id', id).single();
      if (!exp) {
        return res.status(404).json({ success: false, error: 'Experience not found.' });
      }

      if (exp.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const isAdmin = ['Company Admin', 'Super Admin'].includes(req.user.role_name);
      const isAuthor = exp.author_id === req.user.id;

      // If experience is not approved, only author and admin can view it
      if (exp.status !== 'APPROVED' && !isAdmin && !isAuthor) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: This experience is pending administrator verification.',
        });
      }

      // Check current project membership
      const hasProjectAccess = await ProjectController.checkProjectMembership(req.user, exp.project_id);
      if (!hasProjectAccess && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: You are not authorized to view knowledge for this project.',
        });
      }

      // Check current document access
      const { data: doc } = await db.from('documents').select('*').eq('id', exp.related_document_id).single();
      let documentAccess = { allowed: false, reason: 'Document not found' };
      let documentData = null;

      if (doc) {
        documentAccess = PolicyEngine.canAccess(req.user, doc);
        if (documentAccess.allowed || isAdmin) {
          documentData = {
            id: doc.id,
            title: doc.title,
            source_type: doc.source_type,
            classification: doc.classification,
            content: doc.content,
            owner: doc.owner,
            updated_at: doc.updated_at,
          };
        }
      }

      // Fetch project
      const { data: project } = await db.from('projects').select('*').eq('id', exp.project_id).single();

      return res.json({
        success: true,
        experience: {
          ...exp,
          project_name: project ? project.name : 'Unknown Project',
          document_title: doc ? doc.title : 'Unknown Document',
          can_access_document: documentAccess.allowed,
          document_access_reason: documentAccess.reason,
          document: documentData,
        },
      });
    } catch (err) {
      console.error('ExperienceController.getById error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/experiences/:id/approve
   * Admin only: Verify and approve an experience for public viewing
   */
  static async approve(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: exp } = await db.from('experiences').select('*').eq('id', id).single();
      if (!exp) {
        return res.status(404).json({ success: false, error: 'Experience not found.' });
      }

      if (exp.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const updates = {
        status: 'APPROVED',
        rejection_reason: null,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.from('experiences').update(updates).eq('id', id);

      // Audit log
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'EXPERIENCE_APPROVED',
        resource_type: 'EXPERIENCE',
        resource_id: id,
        decision: 'SUCCESS',
        reason: `Administrator [${req.user.name}] approved experience "${exp.title}". Verified badge granted.`,
        metadata: {
          experienceId: id,
          authorId: exp.author_id,
          title: exp.title,
        },
      });

      return res.json({
        success: true,
        message: `Experience "${exp.title}" approved and verified successfully.`,
      });
    } catch (err) {
      console.error('ExperienceController.approve error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/experiences/:id/reject
   * Admin only: Reject an experience with a required rejection reason
   */
  static async reject(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const tenantId = req.user.tenant_id;

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          error: 'A rejection reason is required to explain what needs improvement.',
        });
      }

      const { data: exp } = await db.from('experiences').select('*').eq('id', id).single();
      if (!exp) {
        return res.status(404).json({ success: false, error: 'Experience not found.' });
      }

      if (exp.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const updates = {
        status: 'REJECTED',
        rejection_reason: reason.trim(),
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.from('experiences').update(updates).eq('id', id);

      // Audit log
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'EXPERIENCE_REJECTED',
        resource_type: 'EXPERIENCE',
        resource_id: id,
        decision: 'DENY',
        reason: `Administrator [${req.user.name}] rejected experience "${exp.title}". Reason: ${reason.trim()}`,
        metadata: {
          experienceId: id,
          authorId: exp.author_id,
          title: exp.title,
          rejectionReason: reason.trim(),
        },
      });

      return res.json({
        success: true,
        message: `Experience rejected with feedback recorded.`,
      });
    } catch (err) {
      console.error('ExperienceController.reject error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/experiences/:id
   * Edit an experience (author can revise rejected or pending experiences)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { title, problem, solution, additional_context } = req.body;
      const tenantId = req.user.tenant_id;

      const { data: exp } = await db.from('experiences').select('*').eq('id', id).single();
      if (!exp) {
        return res.status(404).json({ success: false, error: 'Experience not found.' });
      }

      if (exp.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const isAdmin = ['Company Admin', 'Super Admin'].includes(req.user.role_name);
      if (exp.author_id !== req.user.id && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Forbidden: You can only edit your own submissions.' });
      }

      const updates = {
        updated_at: new Date().toISOString(),
      };
      if (title !== undefined) updates.title = title.trim();
      if (problem !== undefined) updates.problem = problem.trim();
      if (solution !== undefined) updates.solution = solution.trim();
      if (additional_context !== undefined) updates.additional_context = additional_context.trim();

      // If revising a rejected experience, reset status to PENDING for re-approval
      if (exp.status === 'REJECTED') {
        updates.status = 'PENDING';
        updates.rejection_reason = null;
        updates.reviewed_by = null;
        updates.reviewed_at = null;
      }

      await db.from('experiences').update(updates).eq('id', id);

      // Audit log
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'EXPERIENCE_UPDATED',
        resource_type: 'EXPERIENCE',
        resource_id: id,
        decision: 'SUCCESS',
        reason: `Experience [${id}] revised by [${req.user.name}]. Status is now ${updates.status || exp.status}.`,
        metadata: {
          experienceId: id,
          status: updates.status || exp.status,
        },
      });

      return res.json({
        success: true,
        message: 'Experience updated successfully.',
      });
    } catch (err) {
      console.error('ExperienceController.update error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/experiences/:id
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: exp } = await db.from('experiences').select('*').eq('id', id).single();
      if (!exp) return res.status(404).json({ success: false, error: 'Experience not found.' });

      if (exp.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Tenant isolation boundary.' });
      }

      const isAdmin = ['Company Admin', 'Super Admin'].includes(req.user.role_name);
      if (exp.author_id !== req.user.id && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Forbidden: You can only delete your own submissions.' });
      }

      await db.from('experiences').delete().eq('id', id);

      return res.json({ success: true, message: 'Experience deleted.' });
    } catch (err) {
      console.error('ExperienceController.delete error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/experiences/ai-assist
   * AI drafting assistant: takes user's rough notes and structures them into Problem, Solution, Lessons Learned.
   * Grounded ONLY in the authorized document/project context.
   */
  static async aiAssist(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { notes, projectId, documentId } = req.body;

      if (!notes || !notes.trim()) {
        return res.status(400).json({ success: false, error: 'Please provide some notes or a draft to structure.' });
      }

      // Verify project authorization
      if (projectId) {
        const hasProj = await ProjectController.checkProjectMembership(req.user, projectId);
        if (!hasProj) {
          return res.status(403).json({ success: false, error: 'Unauthorized project.' });
        }
      }

      // Verify document authorization
      let docContext = '';
      if (documentId) {
        const { data: doc } = await db.from('documents').select('*').eq('id', documentId).single();
        if (doc && doc.tenant_id === tenantId) {
          const docAccess = PolicyEngine.canAccess(req.user, doc);
          if (docAccess.allowed) {
            docContext = `Related Document: ${doc.title}\n${doc.content ? doc.content.slice(0, 1500) : ''}`;
          }
        }
      }

      const systemPrompt = `You are CompanyBrain's Engineering Knowledge Assistant.
Transform the employee's rough experience notes into a structured, professional knowledge submission.
Return ONLY valid JSON with the exact keys:
{
  "title": "Concise, descriptive title (e.g. How we solved API timeout issues)",
  "problem": "Clear statement of the problem and its impact",
  "solution": "Step-by-step technical solution applied",
  "additional_context": "Lessons learned, caveats, or monitoring recommendations"
}`;

      const userPrompt = `Employee's raw notes:
"""
${notes.trim()}
"""
${docContext ? `\nAuthorized Document Context:\n${docContext}` : ''}

Format these notes into the structured JSON object:`;

      try {
        const geminiRes = await aiService._callGemini({
          systemPrompt,
          userPrompt,
          temperature: 0.3,
          maxTokens: 800,
        });

        const text = geminiRes.answer || '';
        // Extract JSON from output
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({ success: true, structured: parsed });
        }
      } catch (aiErr) {
        console.warn('AI assist fallback triggered:', aiErr.message);
      }

      // Clean local heuristic fallback
      const sentences = notes.split(/(?<=[.?!])\s+/);
      const fallbackTitle = sentences[0] ? sentences[0].slice(0, 70).replace(/[.?!]$/, '') : 'Team Technical Solution';
      const fallbackProblem = sentences.slice(0, Math.ceil(sentences.length / 2)).join(' ');
      const fallbackSolution = sentences.slice(Math.ceil(sentences.length / 2)).join(' ') || notes;

      return res.json({
        success: true,
        structured: {
          title: fallbackTitle,
          problem: fallbackProblem,
          solution: fallbackSolution,
          additional_context: 'Documented team learnings.',
        },
      });
    } catch (err) {
      console.error('ExperienceController.aiAssist error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
