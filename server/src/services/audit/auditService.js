import { db } from '../../database/db.js';
import crypto from 'crypto';

export class AuditService {
  /**
   * Record a security or system audit event.
   *
   * @param {Object} entry
   * @param {string} entry.tenant_id
   * @param {string} entry.user_id
   * @param {string} entry.user_name
   * @param {string} entry.action - RAG_QUERY, AUTH_LOGIN, CONNECTOR_SYNC, DOCUMENT_VIEW, POLICY_CHANGE, TENANT_SWITCH
   * @param {string} entry.resource_type - KNOWLEDGE_SEARCH, CONNECTOR, DOCUMENT, POLICY, TENANT
   * @param {string} entry.resource_id - Optional ID or title of target
   * @param {string} entry.decision - ALLOW, DENY, INFO, SUCCESS, FAILED
   * @param {string} entry.reason - Human-readable justification of the decision
   * @param {Object} entry.metadata - Query details, tokens, doc counts, etc.
   */
  static async logEvent({
    tenant_id,
    user_id = null,
    user_name = 'System',
    action,
    resource_type = 'KNOWLEDGE_SEARCH',
    resource_id = null,
    decision,
    reason = '',
    metadata = {},
  }) {
    const event = {
      id: crypto.randomUUID(),
      tenant_id,
      user_id,
      user_name,
      action,
      resource_type,
      resource_id,
      decision,
      reason,
      metadata,
      created_at: new Date().toISOString(),
    };

    try {
      await db.from('audit_logs').insert(event);
      console.log(`[AUDIT] [${decision}] action=${action} user=${user_name} tenant=${tenant_id}: ${reason}`);
      return event;
    } catch (err) {
      console.error('AuditService error logging event:', err);
      return null;
    }
  }

  /**
   * Retrieve audit logs with tenant filtering and search criteria
   */
  static async getLogs({
    tenant_id,
    user_id = null,
    decision = null,
    action = null,
    limit = 50,
  }) {
    let query = db.from('audit_logs').select('*');

    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (decision && decision !== 'ALL') {
      query = query.eq('decision', decision);
    }

    if (action && action !== 'ALL') {
      query = query.eq('action', action);
    }

    const res = await query.order('created_at', { ascending: false }).limit(limit);
    return res.data || [];
  }
}
