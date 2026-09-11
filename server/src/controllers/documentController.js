import { db } from '../database/db.js';
import { PolicyEngine } from '../services/policy/policyEngine.js';
import { AuditService } from '../services/audit/auditService.js';
import crypto from 'crypto';

export class DocumentController {
  static async getAll(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { data: documents } = await db.from('documents').select('*').eq('tenant_id', tenantId);
      const { data: groups } = await db.from('groups').select('*').eq('tenant_id', tenantId);

      const groupMap = Object.fromEntries((groups || []).map((g) => [g.id, g.name]));

      // Show ONLY documents that were genuinely added / synced / uploaded
      const includeDemo = req.query.includeDemo === 'true';
      const actualDocs = (documents || []).filter((doc) => {
        if (includeDemo) return true;
        const isSeedDoc =
          doc.id.startsWith('f1111111-') ||
          doc.id.startsWith('f2222222-') ||
          doc.id.startsWith('f3333333-') ||
          doc.is_demo === true ||
          doc.is_mock === true ||
          doc.title?.includes('Executive & Employee Salary') ||
          doc.title?.includes('Corporate Employee Benefits') ||
          doc.title?.includes('Engineering Headcount and Strategic Hiring');
        return !isSeedDoc;
      });

      // Pre-evaluate user access status for each document for clean UI indicators
      const enhancedDocs = actualDocs.map((doc) => {
        const decision = PolicyEngine.canAccess(req.user, doc);
        const reqGroupNames = (doc.required_groups || []).map((id) => groupMap[id] || id);

        return {
          id: doc.id,
          title: doc.title,
          source_type: doc.source_type,
          source_url: doc.source_url,
          department: doc.department,
          project: doc.project,
          classification: doc.classification,
          owner: doc.owner,
          version: doc.version,
          required_groups: reqGroupNames,
          required_group_ids: doc.required_groups || [],
          metadata: doc.metadata || {},
          canAccess: decision.allowed,
          accessReason: decision.reason,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        };
      });

      return res.json({ success: true, documents: enhancedDocs });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: document } = await db.from('documents').select('*').eq('id', id).single();
      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found.' });
      }

      // 1. TENANT CHECK
      if (document.tenant_id !== tenantId && req.user.role_name !== 'Super Admin') {
        await AuditService.logEvent({
          tenant_id: tenantId,
          user_id: req.user.id,
          user_name: req.user.name,
          action: 'DOCUMENT_VIEW',
          resource_type: 'DOCUMENT',
          resource_id: id,
          decision: 'DENY',
          reason: `Tenant isolation violation: User tried to view document from tenant [${document.tenant_id}].`,
        });
        return res.status(403).json({ success: false, error: 'Access denied: Tenant isolation violation.' });
      }

      // 2. POLICY ENGINE EVALUATION
      const decision = PolicyEngine.canAccess(req.user, document);
      if (!decision.allowed) {
        await AuditService.logEvent({
          tenant_id: tenantId,
          user_id: req.user.id,
          user_name: req.user.name,
          action: 'DOCUMENT_VIEW',
          resource_type: 'DOCUMENT',
          resource_id: document.title,
          decision: 'DENY',
          reason: decision.reason,
          metadata: { classification: document.classification, required_groups: document.required_groups },
        });

        return res.status(403).json({
          success: false,
          error: `Access Denied: ${decision.reason}`,
          policy: decision.policy,
          classification: document.classification,
        });
      }

      // Log allowed document view
      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'DOCUMENT_VIEW',
        resource_type: 'DOCUMENT',
        resource_id: document.title,
        decision: 'ALLOW',
        reason: 'Authorized document preview opened.',
      });

      return res.json({ success: true, document });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { title, content, department, project, classification, required_groups, source_type, source_url } = req.body;

      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Title and content are required.' });
      }

      const newDoc = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        title,
        content,
        department: department || 'General',
        project: project || 'Core',
        classification: classification || 'INTERNAL',
        source_type: source_type || 'manual_entry',
        source_url: source_url || '',
        owner: req.user.email,
        version: '1.0',
        required_groups: Array.isArray(required_groups) ? required_groups : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.from('documents').insert(newDoc);
      return res.status(201).json({ success: true, document: newDoc });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: existing } = await db.from('documents').select('*').eq('id', id).eq('tenant_id', tenantId).single();
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Document not found.' });
      }

      const { title, content, department, project, classification, required_groups, allowed_user_ids, metadata } = req.body;
      const updates = { updated_at: new Date().toISOString() };
      if (title) updates.title = title;
      if (content) updates.content = content;
      if (department) updates.department = department;
      if (project) updates.project = project;
      if (classification) updates.classification = classification;
      if (Array.isArray(required_groups)) updates.required_groups = required_groups;
      if (Array.isArray(allowed_user_ids) || metadata) {
        updates.metadata = {
          ...(existing.metadata || {}),
          ...(metadata || {}),
          ...(Array.isArray(allowed_user_ids) ? { allowed_user_ids } : {}),
        };
      }

      await db.from('documents').update(updates).eq('id', id);

      // Auto-associate document with project knowledge so granted files are immediately visible in Project Understanding
      if (Array.isArray(allowed_user_ids) && allowed_user_ids.length > 0) {
        const { data: userMemberships } = await db
          .from('project_members')
          .select('project_id')
          .in('user_id', allowed_user_ids);

        const targetProjectIds = new Set((userMemberships || []).map((m) => m.project_id));
        if (targetProjectIds.size === 0) {
          const { data: tenantProjects } = await db
            .from('projects')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('status', 'ACTIVE');
          (tenantProjects || []).forEach((p) => targetProjectIds.add(p.id));
        }

        for (const pId of targetProjectIds) {
          const { data: existingPk } = await db
            .from('project_knowledge')
            .select('*')
            .eq('project_id', pId)
            .eq('document_id', id)
            .single();

          if (!existingPk) {
            await db.from('project_knowledge').insert({
              project_id: pId,
              document_id: id,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'ACCESS_GRANTED',
        resource_type: 'DOCUMENT',
        resource_id: existing.title,
        decision: 'SUCCESS',
        reason: `Updated access governance rules for document [${existing.title}].`,
        metadata: {
          classification: updates.classification || existing.classification,
          required_groups: updates.required_groups || existing.required_groups,
          allowed_user_ids: updates.metadata?.allowed_user_ids,
        },
      });

      return res.json({ success: true, message: 'Document access rules updated successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: doc } = await db.from('documents').select('*').eq('id', id).eq('tenant_id', tenantId).single();
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Document not found.' });
      }

      await db.from('documents').delete().eq('id', id).eq('tenant_id', tenantId);
      await db.from('project_knowledge').delete().eq('document_id', id);

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'DOCUMENT_DELETED',
        resource_type: 'DOCUMENT',
        resource_id: doc.title,
        decision: 'SUCCESS',
        reason: `Administrator permanently deleted document [${doc.title}] from knowledge base.`,
      });

      return res.json({ success: true, message: `Document "${doc.title}" deleted successfully.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteFolder(req, res) {
    try {
      const { folderName } = req.params;
      const tenantId = req.user.tenant_id;

      const { data: allDocs } = await db.from('documents').select('*').eq('tenant_id', tenantId);
      const toDelete = (allDocs || []).filter((d) => {
        if (d.metadata?.folderName === folderName) return true;
        if (d.title && d.title.startsWith(`[${folderName}]`)) return true;
        return false;
      });

      if (toDelete.length === 0) {
        return res.status(404).json({ success: false, error: `Folder "${folderName}" not found.` });
      }

      for (const d of toDelete) {
        await db.from('documents').delete().eq('id', d.id).eq('tenant_id', tenantId);
        await db.from('project_knowledge').delete().eq('document_id', d.id);
      }

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'FOLDER_DELETED',
        resource_type: 'FOLDER',
        resource_id: folderName,
        decision: 'SUCCESS',
        reason: `Administrator permanently deleted folder [${folderName}] and ${toDelete.length} child documents.`,
      });

      return res.json({
        success: true,
        message: `Successfully deleted folder "${folderName}" and all ${toDelete.length} document(s).`,
        deletedCount: toDelete.length,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateFolderAccess(req, res) {
    try {
      const { folderName } = req.params;
      const tenantId = req.user.tenant_id;
      const { classification, required_groups, allowed_user_ids } = req.body;

      const { data: allDocs } = await db.from('documents').select('*').eq('tenant_id', tenantId);
      const targetDocs = (allDocs || []).filter((d) => {
        if (d.metadata?.folderName === folderName) return true;
        if (d.title && d.title.startsWith(`[${folderName}]`)) return true;
        return false;
      });

      if (targetDocs.length === 0) {
        return res.status(404).json({ success: false, error: `Folder "${folderName}" not found.` });
      }

      const updates = { updated_at: new Date().toISOString() };
      if (classification) updates.classification = classification;
      if (Array.isArray(required_groups)) updates.required_groups = required_groups;

      for (const doc of targetDocs) {
        const docUpdates = { ...updates };
        if (Array.isArray(allowed_user_ids)) {
          docUpdates.metadata = {
            ...(doc.metadata || {}),
            allowed_user_ids,
          };
        }
        await db.from('documents').update(docUpdates).eq('id', doc.id);
      }

      // Auto-associate folder documents with project knowledge
      if (Array.isArray(allowed_user_ids) && allowed_user_ids.length > 0) {
        const { data: userMemberships } = await db
          .from('project_members')
          .select('project_id')
          .in('user_id', allowed_user_ids);

        const targetProjectIds = new Set((userMemberships || []).map((m) => m.project_id));
        if (targetProjectIds.size === 0) {
          const { data: tenantProjects } = await db
            .from('projects')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('status', 'ACTIVE');
          (tenantProjects || []).forEach((p) => targetProjectIds.add(p.id));
        }

        for (const doc of targetDocs) {
          for (const pId of targetProjectIds) {
            const { data: existingPk } = await db
              .from('project_knowledge')
              .select('*')
              .eq('project_id', pId)
              .eq('document_id', doc.id)
              .single();

            if (!existingPk) {
              await db.from('project_knowledge').insert({
                project_id: pId,
                document_id: doc.id,
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      }

      await AuditService.logEvent({
        tenant_id: tenantId,
        user_id: req.user.id,
        user_name: req.user.name,
        action: 'ACCESS_GRANTED',
        resource_type: 'FOLDER',
        resource_id: folderName,
        decision: 'SUCCESS',
        reason: `Administrator updated access governance for folder [${folderName}] across ${targetDocs.length} documents.`,
        metadata: { classification, required_groups, allowed_user_ids },
      });

      return res.json({
        success: true,
        message: `Updated access permissions for all ${targetDocs.length} files in folder "${folderName}".`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
