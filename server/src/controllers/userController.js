import { db } from '../database/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class UserController {
  static async getAll(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { data: users } = await db.from('users').select('*').eq('tenant_id', tenantId);
      const { data: roles } = await db.from('roles').select('*');
      const { data: userGroups } = await db.from('user_groups').select('*');
      const { data: groups } = await db.from('groups').select('*').eq('tenant_id', tenantId);

      const roleMap = Object.fromEntries((roles || []).map((r) => [r.id, r.name]));
      const groupMap = Object.fromEntries((groups || []).map((g) => [g.id, g]));

      const enhancedUsers = (users || []).map((u) => {
        const uGrpIds = (userGroups || []).filter((ug) => ug.user_id === u.id).map((ug) => ug.group_id);
        const assignedGroups = uGrpIds.map((id) => groupMap[id]).filter(Boolean);

        return {
          id: u.id,
          tenant_id: u.tenant_id,
          name: u.name,
          email: u.email,
          department: u.department,
          status: u.status,
          role_id: u.role_id,
          role_name: roleMap[u.role_id] || 'Employee',
          access_groups: assignedGroups,
          created_at: u.created_at,
        };
      });

      return res.json({ success: true, users: enhancedUsers });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const { name, email, password, role_id, department, group_ids } = req.body;
      const tenantId = req.user.tenant_id;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
      }

      // Check if email already exists
      const { data: existing } = await db.from('users').select('id').eq('email', email.toLowerCase().trim()).single();
      if (existing) {
        return res.status(400).json({ success: false, error: 'User with this email already exists.' });
      }

      const newUserId = crypto.randomUUID();
      const newUser = {
        id: newUserId,
        tenant_id: tenantId,
        name,
        email: email.toLowerCase().trim(),
        password_hash: bcrypt.hashSync(password, 10),
        role_id: role_id || db.SEED_IDS.ROLE_EMPLOYEE,
        department: department || 'General',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      };

      await db.from('users').insert(newUser);

      // Assign groups
      if (Array.isArray(group_ids) && group_ids.length > 0) {
        for (const gId of group_ids) {
          await db.from('user_groups').insert({ user_id: newUserId, group_id: gId });
        }
      }

      return res.status(201).json({
        success: true,
        user: { id: newUserId, name, email, department, role_id },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenant_id;

      // Verify user belongs to tenant
      const { data: user } = await db.from('users').select('*').eq('id', id).eq('tenant_id', tenantId).single();
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found in this company tenant.' });
      }

      const { name, role_id, department, status, group_ids } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (role_id) updates.role_id = role_id;
      if (department) updates.department = department;
      if (status) updates.status = status;

      if (Object.keys(updates).length > 0) {
        await db.from('users').update(updates).eq('id', id);
      }

      // Update groups if provided
      if (Array.isArray(group_ids)) {
        await db.from('user_groups').delete().eq('user_id', id);
        for (const gId of group_ids) {
          await db.from('user_groups').insert({ user_id: id, group_id: gId });
        }
      }

      return res.json({ success: true, message: 'User updated successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
