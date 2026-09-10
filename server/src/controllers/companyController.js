import { db } from '../database/db.js';
import crypto from 'crypto';

export class CompanyController {
  static async getAll(req, res) {
    try {
      const { data: tenants } = await db.from('tenants').select('*');
      const { data: users } = await db.from('users').select('id, tenant_id');
      const { data: connectors } = await db.from('connectors').select('id, tenant_id');
      const { data: documents } = await db.from('documents').select('id, tenant_id');
      const { data: groups } = await db.from('groups').select('id, tenant_id');

      const enhancedTenants = (tenants || []).map((t) => {
        const uCount = (users || []).filter((u) => u.tenant_id === t.id).length;
        const cCount = (connectors || []).filter((c) => c.tenant_id === t.id).length;
        const dCount = (documents || []).filter((d) => d.tenant_id === t.id).length;
        const gCount = (groups || []).filter((g) => g.tenant_id === t.id).length;

        return {
          ...t,
          usersCount: uCount,
          connectorsCount: cCount,
          documentsCount: dCount,
          groupsCount: gCount,
          isCurrentTenant: req.user?.tenant_id === t.id,
        };
      });

      return res.json({ success: true, companies: enhancedTenants });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const { data: tenant } = await db.from('tenants').select('*').eq('id', id).single();
      if (!tenant) {
        return res.status(404).json({ success: false, error: 'Company tenant not found.' });
      }

      // Security check: non-super-admins can only view their own tenant
      if (req.user.role_name !== 'Super Admin' && req.user.tenant_id !== id) {
        return res.status(403).json({ success: false, error: 'Access denied: Tenant isolation violation.' });
      }

      const { data: users } = await db.from('users').select('*').eq('tenant_id', id);
      const { data: connectors } = await db.from('connectors').select('*').eq('tenant_id', id);
      const { data: documents } = await db.from('documents').select('*').eq('tenant_id', id);
      const { data: groups } = await db.from('groups').select('*').eq('tenant_id', id);
      const { data: policies } = await db.from('policies').select('*').eq('tenant_id', id);

      return res.json({
        success: true,
        company: {
          ...tenant,
          users: (users || []).map((u) => ({ id: u.id, name: u.name, email: u.email, department: u.department, status: u.status })),
          connectors,
          documents: (documents || []).map((d) => ({ id: d.id, title: d.title, classification: d.classification, department: d.department, project: d.project })),
          groups,
          policies,
          counts: {
            users: (users || []).length,
            connectors: (connectors || []).length,
            documents: (documents || []).length,
            groups: (groups || []).length,
          },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req, res) {
    try {
      if (req.user.role_name !== 'Super Admin') {
        return res.status(403).json({ success: false, error: 'Only Super Admins can provision new tenants.' });
      }

      const { name, slug, description } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ success: false, error: 'Name and slug are required.' });
      }

      const newTenant = {
        id: crypto.randomUUID(),
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        description: description || '',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      };

      await db.from('tenants').insert(newTenant);
      return res.status(201).json({ success: true, company: newTenant });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      if (req.user.role_name !== 'Super Admin' && req.user.tenant_id !== id) {
        return res.status(403).json({ success: false, error: 'Unauthorized to update this company tenant.' });
      }

      const { name, description, status } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (status) updates.status = status;

      await db.from('tenants').update(updates).eq('id', id);
      const { data: updated } = await db.from('tenants').select('*').eq('id', id).single();
      return res.json({ success: true, company: updated });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
