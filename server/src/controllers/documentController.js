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
        const isSeedDoc = doc.id.startsWith('f1111111-') || doc.id.startsWith('f2222222-') || doc.id.startsWith('f3333333-') || doc.is_demo === true;
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

      await db.from('documents').delete().eq('id', id).eq('tenant_id', tenantId);
      return res.json({ success: true, message: 'Document deleted from knowledge base.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
