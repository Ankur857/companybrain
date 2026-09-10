import { AuditService } from '../services/audit/auditService.js';

export class AuditController {
  static async getLogs(req, res) {
    try {
      const { user_id, decision, action, limit } = req.query;
      // Normal users only see their tenant logs. Super Admins can filter or see all.
      const tenantId = req.user.role_name === 'Super Admin' ? (req.query.tenant_id || req.user.tenant_id) : req.user.tenant_id;

      const logs = await AuditService.getLogs({
        tenant_id: tenantId,
        user_id,
        decision,
        action,
        limit: limit ? parseInt(limit, 10) : 100,
      });

      return res.json({ success: true, logs });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
