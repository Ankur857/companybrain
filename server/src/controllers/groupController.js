import { db } from '../database/db.js';
import crypto from 'crypto';

export class GroupController {
  static async getAll(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const { data: groups } = await db.from('groups').select('*').eq('tenant_id', tenantId);
      const { data: userGroups } = await db.from('user_groups').select('*');
      const { data: users } = await db.from('users').select('id, name, email, department').eq('tenant_id', tenantId);

      const userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

      const enhancedGroups = (groups || []).map((g) => {
        const memberIds = (userGroups || []).filter((ug) => ug.group_id === g.id).map((ug) => ug.user_id);
        const members = memberIds.map((id) => userMap[id]).filter(Boolean);

        return {
          ...g,
          membersCount: members.length,
          members,
        };
      });

      return res.json({ success: true, groups: enhancedGroups });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const { name, description } = req.body;
      const tenantId = req.user.tenant_id;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Group name is required.' });
      }

      const newGroup = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        name,
        description: description || '',
        created_at: new Date().toISOString(),
      };

      await db.from('groups').insert(newGroup);
      return res.status(201).json({ success: true, group: newGroup });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async addMember(req, res) {
    try {
      const { id: groupId } = req.params;
      const { userId } = req.body;
      const tenantId = req.user.tenant_id;

      // Verify group belongs to tenant
      const { data: grp } = await db.from('groups').select('id').eq('id', groupId).eq('tenant_id', tenantId).single();
      if (!grp) {
        return res.status(404).json({ success: false, error: 'Group not found.' });
      }

      // Verify user belongs to tenant
      const { data: usr } = await db.from('users').select('id').eq('id', userId).eq('tenant_id', tenantId).single();
      if (!usr) {
        return res.status(404).json({ success: false, error: 'User not found in this company.' });
      }

      // Check if already mapped
      const { data: existing } = await db.from('user_groups').select('*').eq('user_id', userId).eq('group_id', groupId).single();
      if (!existing) {
        await db.from('user_groups').insert({ user_id: userId, group_id: groupId });
      }

      return res.json({ success: true, message: 'Member added to access group.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async removeMember(req, res) {
    try {
      const { id: groupId, userId } = req.params;
      await db.from('user_groups').delete().eq('user_id', userId).eq('group_id', groupId);
      return res.json({ success: true, message: 'Member removed from access group.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
