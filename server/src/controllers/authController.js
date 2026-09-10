import { AuthService } from '../services/auth/authService.js';
import { db } from '../database/db.js';

export class AuthController {
  static async login(req, res) {
    try {
      const { email, password, tenantId } = req.body;
      const result = await AuthService.login({ email, password, requestedTenantId: tenantId });
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async me(req, res) {
    try {
      const { data: tenant } = await db.from('tenants').select('*').eq('id', req.user.tenant_id).single();
      return res.json({
        success: true,
        user: req.user,
        tenant,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async switchTenant(req, res) {
    try {
      const { tenantId } = req.body;
      const result = await AuthService.switchTenant(req.user, tenantId);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(403).json({ success: false, error: err.message });
    }
  }

  static async logout(req, res) {
    return res.json({ success: true, message: 'Logged out successfully.' });
  }

  // Helper endpoint for the UI: list demo quick-login personas
  static async getDemoPersonas(req, res) {
    try {
      const { data: users } = await db.from('users').select('*');
      const { data: tenants } = await db.from('tenants').select('*');
      const { data: roles } = await db.from('roles').select('*');
      const { data: userGroups } = await db.from('user_groups').select('*');
      const { data: groups } = await db.from('groups').select('*');

      const tenantMap = Object.fromEntries((tenants || []).map((t) => [t.id, t.name]));
      const roleMap = Object.fromEntries((roles || []).map((r) => [r.id, r.name]));
      const groupMap = Object.fromEntries((groups || []).map((g) => [g.id, g.name]));

      const personas = (users || []).map((u) => {
        const uGrpIds = (userGroups || []).filter((ug) => ug.user_id === u.id).map((ug) => ug.group_id);
        const groupNames = uGrpIds.map((id) => groupMap[id]).filter(Boolean);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          company: tenantMap[u.tenant_id] || 'Unknown',
          tenant_id: u.tenant_id,
          role: roleMap[u.role_id] || 'Employee',
          department: u.department,
          groups: groupNames,
          password: 'Password123!',
        };
      });

      return res.json({ success: true, personas });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
