import { db } from '../database/db.js';
import { PolicyEngine } from '../services/policy/policyEngine.js';
import crypto from 'crypto';

export class PolicyController {
  static async getAll(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { data: policies } = await db.from('policies').select('*').eq('tenant_id', tenantId);
      return res.json({ success: true, policies: policies || [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { name, description, rules } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Policy name is required.' });
      }

      const newPolicy = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        name,
        description: description || '',
        rules: rules || {},
        enabled: true,
        created_at: new Date().toISOString(),
      };

      await db.from('policies').insert(newPolicy);
      return res.status(201).json({ success: true, policy: newPolicy });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      const { name, description, rules, enabled } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (rules !== undefined) updates.rules = rules;
      if (enabled !== undefined) updates.enabled = enabled;

      await db.from('policies').update(updates).eq('id', id).eq('tenant_id', tenantId);
      return res.json({ success: true, message: 'Policy updated successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Interactive Policy Simulator: test canAccess with custom inputs
   */
  static async simulate(req, res) {
    try {
      const { mockUser, mockDocument } = req.body;
      const evaluation = PolicyEngine.canAccess(mockUser || req.user, mockDocument);
      return res.json({ success: true, evaluation });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
